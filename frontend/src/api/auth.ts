import axios from 'axios';

// Use relative URL to leverage Vite proxy
const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// Token storage
const TOKEN_KEY = 'auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// API functions
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  // OAuth2 expects form data
  const formData = new URLSearchParams();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);

  const response = await api.post<AuthResponse>('/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  // Store token
  setStoredToken(response.data.access_token);

  return response.data;
}

export async function register(data: RegisterData): Promise<User> {
  const response = await api.post<User>('/auth/register', data);
  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const token = getStoredToken();
  if (!token) {
    throw new Error('No authentication token');
  }

  const response = await api.get<User>('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function updateCurrentUser(data: Partial<{
  email: string;
  full_name: string;
  password: string;
}>): Promise<User> {
  const token = getStoredToken();
  if (!token) {
    throw new Error('No authentication token');
  }

  const response = await api.put<User>('/auth/me', data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export function logout(): void {
  clearStoredToken();
}

// Add auth header to all requests when token exists
export function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}
