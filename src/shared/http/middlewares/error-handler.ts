import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ValidationError } from "yup";

import { AppError } from "../../errors/app-error.ts";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  if (error instanceof ValidationError) {
    response.status(400).json({
      message: "Dados inválidos.",
      errors: error.errors
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    response.status(400).json({
      message: error.message
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      message: error.message,
      details: error.details
    });
    return;
  }

  console.error("Erro nao tratado na aplicacao.", error);

  response.status(500).json({
    message: "Erro interno do servidor."
  });
}
