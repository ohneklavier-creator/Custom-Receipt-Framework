import axios from 'axios';
import { getStoredToken } from './auth';

const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Types
export interface TemplateItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface Template {
  id: number;
  name: string;
  description?: string;
  customer_name?: string;
  customer_nit?: string;
  notes?: string;
  items?: TemplateItem[];
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateListItem {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface TemplateCreate {
  name: string;
  description?: string;
  customer_name?: string;
  customer_nit?: string;
  notes?: string;
  items?: TemplateItem[];
}

// API functions
export async function getTemplates(): Promise<TemplateListItem[]> {
  const token = getStoredToken();
  if (!token) {
    throw new Error('No authentication token');
  }

  const response = await api.get<TemplateListItem[]>('/templates', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function getTemplate(id: number): Promise<Template> {
  const token = getStoredToken();
  if (!token) {
    throw new Error('No authentication token');
  }

  const response = await api.get<Template>(`/templates/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function createTemplate(data: TemplateCreate): Promise<Template> {
  const token = getStoredToken();
  if (!token) {
    throw new Error('No authentication token');
  }

  const response = await api.post<Template>('/templates', data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function updateTemplate(id: number, data: Partial<TemplateCreate>): Promise<Template> {
  const token = getStoredToken();
  if (!token) {
    throw new Error('No authentication token');
  }

  const response = await api.put<Template>(`/templates/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function deleteTemplate(id: number): Promise<void> {
  const token = getStoredToken();
  if (!token) {
    throw new Error('No authentication token');
  }

  await api.delete(`/templates/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
