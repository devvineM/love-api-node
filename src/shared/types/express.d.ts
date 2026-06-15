import type { JwtPayloadModel } from "../../modules/auth/auth.model.ts";

declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayloadModel;
      file?: Multer.File;
    }
  }
}

export {};
