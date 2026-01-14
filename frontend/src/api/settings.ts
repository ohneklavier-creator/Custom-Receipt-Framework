import axios from 'axios';

// Always use relative URL - works for both localhost and Cloudflare tunnel
const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token interceptor
api.interceptors.request.use((config) => {
  console.log('=== AXIOS INTERCEPTOR: Request ===');
  console.log('Interceptor: URL:', config.url);
  console.log('Interceptor: Method:', config.method);
  console.log('Interceptor: BaseURL:', config.baseURL);

  const token = localStorage.getItem('auth_token');
  console.log('Interceptor: Token exists:', !!token);
  console.log('Interceptor: Token length:', token?.length);
  console.log('Interceptor: Token preview:', token?.substring(0, 20) + '...');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Interceptor: Authorization header set');
  } else {
    console.warn('Interceptor: NO TOKEN FOUND IN LOCALSTORAGE!');
  }

  console.log('Interceptor: Final headers:', config.headers);
  return config;
}, (error) => {
  console.error('=== AXIOS INTERCEPTOR: Request Error ===');
  console.error('Interceptor error:', error);
  return Promise.reject(error);
});

// Add response interceptor for better error logging
api.interceptors.response.use(
  (response) => {
    console.log('=== AXIOS INTERCEPTOR: Response Success ===');
    console.log('Interceptor: Status:', response.status);
    console.log('Interceptor: URL:', response.config.url);
    return response;
  },
  (error) => {
    console.error('=== AXIOS INTERCEPTOR: Response Error ===');
    console.error('Interceptor: Error status:', error.response?.status);
    console.error('Interceptor: Error data:', error.response?.data);
    console.error('Interceptor: Error URL:', error.config?.url);
    return Promise.reject(error);
  }
);

export interface FieldVisibilitySettings {
  customer_address: boolean;
  customer_phone: boolean;
  customer_email: boolean;
  institution: boolean;
  amount_in_words: boolean;
  concept: boolean;
  payment_method: boolean;
  notes: boolean;
  signature: boolean;
  line_items: boolean;  // Controls line items section in form
  line_items_in_print: boolean;  // Controls line items table in print
}

export interface Settings {
  id: number;
  company_name?: string;
  company_info?: string;
  field_visibility?: FieldVisibilitySettings;
}

export interface SettingsUpdate {
  company_name?: string;
  company_info?: string;
  field_visibility?: FieldVisibilitySettings;
}

export async function getSettings(): Promise<Settings> {
  console.log('=== API: getSettings START ===');
  console.log('API: Making GET request to /settings');
  const response = await api.get('/settings');
  console.log('API: getSettings response:', response.data);
  console.log('=== API: getSettings SUCCESS ===');
  return response.data;
}

export async function updateSettings(data: SettingsUpdate): Promise<Settings> {
  console.log('=== API: updateSettings START ===');
  console.log('API: Request data:', data);
  console.log('API: Making PUT request to /settings');
  console.log('API: Full axios config:', {
    baseURL: api.defaults.baseURL,
    url: '/settings',
    method: 'PUT',
    data: data
  });

  try {
    const response = await api.put('/settings', data);
    console.log('API: updateSettings response status:', response.status);
    console.log('API: updateSettings response data:', response.data);
    console.log('=== API: updateSettings SUCCESS ===');
    return response.data;
  } catch (error) {
    console.error('=== API: updateSettings ERROR ===');
    console.error('API: Error in updateSettings:', error);
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const axiosError = error as any;
      console.error('API: Response status:', axiosError.response?.status);
      console.error('API: Response data:', axiosError.response?.data);
      console.error('API: Request URL:', axiosError.config?.url);
      console.error('API: Request method:', axiosError.config?.method);
      console.error('API: Request data:', axiosError.config?.data);
    }
    throw error;
  }
}
