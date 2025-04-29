import api from './api.client';

export interface MiningStatus {
  canMine: boolean;
  miningRate: string;
  baseMiningRate: string;
  userMiningRate: string;
  lastMiningTime: string;
  nextMiningTime: string;
  cooldownHours: number;
}

export interface MiningResult {
  amount: string;
  balance: string;
}

export interface DailyCheckInResult {
  success: boolean;
  message: string;
  reward: string;
  nextCheckInTime: string;
  newBalance: string;
}

export interface DailyCheckInError {
  error: string;
  nextCheckInTime: string;
  remainingHours: string;
}

export const miningService = {
  getMiningStatus: async (): Promise<MiningStatus> => {
    const response = await api.get('/mining/status');
    return response.data;
  },

  mine: async (): Promise<MiningResult> => {
    const response = await api.post('/mining/mine');
    return response.data;
  },

  checkIn: async (): Promise<DailyCheckInResult> => {
    const response = await api.post('/mining/daily-check-in');
    return response.data;
  }
};