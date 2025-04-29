import { useState, useCallback } from 'react';
import axios from 'axios';
import { useLoading } from './useLoading';

const api = axios.create({
  baseURL: 'YOUR_API_BASE_URL', // Thay thế bằng URL API của bạn
  timeout: 10000,
});

export const useApi = () => {
  const { showLoading, hideLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async (config: any) => {
    try {
      showLoading('Đang tải dữ liệu...');
      setError(null);
      const response = await api(config);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
      throw err;
    } finally {
      hideLoading();
    }
  }, [showLoading, hideLoading]);

  return {
    request,
    error,
  };
}; 