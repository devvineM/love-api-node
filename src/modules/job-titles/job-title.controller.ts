import type { Request, Response } from "express";

import { validateSchema } from "../../shared/http/validation/validate-schema.ts";
import type {
  JobTitleInputModel,
  JobTitleListQueryModel,
  JobTitleParamsModel
} from "./job-title.model.ts";
import {
  createJobTitleSchema,
  jobTitleParamsSchema,
  listJobTitlesSchema,
  updateJobTitleSchema
} from "./job-title.schema.ts";
import { JobTitleService } from "./job-title.service.ts";

export class JobTitleController {
  constructor(private readonly jobTitleService: JobTitleService) {}

  list = async (request: Request, response: Response) => {
    const query = await validateSchema<JobTitleListQueryModel>(
      listJobTitlesSchema,
      request.query
    );
    const result = await this.jobTitleService.list(query);

    response.status(200).json(result);
  };

  create = async (request: Request, response: Response) => {
    const payload = await validateSchema<JobTitleInputModel>(
      createJobTitleSchema,
      request.body
    );
    const result = await this.jobTitleService.create(payload);

    response.status(201).json(result);
  };

  update = async (request: Request, response: Response) => {
    const params = await validateSchema<JobTitleParamsModel>(
      jobTitleParamsSchema,
      request.params
    );
    const payload = await validateSchema<JobTitleInputModel>(
      updateJobTitleSchema,
      request.body
    );
    const result = await this.jobTitleService.update(params.id, payload);

    response.status(200).json(result);
  };

  delete = async (request: Request, response: Response) => {
    const params = await validateSchema<JobTitleParamsModel>(
      jobTitleParamsSchema,
      request.params
    );

    await this.jobTitleService.delete(params.id);

    response.status(204).send();
  };
}
