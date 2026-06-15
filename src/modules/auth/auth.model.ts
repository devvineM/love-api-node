export interface RegisterUserInputModel {
  registrationCode?: string;
  fullName: string;
  username: string;
  password: string;
}

export interface LoginInputModel {
  username: string;
  password: string;
}

export interface RefreshSessionInputModel {
  refreshToken: string;
}

export interface AuthTokensModel {
  token: string;
  refresh_token: string;
}

export interface AuthSettingsModel {
  user_code_required: boolean;
}

export interface GenerateAccountCodeInputModel {
  jobTitleId: number;
}

export interface GenerateAccountCodeResponseModel {
  code: string;
  expires_at: Date;
  job_title: string;
}

export interface AuthUserModel {
  id: number;
  full_name: string;
  user: string;
  avatar: string | null;
  bio: string | null;
  theme: string;
  active: boolean;
  level: string | null;
  job_title: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayloadModel {
  sub: string;
  userId: number;
  username: string;
  level: string | null;
  iat?: number;
  exp?: number;
}
