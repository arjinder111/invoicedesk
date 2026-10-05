import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase/config';
import { FirebaseError } from 'firebase/app';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else {
        setError('Failed to login. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (err) {
      if (err instanceof FirebaseError) {
        if (err.code !== 'auth/popup-closed-by-user') {
          setError(err.message);
        }
      } else {
        setError('Failed to login with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email to reset password.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMessage('Password reset email sent. Please check your inbox.');
      setError('');
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else {
        setError('Failed to send password reset email.');
      }
      setResetMessage('');
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card shadow-sm" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="card-body p-4">
          <h2 className="text-center mb-4 font-weight-bold text-primary">InvoiceDesk</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          {resetMessage && <div className="alert alert-success">{resetMessage}</div>}
          <form onSubmit={handleEmailLogin}>
            <div className="mb-3">
              <label className="form-label">Email address</label>
              <input 
                type="email" 
                className="form-control" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-control" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <button disabled={loading} type="submit" className="btn btn-primary w-100 mb-3">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <div className="text-center mb-3">
            <button 
              type="button" 
              className="btn btn-link text-decoration-none" 
              onClick={handleForgotPassword}
            >
              Forgot Password?
            </button>
          </div>

          <div className="d-flex align-items-center mb-3">
            <hr className="flex-grow-1" />
            <span className="mx-2 text-muted">OR</span>
            <hr className="flex-grow-1" />
          </div>

          <button 
            disabled={loading} 
            onClick={handleGoogleLogin} 
            className="btn btn-outline-dark w-100 mb-3 d-flex justify-content-center align-items-center gap-2"
          >
            <i className="bi bi-google text-danger"></i> Sign in with Google
          </button>
          
          <div className="text-center mt-4">
            Need an account? <Link to="/signup" className="text-decoration-none">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
