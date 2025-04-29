import api from './api.client';

export interface Transaction {
  id: number;
  userId: number;
  amount: string;
  type: 'mining' | 'admin' | 'transfer' | 'task_reward';
  description: string;
  timestamp: string;
  recipientId?: number;
  senderId?: number;
}

export interface TransactionFilters {
  limit?: number;
  offset?: number;
  type?: 'mining' | 'admin' | 'transfer' | 'task_reward' | 'all';
}

// Dữ liệu cần gửi khi chuyển tiền
export interface TransferPayload {
  recipientUsername: string;
  amount: number;
  description?: string; // Mô tả có thể không bắt buộc
}

// Dữ liệu API trả về sau khi chuyển tiền thành công
export interface TransferResponse {
  success: boolean;
  transaction: Transaction;
  newBalance: string;
}

export const transactionService = {
  getTransactions: async (filters?: TransactionFilters) => {
    const response = await api.get<Transaction[]>('/transactions', {
      params: {
        limit: filters?.limit || 20,
        offset: filters?.offset || 0,
        type: filters?.type || 'all'
      }
    });
    return response.data;
  },

  getTransactionById: async (id: number) => {
    const response = await api.get<Transaction>(`/transactions/${id}`);
    return response.data;
  },

  // Hàm mới để chuyển COBIC
  transferCobic: async (payload: TransferPayload) => {
    const response = await api.post<TransferResponse>('/transactions/transfer', payload);
    return response.data;
  }
}; 