import * as yup from "yup";

const hexColorRegex = /^#(?:[0-9A-Fa-f]{6})$/;

const numberTransform = (value: unknown, originalValue: unknown) => {
  if (typeof originalValue === "string" && originalValue.trim() !== "") {
    const parsed = Number(originalValue);

    return Number.isNaN(parsed) ? value : parsed;
  }

  return value;
};

export const listSpacesSchema = yup
  .object({
    page: yup.number().transform(numberTransform).integer().min(1).default(1),
    perPage: yup
      .number()
      .transform(numberTransform)
      .integer()
      .min(1)
      .max(20)
      .default(10),
    search: yup.string().trim().max(120).optional().default("")
  })
  .noUnknown();

export const spaceParamsSchema = yup
  .object({
    id: yup.number().transform(numberTransform).integer().min(1).required()
  })
  .noUnknown();

export const createSpaceSchema = yup
  .object({
    spaceTitle: yup
      .string()
      .trim()
      .required("Nome do espaço é obrigatório.")
      .min(2, "Nome do espaco muito curto.")
      .max(120, "Nome do espaco muito longo."),
    color: yup
      .string()
      .trim()
      .required("Cor é obrigatória.")
      .matches(hexColorRegex, "Informe uma cor hexadecimal valida."),
    active: yup.boolean().required("Status é obrigatório.")
  })
  .noUnknown();

export const updateSpaceSchema = yup
  .object({
    spaceTitle: yup
      .string()
      .trim()
      .required("Nome do espaço é obrigatório.")
      .min(2, "Nome do espaco muito curto.")
      .max(120, "Nome do espaco muito longo."),
    color: yup
      .string()
      .trim()
      .required("Cor é obrigatória.")
      .matches(hexColorRegex, "Informe uma cor hexadecimal valida."),
    active: yup.boolean().required("Status é obrigatório.")
  })
  .noUnknown();
