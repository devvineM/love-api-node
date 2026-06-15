import type { AnyObjectSchema } from "yup";

export async function validateSchema<T>(
  schema: AnyObjectSchema,
  payload: unknown
): Promise<T> {
  return (await schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true
  })) as T;
}
