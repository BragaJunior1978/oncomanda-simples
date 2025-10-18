// frontend/src/pages/MesasPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://localhost:3000';

const MesasPage = () => {
    const [tables, setTables] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { user, token, logout } = useAuth(); // Pega o usuário e o token

    // Função para buscar as mesas do Backend
    const fetchTables = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/tables`);
            if (!response.ok) {
                // Se a resposta não for 200, lança um erro
                throw new Error('Falha ao buscar a lista de mesas.');
            }
            const data = await response.json();
            setTables(data);
        } catch (err) {
            console.error('Erro ao buscar mesas:', err);
            setError('Não foi possível carregar as mesas. Verifique se o Backend está rodando.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTables();
        
        // Opcional: Recarregar a lista de mesas a cada 30 segundos
        const intervalId = setInterval(fetchTables, 30000); 
        return () => clearInterval(intervalId);
    }, [fetchTables]);

    // Função NOVA: Chama a API para fechar a comanda e liberar a mesa
    const handleCloseTable = async (tableId, tableNumber) => {
        if (!window.confirm(`Tem certeza que deseja fechar a comanda e liberar a Mesa ${tableNumber}?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/tables/${tableId}/close`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    // Incluindo o token por segurança (opcional se a rota não for protegida)
                    Authorization: `Bearer ${token}`, 
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro desconhecido ao liberar Mesa ${tableNumber}.`);
            }

            alert(`Mesa ${tableNumber} liberada com sucesso!`);
            fetchTables(); // Recarrega a lista de mesas
            
        } catch (err) {
            console.error("Erro ao liberar mesa:", err);
            alert(`Falha ao liberar mesa: ${err.message}`);
        }
    };


    const filteredTables = tables.filter(table =>
        table.number.toString().includes(searchTerm)
    );

    if (loading) return <div style={centerStyle}>Carregando mesas...</div>;
    if (error) return <div style={{ ...centerStyle, color: 'red' }}>Erro: {error}</div>;

    return (
        <div style={pageStyle}>
            <header style={headerStyle}>
                <h1 style={titleStyle}>Mesas</h1>
                <div style={userInfoStyle}>
                    
                    {/* CORREÇÃO APLICADA: Link de ADMINSTRACÃO (Aparece SÓ para ADMIN) */}
                    {user?.role === 'ADMIN' && (
                        <button 
                            onClick={() => navigate('/admin')} // CORRIGIDO PARA '/admin'
                            style={adminButtonStyle}
                        >
                            Administração
                        </button>
                    )}
                    
                    <p style={greetingStyle}>Olá, {user?.name || 'Garçom'}!</p>
                    <button onClick={logout} style={logoutButtonStyle}>
                        Sair
                    </button>
                </div>
            </header>

            <input
                type="text"
                placeholder="Procurar mesa"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={searchInputStyle}
            />

            <div style={tablesContainerStyle}>
                {filteredTables.map(table => (
                    <div
                        key={table.id}
                        style={{
                            ...tableCardStyle,
                            // LÓGICA DE COR CORRIGIDA PARA INCLUIR RESERVED (AMARELO)
                            backgroundColor: 
                                table.status === 'LIVRE' ? '#28a745' // Verde para Livre
                                : table.status === 'RESERVED' ? '#FFC107' // Amarelo para Reservado
                                : '#6c757d', // Cinza para Ocupada
                            cursor: 'pointer',
                        }}
                    >
                        <h2 style={tableNumberStyle}>MESA {table.number}</h2>
                        <p style={tableStatusStyle}>{table.status}</p>
                        
                        {/* Botão de Fechar Comanda SÓ aparece se a mesa estiver OCUPADA */}
                        {table.status === 'OCCUPIED' && (
                            <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); // Previne o clique do cartão
                                    handleCloseTable(table.id, table.number); 
                                }}
                                style={closeTableButtonStyle}
                            >
                                FECHAR E LIBERAR MESA
                            </button>
                        )}
                        
                        {/* Redireciona para a Comanda */}
                        <button
                             onClick={() => navigate(`/pedidos/${table.id}`)}
                             style={{
                                 ...viewOrderButtonStyle,
                                 // Muda a cor e o texto se estiver livre/reservado para encorajar a abertura de pedido
                                 backgroundColor: (table.status === 'LIVRE' || table.status === 'RESERVED') ? '#007bff' : '#0056b3',
                             }}
                          >
                             {table.status === 'LIVRE' ? 'ABRIR PEDIDO' : 'VER COMANDA'}
                          </button>

                    </div>
                ))}
            </div>
        </div>
    );
};


// --- Estilos ---
const pageStyle = {
    padding: '20px',
    backgroundColor: '#222', 
    minHeight: '100vh',
    color: 'white',
    fontFamily: 'Arial, sans-serif'
};

const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
};

const titleStyle = {
    fontSize: '2.5em',
    margin: 0,
};

const userInfoStyle = {
    display: 'flex',
    alignItems: 'center',
};

// ESTILO: Botão de Administração (para ADMIN)
const adminButtonStyle = {
    padding: '10px 15px',
    backgroundColor: '#007bff', 
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginRight: '15px', 
};

const greetingStyle = {
    marginRight: '15px',
    fontSize: '1.1em',
};

const logoutButtonStyle = {
    padding: '10px 15px',
    backgroundColor: '#dc3545', // Vermelho para Sair
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
};

const searchInputStyle = {
    width: '100%',
    padding: '10px',
    marginBottom: '30px',
    borderRadius: '4px',
    border: '1px solid #555',
    backgroundColor: '#333',
    color: 'white',
    fontSize: '1.1em',
};

const tablesContainerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    justifyContent: 'flex-start',
};

const tableCardStyle = {
    width: '200px',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'transform 0.2s',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
};

const tableNumberStyle = {
    fontSize: '1.8em',
    margin: '10px 0',
};

const tableStatusStyle = {
    fontSize: '1.1em',
    fontWeight: 'bold',
    marginBottom: '15px',
};

const viewOrderButtonStyle = {
    padding: '10px',
    backgroundColor: '#007bff', 
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '10px',
    width: '100%'
};

// ESTILO: Botão de fechar mesa
const closeTableButtonStyle = {
    padding: '8px',
    backgroundColor: '#ffc107', // Amarelo (Atenção/Pagamento)
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginBottom: '10px',
    width: '100%'
};

const centerStyle = {
    textAlign: 'center',
    padding: '50px',
    color: 'white',
};

export default MesasPage;