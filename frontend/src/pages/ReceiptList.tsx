import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, FileText, Eye, Printer, MoreVertical } from 'lucide-react';

// Mock data for testing
const mockReceipts = [
  {
    id: '1',
    receiptNumber: 'RECIBO-00000005',
    customerName: 'María García López',
    customerNit: '12345678-9',
    date: '2026-01-12',
    total: 1250.00,
    status: 'completed',
    itemCount: 3,
  },
  {
    id: '2',
    receiptNumber: 'RECIBO-00000004',
    customerName: 'Comercial El Éxito, S.A.',
    customerNit: '98765432-1',
    date: '2026-01-11',
    total: 4875.50,
    status: 'completed',
    itemCount: 7,
  },
  {
    id: '3',
    receiptNumber: 'RECIBO-00000003',
    customerName: 'Juan Carlos Méndez',
    customerNit: 'CF',
    date: '2026-01-10',
    total: 350.00,
    status: 'completed',
    itemCount: 1,
  },
  {
    id: '4',
    receiptNumber: 'RECIBO-00000002',
    customerName: 'Distribuidora La Central',
    customerNit: '55667788-0',
    date: '2026-01-09',
    total: 12340.75,
    status: 'completed',
    itemCount: 12,
  },
  {
    id: '5',
    receiptNumber: 'RECIBO-00000001',
    customerName: 'Pedro Ramírez',
    customerNit: 'CF',
    date: '2026-01-08',
    total: 525.00,
    status: 'completed',
    itemCount: 2,
  },
];

export default function ReceiptList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [receipts] = useState(mockReceipts);

  // Filter receipts based on search
  const filteredReceipts = receipts.filter(receipt =>
    receipt.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    receipt.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    receipt.customerNit.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return `Q${amount.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText size={28} style={{ color: 'var(--color-primary)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Recibos
          </h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por número, nombre o NIT..."
            className="input pl-11 w-full sm:w-80"
          />
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {filteredReceipts.length} {filteredReceipts.length === 1 ? 'recibo encontrado' : 'recibos encontrados'}
      </div>

      {/* Receipt List */}
      <div className="space-y-3">
        {filteredReceipts.map((receipt) => (
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
                    {receipt.receiptNumber}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      color: 'var(--color-success)'
                    }}
                  >
                    Completado
                  </span>
                </div>

                <div className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {receipt.customerName}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <span>NIT: {receipt.customerNit}</span>
                  <span>•</span>
                  <span>{formatDate(receipt.date)}</span>
                  <span>•</span>
                  <span>{receipt.itemCount} {receipt.itemCount === 1 ? 'artículo' : 'artículos'}</span>
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
                    className="p-2 rounded-lg transition-colors hover:bg-opacity-10"
                    style={{ color: 'var(--text-secondary)' }}
                    title="Imprimir"
                  >
                    <Printer size={20} />
                  </button>
                  <button
                    className="p-2 rounded-lg transition-colors hover:bg-opacity-10"
                    style={{ color: 'var(--text-muted)' }}
                    title="Más opciones"
                  >
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {filteredReceipts.length === 0 && (
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

      {/* Summary Footer */}
      {filteredReceipts.length > 0 && (
        <div className="card p-4">
          <div className="flex justify-between items-center">
            <span style={{ color: 'var(--text-secondary)' }}>
              Total de {filteredReceipts.length} recibos mostrados:
            </span>
            <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
              {formatCurrency(filteredReceipts.reduce((sum, r) => sum + r.total, 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
