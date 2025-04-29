import api from './api.client';

export interface Task {
  id: number;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'one_time' | 'special';
  reward: string;
  startDate: string;
  endDate: string;
  requirements?: string;
  completed: boolean;
}

export interface CompleteTaskResponse {
  success: boolean;
  reward: string;
  transaction: {
    id: number;
    userId: number;
    amount: string;
    type: string;
    description: string;
    timestamp: string;
    recipientId: number;
    senderId: number;
  };
}

export const taskService = {
  getTasks: async (type?: string) => {
    const response = await api.get<Task[]>('/tasks', {
      params: { type }
    });
    return response.data;
  },

  completeTask: async (taskId: number) => {
    const response = await api.post<CompleteTaskResponse>(`/tasks/${taskId}/complete`);
    return response.data;
  }
}; 