// services/auth.ts
import { AuthResponse, UserProfile } from '../types';
import http from './http';

const API_URL = '/api/auth';

// Simulate API calls if backend doesn't fully exist yet for demo purposes
// In production, these would be real fetch calls to the endpoints
const MOCK_DELAY = 800;

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  // Try real endpoint first
  try {
    const response = await http.post(`${API_URL}/login`, { email, password });
    return response.data;
  } catch (e) {
    console.warn("Real auth endpoint failed, falling back to mock for demo if allowed", e);
  }

   throw new Error('Invalid credentials');
};

export const registerUser = async (name: string, email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await http.post(`${API_URL}/register`, { name, email, password });
    return response.data;
  } catch (e) {
    console.error(e);
    // Mock registration success
   throw e;
  }
};

export const getStoredToken = () => localStorage.getItem('auth_token');
export const getStoredUser = () => {
  const u = localStorage.getItem('auth_user');
  return u ? JSON.parse(u) : null;
};

export const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  // Clear offline cache on logout to avoid leaking data to next user
  localStorage.removeItem('zakat_vault_offline_cache');
};
