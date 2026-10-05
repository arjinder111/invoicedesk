import React from 'react';
import type { InvoiceData, LineItem } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface InvoiceEditorProps {
  invoice: InvoiceData;
  setInvoice: React.Dispatch<React.SetStateAction<InvoiceData>>;
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({ invoice, setInvoice }) => {
  const updateBusiness = (field: keyof InvoiceData['business'], value: string) => {
    setInvoice(prev => ({ ...prev, business: { ...prev.business, [field]: value } }));
  };

  const updateClient = (field: keyof InvoiceData['client'], value: string) => {
    setInvoice(prev => ({ ...prev, client: { ...prev.client, [field]: value } }));
  };

  const updateDetails = (field: keyof InvoiceData['details'], value: string | number) => {
    setInvoice(prev => ({ ...prev, details: { ...prev.details, [field]: value } }));
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { id: uuidv4(), name: '', description: '', unitPrice: 0, quantity: 1 }]
    }));
  };

  const removeItem = (id: string) => {
    if (invoice.items.length <= 1) return; // Keep at least one item
    setInvoice(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  return (
    <div className="pb-5">
      <h4 className="mb-4 text-primary">Invoice Details</h4>
      
      {/* Business Details */}
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-light fw-bold">Business (Your Details)</div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Business Name</label>
              <input type="text" className="form-control" value={invoice.business.businessName} onChange={(e) => updateBusiness('businessName', e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={invoice.business.email} onChange={(e) => updateBusiness('email', e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Phone</label>
              <input type="text" className="form-control" value={invoice.business.phone} onChange={(e) => updateBusiness('phone', e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Tax Reg. Number</label>
              <input type="text" className="form-control" value={invoice.business.taxRegistrationNumber} onChange={(e) => updateBusiness('taxRegistrationNumber', e.target.value)} placeholder="Optional" />
            </div>
            <div className="col-12">
              <label className="form-label">Address</label>
              <textarea className="form-control" rows={2} value={invoice.business.address} onChange={(e) => updateBusiness('address', e.target.value)}></textarea>
            </div>
          </div>
        </div>
      </div>

      {/* Client Details */}
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-light fw-bold">Client (Billed To)</div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Client Name</label>
              <input type="text" className="form-control" value={invoice.client.clientName} onChange={(e) => updateClient('clientName', e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={invoice.client.email} onChange={(e) => updateClient('email', e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Phone</label>
              <input type="text" className="form-control" value={invoice.client.phone} onChange={(e) => updateClient('phone', e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Tax Reg. Number</label>
              <input type="text" className="form-control" value={invoice.client.taxRegistrationNumber} onChange={(e) => updateClient('taxRegistrationNumber', e.target.value)} placeholder="Optional" />
            </div>
            <div className="col-12">
              <label className="form-label">Address</label>
              <textarea className="form-control" rows={2} value={invoice.client.address} onChange={(e) => updateClient('address', e.target.value)}></textarea>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Settings */}
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-light fw-bold">Invoice Settings</div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Invoice Number</label>
              <input type="text" className="form-control" value={invoice.details.invoiceNumber} onChange={(e) => updateDetails('invoiceNumber', e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Date</label>
              <input type="date" className="form-control" value={invoice.details.invoiceDate} onChange={(e) => updateDetails('invoiceDate', e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Due Date (Optional)</label>
              <input type="date" className="form-control" value={invoice.details.dueDate} onChange={(e) => updateDetails('dueDate', e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Currency</label>
              <select className="form-select" value={invoice.details.currency} onChange={(e) => updateDetails('currency', e.target.value)}>
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Discount Type</label>
              <select className="form-select" value={invoice.details.discountType} onChange={(e) => updateDetails('discountType', e.target.value as 'percentage' | 'fixed')}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Discount Value</label>
              <input type="number" min="0" step="any" className="form-control" value={invoice.details.discountValue} onChange={(e) => updateDetails('discountValue', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Tax (%)</label>
              <input type="number" min="0" max="100" step="any" className="form-control" value={invoice.details.taxPercentage} onChange={(e) => updateDetails('taxPercentage', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-light fw-bold d-flex justify-content-between align-items-center">
          <span>Line Items</span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table mb-0 table-borderless align-middle">
              <thead className="table-light">
                <tr>
                  <th>Item</th>
                  <th style={{ width: '120px' }}>Qty</th>
                  <th style={{ width: '150px' }}>Price</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-bottom">
                    <td>
                      <input type="text" className="form-control mb-1" placeholder="Item name" value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)} />
                      <input type="text" className="form-control form-control-sm text-muted" placeholder="Description (optional)" value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} />
                    </td>
                    <td>
                      <input type="number" min="0" step="any" className="form-control" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} />
                    </td>
                    <td>
                      <input type="number" min="0" step="any" className="form-control" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} />
                    </td>
                    <td className="text-center">
                      <button className="btn btn-outline-danger btn-sm" onClick={() => removeItem(item.id)} disabled={invoice.items.length === 1} title="Remove item">
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-light border-top">
            <button className="btn btn-outline-primary btn-sm" onClick={addItem}>
              <i className="bi bi-plus-circle me-1"></i> Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Notes & Terms */}
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-light fw-bold">Additional Information</div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows={2} value={invoice.details.notes} onChange={(e) => updateDetails('notes', e.target.value)} placeholder="Thanks for your business!"></textarea>
            </div>
            <div className="col-12">
              <label className="form-label">Payment Instructions</label>
              <textarea className="form-control" rows={2} value={invoice.details.paymentInstructions} onChange={(e) => updateDetails('paymentInstructions', e.target.value)} placeholder="Bank Details, UPI, etc."></textarea>
            </div>
            <div className="col-12">
              <label className="form-label">Terms & Conditions</label>
              <textarea className="form-control" rows={2} value={invoice.details.terms} onChange={(e) => updateDetails('terms', e.target.value)} placeholder="Payment due within 15 days."></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
