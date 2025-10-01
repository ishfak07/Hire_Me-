import React from 'react';
import { useNavigate } from 'react-router-dom';
import './firstPage.css';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', color: 'var(--primary-color)' }}>Welcome</h1>
        <button
          className="cta-button primary"
          onClick={() => navigate('/first')}
          style={{ marginTop: '2rem' }}
        >
          Enter to HireMe
        </button>
        <button
          className="cta-button primary"
          onClick={() => navigate('/admin')}
          style={{ marginTop: '2rem' }}
        >
          Enter to addmin login
        </button>
      </div>
    </div>
  );
};

export default Landing;
