import axios from 'axios';

// Use relative URL to leverage Vite proxy (configured in vite.config.ts)
const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types - lowercase to match backend API
export type ReceiptStatus = 'draft' | 'completed' | 'paid' | 'cancelled';

export const RECEIPT_STATUS_LABELS: Record<ReceiptStatus, string> = {
  draft: 'Borrador',
  completed: 'Completado',
  paid: 'Pagado',
  cancelled: 'Cancelado',
};

export const RECEIPT_STATUS_COLORS: Record<ReceiptStatus, { bg: string; text: string }> = {
  draft: { bg: 'rgba(245, 158, 11, 0.1)', text: 'var(--color-warning)' },
  completed: { bg: 'rgba(59, 130, 246, 0.1)', text: 'var(--color-info)' },
  paid: { bg: 'rgba(34, 197, 94, 0.1)', text: 'var(--color-success)' },
  cancelled: { bg: 'rgba(239, 68, 68, 0.1)', text: 'var(--color-danger)' },
};

export interface ReceiptItem {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  total?: number;
  line_order?: number;
}

export interface ReceiptCreate {
  customer_name: string;
  customer_nit?: string;
  customer_phone?: string;
  customer_email?: string;
  date?: string;
  status?: ReceiptStatus;
  notes?: string;
  signature?: string;
  items: ReceiptItem[];
}

export interface Receipt {
  id: number;
  receipt_number: string;
  customer_name: string;
  customer_nit?: string;
  customer_phone?: string;
  customer_email?: string;
  date: string;
  status: ReceiptStatus;
  notes?: string;
  signature?: string;
  subtotal: number;
  total: number;
  items: ReceiptItem[];
  created_at: string;
  updated_at: string;
}

export interface ReceiptListItem {
  id: number;
  receipt_number: string;
  customer_name: string;
  customer_nit?: string;
  date: string;
  status: ReceiptStatus;
  total: number;
  created_at: string;
}

// API functions
export async function createReceipt(data: ReceiptCreate): Promise<Receipt> {
  const response = await api.post<Receipt>('/receipts', data);
  return response.data;
}

export interface ReceiptFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: ReceiptStatus;
  skip?: number;
  limit?: number;
}

export async function getReceipts(filters: ReceiptFilters = {}): Promise<ReceiptListItem[]> {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.dateFrom) params.append('date_from', filters.dateFrom);
  if (filters.dateTo) params.append('date_to', filters.dateTo);
  if (filters.status) params.append('status', filters.status);
  params.append('skip', (filters.skip || 0).toString());
  params.append('limit', (filters.limit || 100).toString());

  const response = await api.get<ReceiptListItem[]>(`/receipts?${params.toString()}`);
  return response.data;
}

export async function getReceipt(id: number): Promise<Receipt> {
  const response = await api.get<Receipt>(`/receipts/${id}`);
  return response.data;
}

export async function updateReceipt(id: number, data: Partial<ReceiptCreate>): Promise<Receipt> {
  const response = await api.put<Receipt>(`/receipts/${id}`, data);
  return response.data;
}

export async function deleteReceipt(id: number): Promise<void> {
  await api.delete(`/receipts/${id}`);
}
