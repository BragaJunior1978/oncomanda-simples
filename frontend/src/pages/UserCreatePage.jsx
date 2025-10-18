// frontend/src/pages/UserCreatePage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

const API_BASE_URL = 'http://localhost:3000';

const UserCreatePage = () => {
    const navigate = useNavigate();
    const { token, user: currentUser } = useAuth(); // Pega o token do ADMIN logado
    
    // Estado para os campos do novo usuário
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('GARCOM'); // Padrão: GARCOM
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Proteção de Rota Simples no Frontend:
    // O ADMIN logado é 'garcom1', mas a role é ADMIN. Vamos confiar no backend
    // para a validação final, mas é bom ter uma verificação visual.
    if (currentUser && currentUser.role !== 'ADMIN') {
        return <div style={{padding: '50px', textAlign: 'center', color: 'red'}}>Acesso negado. Apenas Administradores podem cadastrar usuários.</div>;
    }


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const newUser = { username, password, name, role };

        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Enviamos o token do ADMIN para a API
                    Authorization: `Bearer ${token}`, 
                },
                body: JSON.stringify(newUser),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha ao cadastrar o usuário.');
            }

            const data = await response.json();
            setSuccess(`Usuário ${data.user.name} cadastrado com sucesso!`);
            
            // Limpa o formulário após o sucesso
            setUsername('');
            setPassword('');
            setName('');
            setRole('GARCOM');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div style={{ 
            padding: '20px', 
            maxWidth: '500px', 
            margin: '50px auto', 
            fontFamily: 'Arial, sans-serif', 
            backgroundColor: '#444', 
            borderRadius: '8px',
            color: 'white'
        }}>
            <button 
                onClick={() => navigate('/mesas')}
                style={{ 
                    padding: '10px 15px', 
                    backgroundColor: '#555', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer',
                    marginBottom: '20px'
                }}
            >
                &larr; Voltar
            </button>
            <h1 style={{ textAlign: 'center', borderBottom: '1px solid #555', paddingBottom: '10px' }}>Cadastrar Novo Garçom</h1>

            {error && <p style={{ color: 'red', textAlign: 'center' }}>Erro: {error}</p>}
            {success && <p style={{ color: 'lightgreen', textAlign: 'center' }}>Sucesso: {success}</p>}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Nome Completo:</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={inputStyle}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Username (Login):</label>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={inputStyle}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Senha:</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={inputStyle}
                    />
                </div>
                
                <div style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Nível de Acesso (Role):</label>
                    <select 
                        value={role} 
                        onChange={(e) => setRole(e.target.value)}
                        style={inputStyle}
                    >
                        <option value="GARCOM">Garçom</option>
                        <option value="ADMIN">Administrador</option>
                    </select>
                </div>
                
                <button 
                    type="submit" 
                    disabled={loading}
                    style={{ 
                        width: '100%', 
                        padding: '12px', 
                        backgroundColor: loading ? '#0056b3' : '#007bff', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    {loading ? 'Cadastrando...' : 'CADASTRAR USUÁRIO'}
                </button>
            </form>
        </div>
    );
};

// Estilo auxiliar para os inputs
const inputStyle = {
    width: '100%', 
    padding: '10px', 
    borderRadius: '4px', 
    border: '1px solid #ccc', 
    boxSizing: 'border-box',
    backgroundColor: '#333',
    color: 'white'
};

export default UserCreatePage;