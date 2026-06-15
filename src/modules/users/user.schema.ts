import * as yup from "yup";

const fullNameRegex = /^\p{L}+(?:\s+\p{L}+)+$/u;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const allowedThemes = ["light", "dark"] as const;

const numberTransform = (value: unknown, originalValue: unknown) => {
  if (typeof originalValue === "string" && originalValue.trim() !== "") {
    const parsed = Number(originalValue);

    return Number.isNaN(parsed) ? value : parsed;
  }

  return value;
};

const booleanTransform = (value: unknown, originalValue: unknown) => {
  if (typeof originalValue === "string") {
    if (originalValue === "true") {
      return true;
    }

    if (originalValue === "false") {
      return false;
    }
  }

  return value;
};

export const listUsersSchema = yup
  .object({
    page: yup.number().transform(numberTransform).integer().min(1).default(1),
    perPage: yup
      .number()
      .transform(numberTransform)
      .integer()
      .min(1)
      .max(30)
      .default(12),
    search: yup.string().trim().max(120).optional().default(""),
    jobTitleId: yup.number().transform(numberTransform).integer().min(1).optional(),
    active: yup.boolean().transform(booleanTransform).optional()
  })
  .noUnknown();

export const updateUserParamsSchema = yup
  .object({
    id: yup.number().transform(numberTransform).integer().min(1).required()
  })
  .noUnknown();

export const updateUserSchema = yup
  .object({
    jobTitleId: yup
      .number()
      .transform(numberTransform)
      .integer()
      .min(1)
      .nullable()
      .default(null)
  })
  .noUnknown();

export const updateMyProfileSchema = yup
  .object({
    fullName: yup
      .string()
      .trim()
      .required("Nome completo é obrigatório.")
      .matches(
        fullNameRegex,
        "Informe um nome completo valido, contendo apenas letras e espacos."
      ),
    bio: yup
      .string()
      .trim()
      .max(250, "A bio pode ter no máximo 250 caracteres.")
      .nullable()
      .transform((value: unknown, originalValue: unknown) => {
        if (typeof originalValue !== "string") {
          return value;
        }

        const normalizedValue = originalValue.trim();

        return normalizedValue === "" ? null : normalizedValue;
      })
      .default(null),
    theme: yup
      .string()
      .trim()
      .oneOf([...allowedThemes], "Tema inválido.")
      .required("Tema é obrigatório.")
  })
  .noUnknown();

export const updateMyPasswordSchema = yup
  .object({
    currentPassword: yup.string().required("Senha atual é obrigatória."),
    newPassword: yup
      .string()
      .required("Nova senha é obrigatória.")
      .matches(
        passwordRegex,
        "A senha precisa ter no minimo 8 caracteres, com letra maiuscula, minuscula, numero e simbolo."
      )
  })
  .noUnknown();
