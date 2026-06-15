export interface SpaceListQueryModel {
  page: number;
  perPage: number;
  search?: string;
}

export interface CreateSpaceInputModel {
  spaceTitle: string;
  color: string;
  active: boolean;
}

export interface UpdateSpaceInputModel {
  spaceTitle: string;
  color: string;
  active: boolean;
}

export interface SpaceParamsModel {
  id: number;
}

export interface SpaceItemModel {
  id: number;
  user_id: number;
  created_by: {
    first_name: string;
    avatar_url: string | null;
    initial: string;
  };
  space_title: string;
  color: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SpaceListResponseModel {
  data: SpaceItemModel[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    search: string;
  };
}
