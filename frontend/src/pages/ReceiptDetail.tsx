import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FileText, Printer, ArrowLeft, Trash2, Edit } from 'lucide-react';
import { getReceipt, deleteReceipt, Receipt, RECEIPT_STATUS_LABELS, RECEIPT_STATUS_COLORS } from '../api/receipts';
import { printReceipt } from '../components/ReceiptPrint';
import { getCompanySettings } from './Settings';

export default function ReceiptDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch receipt
  useEffect(() => {
    const fetchReceipt = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);
      try {
        const data = await getReceipt(parseInt(id));
        setReceipt(data);
      } catch (err) {
        console.error('Error fetching receipt:', err);
        setError('Error al cargar el recibo.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReceipt();
  }, [id]);

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
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle print
  const handlePrint = () => {
    if (receipt) {
      const { companyName, companyInfo } = getCompanySettings();
      printReceipt(receipt, companyName, companyInfo);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!receipt || !confirm('¿Está seguro de eliminar este recibo? Esta acción no se puede deshacer.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteReceipt(receipt.id);
      navigate('/');
    } catch (err) {
      console.error('Error deleting receipt:', err);
      setError('Error al eliminar el recibo.');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--color-primary)' }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Cargando recibo...</p>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Link
          to="/"
          className="flex items-center gap-2 hover:underline"
          style={{ color: 'var(--color-primary)' }}
        >
          <ArrowLeft size={20} />
          Volver a la lista
        </Link>

        <div className="card p-12 text-center">
          <FileText size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            {error || 'Recibo no encontrado'}
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 rounded-lg hover:bg-opacity-10 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            title="Volver"
          >
            <ArrowLeft size={24} />
          </Link>
          <FileText size={28} style={{ color: 'var(--color-primary)' }} />
          <h1 className="text-2xl font-bold font-mono" style={{ color: 'var(--color-primary)' }}>
            {receipt.receipt_number}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="btn-secondary flex items-center gap-2 text-red-500 hover:bg-red-500/10"
          >
            <Trash2 size={18} />
            <span className="hidden sm:inline">{isDeleting ? 'Eliminando...' : 'Eliminar'}</span>
          </button>
          <Link
            to={`/receipt/${id}/edit`}
            className="btn-secondary flex items-center gap-2"
          >
            <Edit size={18} />
            <span className="hidden sm:inline">Editar</span>
          </Link>
          <button
            onClick={handlePrint}
            className="btn-primary flex items-center gap-2"
          >
            <Printer size={18} />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </div>

      {/* Receipt Details */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Receipt Info */}
          <div>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Información del Recibo
            </h2>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt style={{ color: 'var(--text-muted)' }}>Número:</dt>
                <dd className="font-mono font-bold" style={{ color: 'var(--color-primary)' }}>{receipt.receipt_number}</dd>
              </div>
              <div className="flex justify-between">
                <dt style={{ color: 'var(--text-muted)' }}>Fecha:</dt>
                <dd style={{ color: 'var(--text-primary)' }}>{formatDate(receipt.date)}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt style={{ color: 'var(--text-muted)' }}>Estado:</dt>
                <dd>
                  <span
                    className="text-sm px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: RECEIPT_STATUS_COLORS[receipt.status]?.bg || 'rgba(59, 130, 246, 0.1)',
                      color: RECEIPT_STATUS_COLORS[receipt.status]?.text || 'var(--color-info)'
                    }}
                  >
                    {RECEIPT_STATUS_LABELS[receipt.status] || receipt.status}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Customer Info */}
          <div>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Cliente
            </h2>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt style={{ color: 'var(--text-muted)' }}>Nombre:</dt>
                <dd style={{ color: 'var(--text-primary)' }}>{receipt.customer_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt style={{ color: 'var(--text-muted)' }}>NIT:</dt>
                <dd style={{ color: 'var(--text-primary)' }}>{receipt.customer_nit || 'CF'}</dd>
              </div>
              {receipt.customer_phone && (
                <div className="flex justify-between">
                  <dt style={{ color: 'var(--text-muted)' }}>Teléfono:</dt>
                  <dd style={{ color: 'var(--text-primary)' }}>{receipt.customer_phone}</dd>
                </div>
              )}
              {receipt.customer_email && (
                <div className="flex justify-between">
                  <dt style={{ color: 'var(--text-muted)' }}>Email:</dt>
                  <dd style={{ color: 'var(--text-primary)' }}>{receipt.customer_email}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Detalle
        </h2>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                <th className="text-left py-2 px-3" style={{ color: 'var(--text-muted)' }}>Descripción</th>
                <th className="text-center py-2 px-3" style={{ color: 'var(--text-muted)' }}>Cantidad</th>
                <th className="text-right py-2 px-3" style={{ color: 'var(--text-muted)' }}>P. Unitario</th>
                <th className="text-right py-2 px-3" style={{ color: 'var(--text-muted)' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item, index) => (
                <tr key={item.id || index} style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <td className="py-3 px-3" style={{ color: 'var(--text-primary)' }}>{item.description}</td>
                  <td className="py-3 px-3 text-center" style={{ color: 'var(--text-secondary)' }}>{item.quantity}</td>
                  <td className="py-3 px-3 text-right" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(item.unit_price)}</td>
                  <td className="py-3 px-3 text-right font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(item.total || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {receipt.items.map((item, index) => (
            <div key={item.id || index} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-card-hover)' }}>
              <div className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{item.description}</div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>{item.quantity} x {formatCurrency(item.unit_price)}</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(item.total || 0)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex flex-col items-end gap-2">
            <div className="flex justify-between w-full md:w-64">
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(receipt.subtotal)}
              </span>
            </div>
            <div className="flex justify-between w-full md:w-64 text-xl font-bold">
              <span style={{ color: 'var(--text-primary)' }}>Total:</span>
              <span style={{ color: 'var(--color-primary)' }}>
                {formatCurrency(receipt.total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {receipt.notes && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Notas
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>{receipt.notes}</p>
        </div>
      )}

      {/* Signature */}
      {receipt.signature && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Firma
          </h2>
          <img
            src={receipt.signature}
            alt="Firma del cliente"
            className="max-h-32 border rounded-lg"
            style={{ borderColor: 'var(--border-default)' }}
          />
        </div>
      )}

      {/* Mobile Action Buttons */}
      <div className="flex gap-3 pb-6 md:hidden">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="btn-secondary flex items-center justify-center gap-2 py-3 px-4 text-red-500"
        >
          <Trash2 size={20} />
        </button>
        <Link
          to={`/receipt/${id}/edit`}
          className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3"
        >
          <Edit size={20} />
          Editar
        </Link>
        <button
          onClick={handlePrint}
          className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
        >
          <Printer size={20} />
          Imprimir
        </button>
      </div>
    </div>
  );
}
