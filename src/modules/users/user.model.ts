export interface UpdateAvatarResultModel {
  avatar: string;
  avatar_url: string;
}

export interface UserListQueryModel {
  page: number;
  perPage: number;
  search?: string;
  jobTitleId?: number;
  active?: boolean;
}

export interface UserListItemModel {
  id: number;
  full_name: string;
  first_name: string;
  avatar_url: string | null;
  active: boolean;
  level_title: string | null;
  job_title: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserListResponseModel {
  data: UserListItemModel[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    search: string;
  };
  overview: {
    total: number;
    active: number;
    inactive: number;
    with_job_title: number;
  };
}

export interface UserLookupsResponseModel {
  job_titles: Array<{
    id: number;
    job_title: string;
  }>;
}

export interface AdminUpdateUserInputModel {
  jobTitleId: number | null;
}

export interface MyProfileResponseModel {
  id: number;
  full_name: string;
  user: string;
  avatar_url: string | null;
  bio: string | null;
  theme: string;
  active: boolean;
  level_title: string | null;
  job_title: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateMyProfileInputModel {
  fullName: string;
  bio: string | null;
  theme: string;
}

export interface UpdateMyPasswordInputModel {
  currentPassword: string;
  newPassword: string;
}

export interface AdminUpdateUserResponseModel {
  id: number;
  full_name: string;
  first_name: string;
  avatar_url: string | null;
  active: boolean;
  level_title: string | null;
  job_title: string | null;
  created_at: Date;
  updated_at: Date;
}
