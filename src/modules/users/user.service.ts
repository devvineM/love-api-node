import { compare, hash } from "bcryptjs";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import sharp from "sharp";

import { AppError } from "../../shared/errors/app-error.ts";
import type {
  AdminUpdateUserInputModel,
  AdminUpdateUserResponseModel,
  MyProfileResponseModel,
  UpdateAvatarResultModel,
  UpdateMyPasswordInputModel,
  UpdateMyProfileInputModel,
  UserListQueryModel,
  UserListResponseModel,
  UserLookupsResponseModel
} from "./user.model.ts";
import { UserRepository } from "./user.repository.ts";

const avatarQuality = 70;
const avatarUploadDirectory = path.resolve(process.cwd(), "uploads", "avatars");
const taskUploadDirectory = path.resolve(process.cwd(), "uploads", "tasks");

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async list(
    input: UserListQueryModel,
    actor: { level: string | null } | null
  ): Promise<UserListResponseModel> {
    this.ensureAdmin(actor?.level);

    const search = input.search?.trim() || "";
    const { items, total, activeCount, withJobTitleCount } =
      await this.userRepository.list({
        ...input,
        search: search || undefined
      });

    return {
      data: items.map((user: {
        id: number;
        fullName: string;
        avatar: string | null;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        level: {
          description: string;
        };
        jobTitle: {
          jobTitle: string;
        } | null;
      }) => {
        const firstName = user.fullName.trim().split(/\s+/)[0] || "Usuário";

        return {
          id: user.id,
          full_name: user.fullName,
          first_name: firstName,
          avatar_url: user.avatar ? `/uploads/avatars/${user.avatar}` : null,
          active: user.active,
          level_title: user.level.description,
          job_title: user.jobTitle?.jobTitle || null,
          created_at: user.createdAt,
          updated_at: user.updatedAt
        };
      }),
      meta: {
        page: input.page,
        per_page: input.perPage,
        total,
        total_pages: Math.max(1, Math.ceil(total / input.perPage)),
        search
      },
      overview: {
        total,
        active: activeCount,
        inactive: total - activeCount,
        with_job_title: withJobTitleCount
      }
    };
  }

  async getLookups(
    actor: { level: string | null } | null
  ): Promise<UserLookupsResponseModel> {
    this.ensureAdmin(actor?.level);

    const { jobTitles } = await this.userRepository.listLookups();

    return {
      job_titles: jobTitles.map((jobTitle: {
        id: number;
        jobTitle: string;
      }) => ({
        id: jobTitle.id,
        job_title: jobTitle.jobTitle
      }))
    };
  }

  async getMyProfile(userId: number): Promise<MyProfileResponseModel> {
    const user = await this.userRepository.findProfileById(userId);

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    return this.serializeProfile(user);
  }

  async updateAvatar(
    userId: number,
    file: Express.Multer.File | undefined
  ): Promise<UpdateAvatarResultModel> {
    if (!file) {
      throw new AppError("Arquivo de avatar nao enviado.", 400);
    }

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    await mkdir(avatarUploadDirectory, {
      recursive: true
    });

    const extension = this.resolveExtension(file.mimetype);
    const avatarFileName = `${randomUUID()}.${extension}`;
    const avatarFilePath = path.join(avatarUploadDirectory, avatarFileName);

    if (extension === "png") {
      await sharp(file.buffer).png({
        quality: avatarQuality
      }).toFile(avatarFilePath);
    } else if (extension === "gif") {
      await sharp(file.buffer, { animated: true }).gif({
        effort: 7,
        colours: 128
      }).toFile(avatarFilePath);
    } else {
      await sharp(file.buffer).jpeg({
        quality: avatarQuality
      }).toFile(avatarFilePath);
    }

    if (user.avatar) {
      const previousAvatarPath = path.join(avatarUploadDirectory, user.avatar);

      try {
        await unlink(previousAvatarPath);
      } catch {
        // Ignora ausencia do arquivo antigo para nao impedir a atualizacao.
      }
    }

    await this.userRepository.updateAvatar(userId, avatarFileName);

    return {
      avatar: avatarFileName,
      avatar_url: `/uploads/avatars/${avatarFileName}`
    };
  }

  async updateMyProfile(
    userId: number,
    input: UpdateMyProfileInputModel
  ): Promise<MyProfileResponseModel> {
    const user = await this.userRepository.findProfileById(userId);

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    const updatedUser = await this.userRepository.updateMyProfile(userId, {
      fullName: input.fullName.trim(),
      bio: input.bio,
      theme: input.theme
    });

    return this.serializeProfile(updatedUser);
  }

  async updateMyPassword(
    userId: number,
    input: UpdateMyPasswordInputModel
  ) {
    const user = await this.userRepository.findProfileById(userId);

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    const passwordMatches = await compare(
      input.currentPassword,
      user.passwordHash
    );

    if (!passwordMatches) {
      throw new AppError("A senha atual informada esta incorreta.", 400);
    }

    if (input.currentPassword === input.newPassword) {
      throw new AppError("Escolha uma nova senha diferente da atual.", 400);
    }

    const passwordHash = await hash(input.newPassword, 12);

    await this.userRepository.updatePassword(userId, passwordHash);
  }

  async updateByAdmin(
    userId: number,
    input: AdminUpdateUserInputModel,
    actor: { level: string | null } | null
  ): Promise<AdminUpdateUserResponseModel> {
    this.ensureAdmin(actor?.level);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    const updatedUser = await this.userRepository.updateAdminUser(userId, {
      jobTitleId: input.jobTitleId
    });

    const firstName = updatedUser.fullName.trim().split(/\s+/)[0] || "Usuário";

    return {
      id: updatedUser.id,
      full_name: updatedUser.fullName,
      first_name: firstName,
      avatar_url: updatedUser.avatar
        ? `/uploads/avatars/${updatedUser.avatar}`
        : null,
      active: updatedUser.active,
      level_title: updatedUser.level.description,
      job_title: updatedUser.jobTitle?.jobTitle || null,
      created_at: updatedUser.createdAt,
      updated_at: updatedUser.updatedAt
    };
  }

  async dismissByAdmin(
    userId: number,
    actor: { userId: number | null; level: string | null } | null
  ) {
    this.ensureAdmin(actor?.level);

    if (!actor?.userId) {
      throw new AppError("Usuário autenticado não identificado.", 401);
    }

    if (actor.userId === userId) {
      throw new AppError("Você não pode demitir a própria conta.", 400);
    }

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    const result = await this.userRepository.dismissByAdmin(userId, actor.userId);

    if (!result) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    if (result.avatarFileName) {
      try {
        await unlink(path.join(avatarUploadDirectory, result.avatarFileName));
      } catch {
        // Ignora ausencia do arquivo para nao impedir a demissao.
      }
    }

    await Promise.all(
      result.taskImageFileNames.map(async (fileName) => {
        try {
          await unlink(path.join(taskUploadDirectory, fileName));
        } catch {
          // Ignora ausencia do arquivo para nao impedir a demissao.
        }
      })
    );
  }

  private resolveExtension(mimeType: string) {
    if (mimeType === "image/png") {
      return "png";
    }

    if (mimeType === "image/gif") {
      return "gif";
    }

    return "jpg";
  }

  private serializeProfile(user: {
    id: number;
    fullName: string;
    username: string;
    avatar: string | null;
    bio: string | null;
    theme: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    level: { description: string };
    jobTitle: { jobTitle: string } | null;
  }): MyProfileResponseModel {
    return {
      id: user.id,
      full_name: user.fullName,
      user: user.username,
      avatar_url: user.avatar ? `/uploads/avatars/${user.avatar}` : null,
      bio: user.bio,
      theme: user.theme,
      active: user.active,
      level_title: user.level.description,
      job_title: user.jobTitle?.jobTitle || null,
      created_at: user.createdAt,
      updated_at: user.updatedAt
    };
  }

  private ensureAdmin(level: string | null | undefined) {
    if (level?.toLowerCase() !== "admin") {
      throw new AppError("Essa area e exclusiva para administradores.", 403);
    }
  }
}
