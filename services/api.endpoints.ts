export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  GUEST_REGISTER: '/auth/guest-register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  GET_USER: '/auth/me',

  // Public endpoints
  STATS: '/public/stats',

  // Mining endpoints
  MINING_STATUS: '/mining/status',
} as const;

export const PUBLIC_ENDPOINTS = [
  API_ENDPOINTS.LOGIN,
  API_ENDPOINTS.REGISTER,
  API_ENDPOINTS.GUEST_REGISTER,
  API_ENDPOINTS.FORGOT_PASSWORD,
  API_ENDPOINTS.STATS,
]; 