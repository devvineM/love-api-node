import * as yup from "yup";

const numberTransform = (value: unknown, originalValue: unknown) => {
  if (typeof originalValue === "string" && originalValue.trim() !== "") {
    const parsed = Number(originalValue);

    return Number.isNaN(parsed) ? value : parsed;
  }

  return value;
};

export const listJobTitlesSchema = yup
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

export const jobTitleParamsSchema = yup
  .object({
    id: yup.number().transform(numberTransform).integer().min(1).required()
  })
  .noUnknown();

export const createJobTitleSchema = yup
  .object({
    jobTitle: yup
      .string()
      .trim()
      .required("Nome do cargo é obrigatório.")
      .min(2, "Nome do cargo muito curto.")
      .max(120, "Nome do cargo muito longo.")
  })
  .noUnknown();

export const updateJobTitleSchema = createJobTitleSchema;
