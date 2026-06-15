import { prisma } from "../../lib/prisma.ts";
import type { TaskStatusModel, TaskTypeModel } from "./task.model.ts";

interface ListTasksRepositoryParams {
  page: number;
  perPage: number;
  search?: string;
  status?: TaskStatusModel;
  type?: TaskTypeModel;
  spaceId?: number;
  assigneeId?: number;
  active?: boolean;
}

interface TaskRecord {
  id: number;
  assigneeId: number;
  spaceId: number;
  type: TaskTypeModel;
  taskTitle: string;
  description: string;
  status: TaskStatusModel;
  active: boolean;
  isReviewed: boolean;
  createdAt: Date;
  updatedAt: Date;
  assignee: {
    id: number;
    fullName: string;
    avatar: string | null;
  };
  taskMembers: Array<{
    user: {
      id: number;
      fullName: string;
      avatar: string | null;
    };
  }>;
  taskImages: Array<{
    id: number;
    fileName: string;
    createdAt: Date;
  }>;
  space: {
    spaceTitle: string;
    color: string;
  };
}

const taskClient = prisma as typeof prisma & {
  task: {
    findMany(args: unknown): Promise<TaskRecord[]>;
    findUnique(args: unknown): Promise<TaskRecord | null>;
    count(args: unknown): Promise<number>;
    groupBy(
      args: unknown
    ): Promise<Array<{ status: TaskStatusModel; _count: { status: number } }>>;
    create(args: unknown): Promise<TaskRecord>;
    update(args: unknown): Promise<TaskRecord>;
    delete(args: unknown): Promise<TaskRecord>;
  };
  user: {
    findUnique(args: unknown): Promise<{ id: number } | null>;
    findMany(
      args: unknown
    ): Promise<Array<{ id: number; fullName: string; avatar: string | null; active: boolean }>>;
  };
  space: {
    findUnique(args: unknown): Promise<{ id: number; active: boolean } | null>;
    findMany(
      args: unknown
    ): Promise<Array<{ id: number; spaceTitle: string; color: string; active: boolean }>>;
  };
  taskImage: {
    createMany(args: unknown): Promise<{ count: number }>;
    findFirst(args: unknown): Promise<{
      id: number;
      taskId: number;
      fileName: string;
    } | null>;
    delete(args: unknown): Promise<{
      id: number;
      taskId: number;
      fileName: string;
    }>;
  };
};

const taskInclude = {
  assignee: {
    select: {
      id: true,
      fullName: true,
      avatar: true
    }
  },
  taskMembers: {
    select: {
      user: {
        select: {
          id: true,
          fullName: true,
          avatar: true
        }
      }
    }
  },
  taskImages: {
    select: {
      id: true,
      fileName: true,
      createdAt: true
    },
    orderBy: {
      createdAt: "asc"
    }
  },
  space: {
    select: {
      spaceTitle: true,
      color: true
    }
  }
};

export class TaskRepository {
  async list(params: ListTasksRepositoryParams) {
    const where = this.buildWhere(params);

    const [items, total, activeCount, reviewedCount, groupedStatuses] =
      await Promise.all([
        taskClient.task.findMany({
          where,
          include: taskInclude,
          orderBy: {
            updatedAt: "desc"
          },
          skip: (params.page - 1) * params.perPage,
          take: params.perPage
        }),
        taskClient.task.count({ where }),
        taskClient.task.count({
          where: {
            ...where,
            active: true
          }
        }),
        taskClient.task.count({
          where: {
            ...where,
            isReviewed: true
          }
        }),
        taskClient.task.groupBy({
          by: ["status"],
          where,
          _count: {
            status: true
          }
        })
      ]);

    return {
      items,
      total,
      activeCount,
      reviewedCount,
      groupedStatuses
    };
  }

  async findAssigneeById(id: number) {
    return taskClient.user.findUnique({
      where: { id },
      select: { id: true }
    });
  }

  async findSpaceById(id: number) {
    return taskClient.space.findUnique({
      where: { id },
      select: { id: true, active: true }
    });
  }

  async create(data: {
    assigneeId: number;
    assigneeIds: number[];
    spaceId: number;
    type: TaskTypeModel;
    taskTitle: string;
    description: string;
    status: TaskStatusModel;
    active: boolean;
    isReviewed: boolean;
  }) {
    return taskClient.task.create({
      data: {
        assigneeId: data.assigneeId,
        spaceId: data.spaceId,
        type: data.type,
        taskTitle: data.taskTitle,
        description: data.description,
        status: data.status,
        active: data.active,
        isReviewed: data.isReviewed,
        taskMembers: {
          create: data.assigneeIds.map((userId) => ({
            userId
          }))
        }
      },
      include: taskInclude
    });
  }

  async findById(id: number) {
    return taskClient.task.findUnique({
      where: { id },
      include: taskInclude
    });
  }

  async update(
    id: number,
    data: {
      assigneeId: number;
      assigneeIds: number[];
      spaceId: number;
      type: TaskTypeModel;
      taskTitle: string;
      description: string;
      status: TaskStatusModel;
      active: boolean;
      isReviewed: boolean;
    }
  ) {
    return taskClient.task.update({
      where: { id },
      data: {
        assigneeId: data.assigneeId,
        spaceId: data.spaceId,
        type: data.type,
        taskTitle: data.taskTitle,
        description: data.description,
        status: data.status,
        active: data.active,
        isReviewed: data.isReviewed,
        taskMembers: {
          deleteMany: {},
          create: data.assigneeIds.map((userId) => ({
            userId
          }))
        }
      },
      include: taskInclude
    });
  }

  async delete(id: number) {
    return taskClient.task.delete({
      where: { id },
      include: taskInclude
    });
  }

  async createTaskImages(taskId: number, fileNames: string[]) {
    return taskClient.taskImage.createMany({
      data: fileNames.map((fileName) => ({
        taskId,
        fileName
      }))
    });
  }

  async findTaskImage(taskId: number, imageId: number) {
    return taskClient.taskImage.findFirst({
      where: {
        id: imageId,
        taskId
      },
      select: {
        id: true,
        taskId: true,
        fileName: true
      }
    });
  }

  async deleteTaskImage(imageId: number) {
    return taskClient.taskImage.delete({
      where: {
        id: imageId
      },
      select: {
        id: true,
        taskId: true,
        fileName: true
      }
    });
  }

  async listLookupUsers() {
    return taskClient.user.findMany({
      where: {
        active: true
      },
      select: {
        id: true,
        fullName: true,
        avatar: true,
        active: true
      },
      orderBy: {
        fullName: "asc"
      }
    });
  }

  async listLookupSpaces() {
    return taskClient.space.findMany({
      where: {
        active: true
      },
      select: {
        id: true,
        spaceTitle: true,
        color: true,
        active: true
      },
      orderBy: {
        spaceTitle: "asc"
      }
    });
  }

  private buildWhere(params: ListTasksRepositoryParams) {
    return {
      ...(params.search
        ? {
            OR: [
              {
                taskTitle: {
                  contains: params.search
                }
              },
              {
                description: {
                  contains: params.search
                }
              },
              {
                taskMembers: {
                  some: {
                    user: {
                      fullName: {
                        contains: params.search
                      }
                    }
                  }
                }
              },
              {
                space: {
                  spaceTitle: {
                    contains: params.search
                  }
                }
              }
            ]
          }
        : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.type ? { type: params.type } : {}),
      ...(params.spaceId ? { spaceId: params.spaceId } : {}),
      ...(params.assigneeId
        ? {
            taskMembers: {
              some: {
                userId: params.assigneeId
              }
            }
          }
        : {}),
      ...(typeof params.active === "boolean" ? { active: params.active } : {})
    };
  }
}
