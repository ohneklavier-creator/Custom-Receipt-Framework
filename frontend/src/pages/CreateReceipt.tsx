import { useState } from 'react';
import { FileText, Plus, Trash2, Save, Printer } from 'lucide-react';

interface LineItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function CreateReceipt() {
  // Auto-generated receipt number (will come from backend later)
  const [receiptNumber] = useState('RECIBO-00000001');

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerNit, setCustomerNit] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: 1, description: '', quantity: 1, unitPrice: 0 }
  ]);

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const total = subtotal; // Can add tax calculation later

  // Add new line item
  const addLineItem = () => {
    const newId = Math.max(...lineItems.map(i => i.id), 0) + 1;
    setLineItems([...lineItems, { id: newId, description: '', quantity: 1, unitPrice: 0 }]);
  };

  // Remove line item
  const removeLineItem = (id: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  // Update line item
  const updateLineItem = (id: number, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `Q${amount.toFixed(2)}`;
  };

  // Get current date formatted
  const getCurrentDate = () => {
    return new Date().toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText size={28} style={{ color: 'var(--color-primary)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Nuevo Recibo
          </h1>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2">
            <Printer size={18} />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Save size={18} />
            <span className="hidden sm:inline">Guardar</span>
          </button>
        </div>
      </div>

      {/* Receipt Number & Date */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              Generado automáticamente
            </p>
          </div>

          {/* Date */}
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
              {getCurrentDate()}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Información del Cliente
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Name */}
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

          {/* NIT */}
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
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Ingrese CF si no tiene NIT
            </p>
          </div>

          {/* Phone */}
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

          {/* Email */}
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
        </div>
      </div>

      {/* Line Items */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Detalle del Recibo
          </h2>
          <button
            onClick={addLineItem}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Agregar Línea
          </button>
        </div>

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
          {lineItems.map((item, index) => (
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
          </div>
        </div>
      </div>

      {/* Notes */}
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

      {/* Signature Placeholder */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Firma
        </h2>
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <p style={{ color: 'var(--text-muted)' }}>
            Toca aquí para firmar
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            (Función disponible próximamente)
          </p>
        </div>
      </div>

      {/* Bottom Action Buttons (Mobile) */}
      <div className="flex gap-3 pb-6 md:hidden">
        <button className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3">
          <Printer size={20} />
          Imprimir
        </button>
        <button className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
          <Save size={20} />
          Guardar
        </button>
      </div>
    </div>
  );
}
