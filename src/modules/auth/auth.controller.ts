import type { Request, Response } from "express";

import { validateSchema } from "../../shared/http/validation/validate-schema.ts";
import type {
  GenerateAccountCodeInputModel,
  LoginInputModel,
  RefreshSessionInputModel,
  RegisterUserInputModel
} from "./auth.model.ts";
import {
  generateAccountCodeSchema,
  getRegisterUserSchema,
  loginSchema,
  refreshSessionSchema
} from "./auth.schema.ts";
import { AuthService } from "./auth.service.ts";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  settings = async (_request: Request, response: Response) => {
    response.status(200).json(this.authService.getPublicSettings());
  };

  me = async (request: Request, response: Response) => {
    const userId = request.auth?.userId;
    const user = await this.authService.getCurrentUser(userId as number);

    response.status(200).json(user);
  };

  register = async (request: Request, response: Response) => {
    const payload = await validateSchema<RegisterUserInputModel>(
      getRegisterUserSchema(this.authService.isRegistrationCodeRequired()),
      request.body
    );
    const user = await this.authService.register(payload);

    response.status(201).json(user);
  };

  generateAccountCode = async (request: Request, response: Response) => {
    const payload = await validateSchema<GenerateAccountCodeInputModel>(
      generateAccountCodeSchema,
      request.body
    );
    const result = await this.authService.generateAccountCode(payload, {
      userId: request.auth?.userId || null,
      level: request.auth?.level || null
    });

    response.status(201).json(result);
  };

  login = async (request: Request, response: Response) => {
    const payload = await validateSchema<LoginInputModel>(
      loginSchema,
      request.body
    );
    const session = await this.authService.login(payload);

    response.status(200).json(session);
  };

  refresh = async (request: Request, response: Response) => {
    const payload = await validateSchema<RefreshSessionInputModel>(
      refreshSessionSchema,
      request.body
    );
    const session = await this.authService.refreshSession(payload);

    response.status(200).json(session);
  };
}
