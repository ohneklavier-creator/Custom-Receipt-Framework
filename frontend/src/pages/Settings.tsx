import { Sun, Moon, Settings as SettingsIcon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon size={24} style={{ color: 'var(--text-primary)' }} />
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Configuración
        </h1>
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
