'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, CreateTaskDto, UpdateTaskDto } from '../models';

// Define the context interface
interface TaskContextType {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (createTaskDto: CreateTaskDto) => Promise<Task | null>;
  updateTask: (id: string, updateTaskDto: UpdateTaskDto) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
}

// Response interfaces
interface FetchTasksResponse {
  data: { tasks: Task[] };
  success: boolean;
}

interface CreateTaskResponse {
  data: { task: Task };
  success: boolean;
}

interface UpdateTaskResponse {
  data: { task: Task };
  success: boolean;
}

interface DeleteTaskResponse {
  success: boolean;
}

// Create context with initial value
const TaskContext = createContext<TaskContextType | undefined>(undefined);

// Context provider
export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load tasks on initialization
  useEffect(() => {
    fetchTasks();
  }, []);

  // Get all tasks
  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/tasks');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const { data } = (await response.json()) as FetchTasksResponse;
      setTasks(data.tasks || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Error loading tasks: ${errorMessage}`);
      console.error('Error fetching tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new task
  const createTask = async (createTaskDto: CreateTaskDto): Promise<Task | null> => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createTaskDto),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const { data } = (await response.json()) as CreateTaskResponse;
      
      if (data.task && typeof data.task.id === 'string') {
        // Update local state with the new task
        setTasks(prevTasks => [...prevTasks, data.task]);
        return data.task;
      } else {
        // If response doesn't have the expected structure
        console.error('Unexpected response when creating task:', data);
        await fetchTasks(); // Reload all tasks
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Error creating task: ${errorMessage}`);
      console.error('Error creating task:', err);
      return null;
    }
  };

  // Update an existing task
  const updateTask = async (id: string, updateTaskDto: UpdateTaskDto): Promise<Task | null> => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateTaskDto),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const { data } = (await response.json()) as UpdateTaskResponse;
      
      if (data.task && typeof data.task.id === 'string') {
        // Update local state with the updated task
        setTasks(prevTasks => prevTasks.map(task => 
          task.id === id ? data.task : task
        ));
        return data.task;
      } else {
        console.error('Unexpected response when updating task:', data);
        await fetchTasks(); // Reload all tasks
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Error updating task: ${errorMessage}`);
      console.error('Error updating task:', err);
      return null;
    }
  };

  // Delete a task
  const deleteTask = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const { success } = (await response.json()) as DeleteTaskResponse;
      
      if (success) {
        // Update local state by removing the task
        setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
        return true;
      } else {
        console.error('Unexpected response when deleting task');
        await fetchTasks(); // Reload all tasks
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Error deleting task: ${errorMessage}`);
      console.error('Error deleting task:', err);
      return false;
    }
  };

  // Context value
  const value: TaskContextType = {
    tasks,
    isLoading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}

// Custom hook to access the context
export function useTaskContext() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
}
