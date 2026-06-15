import cors from "cors";
import express from "express";
import path from "node:path";

import { apiRouter } from "./routes/index.ts";
import { env } from "./shared/config/env.ts";
import { errorHandler } from "./shared/http/middlewares/error-handler.ts";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true
    })
  );
  app.use(express.json());
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
  app.use(apiRouter);
  app.use(errorHandler);

  return app;
}
