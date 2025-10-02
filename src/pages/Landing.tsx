import React from 'react';
import { useNavigate } from 'react-router-dom';
import './firstPage.css';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', color: 'var(--primary-color)' }}>Welcome to the Hire_m</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem', alignItems: 'center' }}>
          <button
            className="cta-button primary"
            onClick={() => navigate('/first')}
          >
            Enter to HireMe
          </button>
          <button
            className="cta-button primary"
            onClick={() => navigate('/admin')}
          >
            Enter to addmin login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
