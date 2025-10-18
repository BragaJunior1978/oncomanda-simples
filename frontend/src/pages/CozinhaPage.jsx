// frontend/src/pages/CozinhaPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; 

const API_BASE_URL = 'http://localhost:3000';

const CozinhaPage = () => {
    const { token } = useAuth();
    const [pendingOrders, setPendingOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Função para calcular o tempo de espera
    const getElapsedTime = (timestamp) => {
        const now = new Date();
        const created = new Date(timestamp);
        const diffMs = now - created; // Diferença em milissegundos
        
        const diffMinutes = Math.floor(diffMs / 60000); // 60.000 ms em 1 min
        
        // Formato: X min (ou 0 min se for menor que 1 minuto)
        return `${diffMinutes} min`;
    };

    // FUNÇÃO: MARCAR PEDIDO COMO PRONTO
    const markAsReady = async (orderId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}/ready`, {
                method: 'PUT', 
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`, 
                },
            });

            if (!response.ok) {
                throw new Error(`Falha ao marcar pedido #${orderId} como pronto.`);
            }
            
            // Remove o pedido da lista local
            setPendingOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
            
            alert(`Pedido #${orderId} removido! Pronto para entrega.`);

        } catch (err) {
            console.error(err);
            setError(`Erro ao marcar como pronto: ${err.message}`);
        }
    };

    // FUNÇÃO: BUSCAR PEDIDOS PENDENTES
    const fetchPendingOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/orders/pending`, {
                headers: {
                    Authorization: `Bearer ${token}`, 
                },
            });

            if (!response.ok) {
                throw new Error('Falha ao buscar pedidos pendentes. Verifique a autenticação.');
            }

            const data = await response.json();
            setPendingOrders(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Busca inicial e Recarregamento (Polling)
    useEffect(() => {
        fetchPendingOrders();
        
        // Recarrega os pedidos a cada 30 segundos
        const intervalId = setInterval(fetchPendingOrders, 30000); 

        return () => clearInterval(intervalId); // Limpa o intervalo ao sair
    }, [token]);


    if (loading) return <div style={centerStyle}>Carregando pedidos...</div>;
    if (error) return <div style={{...centerStyle, color: 'red'}}>Erro: {error}</div>;


    return (
        <div style={pageStyle}>
            <header style={headerStyle}>
                <h1>Monitor de Preparos (Cozinha & Bar)</h1>
                <button 
                    onClick={fetchPendingOrders}
                    style={refreshButtonStyle}
                >
                    Recarregar ({pendingOrders.length})
                </button>
            </header>
            
            <p style={{color: '#ccc', textAlign: 'center'}}>Pedidos Ativos: {pendingOrders.length}</p>

            <div style={containerStyle}>
                {pendingOrders.length === 0 ? (
                    <p style={centerStyle}>Não há pedidos pendentes no momento. Tudo pronto!</p>
                ) : (
                    pendingOrders.map(order => (
                        <div key={order.id} style={cardStyle}>
                            <div style={cardHeaderStyle}>
                                <h2>Mesa {order.mesa} - Pedido #{order.id}</h2>
                                <p style={timeStyle}>
                                    Tempo de Espera: 
                                    <span style={{fontWeight: 'bold'}}> {getElapsedTime(order.createdAt)}</span>
                                </p>
                            </div>
                            
                            <ul style={listStyle}>
                                {order.itens.map((item, index) => (
                                    <li key={index} style={itemStyle}>
                                        <span style={{fontWeight: 'bold'}}>{item.quantity}x</span> {item.name}
                                    </li>
                                ))}
                            </ul>

                            <button 
                                style={readyButtonStyle} 
                                onClick={() => markAsReady(order.id)} // Conexão com o Backend
                            >
                                MARCAR COMO PRONTO
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// --- Estilos ---
const pageStyle = {
    padding: '20px',
    backgroundColor: '#333',
    minHeight: '100vh',
    color: 'white',
    fontFamily: 'Arial, sans-serif'
};

const centerStyle = {
    textAlign: 'center',
    padding: '50px'
};

const headerStyle = {
    textAlign: 'center',
    borderBottom: '2px solid #555',
    paddingBottom: '10px',
    marginBottom: '20px'
};

const refreshButtonStyle = {
    padding: '8px 15px',
    backgroundColor: '#555',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px'
};

const containerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    justifyContent: 'center'
};

const cardStyle = {
    backgroundColor: '#444',
    padding: '15px',
    borderRadius: '8px',
    width: '300px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
};

const cardHeaderStyle = {
    borderBottom: '1px solid #555',
    marginBottom: '10px',
    paddingBottom: '10px'
};

const timeStyle = {
    color: '#aaa',
    fontSize: '0.9em'
};

const listStyle = {
    listStyleType: 'none',
    padding: '0'
};

const itemStyle = {
    backgroundColor: '#555',
    padding: '8px',
    borderRadius: '4px',
    marginBottom: '5px'
};

const readyButtonStyle = {
    width: '100%',
    padding: '10px',
    backgroundColor: '#28a745', // Verde
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '15px',
    fontWeight: 'bold'
};

export default CozinhaPage;