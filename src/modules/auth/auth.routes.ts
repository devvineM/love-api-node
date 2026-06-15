import { Router } from "express";

import { authenticate } from "../../shared/http/middlewares/authenticate.ts";
import { AuthController } from "./auth.controller.ts";
import { AuthRepository } from "./auth.repository.ts";
import { AuthService } from "./auth.service.ts";

const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

export const authRouter = Router();

authRouter.get("/settings", authController.settings);
authRouter.get("/me", authenticate, authController.me);
authRouter.post(
  "/account-codes",
  authenticate,
  authController.generateAccountCode
);
authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/refresh", authController.refresh);
