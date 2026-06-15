import multer from "multer";

import { AppError } from "../../errors/app-error.ts";

const allowedMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
];
const maxFileSizeInBytes = 8 * 1024 * 1024;
const maxFiles = 10;

export const uploadTaskImages = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxFileSizeInBytes,
    files: maxFiles
  },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      callback(
        new AppError(
          "Formato de imagem invÃ¡lido. Envie JPG, JPEG, PNG ou WEBP.",
          400
        )
      );
      return;
    }

    callback(null, true);
  }
});
