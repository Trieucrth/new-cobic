import { router } from 'expo-router';
import { Alert } from 'react-native';
import api from './api.client';
import { getToken, setToken, removeToken } from './token.handler';
import { API_ENDPOINTS } from './api.endpoints';

class AuthHandler {
  private static instance: AuthHandler;
  private isHandlingAuth = false;

  private constructor() {}

  public static getInstance(): AuthHandler {
    if (!AuthHandler.instance) {
      AuthHandler.instance = new AuthHandler();
    }
    return AuthHandler.instance;
  }

  public async handleUnauthorized(error: any): Promise<void> {
    if (this.isHandlingAuth) return;
    
    try {
      this.isHandlingAuth = true;
      console.log('Authentication error: Token invalid or expired');
      
      // Xóa token và user data
      await removeToken();
      
      // Hiển thị thông báo
      Alert.alert(
        'Phiên đăng nhập hết hạn',
        'Vui lòng đăng nhập lại để tiếp tục.',
        [
          {
            text: 'Đăng nhập',
            onPress: () => {
              // Chuyển hướng về login
              router.replace('/login');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error during auth handling:', error);
    } finally {
      this.isHandlingAuth = false;
    }
  }

  public async checkAuthStatus(): Promise<boolean> {
    try {
      const token = await getToken();
      if (!token) {
        // Nếu không có token, chuyển hướng về login
        await this.forceLogout();
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking auth status:', error);
      await this.forceLogout();
      return false;
    }
  }

  public async forceLogout(): Promise<void> {
    try {
      // Xóa token và user data
      await removeToken();
      
      // Chuyển hướng về login
      router.replace('/login');
    } catch (error) {
      console.error('Error during force logout:', error);
    }
  }
}

export const authHandler = AuthHandler.getInstance();

// Thêm hàm test kết nối API
export const testApiConnection = async () => {
  try {
    console.log('Testing API connection...');
    const response = await api.get(API_ENDPOINTS.STATS);
    console.log('API connection test successful:', response.data);
    return true;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
}; 