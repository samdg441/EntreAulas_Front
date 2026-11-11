import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'sonner'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { PreferenciasProvider } from './preferencias/PreferenciasContext'
import SessionExpiryNotice from './components/SessionExpiryNotice'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PreferenciasProvider>
      <AuthProvider>
        <App />
        <SessionExpiryNotice />
        <Toaster position="top-right" richColors closeButton duration={5000} />
      </AuthProvider>
    </PreferenciasProvider>
  </React.StrictMode>,
)
