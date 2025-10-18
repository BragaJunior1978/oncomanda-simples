// frontend/src/pages/Admin/ReportsPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminStyles.css'; // Usando os mesmos estilos de admin

const API_BASE_URL = 'http://localhost:3000';

const ReportsPage = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [closedOrders, setClosedOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Soma dos totais de todas as comandas listadas
    const totalSales = closedOrders.reduce((sum, order) => sum + order.total, 0);

    // Função para buscar o histórico de comandas fechadas
    const fetchClosedOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            // OBS: Esta rota precisa ser implementada no Backend (próximo passo)
            const response = await fetch(`${API_BASE_URL}/orders/closed`, {
                headers: {
                    Authorization: `Bearer ${token}`, 
                },
            });
            
            if (!response.ok) {
                throw new Error("Falha ao buscar o relatório. Verifique a rota no Backend.");
            }
            
            const data = await response.json();
            setClosedOrders(data);

        } catch (err) {
            console.error("Erro ao buscar relatórios:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClosedOrders();
    }, []);

    if (loading) return <div className="admin-page-container" style={centerStyle}>Carregando Relatório...</div>;

    return (
        <div className="admin-page-container">
            <button onClick={() => navigate('/admin')} className="back-button">
                ← Voltar para Administração
            </button>
            <h1 className="admin-title">Relatório de Vendas (Comandas Fechadas)</h1>

            {error && <p className="admin-message message-error">{error}</p>}
            
            <div style={summaryBoxStyle}>
                <h2>Total de Vendas (Comandas Fechadas): 
                    <span style={{ color: '#28a745', marginLeft: '15px' }}>R$ {totalSales.toFixed(2)}</span>
                </h2>
                <p>Total de Comandas Fechadas: <span style={{ fontWeight: 'bold' }}>{closedOrders.length}</span></p>
            </div>

            <div style={tableContainerStyle}>
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle}>ID</th>
                            <th style={thStyle}>Mesa</th>
                            <th style={thStyle}>Garçom</th>
                            <th style={thStyle}>Total (R$)</th>
                            <th style={thStyle}>Fechamento</th>
                        </tr>
                    </thead>
                    <tbody>
                        {closedOrders.length > 0 ? (
                            closedOrders.map((order) => (
                                <tr key={order.id} style={trStyle}>
                                    <td style={tdStyle}>{order.id}</td>
                                    <td style={tdStyle}>{order.tableNumber}</td>
                                    <td style={tdStyle}>{order.userName || 'N/A'}</td>
                                    <td style={tdStyle} className="price-cell">R$ {parseFloat(order.total).toFixed(2)}</td>
                                    <td style={tdStyle}>{new Date(order.closedAt).toLocaleString('pt-BR')}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{...tdStyle, textAlign: 'center'}}>Nenhuma comanda foi fechada ainda.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Estilos Específicos para Relatório ---
const summaryBoxStyle = {
    backgroundColor: '#333',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    borderLeft: '5px solid #007bff'
};

const tableContainerStyle = {
    maxHeight: '60vh',
    overflowY: 'auto',
    backgroundColor: '#333',
    borderRadius: '8px'
};

const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
};

const thStyle = {
    backgroundColor: '#444',
    padding: '15px 10px',
    textAlign: 'left',
    borderBottom: '2px solid #555',
    position: 'sticky',
    top: 0,
    zIndex: 1,
};

const tdStyle = {
    padding: '10px',
    borderBottom: '1px solid #555',
    color: '#ccc'
};

const trStyle = {
    transition: 'background-color 0.2s'
};

const centerStyle = {
    textAlign: 'center',
    padding: '50px',
};


export default ReportsPage;