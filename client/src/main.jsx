import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1A1814',
              color: '#FFF8F0',
              borderRadius: '12px',
              fontFamily: '"Inter", sans-serif',
              fontSize: '14px',
              padding: '12px 20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            },
            success: {
              iconTheme: { primary: '#F97316', secondary: '#FFF8F0' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#FFF8F0' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
