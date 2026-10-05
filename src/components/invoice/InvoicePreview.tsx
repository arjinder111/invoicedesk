import React from 'react';
import type { InvoiceData } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface InvoicePreviewProps {
  invoice: InvoiceData;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice }) => {
  return (
    <div id="invoice-preview-container" className="invoice-paper text-dark d-flex flex-column h-100 position-relative">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-5 pb-4 border-bottom border-primary border-2">
        <div className="w-50 pe-3">
          <h2 className="text-primary mb-3 text-uppercase fw-bold" style={{ letterSpacing: '2px' }}>INVOICE</h2>
          <h5 className="mb-1 fw-bold">{invoice.business.businessName || 'Your Business Name'}</h5>
          {invoice.business.address && <p className="mb-0 text-muted" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{invoice.business.address}</p>}
          {invoice.business.email && <p className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>Email: {invoice.business.email}</p>}
          {invoice.business.phone && <p className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>Phone: {invoice.business.phone}</p>}
          {invoice.business.taxRegistrationNumber && <p className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>Tax No: {invoice.business.taxRegistrationNumber}</p>}
        </div>
        
        <div className="w-50 text-end">
          <table className="table table-sm table-borderless mb-0">
            <tbody>
              <tr>
                <td className="text-muted fw-semibold">Invoice No:</td>
                <td className="fw-bold">{invoice.details.invoiceNumber}</td>
              </tr>
              <tr>
                <td className="text-muted fw-semibold">Date:</td>
                <td>{new Date(invoice.details.invoiceDate).toLocaleDateString()}</td>
              </tr>
              {invoice.details.dueDate && (
                <tr>
                  <td className="text-muted fw-semibold">Due Date:</td>
                  <td>{new Date(invoice.details.dueDate).toLocaleDateString()}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-5">
        <h6 className="text-muted text-uppercase fw-bold mb-2" style={{ letterSpacing: '1px' }}>Bill To</h6>
        <h5 className="mb-1 fw-bold">{invoice.client.clientName || 'Client Name'}</h5>
        {invoice.client.address && <p className="mb-0 text-muted" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{invoice.client.address}</p>}
        {invoice.client.email && <p className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>Email: {invoice.client.email}</p>}
        {invoice.client.phone && <p className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>Phone: {invoice.client.phone}</p>}
        {invoice.client.taxRegistrationNumber && <p className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>Tax No: {invoice.client.taxRegistrationNumber}</p>}
      </div>

      {/* Items Table */}
      <div className="mb-4" style={{ flexGrow: 1 }}>
        <table className="table table-striped border-top border-bottom">
        <thead className="table-primary text-primary" style={{ backgroundColor: '#e9ecef' }}>
          <tr>
            <th className="py-2">Description</th>
            <th className="py-2 text-center" style={{ width: '80px' }}>Qty</th>
            <th className="py-2 text-end" style={{ width: '120px' }}>Price</th>
            <th className="py-2 text-end" style={{ width: '120px' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={item.id}>
              <td className="py-3">
                <div className="fw-bold">{item.name || `Item ${index + 1}`}</div>
                {item.description && <div className="text-muted" style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{item.description}</div>}
              </td>
              <td className="py-3 text-center align-top">{item.quantity}</td>
              <td className="py-3 text-end align-top">{formatCurrency(item.unitPrice, invoice.details.currency)}</td>
              <td className="py-3 text-end align-top fw-bold">{formatCurrency((item.quantity * item.unitPrice), invoice.details.currency)}</td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>

      {/* Totals & Notes */}
      <div className="row mt-auto">
        <div className="col-7 pe-4">
          {invoice.details.notes && (
            <div className="mb-3">
              <h6 className="text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>Notes</h6>
              <p className="mb-0 text-muted" style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{invoice.details.notes}</p>
            </div>
          )}
          {invoice.details.paymentInstructions && (
            <div className="mb-3">
              <h6 className="text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>Payment Instructions</h6>
              <p className="mb-0 text-muted" style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{invoice.details.paymentInstructions}</p>
            </div>
          )}
          {invoice.details.terms && (
            <div>
              <h6 className="text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>Terms & Conditions</h6>
              <p className="mb-0 text-muted" style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{invoice.details.terms}</p>
            </div>
          )}
        </div>
        
        <div className="col-5">
          <table className="table table-sm table-borderless text-end mb-0" style={{ minWidth: '250px' }}>
            <tbody>
              <tr>
                <td className="text-muted fw-semibold pb-2 text-nowrap">Subtotal:</td>
                <td className="pb-2 text-nowrap">{formatCurrency(invoice.totals.subtotal, invoice.details.currency)}</td>
              </tr>
              {invoice.totals.discount > 0 && (
                <tr>
                  <td className="text-muted fw-semibold text-danger pb-2 text-nowrap">
                    Discount {invoice.details.discountType === 'percentage' ? `(${invoice.details.discountValue}%)` : ''}:
                  </td>
                  <td className="text-danger pb-2 text-nowrap">-{formatCurrency(invoice.totals.discount, invoice.details.currency)}</td>
                </tr>
              )}
              {invoice.details.taxPercentage > 0 && (
                <tr className="border-bottom">
                  <td className="text-muted fw-semibold pb-2 text-nowrap">Tax ({invoice.details.taxPercentage}%):</td>
                  <td className="pb-2 text-nowrap">{formatCurrency(invoice.totals.tax, invoice.details.currency)}</td>
                </tr>
              )}
              <tr>
                <td className="fw-bold fs-5 text-primary pt-3 text-nowrap">Grand Total:</td>
                <td className="fw-bold fs-5 text-primary pt-3 text-nowrap">{formatCurrency(invoice.totals.grandTotal, invoice.details.currency)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
