import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, deleteDoc, doc, runTransaction } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import type { InvoiceData, PaymentRecord } from '../../types';
import { formatCurrency, generateInvoiceNumber } from '../../utils/formatters';
import { v4 as uuidv4 } from 'uuid';

export const InvoiceList: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], method: 'Bank Transfer', reference: '' });
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!currentUser) return;
      if (import.meta.env.VITE_FIREBASE_API_KEY === 'AIzaSyDummyKeyForLocalTesting1234567890') {
        const mockData = JSON.parse(localStorage.getItem('mock_invoices') || '[]');
        mockData.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setInvoices(mockData);
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, 'invoices'),
          where('userId', '==', currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const data: InvoiceData[] = [];
        querySnapshot.forEach((doc) => {
          data.push({ ...doc.data(), id: doc.id } as InvoiceData);
        });
        // Sort by createdAt descending locally since composite index might be needed otherwise
        data.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        setInvoices(data);
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [currentUser]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    
    if (import.meta.env.VITE_FIREBASE_API_KEY === 'AIzaSyDummyKeyForLocalTesting1234567890') {
      const existing = JSON.parse(localStorage.getItem('mock_invoices') || '[]');
      const filtered = existing.filter((i: any) => i.id !== id);
      localStorage.setItem('mock_invoices', JSON.stringify(filtered));
      setInvoices(filtered);
      return;
    }

    try {
      await deleteDoc(doc(db, 'invoices', id));
      setInvoices(invoices.filter(inv => inv.id !== id));
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice.');
    }
  };

  const handleDuplicate = (inv: InvoiceData) => {
    const duplicated: InvoiceData = {
      ...inv,
      id: undefined,
      status: 'Draft',
      details: {
        ...inv.details,
        invoiceNumber: generateInvoiceNumber(),
        invoiceDate: new Date().toISOString().split('T')[0]
      },
      totals: {
        ...inv.totals,
        totalPaid: 0,
        balanceDue: inv.totals.grandTotal
      },
      payments: []
    };
    navigate('/', { state: { invoice: duplicated } });
  };

  const handleOpenPayments = (inv: InvoiceData) => {
    setSelectedInvoice(inv);
    setPaymentError('');
    setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], method: 'Bank Transfer', reference: '' });
    setShowPaymentModal(true);
  };

  const handleAddPayment = async () => {
    if (!selectedInvoice?.id) return;
    const amount = parseFloat(paymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      setPaymentError('Payment amount must be greater than zero.');
      return;
    }
    
    try {
      await runTransaction(db, async (t) => {
        const invRef = doc(db, 'invoices', selectedInvoice.id!);
        const invSnap = await t.get(invRef);
        if (!invSnap.exists()) throw new Error('Invoice not found');
        
        const data = invSnap.data() as InvoiceData;
        const currentPaid = data.totals?.totalPaid || 0;
        const balance = data.totals.grandTotal - currentPaid;
        
        if (amount > balance) throw new Error(`Payment exceeds balance due (${formatCurrency(balance, data.details.currency)})`);
        
        const newPayment: PaymentRecord = {
          id: uuidv4(),
          amount,
          date: paymentForm.date,
          method: paymentForm.method,
          reference: paymentForm.reference
        };
        const newPayments = [...(data.payments || []), newPayment];
        
        const newTotalPaid = currentPaid + amount;
        const newBalance = data.totals.grandTotal - newTotalPaid;
        
        let newStatus = 'Draft';
        if (newTotalPaid >= data.totals.grandTotal && data.totals.grandTotal > 0) newStatus = 'Paid';
        else if (newTotalPaid > 0) newStatus = 'Partially Paid';
        else newStatus = 'Unpaid';
        
        t.update(invRef, {
          payments: newPayments,
          'totals.totalPaid': newTotalPaid,
          'totals.balanceDue': newBalance,
          status: newStatus
        });
      });
      
      // Update local state
      setInvoices(prev => prev.map(inv => {
        if (inv.id === selectedInvoice.id) {
          const newTotalPaid = inv.totals.totalPaid + amount;
          return {
            ...inv,
            payments: [...(inv.payments || []), { id: uuidv4(), amount, date: paymentForm.date, method: paymentForm.method, reference: paymentForm.reference }],
            totals: { ...inv.totals, totalPaid: newTotalPaid, balanceDue: inv.totals.grandTotal - newTotalPaid },
            status: newTotalPaid >= inv.totals.grandTotal ? 'Paid' : 'Partially Paid'
          };
        }
        return inv;
      }));
      
      const newTotalPaid = selectedInvoice.totals.totalPaid + amount;
      setSelectedInvoice(prev => prev ? {
        ...prev,
        payments: [...(prev.payments || []), { id: uuidv4(), amount, date: paymentForm.date, method: paymentForm.method, reference: paymentForm.reference }],
        totals: { ...prev.totals, totalPaid: newTotalPaid, balanceDue: prev.totals.grandTotal - newTotalPaid },
        status: newTotalPaid >= prev.totals.grandTotal ? 'Paid' : 'Partially Paid'
      } : null);
      
      setPaymentForm({ ...paymentForm, amount: '', reference: '' });
      setPaymentError('');
    } catch (err: any) {
      setPaymentError(err.message);
    }
  };

  const handleRemovePayment = async (paymentId: string) => {
    if (!selectedInvoice?.id) return;
    if (!window.confirm('Remove this payment record?')) return;
    
    try {
      await runTransaction(db, async (t) => {
        const invRef = doc(db, 'invoices', selectedInvoice.id!);
        const invSnap = await t.get(invRef);
        if (!invSnap.exists()) throw new Error('Invoice not found');
        
        const data = invSnap.data() as InvoiceData;
        const targetPayment = data.payments?.find(p => p.id === paymentId);
        if (!targetPayment) throw new Error('Payment record not found');
        
        const newPayments = data.payments.filter(p => p.id !== paymentId);
        const newTotalPaid = (data.totals?.totalPaid || 0) - targetPayment.amount;
        const newBalance = data.totals.grandTotal - newTotalPaid;
        
        let newStatus = 'Draft';
        if (newTotalPaid >= data.totals.grandTotal && data.totals.grandTotal > 0) newStatus = 'Paid';
        else if (newTotalPaid > 0) newStatus = 'Partially Paid';
        else newStatus = 'Unpaid';
        
        t.update(invRef, {
          payments: newPayments,
          'totals.totalPaid': newTotalPaid,
          'totals.balanceDue': newBalance,
          status: newStatus
        });
      });
      
      // Update local state
      const targetAmount = selectedInvoice.payments.find(p => p.id === paymentId)?.amount || 0;
      setInvoices(prev => prev.map(inv => {
        if (inv.id === selectedInvoice.id) {
          const newTotalPaid = inv.totals.totalPaid - targetAmount;
          return {
            ...inv,
            payments: inv.payments.filter(p => p.id !== paymentId),
            totals: { ...inv.totals, totalPaid: newTotalPaid, balanceDue: inv.totals.grandTotal - newTotalPaid },
            status: newTotalPaid <= 0 ? 'Unpaid' : (newTotalPaid >= inv.totals.grandTotal ? 'Paid' : 'Partially Paid')
          };
        }
        return inv;
      }));
      
      const newTotalPaid = selectedInvoice.totals.totalPaid - targetAmount;
      setSelectedInvoice(prev => prev ? {
        ...prev,
        payments: prev.payments.filter(p => p.id !== paymentId),
        totals: { ...prev.totals, totalPaid: newTotalPaid, balanceDue: prev.totals.grandTotal - newTotalPaid },
        status: newTotalPaid <= 0 ? 'Unpaid' : (newTotalPaid >= prev.totals.grandTotal ? 'Paid' : 'Partially Paid')
      } : null);
      
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="d-flex flex-column h-100 pb-5">
      {import.meta.env.VITE_FIREBASE_API_KEY === 'AIzaSyDummyKeyForLocalTesting1234567890' && (
        <div className="local-mock-banner">
          <i className="bi bi-info-circle-fill me-2"></i>
          LOCAL TEST MODE: Showing locally saved mock invoices. Provide Firebase Config for Cloud integration.
        </div>
      )}
      <nav className="navbar navbar-expand-lg navbar-dark border-bottom px-3 flex-shrink-0 mb-4">
        <a className="navbar-brand d-flex align-items-center cursor-pointer" onClick={() => navigate('/')}>
          <img src="/logo.jpg" alt="InvoiceDesk Logo" className="logo-img" />
          InvoiceDesk
        </a>
        <div className="ms-auto d-flex gap-2 align-items-center">
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/')}>New Invoice</button>
          <button className="btn btn-outline-danger btn-sm" onClick={logout}>
             <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </nav>

      <div className="container">
        <h2 className="mb-4">Saved Invoices</h2>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-5 glass-panel">
          <h5 className="text-secondary">No invoices found.</h5>
          <button className="btn btn-primary mt-3" onClick={() => navigate('/')}>Create Your First Invoice</button>
        </div>
      ) : (
        <div className="table-responsive glass-panel p-0">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Invoice No</th>
                <th>Client</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="fw-bold">{inv.details.invoiceNumber}</td>
                  <td>{inv.client.clientName || 'N/A'}</td>
                  <td>{new Date(inv.details.invoiceDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${inv.status === 'Paid' ? 'bg-success' : inv.status === 'Partially Paid' ? 'bg-warning text-dark' : inv.status === 'Unpaid' ? 'bg-danger' : 'bg-secondary'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="fw-bold text-primary">{formatCurrency(inv.totals.grandTotal, inv.details.currency)}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-info me-2" onClick={() => handleOpenPayments(inv)} title="Record Payments">
                      <i className="bi bi-currency-dollar"></i> Pay
                    </button>
                    <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => handleDuplicate(inv)} title="Duplicate">
                      <i className="bi bi-files"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => navigate('/', { state: { invoice: inv } })}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => inv.id && handleDelete(inv.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {/* Payment Tracking Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold">Payments for {selectedInvoice.details.invoiceNumber}</h5>
                <button type="button" className="btn-close" onClick={() => setShowPaymentModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-4">
                  <div className="col-4 text-center">
                    <div className="text-muted small text-uppercase fw-bold">Grand Total</div>
                    <div className="fs-4 fw-bold">{formatCurrency(selectedInvoice.totals.grandTotal, selectedInvoice.details.currency)}</div>
                  </div>
                  <div className="col-4 text-center text-success border-start border-end">
                    <div className="text-muted small text-uppercase fw-bold">Amount Paid</div>
                    <div className="fs-4 fw-bold">{formatCurrency(selectedInvoice.totals.totalPaid || 0, selectedInvoice.details.currency)}</div>
                  </div>
                  <div className="col-4 text-center text-danger">
                    <div className="text-muted small text-uppercase fw-bold">Balance Due</div>
                    <div className="fs-4 fw-bold">{formatCurrency(selectedInvoice.totals.balanceDue || selectedInvoice.totals.grandTotal, selectedInvoice.details.currency)}</div>
                  </div>
                </div>

                <div className="card mb-4">
                  <div className="card-header bg-white fw-bold">Record New Payment</div>
                  <div className="card-body bg-light">
                    {paymentError && <div className="alert alert-danger py-2">{paymentError}</div>}
                    <div className="row g-2 align-items-end">
                      <div className="col-md-3">
                        <label className="form-label small">Amount ({selectedInvoice.details.currency})</label>
                        <input type="number" min="0" step="any" className="form-control form-control-sm" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small">Date</label>
                        <input type="date" className="form-control form-control-sm" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small">Method</label>
                        <select className="form-select form-select-sm" value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value})}>
                          <option>Bank Transfer</option>
                          <option>Cash</option>
                          <option>Credit Card</option>
                          <option>Check</option>
                          <option>UPI / Wallet</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small">Reference (Opt)</label>
                        <input type="text" className="form-control form-control-sm" value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})} placeholder="Txn ID" />
                      </div>
                      <div className="col-12 mt-3 text-end">
                        <button className="btn btn-sm btn-primary" onClick={handleAddPayment} disabled={!paymentForm.amount}>
                          Add Payment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <h6 className="fw-bold mb-3">Payment History</h6>
                {(!selectedInvoice.payments || selectedInvoice.payments.length === 0) ? (
                  <p className="text-muted fst-italic">No payments recorded yet.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Date</th>
                          <th>Method</th>
                          <th>Reference</th>
                          <th className="text-end">Amount</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.payments.map(p => (
                          <tr key={p.id}>
                            <td>{new Date(p.date).toLocaleDateString()}</td>
                            <td>{p.method}</td>
                            <td>{p.reference || '-'}</td>
                            <td className="text-end fw-bold text-success">{formatCurrency(p.amount, selectedInvoice.details.currency)}</td>
                            <td className="text-end">
                              <button className="btn btn-sm btn-outline-danger py-0 px-2" onClick={() => handleRemovePayment(p.id)} title="Remove Payment">
                                <i className="bi bi-x"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
              <div className="modal-footer border-top-0">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
