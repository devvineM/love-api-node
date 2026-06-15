export interface JobTitleListQueryModel {
  page: number;
  perPage: number;
  search?: string;
}

export interface JobTitleInputModel {
  jobTitle: string;
}

export interface JobTitleParamsModel {
  id: number;
}

export interface JobTitleItemModel {
  id: number;
  job_title: string;
  created_at: Date;
  updated_at: Date;
}

export interface JobTitleListResponseModel {
  data: JobTitleItemModel[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    search: string;
  };
}
