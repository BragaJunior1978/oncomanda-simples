// frontend/src/pages/PedidosPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://localhost:3000';

const PedidosPage = () => {
    const { tableId } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    
    // --- ESTADOS ---
    const [tableNumber, setTableNumber] = useState('');
    const [products, setProducts] = useState([]);
    const [orderItems, setOrderItems] = useState({});
    const [activeOrderData, setActiveOrderData] = useState({ items: [], total: 0, individualOrders: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    
    // NOVO ESTADO: Opção de 10%
    const [includeServiceFee, setIncludeServiceFee] = useState(true); 

    // --- CÁLCULO DE VALORES ---
    const subtotal = activeOrderData.total;
    const serviceFee = includeServiceFee ? subtotal * 0.10 : 0;
    const finalTotal = subtotal + serviceFee;
    
    // --------------------------------------------------------------------------------
    // FUNÇÕES DE BUSCA
    // --------------------------------------------------------------------------------

    // 1. Buscar Comanda Ativa e Dados da Mesa
    const fetchActiveOrder = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Busca os dados da comanda ativa (incluindo total consolidado)
            const orderResponse = await fetch(`${API_BASE_URL}/tables/${tableId}/orders`);
            
            if (!orderResponse.ok) {
                // Se der erro, checa se a mesa existe
                const tableInfo = await fetch(`${API_BASE_URL}/tables/${tableId}`);
                if (tableInfo.ok) {
                    const tableData = await tableInfo.json();
                    setTableNumber(tableData.number);
                    setActiveOrderData({ items: [], total: 0, individualOrders: [] });
                }
                throw new Error("Não há comanda aberta para esta mesa ou falha na API.");
            }

            const data = await orderResponse.json();
            
            // Busca o número da mesa, já que ele não vem na rota /orders
            const tableInfo = await fetch(`${API_BASE_URL}/tables/${tableId}`);
            if (tableInfo.ok) {
                const tableData = await tableInfo.json();
                setTableNumber(tableData.number);
            }
            
            setActiveOrderData(data);

        } catch (err) {
            console.error("Erro ao carregar comanda:", err);
            // Se o erro não for de "Comanda não existe", mostra o erro geral
            if (!err.message.includes("Comanda não existe")) {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    }, [tableId]);
    
    // 2. Buscar Lista de Produtos
    const fetchProducts = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/products`);
            const data = await response.json();
            setProducts(data);
        } catch (err) {
            console.error("Erro ao buscar produtos:", err);
            setError("Falha ao carregar a lista de produtos.");
        }
    }, []);

    useEffect(() => {
        fetchActiveOrder();
        fetchProducts();
        
        // Recarrega a comanda a cada 10 segundos
        const intervalId = setInterval(fetchActiveOrder, 10000); 
        return () => clearInterval(intervalId);
    }, [fetchActiveOrder, fetchProducts]);

    
    // --------------------------------------------------------------------------------
    // FUNÇÕES DE MANIPULAÇÃO DO CARRINHO
    // --------------------------------------------------------------------------------

    const handleQuantityChange = (productId, change) => {
        const currentQty = orderItems[productId] || 0;
        const newQty = Math.max(0, currentQty + change);
        
        setOrderItems(prev => ({
            ...prev,
            [productId]: newQty,
        }));
    };

    const cartItems = Object.keys(orderItems)
        .filter(productId => orderItems[productId] > 0)
        .map(productId => {
            const product = products.find(p => p.id === parseInt(productId));
            if (!product) return null;
            return {
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: orderItems[productId],
            };
        }).filter(item => item !== null);

    const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);


    // --------------------------------------------------------------------------------
    // FUNÇÕES DE AÇÃO (Enviar Pedido / Fechar Comanda)
    // --------------------------------------------------------------------------------

    const handleSendOrder = async () => {
        if (cartItems.length === 0) {
            setMessage({ type: 'error', text: 'O carrinho está vazio.' });
            return;
        }

        setMessage(null);
        
        // CORREÇÃO: Pega o userId do usuário logado
        const currentUserId = user?.id; 
        if (!currentUserId) {
            setMessage({ type: 'error', text: 'Erro de autenticação: Garçom não identificado.' });
            return;
        }

        const payload = {
            mesaId: parseInt(tableId),
            userId: currentUserId, 
            items: cartItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
            })),
        };

        try {
            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`, 
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Falha ao enviar o pedido.');
            }

            // Sucesso: Limpa o carrinho e recarrega a comanda
            setOrderItems({});
            setMessage({ type: 'success', text: data.message });
            fetchActiveOrder(); 

        } catch (err) {
            console.error("Erro ao enviar pedido:", err);
            setMessage({ type: 'error', text: err.message });
        }
    };

    const handleCloseTable = async () => {
        
        // NOVO CÁLCULO: Exibe o total final com 10%
        if (!window.confirm(`Confirma o fechamento da conta no valor total de R$ ${finalTotal.toFixed(2)}?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/tables/${tableId}/close`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`, 
                },
                // OPCIONAL: Se o seu backend precisar do total para registro, envie-o no body.
                // body: JSON.stringify({ finalTotal: finalTotal }), 
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro desconhecido ao liberar Mesa ${tableNumber}.`);
            }

            alert(`Conta da Mesa ${tableNumber} fechada e mesa liberada com sucesso!`);
            // Volta para a lista de mesas
            navigate('/mesas');
            
        } catch (err) {
            console.error("Erro ao liberar mesa:", err);
            alert(`Falha ao liberar mesa: ${err.message}`);
        }
    };


    if (loading) return <div style={centerStyle}>Carregando dados da Mesa...</div>;
    if (error) return <div style={{ ...centerStyle, color: 'red' }}>Erro: {error}</div>;


    // --------------------------------------------------------------------------------
    // RENDERIZAÇÃO
    // --------------------------------------------------------------------------------

    return (
        <div style={pageStyle}>
            
            <header style={headerStyle}>
                <h1 style={titleStyle}>Comanda da Mesa {tableNumber}</h1>
                <button onClick={() => navigate('/mesas')} style={backButtonStyle}>
                    ← Voltar para Mesas
                </button>
            </header>

            {message && (
                <p style={{ ...messageStyle, backgroundColor: message.type === 'error' ? '#dc3545' : '#28a745' }}>
                    {message.text}
                </p>
            )}

            <div style={contentContainerStyle}>
                
                {/* ----------------- SEÇÃO 1: FAZER NOVO PEDIDO ----------------- */}
                <div style={sectionCardStyle}>
                    <h2 style={sectionTitleStyle}>Fazer Novo Pedido</h2>
                    <div style={productsGridStyle}>
                        {products.map(product => (
                            <div key={product.id} style={productCardStyle}>
                                <div style={{ flexGrow: 1 }}>
                                    <p style={productNameStyle}>{product.name}</p>
                                    <p style={productPriceStyle}>R$ {product.price.toFixed(2)}</p>
                                </div>
                                <div style={quantityControlsStyle}>
                                    <button onClick={() => handleQuantityChange(product.id, -1)} style={controlButtonStyle}>-</button>
                                    <span style={quantityTextStyle}>{orderItems[product.id] || 0}</span>
                                    <button onClick={() => handleQuantityChange(product.id, 1)} style={controlButtonStyle}>+</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={cartSummaryStyle}>
                        <h3>Carrinho ({cartItems.length} itens)</h3>
                        {cartItems.map(item => (
                            <p key={item.productId}>{item.quantity}x {item.name} (R$ {(item.price * item.quantity).toFixed(2)})</p>
                        ))}
                        <p style={{ fontWeight: 'bold' }}>Total do Pedido: R$ {cartTotal.toFixed(2)}</p>
                        
                        <button 
                            onClick={handleSendOrder} 
                            style={sendOrderButtonStyle}
                            disabled={cartItems.length === 0}
                        >
                            ENVIAR PEDIDO
                        </button>
                    </div>
                </div>

                {/* ----------------- SEÇÃO 2: RESUMO DA COMANDA ATIVA ----------------- */}
                <div style={sectionCardStyle}>
                    <h2 style={sectionTitleStyle}>Resumo da Comanda</h2>
                    
                    {activeOrderData.items.length === 0 ? (
                        <p style={{padding: '10px'}}>Ainda não há itens na comanda da Mesa {tableNumber}.</p>
                    ) : (
                        <>
                            <div style={orderSummaryContainerStyle}>
                                <h3>Itens Consolidados na Comanda:</h3>
                                <ul style={orderListStyle}>
                                    {activeOrderData.items.map((item, index) => (
                                        <li key={index} style={orderItemStyle}>
                                            <span style={{ fontWeight: 'bold' }}>{item.quantity}x {item.name}</span>
                                            <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            {/* NOVO: Cálculo e Botão de Fechar */}
                            <div style={totalCalculationStyle}>
                                
                                <h4>DETALHES DA CONTA</h4>
                                
                                <p style={calcRowStyle}>
                                    <span>Subtotal:</span>
                                    <span style={priceTextStyle}>R$ {subtotal.toFixed(2)}</span>
                                </p>
                                
                                <p style={calcRowStyle}>
                                    <span>
                                        Taxa de Serviço (10%): 
                                        <input 
                                            type="checkbox" 
                                            checked={includeServiceFee}
                                            onChange={(e) => setIncludeServiceFee(e.target.checked)}
                                            style={{marginLeft: '10px', transform: 'scale(1.2)'}}
                                        />
                                    </span>
                                    <span style={{...priceTextStyle, color: includeServiceFee ? '#ffc107' : '#555'}}>R$ {serviceFee.toFixed(2)}</span>
                                </p>

                                <p style={{...calcRowStyle, borderTop: '2px solid #555', paddingTop: '10px'}}>
                                    <span style={totalTextStyle}>TOTAL FINAL:</span>
                                    <span style={totalPriceStyle}>R$ {finalTotal.toFixed(2)}</span>
                                </p>
                                
                                <button onClick={handleCloseTable} style={closeAccountButtonStyle}>
                                    FECHAR CONTA E LIBERAR MESA
                                </button>
                            </div>

                        </>
                    )}
                </div>
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
    marginBottom: '20px',
};
const titleStyle = {
    fontSize: '2em',
    margin: 0,
};
const backButtonStyle = {
    padding: '10px 15px',
    backgroundColor: '#007bff', 
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
};
const messageStyle = {
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '20px',
    fontWeight: 'bold',
    textAlign: 'center',
};
const contentContainerStyle = {
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
};
const sectionCardStyle = {
    flex: 1,
    backgroundColor: '#333',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
};
const sectionTitleStyle = {
    borderBottom: '2px solid #555',
    paddingBottom: '10px',
    marginBottom: '15px',
};
const productsGridStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px',
    maxHeight: '400px', 
    overflowY: 'auto',
    paddingRight: '10px'
};
const productCardStyle = {
    backgroundColor: '#444',
    padding: '15px',
    borderRadius: '6px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 'calc(50% - 7.5px)', // Duas colunas
    boxSizing: 'border-box',
};
const productNameStyle = {
    margin: 0,
    fontWeight: 'bold',
};
const productPriceStyle = {
    margin: '5px 0 0 0',
    color: '#ccc',
    fontSize: '0.9em'
};
const quantityControlsStyle = {
    display: 'flex',
    alignItems: 'center',
    marginLeft: '15px',
};
const controlButtonStyle = {
    padding: '5px 10px',
    backgroundColor: '#555',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1em',
};
const quantityTextStyle = {
    margin: '0 10px',
    fontWeight: 'bold',
    minWidth: '20px',
    textAlign: 'center',
};
const cartSummaryStyle = {
    marginTop: '20px',
    paddingTop: '15px',
    borderTop: '1px solid #555',
};
const sendOrderButtonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#28a745', 
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '15px',
};
const orderSummaryContainerStyle = {
    maxHeight: '300px',
    overflowY: 'auto',
    padding: '5px 0',
    marginBottom: '20px',
};
const orderListStyle = {
    listStyle: 'none',
    padding: 0,
};
const orderItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '5px 0',
    borderBottom: '1px dotted #555',
};
// --- NOVOS ESTILOS DE CÁLCULO ---
const totalCalculationStyle = {
    border: '2px solid #555',
    padding: '15px',
    borderRadius: '6px',
    backgroundColor: '#2b2b2b',
};
const calcRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '8px 0',
    alignItems: 'center'
};
const priceTextStyle = {
    fontWeight: 'bold',
    fontSize: '1.1em',
    color: '#ccc'
};
const totalTextStyle = {
    fontWeight: 'bolder',
    fontSize: '1.2em',
    color: '#fff',
};
const totalPriceStyle = {
    fontWeight: 'bolder',
    fontSize: '1.4em',
    color: '#28a745'
};
const closeAccountButtonStyle = {
    width: '100%',
    padding: '15px',
    backgroundColor: '#dc3545', // Vermelho para fechar conta
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '20px',
    fontSize: '1.1em'
};
const centerStyle = {
    textAlign: 'center',
    padding: '50px',
    color: 'white',
};

export default PedidosPage;