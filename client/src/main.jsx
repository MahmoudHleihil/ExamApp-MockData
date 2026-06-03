import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter  } from 'react-router-dom';
import './index.css'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider } from './api/AuthContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter  >
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter >
  </StrictMode>,
)
