import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get environment variables
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // @ts-ignore - Expo injects these at build time
  return Constants.expoConfig?.extra?.[key] || process.env[key] || defaultValue;
};

const LOCAL_IP = getEnvVar('EXPO_PUBLIC_LOCAL_IP', '192.168.1.66');
const API_PORT = getEnvVar('EXPO_PUBLIC_API_PORT', '4001');

// Build API base URL based on platform
const getBaseUrl = (): string => {
  // If full URL is provided, use it
  const fullUrl = getEnvVar('EXPO_PUBLIC_API_URL');
  if (fullUrl) {
    return fullUrl;
  }

  // Otherwise, construct URL based on platform
  if (Platform.OS === 'android') {
    // Check if running on emulator or physical device
    // Emulator: use 10.0.2.2
    // Physical device: use local network IP
    const isEmulator = Constants.isDevice === false;
    const host = isEmulator ? '10.0.2.2' : LOCAL_IP;
    return `http://${host}:${API_PORT}/api`;
  }

  if (Platform.OS === 'ios') {
    // iOS simulator uses localhost
    // Physical device uses local network IP
    const isSimulator = Constants.isDevice === false;
    const host = isSimulator ? 'localhost' : LOCAL_IP;
    return `http://${host}:${API_PORT}/api`;
  }

  // Web uses localhost
  return `http://localhost:${API_PORT}/api`;
};

const API_BASE_URL = getBaseUrl();

console.log('API Base URL:', API_BASE_URL);
console.log('Platform:', Platform.OS);
console.log('Device:', Constants.isDevice ? 'Physical' : 'Simulator/Emulator');

// TypeScript interfaces
export interface User {
  id: number;
  email: string;
  name: string | null;
  tenantId: number | null;
  role?: 'OWNER' | 'ADMIN' | 'PARENT' | 'CHILD' | 'MEMBER';
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
    const authHeaders = await getAuthHeaders();

    // Merge headers: Auth < explicit options
    // We construct a temporary headers object
    const headers: any = {
      ...authHeaders,
      ...options.headers,
    };

    // If Content-Type is not set, and body is a string (likely JSON), default it.
    // If body is FormData (object), do NOT set Content-Type, let fetch handle it (boundary).
    if (!headers['Content-Type'] && typeof options.body === 'string') {
      headers['Content-Type'] = 'application/json';
    }

    try {
      console.log(`📡 ${options.method || 'GET'} ${url}`);

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          error: data.error || 'An error occurred',
        } as ApiError;
      }

      return data as T;
    } catch (error: any) {
      // Don't log expected errors (user states that are normal)
      const expectedErrors = [
        'User is not part of any family',
        'Not part of a family',
        'No family found',
      ];

      const isExpectedError = expectedErrors.some(msg =>
        error.error && error.error.includes(msg)
      );

      if (!isExpectedError) {
        console.error('❌ API Error:', error);
      }

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
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
    }
  }

  // Family endpoints
  async getFamily(): Promise<any> {
    return this.request('/family');
  }

  async updateFamily(data: { name?: string; metadata?: any }): Promise<any> {
    return this.request('/family', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async addFamilyMember(data: any): Promise<any> {
    const isFormData = data instanceof FormData;

    return this.request('/family/members', {
      method: 'POST',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' }, // Fetch handles Content-Type for FormData
      body: isFormData ? data : JSON.stringify(data),
    });
  }
  // Family Settings
  async getFamilySettings(): Promise<any> {
    return this.request('/family/settings');
  }



  // Budget endpoints
  async getBudgets(): Promise<any> {
    return this.request('/budgets');
  }

  async getBudget(id: number): Promise<any> {
    return this.request(`/budgets/${id}`);
  }

  async createBudget(data: { category: string; amount: number; period?: string }): Promise<any> {
    return this.request('/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBudget(id: number, data: any): Promise<any> {
    return this.request(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBudget(id: number): Promise<any> {
    return this.request(`/budgets/${id}`, {
      method: 'DELETE',
    });
  }

  async updateMemberPermissions(memberId: string, permissions: any): Promise<any> {
    return this.request(`/family/members/${memberId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
  }

  async updateMemberRole(memberId: string, role: string): Promise<any> {
    return this.request(`/family/members/${memberId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async removeFamilyMember(memberId: string): Promise<any> {
    return this.request(`/family/members/${memberId}`, {
      method: 'DELETE',
    });
  }

  async leaveFamily(): Promise<any> {
    return this.request('/family/leave', {
      method: 'DELETE',
    });
  }

  async deleteFamily(): Promise<any> {
    return this.request('/family', {
      method: 'DELETE',
    });
  }

  async updateFamilyProfile(name: string, avatarUri?: string | null): Promise<any> {
    const formData = new FormData();
    formData.append('name', name);

    if (avatarUri && !avatarUri.startsWith('http')) {
      const filename = avatarUri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('avatar', {
        uri: avatarUri,
        name: filename,
        type,
      } as any);
    }

    return this.request('/family/profile', {
      method: 'PUT',
      body: formData,
    });
  }

  // Transaction endpoints
  async getTransactions(params?: {
    type?: 'INCOME' | 'EXPENSE';
    startDate?: string;
    endDate?: string;
    category?: string;
    limit?: number;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request(`/transactions${query ? `?${query}` : ''}`);
  }

  async getTransactionStats(params?: { startDate?: string; endDate?: string }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const query = queryParams.toString();
    return this.request(`/transactions/stats${query ? `?${query}` : ''}`);
  }

  async createTransaction(data: {
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    category: string;
    description?: string;
    date?: string;
    paymentMethod?: string;
    notes?: string;
  }): Promise<any> {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTransaction(id: number, data: any): Promise<any> {
    return this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTransaction(id: number): Promise<any> {
    return this.request(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // Category endpoints
  async getCategories(type?: 'income' | 'expense'): Promise<any> {
    const query = type ? `?type=${type}` : '';
    return this.request(`/categories${query}`);
  }

  async createCategory(data: {
    name: string;
    type: 'income' | 'expense';
    icon?: string;
    color?: string;
  }): Promise<any> {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: number, data: any): Promise<any> {
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: number): Promise<any> {
    return this.request(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Payment Method endpoints
  async getPaymentMethods(): Promise<any> {
    return this.request('/payment-methods');
  }

  async createPaymentMethod(data: {
    name: string;
    type: string;
    details?: any;
  }): Promise<any> {
    return this.request('/payment-methods', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePaymentMethod(id: number, data: any): Promise<any> {
    return this.request(`/payment-methods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePaymentMethod(id: number): Promise<any> {
    return this.request(`/payment-methods/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard endpoints
  async getDashboard(): Promise<any> {
    return this.request('/dashboard');
  }

  async getAnalytics(period?: 'week' | 'month' | 'year'): Promise<any> {
    const query = period ? `?period=${period}` : '';
    return this.request(`/dashboard/analytics${query}`);
  }

  // Goals endpoints
  async getGoals(): Promise<any> {
    return this.request('/goals');
  }

  async getGoal(id: number): Promise<any> {
    return this.request(`/goals/${id}`);
  }

  async createGoal(data: {
    name: string;
    description?: string;
    targetAmount: number;
    currentAmount?: number;
    targetDate?: string;
    monthlyContribution?: number;
    assignedUserId?: number;
  }): Promise<any> {
    return this.request('/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async contributeToGoal(goalId: number, amount: number, description?: string): Promise<any> {
    return this.request(`/goals/${goalId}/contribute`, {
      method: 'POST',
      body: JSON.stringify({ amount, description }),
    });
  }

  async updateGoal(id: number, data: any): Promise<any> {
    return this.request(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGoal(id: number): Promise<any> {
    return this.request(`/goals/${id}`, {
      method: 'DELETE',
    });
  }

  getImageUrl(path: string | null | undefined): string | undefined {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    // Remove /api suffix to get root URL
    const rootUrl = this.baseUrl.endsWith('/api')
      ? this.baseUrl.slice(0, -4)
      : this.baseUrl;
    return `${rootUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }
}

export const apiService = new ApiService(API_BASE_URL);
export default apiService;