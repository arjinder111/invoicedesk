import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../context/AuthContext';
import type { InvoiceData } from '../../types';
import { generateInvoiceNumber } from '../../utils/formatters';
import { InvoiceEditor } from './InvoiceEditor';
import { InvoicePreview } from './InvoicePreview';
import { generatePDF } from '../../utils/pdf';
import { db } from '../../firebase/config';
import { collection, addDoc, updateDoc, doc, setDoc, getDoc } from 'firebase/firestore';

const initialInvoiceData: InvoiceData = {
  userId: '',
  status: 'Draft',
  business: {
    businessName: '',
    email: '',
    phone: '',
    address: '',
    taxRegistrationNumber: '',
  },
  client: {
    clientName: '',
    email: '',
    phone: '',
    address: '',
    taxRegistrationNumber: '',
  },
  details: {
    invoiceNumber: generateInvoiceNumber(),
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    currency: 'INR',
    notes: '',
    paymentInstructions: '',
    terms: '',
    taxPercentage: 0,
    discountType: 'percentage',
    discountValue: 0,
  },
  items: [
    { id: uuidv4(), name: '', description: '', unitPrice: 0, quantity: 1 }
  ],
  totals: {
    subtotal: 0,
    discount: 0,
    tax: 0,
    roundOff: 0,
    grandTotal: 0,
    totalPaid: 0,
    balanceDue: 0
  },
  payments: []
};

export const InvoiceWorkspace: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [invoice, setInvoice] = useState<InvoiceData>(
    location.state?.invoice || { ...initialInvoiceData, userId: currentUser?.uid || '' }
  );
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareLink, setShareLink] = useState('');

  // Load defaults for new invoice
  useEffect(() => {
    if (!location.state?.invoice && currentUser) {
      getDoc(doc(db, 'users', currentUser.uid)).then(docSnap => {
        if (docSnap.exists() && docSnap.data().businessProfile) {
          const bp = docSnap.data().businessProfile;
          setInvoice(prev => ({
            ...prev,
            business: {
              businessName: bp.businessName || '',
              email: bp.email || '',
              phone: bp.phone || '',
              address: bp.address || '',
              taxRegistrationNumber: bp.taxRegistrationNumber || '',
              pan: bp.pan || '',
              state: bp.state || '',
              stateCode: bp.stateCode || '',
              msme: bp.msme || '',
              tagline: bp.tagline || '',
              logoUrl: bp.logoUrl || '',
              signatureUrl: bp.signatureUrl || '',
              bankDetails: bp.bankDetails || '',
              businessType: bp.businessType || 'standard',
              defaultCurrency: bp.defaultCurrency || 'INR',
              paymentInstructions: bp.paymentInstructions || '',
              defaultTerms: bp.defaultTerms || ''
            },
            details: {
              ...prev.details,
              currency: bp.defaultCurrency || 'INR',
              template: bp.businessType === 'electrical' ? 'electrical' : (bp.businessType === 'fertilizer' ? 'fertilizer' : 'shop'),
              invoiceMode: bp.businessType || 'standard',
              paymentInstructions: bp.paymentInstructions || '',
              terms: bp.defaultTerms || ''
            }
          }));
        }
      }).catch(console.error);
    }
  }, [currentUser, location.state]);

  // Calculate totals whenever items or discount/tax changes
  useEffect(() => {
    let subtotal = 0;
    let totalTax = 0;
    
    invoice.items.forEach(item => {
      // Determine billable quantity
      let billableQty = item.quantity || 0;
      if (invoice.details.invoiceMode === 'fertilizer' && item.billingUnit === 'weight') {
        billableQty = (item.packs || 0) * (item.weightPerPack || 0);
      } else if (invoice.details.invoiceMode === 'fertilizer' && item.billingUnit === 'pack') {
        billableQty = item.packs || 0;
      }
      
      const rate = item.unitPrice || 0;
      const amount = billableQty * rate;
      
      let itemSubtotal = amount;
      let itemTax = 0;
      const taxRate = item.taxRate || 0;
      
      if (item.taxInclusive && taxRate > 0) {
        // Reverse calculate tax
        itemSubtotal = amount / (1 + taxRate / 100);
        itemTax = amount - itemSubtotal;
      } else if (taxRate > 0) {
        itemTax = (amount * taxRate) / 100;
      }
      
      subtotal += itemSubtotal;
      totalTax += itemTax;
    });

    let discount = 0;
    if (invoice.details.discountType === 'percentage') {
      discount = (subtotal * (invoice.details.discountValue || 0)) / 100;
    } else {
      discount = invoice.details.discountValue || 0;
    }

    if (discount > subtotal) {
      discount = subtotal; // Discount cannot exceed subtotal
    }

    const afterDiscount = subtotal - discount;
    const globalTax = (afterDiscount * (invoice.details.taxPercentage || 0)) / 100;
    
    // We add item-specific tax and global tax
    const combinedTax = totalTax + globalTax;
    const exactTotal = afterDiscount + combinedTax;
    const grandTotal = Math.round(exactTotal);
    const roundOff = grandTotal - exactTotal;

    let totalPaid = 0;
    (invoice.payments || []).forEach(p => {
      totalPaid += p.amount;
    });
    
    const balanceDue = grandTotal - totalPaid;
    
    let status = invoice.status || 'Draft';
    if (status !== 'Draft') {
      if (totalPaid >= grandTotal && grandTotal > 0) status = 'Paid';
      else if (totalPaid > 0) status = 'Partially Paid';
      else status = 'Unpaid';
    }

    setInvoice(prev => ({
      ...prev,
      status,
      totals: {
        subtotal,
        discount,
        tax: combinedTax,
        roundOff,
        grandTotal,
        totalPaid,
        balanceDue
      }
    }));
  }, [invoice.items, invoice.details.discountType, invoice.details.discountValue, invoice.details.taxPercentage, invoice.payments, invoice.status, invoice.details.invoiceMode]);

  const handleSave = async () => {
    if (!currentUser) return;
    if (import.meta.env.VITE_FIREBASE_API_KEY === 'AIzaSyDummyKeyForLocalTesting1234567890') {
      // LOCAL MOCK STORAGE
      setSaving(true);
      setTimeout(() => {
        const invoiceDataToSave = { ...invoice, updatedAt: new Date().toISOString() };
        if (!invoiceDataToSave.id) invoiceDataToSave.id = uuidv4();
        if (!invoiceDataToSave.createdAt) invoiceDataToSave.createdAt = new Date().toISOString();
        
        const existing = JSON.parse(localStorage.getItem('mock_invoices') || '[]');
        const idx = existing.findIndex((i: any) => i.id === invoiceDataToSave.id);
        if (idx >= 0) existing[idx] = invoiceDataToSave;
        else existing.push(invoiceDataToSave);
        
        localStorage.setItem('mock_invoices', JSON.stringify(existing));
        setInvoice(invoiceDataToSave);
        setSaving(false);
        alert('Saved locally! (This is a local storage mock because Firebase is not configured)');
      }, 500);
      return;
    }
    setSaving(true);
    try {
      const invoiceDataToSave = {
        ...invoice,
        updatedAt: new Date().toISOString(),
      };

      if (invoice.id) {
        const docRef = doc(db, 'invoices', invoice.id);
        await updateDoc(docRef, invoiceDataToSave);
      } else {
        invoiceDataToSave.createdAt = new Date().toISOString();
        const docRef = await addDoc(collection(db, 'invoices'), invoiceDataToSave);
        setInvoice({ ...invoiceDataToSave, id: docRef.id });
      }
      alert('Invoice saved successfully!');
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Failed to save invoice.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    generatePDF('invoice-preview-container', invoice.details.invoiceNumber || 'Invoice');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!currentUser || !invoice.id) {
      alert('Please save the invoice first before sharing.');
      return;
    }
    if (import.meta.env.VITE_FIREBASE_API_KEY === 'AIzaSyDummyKeyForLocalTesting1234567890') {
      // LOCAL MOCK STORAGE
      setSharing(true);
      setTimeout(() => {
        const shareId = uuidv4();
        const shareData = {
          id: shareId,
          invoiceId: invoice.id,
          userId: currentUser.uid,
          snapshot: {
            status: invoice.status,
            business: invoice.business,
            client: invoice.client,
            details: invoice.details,
            items: invoice.items,
            totals: invoice.totals,
            payments: invoice.payments
          },
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const existing = JSON.parse(localStorage.getItem('mock_shares') || '[]');
        existing.push(shareData);
        localStorage.setItem('mock_shares', JSON.stringify(existing));
        const link = `${window.location.origin}/share/${shareId}`;
        setShareLink(link);
        setSharing(false);
      }, 500);
      return;
    }
    setSharing(true);
    try {
      const shareId = uuidv4();
      const shareData = {
        id: shareId,
        invoiceId: invoice.id,
        userId: currentUser.uid,
        snapshot: {
          status: invoice.status,
          business: invoice.business,
          client: invoice.client,
          details: invoice.details,
          items: invoice.items,
          totals: invoice.totals,
          payments: invoice.payments
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'shared_invoices', shareId), shareData);
      const link = `${window.location.origin}/share/${shareId}`;
      setShareLink(link);
    } catch (error) {
      console.error('Error generating share link:', error);
      alert('Failed to generate share link.');
    } finally {
      setSharing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="d-flex flex-column h-100">
      {import.meta.env.VITE_FIREBASE_API_KEY === 'AIzaSyDummyKeyForLocalTesting1234567890' && (
        <div className="local-mock-banner">
          <i className="bi bi-info-circle-fill me-2"></i>
          LOCAL TEST MODE: Saving and Sharing are using LocalStorage. Provide Firebase Config for Cloud integration.
        </div>
      )}
      <nav className="navbar navbar-expand-lg navbar-dark border-bottom px-3 flex-shrink-0 print-hide">
        <a className="navbar-brand d-flex align-items-center" href="#">
          <img src="/logo.jpg" alt="InvoiceDesk Logo" className="logo-img" />
          InvoiceDesk
        </a>
        <div className="ms-auto d-flex gap-2 align-items-center">
          <button className="btn btn-outline-info btn-sm" onClick={() => navigate('/profile')} title="Settings">
            <i className="bi bi-gear"></i>
          </button>
          <button className="btn btn-outline-primary btn-sm" onClick={() => navigate('/invoices')}>Saved Invoices</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button className="btn btn-outline-secondary btn-sm" onClick={handleDownload} title="Download PDF">
            <i className="bi bi-download"></i>
          </button>
          <button className="btn btn-outline-secondary btn-sm" onClick={handlePrint} title="Print">
            <i className="bi bi-printer"></i>
          </button>
          <button className="btn btn-outline-secondary btn-sm" onClick={handleShare} title="Share" disabled={sharing}>
            <i className="bi bi-share"></i>
          </button>
          <button className="btn btn-outline-danger btn-sm ms-2" onClick={logout} title="Logout">
            <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </nav>

      {shareLink && (
        <div className="alert alert-info m-3 d-flex justify-content-between align-items-center">
          <div>
            <strong>Share Link generated!</strong> Anyone with this link can view the invoice snapshot.
            <br />
            <a href={shareLink} target="_blank" rel="noreferrer" className="text-break">{shareLink}</a>
          </div>
          <button className="btn btn-sm btn-info text-white" onClick={copyToClipboard}>Copy</button>
        </div>
      )}

      {/* Mobile Tabs */}
      <div className="d-lg-none border-bottom bg-white d-flex print-hide">
        <button 
          className={`btn flex-fill rounded-0 ${activeTab === 'edit' ? 'btn-primary' : 'btn-light'}`}
          onClick={() => setActiveTab('edit')}
        >
          Edit
        </button>
        <button 
          className={`btn flex-fill rounded-0 ${activeTab === 'preview' ? 'btn-primary' : 'btn-light'}`}
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </button>
      </div>

      <div className="workspace-container flex-grow-1">
        <div className={`editor-pane print-hide ${activeTab === 'edit' ? 'd-block' : 'd-none d-lg-block'}`}>
          <InvoiceEditor invoice={invoice} setInvoice={setInvoice} />
        </div>
        <div className={`preview-pane ${activeTab === 'preview' ? 'd-block' : 'd-none d-lg-flex'}`}>
          <InvoicePreview invoice={invoice} />
        </div>
      </div>
    </div>
  );
};
