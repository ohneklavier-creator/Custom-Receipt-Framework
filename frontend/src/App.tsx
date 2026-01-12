import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { FileText, Search, Settings as SettingsIcon, Plus } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import Settings from './pages/Settings';
import CreateReceipt from './pages/CreateReceipt';
import ReceiptList from './pages/ReceiptList';

function AppContent() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface-background)' }}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 shadow-sm" style={{ backgroundColor: 'var(--surface-card)', borderBottom: '1px solid var(--border-default)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <FileText size={24} style={{ color: 'var(--color-primary)' }} />
              <Link to="/" className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Recibos
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  color: isActive('/') ? 'var(--color-primary)' : 'var(--text-secondary)',
                  backgroundColor: isActive('/') ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                }}
              >
                <Search size={18} />
                <span className="hidden sm:inline">Lista</span>
              </Link>
              <Link
                to="/create"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Nuevo</span>
              </Link>
              <Link
                to="/settings"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  color: isActive('/settings') ? 'var(--color-primary)' : 'var(--text-secondary)',
                  backgroundColor: isActive('/settings') ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                }}
              >
                <SettingsIcon size={18} />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<ReceiptList />} />
          <Route path="/create" element={<CreateReceipt />} />
          <Route path="/receipt/:id" element={<ReceiptDetail />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

// Placeholder component - will be moved to pages/ folder
function ReceiptDetail() {
  return (
    <div className="card p-6">
      <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
        Detalle de Recibo
      </h1>
      <p style={{ color: 'var(--text-muted)' }}>Detalles del recibo aparecerán aquí...</p>
    </div>
  );
}

export default App;
