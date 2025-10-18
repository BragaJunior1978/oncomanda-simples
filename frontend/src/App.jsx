// frontend/src/App.jsx

import React from 'react';
// Importação de Rotas
import { 
    BrowserRouter as Router, 
    Routes, 
    Route, 
    Navigate 
} from 'react-router-dom';

// Importação do Contexto
import { AuthProvider, useAuth } from './context/AuthContext'; 

// Importação dos Componentes de Página (Caminhos Corrigidos)
import LoginPage from './pages/LoginPage';
import MesasPage from './pages/MesasPage';
import PedidosPage from './pages/PedidosPage';
import KitchenPage from './pages/CozinhaPage'; // Componente CozinhaPage.jsx
import ReportsPage from './pages/Admin/ReportsPage';
import UserCreatePage from './pages/UserCreatePage'; // Caminho direto em 'pages/'
import ProductTableCreatePage from './pages/Admin/ProductTableCreatePage'; 


// =======================================================
// 1. Componente Auxiliar: Rota Protegida 
// =======================================================
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { isAuthenticated, user, loading } = useAuth();
    
    if (loading) {
        return <div style={{textAlign: 'center', padding: '50px', color: 'white'}}>Carregando...</div>; 
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />; 
    }
    
    const userRole = user?.role; 
    
    // As linhas de debug podem ser removidas ou deixadas
    console.log('User Role (Papel do Usuário):', userRole); 
    console.log('Allowed Roles (Papéis Permitidos):', allowedRoles);


    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        // Redireciona para a tela inicial se o usuário não tiver permissão
        return (
            <div style={{color: 'red', textAlign: 'center', marginTop: '50px'}}>
                Acesso negado. Você não tem permissão para visualizar esta página.
            </div>
        );
    }

    return children;
};


// =======================================================
// 2. Componente Auxiliar: Redireciona se JÁ estiver Logado
// =======================================================
const RedirectIfLoggedIn = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div style={{textAlign: 'center', padding: '50px', color: 'white'}}>Verificando autenticação...</div>;
    }
    
    if (isAuthenticated) {
        return <Navigate to="/mesas" replace />; 
    }
    
    return children; 
};


// =======================================================
// 3. Componente Principal App
// =======================================================
const App = () => {
    return (
        <AuthProvider>
            <Router> 
                <Routes>
                    
                    {/* ROTA PÚBLICA / LOGIN */}
                    <Route 
                        path="/login" 
                        element={
                            <RedirectIfLoggedIn>
                                <LoginPage />
                            </RedirectIfLoggedIn>
                        } 
                    />

                    {/* ------------------------------------------- */}
                    {/* ROTAS PARA GARÇONS (GARCOM) E ADMIN */}
                    {/* ------------------------------------------- */}
                    
                    {/* 🚨 CORREÇÃO DE PERMISSÃO: WAITER -> GARCOM */}
                    <Route path="/mesas" element={<ProtectedRoute allowedRoles={['GARCOM', 'ADMIN']}><MesasPage /></ProtectedRoute>} />
                    {/* 🚨 CORREÇÃO DE PERMISSÃO: WAITER -> GARCOM */}
                    <Route path="/pedidos/:tableId" element={<ProtectedRoute allowedRoles={['GARCOM', 'ADMIN']}><PedidosPage /></ProtectedRoute>} />
                    
                    {/* 🚨 CORREÇÃO DE PERMISSÃO: WAITER -> GARCOM */}
                    <Route path="/cozinha" element={<ProtectedRoute allowedRoles={['GARCOM', 'ADMIN']}><KitchenPage /></ProtectedRoute>} />
                    
                    {/* ROTAS DE ADMINISTRAÇÃO (APENAS ADMIN) */}
                    <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><ProductTableCreatePage /></ProtectedRoute>} />
                    <Route path="/admin/users/create" element={<ProtectedRoute allowedRoles={['ADMIN']}><UserCreatePage /></ProtectedRoute>} />
                    <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['ADMIN']}><ReportsPage /></ProtectedRoute>} />


                    {/* ROTA PADRÃO */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    
                    {/* Rota de Not Found */}
                    <Route path="*" element={<div style={{textAlign: 'center', marginTop: '50px', color: 'white'}}>404 - Página Não Encontrada</div>} />

                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;