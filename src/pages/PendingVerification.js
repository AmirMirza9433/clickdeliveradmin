import React from 'react';
import { ShieldAlert, Phone, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const PendingVerification = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="login-container">
      <div className="login-card glass-panel animate-fade-in" style={{ maxWidth: '500px', textAlign: 'center' }}>
        <div className="logo-circle large" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', marginBottom: '1.5rem' }}>
          <ShieldAlert size={40} />
        </div>
        
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '1rem' }}>Verification Pending</h1>
        
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '2rem' }}>
          Your account is currently under review by our administration team. 
          Please wait for verification or contact the admin panel support if you have any questions.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button 
            className="primary-btn icon-text-btn" 
            style={{ justifyContent: 'center', width: '100%', padding: '1rem' }}
            onClick={() => window.location.href = 'mailto:admin@deliveryapp.com'}
          >
            <Phone size={18} />
            Contact Admin Support
          </button>
          
          <button 
            className="view-btn icon-text-btn" 
            style={{ justifyContent: 'center', width: '100%', padding: '1rem' }}
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <ArrowLeft size={18} />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingVerification;
