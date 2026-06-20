import * as yup from "yup";

const fullNameRegex =
  /^(?=.{3,}$)[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)+$/u;
const usernameRegex = /^(?!.*@)[a-zA-Z0-9._-]+$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const registrationCodeSchema = yup
  .string()
  .trim()
  .matches(/^\d{4}$/, "Informe um código de cadastro válido com 4 dígitos.");

export function getRegisterUserSchema(requireRegistrationCode: boolean) {
  return yup
    .object({
      registrationCode: requireRegistrationCode
        ? registrationCodeSchema.required("Código de cadastro é obrigatório.")
        : registrationCodeSchema.notRequired(),
      fullName: yup
        .string()
        .required("Nome completo é obrigatório.")
        .matches(
          fullNameRegex,
          "Informe um nome completo válido, usando apenas letras, espaços, apóstrofo ou hífen."
        ),
      username: yup
        .string()
        .required("Usuário é obrigatório.")
        .matches(
          usernameRegex,
          "Usuário inválido. Use apenas letras, números, ponto, traço ou sublinhado."
        ),
      password: yup
        .string()
        .required("Senha é obrigatória.")
        .matches(
          passwordRegex,
          "A senha precisa ter no mínimo 8 caracteres, com letra maiúscula, minúscula, número e símbolo."
        )
    })
    .noUnknown();
}

export const loginSchema = yup
  .object({
    username: yup.string().required("Usuário é obrigatório."),
    password: yup.string().required("Senha é obrigatória.")
  })
  .noUnknown();

export const refreshSessionSchema = yup
  .object({
    refreshToken: yup.string().required("Refresh token é obrigatório.")
  })
  .noUnknown();

const numberTransform = (value: unknown, originalValue: unknown) => {
  if (typeof originalValue === "string" && originalValue.trim() !== "") {
    const parsed = Number(originalValue);

    return Number.isNaN(parsed) ? value : parsed;
  }

  return value;
};

export const generateAccountCodeSchema = yup
  .object({
    jobTitleId: yup
      .number()
      .transform(numberTransform)
      .integer()
      .min(1)
      .required()
  })
  .noUnknown();
