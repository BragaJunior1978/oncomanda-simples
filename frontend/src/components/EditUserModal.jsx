// frontend/src/components/EditUserModal.jsx

import React, { useState } from 'react';

const EditUserModal = ({ user, onClose, onSave }) => {
    const [name, setName] = useState(user.name);
    const [username, setUsername] = useState(user.username);
    const [role, setRole] = useState(user.role);
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // -------------------------
    // FUNÇÃO DE SALVAR EDIÇÃO (PUT /users/:userId)
    // -------------------------
    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const dataToSubmit = {
            name,
            username,
            role,
        };
        // Só inclui a senha se o campo não estiver vazio
        if (newPassword.trim()) {
            dataToSubmit.newPassword = newPassword.trim();
        }

        try {
            // Utilizando fetch para PUT
            const response = await fetch(`http://localhost:3000/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    // JWT token deve ser incluído aqui
                },
                body: JSON.stringify(dataToSubmit),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Falha ao salvar a edição.');
            }

            alert(`Usuário ${name} atualizado com sucesso!`);
            onSave(); // Chama a função para fechar o modal e recarregar a lista
        } catch (err) {
            setError(err.message);
            console.error("Erro ao salvar:", err);
        } finally {
            setLoading(false);
        }
    };
    
    // -------------------------
    // RENDERIZAÇÃO DO MODAL
    // -------------------------
    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <h3 style={{ borderBottom: '1px solid #666', paddingBottom: '10px' }}>
                    Editar Usuário: {user.name}
                </h3>
                
                <form onSubmit={handleSave}>
                    {/* Campo Nome */}
                    <label style={styles.label}>Nome:</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        style={styles.input} 
                        required
                    />

                    {/* Campo Username */}
                    <label style={styles.label}>Username:</label>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        style={styles.input} 
                        required
                    />
                    
                    {/* Campo Papel (Role) */}
                    <label style={styles.label}>Papel (Role):</label>
                    <select 
                        value={role} 
                        onChange={(e) => setRole(e.target.value)} 
                        style={styles.select}
                    >
                        <option value="GARCOM">Garçom</option>
                        <option value="ADMIN">Administrador</option>
                    </select>

                    {/* Campo Nova Senha */}
                    <label style={styles.label}>Nova Senha (deixe vazio para manter a atual):</label>
                    <input 
                        type="password" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        style={styles.input} 
                        placeholder="Mínimo 4 caracteres"
                    />

                    {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                    
                    <div style={styles.buttonContainer}>
                        <button 
                            type="button" 
                            onClick={onClose} 
                            style={{ ...styles.button, backgroundColor: '#888' }}
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            style={{ ...styles.button, backgroundColor: '#2ecc71' }}
                        >
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Estilos do Modal
const styles = {
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: '#2c3e50',
        padding: '30px',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '400px',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)',
        color: '#fff',
    },
    label: {
        display: 'block',
        marginTop: '15px',
        marginBottom: '5px',
        fontWeight: 'bold',
    },
    input: {
        width: 'calc(100% - 22px)',
        padding: '10px',
        margin: '5px 0 10px 0',
        borderRadius: '4px',
        border: '1px solid #666',
        backgroundColor: '#34495e',
        color: '#fff',
    },
    select: {
        width: '100%',
        padding: '10px',
        margin: '5px 0 10px 0',
        borderRadius: '4px',
        border: '1px solid #666',
        backgroundColor: '#34495e',
        color: '#fff',
    },
    buttonContainer: {
        marginTop: '20px',
        display: 'flex',
        justifyContent: 'space-between',
    },
    button: {
        padding: '10px 20px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        color: 'white',
        fontWeight: 'bold',
    },
};

export default EditUserModal;