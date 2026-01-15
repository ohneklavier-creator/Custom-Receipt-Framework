import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FileText, Plus, Trash2, Save, ArrowLeft, X, Check } from 'lucide-react';
import SignaturePad from 'signature_pad';
import { getReceipt, updateReceipt, Receipt, ReceiptStatus, RECEIPT_STATUS_LABELS, PaymentMethod } from '../api/receipts';
import { useFieldVisibility } from '../context/FieldVisibilityContext';
import { numberToWordsSpanish } from '../utils/numberToWords';
import { getCompanySettings } from './Settings';

interface LineItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function EditReceipt() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fieldVisibility } = useFieldVisibility();

  // Loading state
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(true);
  const [originalReceipt, setOriginalReceipt] = useState<Receipt | null>(null);

  // Form state
  const [receiptNumber, setReceiptNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerNit, setCustomerNit] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [institution, setInstitution] = useState('');
  const [concept, setConcept] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [checkNumber, setCheckNumber] = useState('');  // Check number for Cheque payments
  const [bankAccount, setBankAccount] = useState('');  // Bank account for Transferencia payments
  const [status, setStatus] = useState<ReceiptStatus>('completed');
  const [notes, setNotes] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [receivedByName, setReceivedByName] = useState('');  // Name below signature
  const [receiptDate, setReceiptDate] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  // Signature pad refs
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: 1, description: '', quantity: 1, unitPrice: 0 }
  ]);

  // Fetch receipt data
  useEffect(() => {
    const fetchReceipt = async () => {
      if (!id) return;

      setIsLoadingReceipt(true);
      try {
        const data = await getReceipt(parseInt(id));
        setOriginalReceipt(data);

        // Populate form fields
        setReceiptNumber(data.receipt_number);
        setCustomerName(data.customer_name || '');
        setCustomerNit(data.customer_nit || '');
        setCustomerPhone(data.customer_phone || '');
        setCustomerEmail(data.customer_email || '');
        setCustomerAddress(data.customer_address || '');
        setInstitution(data.institution || '');
        setConcept(data.concept || '');
        setPaymentMethod((data.payment_method as PaymentMethod) || '');
        setCheckNumber(data.check_number || '');
        setBankAccount(data.bank_account || '');
        setStatus((data.status as ReceiptStatus) || 'completed');
        setNotes(data.notes || '');
        setSignature(data.signature || null);
        setReceivedByName(data.received_by_name || '');
        setReceiptDate(data.date);

        // Populate line items
        if (data.items && data.items.length > 0) {
          setLineItems(data.items.map((item, index) => ({
            id: item.id || index + 1,
            description: item.description,
            quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity,
            unitPrice: typeof item.unit_price === 'string' ? parseFloat(item.unit_price) : item.unit_price,
          })));
        }
      } catch (err) {
        console.error('Error fetching receipt:', err);
        setError('Error al cargar el recibo.');
      } finally {
        setIsLoadingReceipt(false);
      }
    };

    fetchReceipt();
  }, [id]);

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const total = subtotal;

  // Calculate amount in words live
  const amountInWords = useMemo(() => {
    return numberToWordsSpanish(total);
  }, [total]);

  // Initialize signature pad when modal opens
  useEffect(() => {
    if (showSignaturePad && signatureCanvasRef.current) {
      const canvas = signatureCanvasRef.current;

      const resizeCanvas = () => {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const container = canvas.parentElement;
        if (container) {
          canvas.width = container.offsetWidth * ratio;
          canvas.height = container.offsetHeight * ratio;
          canvas.style.width = `${container.offsetWidth}px`;
          canvas.style.height = `${container.offsetHeight}px`;
          canvas.getContext('2d')?.scale(ratio, ratio);
        }
      };

      resizeCanvas();

      signaturePadRef.current = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
        minWidth: 2,
        maxWidth: 4,
      });

      window.addEventListener('resize', resizeCanvas);
      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, [showSignaturePad]);

  // Add new line item
  const addLineItem = () => {
    const newId = Math.max(...lineItems.map(i => i.id), 0) + 1;
    setLineItems([...lineItems, { id: newId, description: '', quantity: 1, unitPrice: 0 }]);
  };

  // Remove line item
  const removeLineItem = (itemId: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== itemId));
    }
  };

  // Update line item
  const updateLineItem = (itemId: number, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `Q${amount.toFixed(2)}`;
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle signature save
  const handleSaveSignature = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const dataUrl = signaturePadRef.current.toDataURL('image/png');
      setSignature(dataUrl);
    }
    setShowSignaturePad(false);
  };

  // Handle signature clear
  const handleClearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  // Remove saved signature
  const handleRemoveSignature = () => {
    setSignature(null);
  };

  // Handle form submission
  const handleSave = async () => {
    if (!id || !originalReceipt) return;

    // Validate required fields - customer name only required if field is visible
    if ((fieldVisibility.customer_name ?? true) && !customerName.trim()) {
      setError('El nombre del cliente es requerido');
      return;
    }

    const validItems = lineItems.filter(item => item.description.trim() !== '');
    if (validItems.length === 0) {
      setError('Debe agregar al menos un artículo con descripción');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const receiptData = {
        customer_name: customerName?.trim() || undefined,
        customer_nit: customerNit?.trim() || undefined,
        customer_phone: customerPhone?.trim() || undefined,
        customer_email: customerEmail?.trim() || undefined,
        customer_address: customerAddress?.trim() || undefined,
        institution: (fieldVisibility.institution_use_company_name ?? false)
          ? getCompanySettings().companyName
          : (institution?.trim() || undefined),
        concept: concept?.trim() || undefined,
        payment_method: paymentMethod || undefined,
        check_number: paymentMethod === 'Cheque' ? (checkNumber?.trim() || undefined) : undefined,
        bank_account: paymentMethod === 'Transferencia' ? (bankAccount?.trim() || undefined) : undefined,
        status: status,
        notes: notes?.trim() || undefined,
        signature: signature || undefined,
        received_by_name: receivedByName?.trim() || undefined,
        items: validItems.map(item => ({
          description: item.description.trim(),
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })),
      };

      await updateReceipt(parseInt(id), receiptData);

      alert(`Recibo ${receiptNumber} actualizado exitosamente!`);
      navigate(`/receipt/${id}`);
    } catch (err) {
      console.error('Error updating receipt:', err);
      setError('Error al actualizar el recibo. Por favor intente de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingReceipt) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--color-primary)' }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Cargando recibo...</p>
        </div>
      </div>
    );
  }

  if (!originalReceipt) {
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
            Recibo no encontrado
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
            to={`/receipt/${id}`}
            className="p-2 rounded-lg hover:bg-opacity-10 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            title="Cancelar"
          >
            <ArrowLeft size={24} />
          </Link>
          <FileText size={28} style={{ color: 'var(--color-primary)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Editar Recibo
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/receipt/${id}`}
            className="btn-secondary flex items-center gap-2"
          >
            <X size={18} />
            <span className="hidden sm:inline">Cancelar</span>
          </Link>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={18} />
            <span className="hidden sm:inline">{isLoading ? 'Guardando...' : 'Guardar'}</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Receipt Number, Date & Status */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Receipt Number - Non-editable */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Número de Recibo
            </label>
            <div
              className="input w-full font-mono text-lg font-bold"
              style={{
                backgroundColor: 'var(--surface-card-hover)',
                color: 'var(--color-primary)',
                cursor: 'not-allowed'
              }}
            >
              {receiptNumber}
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              No se puede modificar
            </p>
          </div>

          {/* Date - Non-editable */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Fecha
            </label>
            <div
              className="input w-full"
              style={{
                backgroundColor: 'var(--surface-card-hover)',
                cursor: 'not-allowed'
              }}
            >
              {receiptDate && formatDate(receiptDate)}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Estado
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ReceiptStatus)}
              className="input w-full"
            >
              <option value="draft">{RECEIPT_STATUS_LABELS.draft}</option>
              <option value="completed">{RECEIPT_STATUS_LABELS.completed}</option>
              <option value="paid">{RECEIPT_STATUS_LABELS.paid}</option>
              <option value="cancelled">{RECEIPT_STATUS_LABELS.cancelled}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Información del Cliente
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Name - conditional */}
          {(fieldVisibility.customer_name ?? true) && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Nombre del Cliente *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre completo o empresa"
                className="input w-full"
              />
            </div>
          )}

          {/* NIT - conditional */}
          {(fieldVisibility.customer_nit ?? true) && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                NIT
              </label>
              <input
                type="text"
                value={customerNit}
                onChange={(e) => setCustomerNit(e.target.value)}
                placeholder="Ej: 12345678-9 o CF"
                className="input w-full"
              />
            </div>
          )}

          {/* Email - conditional */}
          {fieldVisibility.customer_email && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Correo Electrónico
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="input w-full"
              />
            </div>
          )}

          {/* Address - conditional */}
          {fieldVisibility.customer_address && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Dirección
              </label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Calle, zona, ciudad"
                className="input w-full"
              />
            </div>
          )}

          {/* Institution - conditional */}
          {fieldVisibility.institution && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Institución
                {(fieldVisibility.institution_use_company_name ?? false) && (
                  <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>(auto)</span>
                )}
              </label>
              {(fieldVisibility.institution_use_company_name ?? false) ? (
                <input
                  type="text"
                  value={getCompanySettings().companyName}
                  disabled
                  className="input w-full opacity-60 cursor-not-allowed"
                  title="Auto-rellenado desde configuración"
                />
              ) : (
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Nombre de la empresa u organización"
                  className="input w-full"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Detalle del Recibo
        </h2>

        {/* Header Row */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 mb-2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          <div className="col-span-6">Descripción</div>
          <div className="col-span-2 text-center">Cantidad</div>
          <div className="col-span-2 text-right">Precio Unit.</div>
          <div className="col-span-1 text-right">Total</div>
          <div className="col-span-1"></div>
        </div>

        {/* Line Items */}
        <div className="space-y-3">
          {lineItems.map((item) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-card-hover)' }}>
              {/* Description */}
              <div className="md:col-span-6">
                <label className="block text-xs mb-1 md:hidden" style={{ color: 'var(--text-muted)' }}>Descripción</label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                  placeholder="Descripción del producto o servicio"
                  className="input w-full"
                />
              </div>

              {/* Quantity */}
              <div className="md:col-span-2">
                <label className="block text-xs mb-1 md:hidden" style={{ color: 'var(--text-muted)' }}>Cantidad</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                  className="input w-full text-center"
                />
              </div>

              {/* Unit Price */}
              <div className="md:col-span-2">
                <label className="block text-xs mb-1 md:hidden" style={{ color: 'var(--text-muted)' }}>Precio Unitario</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="input w-full text-right"
                />
              </div>

              {/* Line Total */}
              <div className="md:col-span-1 flex items-center justify-end">
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(item.quantity * item.unitPrice)}
                </span>
              </div>

              {/* Delete Button */}
              <div className="md:col-span-1 flex items-center justify-end">
                <button
                  onClick={() => removeLineItem(item.id)}
                  disabled={lineItems.length === 1}
                  className="p-2 rounded-lg transition-colors hover:bg-red-500/10"
                  style={{
                    color: lineItems.length === 1 ? 'var(--text-muted)' : 'var(--color-danger)',
                    cursor: lineItems.length === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Line Button - Below items */}
        <div className="flex justify-center mt-4">
          <button
            onClick={addLineItem}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Agregar Línea
          </button>
        </div>

        {/* Totals */}
        <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex flex-col items-end gap-2">
            <div className="flex justify-between w-full md:w-64">
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(subtotal)}
              </span>
            </div>
            <div className="flex justify-between w-full md:w-64 text-xl font-bold">
              <span style={{ color: 'var(--text-primary)' }}>Total:</span>
              <span style={{ color: 'var(--color-primary)' }}>
                {formatCurrency(total)}
              </span>
            </div>

            {/* Live Amount in Words Preview - conditional */}
            {fieldVisibility.amount_in_words && total > 0 && (
              <div className="w-full md:w-auto mt-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-card-hover)' }}>
                <div className="text-xs uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                  Cantidad en letras:
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {amountInWords}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Concept - conditional */}
      {fieldVisibility.concept && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Concepto
          </h2>
          <input
            type="text"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="Descripción del motivo del recibo (ej: Compra de materiales, Pago de servicio)"
            className="input w-full"
          />
        </div>
      )}

      {/* Payment Method - conditional */}
      {fieldVisibility.payment_method && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Forma de Pago
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value as PaymentMethod | '');
                // Clear payment detail fields when changing method
                setCheckNumber('');
                setBankAccount('');
              }}
              className="input w-full"
            >
              <option value="">-- Seleccionar forma de pago --</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Cheque">Cheque</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Otro">Otro</option>
            </select>
            {/* Check Number field - shown when Cheque is selected */}
            {paymentMethod === 'Cheque' && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Número de Cheque
                </label>
                <input
                  type="text"
                  value={checkNumber}
                  onChange={(e) => setCheckNumber(e.target.value)}
                  placeholder="Ej: 001234"
                  className="input w-full"
                />
              </div>
            )}
            {/* Bank Account field - shown when Transferencia is selected */}
            {paymentMethod === 'Transferencia' && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Número de Cuenta
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="Ej: 123-456789-01"
                  className="input w-full"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes - conditional */}
      {fieldVisibility.notes && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Notas Adicionales
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observaciones, condiciones de pago, etc."
            rows={3}
            className="input w-full resize-none"
          />
        </div>
      )}

      {/* Signature + Name + Phone Section */}
      {(fieldVisibility.signature || (fieldVisibility.received_by_name ?? true) || fieldVisibility.customer_phone) && (
        <div className="card p-6">
          {/* Signature - conditional - centered with inline label */}
          {fieldVisibility.signature && (
            <div className="mb-6">
              <div className="flex items-center justify-center gap-4">
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Firma:
                </span>
                {signature ? (
                  <div className="relative inline-block">
                    <img
                      src={signature}
                      alt="Firma"
                      className="border rounded-lg"
                      style={{ borderColor: 'var(--border-default)', maxHeight: '80px' }}
                    />
                    <button
                      onClick={handleRemoveSignature}
                      className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => setShowSignaturePad(true)}
                    className="border-2 border-dashed rounded-lg px-8 py-4 text-center cursor-pointer transition-colors hover:border-primary"
                    style={{ borderColor: 'var(--border-default)', minWidth: '200px' }}
                  >
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Toca aquí para firmar
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Name and Phone Row - Below Signature */}
          {((fieldVisibility.received_by_name ?? true) || fieldVisibility.customer_phone) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Received By Name - conditional */}
              {(fieldVisibility.received_by_name ?? true) && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={receivedByName}
                    onChange={(e) => setReceivedByName(e.target.value)}
                    placeholder="Nombre de quien recibe"
                    className="input w-full"
                  />
                </div>
              )}

              {/* Phone - conditional - moved here below name */}
              {fieldVisibility.customer_phone && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Ej: 5555-1234"
                    className="input w-full"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bottom Action Buttons (Mobile) */}
      <div className="flex gap-3 pb-6 md:hidden">
        <Link
          to={`/receipt/${id}`}
          className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3"
        >
          <X size={20} />
          Cancelar
        </Link>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
        >
          <Save size={20} />
          {isLoading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      {/* Signature Modal */}
      {showSignaturePad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-lg flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">Firmar Recibo</h3>
              <button
                onClick={() => setShowSignaturePad(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Signature Canvas - 16:9 aspect ratio */}
            <div className="p-4 bg-gray-50 flex-shrink-0">
              <div className="w-full bg-white border rounded-lg" style={{ aspectRatio: '16/9', maxHeight: '50vh' }}>
                <canvas
                  ref={signatureCanvasRef}
                  className="touch-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-4 border-t flex-shrink-0">
              <button
                onClick={handleClearSignature}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Limpiar
              </button>
              <button
                onClick={handleSaveSignature}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Check size={20} />
                Guardar Firma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
