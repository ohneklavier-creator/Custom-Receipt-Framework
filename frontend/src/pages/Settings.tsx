import { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Settings as SettingsIcon, Building2, Save, Download, Upload, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { downloadBackup, importBackup, ImportResult } from '../api/backup';
import { useFieldVisibility } from '../context/FieldVisibilityContext';
import { updateSettings } from '../api/settings';

// Company settings storage helpers
export function getCompanySettings() {
  const stored = localStorage.getItem('companySettings');
  if (stored) {
    return JSON.parse(stored);
  }
  return {
    companyName: 'EMPRESA',
    companyInfo: 'Dirección de la empresa | Tel: 0000-0000',
  };
}

export function saveCompanySettings(settings: { companyName: string; companyInfo: string }) {
  localStorage.setItem('companySettings', JSON.stringify(settings));
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { fieldVisibility, updateFieldVisibility } = useFieldVisibility();

  // Company settings state
  const [companyName, setCompanyName] = useState('');
  const [companyInfo, setCompanyInfo] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Backup state
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load company settings on mount
  useEffect(() => {
    const settings = getCompanySettings();
    setCompanyName(settings.companyName);
    setCompanyInfo(settings.companyInfo);
  }, []);

  // Save company settings
  const handleSaveCompany = async () => {
    setIsSaving(true);
    try {
      await updateSettings({ company_name: companyName, company_info: companyInfo });
      saveCompanySettings({ companyName, companyInfo });
      setSaveMessage('Configuración guardada');
    } catch (error) {
      console.error('Error saving company settings:', error);
      setSaveMessage('Error al guardar');
    } finally {
      setTimeout(() => {
        setIsSaving(false);
        setSaveMessage(null);
      }, 2000);
    }
  };

  // Handle field visibility toggle
  const handleFieldToggle = async (field: keyof typeof fieldVisibility, value: boolean) => {
    console.log('=== SETTINGS PAGE: handleFieldToggle START ===');
    console.log('Field:', field);
    console.log('New value:', value);
    console.log('Current fieldVisibility:', fieldVisibility);

    try {
      console.log('Calling updateFieldVisibility...');
      await updateFieldVisibility({ [field]: value } as any);
      console.log('=== SETTINGS PAGE: handleFieldToggle SUCCESS ===');
    } catch (error) {
      console.error('=== SETTINGS PAGE: handleFieldToggle ERROR ===');
      console.error('Error object:', error);
      console.error('Error type:', typeof error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as any;
        console.error('Axios error response:', axiosError.response);
        console.error('Axios error status:', axiosError.response?.status);
        console.error('Axios error data:', axiosError.response?.data);
        console.error('Axios error headers:', axiosError.response?.headers);
      }
      alert('Error al actualizar la visibilidad del campo');
    }
  };

  // Handle backup export
  const handleExport = async () => {
    setIsExporting(true);
    setBackupMessage(null);
    setImportResult(null);
    try {
      await downloadBackup();
      setBackupMessage({ type: 'success', text: 'Respaldo descargado exitosamente' });
    } catch (error) {
      console.error('Export failed:', error);
      setBackupMessage({ type: 'error', text: 'Error al exportar el respaldo' });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle file selection for import
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setBackupMessage(null);
    setImportResult(null);

    try {
      const result = await importBackup(file, true);
      setImportResult(result);
      setBackupMessage({
        type: result.errors.length > 0 ? 'error' : 'success',
        text: `Importación completada: ${result.imported} importados, ${result.skipped} omitidos`
      });
    } catch (error: unknown) {
      console.error('Import failed:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string } } };
        setBackupMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error al importar el respaldo' });
      } else {
        setBackupMessage({ type: 'error', text: 'Error al importar el respaldo' });
      }
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon size={24} style={{ color: 'var(--text-primary)' }} />
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Configuración
        </h1>
      </div>

      {/* Company Settings Card */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={20} style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Datos de la Empresa
          </h2>
        </div>

        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Esta información aparecerá en el encabezado de los recibos impresos.
        </p>

        <div className="space-y-4">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Nombre de la Empresa
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ej: Mi Empresa, S.A."
              className="input w-full"
            />
          </div>

          {/* Company Info */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Información Adicional
            </label>
            <textarea
              value={companyInfo}
              onChange={(e) => setCompanyInfo(e.target.value)}
              placeholder="Dirección, teléfono, NIT de la empresa..."
              rows={2}
              className="input w-full resize-none"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Tip: Usa | para separar líneas (ej: Zona 10 | Tel: 2222-3333 | NIT: 123456-7)
            </p>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveCompany}
              disabled={isSaving}
              className="btn-primary flex items-center gap-2"
            >
              <Save size={18} />
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
            {saveMessage && (
              <span className="text-sm" style={{ color: 'var(--color-success)' }}>
                {saveMessage}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Field Visibility Card */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Eye size={20} style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Campos del Recibo
          </h2>
        </div>

        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Controla qué campos aparecen en los formularios y en la impresión de recibos.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Customer Address */}
          <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors" style={{ backgroundColor: 'var(--surface-card-hover)' }}>
            <input
              type="checkbox"
              checked={fieldVisibility.customer_address}
              onChange={(e) => handleFieldToggle('customer_address', e.target.checked)}
              className="w-5 h-5 cursor-pointer"
            />
            <div className="flex-1">
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Dirección del Cliente</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>DIRECCION</div>
            </div>
          </label>

          {/* Customer Phone */}
          <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors" style={{ backgroundColor: 'var(--surface-card-hover)' }}>
            <input
              type="checkbox"
              checked={fieldVisibility.customer_phone}
              onChange={(e) => handleFieldToggle('customer_phone', e.target.checked)}
              className="w-5 h-5 cursor-pointer"
            />
            <div className="flex-1">
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Teléfono</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>TELEFONO</div>
            </div>
          </label>

          {/* Customer Email */}
          <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors" style={{ backgroundColor: 'var(--surface-card-hover)' }}>
            <input
              type="checkbox"
              checked={fieldVisibility.customer_email}
              onChange={(e) => handleFieldToggle('customer_email', e.target.checked)}
              className="w-5 h-5 cursor-pointer"
            />
            <div className="flex-1">
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Correo Electrónico</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>EMAIL</div>
            </div>
          </label>

          {/* Institution */}
          <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors" style={{ backgroundColor: 'var(--surface-card-hover)' }}>
            <input
              type="checkbox"
              checked={fieldVisibility.institution}
              onChange={(e) => handleFieldToggle('institution', e.target.checked)}
              className="w-5 h-5 cursor-pointer"
            />
            <div className="flex-1">
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Institución</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>INSTITUCION</div>
            </div>
          </label>

          {/* Amount in Words */}
          <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors" style={{ backgroundColor: 'var(--surface-card-hover)' }}>
            <input
              type="checkbox"
              checked={fieldVisibility.amount_in_words}
              onChange={(e) => handleFieldToggle('amount_in_words', e.target.checked)}
              className="w-5 h-5 cursor-pointer"
            />
            <div className="flex-1">
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Cantidad en Letras</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>CANTIDAD DE LETRAS</div>
            </div>
          </label>

          {/* Concept */}
          <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors" style={{ backgroundColor: 'var(--surface-card-hover)' }}>
            <input
              type="checkbox"
              checked={fieldVisibility.concept}
              onChange={(e) => handleFieldToggle('concept', e.target.checked)}
              className="w-5 h-5 cursor-pointer"
            />
            <div className="flex-1">
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Concepto</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>CONCEPTO</div>
            </div>
          </label>

          {/* Payment Method */}
          <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors" style={{ backgroundColor: 'var(--surface-card-hover)' }}>
            <input
              type="checkbox"
              checked={fieldVisibility.payment_method}
              onChange={(e) => handleFieldToggle('payment_method', e.target.checked)}
              className="w-5 h-5 cursor-pointer"
            />
            <div className="flex-1">
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Forma de Pago</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>FORMA DE PAGO</div>
            </div>
          </label>

          {/* Notes */}
          <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors" style={{ backgroundColor: 'var(--surface-card-hover)' }}>
            <input
              type="checkbox"
              checked={fieldVisibility.notes}
              onChange={(e) => handleFieldToggle('notes', e.target.checked)}
              className="w-5 h-5 cursor-pointer"
            />
            <div className="flex-1">
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Notas</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>NOTAS</div>
            </div>
          </label>

          {/* Signature */}
          <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors" style={{ backgroundColor: 'var(--surface-card-hover)' }}>
            <input
              type="checkbox"
              checked={fieldVisibility.signature}
              onChange={(e) => handleFieldToggle('signature', e.target.checked)}
              className="w-5 h-5 cursor-pointer"
            />
            <div className="flex-1">
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Firma</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>FIRMA</div>
            </div>
          </label>

          {/* Line Items (form) */}
          <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors" style={{ backgroundColor: 'var(--surface-card-hover)' }}>
            <input
              type="checkbox"
              checked={fieldVisibility.line_items ?? true}
              onChange={(e) => handleFieldToggle('line_items', e.target.checked)}
              className="w-5 h-5 cursor-pointer"
            />
            <div className="flex-1">
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Detalle del Recibo</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Sección de artículos/líneas en formulario</div>
            </div>
          </label>

          {/* Line Items in Print */}
          <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors" style={{ backgroundColor: 'var(--surface-card-hover)' }}>
            <input
              type="checkbox"
              checked={fieldVisibility.line_items_in_print}
              onChange={(e) => handleFieldToggle('line_items_in_print', e.target.checked)}
              className="w-5 h-5 cursor-pointer"
            />
            <div className="flex-1">
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Tabla de Artículos en Impresión</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Mostrar desglose de artículos al imprimir</div>
            </div>
          </label>
        </div>
      </div>

      {/* Appearance Card */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Apariencia
        </h2>

        <div className="space-y-4">
          <div>
            <div className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Tema
            </div>
            <div className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
              Selecciona el tema de la interfaz
            </div>
          </div>

          <div className="flex gap-4">
            {/* Light Theme Button */}
            <button
              onClick={() => setTheme('light')}
              className="flex-1 flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all"
              style={{
                borderColor: theme === 'light' ? 'var(--color-primary)' : 'var(--border-default)',
                backgroundColor: theme === 'light' ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
              }}
            >
              <div
                className="p-3 rounded-full"
                style={{
                  backgroundColor: theme === 'light' ? 'rgba(37, 99, 235, 0.2)' : 'var(--surface-card-hover)',
                }}
              >
                <Sun
                  size={24}
                  style={{
                    color: theme === 'light' ? 'var(--color-primary)' : 'var(--text-muted)',
                  }}
                />
              </div>
              <span
                className="font-medium"
                style={{
                  color: theme === 'light' ? 'var(--color-primary)' : 'var(--text-secondary)',
                }}
              >
                Claro
              </span>
            </button>

            {/* Dark Theme Button */}
            <button
              onClick={() => setTheme('dark')}
              className="flex-1 flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all"
              style={{
                borderColor: theme === 'dark' ? 'var(--color-primary)' : 'var(--border-default)',
                backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              }}
            >
              <div
                className="p-3 rounded-full"
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'var(--surface-card-hover)',
                }}
              >
                <Moon
                  size={24}
                  style={{
                    color: theme === 'dark' ? 'var(--color-primary)' : 'var(--text-muted)',
                  }}
                />
              </div>
              <span
                className="font-medium"
                style={{
                  color: theme === 'dark' ? 'var(--color-primary)' : 'var(--text-secondary)',
                }}
              >
                Oscuro
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Backup & Restore Card */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Download size={20} style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Respaldo y Restauración
          </h2>
        </div>

        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Exporta o importa todos los recibos en formato JSON.
        </p>

        {/* Backup Message */}
        {backupMessage && (
          <div
            className={`flex items-center gap-2 p-4 mb-4 rounded-lg ${
              backupMessage.type === 'success'
                ? 'bg-green-500/10 border border-green-500/20'
                : 'bg-red-500/10 border border-red-500/20'
            }`}
          >
            {backupMessage.type === 'success' ? (
              <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
            ) : (
              <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
            )}
            <p className={backupMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}>
              {backupMessage.text}
            </p>
          </div>
        )}

        {/* Import Result Details */}
        {importResult && importResult.errors.length > 0 && (
          <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="font-medium text-red-500 mb-2">Errores durante la importación:</p>
            <ul className="text-sm text-red-400 space-y-1">
              {importResult.errors.slice(0, 5).map((err, idx) => (
                <li key={idx}>• {err.receipt_number}: {err.error}</li>
              ))}
              {importResult.errors.length > 5 && (
                <li>• ... y {importResult.errors.length - 5} errores más</li>
              )}
            </ul>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="btn-primary flex items-center justify-center gap-2 flex-1"
          >
            <Download size={18} />
            {isExporting ? 'Exportando...' : 'Exportar Respaldo'}
          </button>

          {/* Import Button */}
          <label
            className={`btn-secondary flex items-center justify-center gap-2 flex-1 cursor-pointer ${
              isImporting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Upload size={18} />
            {isImporting ? 'Importando...' : 'Importar Respaldo'}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileSelect}
              disabled={isImporting}
              className="hidden"
            />
          </label>
        </div>

        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          Nota: Al importar, los recibos existentes (por número) se omiten por defecto.
        </p>
      </div>

      {/* App Info Card */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Información
        </h2>
        <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <p><strong>Aplicación:</strong> Custom Receipt Framework</p>
          <p><strong>Versión:</strong> 0.1.0</p>
          <p><strong>Formato de Recibo:</strong> RECIBO-00000001</p>
        </div>
      </div>
    </div>
  );
}
