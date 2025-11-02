// frontend/src/pages/LoginPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext'; 

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null); // Para mensagens de sucesso/recuperação
  const [isRecovering, setIsRecovering] = useState(false); // NOVO ESTADO para alternar
  
  const { login, loading } = useAuth(); 
  const navigate = useNavigate();

  // ----------------------------------------------------
  // NOVO: LÓGICA DE RECUPERAÇÃO DE SENHA (Frontend)
  // ----------------------------------------------------
  const handleRecoverPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null); // Limpa mensagens anteriores

    try {
      const response = await fetch('http://localhost:3000/auth/recover-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (response.ok) {
        // Mensagem de sucesso (Backend retornará a senha temporária no console)
        setMessage("Instruções de redefinição enviadas. Verifique o console do Backend para a senha temporária.");
        setIsRecovering(false); // Volta para a tela de Login
        setUsername(''); // Limpa o campo para o próximo login
      } else {
        setError(data.error || "Erro ao solicitar recuperação. Tente novamente.");
      }
    } catch (err) {
      setError("Falha de comunicação com o servidor.");
      console.error("Erro na recuperação:", err);
    }
  };
  
  // ----------------------------------------------------
  // LÓGICA DE LOGIN (Existente)
  // ----------------------------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      await login(username, password);
      navigate('/mesas'); 
    } catch (err) {
      setError(err.message || 'Falha na autenticação. Verifique suas credenciais.');
    }
  };

  // ----------------------------------------------------
  // RENDERIZAÇÃO
  // ----------------------------------------------------
  return (
    <div style={{ padding: '20px', maxWidth: '350px', margin: '10vh auto', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ marginBottom: '40px' }}>OnComanda</h1>
      <h2 style={{ fontSize: '2em', marginBottom: '30px', fontWeight: 'bold' }}>
        {isRecovering ? 'RECUPERAR SENHA' : 'LOGIN'}
      </h2>

      <form onSubmit={isRecovering ? handleRecoverPassword : handleLogin}> 
        {/* Input Username */}
        <input 
          type="text" 
          placeholder="Username" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ width: '100%', padding: '12px', margin: '15px 0', borderRadius: '4px', border: '1px solid #ccc' }} 
        />
        
        {/* Input Password (SÓ APARECE no modo LOGIN) */}
        {!isRecovering && (
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '12px', margin: '15px 0', borderRadius: '4px', border: '1px solid #ccc' }} 
          />
        )}
        
        {error && <p style={{ color: 'red', margin: '10px 0', fontSize: '0.9em' }}>{error}</p>}
        {message && <p style={{ color: 'green', margin: '10px 0', fontSize: '0.9em' }}>{message}</p>}


        {/* Botão */}
        <button 
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '15px', backgroundColor: '#888', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', marginTop: '30px' }}
        >
          {loading ? 'Verificando...' : isRecovering ? 'ENVIAR INSTRUÇÕES' : 'ENTRAR'}
        </button>
      </form>

      {/* Alternador Recuperar/Login */}
      <p 
        onClick={() => {
          setIsRecovering(!isRecovering);
          setError(null); 
          setMessage(null);
          setPassword(''); // Limpa a senha ao alternar
        }}
        style={{ marginTop: '30px', fontSize: '0.9em', color: '#888', cursor: 'pointer' }}
      >
        {isRecovering ? 'Voltar para Login' : 'Recuperar : senha'}
      </p>
    </div>
  );
};

export default LoginPage;