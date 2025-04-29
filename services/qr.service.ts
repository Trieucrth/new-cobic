import api from './api.client';
import { QRScanResponse } from '@/types/qr';

export const qrService = {
  scanQR: async (qrContent: string): Promise<QRScanResponse> => {
    try {
      console.log('Sending QR data:', qrContent);
      
      const response = await api.post('/qr/scan', {
        qrContent: qrContent
      });
      
      // Log response để debug
      console.log('Server response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('QR Service Error:', error);
      throw error;
    }
  },

  getScanHistory: async () => {
    const response = await api.get('/qr/history');
    return response.data;
  },
}; 