import { Router } from "express";

import { authenticate } from "../../shared/http/middlewares/authenticate.ts";
import { SpaceController } from "./space.controller.ts";
import { SpaceRepository } from "./space.repository.ts";
import { SpaceService } from "./space.service.ts";

const spaceRepository = new SpaceRepository();
const spaceService = new SpaceService(spaceRepository);
const spaceController = new SpaceController(spaceService);

export const spaceRouter = Router();

spaceRouter.get("/", authenticate, spaceController.list);
spaceRouter.post("/", authenticate, spaceController.create);
spaceRouter.patch("/:id", authenticate, spaceController.update);
spaceRouter.delete("/:id", authenticate, spaceController.delete);
