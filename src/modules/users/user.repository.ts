import { prisma } from "../../lib/prisma.ts";

export class UserRepository {
  async list({
    page,
    perPage,
    search,
    jobTitleId,
    active
  }: {
    page: number;
    perPage: number;
    search?: string;
    jobTitleId?: number;
    active?: boolean;
  }) {
    const where = {
      ...(search
        ? {
            OR: [
              {
                fullName: {
                  contains: search
                }
              },
              {
                level: {
                  description: {
                    contains: search
                  }
                }
              },
              {
                jobTitle: {
                  jobTitle: {
                    contains: search
                  }
                }
              }
            ]
          }
        : {}),
      ...(jobTitleId ? { jobTitleId } : {}),
      ...(typeof active === "boolean" ? { active } : {})
    };

    const [items, total, activeCount, withJobTitleCount] =
      await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            fullName: true,
            avatar: true,
            active: true,
            createdAt: true,
            updatedAt: true,
            level: {
              select: {
                description: true
              }
            },
            jobTitle: {
              select: {
                jobTitle: true
              }
            }
          },
          orderBy: {
            fullName: "asc"
          },
          skip: (page - 1) * perPage,
          take: perPage
        }),
        prisma.user.count({ where }),
        prisma.user.count({
          where: {
            ...where,
            active: true
          }
        }),
        prisma.user.count({
          where: {
            ...where,
            jobTitleId: {
              not: null
            }
          }
        })
      ]);

    return {
      items,
      total,
      activeCount,
      withJobTitleCount
    };
  }

  async listLookups() {
    const jobTitles = await prisma.jobTitle.findMany({
      select: {
        id: true,
        jobTitle: true
      },
      orderBy: {
        jobTitle: "asc"
      }
    });

    return {
      jobTitles
    };
  }

  async findById(id: number) {
    return prisma.user.findUnique({
      where: {
        id
      }
    });
  }

  async findProfileById(id: number) {
    return prisma.user.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        avatar: true,
        bio: true,
        theme: true,
        active: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true,
        level: {
          select: {
            description: true
          }
        },
        jobTitle: {
          select: {
            jobTitle: true
          }
        }
      }
    });
  }

  async findByIdForAdmin(id: number) {
    return prisma.user.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        fullName: true,
        avatar: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        level: {
          select: {
            description: true
          }
        },
        jobTitle: {
          select: {
            jobTitle: true
          }
        }
      }
    });
  }

  async updateAdminUser(
    id: number,
    data: {
      jobTitleId: number | null;
    }
  ) {
    return prisma.user.update({
      where: {
        id
      },
      data: {
        jobTitleId: data.jobTitleId
      },
      select: {
        id: true,
        fullName: true,
        avatar: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        level: {
          select: {
            description: true
          }
        },
        jobTitle: {
          select: {
            jobTitle: true
          }
        }
      }
    });
  }

  async updateAvatar(id: number, avatar: string) {
    return prisma.user.update({
      where: {
        id
      },
      data: {
        avatar
      }
    });
  }

  async updateMyProfile(
    id: number,
    data: {
      fullName: string;
      bio: string | null;
      theme: string;
    }
  ) {
    return prisma.user.update({
      where: {
        id
      },
      data: {
        fullName: data.fullName,
        bio: data.bio,
        theme: data.theme
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        avatar: true,
        bio: true,
        theme: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        level: {
          select: {
            description: true
          }
        },
        jobTitle: {
          select: {
            jobTitle: true
          }
        }
      }
    });
  }

  async updatePassword(id: number, passwordHash: string) {
    return prisma.user.update({
      where: {
        id
      },
      data: {
        passwordHash
      }
    });
  }

  async dismissByAdmin(userId: number, actorUserId: number) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: {
          id: userId
        },
        select: {
          id: true,
          avatar: true
        }
      });

      if (!user) {
        return null;
      }

      const [soloTasks, squadTasks] = await Promise.all([
        tx.task.findMany({
          where: {
            assigneeId: userId,
            type: "solo"
          },
          select: {
            id: true,
            taskImages: {
              select: {
                fileName: true
              }
            }
          }
        }),
        tx.task.findMany({
          where: {
            type: "squad",
            taskMembers: {
              some: {
                userId
              }
            }
          },
          select: {
            id: true,
            assigneeId: true,
            taskImages: {
              select: {
                fileName: true
              }
            },
            taskMembers: {
              select: {
                userId: true
              }
            }
          }
        })
      ]);

      const taskImageFileNames = soloTasks.flatMap((task) =>
        task.taskImages.map((image) => image.fileName)
      );
      const taskIdsToDelete = new Set(soloTasks.map((task) => task.id));

      for (const task of squadTasks) {
        const remainingMemberIds = task.taskMembers
          .map((member) => member.userId)
          .filter((memberId) => memberId !== userId);

        if (remainingMemberIds.length === 0) {
          taskIdsToDelete.add(task.id);
          taskImageFileNames.push(
            ...task.taskImages.map((image) => image.fileName)
          );
          continue;
        }

        if (remainingMemberIds.length === 1) {
          await tx.task.update({
            where: {
              id: task.id
            },
            data: {
              type: "solo",
              assigneeId: remainingMemberIds[0],
              taskMembers: {
                deleteMany: {
                  userId
                }
              }
            }
          });
          continue;
        }

        await tx.task.update({
          where: {
            id: task.id
          },
          data: {
            assigneeId:
              task.assigneeId === userId ? remainingMemberIds[0] : task.assigneeId,
            taskMembers: {
              deleteMany: {
                userId
              }
            }
          }
        });
      }

      if (taskIdsToDelete.size > 0) {
        await tx.task.deleteMany({
          where: {
            id: {
              in: [...taskIdsToDelete]
            }
          }
        });
      }

      await tx.space.updateMany({
        where: {
          userId
        },
        data: {
          userId: actorUserId
        }
      });

      await tx.accountAuthorizationCode.deleteMany({
        where: {
          createdById: userId
        }
      });

      await tx.refreshToken.deleteMany({
        where: {
          userId
        }
      });

      await tx.user.delete({
        where: {
          id: userId
        }
      });

      return {
        avatarFileName: user.avatar,
        taskImageFileNames
      };
    });
  }
}
