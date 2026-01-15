import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Trash2, Save, Printer, X, Check, FileStack, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import SignaturePad from 'signature_pad';
import { createReceipt, ReceiptStatus, RECEIPT_STATUS_LABELS, PAYMENT_METHODS, PaymentMethod, Receipt } from '../api/receipts';
import { printReceipt } from '../components/ReceiptPrint';
import { getTemplates, getTemplate, createTemplate, TemplateListItem } from '../api/templates';
import { useFieldVisibility } from '../context/FieldVisibilityContext';
import { numberToWordsSpanish } from '../utils/numberToWords';
import { getCompanySettings } from './Settings';

interface LineItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function CreateReceipt() {
  const navigate = useNavigate();
  const { fieldVisibility } = useFieldVisibility();

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerNit, setCustomerNit] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [institution, setInstitution] = useState('');
  const [concept, setConcept] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('Efectivo');  // Default to cash
  const [checkNumber, setCheckNumber] = useState('');  // Check number for Cheque payments
  const [bankAccount, setBankAccount] = useState('');  // Bank account for Transferencia payments
  const [status, setStatus] = useState<ReceiptStatus>('completed');
  const [notes, setNotes] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [receivedByName, setReceivedByName] = useState('');  // Name below signature

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  // Templates state
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Closed by default
  const [showLineItems, setShowLineItems] = useState(true); // Toggle for line items section
  const [previewReceiptNumber, setPreviewReceiptNumber] = useState('RECIBO-00000001');

  // Signature pad refs
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: 1, description: '', quantity: 1, unitPrice: 0 }
  ]);

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const total = subtotal;

  // Live amount-in-words calculation
  const amountInWords = useMemo(() => {
    return numberToWordsSpanish(total);
  }, [total]);

  // Initialize signature pad when modal opens
  useEffect(() => {
    if (showSignaturePad && signatureCanvasRef.current) {
      const canvas = signatureCanvasRef.current;

      // Set canvas size to match container
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

  // Load templates and next receipt number on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await getTemplates();
        setTemplates(data);
      } catch (err) {
        console.error('Error loading templates:', err);
        // Silently fail - templates are optional
      }
    };
    const loadNextReceiptNumber = async () => {
      try {
        const response = await fetch('/api/v1/receipts/next-number', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setPreviewReceiptNumber(data.next_number);
        }
      } catch (err) {
        console.error('Error loading next receipt number:', err);
        // Keep default preview number
      }
    };
    loadTemplates();
    loadNextReceiptNumber();
  }, []);

  // Handle template selection
  const handleTemplateSelect = async (templateId: number) => {
    setSelectedTemplateId(templateId);
    setIsLoadingTemplate(true);
    try {
      const template = await getTemplate(templateId);

      // Apply template data to form
      if (template.customer_name) setCustomerName(template.customer_name);
      if (template.customer_nit) setCustomerNit(template.customer_nit);
      if (template.customer_phone) setCustomerPhone(template.customer_phone);
      if (template.customer_email) setCustomerEmail(template.customer_email);
      if (template.customer_address) setCustomerAddress(template.customer_address);
      if (template.institution) setInstitution(template.institution);
      if (template.concept) setConcept(template.concept);
      if (template.payment_method) setPaymentMethod(template.payment_method as PaymentMethod);
      if (template.notes) setNotes(template.notes);

      // Apply template items
      if (template.items && template.items.length > 0) {
        setLineItems(template.items.map((item, index) => ({
          id: index + 1,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price,
        })));
      }
    } catch (err) {
      console.error('Error loading template:', err);
      setError('Error al cargar la plantilla');
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  // Handle save as template
  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) {
      return;
    }

    setIsSavingTemplate(true);
    try {
      const validItems = lineItems.filter(item => item.description.trim() !== '');

      await createTemplate({
        name: templateName.trim(),
        description: templateDescription.trim() || undefined,
        customer_name: customerName.trim() || undefined,
        customer_nit: customerNit.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        customer_email: customerEmail.trim() || undefined,
        customer_address: customerAddress.trim() || undefined,
        institution: (fieldVisibility.institution_use_company_name ?? false)
          ? getCompanySettings().companyName
          : (institution.trim() || undefined),
        concept: concept.trim() || undefined,
        payment_method: paymentMethod || undefined,
        notes: notes.trim() || undefined,
        items: validItems.length > 0 ? validItems.map(item => ({
          description: item.description.trim(),
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })) : undefined,
      });

      // Refresh templates list
      const updatedTemplates = await getTemplates();
      setTemplates(updatedTemplates);

      // Close modal and reset
      setShowSaveTemplateModal(false);
      setTemplateName('');
      setTemplateDescription('');

      alert('Plantilla guardada exitosamente');
    } catch (err) {
      console.error('Error saving template:', err);
      setError('Error al guardar la plantilla');
    } finally {
      setIsSavingTemplate(false);
    }
  };

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

  // Handle save and print - saves first, then prints
  const handleSaveAndPrint = async () => {
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
        customer_name: customerName.trim() || undefined,
        customer_nit: customerNit.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        customer_email: customerEmail.trim() || undefined,
        customer_address: customerAddress.trim() || undefined,
        institution: (fieldVisibility.institution_use_company_name ?? false)
          ? getCompanySettings().companyName
          : (institution.trim() || undefined),
        concept: concept.trim() || undefined,
        payment_method: paymentMethod || undefined,
        check_number: paymentMethod === 'Cheque' ? (checkNumber.trim() || undefined) : undefined,
        bank_account: paymentMethod === 'Transferencia' ? (bankAccount.trim() || undefined) : undefined,
        status: status,
        notes: notes.trim() || undefined,
        signature: signature || undefined,
        received_by_name: receivedByName.trim() || undefined,
        items: validItems.map(item => ({
          description: item.description.trim(),
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })),
      };

      const result = await createReceipt(receiptData);

      // Print the saved receipt
      const { companyName: cName, companyInfo, receiptTitle } = getCompanySettings();
      printReceipt(result, cName, companyInfo, fieldVisibility, receiptTitle);

      // Navigate to receipt list
      alert(`Recibo ${result.receipt_number} guardado e impreso!`);
      navigate('/');
    } catch (err) {
      console.error('Error creating receipt:', err);
      setError('Error al guardar el recibo. Por favor intente de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSave = async () => {
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
        customer_name: customerName.trim() || undefined,
        customer_nit: customerNit.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        customer_email: customerEmail.trim() || undefined,
        customer_address: customerAddress.trim() || undefined,
        institution: (fieldVisibility.institution_use_company_name ?? false)
          ? getCompanySettings().companyName
          : (institution.trim() || undefined),
        concept: concept.trim() || undefined,
        payment_method: paymentMethod || undefined,
        check_number: paymentMethod === 'Cheque' ? (checkNumber.trim() || undefined) : undefined,
        bank_account: paymentMethod === 'Transferencia' ? (bankAccount.trim() || undefined) : undefined,
        status: status,
        notes: notes.trim() || undefined,
        signature: signature || undefined,
        received_by_name: receivedByName.trim() || undefined,
        items: validItems.map(item => ({
          description: item.description.trim(),
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })),
      };

      const result = await createReceipt(receiptData);

      // Navigate to receipt list or show success
      alert(`Recibo ${result.receipt_number} creado exitosamente!`);
      navigate('/');
    } catch (err) {
      console.error('Error creating receipt:', err);
      setError('Error al guardar el recibo. Por favor intente de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pb-20" style={{ backgroundColor: 'var(--surface-default)' }}>
      {/* Templates Sidebar - Fixed position, slides in/out */}
      <div
        className={`fixed left-0 top-0 bottom-0 z-40 transition-transform duration-300 border-r ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          borderColor: 'var(--border-default)',
          backgroundColor: 'var(--surface-default)',
          width: '280px'
        }}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileStack size={20} style={{ color: 'var(--color-primary)' }} />
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Plantillas</h2>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                title="Cerrar"
              >
                <X size={18} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
            <button
              onClick={() => setShowSaveTemplateModal(true)}
              className="btn-primary w-full text-sm flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Nueva Plantilla
            </button>
          </div>

          {/* Templates List */}
          <div className="flex-1 overflow-y-auto">
            {templates.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  No hay plantillas guardadas
                </p>
              </div>
            ) : (
              <div className="p-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    disabled={isLoadingTemplate}
                    className={`w-full text-left p-3 rounded-lg mb-2 transition-all ${
                      selectedTemplateId === template.id
                        ? 'bg-blue-500/20 border-2 border-blue-500'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-transparent'
                    }`}
                    style={{
                      backgroundColor: selectedTemplateId === template.id ? 'var(--color-primary-alpha)' : undefined,
                    }}
                  >
                    <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {template.name}
                    </div>
                    {template.description && (
                      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {template.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Loading indicator */}
          {isLoadingTemplate && (
            <div className="p-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
              <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                Cargando plantilla...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar backdrop for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Toggle Button - Fixed at left edge */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-0 top-20 z-20 p-2 rounded-r-lg shadow-md transition-colors hover:bg-opacity-80"
          style={{
            backgroundColor: 'var(--surface-card)',
            borderColor: 'var(--border-default)',
            borderWidth: '1px',
            borderLeft: 'none',
          }}
          title="Mostrar plantillas"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Main Page Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
                <p className="text-red-500">{error}</p>
              </div>
            )}

            {/* Main Info Card - Receipt Info + Customer Info + Concept */}
            <div className="card p-4 sm:p-6 mb-4">
              {/* Receipt Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
                <div className="flex items-center gap-3">
                  <div
                    className="px-4 py-2 rounded-lg font-mono text-lg font-bold"
                    style={{
                      backgroundColor: 'var(--color-primary-alpha)',
                      color: 'var(--color-primary)',
                    }}
                  >
                    {previewReceiptNumber}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {getCurrentDate()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total:</span>
                  <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              {/* Customer Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Customer Name - conditional */}
                {(fieldVisibility.customer_name ?? true) && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
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
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
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
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
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
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
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
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
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

                {/* Concept - conditional - now in the same card */}
                {fieldVisibility.concept && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Concepto
                    </label>
                    <input
                      type="text"
                      value={concept}
                      onChange={(e) => setConcept(e.target.value)}
                      placeholder="Descripción del motivo del recibo (ej: Compra de materiales, Pago de servicio)"
                      className="input w-full"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Line Items - Toggleable (controlled by settings) */}
            {(fieldVisibility.line_items ?? true) && (
            <div className="card mb-4">
              {/* Header - Always visible, clickable to toggle */}
              <button
                onClick={() => setShowLineItems(!showLineItems)}
                className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-opacity-50 transition-colors rounded-t-lg"
                style={{ backgroundColor: showLineItems ? 'transparent' : 'var(--surface-card)' }}
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Detalle del Recibo
                  </h2>
                  <span className="text-sm px-2 py-0.5 rounded-full" style={{
                    backgroundColor: 'var(--surface-card-hover)',
                    color: 'var(--text-muted)'
                  }}>
                    {lineItems.length} artículo{lineItems.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                    {formatCurrency(total)}
                  </span>
                  {showLineItems ? (
                    <ChevronUp size={20} style={{ color: 'var(--text-muted)' }} />
                  ) : (
                    <ChevronDown size={20} style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>
              </button>

              {/* Expandable Content */}
              {showLineItems && (
                <div className="px-4 sm:px-6 pb-4 sm:pb-6">
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
                            onClick={(e) => { e.stopPropagation(); removeLineItem(item.id); }}
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
                      <span className="hidden sm:inline">Agregar Línea</span>
                      <span className="sm:hidden">Agregar</span>
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
              )}
            </div>
            )}

            {/* Additional Info Card - Notes + Name + Phone + Signature */}
            {(fieldVisibility.notes || fieldVisibility.signature || (fieldVisibility.received_by_name ?? true) || fieldVisibility.customer_phone) && (
              <div className="card p-4 sm:p-6 mb-4">
                {/* Notes - conditional */}
                {fieldVisibility.notes && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Notas Adicionales
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Observaciones, condiciones de pago, etc."
                      rows={3}
                      className="input w-full resize-none"
                    />
                  </div>
                )}

                {/* Signature Section - Left aligned */}
                {fieldVisibility.signature && (
                  <div className="mb-6">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Firma:
                      </label>
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
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
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
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
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

      </div>{/* End Main Page Content */}

      {/* Bottom Action Bar - Fixed at bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 border-t"
        style={{
          backgroundColor: 'var(--surface-default)',
          borderColor: 'var(--border-default)',
        }}
      >
        {/* Gradient fade effect */}
        <div
          className="absolute -top-8 left-0 right-0 h-8 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent, var(--surface-default))'
          }}
        />
        {/* Main bar */}
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Left side - Status & Payment Method */}
            <div className="flex items-center gap-3">
              {/* Status Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium hidden sm:inline" style={{ color: 'var(--text-muted)' }}>Estado:</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ReceiptStatus)}
                  className="input py-1.5 px-2 text-sm min-w-[100px]"
                  style={{ fontSize: '0.875rem' }}
                >
                  <option value="draft">{RECEIPT_STATUS_LABELS.draft}</option>
                  <option value="completed">{RECEIPT_STATUS_LABELS.completed}</option>
                  <option value="paid">{RECEIPT_STATUS_LABELS.paid}</option>
                  <option value="cancelled">{RECEIPT_STATUS_LABELS.cancelled}</option>
                </select>
              </div>

              {/* Payment Method Selector - conditional */}
              {fieldVisibility.payment_method && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium hidden sm:inline" style={{ color: 'var(--text-muted)' }}>Pago:</span>
                  <select
                    value={paymentMethod}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value as PaymentMethod | '');
                      // Clear payment detail fields when changing method
                      setCheckNumber('');
                      setBankAccount('');
                    }}
                    className="input py-1.5 px-2 text-sm min-w-[110px]"
                    style={{ fontSize: '0.875rem' }}
                  >
                    <option value="">-- Seleccionar --</option>
                    <option value={PAYMENT_METHODS.efectivo}>Efectivo</option>
                    <option value={PAYMENT_METHODS.cheque}>Cheque</option>
                    <option value={PAYMENT_METHODS.transferencia}>Transferencia</option>
                    <option value={PAYMENT_METHODS.otro}>Otro</option>
                  </select>
                  {/* Check Number field - shown when Cheque is selected */}
                  {paymentMethod === 'Cheque' && (
                    <input
                      type="text"
                      value={checkNumber}
                      onChange={(e) => setCheckNumber(e.target.value)}
                      placeholder="No. Cheque"
                      className="input py-1.5 px-2 text-sm w-28"
                      style={{ fontSize: '0.875rem' }}
                    />
                  )}
                  {/* Bank Account field - shown when Transferencia is selected */}
                  {paymentMethod === 'Transferencia' && (
                    <input
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="No. Cuenta"
                      className="input py-1.5 px-2 text-sm w-32"
                      style={{ fontSize: '0.875rem' }}
                    />
                  )}
                </div>
              )}

              {/* Loading indicator */}
              {isLoading && (
                <span className="text-sm hidden md:inline" style={{ color: 'var(--text-muted)' }}>
                  Guardando...
                </span>
              )}
            </div>

            {/* Right side - Action Buttons */}
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => navigate('/')}
                className="btn-secondary flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4"
              >
                <X size={18} />
                <span className="hidden sm:inline">Cancelar</span>
              </button>
              <button
                onClick={handleSaveAndPrint}
                disabled={isLoading}
                className="btn-secondary flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4"
              >
                <Printer size={18} />
                <span className="hidden sm:inline">Imprimir</span>
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-6"
              >
                <Save size={18} />
                <span>{isLoading ? 'Guardando...' : 'Guardar'}</span>
              </button>
            </div>
          </div>
        </div>
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

      {/* Save as Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="card w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Guardar como Plantilla
              </h3>
              <button
                onClick={() => setShowSaveTemplateModal(false)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Nombre de la Plantilla *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Ej: Cliente frecuente, Servicio mensual"
                  className="input w-full"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Breve descripción de la plantilla"
                  className="input w-full"
                />
              </div>

              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Se guardarán los datos del cliente, notas y artículos actuales.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSaveTemplateModal(false)}
                  className="btn-secondary flex-1"
                  disabled={isSavingTemplate}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveAsTemplate}
                  disabled={!templateName.trim() || isSavingTemplate}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {isSavingTemplate ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
