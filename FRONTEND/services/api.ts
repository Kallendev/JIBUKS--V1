import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use your local network IP for physical devices
// Use 10.0.2.2 for Android emulator, localhost for iOS simulator
const getBaseUrl = () => {
  // For physical devices, use your local network IP
  const LOCAL_IP = '192.168.0.102';
  const PORT = '4001';
  
  if (Platform.OS === 'android') {
    // Use local IP for physical device, 10.0.2.2 for emulator
    return `http://${LOCAL_IP}:${PORT}/api`;
  }
  // iOS and web
  return `http://${LOCAL_IP}:${PORT}/api`;
};

const API_BASE_URL = getBaseUrl();

// TypeScript interfaces
export interface User {
  id: number;
  email: string;
  name: string | null;
  tenantId: number | null;
  avatarUrl?: string;
  createdAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiError {
  error: string;
}

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// API Service
class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await getAuthHeaders();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          error: data.error || 'An error occurred',
        } as ApiError;
      }

      return data as T;
    } catch (error: any) {
      if (error.error) {
        throw error as ApiError;
      }
      throw {
        error: error.message || 'Network error. Please check your connection.',
      } as ApiError;
    }
  }

  // Authentication endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Store tokens
    if (response.accessToken) {
      await AsyncStorage.setItem('authToken', response.accessToken);
      await AsyncStorage.setItem('refreshToken', response.refreshToken);
    }

    return response;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Store tokens
    if (response.accessToken) {
      await AsyncStorage.setItem('authToken', response.accessToken);
      await AsyncStorage.setItem('refreshToken', response.refreshToken);
    }

    return response;
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me', {
      method: 'GET',
    });
  }

  async refreshToken(): Promise<{ accessToken: string }> {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    
    const response = await this.request<{ accessToken: string }>('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    // Update access token
    if (response.accessToken) {
      await AsyncStorage.setItem('authToken', response.accessToken);
    }

    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } finally {
      // Always remove tokens, even if request fails
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
    }
  }
}

// Export singleton instance
export const apiService = new ApiService(API_BASE_URL);
export default apiService;
