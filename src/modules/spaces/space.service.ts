import { AppError } from "../../shared/errors/app-error.ts";
import type {
  CreateSpaceInputModel,
  SpaceItemModel,
  SpaceListQueryModel,
  SpaceListResponseModel,
  UpdateSpaceInputModel
} from "./space.model.ts";
import { SpaceRepository } from "./space.repository.ts";

export class SpaceService {
  constructor(private readonly spaceRepository: SpaceRepository) {}

  async list(input: SpaceListQueryModel): Promise<SpaceListResponseModel> {
    const search = input.search?.trim() || "";
    const { items, total } = await this.spaceRepository.list({
      page: input.page,
      perPage: input.perPage,
      search: search || undefined
    });

    return {
      data: items.map((item: {
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
      }) => this.serialize(item)),
      meta: {
        page: input.page,
        per_page: input.perPage,
        total,
        total_pages: Math.max(1, Math.ceil(total / input.perPage)),
        search
      }
    };
  }

  async create(
    userId: number,
    input: CreateSpaceInputModel
  ): Promise<SpaceItemModel> {
    const normalizedSpace = this.normalizeCreate(input);
    const creator = await this.spaceRepository.findUserById(userId);

    if (!creator) {
      throw new AppError("UsuÃ¡rio criador nÃ£o encontrado.", 404);
    }

    const existingSpace = await this.spaceRepository.findBySpaceTitle(
      normalizedSpace.spaceTitle
    );

    if (existingSpace) {
      throw new AppError("Ja existe um espaco com esse nome.", 409);
    }

    const space = await this.spaceRepository.create({
      ...normalizedSpace,
      userId
    });

    return this.serialize(space);
  }

  async update(id: number, input: UpdateSpaceInputModel): Promise<SpaceItemModel> {
    const currentSpace = await this.spaceRepository.findById(id);

    if (!currentSpace) {
      throw new AppError("EspaÃ§o nÃ£o encontrado.", 404);
    }

    const normalizedSpace = this.normalizeUpdate(input);
    const existingSpace = await this.spaceRepository.findBySpaceTitle(
      normalizedSpace.spaceTitle
    );

    if (existingSpace && existingSpace.id !== id) {
      throw new AppError("Ja existe um espaco com esse nome.", 409);
    }

    const updatedSpace = await this.spaceRepository.update(id, normalizedSpace);

    return this.serialize(updatedSpace);
  }

  async delete(id: number): Promise<void> {
    const currentSpace = await this.spaceRepository.findById(id);

    if (!currentSpace) {
      throw new AppError("EspaÃ§o nÃ£o encontrado.", 404);
    }

    await this.spaceRepository.delete(id);
  }

  private normalizeCreate(input: CreateSpaceInputModel) {
    return {
      spaceTitle: input.spaceTitle.trim().replace(/\s+/g, " "),
      color: input.color.trim().toUpperCase(),
      active: input.active
    };
  }

  private normalizeUpdate(input: UpdateSpaceInputModel) {
    return {
      spaceTitle: input.spaceTitle.trim().replace(/\s+/g, " "),
      color: input.color.trim().toUpperCase(),
      active: input.active
    };
  }

  private serialize(space: {
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
  }): SpaceItemModel {
    const firstName = space.user.fullName.trim().split(/\s+/)[0] || "UsuÃ¡rio";
    const initial = firstName.charAt(0).toUpperCase() || "U";

    return {
      id: space.id,
      user_id: space.userId,
      created_by: {
        first_name: firstName,
        avatar_url: space.user.avatar
          ? `/uploads/avatars/${space.user.avatar}`
          : null,
        initial
      },
      space_title: space.spaceTitle,
      color: space.color,
      active: space.active,
      created_at: space.createdAt,
      updated_at: space.updatedAt
    };
  }
}
