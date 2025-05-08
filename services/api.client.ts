import axios from 'axios';
import Constants from 'expo-constants';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { getToken, removeToken } from './token.handler';
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
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive'
  },
  timeout: 60000,
  validateStatus: function (status) {
    return status >= 200 && status < 500;
  },
  maxRedirects: 5,
  maxContentLength: 50 * 1024 * 1024,
  proxy: false,
  decompress: true
});

// Hàm kiểm tra kết nối mạng
const checkNetworkConnection = async () => {
  const netInfo = await NetInfo.fetch();
  console.log('Network Info:', {
    isConnected: netInfo.isConnected,
    type: netInfo.type,
    isInternetReachable: netInfo.isInternetReachable,
    details: netInfo.details
  });
  
  if (!netInfo.isConnected) {
    throw new Error('Không có kết nối mạng. Vui lòng kiểm tra lại kết nối của bạn.');
  }

  if (netInfo.isInternetReachable === false) {
    throw new Error('Không thể kết nối đến internet. Vui lòng kiểm tra lại kết nối của bạn.');
  }

  return true;
};

// Thêm hàm retry với exponential backoff
const retryRequest = async (error: any, retryCount = 3): Promise<any> => {
  if (retryCount === 0) {
    return Promise.reject(error);
  }

  // Chỉ retry cho các lỗi mạng, không retry cho lỗi token
  if ((error.code === 'ECONNABORTED' || !error.response) && 
      !error.message?.includes('Phiên đăng nhập đã hết hạn')) {
    const delay = Math.pow(2, 3 - retryCount) * 1000;
    console.log(`Retrying request... (${retryCount} attempts left, delay: ${delay}ms)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return api(error.config).catch(err => retryRequest(err, retryCount - 1));
  }

  return Promise.reject(error);
};

// Thêm interceptor để tự động thêm token vào header
api.interceptors.request.use(async (config) => {
  try {
    // Đảm bảo config và headers tồn tại
    if (!config) {
      config = {
        headers: new axios.AxiosHeaders()
      };
    }
    if (!config.headers) {
      config.headers = new axios.AxiosHeaders();
    }

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
      // Không throw error ở đây, để xử lý ở response interceptor
      return config;
    }
    
    // Thêm token vào header
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  } catch (error) {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
});

// Cập nhật interceptor response
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      headers: response.headers
    });
    return response;
  },
  async (error) => {
    // Log lỗi chi tiết
    console.error('API Error Details:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      code: error.code,
      response: error.response?.data,
      headers: error.config?.headers,
      baseURL: error.config?.baseURL
    });

    // Kiểm tra kết nối mạng
    try {
      await checkNetworkConnection();
    } catch (networkError) {
      return Promise.reject(new Error('Không có kết nối mạng. Vui lòng kiểm tra lại kết nối của bạn.'));
    }

    // Xử lý lỗi 401 hoặc không có token
    if (error.response?.status === 401 || error.message?.includes('Phiên đăng nhập đã hết hạn')) {
      // Xóa token nếu có
      try {
        await removeToken();
      } catch (e) {
        console.error('Error removing token:', e);
      }
      return Promise.reject(new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'));
    }

    // Xử lý lỗi mạng
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Kết nối quá hạn. Vui lòng thử lại.'));
    }

    if (!error.response) {
      return Promise.reject(new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.'));
    }

    return retryRequest(error);
  }
);

export default api;