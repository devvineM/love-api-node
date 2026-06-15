import { Router } from "express";

import { authenticate } from "../../shared/http/middlewares/authenticate.ts";
import { uploadTaskImages } from "../../shared/http/middlewares/upload-task-images.ts";
import { TaskController } from "./task.controller.ts";
import { TaskRepository } from "./task.repository.ts";
import { TaskService } from "./task.service.ts";

const taskRepository = new TaskRepository();
const taskService = new TaskService(taskRepository);
const taskController = new TaskController(taskService);

export const taskRouter = Router();

taskRouter.get("/", authenticate, taskController.list);
taskRouter.get("/mine", authenticate, taskController.listMine);
taskRouter.get("/lookups", authenticate, taskController.lookups);
taskRouter.post("/", authenticate, taskController.create);
taskRouter.post(
  "/:id/images",
  authenticate,
  uploadTaskImages.array("images", 10),
  taskController.uploadImages
);
taskRouter.delete("/:id/images/:imageId", authenticate, taskController.deleteImage);
taskRouter.patch("/:id", authenticate, taskController.update);
taskRouter.delete("/:id", authenticate, taskController.delete);
