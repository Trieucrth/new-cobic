import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { authService } from '@/services/auth.service';
import { Alert } from 'react-native';
import api from '../services/api.client';
import { getToken, setToken, removeToken } from '../services/token.handler';
import { API_ENDPOINTS } from '../services/api.endpoints';

interface User {
  id: number;
  username: string;
  email?: string | null;
  referralCode?: string;
  referredBy?: number | null;
  isAdmin?: boolean;
  isGuest?: boolean;
  balance?: string;
  nonTransferableBalance?: string;
  lastMiningTime?: string | null;
  lastDailyCheckInTime?: string | null;
  miningRate?: string;
  userMiningRate?: string;
  bonusFactor?: string;
  totalMined?: string;
  fullName?: string | null;
  dateOfBirth?: string | null;
  country?: string | null;
  address?: string | null;
  bio?: string | null;
  phoneNumber?: string | null;
  kycStatus?: string | null;
  kycSubmissionTime?: string | null;
  kycVerificationTime?: string | null;
  kycDocumentFront?: string | null;
  kycDocumentBack?: string | null;
  kycDocumentType?: string | null;
  kycRejectionReason?: string | null;
  plainPassword?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  isLoggingOut: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  register: (username: string, email: string, password: string) => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const logoutRef = useRef(false);

  const checkAuth = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      const response = await api.get(API_ENDPOINTS.GET_USER);
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
      setUser(null);
      await removeToken();
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const login = async (token: string, userData: User) => {
    try {
      const userToSave: User = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        referralCode: userData.referralCode,
        referredBy: userData.referredBy,
        isAdmin: userData.isAdmin,
        isGuest: userData.isGuest,
        balance: userData.balance,
        nonTransferableBalance: userData.nonTransferableBalance,
        lastMiningTime: userData.lastMiningTime,
        lastDailyCheckInTime: userData.lastDailyCheckInTime,
        miningRate: userData.miningRate,
        userMiningRate: userData.userMiningRate,
        bonusFactor: userData.bonusFactor,
        totalMined: userData.totalMined,
        fullName: userData.fullName,
        dateOfBirth: userData.dateOfBirth,
        country: userData.country,
        address: userData.address,
        bio: userData.bio,
        phoneNumber: userData.phoneNumber,
        kycStatus: userData.kycStatus,
        kycSubmissionTime: userData.kycSubmissionTime,
        kycVerificationTime: userData.kycVerificationTime,
        kycDocumentFront: userData.kycDocumentFront,
        kycDocumentBack: userData.kycDocumentBack,
        kycDocumentType: userData.kycDocumentType,
        kycRejectionReason: userData.kycRejectionReason,
        ...(userData.plainPassword && { plainPassword: userData.plainPassword })
      };

      await setToken(token);
      await AsyncStorage.setItem('user', JSON.stringify(userToSave));
      
      setUser(userToSave);
      setIsAuthenticated(true);
      
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('AuthContext login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (isLoggingOut || logoutRef.current) return;
    
    try {
      setIsLoggingOut(true);
      logoutRef.current = true;
      
      // 1. Xóa token và user data trước
      await removeToken();
      await AsyncStorage.removeItem('user');
      
      // 2. Cập nhật state
      setUser(null);
      setIsAuthenticated(false);
      
      // 3. Gọi API logout sau cùng
      await authService.logout();
      
      // 4. Chuyển hướng
      router.replace({
        pathname: '/login',
        params: { from: 'logout' }
      });
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
      // Nếu có lỗi, vẫn đảm bảo đăng xuất
      await removeToken();
      await AsyncStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      router.replace({
        pathname: '/login',
        params: { from: 'logout' }
      });
    } finally {
      setIsLoggingOut(false);
      logoutRef.current = false;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      await api.post(API_ENDPOINTS.REGISTER, { username, email, password });
      await login(password, {
        id: 0,
        username,
        email,
        isAdmin: false,
        isGuest: false,
        balance: '0',
        nonTransferableBalance: '0',
        lastMiningTime: null,
        lastDailyCheckInTime: null,
        miningRate: '0',
        userMiningRate: '0',
        bonusFactor: '0',
        totalMined: '0',
        fullName: '',
        dateOfBirth: null,
        country: null,
        address: null,
        bio: null,
        phoneNumber: null,
        kycStatus: null,
        kycSubmissionTime: null,
        kycVerificationTime: null,
        kycDocumentFront: null,
        kycDocumentBack: null,
        kycDocumentType: null,
        kycRejectionReason: null,
        plainPassword: password
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        setUser,
        setIsAuthenticated,
        isLoggingOut,
        isInitialized,
        isLoading,
        register,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;