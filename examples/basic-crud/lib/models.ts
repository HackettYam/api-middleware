/**
 * Model representing a task
 */
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for creating a new task
 */
export interface CreateTaskDto {
  title: string;
}

/**
 * DTO for updating an existing task
 */
export interface UpdateTaskDto {
  title?: string;
  completed?: boolean;
}
