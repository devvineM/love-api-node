export const taskTypes = ["solo", "squad"] as const;

export const taskStatuses = [
  "Parada",
  "Cancelada",
  "Começou",
  "Fazendo",
  "Terminando",
  "Pronta",
  "Aprovada"
] as const;

export type TaskTypeModel = (typeof taskTypes)[number];
export type TaskStatusModel = (typeof taskStatuses)[number];

export interface TaskListQueryModel {
  page: number;
  perPage: number;
  search?: string;
  status?: TaskStatusModel;
  type?: TaskTypeModel;
  spaceId?: number;
  assigneeId?: number;
  active?: boolean;
}

export interface CreateTaskInputModel {
  assigneeId: number;
  assigneeIds: number[];
  spaceId: number;
  type: TaskTypeModel;
  taskTitle: string;
  description: string;
  status: TaskStatusModel;
  active: boolean;
  isReviewed: boolean;
}

export interface UpdateTaskInputModel extends CreateTaskInputModel {}

export interface TaskAssigneeModel {
  id: number;
  full_name: string;
  first_name: string;
  avatar_url: string | null;
  initial: string;
}

export interface TaskImageModel {
  id: number;
  file_name: string;
  image_url: string;
  created_at: Date;
}

export interface TaskItemModel {
  id: number;
  assignee_id: number;
  assignee: TaskAssigneeModel;
  assignees: TaskAssigneeModel[];
  images: TaskImageModel[];
  space_id: number;
  space: {
    space_title: string;
    color: string;
  };
  type: TaskTypeModel;
  task_title: string;
  description: string;
  status: TaskStatusModel;
  active: boolean;
  is_reviewed: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TaskOverviewModel {
  total: number;
  active: number;
  reviewed: number;
  by_status: Array<{
    status: TaskStatusModel;
    count: number;
  }>;
}

export interface TaskListResponseModel {
  data: TaskItemModel[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    search: string;
  };
  overview: TaskOverviewModel;
}

export interface TaskLookupsResponseModel {
  users: TaskAssigneeModel[];
  spaces: Array<{
    id: number;
    space_title: string;
    color: string;
  }>;
  statuses: TaskStatusModel[];
  types: TaskTypeModel[];
}
