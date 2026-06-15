import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../../config/env.ts";
import { AppError } from "../../errors/app-error.ts";
import type { JwtPayloadModel } from "../../../modules/auth/auth.model.ts";

export function authenticate(
  request: Request,
  _response: Response,
  next: NextFunction
) {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    next(new AppError("Token de autenticacao nao informado.", 401));
    return;
  }

  const token = authorizationHeader.slice("Bearer ".length);

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayloadModel;
    request.auth = decoded;

    next();
  } catch {
    next(new AppError("Token de autenticaÃ§Ã£o invÃ¡lido.", 401));
  }
}
