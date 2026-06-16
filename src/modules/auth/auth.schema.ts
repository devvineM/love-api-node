import * as yup from "yup";

const fullNameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ]+)+$/;
const usernameRegex = /^(?!.*@)[a-zA-Z0-9._-]+$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const registrationCodeSchema = yup
  .string()
  .trim()
  .matches(/^\d{4}$/, "Informe um codigo de cadastro valido com 4 digitos.");

export function getRegisterUserSchema(requireRegistrationCode: boolean) {
  return yup
    .object({
      registrationCode: requireRegistrationCode
        ? registrationCodeSchema.required("Codigo de cadastro e obrigatorio.")
        : registrationCodeSchema.notRequired(),
      fullName: yup
        .string()
        .required("Nome completo e obrigatorio.")
        .matches(
          fullNameRegex,
          "Informe um nome completo valido, contendo apenas letras e espacos."
        ),
      username: yup
        .string()
        .required("Usuario e obrigatorio.")
        .matches(
          usernameRegex,
          "Usuario invalido. Use apenas letras, numeros, ponto, traco ou sublinhado."
        ),
      password: yup
        .string()
        .required("Senha e obrigatoria.")
        .matches(
          passwordRegex,
          "A senha precisa ter no minimo 8 caracteres, com letra maiuscula, minuscula, numero e simbolo."
        )
    })
    .noUnknown();
}

export const loginSchema = yup
  .object({
    username: yup.string().required("Usuario e obrigatorio."),
    password: yup.string().required("Senha e obrigatoria.")
  })
  .noUnknown();

export const refreshSessionSchema = yup
  .object({
    refreshToken: yup.string().required("Refresh token e obrigatorio.")
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
