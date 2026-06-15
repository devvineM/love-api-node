import type { Request, Response } from "express";

import { AppError } from "../../shared/errors/app-error.ts";
import { validateSchema } from "../../shared/http/validation/validate-schema.ts";
import type {
  CreateTaskInputModel,
  TaskListQueryModel,
  UpdateTaskInputModel
} from "./task.model.ts";
import {
  createTaskSchema,
  listTasksSchema,
  updateTaskSchema
} from "./task.schema.ts";
import { TaskService } from "./task.service.ts";

export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  list = async (request: Request, response: Response) => {
    const query = await validateSchema<TaskListQueryModel>(
      listTasksSchema,
      request.query
    );
    const result = await this.taskService.list(query);

    response.status(200).json(result);
  };

  listMine = async (request: Request, response: Response) => {
    if (!request.auth?.userId) {
      throw new AppError("UsuÃ¡rio autenticado nÃ£o identificado.", 401);
    }

    const query = await validateSchema<TaskListQueryModel>(
      listTasksSchema,
      request.query
    );
    const result = await this.taskService.list({
      ...query,
      assigneeId: request.auth.userId
    });

    response.status(200).json(result);
  };

  lookups = async (_request: Request, response: Response) => {
    const result = await this.taskService.getLookups();

    response.status(200).json(result);
  };

  create = async (request: Request, response: Response) => {
    const payload = await validateSchema<CreateTaskInputModel>(
      createTaskSchema,
      request.body
    );
    const result = await this.taskService.create(payload);

    response.status(201).json(result);
  };

  update = async (request: Request, response: Response) => {
    const id = Number(request.params.id);
    const payload = await validateSchema<UpdateTaskInputModel>(
      updateTaskSchema,
      request.body
    );
    const result = await this.taskService.updateWithActor(id, payload, {
      userId: request.auth?.userId || 0,
      level: request.auth?.level || null
    });

    response.status(200).json(result);
  };

  uploadImages = async (request: Request, response: Response) => {
    const id = Number(request.params.id);
    const files = Array.isArray(request.files)
      ? (request.files as Express.Multer.File[])
      : [];
    const result = await this.taskService.uploadImages(id, files);

    response.status(200).json(result);
  };

  deleteImage = async (request: Request, response: Response) => {
    const taskId = Number(request.params.id);
    const imageId = Number(request.params.imageId);
    const result = await this.taskService.deleteImage(taskId, imageId);

    response.status(200).json(result);
  };

  delete = async (request: Request, response: Response) => {
    const id = Number(request.params.id);
    await this.taskService.delete(id);

    response.status(204).send();
  };
}
