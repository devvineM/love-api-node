import type { Request, Response } from "express";

import { AppError } from "../../shared/errors/app-error.ts";
import { validateSchema } from "../../shared/http/validation/validate-schema.ts";
import type {
  AdminUpdateUserInputModel,
  UpdateMyPasswordInputModel,
  UpdateMyProfileInputModel,
  UserListQueryModel
} from "./user.model.ts";
import {
  listUsersSchema,
  updateMyPasswordSchema,
  updateMyProfileSchema,
  updateUserParamsSchema,
  updateUserSchema
} from "./user.schema.ts";
import { UserService } from "./user.service.ts";

export class UserController {
  constructor(private readonly userService: UserService) {}

  list = async (request: Request, response: Response) => {
    const query = await validateSchema<UserListQueryModel>(
      listUsersSchema,
      request.query
    );
    const result = await this.userService.list(query, {
      level: request.auth?.level || null
    });

    response.status(200).json(result);
  };

  lookups = async (request: Request, response: Response) => {
    const result = await this.userService.getLookups({
      level: request.auth?.level || null
    });

    response.status(200).json(result);
  };

  me = async (request: Request, response: Response) => {
    if (!request.auth?.userId) {
      throw new AppError("Usuário autenticado não identificado.", 401);
    }

    const result = await this.userService.getMyProfile(request.auth.userId);

    response.status(200).json(result);
  };

  updateMe = async (request: Request, response: Response) => {
    if (!request.auth?.userId) {
      throw new AppError("Usuário autenticado não identificado.", 401);
    }

    const body = await validateSchema<UpdateMyProfileInputModel>(
      updateMyProfileSchema,
      request.body
    );
    const result = await this.userService.updateMyProfile(
      request.auth.userId,
      body
    );

    response.status(200).json(result);
  };

  updateMyPassword = async (request: Request, response: Response) => {
    if (!request.auth?.userId) {
      throw new AppError("Usuário autenticado não identificado.", 401);
    }

    const body = await validateSchema<UpdateMyPasswordInputModel>(
      updateMyPasswordSchema,
      request.body
    );
    await this.userService.updateMyPassword(request.auth.userId, body);

    response.status(204).send();
  };

  updateByAdmin = async (request: Request, response: Response) => {
    const params = await validateSchema<{ id: number }>(
      updateUserParamsSchema,
      request.params
    );
    const body = await validateSchema<AdminUpdateUserInputModel>(
      updateUserSchema,
      request.body
    );

    const result = await this.userService.updateByAdmin(params.id, body, {
      level: request.auth?.level || null
    });

    response.status(200).json(result);
  };

  dismissByAdmin = async (request: Request, response: Response) => {
    const params = await validateSchema<{ id: number }>(
      updateUserParamsSchema,
      request.params
    );

    await this.userService.dismissByAdmin(params.id, {
      userId: request.auth?.userId || null,
      level: request.auth?.level || null
    });

    response.status(204).send();
  };

  updateMyAvatar = async (request: Request, response: Response) => {
    if (!request.auth?.userId) {
      throw new AppError("Usuário autenticado não identificado.", 401);
    }

    const result = await this.userService.updateAvatar(
      request.auth.userId,
      request.file
    );

    response.status(200).json(result);
  };
}
