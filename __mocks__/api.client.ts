import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockApi = axios.create({
  baseURL: 'https://cobic.io/api',
});

// Mock interceptor request
mockApi.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock interceptor response
mockApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Xóa token
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      // Chuyển hướng
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
    return Promise.reject(error);
  }
);

export default mockApi; 