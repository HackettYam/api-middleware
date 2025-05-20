'use client';

import { useState, useEffect } from 'react';
import { useTaskContext } from '../lib/context/TaskContext';
import { Task } from '../lib/models';

// Task filter type
type TaskFilter = 'all' | 'active' | 'completed';

// API status (to display request information)
type ApiStatus = {
  loading: boolean;
  lastAction: string;
  timestamp: number;
  success?: boolean;
  error?: string;
};

export default function Home() {
  // Use the tasks context
  const { tasks, isLoading, error, createTask, updateTask, deleteTask } = useTaskContext();
  
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('all');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // API status to show information about requests
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    loading: isLoading,
    lastAction: 'initializing',
    timestamp: Date.now(),
  });

  // Update API status when tasks or loading state change
  useEffect(() => {
    setApiStatus(prevStatus => ({
      ...prevStatus,
      loading: isLoading,
      error: error || undefined,
      success: !isLoading && !error
    }));
  }, [isLoading, error]);
  
  // Filter tasks when tasks or active filter change
  useEffect(() => {
    filterTasks();
  }, [tasks, activeFilter]);
  
  // Function to filter tasks based on active filter
  const filterTasks = () => {
    switch (activeFilter) {
      case 'active':
        setFilteredTasks(tasks.filter(task => !task.completed));
        break;
      case 'completed':
        setFilteredTasks(tasks.filter(task => task.completed));
        break;
      default: // 'all'
        setFilteredTasks(tasks);
        break;
    }
  };
  
  // Helper function to update API status
  const updateApiStatus = (action: string, success: boolean, errorMsg?: string) => {
    setApiStatus({
      loading: false,
      lastAction: action,
      timestamp: Date.now(),
      success: success,
      error: errorMsg
    });
  };

  // Handle creating a new task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTaskTitle.trim()) return;
    
    setApiStatus({
      ...apiStatus,
      loading: true,
      lastAction: 'creating task',
      timestamp: Date.now()
    });
    
    try {
      const result = await createTask({ title: newTaskTitle });
      
      if (result) {
        setNewTaskTitle('');
        updateApiStatus('task created', true);
      } else {
        updateApiStatus('error creating task', false, 'Could not create the task');
      }
    } catch (err) {
      const errorMsg = 'Error creating task: ' + (err instanceof Error ? err.message : String(err));
      updateApiStatus('error creating task', false, errorMsg);
    }
  };

  // Handle toggling task completion status
  const handleToggleTaskCompleted = async (task: Task) => {
    setApiStatus({
      ...apiStatus,
      loading: true,
      lastAction: `updating task ${task.id}`,
      timestamp: Date.now()
    });
    
    try {
      const result = await updateTask(task.id, { completed: !task.completed });
      
      if (result) {
        updateApiStatus('task updated', true);
      } else {
        updateApiStatus('error updating task', false, 'Could not update the task');
      }
    } catch (err) {
      const errorMsg = 'Error updating task: ' + (err instanceof Error ? err.message : String(err));
      updateApiStatus('error updating task', false, errorMsg);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (id: string) => {
    setApiStatus({
      ...apiStatus,
      loading: true,
      lastAction: `deleting task ${id}`,
      timestamp: Date.now()
    });
    
    try {
      const success = await deleteTask(id);
      
      if (success) {
        updateApiStatus('task deleted', true);
      } else {
        updateApiStatus('error deleting task', false, 'Could not delete the task');
      }
    } catch (err) {
      const errorMsg = 'Error deleting task: ' + (err instanceof Error ? err.message : String(err));
      updateApiStatus('error deleting task', false, errorMsg);
    }
  };

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Task List</h1>
      <p className="mb-4 text-gray-700">
        This example demonstrates the use of <code>@hackettyam/api-middleware</code> to create a RESTful API in Next.js.
      </p>
      
      {/* API Information */}
      <div className={`mb-4 p-3 rounded text-sm ${apiStatus.loading ? 'bg-blue-100' : apiStatus.success ? 'bg-green-100' : apiStatus.error ? 'bg-red-100' : 'bg-gray-100'}`}>
        <h3 className="font-semibold">API Status</h3>
        <div className="flex justify-between">
          <span>Status: 
            {apiStatus.loading ? (
              <span className="text-blue-500">Loading...</span>
            ) : apiStatus.success ? (
              <span className="text-green-500">Success</span>
            ) : (
              <span className="text-red-500">Error</span>
            )}
          </span>
          <span>Last action: {apiStatus.lastAction}</span>
        </div>
        {apiStatus.error && (
          <div className="text-red-500 mt-1">{apiStatus.error}</div>
        )}
      </div>
      
      {/* Form to add tasks */}
      <form onSubmit={handleCreateTask} className="mb-6">
        <div className="flex">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="New task..."
            className="flex-1 p-2 border border-gray-300 rounded-l"
            required
            disabled={apiStatus.loading}
          />
          <button 
            type="submit"
            className={`px-4 py-2 rounded-r ${apiStatus.loading ? 'bg-gray-400' : 'bg-blue-500'} text-white`}
            disabled={apiStatus.loading}
          >
            {apiStatus.loading ? 'Processing...' : 'Add'}
          </button>
        </div>
      </form>

      {/* Task filters */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1 rounded ${activeFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          All ({tasks.length})
        </button>
        <button
          onClick={() => setActiveFilter('active')}
          className={`px-3 py-1 rounded ${activeFilter === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Active ({tasks.filter(t => !t.completed).length})
        </button>
        <button
          onClick={() => setActiveFilter('completed')}
          className={`px-3 py-1 rounded ${activeFilter === 'completed' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Completed ({tasks.filter(t => t.completed).length})
        </button>
      </div>

      {/* Task list */}
      {apiStatus.loading && filteredTasks.length === 0 ? (
        <p>Loading tasks...</p>
      ) : filteredTasks.length === 0 ? (
        <p className="text-gray-500 my-4">
          {activeFilter === 'all' 
            ? 'No tasks. Add one!' 
            : activeFilter === 'active' 
              ? 'No active tasks.' 
              : 'No completed tasks.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {filteredTasks.map((task) => (
            <li 
              key={task.id} 
              className="border border-gray-200 rounded p-3 flex justify-between items-center"
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggleTaskCompleted(task)}
                  className="mr-2 h-5 w-5"
                  disabled={apiStatus.loading}
                />
                <span className={task.completed ? 'line-through text-gray-500' : ''}>
                  {task.title}
                </span>
              </div>
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="text-red-500 hover:text-red-700"
                disabled={apiStatus.loading}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Technical information */}
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Technical Information</h2>
        <p className="text-sm">
          This application uses <code>@hackettyam/api-middleware</code> to implement 
          a RESTful API with middleware for validation, error handling, and response formatting.
        </p>
        <p className="text-sm mt-2">
          Implemented endpoints:
        </p>
        <ul className="text-sm list-disc list-inside ml-2">
          <li>GET /api/tasks - Get all tasks</li>
          <li>POST /api/tasks - Create a new task</li>
          <li>GET /api/tasks/:id - Get a specific task</li>
          <li>PUT /api/tasks/:id - Update a task</li>
          <li>DELETE /api/tasks/:id - Delete a task</li>
        </ul>
      </div>
    </main>
  );
}
