import { Router } from "express";

import { JobTitleController } from "./job-title.controller.ts";
import { JobTitleRepository } from "./job-title.repository.ts";
import { JobTitleService } from "./job-title.service.ts";

const jobTitleRepository = new JobTitleRepository();
const jobTitleService = new JobTitleService(jobTitleRepository);
const jobTitleController = new JobTitleController(jobTitleService);

export const jobTitleRouter = Router();

jobTitleRouter.get("/", jobTitleController.list);
jobTitleRouter.post("/", jobTitleController.create);
jobTitleRouter.patch("/:id", jobTitleController.update);
jobTitleRouter.delete("/:id", jobTitleController.delete);
