import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'sonner'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import SessionExpiryNotice from './components/SessionExpiryNotice'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <SessionExpiryNotice />
      <Toaster position="top-right" richColors closeButton duration={5000} />
    </AuthProvider>
  </React.StrictMode>,
)
