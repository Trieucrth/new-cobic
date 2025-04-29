import axios from 'axios';
import { useLoading } from '@/contexts/LoadingContext';

// Tạo instance của axios
const api = axios.create({
  baseURL: 'YOUR_API_BASE_URL', // Thay thế bằng URL API của bạn
  timeout: 10000,
});

// Tạo một instance của LoadingContext để quản lý loading state
let loadingContext: ReturnType<typeof useLoading> | null = null;

// Hàm để set loading context
export const setLoadingContext = (context: ReturnType<typeof useLoading>) => {
  loadingContext = context;
};

// Thêm interceptor cho request
api.interceptors.request.use(
  (config) => {
    if (loadingContext) {
      loadingContext.showLoading('Đang tải dữ liệu...');
    }
    return config;
  },
  (error) => {
    if (loadingContext) {
      loadingContext.hideLoading();
    }
    return Promise.reject(error);
  }
);

// Thêm interceptor cho response
api.interceptors.response.use(
  (response) => {
    if (loadingContext) {
      loadingContext.hideLoading();
    }
    return response;
  },
  (error) => {
    if (loadingContext) {
      loadingContext.hideLoading();
    }
    return Promise.reject(error);
  }
);

export default api; 