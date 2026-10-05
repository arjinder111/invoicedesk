import React from 'react';
import type { InvoiceData } from '../../../types';
import { numberToWords } from '../../../utils/formatters';

interface TemplateProps {
  invoice: InvoiceData;
}

export const FertilizerTemplate: React.FC<TemplateProps> = ({ invoice }) => {
  const { business, client, details, items, totals } = invoice;

  return (
    <div id="invoice-preview-container" className="invoice-paper bg-white text-dark" style={{ border: '1px solid #ccc', fontSize: '11px', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Header */}
      <div className="border-bottom border-dark position-relative p-2">
        <div className="d-flex justify-content-between text-start small mb-1">
          <div>
            <div>GSTIN: {business.taxRegistrationNumber || ''}</div>
            <div>PAN No: {business.pan || ''}</div>
          </div>
          <div className="text-end position-absolute end-0 top-0 p-2">
            <div className="border border-dark p-1 d-inline-block text-center fw-bold text-decoration-underline mb-1" style={{ fontSize: '14px' }}>TAX INVOICE</div>
            <div className="small">Mob: {business.phone}</div>
            <div className="small">(Original For Recipient)</div>
          </div>
        </div>
        
        <div className="text-center mt-3">
          <h2 className="fw-bold mb-0 text-uppercase" style={{ fontSize: '28px', color: '#1a1a1a', letterSpacing: '1px' }}>{business.businessName || 'BHARAT FERTILIZERS'}</h2>
          <div className="small text-uppercase">{business.address || '53-NEW GRAIN MARKET, MUKTSAR Pin-152026, State Name: Punjab(03)'}</div>
        </div>
      </div>

      {/* Billed To */}
      <div className="d-flex border-bottom border-dark">
        <div className="col-6 p-2 border-end border-dark">
          <div className="fw-bold fs-6">Name: {client.clientName || 'Cash'}</div>
          <div>{client.address}</div>
          <div>Lohara, State: {client.state || 'Punjab'}, State Code: {client.stateCode || '03'}</div>
          <div>GSTIN: {client.taxRegistrationNumber || 'Unregistered'}</div>
        </div>
        <div className="col-6 p-2 d-flex flex-column gap-1 small">
          <div className="d-flex justify-content-between"><span>Aadhar No:</span> <span>{client.pan || ''}</span></div>
          <div className="d-flex justify-content-between"><span>Mobile:</span> <span>{client.phone}</span></div>
          <div className="d-flex justify-content-between"><span>Invoice No:</span> <span className="fw-bold">{details.invoiceNumber}</span></div>
          <div className="d-flex justify-content-between"><span>Payment Mode:</span> <span>Credit</span></div>
          <div className="d-flex justify-content-between"><span>Place of Supply:</span> <span>{details.placeOfSupply || client.state || 'Punjab (03)'}</span></div>
          <div className="d-flex justify-content-between"><span>Date:</span> <span className="fw-bold">{new Date(details.invoiceDate).toLocaleDateString('en-GB')}</span></div>
          <div className="d-flex justify-content-between"><span>Reverse Charge:</span> <span>No</span></div>
        </div>
      </div>

      {/* Table */}
      <table className="table table-bordered border-dark mb-0 table-sm text-center align-middle" style={{ fontSize: '10px' }}>
        <thead>
          <tr>
            <th style={{ width: '3%' }}>#</th>
            <th className="text-start" style={{ width: '40%' }}>
              <div>Product/Packing</div>
              <div>Technical Name</div>
              <div>C.Name/Pesticide Name</div>
              <div>Batch No</div>
              <div>Mfg Dt</div>
              <div>Exp Dt</div>
            </th>
            <th>Unit</th>
            <th>Weight<br/>UOM</th>
            <th>Rate</th>
            <th>Amount</th>
            <th>HSN Code</th>
            <th>GST%</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const isInc = item.taxInclusive;
            const tr = item.taxRate || 0;
            const amount = item.unitPrice * item.quantity;
            let itemSub = 0;
            let itemTax = 0;
            if (isInc) {
              itemSub = amount / (1 + tr / 100);
              itemTax = amount - itemSub;
            } else {
              itemSub = amount;
              itemTax = (amount * tr) / 100;
            }
            const itemTotal = itemSub + itemTax;

            return (
              <tr key={index}>
                <td className="align-top">{index + 1}</td>
                <td className="text-start">
                  <div>{item.name}</div>
                  <div>{item.technicalName}</div>
                  <div>{item.company}</div>
                  <div>{item.batchNumber}</div>
                  <div>MFG:{item.mfgDate ? new Date(item.mfgDate).toLocaleDateString('en-GB') : ''}</div>
                  <div>EXP:{item.expDate ? new Date(item.expDate).toLocaleDateString('en-GB') : ''}</div>
                </td>
                <td className="align-top">{item.unit || '0'}</td>
                <td className="align-top">{item.weightPerPack} {item.billingUnit}</td>
                <td className="align-top">{item.unitPrice.toFixed(2)}</td>
                <td className="align-top">{itemSub.toFixed(2)}</td>
                <td className="align-top">{item.hsn}</td>
                <td className="align-top">{tr.toFixed(1)}%</td>
                <td className="align-top fw-bold text-end">{itemTotal.toFixed(2)}</td>
              </tr>
            );
          })}
          
          {/* Total Row */}
          <tr className="fw-bold">
            <td colSpan={2} className="text-start">Item Total</td>
            <td></td>
            <td>{items.reduce((acc, curr) => acc + (curr.weightPerPack || 0), 0).toFixed(2)}</td>
            <td></td>
            <td>{totals.subtotal.toFixed(2)}</td>
            <td></td>
            <td></td>
            <td className="text-end">{totals.grandTotal.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div className="d-flex mt-0">
        <div className="col-7 p-2 border-end border-dark d-flex flex-column">
          <div className="mb-2">Rs. ({numberToWords(totals.grandTotal)} only.)</div>
          
          <div className="mb-3">
            <pre className="mb-0 fw-bold" style={{ fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>{business.bankDetails || 'HDFC BANK\n50200027422406\nHDFC0001418'}</pre>
          </div>

          <div className="small text-muted mt-auto" style={{ fontSize: '9px' }}>
            {business.defaultTerms ? (
              <pre className="mb-0" style={{ fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>{business.defaultTerms}</pre>
            ) : (
              <div>ACEPHATE, BUPROFEZIN, THIAMETHOXAM, PROFENOPHOS...<br/>BANNED ON BASMATI</div>
            )}
            <div className="mt-3">Subject To MUKTSAR Jurisdiction only</div>
          </div>
        </div>

        <div className="col-5 p-0 d-flex flex-column position-relative">
          <table className="table table-sm table-borderless mb-0 w-100">
            <tbody>
              <tr>
                <td>Total Amount Before Tax</td>
                <td className="text-end">{totals.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td>SGST</td>
                <td className="text-end">{totals.tax ? (totals.tax / 2).toFixed(2) : '0.00'}</td>
              </tr>
              <tr>
                <td>CGST</td>
                <td className="text-end">{totals.tax ? (totals.tax / 2).toFixed(2) : '0.00'}</td>
              </tr>
              <tr className="border-top border-dark fw-bold" style={{ fontSize: '13px' }}>
                <td>Net Bill Amount</td>
                <td className="text-end">₹ {totals.grandTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div className="mt-auto p-2 d-flex justify-content-between align-items-end" style={{ minHeight: '80px' }}>
            <div className="small text-center" style={{ width: '80px', borderTop: '1px solid #000' }}>Customer Sign</div>
            <div className="text-end">
              <div className="fw-bold mb-4">For {business.businessName || 'BHARAT FERTILIZERS'}</div>
              {business.signatureUrl && <img src={business.signatureUrl} alt="Signature" height="40" className="mb-1" />}
              <div className="small">Prop.</div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};
