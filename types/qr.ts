export interface QRScanResponse {
  success: boolean;
  message: string;
  scannedAmount: number;
  earnedPoints: string;
  newBalance: string;
  invoice: {
    code: string;
    validated: boolean;
    amountSource: string;
  };
}

export interface ScanHistoryItem {
  id: number;
  userId: number;
  qrContent: string;
  amount: string;
  pointsEarned: string;
  createdAt: string;
  status: string;
} 