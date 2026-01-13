import { Receipt } from '../api/receipts';

interface ReceiptPrintProps {
  receipt: Receipt;
  companyName?: string;
  companyInfo?: string;
}

export default function ReceiptPrint({
  receipt,
  companyName = 'EMPRESA',
  companyInfo = 'Dirección de la empresa | Tel: 0000-0000'
}: ReceiptPrintProps) {
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

  return (
    <div className="receipt-print">
      {/* Header */}
      <div className="receipt-header">
        <h1>{companyName}</h1>
        <p className="receipt-date">{companyInfo}</p>
        <div className="receipt-number">{receipt.receipt_number}</div>
        <p className="receipt-date">{formatDate(receipt.date)}</p>
      </div>

      {/* Customer Info */}
      <div className="receipt-customer">
        <div>
          <span className="receipt-customer-label">Cliente: </span>
          {receipt.customer_name}
        </div>
        <div>
          <span className="receipt-customer-label">NIT: </span>
          {receipt.customer_nit || 'CF'}
        </div>
        {receipt.customer_phone && (
          <div>
            <span className="receipt-customer-label">Tel: </span>
            {receipt.customer_phone}
          </div>
        )}
        {receipt.customer_email && (
          <div>
            <span className="receipt-customer-label">Email: </span>
            {receipt.customer_email}
          </div>
        )}
      </div>

      {/* Items Table */}
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

      {/* Notes */}
      {receipt.notes && (
        <div className="receipt-notes">
          <strong>Notas:</strong> {receipt.notes}
        </div>
      )}

      {/* Signature */}
      <div className="receipt-signature">
        <div className="receipt-signature-box">
          {receipt.signature ? (
            <>
              <img src={receipt.signature} alt="Firma" />
              <div className="receipt-signature-line">Firma del Cliente</div>
            </>
          ) : (
            <div className="receipt-signature-line">Firma del Cliente</div>
          )}
        </div>
        <div className="receipt-signature-box">
          <div className="receipt-signature-line">Firma Autorizada</div>
        </div>
      </div>

      {/* Footer */}
      <div className="receipt-footer">
        <p>Gracias por su preferencia</p>
      </div>
    </div>
  );
}

// Print function helper
export function printReceipt(receipt: Receipt, companyName?: string, companyInfo?: string) {
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

        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
        }

        .signature-box {
          width: 2.5in;
          text-align: center;
        }

        .signature-line {
          border-top: 1px solid black;
          padding-top: 4px;
          font-size: 8pt;
          margin-top: 40px;
        }

        .signature-box img {
          max-height: 50px;
          max-width: 100%;
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
        <h1>${companyName || 'EMPRESA'}</h1>
        <p class="info">${companyInfo || 'Dirección de la empresa | Tel: 0000-0000'}</p>
        <div class="receipt-number">${receipt.receipt_number}</div>
        <p class="info">${formatDate(receipt.date)}</p>
      </div>

      <div class="customer">
        <div><span class="customer-label">Cliente:</span> ${receipt.customer_name}</div>
        <div><span class="customer-label">NIT:</span> ${receipt.customer_nit || 'CF'}</div>
        ${receipt.customer_phone ? `<div><span class="customer-label">Tel:</span> ${receipt.customer_phone}</div>` : ''}
        ${receipt.customer_email ? `<div><span class="customer-label">Email:</span> ${receipt.customer_email}</div>` : ''}
      </div>

      <table>
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
      </table>

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

      ${receipt.notes ? `
        <div class="notes">
          <strong>Notas:</strong> ${receipt.notes}
        </div>
      ` : ''}

      <div class="signatures">
        <div class="signature-box">
          ${receipt.signature ? `<img src="${receipt.signature}" alt="Firma" />` : ''}
          <div class="signature-line">Firma del Cliente</div>
        </div>
        <div class="signature-box">
          <div class="signature-line">Firma Autorizada</div>
        </div>
      </div>

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
