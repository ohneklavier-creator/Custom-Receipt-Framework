import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Eye, Printer, RefreshCw, Calendar, X } from 'lucide-react';
import { getReceipts, getReceipt, ReceiptListItem, ReceiptFilters, ReceiptStatus, RECEIPT_STATUS_LABELS, RECEIPT_STATUS_COLORS } from '../api/receipts';
import { printReceipt } from '../components/ReceiptPrint';
import { getCompanySettings } from './Settings';

export default function ReceiptList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ReceiptStatus | ''>('');
  const [receipts, setReceipts] = useState<ReceiptListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch receipts from API
  const fetchReceipts = useCallback(async (filters: ReceiptFilters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getReceipts(filters);
      setReceipts(data);
    } catch (err) {
      console.error('Error fetching receipts:', err);
      setError('Error al cargar los recibos. Por favor intente de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  // Debounced search/filter
  useEffect(() => {
    const timer = setTimeout(() => {
      const filters: ReceiptFilters = {};
      if (searchQuery) filters.search = searchQuery;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
      if (statusFilter) filters.status = statusFilter;
      fetchReceipts(filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, dateFrom, dateTo, statusFilter, fetchReceipts]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('');
  };

  const hasActiveFilters = searchQuery || dateFrom || dateTo || statusFilter;

  // Format currency
  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `Q${num.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate total
  const totalAmount = receipts.reduce((sum, r) => {
    const amount = typeof r.total === 'string' ? parseFloat(r.total) : r.total;
    return sum + amount;
  }, 0);

  // Handle print from list
  const handlePrint = async (receiptId: number) => {
    try {
      const fullReceipt = await getReceipt(receiptId);
      const { companyName, companyInfo } = getCompanySettings();
      printReceipt(fullReceipt, companyName, companyInfo);
    } catch (err) {
      console.error('Error printing receipt:', err);
      alert('Error al cargar el recibo para imprimir');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText size={28} style={{ color: 'var(--color-primary)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Recibos
          </h1>
          <button
            onClick={() => fetchReceipts({ search: searchQuery || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-opacity-10 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            title="Actualizar"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Search and Filter Toggle */}
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por número, nombre o NIT..."
            className="input w-full sm:w-64"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${showFilters || hasActiveFilters ? 'bg-blue-500/10' : ''}`}
            style={{ color: showFilters || hasActiveFilters ? 'var(--color-primary)' : 'var(--text-muted)' }}
            title="Filtros de fecha"
          >
            <Calendar size={20} />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Desde
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input w-full"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Hasta
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input w-full"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ReceiptStatus | '')}
                className="input w-full"
              >
                <option value="">Todos</option>
                <option value="draft">{RECEIPT_STATUS_LABELS.draft}</option>
                <option value="completed">{RECEIPT_STATUS_LABELS.completed}</option>
                <option value="paid">{RECEIPT_STATUS_LABELS.paid}</option>
                <option value="cancelled">{RECEIPT_STATUS_LABELS.cancelled}</option>
              </select>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="btn-secondary flex items-center gap-2"
              >
                <X size={16} />
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {isLoading ? (
          'Cargando...'
        ) : (
          `${receipts.length} ${receipts.length === 1 ? 'recibo encontrado' : 'recibos encontrados'}`
        )}
      </div>

      {/* Loading State */}
      {isLoading && receipts.length === 0 && (
        <div className="card p-12 text-center">
          <RefreshCw size={48} className="mx-auto mb-4 animate-spin" style={{ color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-muted)' }}>Cargando recibos...</p>
        </div>
      )}

      {/* Receipt List */}
      {!isLoading && (
        <div className="space-y-3">
          {receipts.map((receipt) => (
            <div
              key={receipt.id}
              className="card p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Main Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span
                      className="font-mono font-bold text-sm"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {receipt.receipt_number}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: RECEIPT_STATUS_COLORS[receipt.status]?.bg || 'rgba(59, 130, 246, 0.1)',
                        color: RECEIPT_STATUS_COLORS[receipt.status]?.text || 'var(--color-info)'
                      }}
                    >
                      {RECEIPT_STATUS_LABELS[receipt.status] || receipt.status}
                    </span>
                  </div>

                  <div className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {receipt.customer_name}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {receipt.customer_nit && (
                      <>
                        <span>NIT: {receipt.customer_nit}</span>
                        <span>•</span>
                      </>
                    )}
                    <span>{formatDate(receipt.date)}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Total</div>
                    <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(receipt.total)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/receipt/${receipt.id}`}
                      className="p-2 rounded-lg transition-colors hover:bg-opacity-10"
                      style={{ color: 'var(--color-primary)' }}
                      title="Ver detalle"
                    >
                      <Eye size={20} />
                    </Link>
                    <button
                      onClick={() => handlePrint(receipt.id)}
                      className="p-2 rounded-lg transition-colors hover:bg-opacity-10"
                      style={{ color: 'var(--text-secondary)' }}
                      title="Imprimir"
                    >
                      <Printer size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {receipts.length === 0 && !isLoading && (
            <div className="card p-12 text-center">
              <FileText size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                No se encontraron recibos
              </h3>
              <p style={{ color: 'var(--text-muted)' }}>
                {searchQuery
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Crea tu primer recibo haciendo clic en "Nuevo"'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Summary Footer */}
      {receipts.length > 0 && !isLoading && (
        <div className="card p-4">
          <div className="flex justify-between items-center">
            <span style={{ color: 'var(--text-secondary)' }}>
              Total de {receipts.length} recibos mostrados:
            </span>
            <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
