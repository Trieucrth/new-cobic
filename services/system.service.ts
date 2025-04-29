import api from './api.client';

export interface SystemStats {
  globalMiningRate: string;
  decayFactor: string;
  lastDecayDate: string;
  lastDecayUserCount: number;
  totalSupply: string;
  currentSupply: string;
  userCount: number;
}

export const systemService = {
  getPublicStats: async (): Promise<SystemStats> => {
    const response = await api.get('/public/stats');
    return response.data;
  }
};
