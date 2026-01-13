import axios from 'axios';
import { getStoredToken } from './auth';

const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Types
export interface BackupData {
  version: string;
  created_at: string;
  receipt_count: number;
  receipts: unknown[];
}

export interface ImportResult {
  message: string;
  imported: number;
  skipped: number;
  errors: { receipt_number: string; error: string }[];
  total_processed: number;
}

// API functions
export async function exportBackup(): Promise<BackupData> {
  const token = getStoredToken();
  if (!token) {
    throw new Error('No authentication token');
  }

  const response = await api.get<BackupData>('/backup/export', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function downloadBackup(): Promise<void> {
  const backup = await exportBackup();

  // Create downloadable file
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `receipts_backup_${backup.created_at.slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function importBackup(
  file: File,
  skipExisting: boolean = true
): Promise<ImportResult> {
  const token = getStoredToken();
  if (!token) {
    throw new Error('No authentication token');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<ImportResult>(
    `/backup/import?skip_existing=${skipExisting}`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
}
