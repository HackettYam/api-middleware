import { Task, CreateTaskDto, UpdateTaskDto } from './models';

/**
 * In-memory storage for tasks
 * Note: For demonstration purposes only. In a real application,
 * we would use a database like PostgreSQL, MongoDB, etc.
 */
class TaskStore {
  private tasks: Map<string, Task> = new Map();

  /**
   * Constructor that initializes the store with some example tasks
   */
  constructor() {
    // Add some initial tasks for demonstration
    const now = new Date().toISOString();
    
    const initialTasks: Task[] = [
      {
        id: '1',
        title: 'Learn Next.js',
        completed: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: '2',
        title: 'Create a REST API',
        completed: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: '3',
        title: 'Implement authentication middleware',
        completed: false,
        createdAt: now,
        updatedAt: now
      }
    ];
    
    initialTasks.forEach(task => {
      this.tasks.set(task.id, task);
    });
  }

  /**
   * Get all tasks
   */
  async findAll(): Promise<Task[]> {
    return [...this.tasks.values()];
  }

  /**
   * Get a task by its ID
   */
  async findById(id: string): Promise<Task | null> {
    const task = this.tasks.get(id);
    return task || null;
  }

  /**
   * Create a new task
   */
  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const now = new Date().toISOString();
    const id = Date.now().toString();
    
    const newTask: Task = {
      id,
      title: createTaskDto.title,
      completed: false,
      createdAt: now,
      updatedAt: now
    };
    
    this.tasks.set(id, newTask);
    return newTask;
  }

  /**
   * Update an existing task
   */
  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task | null> {
    const task = this.tasks.get(id);
    
    if (!task) {
      return null;
    }
    
    const updatedTask: Task = {
      ...task,
      ...updateTaskDto,
      updatedAt: new Date().toISOString()
    };
    
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  /**
   * Delete a task
   */
  async delete(id: string): Promise<boolean> {
    const exists = this.tasks.has(id);
    
    if (!exists) {
      return false;
    }
    
    return this.tasks.delete(id);
  }
}

// Export a single instance so the entire application shares the same data
export const taskStore = new TaskStore();
