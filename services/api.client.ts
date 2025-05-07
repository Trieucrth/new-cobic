import axios from 'axios';
import Constants from 'expo-constants';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { getToken } from './token.handler';
import { PUBLIC_ENDPOINTS } from './api.endpoints';

// Lấy API URL từ cấu hình
const API_URL = 'https://app.cobic.io/api';
const ENVIRONMENT = 'production';

// Tạo instance Axios tập trung
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-App-Version': Constants.expoConfig?.version || '1.0.0',
    'X-Platform': Platform.OS,
    'X-Environment': ENVIRONMENT,
  },
  timeout: 15000,
  validateStatus: function (status) {
    return status >= 200 && status < 500;
  }
});

// Hàm kiểm tra kết nối mạng
const checkNetworkConnection = async () => {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    throw new Error('Không có kết nối mạng. Vui lòng kiểm tra lại kết nối của bạn.');
  }
  return true;
};

// Thêm interceptor để tự động thêm token vào header
api.interceptors.request.use(async (config) => {
  try {
    // Kiểm tra kết nối mạng
    await checkNetworkConnection();

    // Kiểm tra xem request có phải là public endpoint không
    const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint => 
      config.url?.includes(endpoint)
    );
    
    // Nếu là public endpoint, không cần kiểm tra token
    if (isPublicEndpoint) {
      return config;
    }
    
    // Chỉ kiểm tra token cho các endpoint protected
    const token = await getToken();
    if (!token) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  } catch (error) {
    console.error('Interceptor error:', error);
    return Promise.reject(error);
  }
});

// Thêm interceptor xử lý lỗi phản hồi
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log lỗi
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      code: error.code
    });

    // Xử lý lỗi mạng
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Kết nối quá hạn. Vui lòng thử lại.'));
    }

    if (!error.response) {
      return Promise.reject(new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.'));
    }

    // Xử lý lỗi 401
    if (error.response.status === 401) {
      return Promise.reject(new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'));
    }

    // Xử lý lỗi 404
    if (error.response.status === 404) {
      return Promise.reject(new Error('Không tìm thấy tài nguyên.'));
    }

    // Xử lý lỗi 500
    if (error.response.status >= 500) {
      return Promise.reject(new Error('Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'));
    }

    // Xử lý các lỗi khác
    return Promise.reject(error);
  }
);

export default api;