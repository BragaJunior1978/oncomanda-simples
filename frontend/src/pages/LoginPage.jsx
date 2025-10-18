// frontend/src/pages/LoginPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext'; 

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  // O isAuthenticated não é mais usado aqui para redirecionamento.
  const { login, loading } = useAuth(); 
  const navigate = useNavigate();

  // 🚨 LÓGICA DE REDIRECIONAMENTO REMOVIDA
  // O componente RedirectIfLoggedIn no App.jsx cuidará disso ANTES de renderizar esta página.
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // Tenta logar
      await login(username, password);
      
      // Redireciona APÓS o login ser BEM SUCEDIDO
      navigate('/mesas'); 
      
    } catch (err) {
      // Captura e exibe o erro se o login falhar
      setError(err.message || 'Falha na autenticação. Verifique suas credenciais.');
    }
  };

  return (
    // Estilos baseados no mockup 'Login Garcom'
    <div style={{ padding: '20px', maxWidth: '350px', margin: '10vh auto', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ marginBottom: '40px' }}>OnComanda</h1>
      <h2 style={{ fontSize: '2em', marginBottom: '30px', fontWeight: 'bold' }}>LOGIN</h2>

      <form onSubmit={handleSubmit}>
        {/* Input Username */}
        <input 
          type="text" 
          placeholder="Username" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ width: '100%', padding: '12px', margin: '15px 0', borderRadius: '4px', border: '1px solid #ccc' }} 
        />
        {/* Input Password */}
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '12px', margin: '15px 0', borderRadius: '4px', border: '1px solid #ccc' }} 
        />
        
        {error && <p style={{ color: 'red', margin: '10px 0', fontSize: '0.9em' }}>{error}</p>}

        {/* Botão ENTRAR */}
        <button 
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '15px', backgroundColor: '#888', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', marginTop: '30px' }}
        >
          {loading ? 'Verificando...' : 'ENTRAR'}
        </button>
      </form>

      <p style={{ marginTop: '30px', fontSize: '0.9em', color: '#888' }}>Recuperar : senha</p>
    </div>
  );
};

export default LoginPage;