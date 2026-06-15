import { Router } from "express";

import { authenticate } from "../../shared/http/middlewares/authenticate.ts";
import { uploadAvatar } from "../../shared/http/middlewares/upload-avatar.ts";
import { UserController } from "./user.controller.ts";
import { UserRepository } from "./user.repository.ts";
import { UserService } from "./user.service.ts";

const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

export const userRouter = Router();

userRouter.get("/", authenticate, userController.list);
userRouter.get("/lookups", authenticate, userController.lookups);
userRouter.get("/me", authenticate, userController.me);
userRouter.patch("/me", authenticate, userController.updateMe);
userRouter.patch("/me/password", authenticate, userController.updateMyPassword);
userRouter.patch(
  "/me/avatar",
  authenticate,
  uploadAvatar.single("avatar"),
  userController.updateMyAvatar
);
userRouter.patch("/:id", authenticate, userController.updateByAdmin);
