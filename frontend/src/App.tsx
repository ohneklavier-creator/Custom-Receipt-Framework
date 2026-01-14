import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { FileText, Search, Settings as SettingsIcon, Plus, LogOut, User } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FieldVisibilityProvider } from './context/FieldVisibilityContext';
import Settings from './pages/Settings';
import CreateReceipt from './pages/CreateReceipt';
import ReceiptList from './pages/ReceiptList';
import ReceiptDetail from './pages/ReceiptDetail';
import EditReceipt from './pages/EditReceipt';
import Login from './pages/Login';
import Register from './pages/Register';

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--surface-background)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--color-primary)' }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  // Public routes (login/register) - no nav bar
  if (['/login', '/register'].includes(location.pathname)) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface-background)' }}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 shadow-sm no-print" style={{ backgroundColor: 'var(--surface-card)', borderBottom: '1px solid var(--border-default)' }}>
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

              {/* User Menu */}
              {isAuthenticated && user && (
                <div className="flex items-center gap-2 ml-2 pl-2" style={{ borderLeft: '1px solid var(--border-default)' }}>
                  <div className="hidden sm:flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <User size={16} />
                    <span className="text-sm">{user.username}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-red-500/10"
                    style={{ color: 'var(--color-danger)' }}
                    title="Cerrar sesión"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<ProtectedRoute><ReceiptList /></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute><CreateReceipt /></ProtectedRoute>} />
          <Route path="/receipt/:id" element={<ProtectedRoute><ReceiptDetail /></ProtectedRoute>} />
          <Route path="/receipt/:id/edit" element={<ProtectedRoute><EditReceipt /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FieldVisibilityProvider>
          <AppContent />
        </FieldVisibilityProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
