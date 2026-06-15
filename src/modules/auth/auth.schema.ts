import * as yup from "yup";

const fullNameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ]+)+$/;
const usernameRegex = /^(?!.*@)[a-zA-Z0-9._-]+$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export const registerUserSchema = yup
  .object({
    registrationCode: yup
      .string()
      .trim()
      .matches(/^\d{4}$/, "Informe um codigo de cadastro valido com 4 digitos.")
      .required("Código de cadastro é obrigatório."),
    fullName: yup
      .string()
      .required("Nome completo é obrigatório.")
      .matches(
        fullNameRegex,
        "Informe um nome completo valido, contendo apenas letras e espacos."
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
        "A senha precisa ter no minimo 8 caracteres, com letra maiuscula, minuscula, numero e simbolo."
      )
  })
  .noUnknown();

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
