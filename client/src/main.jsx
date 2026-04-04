import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster, ToastIcon, resolveValue } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 1500,
            success: { iconTheme: { primary: '#F97316', secondary: '#FFFFFF' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' } },
          }}
        >
          {(t) => (
            <div
              className="max-w-sm w-full bg-white/70 backdrop-blur-xl shadow-glass-lg rounded-2xl pointer-events-auto flex flex-col overflow-hidden border border-white/60"
              style={{
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                opacity: t.visible ? 1 : 0,
                transform: t.visible ? 'translateY(0) scale(1)' : 'translateY(-25px) scale(0.95)',
              }}
            >
              <div className="flex items-center gap-3.5 px-5 py-4">
                <ToastIcon toast={t} />
                <p className="text-[15px] font-bold tracking-tight text-stone-900 font-display">
                  {resolveValue(t.message, t)}
                </p>
              </div>
              {/* Timeline Progress Bar */}
              <div className="h-1 bg-stone-200/30 w-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cafe-400 to-amber-400"
                  style={{
                    animation: `toast-progress ${t.duration}ms linear forwards`
                  }}
                />
              </div>
            </div>
          )}
        </Toaster>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
