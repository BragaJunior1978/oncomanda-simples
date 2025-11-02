// frontend/src/pages/Admin/ProductTableCreatePage.jsx

import React, { useState, useEffect, useCallback } from 'react'; 
import { useNavigate, Link } from 'react-router-dom'; // Adicione 'Link' aqui se for usá-lo, mas vamos usar 'navigate'
import { useAuth } from '../../context/AuthContext'; 
import './AdminStyles.css'; // Assume que este arquivo de estilo existe

const API_BASE_URL = 'http://localhost:3000';

const ProductTableCreatePage = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [message, setMessage] = useState(null);

    // Estados do Formulário de Produtos
    const [productName, setProductName] = useState('');
    const [productPrice, setProductPrice] = useState('');

    // Estados do Formulário de Mesas
    const [tableNumber, setTableNumber] = useState('');

    // Estado para Gerenciamento de Reservas
    const [allTables, setAllTables] = useState([]); // Lista de todas as mesas

    // Função para buscar mesas
    const fetchAllTables = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/tables`);
            if (response.ok) {
                const data = await response.json();
                setAllTables(data.sort((a, b) => a.number - b.number));
            }
        } catch (error) {
            console.error("Erro ao buscar mesas para reserva:", error);
        }
    }, []);

    useEffect(() => {
        fetchAllTables();
        
        // Opcional: Recarrega as mesas periodicamente
        const intervalId = setInterval(fetchAllTables, 10000); 
        return () => clearInterval(intervalId);
    }, [fetchAllTables]);


    // ==========================================================
    // LÓGICA DE GERENCIAMENTO DE RESERVA
    // ==========================================================
    const handleToggleReservation = async (tableId, currentStatus, tableNumber) => {
        
        // Confirmação baseada na ação
        const action = currentStatus === 'LIVRE' ? 'reservar' : 'liberar a reserva de';
        
        if (!window.confirm(`Deseja realmente ${action} a Mesa ${tableNumber}?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/tables/${tableId}/reserve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`, // Passa o token do Admin
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Falha ao gerenciar reserva.');
            }

            setMessage({ type: 'success', text: data.message });
            fetchAllTables(); // Recarrega a lista de mesas

        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        }
    };

    
    // ==========================================================
    // LÓGICA DE CADASTRO DE PRODUTO
    // ==========================================================
    const handleProductSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        const priceNum = parseFloat(productPrice);

        if (!productName || isNaN(priceNum) || priceNum <= 0) {
            setMessage({ type: 'error', text: 'Preencha o nome e um preço válido para o produto.' });
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`, 
                },
                body: JSON.stringify({ 
                    name: productName, 
                    price: priceNum,
                    available: true,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Falha ao cadastrar produto.');
            }

            setMessage({ type: 'success', text: `Produto '${data.product.name}' (R$ ${data.product.price.toFixed(2)}) cadastrado com sucesso!` });
            setProductName('');
            setProductPrice('');

        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        }
    };
    
    // ==========================================================
    // LÓGICA DE CADASTRO DE MESA
    // ==========================================================
    const handleTableSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        
        const numberInt = parseInt(tableNumber);

        if (isNaN(numberInt) || numberInt <= 0) {
            setMessage({ type: 'error', text: 'O número da mesa deve ser um número inteiro positivo.' });
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/tables`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`, 
                },
                body: JSON.stringify({ number: numberInt }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Falha ao cadastrar mesa.');
            }

            setMessage({ type: 'success', text: data.message });
            setTableNumber('');
            // Recarrega a lista de mesas
            fetchAllTables();
            // Sem redirecionar, apenas recarrega a lista para gerenciar reservas

        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        }
    };
    
    // ==========================================================
    // RENDERIZAÇÃO
    // ==========================================================
    return (
        <div className="admin-page-container" style={{padding: '20px', backgroundColor: '#1e1e1e', minHeight: '100vh'}}>
            
            <button onClick={() => navigate('/mesas')} className="back-button" style={{padding: '10px 15px', backgroundColor: '#343a40', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '20px'}}>
                ← Voltar para Mesas
            </button>
            <h1 className="admin-title" style={{color: 'white', marginBottom: '30px'}}>Painel de Administração</h1>

            {message && (
                <p className={`admin-message message-${message.type}`} style={{padding: '10px', borderRadius: '4px', marginBottom: '20px', fontWeight: 'bold', textAlign: 'center', backgroundColor: message.type === 'error' ? '#dc3545' : '#28a745', color: 'white'}}>
                    {message.text}
                </p>
            )}

            <div className="admin-forms-container" style={{display: 'flex', flexWrap: 'wrap', gap: '20px'}}>
                
                {/* CARD 1: CADASTRO DE PRODUTO */}
                <div className="admin-form-card" style={cardStyle}>
                    <h2 className="card-title" style={cardTitleStyle}>1. Cadastrar Novo Produto</h2>
                    <form onSubmit={handleProductSubmit}>
                        <div className="form-group" style={formGroupStyle}>
                            <label style={{display: 'block', marginBottom: '5px', color: '#ccc'}}>Nome do Produto:</label>
                            <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} required style={inputStyle} />
                        </div>
                        <div className="form-group" style={formGroupStyle}>
                            <label style={{display: 'block', marginBottom: '5px', color: '#ccc'}}>Preço (R$):</label>
                            <input type="number" step="0.01" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} required style={inputStyle} />
                        </div>
                        <button type="submit" className="submit-button product-button" style={{...submitButtonStyle, backgroundColor: '#17a2b8'}}>
                            CADASTRAR PRODUTO
                        </button>
                    </form>
                </div>

                {/* CARD 2: CADASTRO DE MESA */}
                <div className="admin-form-card" style={cardStyle}>
                    <h2 className="card-title" style={cardTitleStyle}>2. Cadastrar Nova Mesa</h2>
                    <form onSubmit={handleTableSubmit}>
                        <div className="form-group" style={formGroupStyle}>
                            <label style={{display: 'block', marginBottom: '5px', color: '#ccc'}}>Número da Mesa:</label>
                            <input type="number" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} required style={inputStyle} />
                        </div>
                        <button type="submit" className="submit-button table-button" style={{...submitButtonStyle, backgroundColor: '#28a745'}}>
                            CADASTRAR MESA
                        </button>
                    </form>
                </div>

                {/* CARD 3: CADASTRO DE USUÁRIOS (Link para criação) */}
                <div className="admin-form-card link-card" style={cardStyle}>
                    <h2 className="card-title" style={cardTitleStyle}>3. Cadastrar Usuários</h2>
                    <p style={{color: '#ccc', marginBottom: '15px'}}>Cadastre novos Garçons e Administradores.</p>
                    <button onClick={() => navigate('/admin/users/create')} className="submit-button user-button" style={{...submitButtonStyle, backgroundColor: '#ffc107', color: '#333'}}>
                        IR PARA CADASTRO DE USUÁRIOS
                    </button>
                </div>
                
                {/* NOVO CARD 4: GERENCIAMENTO DE USUÁRIOS (Link para listagem, edição, delete) */}
                <div className="admin-form-card link-card" style={cardStyle}>
                    <h2 className="card-title" style={cardTitleStyle}>4. Gerenciamento de Usuários</h2>
                    <p style={{color: '#ccc', marginBottom: '15px'}}>Visualize, edite e remova usuários existentes.</p>
                    <button onClick={() => navigate('/admin/users')} className="submit-button user-button" style={{...submitButtonStyle, backgroundColor: '#4a3d10', color: 'white'}}>
                        LISTAR E GERENCIAR USUÁRIOS
                    </button>
                </div>


                {/* CARD 5: RELATÓRIOS SIMPLES (Link) */}
                <div className="admin-form-card link-card" style={cardStyle}>
                    <h2 className="card-title" style={cardTitleStyle}>5. Relatórios de Vendas</h2>
                    <p style={{color: '#ccc', marginBottom: '15px'}}>Visualize o histórico de comandas fechadas.</p>
                    <button onClick={() => navigate('/admin/reports')} className="submit-button product-button" style={{...submitButtonStyle, backgroundColor: '#007bff'}}> 
                        VER RELATÓRIOS
                    </button>
                </div>


                {/* CARD 6: GERENCIAMENTO DE RESERVAS */}
                <div className="admin-form-card reservation-card" style={{...cardStyle, flexBasis: '100%'}}>
                    <h2 className="card-title" style={cardTitleStyle}>6. Gerenciar Reservas</h2>
                    <div className="table-list-container" style={{maxHeight: '300px', overflowY: 'auto', padding: '5px'}}>
                        {allTables.map(table => (
                            <div key={table.id} style={{
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                padding: '10px 0', 
                                borderBottom: '1px solid #444'
                            }}>
                                <span style={{
                                    fontWeight: 'bold', 
                                    color: table.status === 'RESERVED' ? '#FFC107' : table.status === 'OCCUPIED' ? '#DC3545' : '#28A745'
                                }}>
                                    Mesa {table.number} ({table.status})
                                </span>
                                
                                {table.status !== 'OCCUPIED' ? (
                                    <button 
                                        onClick={() => handleToggleReservation(table.id, table.status, table.number)}
                                        style={{
                                            padding: '8px 12px',
                                            backgroundColor: table.status === 'LIVRE' ? '#17A2B8' : '#6C757D', 
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {table.status === 'LIVRE' ? 'RESERVAR' : 'LIBERAR RESERVA'}
                                    </button>
                                ) : (
                                    <span style={{color: '#DC3545', fontWeight: 'bold'}}>OCUPADA</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

// --- Estilos Inline para o Admin ---
const cardStyle = {
    backgroundColor: '#2b2b2b',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
    flexBasis: 'calc(50% - 10px)',
    boxSizing: 'border-box',
    color: 'white'
};

const cardTitleStyle = {
    borderBottom: '2px solid #555',
    paddingBottom: '10px',
    marginBottom: '15px',
    fontSize: '1.5em'
};

const formGroupStyle = {
    marginBottom: '15px',
};

const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #555',
    backgroundColor: '#3c3c3c',
    color: 'white',
    boxSizing: 'border-box',
};

const submitButtonStyle = {
    width: '100%',
    padding: '12px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '10px',
};


export default ProductTableCreatePage;