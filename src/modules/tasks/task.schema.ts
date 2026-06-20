import * as yup from "yup";

import { taskStatuses, taskTypes } from "./task.model.ts";

function normalizeTaskStatusValue(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  if (value.toLowerCase().startsWith("come")) {
    return "Começou";
  }

  return value;
}

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

export const listTasksSchema = yup
  .object({
    page: yup.number().transform(numberTransform).integer().min(1).default(1),
    perPage: yup
      .number()
      .transform(numberTransform)
      .integer()
      .min(1)
      .max(50)
      .default(30),
    search: yup.string().trim().max(160).optional().default(""),
    status: yup
      .mixed<(typeof taskStatuses)[number]>()
      .transform(normalizeTaskStatusValue)
      .oneOf([...taskStatuses])
      .optional(),
    type: yup.mixed<(typeof taskTypes)[number]>().oneOf([...taskTypes]).optional(),
    spaceId: yup.number().transform(numberTransform).integer().min(1).optional(),
    assigneeId: yup
      .number()
      .transform(numberTransform)
      .integer()
      .min(1)
      .optional(),
    active: yup.boolean().transform(booleanTransform).optional()
  })
  .noUnknown();

export const createTaskSchema = yup
  .object({
    assigneeId: yup
      .number()
      .transform(numberTransform)
      .integer()
      .min(1)
      .required("Responsável é obrigatório."),
    assigneeIds: yup
      .array(
        yup
          .number()
          .transform(numberTransform)
          .integer()
          .min(1)
          .required()
      )
      .min(1, "Escolha pelo menos um responsável.")
      .required("Responsáveis são obrigatórios."),
    spaceId: yup
      .number()
      .transform(numberTransform)
      .integer()
      .min(1)
      .required("Espaço é obrigatório."),
    type: yup.mixed<(typeof taskTypes)[number]>().oneOf([...taskTypes]).required(),
    taskTitle: yup
      .string()
      .trim()
      .required("Título da tarefa é obrigatório.")
      .min(3, "Título muito curto.")
      .max(160, "Título muito longo."),
    description: yup
      .string()
      .trim()
      .required("Descrição é obrigatória.")
      .min(5, "Descrição muito curta.")
      .max(2000, "Descrição muito longa."),
    status: yup
      .mixed<(typeof taskStatuses)[number]>()
      .transform(normalizeTaskStatusValue)
      .oneOf([...taskStatuses])
      .required(),
    active: yup.boolean().required(),
    isReviewed: yup.boolean().required()
  })
  .test(
    "assignees-by-type",
    "Tasks do tipo squad precisam de pelo menos 2 responsáveis.",
    (value) => {
      if (!value) {
        return true;
      }

      if (value.type === "solo") {
        return Array.isArray(value.assigneeIds) && value.assigneeIds.length === 1;
      }

      return Array.isArray(value.assigneeIds) && value.assigneeIds.length >= 2;
    }
  )
  .test(
    "primary-assignee-in-team",
    "O responsável principal precisa fazer parte da equipe selecionada.",
    (value) => {
      if (!value) {
        return true;
      }

      return Array.isArray(value.assigneeIds)
        ? value.assigneeIds.includes(value.assigneeId)
        : false;
    }
  )
  .noUnknown();

export const updateTaskSchema = createTaskSchema;
