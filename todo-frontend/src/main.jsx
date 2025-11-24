// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';
// --- IMPORT CSS FILE ---
import './index.css'
// --- 1. IMPORT PROVIDER CỦA GOOGLE ---
import { GoogleOAuthProvider } from '@react-oauth/google';

// --- 2. LẤY CLIENT ID CỦA BẠN ---
const GOOGLE_CLIENT_ID = "1010300950363-kqkr35p43a655gtt6lrn70gsijock5lh.apps.googleusercontent.com";

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