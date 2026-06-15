import { AppError } from "../../shared/errors/app-error.ts";
import type {
  JobTitleInputModel,
  JobTitleItemModel,
  JobTitleListQueryModel,
  JobTitleListResponseModel
} from "./job-title.model.ts";
import { JobTitleRepository } from "./job-title.repository.ts";

export class JobTitleService {
  constructor(private readonly jobTitleRepository: JobTitleRepository) {}

  async list(
    input: JobTitleListQueryModel
  ): Promise<JobTitleListResponseModel> {
    const search = input.search?.trim() || "";
    const { items, total } = await this.jobTitleRepository.list({
      page: input.page,
      perPage: input.perPage,
      search: search || undefined
    });

    return {
      data: items.map((item: {
        id: number;
        jobTitle: string;
        createdAt: Date;
        updatedAt: Date;
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

  async create(input: JobTitleInputModel): Promise<JobTitleItemModel> {
    const normalizedJobTitle = this.normalizeJobTitle(input.jobTitle);
    const existingJobTitle = await this.jobTitleRepository.findByJobTitle(
      normalizedJobTitle
    );

    if (existingJobTitle) {
      throw new AppError("Ja existe um cargo com esse nome.", 409);
    }

    const jobTitle = await this.jobTitleRepository.create(normalizedJobTitle);

    return this.serialize(jobTitle);
  }

  async update(
    id: number,
    input: JobTitleInputModel
  ): Promise<JobTitleItemModel> {
    const currentJobTitle = await this.jobTitleRepository.findById(id);

    if (!currentJobTitle) {
      throw new AppError("Cargo nÃ£o encontrado.", 404);
    }

    const normalizedJobTitle = this.normalizeJobTitle(input.jobTitle);
    const existingJobTitle = await this.jobTitleRepository.findByJobTitle(
      normalizedJobTitle
    );

    if (existingJobTitle && existingJobTitle.id !== id) {
      throw new AppError("Ja existe um cargo com esse nome.", 409);
    }

    const updatedJobTitle = await this.jobTitleRepository.update(
      id,
      normalizedJobTitle
    );

    return this.serialize(updatedJobTitle);
  }

  async delete(id: number): Promise<void> {
    const currentJobTitle = await this.jobTitleRepository.findById(id);

    if (!currentJobTitle) {
      throw new AppError("Cargo nÃ£o encontrado.", 404);
    }

    if (currentJobTitle._count.users > 0) {
      throw new AppError(
        "Este cargo esta vinculado a colaboradores e nao pode ser removido.",
        409
      );
    }

    await this.jobTitleRepository.delete(id);
  }

  private normalizeJobTitle(jobTitle: string) {
    return jobTitle.trim().replace(/\s+/g, " ");
  }

  private serialize(jobTitle: {
    id: number;
    jobTitle: string;
    createdAt: Date;
    updatedAt: Date;
  }): JobTitleItemModel {
    return {
      id: jobTitle.id,
      job_title: jobTitle.jobTitle,
      created_at: jobTitle.createdAt,
      updated_at: jobTitle.updatedAt
    };
  }
}
