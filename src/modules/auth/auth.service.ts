import { compare, hash } from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, randomUUID } from "node:crypto";

import { env } from "../../shared/config/env.ts";
import { AppError } from "../../shared/errors/app-error.ts";
import type {
  AuthSettingsModel,
  AuthTokensModel,
  AuthUserModel,
  GenerateAccountCodeInputModel,
  GenerateAccountCodeResponseModel,
  JwtPayloadModel,
  LoginInputModel,
  RefreshSessionInputModel,
  RegisterUserInputModel
} from "./auth.model.ts";
import { AuthRepository } from "./auth.repository.ts";

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  getPublicSettings(): AuthSettingsModel {
    return {
      user_code_required: true,
    };
  }

  async getCurrentUser(userId: number): Promise<AuthUserModel> {
    const user = await this.authRepository.findUserById(userId);

    if (!user) {
      throw new AppError("UsuÃ¡rio nÃ£o encontrado.", 404);
    }

    return this.serializeUser(user);
  }

  async register(input: RegisterUserInputModel): Promise<AuthUserModel> {
    const authorizationCode = await this.consumeRegistrationCode(
      input.registrationCode
    );
    const defaultLevel = await this.authRepository.ensureDefaultLevel();

    const existingUser = await this.authRepository.findUserByUsername(
      input.username
    );

    if (existingUser) {
      throw new AppError("Nome de usuario ja utilizado.", 409);
    }

    const passwordHash = await hash(input.password, 12);

    const user = await this.authRepository.createUser({
      fullName: input.fullName.trim(),
      username: input.username.trim(),
      passwordHash,
      levelId: defaultLevel.id,
      jobTitleId: authorizationCode.jobTitleId,
      active: true
    });

    return this.serializeUser(user);
  }

  async login(input: LoginInputModel): Promise<AuthTokensModel> {
    const user = await this.authRepository.findUserByUsername(input.username);

    if (!user) {
      throw new AppError("UsuÃ¡rio ou senha invÃ¡lidos.", 401);
    }

    if (!user.active) {
      throw new AppError("Conta desativada.", 403);
    }

    const passwordMatches = await compare(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new AppError("UsuÃ¡rio ou senha invÃ¡lidos.", 401);
    }

    return this.issueSessionTokens({
      id: user.id,
      username: user.username,
      level: user.level?.level || null
    });
  }

  async refreshSession(
    input: RefreshSessionInputModel
  ): Promise<AuthTokensModel> {
    const tokenHash = this.hashRefreshToken(input.refreshToken);
    const refreshTokenRecord = await this.authRepository.findRefreshTokenByHash(
      tokenHash
    );

    if (!refreshTokenRecord) {
      throw new AppError("Refresh token invÃ¡lido.", 401);
    }

    if (refreshTokenRecord.revokedAt) {
      throw new AppError("Refresh token revogado.", 401);
    }

    if (refreshTokenRecord.expiresAt.getTime() <= Date.now()) {
      throw new AppError("Refresh token expirado.", 401);
    }

    if (!refreshTokenRecord.user.active) {
      throw new AppError("Conta desativada.", 403);
    }

    await this.authRepository.revokeRefreshToken(refreshTokenRecord.id);

    return this.issueSessionTokens({
      id: refreshTokenRecord.user.id,
      username: refreshTokenRecord.user.username,
      level: refreshTokenRecord.user.level?.level || null
    });
  }

  async generateAccountCode(
    input: GenerateAccountCodeInputModel,
    actor: { userId: number | null; level: string | null } | null
  ): Promise<GenerateAccountCodeResponseModel> {
    this.ensureAdmin(actor);

    const jobTitle = await this.authRepository.findJobTitleById(input.jobTitleId);

    if (!jobTitle) {
      throw new AppError("Cargo selecionado nÃ£o encontrado.", 404);
    }

    const code = await this.generateUniqueAccountCode();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    const authorizationCode =
      await this.authRepository.createAccountAuthorizationCode({
        code,
        jobTitleId: jobTitle.id,
        createdById: actor?.userId as number,
        expiresAt
      });

    return {
      code: authorizationCode.code,
      expires_at: authorizationCode.expiresAt,
      job_title: authorizationCode.jobTitle.jobTitle
    };
  }

  private async issueSessionTokens(user: {
    id: number;
    username: string;
    level: string | null;
  }): Promise<AuthTokensModel> {
    const payload: JwtPayloadModel = {
      sub: String(user.id),
      userId: user.id,
      username: user.username,
      level: user.level
    };

    const token = jwt.sign(payload, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"]
    });

    const rawRefreshToken = randomUUID();
    const refreshTokenHash = this.hashRefreshToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + env.refreshTokenExpiresInDays
    );

    await this.authRepository.createRefreshToken({
      tokenHash: refreshTokenHash,
      userId: user.id,
      expiresAt
    });

    return {
      token,
      refresh_token: rawRefreshToken
    };
  }

  private hashRefreshToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private async consumeRegistrationCode(registrationCode?: string) {
    const normalizedCode = registrationCode?.trim();

    if (!normalizedCode) {
      throw new AppError("CÃ³digo de cadastro obrigatÃ³rio.", 403);
    }

    const authorizationCode =
      await this.authRepository.findAvailableAccountCode(normalizedCode);

    if (!authorizationCode || authorizationCode.usedAt) {
      throw new AppError("CÃ³digo de cadastro invÃ¡lido.", 403);
    }

    if (authorizationCode.expiresAt.getTime() <= Date.now()) {
      throw new AppError("CÃ³digo de cadastro expirado.", 403);
    }

    await this.authRepository.markAccountCodeAsUsed(authorizationCode.id);

    return authorizationCode;
  }

  private async generateUniqueAccountCode() {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const code = this.createFourDigitCode();
      const existingCode = await this.authRepository.findActiveAccountCodeByValue(
        code
      );

      if (!existingCode) {
        return code;
      }
    }

    throw new AppError(
      "NÃ£o foi possÃ­vel gerar um novo cÃ³digo agora. Tente novamente.",
      503
    );
  }

  private createFourDigitCode() {
    const digitsOnly = randomUUID().replace(/\D/g, "");

    if (digitsOnly.length >= 4) {
      return digitsOnly.slice(0, 4);
    }

    return digitsOnly.padEnd(4, "7");
  }

  private ensureAdmin(actor: { userId: number | null; level: string | null } | null) {
    if (!actor?.userId) {
      throw new AppError("UsuÃ¡rio autenticado nÃ£o identificado.", 401);
    }

    if (actor.level?.toLowerCase() !== "admin") {
      throw new AppError("Essa area e exclusiva para administradores.", 403);
    }
  }

  private serializeUser(user: {
    id: number;
    fullName: string;
    username: string;
    avatar: string | null;
    bio: string | null;
    theme: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    level: { level: string } | null;
    jobTitle: { jobTitle: string } | null;
  }): AuthUserModel {
    return {
      id: user.id,
      full_name: user.fullName,
      user: user.username,
      avatar: user.avatar,
      bio: user.bio,
      theme: user.theme,
      active: user.active,
      level: user.level?.level || null,
      job_title: user.jobTitle?.jobTitle || null,
      created_at: user.createdAt,
      updated_at: user.updatedAt
    };
  }
}
