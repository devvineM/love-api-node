import { randomUUID } from "node:crypto";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { AppError } from "../../shared/errors/app-error.ts";
import type {
  CreateTaskInputModel,
  TaskItemModel,
  TaskListQueryModel,
  TaskListResponseModel,
  TaskLookupsResponseModel,
  UpdateTaskInputModel
} from "./task.model.ts";
import { taskStatuses, taskTypes } from "./task.model.ts";
import { TaskRepository } from "./task.repository.ts";

const taskImageQuality = 70;
const taskImageUploadDirectory = path.resolve(
  process.cwd(),
  "uploads",
  "tasks"
);
const maxTaskImages = 10;

function normalizeTaskStatusValue(status: string) {
  if (status.toLowerCase().startsWith("come")) {
    return "Começou";
  }

  return status;
}

function isUserManagedStatus(status: string) {
  const normalizedStatus = normalizeTaskStatusValue(status);

  return normalizedStatus !== "Aprovada" && normalizedStatus !== "Cancelada";
}

export class TaskService {
  constructor(private readonly taskRepository: TaskRepository) {}

  async list(input: TaskListQueryModel): Promise<TaskListResponseModel> {
    const search = input.search?.trim() || "";
    const normalizedInput = input.status
      ? {
          ...input,
          status: normalizeTaskStatusValue(input.status) as TaskListQueryModel["status"]
        }
      : input;

    const { items, total, activeCount, reviewedCount, groupedStatuses } =
      await this.taskRepository.list({
        ...normalizedInput,
        search: search || undefined
      });

    return {
      data: items.map((item: {
        id: number;
        assigneeId: number;
        spaceId: number;
        type: string;
        taskTitle: string;
        description: string;
        status: string;
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
      }) => this.serialize(item)),
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
        reviewed: reviewedCount,
        by_status: taskStatuses.map((taskStatus) => ({
          status: taskStatus,
          count:
            groupedStatuses.find(
              (item: { status: string; _count: { status: number } }) =>
                item.status === taskStatus
            )?._count.status ||
            0
        }))
      }
    };
  }

  async create(input: CreateTaskInputModel): Promise<TaskItemModel> {
    const normalizedTask = this.normalize(input);
    await this.ensureRelations(normalizedTask.assigneeIds, normalizedTask.spaceId);

    const task = await this.taskRepository.create(normalizedTask);

    return this.serialize(task);
  }

  async update(id: number, input: UpdateTaskInputModel): Promise<TaskItemModel> {
    return this.updateWithActor(id, input, null);
  }

  async updateWithActor(
    id: number,
    input: UpdateTaskInputModel,
    actor: { userId: number; level: string | null } | null
  ): Promise<TaskItemModel> {
    const existingTask = await this.taskRepository.findById(id);

    if (!existingTask) {
      throw new AppError("Tarefa nao encontrada.", 404);
    }

    const normalizedTask = this.normalize(input);

    const actorLevel = actor?.level?.toLowerCase() || "user";
    const isStatusChange =
      normalizeTaskStatusValue(normalizedTask.status) !==
      normalizeTaskStatusValue(existingTask.status);
    const isTaskOwner = Number(actor?.userId) === Number(existingTask.assigneeId);

    if (actorLevel !== "admin" && isStatusChange && !isTaskOwner) {
      throw new AppError(
        "Somente o responsavel pela tarefa pode alterar o status.",
        403
      );
    }

    if (
      actorLevel === "user" &&
      !isUserManagedStatus(existingTask.status) &&
      isStatusChange
    ) {
      throw new AppError(
        "O colaborador responsavel pela tarefa nao pode alterar tasks que ja estejam em um status administrativo.",
        403
      );
    }

    if (actorLevel === "user" && !isUserManagedStatus(normalizedTask.status)) {
      throw new AppError(
        "O colaborador responsavel pela tarefa so pode alterar entre Parada, Começou, Fazendo, Terminando e Pronta.",
        403
      );
    }

    await this.ensureRelations(normalizedTask.assigneeIds, normalizedTask.spaceId);

    const task = await this.taskRepository.update(id, normalizedTask);

    return this.serialize(task);
  }

  async delete(id: number): Promise<void> {
    const existingTask = await this.taskRepository.findById(id);

    if (!existingTask) {
      throw new AppError("Tarefa nao encontrada.", 404);
    }

    await this.taskRepository.delete(id);
  }

  async uploadImages(
    id: number,
    files: Express.Multer.File[] | undefined
  ): Promise<TaskItemModel> {
    const taskFiles = files ?? [];

    if (taskFiles.length === 0) {
      throw new AppError("Envie pelo menos uma imagem para a tarefa.", 400);
    }

    const task = await this.taskRepository.findById(id);

    if (!task) {
      throw new AppError("Tarefa nao encontrada.", 404);
    }

    if (task.taskImages.length + taskFiles.length > maxTaskImages) {
      throw new AppError(
        `Cada tarefa pode ter no maximo ${maxTaskImages} imagens.`,
        409
      );
    }

    await mkdir(taskImageUploadDirectory, {
      recursive: true
    });

    const createdFileNames: string[] = [];

    try {
      for (const file of taskFiles) {
        const extension = this.resolveImageExtension(file.mimetype);
        const fileName = `${randomUUID()}.${extension}`;
        const filePath = path.join(taskImageUploadDirectory, fileName);

        if (extension === "png") {
          await sharp(file.buffer).png({
            quality: taskImageQuality
          }).toFile(filePath);
        } else if (extension === "webp") {
          await sharp(file.buffer).webp({
            quality: taskImageQuality
          }).toFile(filePath);
        } else {
          await sharp(file.buffer).jpeg({
            quality: taskImageQuality
          }).toFile(filePath);
        }

        createdFileNames.push(fileName);
      }

      await this.taskRepository.createTaskImages(id, createdFileNames);
    } catch (error) {
      await Promise.all(
        createdFileNames.map(async (fileName) => {
          try {
            await unlink(path.join(taskImageUploadDirectory, fileName));
          } catch {
            // Ignora falhas de limpeza para nao mascarar o erro principal.
          }
        })
      );

      throw error;
    }

    const updatedTask = await this.taskRepository.findById(id);

    if (!updatedTask) {
      throw new AppError("Tarefa nao encontrada apos o upload.", 404);
    }

    return this.serialize(updatedTask);
  }

  async deleteImage(taskId: number, imageId: number): Promise<TaskItemModel> {
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new AppError("Tarefa nao encontrada.", 404);
    }

    const image = await this.taskRepository.findTaskImage(taskId, imageId);

    if (!image) {
      throw new AppError("Imagem da tarefa nao encontrada.", 404);
    }

    await this.taskRepository.deleteTaskImage(imageId);

    try {
      await unlink(path.join(taskImageUploadDirectory, image.fileName));
    } catch {
      // Ignora ausencia do arquivo fisico para nao impedir a remocao do registro.
    }

    const updatedTask = await this.taskRepository.findById(taskId);

    if (!updatedTask) {
      throw new AppError("Tarefa nao encontrada apos a remocao da imagem.", 404);
    }

    return this.serialize(updatedTask);
  }

  async getLookups(): Promise<TaskLookupsResponseModel> {
    const [users, spaces] = await Promise.all([
      this.taskRepository.listLookupUsers(),
      this.taskRepository.listLookupSpaces()
    ]);

    return {
      users: users.map((user: {
        id: number;
        fullName: string;
        avatar: string | null;
      }) => {
        const firstName = user.fullName.trim().split(/\s+/)[0] || "Usuário";

        return {
          id: user.id,
          full_name: user.fullName,
          first_name: firstName,
          avatar_url: user.avatar ? `/uploads/avatars/${user.avatar}` : null,
          initial: firstName.charAt(0).toUpperCase() || "U"
        };
      }),
      spaces: spaces.map((space: {
        id: number;
        spaceTitle: string;
        color: string;
      }) => ({
        id: space.id,
        space_title: space.spaceTitle,
        color: space.color
      })),
      statuses: [...taskStatuses],
      types: [...taskTypes]
    };
  }

  private normalize(input: CreateTaskInputModel) {
    const normalizedAssigneeIds = Array.from(
      new Set(
        input.assigneeIds
          .map((item: number | string) => Number(item))
          .filter((item) => item > 0)
      )
    );
    const requestedPrimaryAssigneeId = Number(input.assigneeId);
    const assigneeIds =
      normalizedAssigneeIds.length > 0
        ? normalizedAssigneeIds
        : requestedPrimaryAssigneeId > 0
          ? [requestedPrimaryAssigneeId]
          : [];
    const primaryAssigneeId = assigneeIds.includes(requestedPrimaryAssigneeId)
      ? requestedPrimaryAssigneeId
      : assigneeIds[0];

    if (input.type === "solo" && assigneeIds.length !== 1) {
      throw new AppError("Tasks solo precisam de apenas um responsavel.", 422);
    }

    if (input.type === "squad" && assigneeIds.length < 2) {
      throw new AppError("Tasks squad precisam de pelo menos dois responsaveis.", 422);
    }

    if (!primaryAssigneeId) {
      throw new AppError("Defina um responsavel principal valido para a tarefa.", 422);
    }

    return {
      assigneeId: primaryAssigneeId,
      assigneeIds,
      spaceId: input.spaceId,
      type: input.type,
      taskTitle: input.taskTitle.trim().replace(/\s+/g, " "),
      description: input.description.trim(),
      status: normalizeTaskStatusValue(input.status) as CreateTaskInputModel["status"],
      active: input.active,
      isReviewed: input.isReviewed
    };
  }

  private async ensureRelations(assigneeIds: number[], spaceId: number) {
    const [assignees, space] = await Promise.all([
      Promise.all(
        assigneeIds.map((assigneeId) => this.taskRepository.findAssigneeById(assigneeId))
      ),
      this.taskRepository.findSpaceById(spaceId)
    ]);

    if (assignees.some((assignee: { id: number } | null) => !assignee)) {
      throw new AppError("Responsável não encontrado.", 404);
    }

    if (!space) {
      throw new AppError("Espaço não encontrado.", 404);
    }

    if (!space.active) {
      throw new AppError("O espaco selecionado esta inativo.", 409);
    }
  }

  private serialize(task: {
    id: number;
    assigneeId: number;
    spaceId: number;
    type: string;
    taskTitle: string;
    description: string;
    status: string;
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
  }): TaskItemModel {
    const serializeAssignee = (assignee: {
      id: number;
      fullName: string;
      avatar: string | null;
    }) => {
      const firstName = assignee.fullName.trim().split(/\s+/)[0] || "Usuário";

      return {
        id: assignee.id,
        full_name: assignee.fullName,
        first_name: firstName,
        avatar_url: assignee.avatar ? `/uploads/avatars/${assignee.avatar}` : null,
        initial: firstName.charAt(0).toUpperCase() || "U"
      };
    };

    const assignees = task.taskMembers.map((member) => serializeAssignee(member.user));

    return {
      id: task.id,
      assignee_id: task.assigneeId,
      assignee: serializeAssignee(task.assignee),
      assignees,
      images: task.taskImages.map((image) => ({
        id: image.id,
        file_name: image.fileName,
        image_url: `/uploads/tasks/${image.fileName}`,
        created_at: image.createdAt
      })),
      space_id: task.spaceId,
      space: {
        space_title: task.space.spaceTitle,
        color: task.space.color
      },
      type: task.type as TaskItemModel["type"],
      task_title: task.taskTitle,
      description: task.description,
      status: normalizeTaskStatusValue(task.status) as TaskItemModel["status"],
      active: task.active,
      is_reviewed: task.isReviewed,
      created_at: task.createdAt,
      updated_at: task.updatedAt
    };
  }

  private resolveImageExtension(mimeType: string) {
    if (mimeType === "image/png") {
      return "png";
    }

    if (mimeType === "image/webp") {
      return "webp";
    }

    return "jpg";
  }
}
