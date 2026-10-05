import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import type { SharedInvoiceRecord } from '../../types';
import { InvoicePreview } from './InvoicePreview';
import { generatePDF } from '../../utils/pdf';

export const SharedInvoice: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [sharedRecord, setSharedRecord] = useState<SharedInvoiceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSharedInvoice = async () => {
      if (!shareId) return;

      if (import.meta.env.VITE_FIREBASE_API_KEY === 'AIzaSyDummyKeyForLocalTesting1234567890') {
        const mockShares = JSON.parse(localStorage.getItem('mock_shares') || '[]');
        const record = mockShares.find((s: any) => s.id === shareId);
        if (record && record.isActive) {
          setSharedRecord(record);
        } else {
          setError(record ? 'This invoice link has been revoked.' : 'Invoice not found.');
        }
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'shared_invoices', shareId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as SharedInvoiceRecord;
          if (data.isActive) {
            setSharedRecord(data);
          } else {
            setError('This invoice link has been revoked.');
          }
        } else {
          setError('Invoice not found.');
        }
      } catch (err) {
        console.error('Error fetching shared invoice:', err);
        setError('Failed to load invoice.');
      } finally {
        setLoading(false);
      }
    };
    fetchSharedInvoice();
  }, [shareId]);

  const handleDownload = () => {
    if (sharedRecord) {
      generatePDF('invoice-preview-container', sharedRecord.snapshot.details.invoiceNumber || 'Shared_Invoice');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>;
  }

  if (error || !sharedRecord) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger d-inline-block">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error || 'Invoice not found.'}
        </div>
        <div className="mt-3">
          <Link to="/" className="btn btn-primary">Go to InvoiceDesk</Link>
        </div>
      </div>
    );
  }

  // Construct a dummy invoice object just for preview rendering
  const previewInvoice = {
    ...sharedRecord.snapshot,
    userId: 'shared', // dummy
    id: 'shared',     // dummy
  };

  return (
    <div className="d-flex flex-column h-100 print-hide">
      {import.meta.env.VITE_FIREBASE_API_KEY === 'AIzaSyDummyKeyForLocalTesting1234567890' && (
        <div className="local-mock-banner">
          <i className="bi bi-info-circle-fill me-2"></i>
          LOCAL TEST MODE: Viewing locally shared mock invoice.
        </div>
      )}
      <nav className="navbar navbar-expand-lg navbar-dark border-bottom px-3 flex-shrink-0">
        <a className="navbar-brand d-flex align-items-center" href="#">
          <img src="/logo.jpg" alt="InvoiceDesk Logo" className="logo-img" />
          InvoiceDesk
        </a>
        <div className="ms-auto">
          <button className="btn btn-outline-secondary btn-sm me-2" onClick={handleDownload} title="Download PDF">
            <i className="bi bi-download me-1"></i> Download
          </button>
          <button className="btn btn-outline-secondary btn-sm" onClick={handlePrint} title="Print">
            <i className="bi bi-printer me-1"></i> Print
          </button>
        </div>
      </nav>

      <div className="flex-grow-1 overflow-auto p-4 d-flex justify-content-center">
        <div style={{ maxWidth: '210mm', width: '100%' }}>
          <InvoicePreview invoice={previewInvoice} />
        </div>
      </div>
    </div>
  );
};
