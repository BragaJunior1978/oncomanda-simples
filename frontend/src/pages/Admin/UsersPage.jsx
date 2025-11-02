// frontend/src/pages/Admin/UsersPage.jsx

import React, { useState, useEffect } from 'react';
import { FaTrash, FaEdit, FaUser } from 'react-icons/fa'; 
import { useNavigate } from 'react-router-dom'; // Importação para o botão Voltar
import EditUserModal from '../../components/EditUserModal'; // Caminho corrigido

const API_BASE_URL = 'http://localhost:3000';

const userRoles = {
    ADMIN: 'Administrador',
    GARCOM: 'Garçom',
};

const UsersPage = () => {
    const navigate = useNavigate(); // Inicializa o hook de navegação
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState(null);

    // Assumindo que você usa o token do useAuth aqui também
    // const { token } = useAuth();

    // -------------------------
    // 1. FUNÇÃO DE BUSCA (GET /users)
    // -------------------------
    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Incluir token aqui
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Falha ao buscar usuários.');
            }

            const data = await response.json();
            setUsers(data);
        } catch (err) {
            setError(err.message);
            console.error("Erro ao buscar usuários:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // -------------------------
    // 2. FUNÇÃO DE DELETAR (DELETE /users/:userId)
    // -------------------------
    const handleDelete = async (userId, userName) => {
        if (!window.confirm(`Tem certeza que deseja deletar o usuário ${userName}?`)) {
            return;
        }
        
        // Proteção extra contra a exclusão do Admin principal
        if (userId === 1) {
            alert("Não é permitido deletar o usuário administrador principal (ID 1).");
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    // Incluir token aqui
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Falha ao deletar usuário.');
            }

            // Atualiza a lista removendo o usuário deletado
            setUsers(users.filter(user => user.id !== userId));
            alert(`Usuário ${userName} deletado com sucesso.`);

        } catch (err) {
            alert(`Erro ao deletar: ${err.message}`);
            console.error("Erro ao deletar usuário:", err);
        }
    };

    // -------------------------
    // 3. FUNÇÕES DE EDIÇÃO (Abrir/Fechar Modal)
    // -------------------------
    const handleEdit = (user) => {
        setUserToEdit(user);
        setIsModalOpen(true);
    };

    const handleSaveEdit = () => {
        fetchUsers(); // Recarrega a lista após o salvamento ser bem-sucedido
        setIsModalOpen(false);
        setUserToEdit(null);
    };

    const handleCancelEdit = () => {
        setIsModalOpen(false);
        setUserToEdit(null);
    };
    
    // -------------------------
    // 4. RENDERIZAÇÃO
    // -------------------------

    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px', color: '#ccc' }}>Carregando usuários...</div>;
    if (error) return <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>Erro: {error}</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            
            {/* NOVO BOTÃO DE VOLTAR PARA ADMINISTRAÇÃO */}
            <button 
                onClick={() => navigate('/admin')} 
                style={styles.backButton}
            >
                ← Voltar para Administração
            </button>

            <h2 style={{ fontSize: '2em', marginBottom: '30px', borderBottom: '2px solid #555', paddingBottom: '10px' }}>
                <FaUser style={{ marginRight: '10px' }} /> Gerenciar Usuários
            </h2>

            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>Username</th>
                        <th style={styles.th}>Nome</th>
                        <th style={styles.th}>Papel</th>
                        <th style={styles.th}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id} style={user.role === 'ADMIN' ? styles.adminRow : {}}>
                            <td style={styles.td}>{user.id}</td>
                            <td style={styles.td}>{user.username}</td>
                            <td style={styles.td}>{user.name}</td>
                            <td style={styles.td}>{userRoles[user.role] || user.role}</td>
                            <td style={styles.td}>
                                <button 
                                    onClick={() => handleEdit(user)} 
                                    style={{ ...styles.actionButton, backgroundColor: '#3498db' }}
                                    title="Editar Usuário"
                                >
                                    <FaEdit />
                                </button>
                                <button 
                                    onClick={() => handleDelete(user.id, user.name)} 
                                    style={{ 
                                        ...styles.actionButton, 
                                        backgroundColor: '#e74c3c',
                                        cursor: user.id === 1 ? 'not-allowed' : 'pointer' 
                                    }}
                                    disabled={user.id === 1}
                                    title={user.id === 1 ? "Não pode deletar o Admin principal" : "Deletar Usuário"}
                                >
                                    <FaTrash />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {/* Modal de Edição */}
            {isModalOpen && userToEdit && (
                <EditUserModal 
                    user={userToEdit} 
                    onSave={handleSaveEdit} 
                    onClose={handleCancelEdit} 
                />
            )}
        </div>
    );
};

// Estilos básicos para a tabela (dark mode/simplificado)
const styles = {
    // NOVO ESTILO
    backButton: { 
        padding: '10px 15px', 
        backgroundColor: '#343a40', 
        color: 'white', 
        border: 'none', 
        borderRadius: '4px', 
        cursor: 'pointer', 
        marginBottom: '20px',
        fontSize: '1em'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '20px',
        backgroundColor: '#333',
        color: '#fff',
    },
    th: {
        backgroundColor: '#444',
        padding: '12px 15px',
        textAlign: 'left',
        borderBottom: '2px solid #555',
    },
    td: {
        padding: '10px 15px',
        borderBottom: '1px solid #555',
        textAlign: 'left',
    },
    actionButton: {
        border: 'none',
        color: 'white',
        padding: '8px 10px',
        margin: '0 5px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
    },
    adminRow: {
        backgroundColor: '#4a3d10', // Um leve destaque para o Admin
        fontWeight: 'bold',
    }
};

export default UsersPage;