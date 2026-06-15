import { prisma } from "../../lib/prisma.ts";

interface ListSpacesRepositoryParams {
  page: number;
  perPage: number;
  search?: string;
}

interface SpaceRecord {
  id: number;
  userId: number;
  spaceTitle: string;
  color: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: {
    fullName: string;
    avatar: string | null;
  };
}

const spaceClient = prisma as typeof prisma & {
  space: {
    findMany(args: unknown): Promise<SpaceRecord[]>;
    count(args: unknown): Promise<number>;
    findUnique(args: unknown): Promise<SpaceRecord | null>;
    findFirst(args: unknown): Promise<SpaceRecord | null>;
    create(args: unknown): Promise<SpaceRecord>;
    update(args: unknown): Promise<SpaceRecord>;
    delete(args: unknown): Promise<SpaceRecord>;
  };
  user: {
    findUnique(args: unknown): Promise<{ id: number } | null>;
  };
};

export class SpaceRepository {
  async list(
    { page, perPage, search }: ListSpacesRepositoryParams
  ): Promise<{ items: SpaceRecord[]; total: number }> {
    const where = search
      ? {
          spaceTitle: {
            contains: search
          }
        }
      : undefined;

    const [items, total] = await Promise.all([
      spaceClient.space.findMany({
        where,
        include: {
          user: {
            select: {
              fullName: true,
              avatar: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        skip: (page - 1) * perPage,
        take: perPage
      }),
      spaceClient.space.count({ where })
    ]);

    return {
      items: items as SpaceRecord[],
      total
    };
  }

  async findById(id: number): Promise<SpaceRecord | null> {
    return (await spaceClient.space.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            fullName: true,
            avatar: true
          }
        }
      }
    })) as SpaceRecord | null;
  }

  async findBySpaceTitle(spaceTitle: string): Promise<SpaceRecord | null> {
    return (await spaceClient.space.findFirst({
      where: {
        spaceTitle
      },
      include: {
        user: {
          select: {
            fullName: true,
            avatar: true
          }
        }
      }
    })) as SpaceRecord | null;
  }

  async findUserById(userId: number) {
    return spaceClient.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });
  }

  async create(data: {
    userId: number;
    spaceTitle: string;
    color: string;
    active: boolean;
  }): Promise<SpaceRecord> {
    return (await spaceClient.space.create({
      data,
      include: {
        user: {
          select: {
            fullName: true,
            avatar: true
          }
        }
      }
    })) as SpaceRecord;
  }

  async update(
    id: number,
    data: { spaceTitle: string; color: string; active: boolean }
  ): Promise<SpaceRecord> {
    return (await spaceClient.space.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            fullName: true,
            avatar: true
          }
        }
      }
    })) as SpaceRecord;
  }

  async delete(id: number): Promise<SpaceRecord> {
    return (await spaceClient.space.delete({
      where: { id },
      include: {
        user: {
          select: {
            fullName: true,
            avatar: true
          }
        }
      }
    })) as SpaceRecord;
  }
}
