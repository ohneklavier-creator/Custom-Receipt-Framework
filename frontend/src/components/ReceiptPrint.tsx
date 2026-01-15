import { Receipt } from '../api/receipts';
import { useFieldVisibility } from '../context/FieldVisibilityContext';
import { numberToWordsSpanish } from '../utils/numberToWords';

interface ReceiptPrintProps {
  receipt: Receipt;
  companyName?: string;
  companyInfo?: string;
  receiptTitle?: string;
}

export default function ReceiptPrint({
  receipt,
  companyName = 'EMPRESA',
  companyInfo = 'Dirección de la empresa | Tel: 0000-0000',
  receiptTitle = ''
}: ReceiptPrintProps) {
  const { fieldVisibility } = useFieldVisibility();
  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `Q${num.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Determine what to show in header
  const showCompanyName = fieldVisibility.show_company_name_in_header ?? true;
  const showCompanyInfo = fieldVisibility.show_company_info_in_header ?? true;

  return (
    <div className="receipt-print">
      {/* Header */}
      <div className="receipt-header">
        {/* Title: custom title OR company name (if no title and showCompanyName) OR generic "RECIBO" */}
        <h1>{receiptTitle || (showCompanyName ? companyName : 'RECIBO')}</h1>
        {/* Company name line (only if custom title is set AND showCompanyName is enabled) */}
        {receiptTitle && showCompanyName && companyName && (
          <p className="receipt-company-name">{companyName}</p>
        )}
        {/* Company info (if enabled) */}
        {showCompanyInfo && companyInfo && (
          <p className="receipt-date">{companyInfo}</p>
        )}
        <div className="receipt-number">{receipt.receipt_number}</div>
        <p className="receipt-date">{formatDate(receipt.date)}</p>
      </div>

      {/* Customer Info */}
      <div className="receipt-customer">
        {(fieldVisibility.customer_name ?? true) && receipt.customer_name && (
          <div>
            <span className="receipt-customer-label">Cliente: </span>
            {receipt.customer_name}
          </div>
        )}
        {(fieldVisibility.customer_nit ?? true) && (
          <div>
            <span className="receipt-customer-label">NIT: </span>
            {receipt.customer_nit || 'CF'}
          </div>
        )}
        {fieldVisibility.customer_phone && receipt.customer_phone && (
          <div>
            <span className="receipt-customer-label">Tel: </span>
            {receipt.customer_phone}
          </div>
        )}
        {fieldVisibility.customer_email && receipt.customer_email && (
          <div>
            <span className="receipt-customer-label">Email: </span>
            {receipt.customer_email}
          </div>
        )}
        {fieldVisibility.customer_address && receipt.customer_address && (
          <div>
            <span className="receipt-customer-label">Dirección: </span>
            {receipt.customer_address}
          </div>
        )}
        {fieldVisibility.institution && (
          <div>
            <span className="receipt-customer-label">Institución: </span>
            {receipt.institution || companyName}
          </div>
        )}
      </div>

      {/* Items Table - conditional */}
      {fieldVisibility.line_items_in_print && (
        <table className="receipt-items">
          <thead>
            <tr>
              <th>Descripción</th>
              <th className="qty">Cant.</th>
              <th className="price">P. Unit.</th>
              <th className="total">Total</th>
            </tr>
          </thead>
          <tbody>
            {receipt.items.map((item, index) => (
              <tr key={item.id || index}>
                <td>{item.description}</td>
                <td className="qty">{item.quantity}</td>
                <td className="price">{formatCurrency(item.unit_price)}</td>
                <td className="total">{formatCurrency(item.total || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Totals */}
      <div className="receipt-totals">
        <div className="receipt-total-row">
          <span>Subtotal:</span>
          <span>{formatCurrency(receipt.subtotal)}</span>
        </div>
        <div className="receipt-total-row grand-total">
          <span>TOTAL:</span>
          <span>{formatCurrency(receipt.total)}</span>
        </div>
      </div>

      {/* Amount in Words - conditional */}
      {fieldVisibility.amount_in_words && (
        <div className="receipt-notes">
          <strong>Cantidad en letras:</strong> {numberToWordsSpanish(receipt.total)}
        </div>
      )}

      {/* Concept - conditional */}
      {fieldVisibility.concept && receipt.concept && (
        <div className="receipt-notes">
          <strong>Concepto:</strong> {receipt.concept}
        </div>
      )}


      {/* Notes - conditional */}
      {fieldVisibility.notes && receipt.notes && (
        <div className="receipt-notes">
          <strong>Notas:</strong> {receipt.notes}
        </div>
      )}

      {/* Signature Section - per example screenshot */}
      {fieldVisibility.signature && (
        <div className="receipt-signature">
          <div className="receipt-signature-box">
            <div className="receipt-signature-label">FIRMA:</div>
            {receipt.signature ? (
              <img src={receipt.signature} alt="Firma" />
            ) : (
              <div className="receipt-signature-line"></div>
            )}
            {/* Received By Name - conditional */}
            {(fieldVisibility.received_by_name ?? true) && (
              <div className="receipt-name-field">
                <span className="receipt-name-label">NOMBRE:</span>
                <span className="receipt-name-value">{receipt.received_by_name || ''}</span>
              </div>
            )}
          </div>
          {/* Payment Method in Signature Area - conditional */}
          {(fieldVisibility.payment_method_in_print ?? true) && receipt.payment_method && (
            <div className="receipt-payment-box">
              <div className="receipt-payment-label">FORMA DE PAGO</div>
              <div className="receipt-payment-value">{receipt.payment_method.toUpperCase()}</div>
              {receipt.payment_method === 'Cheque' && receipt.check_number && (
                <div className="receipt-payment-detail">
                  <span className="receipt-payment-detail-label">No. Cheque:</span> {receipt.check_number}
                </div>
              )}
              {receipt.payment_method === 'Transferencia' && receipt.bank_account && (
                <div className="receipt-payment-detail">
                  <span className="receipt-payment-detail-label">No. Cuenta:</span> {receipt.bank_account}
                </div>
              )}
            </div>
          )}
          {/* Authorized Signature - conditional */}
          {(fieldVisibility.authorized_signature ?? true) && (
            <div className="receipt-signature-box">
              <div className="receipt-signature-line">Firma Autorizada</div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="receipt-footer">
        <p>Gracias por su preferencia</p>
      </div>
    </div>
  );
}

// Print function helper
export function printReceipt(
  receipt: Receipt,
  companyName?: string,
  companyInfo?: string,
  fieldVisibility?: {
    customer_name: boolean;
    customer_nit: boolean;
    customer_address: boolean;
    customer_phone: boolean;
    customer_email: boolean;
    institution: boolean;
    amount_in_words: boolean;
    concept: boolean;
    payment_method: boolean;
    notes: boolean;
    signature: boolean;
    received_by_name: boolean;
    authorized_signature: boolean;
    payment_method_in_print: boolean;
    line_items_in_print: boolean;
    show_company_name_in_header?: boolean;
    show_company_info_in_header?: boolean;
    institution_use_company_name?: boolean;
  },
  receiptTitle?: string
) {
  // Default to all fields visible if not provided
  const visibility = fieldVisibility || {
    customer_name: true,
    customer_nit: true,
    customer_address: true,
    customer_phone: true,
    customer_email: true,
    institution: true,
    amount_in_words: true,
    concept: true,
    payment_method: true,
    notes: true,
    signature: true,
    received_by_name: true,
    authorized_signature: true,
    payment_method_in_print: true,
    line_items_in_print: true,
    show_company_name_in_header: true,
    show_company_info_in_header: true,
    institution_use_company_name: false,
  };

  // Header visibility helpers
  const showCompanyName = visibility.show_company_name_in_header ?? true;
  const showCompanyInfo = visibility.show_company_info_in_header ?? true;
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor permita las ventanas emergentes para imprimir.');
    return;
  }

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `Q${num.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Recibo ${receipt.receipt_number}</title>
      <style>
        @page {
          size: 8in 5.5in;
          margin: 0.25in;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10pt;
          color: black;
          background: white;
          width: 7.5in;
          padding: 0.25in;
        }

        .header {
          text-align: center;
          border-bottom: 2px solid black;
          padding-bottom: 10px;
          margin-bottom: 12px;
        }

        .header h1 {
          font-size: 16pt;
          margin-bottom: 4px;
        }

        .header .info {
          font-size: 8pt;
          color: #333;
        }

        .receipt-number {
          font-family: 'Courier New', monospace;
          font-size: 14pt;
          font-weight: bold;
          margin: 8px 0;
        }

        .customer {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          margin-bottom: 12px;
          font-size: 9pt;
        }

        .customer-label {
          font-weight: bold;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          font-size: 9pt;
        }

        th {
          background: #f0f0f0;
          border: 1px solid #ccc;
          padding: 4px 8px;
          text-align: left;
        }

        td {
          border: 1px solid #ccc;
          padding: 4px 8px;
        }

        .qty, .price, .total {
          text-align: right;
          white-space: nowrap;
        }

        .totals {
          text-align: right;
          margin-bottom: 12px;
        }

        .total-row {
          display: flex;
          justify-content: flex-end;
          gap: 40px;
          padding: 2px 0;
        }

        .grand-total {
          font-size: 12pt;
          font-weight: bold;
          border-top: 2px solid black;
          padding-top: 4px;
          margin-top: 4px;
        }

        .notes {
          font-size: 8pt;
          color: #333;
          border-top: 1px dashed #999;
          padding-top: 8px;
          margin-bottom: 12px;
        }

        /* Bottom section with signature and payment side by side */
        .bottom-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px dashed #999;
          gap: 20px;
        }

        .signature-column {
          flex: 1;
        }

        .signature-row {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 12px;
        }

        .signature-label-inline {
          font-weight: bold;
          font-size: 11pt;
        }

        .signature-area {
          min-width: 150px;
          border-bottom: 1px solid black;
          padding-bottom: 4px;
        }

        .signature-area img {
          max-height: 60px;
          max-width: 200px;
        }

        .signature-placeholder {
          min-height: 50px;
        }

        .name-phone-row {
          display: flex;
          gap: 30px;
          font-size: 9pt;
        }

        .name-phone-row.standalone {
          margin: 20px 0;
          padding-top: 15px;
          border-top: 1px dashed #999;
        }

        .name-field-left {
          border-bottom: 1px solid #999;
          padding-bottom: 2px;
        }

        .phone-field {
          border-bottom: 1px solid #999;
          padding-bottom: 2px;
        }

        .phone-label {
          font-weight: bold;
        }

        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
          gap: 15px;
        }

        .signature-box {
          flex: 1;
        }

        .signature-label {
          font-weight: bold;
          font-size: 9pt;
          margin-bottom: 4px;
        }

        .signature-line {
          border-bottom: 1px solid black;
          min-height: 40px;
          margin-bottom: 4px;
        }

        .signature-box img {
          max-height: 50px;
          max-width: 100%;
        }

        .name-field {
          font-size: 9pt;
          margin-top: 8px;
          border-bottom: 1px solid #999;
          padding-bottom: 2px;
        }

        .name-label {
          font-weight: bold;
        }

        .payment-box {
          border: 2px solid black;
          padding: 8px 12px;
          text-align: center;
          width: 33.33%;
          min-width: 2in;
          flex: none;
        }

        .payment-label {
          font-weight: bold;
          font-size: 9pt;
          margin-bottom: 4px;
          border-bottom: 1px solid #999;
          padding-bottom: 3px;
        }

        .payment-value {
          font-size: 11pt;
          font-weight: bold;
          padding: 4px 0;
        }

        .payment-detail {
          font-size: 8pt;
          margin-top: 4px;
          padding-top: 4px;
          border-top: 1px dashed #999;
          text-align: left;
        }

        .payment-detail-label {
          font-weight: bold;
        }

        .footer {
          text-align: center;
          font-size: 7pt;
          color: #666;
          border-top: 1px solid #ccc;
          padding-top: 4px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${receiptTitle || (showCompanyName ? (companyName || 'EMPRESA') : 'RECIBO')}</h1>
        ${receiptTitle && showCompanyName && companyName ? `<p class="info">${companyName}</p>` : ''}
        ${showCompanyInfo && companyInfo ? `<p class="info">${companyInfo}</p>` : ''}
        <div class="receipt-number">${receipt.receipt_number}</div>
        <p class="info">${formatDate(receipt.date)}</p>
      </div>

      <div class="customer">
        ${(visibility.customer_name ?? true) && receipt.customer_name ? `<div><span class="customer-label">Cliente:</span> ${receipt.customer_name}</div>` : ''}
        ${(visibility.customer_nit ?? true) ? `<div><span class="customer-label">NIT:</span> ${receipt.customer_nit || 'CF'}</div>` : ''}
        ${visibility.customer_email && receipt.customer_email ? `<div><span class="customer-label">Email:</span> ${receipt.customer_email}</div>` : ''}
        ${visibility.customer_address && receipt.customer_address ? `<div><span class="customer-label">Dirección:</span> ${receipt.customer_address}</div>` : ''}
        ${visibility.institution ? `<div><span class="customer-label">Institución:</span> ${receipt.institution || companyName || 'EMPRESA'}</div>` : ''}
      </div>

      ${visibility.line_items_in_print ? `<table>
        <thead>
          <tr>
            <th>Descripción</th>
            <th class="qty">Cant.</th>
            <th class="price">P. Unit.</th>
            <th class="total">Total</th>
          </tr>
        </thead>
        <tbody>
          ${receipt.items.map(item => `
            <tr>
              <td>${item.description}</td>
              <td class="qty">${item.quantity}</td>
              <td class="price">${formatCurrency(item.unit_price)}</td>
              <td class="total">${formatCurrency(item.total || 0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>` : ''}

      <div class="totals">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>${formatCurrency(receipt.subtotal)}</span>
        </div>
        <div class="total-row grand-total">
          <span>TOTAL:</span>
          <span>${formatCurrency(receipt.total)}</span>
        </div>
      </div>

      ${visibility.amount_in_words ? `
        <div class="notes">
          <strong>Cantidad en letras:</strong> ${numberToWordsSpanish(receipt.total)}
        </div>
      ` : ''}

      ${visibility.concept && receipt.concept ? `
        <div class="notes">
          <strong>Concepto:</strong> ${receipt.concept}
        </div>
      ` : ''}

      ${visibility.notes && receipt.notes ? `
        <div class="notes">
          <strong>Notas:</strong> ${receipt.notes}
        </div>
      ` : ''}

      <!-- Bottom Section - Signature on left, Payment on right -->
      <div class="bottom-section">
        <!-- Left column: Signature + Name + Phone -->
        <div class="signature-column">
          ${visibility.signature ? `
            <div class="signature-row">
              <span class="signature-label-inline">FIRMA:</span>
              <div class="signature-area">
                ${receipt.signature ? `<img src="${receipt.signature}" alt="Firma" />` : '<div class="signature-placeholder"></div>'}
              </div>
            </div>
          ` : ''}
          ${(visibility.received_by_name ?? true) || (visibility.customer_phone && receipt.customer_phone) ? `
            <div class="name-phone-row">
              ${(visibility.received_by_name ?? true) ? `
                <div class="name-field-left">
                  <span class="name-label">NOMBRE:</span> ${receipt.received_by_name || '_________________'}
                </div>
              ` : ''}
              ${visibility.customer_phone && receipt.customer_phone ? `
                <div class="phone-field">
                  <span class="phone-label">TEL:</span> ${receipt.customer_phone}
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>

        <!-- Right column: Payment box -->
        ${(visibility.payment_method_in_print ?? true) && receipt.payment_method ? `
          <div class="payment-box">
            <div class="payment-label">FORMA DE PAGO</div>
            <div class="payment-value">${receipt.payment_method.toUpperCase()}</div>
            ${receipt.payment_method === 'Cheque' && receipt.check_number ? `
              <div class="payment-detail">
                <span class="payment-detail-label">No. Cheque:</span> ${receipt.check_number}
              </div>
            ` : ''}
            ${receipt.payment_method === 'Transferencia' && receipt.bank_account ? `
              <div class="payment-detail">
                <span class="payment-detail-label">No. Cuenta:</span> ${receipt.bank_account}
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>

      ${(visibility.authorized_signature ?? true) ? `
        <div class="signatures">
          <div class="signature-box">
            <div class="signature-label">FIRMA AUTORIZADA:</div>
            <div class="signature-line"></div>
          </div>
        </div>
      ` : ''}

      <div class="footer">
        <p>Gracias por su preferencia</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.print();
  };
}
