import api from './api.client'; // Import API client đã cấu hình
import axios from 'axios';
import { authHandler } from './auth.handler';
import { setToken } from './token.handler';

// Tạo instance API public không có token và không có interceptor
const publicApi = axios.create({
  baseURL: 'https://api.cobic.vn', // Hardcode baseURL để test
  headers: {
    'Content-Type': 'application/json',
  },
});

// Xóa interceptor mặc định
publicApi.interceptors.request.clear();
publicApi.interceptors.response.clear();

const authService = {
  login: async (username: string, password: string) => {
    try {
      console.log('Attempting login with:', { username, password });
      const response = await publicApi.post('/auth/login', {
        username,
        password
      });
      console.log('Login response:', response.data);
      
      if (!response.data || !response.data.token) {
        throw new Error('No token in response');
      }
      
      // Lưu token ngay sau khi nhận được
      await setToken(response.data.token);
      
      return {
        token: response.data.token,
        user: {
          id: response.data.user.id,
          username: response.data.user.username,
          email: response.data.user.email
        }
      };
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error);
      if (error.response?.status === 401) {
        throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
      }
      throw error;
    }
  },

  register: async (username: string, email: string, password: string) => {
    try {
      console.log('Attempting register with:', { username, email });
      const response = await publicApi.post('/auth/register', { username, email, password });
      console.log('Register response:', response.data);
      
      if (!response.data || !response.data.token) {
        throw new Error('No token in response');
      }
      
      // Lưu token ngay sau khi nhận được
      await setToken(response.data.token);
      
      return response.data;
    } catch (error: any) {
      console.error('Register error:', error.response?.data || error);
      throw error;
    }
  },

  getMe: async () => {
    try {
      console.log('Fetching user info');
      const response = await api.get('/auth/me'); // Sử dụng api đã import
      console.log('User info response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('GetMe error:', error.response?.data || error);
      throw error;
    }
  },

  logout: async () => {
    try {
      console.log('Attempting logout');
      const response = await api.post('/auth/logout');
      console.log('Logout response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Logout error:', error.response?.data || error);
      throw error;
    }
  },

  guestRegister: async () => {
    try {
      const response = await publicApi.post('/auth/guest-register');
      console.log('Guest register full response:', JSON.stringify(response.data, null, 2));
      
      if (!response.data || !response.data.token) {
        throw new Error('No token in response');
      }
      
      // Lưu token ngay sau khi nhận được
      await setToken(response.data.token);
      
      return response.data;
    } catch (error) {
      console.error('Guest register error:', error);
      throw error;
    }
  },

  testExpireToken: async () => {
    try {
      console.log('Testing token expiration...');
      const response = await api.post('/auth/test-expire-token');
      console.log('Test response:', response.data);
      
      // Sau khi test thành công, force logout
      await authHandler.forceLogout();
      
      return response.data;
    } catch (error) {
      console.error('Test error:', error);
      // Nếu có lỗi, vẫn force logout
      await authHandler.forceLogout();
      throw error;
    }
  },

  forgotPassword: async (email: string) => {
    try {
      console.log('Attempting forgot password with:', { email });
      const response = await publicApi.post('/auth/forgot-password', { email });
      console.log('Forgot password response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },
};

export { authService }; 