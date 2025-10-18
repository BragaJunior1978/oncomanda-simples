// frontend/src/main.jsx (CÓDIGO CORRIGIDO)
import React from 'react'; 
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// IMPORTAÇÕES CRÍTICAS
import { AuthProvider } from './context/AuthContext'; 
// REMOVIDO: import { BrowserRouter } from 'react-router-dom'; <--- REMOVER ESTA LINHA

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    {/* 1. BrowserRouter FOI REMOVIDO DAQUI */} 
    {/* 2. AuthProvider fornece o estado de login para toda a app */}
    <AuthProvider> 
      <App /> {/* O App.jsx JÁ CONTÉM o BrowserRouter */}
    </AuthProvider>
  </React.StrictMode>,
);