// services/auth.ts
import { AuthResponse, UserProfile, Verify2FaDto, TwoFactorSetupDto, TwoFactorVerifySetupDto, LoginPinDto } from '../types';
import http from './http';

const API_URL = '/api/auth';

// Simulate API calls if backend doesn't fully exist yet for demo purposes
// In production, these would be real fetch calls to the endpoints
const MOCK_DELAY = 800;

export const loginUser = async (email: string, password?: string): Promise<AuthResponse> => {
  const trustToken = getTrustToken(email);
  try {
    const response = await http.post(`${API_URL}/login`, { email, password, trustToken });
    return {
      token: response.data.token,
      refreshToken: response.data.refreshToken,
      user: response.data.userId ? {
        id: response.data.userId,
        name: response.data.name,
        email: response.data.email,
        isTwoFactorEnabled: response.data.isTwoFactorEnabled
      } : undefined as any,
      twoFactorRequired: response.data.twoFactorRequired,
      challengeToken: response.data.challengeToken,
      trustToken: response.data.trustToken
    };
  } catch (e) {
    console.warn("Real auth endpoint failed", e);
    throw e;
  }
};

export const loginWithPin = async (dto: LoginPinDto): Promise<AuthResponse> => {
  const response = await http.post(`${API_URL}/login-pin`, dto);
  return {
    token: response.data.token,
    refreshToken: response.data.refreshToken,
    user: {
      id: response.data.userId,
      name: response.data.name,
      email: response.data.email,
      isTwoFactorEnabled: response.data.isTwoFactorEnabled
    },
    trustToken: response.data.trustToken
  };
};

export const registerUser = async (name: string, email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await http.post(`${API_URL}/register`, { name, email, password });
    return {
      token: response.data.token,
      refreshToken: response.data.refreshToken,
      user: {
        id: response.data.userId,
        name: response.data.name,
        email: response.data.email,
        isTwoFactorEnabled: response.data.isTwoFactorEnabled
      }
    };
  } catch (e) {
    console.error(e);
    // Mock registration success
    throw e;
  }
};

export const verify2Fa = async (dto: Verify2FaDto): Promise<AuthResponse> => {
  const response = await http.post(`${API_URL}/verify-2fa`, dto);
  return {
    token: response.data.token,
    refreshToken: response.data.refreshToken,
    user: {
      id: response.data.userId,
      name: response.data.name,
      email: response.data.email,
      isTwoFactorEnabled: response.data.isTwoFactorEnabled
    },
    trustToken: response.data.trustToken
  };
};

export const setup2Fa = async (): Promise<TwoFactorSetupDto> => {
  const token = getStoredToken();
  const response = await http.get(`${API_URL}/setup-2fa`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const enable2Fa = async (dto: TwoFactorVerifySetupDto): Promise<boolean> => {
  const token = getStoredToken();
  const response = await http.post(`${API_URL}/enable-2fa`, dto, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.status >= 200 && response.status < 300;
};

export const disable2Fa = async (): Promise<boolean> => {
  const token = getStoredToken();
  const response = await http.post(`${API_URL}/disable-2fa`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.status >= 200 && response.status < 300;
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
  try {
    const token = getStoredToken();
    const response = await http.put(`${API_URL}/change-password`,
      { currentPassword, newPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.status >= 200 && response.status < 300;
  } catch (e) {
    console.error("Change password failed", e);
    throw e;
  }
};

export const refreshToken = async (): Promise<AuthResponse | null> => {
  const token = getStoredToken();
  const rToken = getStoredRefreshToken();
  if (!token || !rToken) return null;

  try {
    const response = await http.post(`${API_URL}/refresh`, { token, refreshToken: rToken });
    return {
      token: response.data.token,
      refreshToken: response.data.refreshToken,
      user: {
        id: response.data.userId,
        name: response.data.name,
        email: response.data.email,
        isTwoFactorEnabled: response.data.isTwoFactorEnabled
      }
    };
  } catch (e) {
    console.error("Token refresh failed", e);
    return null;
  }
};

export const setStoredAuth = (data: AuthResponse) => {
  localStorage.setItem('auth_token', data.token);
  localStorage.setItem('auth_refresh_token', data.refreshToken);
  localStorage.setItem('auth_user', JSON.stringify(data.user));
};

export const getStoredToken = () => localStorage.getItem('auth_token');
export const getStoredRefreshToken = () => localStorage.getItem('auth_refresh_token');
export const getStoredUser = () => {
  const u = localStorage.getItem('auth_user');
  return u ? JSON.parse(u) : null;
};

export const getTrustToken = (email: string) => {
  const tokens = JSON.parse(localStorage.getItem('trust_tokens') || '{}');
  return tokens[email];
};

export const setTrustToken = (email: string, token: string) => {
  const tokens = JSON.parse(localStorage.getItem('trust_tokens') || '{}');
  tokens[email] = token;
  localStorage.setItem('trust_tokens', JSON.stringify(tokens));
};

export const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_refresh_token');
  localStorage.removeItem('auth_user');
  // Clear offline cache on logout to avoid leaking data to next user
  localStorage.removeItem('zakat_vault_offline_cache');
};
