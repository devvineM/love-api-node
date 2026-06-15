const defaultJwtExpiresIn = "15m";
const defaultRefreshTokenExpiresInDays = 7;
const defaultFrontendUrl = "http://localhost:3001";

export const env = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || defaultJwtExpiresIn,
  refreshTokenExpiresInDays:
    Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS) ||
    defaultRefreshTokenExpiresInDays,
  userCode: process.env.USER_CODE || "false",
  frontendUrl: process.env.FRONTEND_URL || defaultFrontendUrl
};

export function assertRequiredEnv() {
  if (!env.jwtSecret) {
    throw new Error("A variavel JWT_SECRET precisa ser informada.");
  }
}
