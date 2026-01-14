import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSettings, updateSettings, FieldVisibilitySettings } from '../api/settings';

const defaultFieldVisibility: FieldVisibilitySettings = {
  customer_address: true,
  customer_phone: true,
  customer_email: true,
  institution: true,
  amount_in_words: true,
  concept: true,
  payment_method: true,
  notes: true,
  signature: true,
  line_items: true,
  line_items_in_print: true,
};

interface FieldVisibilityContextType {
  fieldVisibility: FieldVisibilitySettings;
  isLoading: boolean;
  updateFieldVisibility: (fields: Partial<FieldVisibilitySettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const FieldVisibilityContext = createContext<FieldVisibilityContextType | undefined>(undefined);

interface FieldVisibilityProviderProps {
  children: ReactNode;
}

export function FieldVisibilityProvider({ children }: FieldVisibilityProviderProps) {
  const [fieldVisibility, setFieldVisibility] = useState<FieldVisibilitySettings>(defaultFieldVisibility);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = async () => {
    console.log('=== CONTEXT: loadSettings START ===');
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('auth_token');
      console.log('CONTEXT loadSettings: Token exists?', !!token);

      if (!token) {
        console.log('CONTEXT loadSettings: No token found, using default field visibility');
        setFieldVisibility(defaultFieldVisibility);
        setIsLoading(false);
        return;
      }

      console.log('CONTEXT loadSettings: Token found, fetching settings from API');
      const settings = await getSettings();
      console.log('CONTEXT loadSettings: Loaded settings:', settings);

      if (settings.field_visibility) {
        console.log('CONTEXT loadSettings: Setting field visibility from API:', settings.field_visibility);
        setFieldVisibility(settings.field_visibility);
      } else {
        console.log('CONTEXT loadSettings: No field_visibility in response, using defaults');
        setFieldVisibility(defaultFieldVisibility);
      }
    } catch (error) {
      console.error('=== CONTEXT loadSettings: ERROR ===');
      console.error('CONTEXT loadSettings: Error loading settings:', error);
      // Keep default settings on error
      console.log('CONTEXT loadSettings: Using default field visibility due to error');
      setFieldVisibility(defaultFieldVisibility);
    } finally {
      console.log('CONTEXT loadSettings: Setting isLoading to false');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateFieldVisibility = async (fields: Partial<FieldVisibilitySettings>) => {
    console.log('=== CONTEXT: updateFieldVisibility START ===');
    console.log('CONTEXT: Received fields to update:', fields);
    console.log('CONTEXT: Current fieldVisibility state:', fieldVisibility);

    try {
      const updated = { ...fieldVisibility, ...fields };
      console.log('CONTEXT: Merged field visibility:', updated);

      console.log('CONTEXT: Calling updateSettings API with:', { field_visibility: updated });
      const result = await updateSettings({ field_visibility: updated });
      console.log('CONTEXT: API response:', result);

      console.log('CONTEXT: Setting new field visibility state');
      setFieldVisibility(updated);
      console.log('=== CONTEXT: updateFieldVisibility SUCCESS ===');
    } catch (error) {
      console.error('=== CONTEXT: updateFieldVisibility ERROR ===');
      console.error('CONTEXT: Error object:', error);
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as any;
        console.error('CONTEXT: Axios error status:', axiosError.response?.status);
        console.error('CONTEXT: Axios error data:', axiosError.response?.data);
        console.error('CONTEXT: Axios error config URL:', axiosError.config?.url);
        console.error('CONTEXT: Axios error config method:', axiosError.config?.method);
        console.error('CONTEXT: Axios error config headers:', axiosError.config?.headers);
      }
      throw error;
    }
  };

  const refreshSettings = async () => {
    setIsLoading(true);
    await loadSettings();
  };

  return (
    <FieldVisibilityContext.Provider
      value={{ fieldVisibility, isLoading, updateFieldVisibility, refreshSettings }}
    >
      {children}
    </FieldVisibilityContext.Provider>
  );
}

export function useFieldVisibility() {
  const context = useContext(FieldVisibilityContext);
  if (!context) {
    throw new Error('useFieldVisibility must be used within FieldVisibilityProvider');
  }
  return context;
}
