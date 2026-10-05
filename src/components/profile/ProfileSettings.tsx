import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile, updateEmail, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import type { BusinessProfile, UserProfile } from '../../types';

export const ProfileSettings: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'personal' | 'business' | 'security'>('personal');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  // Personal Profile State
  const [personal, setPersonal] = useState<UserProfile>({
    displayName: '',
    phoneNumber: '',
    photoURL: ''
  });
  const [newPhoto, setNewPhoto] = useState<File | null>(null);

  // Business Profile State
  const [business, setBusiness] = useState<BusinessProfile>({
    businessName: '', email: '', phone: '', address: '', taxRegistrationNumber: '',
    logoUrl: '', defaultCurrency: 'INR', preferredTemplate: 'classic',
    paymentInstructions: '', bankDetails: '', defaultTerms: ''
  });
  const [newLogo, setNewLogo] = useState<File | null>(null);

  // Security State
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');

  const isGoogleAuth = currentUser?.providerData.some(p => p.providerId === 'google.com');

  useEffect(() => {
    if (currentUser) {
      setPersonal({
        displayName: currentUser.displayName || '',
        photoURL: currentUser.photoURL || '',
        phoneNumber: '' // Will fetch below
      });
      fetchProfiles();
    }
  }, [currentUser]);

  const fetchProfiles = async () => {
    if (!currentUser) return;
    try {
      const pDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (pDoc.exists() && pDoc.data().personalProfile) {
        setPersonal(prev => ({ ...prev, phoneNumber: pDoc.data().personalProfile.phoneNumber || '' }));
      }
      if (pDoc.exists() && pDoc.data().businessProfile) {
        setBusiness({ ...business, ...pDoc.data().businessProfile });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePersonalSave = async () => {
    if (!currentUser) return;
    setLoading(true);
    setMessage(null);
    try {
      let photoURL = personal.photoURL;
      if (newPhoto) {
        if (newPhoto.size > 2 * 1024 * 1024) throw new Error('Photo must be less than 2MB');
        const photoRef = ref(storage, `users/${currentUser.uid}/profile_${Date.now()}`);
        await uploadBytes(photoRef, newPhoto);
        photoURL = await getDownloadURL(photoRef);
      }
      
      await updateProfile(currentUser, { displayName: personal.displayName, photoURL });
      
      await setDoc(doc(db, 'users', currentUser.uid), {
        personalProfile: { phoneNumber: personal.phoneNumber }
      }, { merge: true });
      
      setPersonal(prev => ({ ...prev, photoURL: photoURL || '' }));
      setNewPhoto(null);
      setMessage({ type: 'success', text: 'Personal profile updated!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessSave = async () => {
    if (!currentUser) return;
    setLoading(true);
    setMessage(null);
    try {
      let logoUrl = business.logoUrl;
      if (newLogo) {
        if (newLogo.size > 2 * 1024 * 1024) throw new Error('Logo must be less than 2MB');
        const logoRef = ref(storage, `users/${currentUser.uid}/logo_${Date.now()}`);
        await uploadBytes(logoRef, newLogo);
        logoUrl = await getDownloadURL(logoRef);
      }

      const updatedBusiness = { ...business, logoUrl };
      await setDoc(doc(db, 'users', currentUser.uid), {
        businessProfile: updatedBusiness
      }, { merge: true });
      
      setBusiness(updatedBusiness);
      setNewLogo(null);
      setMessage({ type: 'success', text: 'Business profile updated! These defaults will be used for new invoices.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySave = async () => {
    if (!currentUser) return;
    setLoading(true);
    setMessage(null);
    try {
      if (newEmail && newEmail !== currentUser.email) {
        if (!isGoogleAuth && !password) {
          throw new Error('Please enter your current password to change email.');
        }
        if (!isGoogleAuth) {
          const cred = EmailAuthProvider.credential(currentUser.email!, password);
          await reauthenticateWithCredential(currentUser, cred);
        }
        await updateEmail(currentUser, newEmail);
        setMessage({ type: 'success', text: 'Email updated successfully!' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!currentUser?.email) return;
    try {
      const { getAuth } = await import('firebase/auth');
      await sendPasswordResetEmail(getAuth(), currentUser.email);
      setMessage({ type: 'success', text: 'Password reset email sent!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="d-flex flex-column h-100 bg-light pb-5">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3">
        <a className="navbar-brand d-flex align-items-center" href="#" onClick={() => navigate('/')}>
          <i className="bi bi-arrow-left me-2"></i> Settings
        </a>
      </nav>

      <div className="container mt-4 max-w-4xl">
        <h3 className="mb-4 text-dark fw-bold">Profile & Settings</h3>
        
        {message && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'}`}>
            {message.text}
          </div>
        )}

        <div className="row">
          <div className="col-md-3 mb-4">
            <div className="list-group">
              <button className={`list-group-item list-group-item-action ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>
                Personal Profile
              </button>
              <button className={`list-group-item list-group-item-action ${activeTab === 'business' ? 'active' : ''}`} onClick={() => setActiveTab('business')}>
                Business Profile
              </button>
              <button className={`list-group-item list-group-item-action ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
                Account Security
              </button>
            </div>
          </div>

          <div className="col-md-9">
            <div className="card shadow-sm border-0">
              <div className="card-body p-4">
                
                {/* Personal Profile */}
                {activeTab === 'personal' && (
                  <div>
                    <h5 className="mb-4 border-bottom pb-2">Personal Profile</h5>
                    <div className="mb-3 d-flex align-items-center gap-3">
                      {personal.photoURL && !newPhoto && (
                        <img src={personal.photoURL} alt="Profile" className="rounded-circle object-fit-cover" width="80" height="80" />
                      )}
                      <div>
                        <label className="form-label text-muted small">Profile Photo (Max 2MB)</label>
                        <input type="file" className="form-control form-control-sm" accept="image/jpeg, image/png, image/webp" onChange={e => setNewPhoto(e.target.files?.[0] || null)} />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Display Name</label>
                      <input type="text" className="form-control" value={personal.displayName} onChange={e => setPersonal({...personal, displayName: e.target.value})} />
                    </div>
                    <div className="mb-4">
                      <label className="form-label">Contact Phone (Optional)</label>
                      <input type="text" className="form-control" value={personal.phoneNumber} onChange={e => setPersonal({...personal, phoneNumber: e.target.value})} />
                    </div>
                    <button className="btn btn-primary" onClick={handlePersonalSave} disabled={loading}>
                      {loading ? 'Saving...' : 'Save Personal Profile'}
                    </button>
                  </div>
                )}

                {/* Business Profile */}
                {activeTab === 'business' && (
                  <div>
                    <h5 className="mb-4 border-bottom pb-2">Business Defaults</h5>
                    
                    <div className="mb-3 d-flex align-items-center gap-3">
                      {business.logoUrl && !newLogo && (
                        <img src={business.logoUrl} alt="Logo" className="rounded object-fit-contain border p-1 bg-white" width="100" height="100" />
                      )}
                      <div className="flex-grow-1">
                        <label className="form-label text-muted small">Business Logo (Max 2MB)</label>
                        <input type="file" className="form-control form-control-sm" accept="image/jpeg, image/png, image/webp" onChange={e => setNewLogo(e.target.files?.[0] || null)} />
                      </div>
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Business Name</label>
                        <input type="text" className="form-control" value={business.businessName} onChange={e => setBusiness({...business, businessName: e.target.value})} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Business Email</label>
                        <input type="email" className="form-control" value={business.email} onChange={e => setBusiness({...business, email: e.target.value})} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Phone</label>
                        <input type="text" className="form-control" value={business.phone} onChange={e => setBusiness({...business, phone: e.target.value})} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Tax Reg Number</label>
                        <input type="text" className="form-control" value={business.taxRegistrationNumber} onChange={e => setBusiness({...business, taxRegistrationNumber: e.target.value})} />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Address</label>
                        <textarea className="form-control" rows={2} value={business.address} onChange={e => setBusiness({...business, address: e.target.value})}></textarea>
                      </div>
                    </div>

                    <h6 className="mt-4 mb-3 fw-bold">Invoice Settings</h6>
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="form-label">Default Currency</label>
                        <select className="form-select" value={business.defaultCurrency} onChange={e => setBusiness({...business, defaultCurrency: e.target.value})}>
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Preferred Template</label>
                        <select className="form-select" value={business.preferredTemplate} onChange={e => setBusiness({...business, preferredTemplate: e.target.value as any})}>
                          <option value="classic">Classic</option>
                          <option value="modern">Modern</option>
                          <option value="minimal">Minimal</option>
                        </select>
                      </div>
                      <div className="col-12">
                        <label className="form-label">Payment Instructions</label>
                        <textarea className="form-control" rows={2} value={business.paymentInstructions} onChange={e => setBusiness({...business, paymentInstructions: e.target.value})}></textarea>
                      </div>
                      <div className="col-12">
                        <label className="form-label">Bank Details</label>
                        <textarea className="form-control" rows={2} value={business.bankDetails} onChange={e => setBusiness({...business, bankDetails: e.target.value})}></textarea>
                      </div>
                      <div className="col-12">
                        <label className="form-label">Default Terms</label>
                        <textarea className="form-control" rows={2} value={business.defaultTerms} onChange={e => setBusiness({...business, defaultTerms: e.target.value})}></textarea>
                      </div>
                    </div>

                    <button className="btn btn-primary" onClick={handleBusinessSave} disabled={loading}>
                      {loading ? 'Saving...' : 'Save Business Defaults'}
                    </button>
                  </div>
                )}

                {/* Account Security */}
                {activeTab === 'security' && (
                  <div>
                    <h5 className="mb-4 border-bottom pb-2">Account Security</h5>
                    <p className="text-muted small">Current Email: {currentUser?.email}</p>
                    
                    {isGoogleAuth ? (
                      <div className="alert alert-info">
                        You are signed in with Google. You manage your password and email securely through Google.
                      </div>
                    ) : (
                      <>
                        <div className="mb-3">
                          <label className="form-label">New Email Address</label>
                          <input type="email" className="form-control" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                        </div>
                        <div className="mb-4">
                          <label className="form-label">Current Password (Required for changes)</label>
                          <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} />
                        </div>
                        <div className="d-flex gap-2">
                          <button className="btn btn-primary" onClick={handleSecuritySave} disabled={loading || !newEmail || !password}>
                            {loading ? 'Updating...' : 'Update Email'}
                          </button>
                          <button className="btn btn-outline-secondary" onClick={handlePasswordReset}>
                            Send Password Reset Link
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
