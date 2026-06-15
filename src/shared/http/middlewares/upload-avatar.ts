import multer from "multer";

import { AppError } from "../../errors/app-error.ts";

const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
const maxFileSizeInBytes = 5 * 1024 * 1024;

export const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxFileSizeInBytes
  },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      callback(
        new AppError(
          "Formato de avatar invÃ¡lido. Envie JPG, JPEG, PNG ou GIF.",
          400
        )
      );
      return;
    }

    callback(null, true);
  }
});
