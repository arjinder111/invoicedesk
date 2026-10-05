import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import type { InvoiceData } from '../../types';
import { formatCurrency } from '../../utils/formatters';

export const InvoiceList: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
                  <td className="fw-bold text-primary">{formatCurrency(inv.totals.grandTotal, inv.details.currency)}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => {
                      // In a real app, you might use context or local storage to pass the data, 
                      // or fetch it in the workspace based on URL param. For simplicity, 
                      // we can pass via state.
                      navigate('/', { state: { invoice: inv } });
                    }}>Edit</button>
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
    </div>
  );
};
