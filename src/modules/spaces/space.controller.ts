import type { Request, Response } from "express";

import { AppError } from "../../shared/errors/app-error.ts";
import { validateSchema } from "../../shared/http/validation/validate-schema.ts";
import type {
  CreateSpaceInputModel,
  SpaceListQueryModel,
  SpaceParamsModel,
  UpdateSpaceInputModel
} from "./space.model.ts";
import {
  createSpaceSchema,
  listSpacesSchema,
  spaceParamsSchema,
  updateSpaceSchema
} from "./space.schema.ts";
import { SpaceService } from "./space.service.ts";

export class SpaceController {
  constructor(private readonly spaceService: SpaceService) {}

  list = async (request: Request, response: Response) => {
    const query = await validateSchema<SpaceListQueryModel>(
      listSpacesSchema,
      request.query
    );
    const result = await this.spaceService.list(query);

    response.status(200).json(result);
  };

  create = async (request: Request, response: Response) => {
    if (!request.auth?.userId) {
      throw new AppError("UsuÃ¡rio autenticado nÃ£o identificado.", 401);
    }

    const payload = await validateSchema<CreateSpaceInputModel>(
      createSpaceSchema,
      request.body
    );
    const result = await this.spaceService.create(request.auth.userId, payload);

    response.status(201).json(result);
  };

  update = async (request: Request, response: Response) => {
    const params = await validateSchema<SpaceParamsModel>(
      spaceParamsSchema,
      request.params
    );
    const payload = await validateSchema<UpdateSpaceInputModel>(
      updateSpaceSchema,
      request.body
    );
    const result = await this.spaceService.update(params.id, payload);

    response.status(200).json(result);
  };

  delete = async (request: Request, response: Response) => {
    const params = await validateSchema<SpaceParamsModel>(
      spaceParamsSchema,
      request.params
    );

    await this.spaceService.delete(params.id);

    response.status(204).send();
  };
}
