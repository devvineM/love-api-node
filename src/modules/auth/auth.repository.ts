import { prisma } from "../../lib/prisma.ts";
import { systemLevels } from "../../shared/config/system-levels.ts";

export class AuthRepository {
  async findUserById(id: number) {
    return prisma.user.findUnique({
      where: {
        id
      },
      include: {
        level: true,
        jobTitle: true
      }
    });
  }

  async findUserByUsername(username: string) {
    return prisma.user.findUnique({
      where: {
        username
      },
      include: {
        level: true,
        jobTitle: true
      }
    });
  }

  async createUser(data: {
    fullName: string;
    username: string;
    passwordHash: string;
    levelId: number;
    jobTitleId: number | null;
    active: boolean;
  }) {
    return prisma.user.create({
      data,
      include: {
        level: true,
        jobTitle: true
      }
    });
  }

  async ensureDefaultLevel() {
    return prisma.level.upsert({
      where: {
        level: "user"
      },
      update: {
        description:
          systemLevels.find((item) => item.level === "user")?.description ||
          "Colaborador"
      },
      create: {
        level: "user",
        description:
          systemLevels.find((item) => item.level === "user")?.description ||
          "Colaborador"
      }
    });
  }

  async findJobTitleById(id: number) {
    return prisma.jobTitle.findUnique({
      where: {
        id
      }
    });
  }

  async findAvailableAccountCode(code: string) {
    return prisma.accountAuthorizationCode.findFirst({
      where: {
        code,
        usedAt: null
      },
      include: {
        jobTitle: true
      }
    });
  }

  async findActiveAccountCodeByValue(code: string) {
    return prisma.accountAuthorizationCode.findFirst({
      where: {
        code,
        usedAt: null,
        expiresAt: {
          gt: new Date()
        }
      }
    });
  }

  async createAccountAuthorizationCode(data: {
    code: string;
    jobTitleId: number;
    createdById: number;
    expiresAt: Date;
  }) {
    return prisma.accountAuthorizationCode.create({
      data,
      include: {
        jobTitle: true
      }
    });
  }

  async markAccountCodeAsUsed(id: string) {
    return prisma.accountAuthorizationCode.update({
      where: {
        id
      },
      data: {
        usedAt: new Date()
      }
    });
  }

  async createRefreshToken(data: {
    tokenHash: string;
    userId: number;
    expiresAt: Date;
  }) {
    return prisma.refreshToken.create({
      data
    });
  }

  async findRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: {
        tokenHash
      },
      include: {
        user: {
          include: {
            level: true,
            jobTitle: true
          }
        }
      }
    });
  }

  async revokeRefreshToken(id: string) {
    return prisma.refreshToken.update({
      where: {
        id
      },
      data: {
        revokedAt: new Date()
      }
    });
  }
}
