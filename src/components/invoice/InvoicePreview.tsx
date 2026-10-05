import React from 'react';
import type { InvoiceData, LineItem } from '../../types';
import { formatCurrency, numberToWords } from '../../utils/formatters';
import { ElectricTemplate } from './templates/ElectricTemplate';
import { FertilizerTemplate } from './templates/FertilizerTemplate';

interface InvoicePreviewProps {
  invoice: InvoiceData;
}

const ShopTemplate: React.FC<{ invoice: InvoiceData }> = ({ invoice }) => {
  const isSameState = !invoice.details.placeOfSupply || !invoice.business.state || 
                      invoice.details.placeOfSupply.toLowerCase() === invoice.business.state.toLowerCase();
  
  const calculateItemRow = (item: LineItem) => {
    let billableQty = item.quantity || 0;
    if (invoice.details.invoiceMode === 'fertilizer' && item.billingUnit === 'weight') {
      billableQty = (item.packs || 0) * (item.weightPerPack || 0);
    } else if (invoice.details.invoiceMode === 'fertilizer' && item.billingUnit === 'pack') {
      billableQty = item.packs || 0;
    }

    const rate = item.unitPrice || 0;
    const amount = billableQty * rate;
    
    let taxable = amount;
    let taxAmount = 0;
    const taxRate = item.taxRate || 0;
    
    if (item.taxInclusive && taxRate > 0) {
      taxable = amount / (1 + taxRate / 100);
      taxAmount = amount - taxable;
    } else if (taxRate > 0) {
      taxAmount = (amount * taxRate) / 100;
    }

    return { billableQty, rate, taxable, taxAmount, taxRate, total: taxable + taxAmount };
  };

  return (
    <div id="invoice-preview-container" className="invoice-paper shop-template text-dark d-flex flex-column h-100 position-relative bg-white" style={{ border: '1px solid #000', fontSize: '0.85rem' }}>
      
      {/* Title */}
      <div className="text-center border-bottom border-dark p-2 fw-bold text-uppercase" style={{ letterSpacing: '2px', fontSize: '0.9rem' }}>
        Tax Invoice
      </div>

      {/* Header */}
      <div className="text-center border-bottom border-dark p-3">
        {invoice.business.logoUrl && (
          <img src={invoice.business.logoUrl} alt="Logo" style={{ maxHeight: '60px', objectFit: 'contain' }} className="mb-2" crossOrigin="anonymous" />
        )}
        <h3 className="fw-bold mb-1 text-uppercase" style={{ fontSize: '1.2rem' }}>{invoice.business.businessName}</h3>
        {invoice.business.address && <p className="mb-0">{invoice.business.address}</p>}
        <p className="mb-0">
          {invoice.business.phone && <span>Ph: {invoice.business.phone} </span>}
          {invoice.business.email && <span>| Email: {invoice.business.email}</span>}
        </p>
        <p className="mb-0 fw-bold">
          {invoice.business.taxRegistrationNumber && <span>GSTIN: {invoice.business.taxRegistrationNumber} </span>}
          {invoice.business.pan && <span>| PAN: {invoice.business.pan}</span>}
        </p>
      </div>
      
      <div className="row mx-0 border-bottom border-dark">
        <div className="col-6 border-end border-dark p-2">
          <strong>Billed To:</strong><br />
          <span className="fw-bold">{invoice.client.clientName}</span><br />
          {invoice.client.address && <span>{invoice.client.address}<br/></span>}
          {invoice.client.phone && <span>Ph: {invoice.client.phone}<br/></span>}
          {invoice.client.taxRegistrationNumber && <span>GSTIN: {invoice.client.taxRegistrationNumber}<br/></span>}
          {invoice.client.state && <span>State: {invoice.client.state} {invoice.client.stateCode ? `(${invoice.client.stateCode})` : ''}</span>}
        </div>
        <div className="col-6 p-2">
          <div className="d-flex justify-content-between mb-1">
            <strong>Invoice No:</strong> <span>{invoice.details.invoiceNumber}</span>
          </div>
          <div className="d-flex justify-content-between mb-1">
            <strong>Date:</strong> <span>{new Date(invoice.details.invoiceDate).toLocaleDateString()}</span>
          </div>
          {invoice.details.placeOfSupply && (
            <div className="d-flex justify-content-between mb-1">
              <strong>Place of Supply:</strong> <span>{invoice.details.placeOfSupply}</span>
            </div>
          )}
          {invoice.business.state && (
            <div className="d-flex justify-content-between mb-1">
              <strong>Our State:</strong> <span>{invoice.business.state} {invoice.business.stateCode ? `(${invoice.business.stateCode})` : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <table className="table table-sm table-bordered border-dark mb-0 text-center align-middle" style={{ borderLeft: 'none', borderRight: 'none' }}>
        <thead className="table-light border-dark">
          <tr>
            <th className="text-start" style={{ width: '40%' }}>Item Description</th>
            <th>HSN</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Taxable</th>
            {isSameState ? (
              <>
                <th>CGST</th>
                <th>SGST</th>
              </>
            ) : (
              <th>IGST</th>
            )}
            <th className="text-end">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item) => {
            const { billableQty, rate, taxable, taxAmount, taxRate, total } = calculateItemRow(item);
            return (
              <tr key={item.id}>
                <td className="text-start p-2">
                  <div className="fw-bold">{item.name}</div>
                  {invoice.details.invoiceMode === 'electrical' && (
                    <div className="small text-muted">
                      {item.modelNumber && `Model: ${item.modelNumber} `}
                      {item.serialNumber && `SN: ${item.serialNumber}`}
                    </div>
                  )}
                  {invoice.details.invoiceMode === 'fertilizer' && (
                    <div className="small text-muted">
                      {item.batchNumber && `Batch: ${item.batchNumber} `}
                      {item.expDate && `Exp: ${item.expDate}`}
                    </div>
                  )}
                </td>
                <td>{item.hsn || '-'}</td>
                <td>{billableQty} {item.unit || ''}</td>
                <td>{formatCurrency(rate, invoice.details.currency)}</td>
                <td>{formatCurrency(taxable, invoice.details.currency)}</td>
                {isSameState ? (
                  <>
                    <td className="small">
                      {taxRate / 2}%<br/>{formatCurrency(taxAmount / 2, invoice.details.currency)}
                    </td>
                    <td className="small">
                      {taxRate / 2}%<br/>{formatCurrency(taxAmount / 2, invoice.details.currency)}
                    </td>
                  </>
                ) : (
                  <td className="small">
                    {taxRate}%<br/>{formatCurrency(taxAmount, invoice.details.currency)}
                  </td>
                )}
                <td className="text-end fw-bold">{formatCurrency(total, invoice.details.currency)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals Box */}
      <div className="row mx-0 border-top border-dark mt-auto">
        <div className="col-8 border-end border-dark p-3 d-flex flex-column">
          {invoice.details.notes && (
            <div className="mb-2">
              <strong>Notes:</strong> <span className="small">{invoice.details.notes}</span>
            </div>
          )}
          <div className="mt-auto">
            <strong className="text-uppercase small">Amount in Words:</strong><br/>
            <span className="fw-bold">{numberToWords(invoice.totals.grandTotal)} {invoice.details.currency}</span>
          </div>
        </div>
        <div className="col-4 p-0">
          <table className="table table-sm table-borderless mb-0 h-100">
            <tbody>
              <tr>
                <td className="p-2">Taxable Amount</td>
                <td className="text-end p-2">{formatCurrency(invoice.totals.subtotal, invoice.details.currency)}</td>
              </tr>
              {invoice.totals.discount > 0 && (
                <tr>
                  <td className="p-2 text-danger">Discount</td>
                  <td className="text-end p-2 text-danger">-{formatCurrency(invoice.totals.discount, invoice.details.currency)}</td>
                </tr>
              )}
              {invoice.totals.tax > 0 && (
                <tr>
                  <td className="p-2">Total Tax</td>
                  <td className="text-end p-2">{formatCurrency(invoice.totals.tax, invoice.details.currency)}</td>
                </tr>
              )}
              <tr className="border-top border-dark">
                <td className="p-2">Round Off</td>
                <td className="text-end p-2">{formatCurrency(invoice.totals.roundOff, invoice.details.currency)}</td>
              </tr>
              <tr className="border-top border-dark table-light fw-bold">
                <td className="p-2">Grand Total</td>
                <td className="text-end p-2 fs-6">{formatCurrency(invoice.totals.grandTotal, invoice.details.currency)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer / Bank / Signature */}
      <div className="row mx-0 border-top border-dark text-start" style={{ minHeight: '120px' }}>
        <div className="col-7 border-end border-dark p-2">
          {invoice.business.bankDetails && (
            <div className="mb-2">
              <strong className="text-uppercase text-decoration-underline">Bank Details</strong>
              <p className="mb-0 small" style={{ whiteSpace: 'pre-wrap' }}>{invoice.business.bankDetails}</p>
            </div>
          )}
          {invoice.details.terms && (
            <div>
              <strong className="text-uppercase text-decoration-underline">Terms & Conditions</strong>
              <p className="mb-0 small" style={{ whiteSpace: 'pre-wrap' }}>{invoice.details.terms}</p>
            </div>
          )}
        </div>
        <div className="col-5 p-2 d-flex flex-column align-items-center justify-content-between text-center">
          <strong className="small">For {invoice.business.businessName}</strong>
          <div className="flex-grow-1 d-flex align-items-center justify-content-center">
            {invoice.business.signatureUrl ? (
              <img src={invoice.business.signatureUrl} alt="Signature" style={{ maxHeight: '50px', maxWidth: '150px' }} crossOrigin="anonymous" />
            ) : (
              <div style={{ height: '50px' }}></div>
            )}
          </div>
          <span className="small text-muted">Authorized Signatory</span>
        </div>
      </div>
    </div>
  );
};

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice }) => {
  const tpl = invoice.details.template || 'classic';

  if (tpl === 'shop') {
    return <ShopTemplate invoice={invoice} />;
  }
  if (tpl === 'electrical') {
    return <ElectricTemplate invoice={invoice} />;
  }
  if (tpl === 'fertilizer') {
    return <FertilizerTemplate invoice={invoice} />;
  }

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
                  <td className="text-muted fw-semibold pb-2 text-nowrap">Global Tax ({invoice.details.taxPercentage}%):</td>
                  <td className="pb-2 text-nowrap">{formatCurrency(invoice.totals.tax, invoice.details.currency)}</td>
                </tr>
              )}
              <tr className="border-bottom">
                <td className="text-muted fw-semibold pb-2 text-nowrap">Round Off:</td>
                <td className="pb-2 text-nowrap">{formatCurrency(invoice.totals.roundOff || 0, invoice.details.currency)}</td>
              </tr>
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
