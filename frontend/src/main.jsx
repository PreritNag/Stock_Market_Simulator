import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import { store } from './store';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "589771204695-g7erq4nb44istifamnbc3hs583i19vth.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <GoogleOAuthProvider clientId={googleClientId}>
          <BrowserRouter>
            <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#ffffff',
                color: '#1e293b',
                border: '1px solid #eaedf2',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '500',
                padding: '12px 16px',
                boxShadow: '0 8px 32px rgba(100,116,139,0.12)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </BrowserRouter>
      </GoogleOAuthProvider>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
