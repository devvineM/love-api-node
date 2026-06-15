import { prisma } from "../../lib/prisma.ts";

interface ListJobTitlesRepositoryParams {
  page: number;
  perPage: number;
  search?: string;
}

export class JobTitleRepository {
  async list({ page, perPage, search }: ListJobTitlesRepositoryParams) {
    const where = search
      ? {
          jobTitle: {
            contains: search
          }
        }
      : undefined;

    const [items, total] = await Promise.all([
      prisma.jobTitle.findMany({
        where,
        orderBy: {
          createdAt: "desc"
        },
        skip: (page - 1) * perPage,
        take: perPage
      }),
      prisma.jobTitle.count({ where })
    ]);

    return {
      items,
      total
    };
  }

  async findById(id: number) {
    return prisma.jobTitle.findUnique({
      where: {
        id
      },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });
  }

  async findByJobTitle(jobTitle: string) {
    return prisma.jobTitle.findFirst({
      where: {
        jobTitle
      }
    });
  }

  async create(jobTitle: string) {
    return prisma.jobTitle.create({
      data: {
        jobTitle
      }
    });
  }

  async update(id: number, jobTitle: string) {
    return prisma.jobTitle.update({
      where: {
        id
      },
      data: {
        jobTitle
      }
    });
  }

  async delete(id: number) {
    return prisma.jobTitle.delete({
      where: {
        id
      }
    });
  }
}
