// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';
// --- IMPORT CSS FILE ---
import './index.css'
// --- IMPORT GOOGLE OAUTH PROVIDER ---
import { GoogleOAuthProvider } from '@react-oauth/google';

// Google Client ID
const GOOGLE_CLIENT_ID = "381319007299-vj3d380tr885dlbmdjo1t8f7emoo1hs7.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)