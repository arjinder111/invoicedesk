
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Login } from './components/auth/Login';
import { Signup } from './components/auth/Signup';
import { InvoiceWorkspace } from './components/invoice/InvoiceWorkspace';
import { SharedInvoice } from './components/invoice/SharedInvoice';
import { InvoiceList } from './components/invoice/InvoiceList';

// Bootstrap CSS & Icons
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/main.css';

const AppRoutes = () => {
  const { loading } = useAuth();

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/share/:shareId" element={<SharedInvoice />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <InvoiceWorkspace />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/invoices" 
        element={
          <ProtectedRoute>
            <InvoiceList />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
