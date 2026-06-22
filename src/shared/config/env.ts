const defaultJwtExpiresIn = "15m";
const defaultRefreshTokenExpiresInDays = 7;
const defaultAccountCodeExpiresInMinutes = 2;
const defaultFrontendUrl = "http://localhost:3001";
const defaultUserCode = "false";

function parseBooleanEnv(value: string) {
  return value.trim().toLowerCase() === "true";
}

function parsePositiveNumberEnv(value: string | undefined, fallback: number) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return fallback;
  }

  return parsedValue;
}

export const env = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || defaultJwtExpiresIn,
  refreshTokenExpiresInDays:
    parsePositiveNumberEnv(
      process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS,
      defaultRefreshTokenExpiresInDays
    ),
  accountCodeExpiresInMinutes: parsePositiveNumberEnv(
    process.env.ACCOUNT_CODE_EXPIRES_IN_MINUTES,
    defaultAccountCodeExpiresInMinutes
  ),
  userCode: parseBooleanEnv(process.env.USER_CODE || defaultUserCode),
  frontendUrl: process.env.FRONTEND_URL || defaultFrontendUrl
};

export function assertRequiredEnv() {
  if (!env.jwtSecret) {
    throw new Error("A variavel JWT_SECRET precisa ser informada.");
  }
}
