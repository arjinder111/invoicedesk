import React from 'react';
import type { InvoiceData } from '../../../types';
import { numberToWords } from '../../../utils/formatters';

interface TemplateProps {
  invoice: InvoiceData;
}

export const ElectricTemplate: React.FC<TemplateProps> = ({ invoice }) => {
  const { business, client, details, items, totals } = invoice;

  return (
    <div id="invoice-preview-container" className="invoice-paper bg-white text-dark" style={{ border: '1px solid #ccc', fontSize: '11px', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Header */}
      <div className="border-bottom border-dark p-2 text-center position-relative">
        <div className="d-flex justify-content-between text-start small mb-1">
          <div>
            <div>GSTIN: {business.taxRegistrationNumber || 'Unregistered'} {business.msme ? `, MSME: ${business.msme}` : ''}</div>
            <div>PAN No: {business.pan || ''}</div>
          </div>
          <div className="text-center fw-bold text-decoration-underline" style={{ fontSize: '14px' }}>TAX INVOICE</div>
          <div className="text-end">
            <div>Mobile: {business.phone}</div>
            {business.email && <div>Email: {business.email}</div>}
            <div>(Original For Recipient)</div>
          </div>
        </div>
        
        <h2 className="fw-bold mb-0 text-uppercase" style={{ fontSize: '24px' }}>{business.businessName || 'MOST WELCOME ELECTRIC STORE'}</h2>
        <div className="small fw-bold">{business.tagline || 'SAMSUNG, LG, HAIER, DAIKIN, LLOYD'}</div>
        <div className="small text-uppercase">{business.address || 'OPP HOSPITAL, MUKTSAR SAHIB'}</div>
      </div>

      {/* Billed To */}
      <div className="d-flex border-bottom border-dark">
        <div className="col-7 p-2 border-end border-dark">
          <div className="fw-bold">Name: {client.clientName || 'Cash'}</div>
          <div>{client.address}</div>
          <div>State: {client.state || 'Punjab'}, State Code: {client.stateCode || '03'}</div>
          <div>GSTIN: {client.taxRegistrationNumber || 'Unregistered'}</div>
          <div className="mt-2 text-end pe-4">Mobile: {client.phone}</div>
        </div>
        <div className="col-5 p-2 d-flex flex-column gap-1 small">
          <div className="d-flex justify-content-between"><span>Invoice No:</span> <span className="fw-bold">{details.invoiceNumber}</span></div>
          <div className="d-flex justify-content-between"><span>Date:</span> <span className="fw-bold">{new Date(details.invoiceDate).toLocaleDateString('en-GB')}</span></div>
          <div className="d-flex justify-content-between"><span>Payment Mode:</span> <span>Credit</span></div>
          <div className="d-flex justify-content-between"><span>Reverse Charge:</span> <span>No</span></div>
          <div className="d-flex justify-content-between"><span>Place of Supply:</span> <span>{details.placeOfSupply || client.state || 'Punjab (03)'}</span></div>
          <div className="d-flex justify-content-between"><span>GR.No:</span> <span>0</span></div>
        </div>
      </div>

      {/* Table */}
      <table className="table table-bordered border-dark mb-0 table-sm text-center align-middle" style={{ fontSize: '10px' }}>
        <thead>
          <tr>
            <th rowSpan={2} style={{ width: '3%' }}>#</th>
            <th rowSpan={2} className="text-start">Description of Goods</th>
            <th rowSpan={2}>HSN</th>
            <th rowSpan={2}>Unit</th>
            <th rowSpan={2}>Qty</th>
            <th rowSpan={2}>UOM</th>
            <th rowSpan={2}>Inc.Rate</th>
            <th rowSpan={2}>Discount</th>
            <th rowSpan={2}>Taxable<br/>Amount</th>
            <th colSpan={2}>SGST</th>
            <th colSpan={2}>CGST</th>
            <th rowSpan={2}>Amount</th>
          </tr>
          <tr>
            <th>%</th>
            <th>Amount</th>
            <th>%</th>
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
            const cgst = itemTax / 2;
            const sgst = itemTax / 2;
            const itemTotal = itemSub + itemTax;

            return (
              <tr key={index}>
                <td>{index + 1}</td>
                <td className="text-start">
                  <div className="fw-bold">{item.name}</div>
                  {(item.modelNumber || item.serialNumber) && (
                    <div className="small">({item.serialNumber || ''}{item.serialNumber && item.modelNumber ? ',' : ''}{item.modelNumber || ''})</div>
                  )}
                </td>
                <td>{item.hsn}</td>
                <td>{item.unit || '0'}</td>
                <td>{item.quantity}</td>
                <td>{item.unit || 'Pcs'}</td>
                <td>{item.unitPrice.toFixed(2)}</td>
                <td>0.00</td>
                <td>{itemSub.toFixed(2)}</td>
                <td>{(tr / 2).toFixed(2)}%</td>
                <td>{sgst.toFixed(2)}</td>
                <td>{(tr / 2).toFixed(2)}%</td>
                <td>{cgst.toFixed(2)}</td>
                <td className="fw-bold text-end">{itemTotal.toFixed(2)}</td>
              </tr>
            );
          })}
          
          {/* Total Row */}
          <tr className="fw-bold">
            <td colSpan={4} className="text-start">Item Total</td>
            <td>{items.reduce((acc, curr) => acc + curr.quantity, 0)}</td>
            <td></td>
            <td></td>
            <td>0.00</td>
            <td>{totals.subtotal.toFixed(2)}</td>
            <td colSpan={2}>{totals.tax ? (totals.tax / 2).toFixed(2) : '0.00'}</td>
            <td colSpan={2}>{totals.tax ? (totals.tax / 2).toFixed(2) : '0.00'}</td>
            <td className="text-end">{totals.grandTotal.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div className="d-flex mt-0">
        <div className="col-8 p-2 border-end border-dark">
          <div className="mb-2">Rs. ({numberToWords(totals.grandTotal)} only.)</div>
          
          <div className="mb-3 fst-italic">
            <div className="fw-bold">BANK DETAILS</div>
            <pre className="mb-0" style={{ fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>{business.bankDetails || 'BANK NAME:- AXIS BANK\nA/C NO:- 917030069525881\nIFSC CODE:- UTIB0000834'}</pre>
          </div>

          <div className="small" style={{ fontSize: '9px' }}>
            {business.defaultTerms ? (
              <pre className="mb-0" style={{ fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>{business.defaultTerms}</pre>
            ) : (
              <>
                <div>* We are not responsible for loss & damage occured by Transport in transist.</div>
                <div>* Interest @ 18% will be charged if the payment is not made within 7 days.</div>
                <div>* I am liable to paytax on the value above and authorised to sign this invoice.</div>
                <div>E.&O.E. Subject To MUKTSAR SAHIB Jurisdiction only.</div>
              </>
            )}
            <div className="mt-2 text-center text-muted">This is a computer-generated document. No Mannual signature is required.</div>
          </div>
        </div>

        <div className="col-4 p-0 d-flex flex-column">
          <table className="table table-sm table-borderless mb-0">
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
                <td>Net Amount</td>
                <td className="text-end">₹ {totals.grandTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div className="mt-auto p-2 text-end">
            <div className="fw-bold fst-italic mb-4">For {business.businessName || 'MOST WELCOME ELECTRIC STORE'}</div>
            {business.signatureUrl && <img src={business.signatureUrl} alt="Signature" height="40" className="mb-1" />}
            <div className="small">Prop.</div>
          </div>
        </div>
      </div>
      
    </div>
  );
};
