import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import toast, { Toaster, ToastBar } from 'react-hot-toast';
import { X } from 'lucide-react';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import Markup from './routes';

import PublicProductView from './pages/PublicProductView';

function AppContent() {
  const { token, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  // Handle Public Routes First
  return (
    <Routes>
      <Route path="/p/:slug" element={<PublicProductView />} />
      {!token ? (
        <Route path="*" element={<Login />} />
      ) : (
        <Route path="*" element={<Markup />} />
      )}
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            backdropFilter: 'blur(16px)',
            border: '1px solid hsl(var(--primary) / 0.2)',
            borderRadius: '16px',
            padding: '12px 20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            fontSize: '0.95rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          },
          success: {
            iconTheme: {
              primary: 'hsl(var(--primary))',
              secondary: 'hsl(var(--primary-foreground))',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff4b4b',
              secondary: '#fff',
            },
            style: {
              border: '1px solid rgba(255, 75, 75, 0.2)',
            }
          }
        }}
      >
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <>
                {icon}
                <div style={{ flex: 1 }}>{message}</div>
                {t.type !== 'loading' && (
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'hsl(var(--muted-foreground))',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'hsl(var(--accent))'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <X size={14} style={{ pointerEvents: 'none' }} />
                  </button>
                )}
              </>
            )}
          </ToastBar>
        )}
      </Toaster>
      <AuthProvider>
        <ThemeProvider>
          <SocketProvider>
            <AppContent />
          </SocketProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
