import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { FirebaseError } from 'firebase/app';

export const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== passwordConfirm) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else {
        setError('Failed to create an account.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card shadow-sm" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="card-body p-4">
          <h2 className="text-center mb-4 font-weight-bold text-primary">Sign Up</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSignup}>
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
                minLength={6}
              />
            </div>
            <div className="mb-4">
              <label className="form-label">Password Confirmation</label>
              <input 
                type="password" 
                className="form-control" 
                value={passwordConfirm} 
                onChange={(e) => setPasswordConfirm(e.target.value)} 
                required 
                minLength={6}
              />
            </div>
            <button disabled={loading} type="submit" className="btn btn-primary w-100 mb-3">
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>
          <div className="text-center">
            Already have an account? <Link to="/login" className="text-decoration-none">Log In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
