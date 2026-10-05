import React from 'react';
import type { InvoiceData } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface InvoicePreviewProps {
  invoice: InvoiceData;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice }) => {
  const tpl = invoice.details.template || 'classic';

  const renderLogo = (maxHeight = '80px') => {
    if (!invoice.business.logoUrl) return null;
    return (
      <img 
        src={invoice.business.logoUrl} 
        alt="Business Logo" 
        style={{ maxHeight, maxWidth: '200px', objectFit: 'contain' }} 
        className="mb-3"
        crossOrigin="anonymous" 
      />
    );
  };

  const renderHeader = () => {
    if (tpl === 'modern') {
      return (
        <div className="d-flex justify-content-between align-items-center mb-5 p-4 rounded-3" style={{ backgroundColor: '#2563eb', color: '#ffffff' }}>
          <div>
            {renderLogo('60px')}
            <h2 className="mb-1 fw-bold text-white text-uppercase" style={{ letterSpacing: '2px' }}>INVOICE</h2>
            <p className="mb-0 text-white-50">{invoice.details.invoiceNumber}</p>
          </div>
          <div className="text-end text-white">
            <h5 className="mb-1 fw-bold text-white">{invoice.business.businessName || 'Your Business Name'}</h5>
            {invoice.business.address && <p className="mb-0 text-white-50" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{invoice.business.address}</p>}
            {invoice.business.email && <p className="mb-0 text-white-50" style={{ fontSize: '0.9rem' }}>{invoice.business.email}</p>}
            {invoice.business.phone && <p className="mb-0 text-white-50" style={{ fontSize: '0.9rem' }}>{invoice.business.phone}</p>}
          </div>
        </div>
      );
    }
    
    if (tpl === 'minimal') {
      return (
        <div className="mb-5 pb-4 border-bottom border-secondary">
          {renderLogo('80px')}
          <h1 className="fw-light mb-4" style={{ letterSpacing: '4px' }}>INVOICE</h1>
          <div className="d-flex justify-content-between">
            <div>
              <p className="mb-0 fw-bold">{invoice.business.businessName || 'Your Business Name'}</p>
              {invoice.business.address && <p className="mb-0 text-muted" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{invoice.business.address}</p>}
            </div>
            <div className="text-end">
              <p className="mb-0 text-muted">Invoice No: <span className="text-dark">{invoice.details.invoiceNumber}</span></p>
              <p className="mb-0 text-muted">Date: <span className="text-dark">{new Date(invoice.details.invoiceDate).toLocaleDateString()}</span></p>
            </div>
          </div>
        </div>
      );
    }

    // Classic (Default)
    return (
      <div className="d-flex justify-content-between align-items-start mb-5 pb-4 border-bottom border-primary border-2">
        <div className="w-50 pe-3">
          {renderLogo('80px')}
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
    );
  };

  return (
    <div id="invoice-preview-container" className={`invoice-paper text-dark d-flex flex-column h-100 position-relative template-${tpl}`}>
      
      {/* Dynamic Status Badge */}
      {invoice.status && invoice.status !== 'Draft' && (
        <div className={`position-absolute top-0 end-0 m-4 badge rounded-pill fs-6 ${
          invoice.status === 'Paid' ? 'bg-success' : 
          invoice.status === 'Partially Paid' ? 'bg-warning text-dark' : 'bg-danger'
        }`}>
          {invoice.status.toUpperCase()}
        </div>
      )}

      {renderHeader()}

      {/* Bill To & Details (Modern has specific details placement) */}
      <div className={`d-flex justify-content-between mb-5 ${tpl === 'minimal' ? 'pt-2' : ''}`}>
        <div>
          <h6 className="text-muted text-uppercase fw-bold mb-2" style={{ letterSpacing: '1px' }}>Bill To</h6>
          <h5 className="mb-1 fw-bold">{invoice.client.clientName || 'Client Name'}</h5>
          {invoice.client.address && <p className="mb-0 text-muted" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{invoice.client.address}</p>}
          {invoice.client.email && <p className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>Email: {invoice.client.email}</p>}
          {invoice.client.phone && <p className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>Phone: {invoice.client.phone}</p>}
          {invoice.client.taxRegistrationNumber && <p className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>Tax No: {invoice.client.taxRegistrationNumber}</p>}
        </div>

        {tpl === 'modern' && (
          <div className="text-end">
             <p className="mb-1"><span className="text-muted fw-bold">Date:</span> {new Date(invoice.details.invoiceDate).toLocaleDateString()}</p>
             {invoice.details.dueDate && <p className="mb-1"><span className="text-muted fw-bold">Due:</span> {new Date(invoice.details.dueDate).toLocaleDateString()}</p>}
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="mb-4" style={{ flexGrow: 1 }}>
        <table className={`table ${tpl === 'minimal' ? 'table-borderless border-bottom' : 'table-striped border-top border-bottom'}`}>
        <thead className={`${tpl === 'modern' ? 'table-dark text-white' : tpl === 'classic' ? 'table-primary text-primary' : 'border-bottom border-dark'}`} style={tpl === 'classic' ? { backgroundColor: '#e9ecef' } : {}}>
          <tr>
            <th className="py-2">Description</th>
            <th className="py-2 text-center" style={{ width: '80px' }}>Qty</th>
            <th className="py-2 text-end" style={{ width: '120px' }}>Price</th>
            <th className="py-2 text-end" style={{ width: '120px' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={item.id} className={tpl === 'minimal' ? 'border-bottom' : ''}>
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
                <td className="fw-bold fs-6 pt-3 text-nowrap">Total Amount:</td>
                <td className="fw-bold fs-6 pt-3 text-nowrap">{formatCurrency(invoice.totals.grandTotal, invoice.details.currency)}</td>
              </tr>
              
              {/* Payment Info */}
              {invoice.totals.totalPaid > 0 && (
                <>
                  <tr className="text-success">
                    <td className="fw-bold pb-2 text-nowrap">Amount Paid:</td>
                    <td className="fw-bold pb-2 text-nowrap">-{formatCurrency(invoice.totals.totalPaid, invoice.details.currency)}</td>
                  </tr>
                  <tr className="border-top">
                    <td className="fw-bold fs-5 text-primary pt-3 text-nowrap">Balance Due:</td>
                    <td className="fw-bold fs-5 text-primary pt-3 text-nowrap">{formatCurrency(invoice.totals.balanceDue, invoice.details.currency)}</td>
                  </tr>
                </>
              )}
              {invoice.totals.totalPaid <= 0 && (
                <tr className="border-top">
                  <td className="fw-bold fs-5 text-primary pt-3 text-nowrap">Balance Due:</td>
                  <td className="fw-bold fs-5 text-primary pt-3 text-nowrap">{formatCurrency(invoice.totals.grandTotal, invoice.details.currency)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
