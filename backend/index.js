// backend/index.js

// 1. Configurações e Importações
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client'); // Importa o PrismaClient
const jwt = require('jsonwebtoken'); 

// Configuração JWT: Chave secreta
const JWT_SECRET = process.env.JWT_SECRET || 'a_chave_secreta_para_seu_sistema_de_comanda'; 

// Inicializa o Prisma Client para interagir com o DB
const prisma = new PrismaClient();

// NOVO: Função auxiliar para gerar uma senha temporária simples
const generateTemporaryPassword = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 dígitos
    return `TEMP${randomNum}`;
};

// Inicializa o Express
const app = express();
const PORT = process.env.PORT || 3000; 

// 2. Middlewares
app.use(cors()); 
app.use(express.json()); 


// 3. Rotas de API
// Rota de Boas-Vindas
app.get('/', (req, res) => {
    res.send('API do OnComanda está rodando! Porta: ' + PORT);
});


// ----------------------------------------------------
// ROTA DE AUTENTICAÇÃO (POST /auth/login)
// ----------------------------------------------------
app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Encontrar o usuário
        const user = await prisma.user.findUnique({ where: { username } });

        if (!user) {
            return res.status(401).json({ error: "Credenciais inválidas." });
        }

        // 2. Checar a Senha (Texto simples para teste)
        const isPasswordValid = (password === user.password); 
        
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Credenciais inválidas." });
        }

        // 3. Gerar o Token JWT
        const token = jwt.sign(
            { userId: user.id, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 4. Sucesso: Retorna o token e o perfil básico
        res.json({ 
            token, 
            user: { 
                id: user.id, 
                name: user.name, 
                role: user.role 
            } 
        });

    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});


// ----------------------------------------------------
// NOVO: ROTA DE RECUPERAÇÃO DE SENHA (POST /auth/recover-password)
// ----------------------------------------------------
app.post('/auth/recover-password', async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: "Username é obrigatório." });
    }

    try {
        // 1. Encontrar o usuário
        const user = await prisma.user.findUnique({ where: { username } });

        if (!user) {
            // Segurança: Retorna sucesso genérico mesmo se não encontrar o usuário.
            console.warn(`Tentativa de recuperação para username não encontrado: ${username}`);
            return res.json({ message: "Se a conta existir, as instruções foram enviadas." });
        }

        // 2. Gerar nova senha temporária
        const newTempPassword = generateTemporaryPassword();
        
        // 3. Atualizar a senha no banco de dados (Atenção: A senha não é HASHED, apenas texto simples)
        await prisma.user.update({
            where: { id: user.id },
            data: { password: newTempPassword } 
        });

        // 4. SIMULAÇÃO DO ENVIO: Loga a nova senha no console do servidor (Para testes locais)
        console.log("-----------------------------------------------");
        console.log(`🔑 RECUPERAÇÃO DE SENHA SIMULADA:`);
        console.log(`Usuário: ${user.name} (${user.username})`);
        console.log(`Nova Senha TEMPORÁRIA (para teste): ${newTempPassword}`);
        console.log("O usuário deve usar essa senha para logar e depois redefini-la.");
        console.log("-----------------------------------------------");
        
        // 5. Sucesso: Retorna mensagem genérica para o frontend
        res.json({ message: "Se o username existir, uma senha temporária foi gerada." });

    } catch (error) {
        console.error("Erro na recuperação de senha:", error);
        res.status(500).json({ error: "Erro interno do servidor ao tentar recuperar a senha." });
    }
});


// Endpoint: Listar Mesas
app.get('/tables', async (req, res) => {
    try {
        const tables = await prisma.table.findMany({
            orderBy: { number: 'asc' }
        });
        res.json(tables);
    } catch (error) {
        console.error("Erro ao buscar mesas:", error);
        res.status(500).json({ error: "Não foi possível buscar as mesas." });
    }
});


// **********************************************
// Rota para Reservar ou Liberar Reserva de uma Mesa (PUT /tables/:tableId/reserve)
// **********************************************
app.put('/tables/:tableId/reserve', async (req, res) => {
    const { tableId } = req.params;
    const idInt = parseInt(tableId);

    if (isNaN(idInt)) {
        return res.status(400).json({ error: "ID de mesa inválido." });
    }

    try {
        const table = await prisma.table.findUnique({
            where: { id: idInt },
        });

        if (!table) {
            return res.status(404).json({ error: "Mesa não encontrada." });
        }

        let newStatus;
        let message;

        // Se estiver LIVRE, reserva. Se estiver RESERVED, libera.
        if (table.status === 'LIVRE') {
            newStatus = 'RESERVED';
            message = `Mesa ${table.number} reservada com sucesso.`;
        } else if (table.status === 'RESERVED') {
             newStatus = 'LIVRE';
             message = `Mesa ${table.number} liberada da reserva com sucesso.`;
        } else {
            // Não permite reservar ou liberar se estiver OCUPADA
            return res.status(400).json({ error: `A Mesa ${table.number} está ocupada e não pode ser reservada ou liberada.` });
        }

        const updatedTable = await prisma.table.update({
            where: { id: idInt },
            data: { status: newStatus },
        });

        res.json({ message, table: updatedTable });

    } catch (error) {
        console.error("Erro ao gerenciar reserva da mesa:", error);
        res.status(500).json({ error: "Falha ao gerenciar reserva da mesa." });
    }
});


// Endpoint: Listar Produtos
app.get('/products', async (req, res) => {
    try {
        const products = await prisma.product.findMany();
        res.json(products);
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        res.status(500).json({ error: "Não foi possível buscar os produtos." });
    }
});


// **********************************************
// Rota GET para buscar Comanda Ativa da Mesa
// **********************************************
app.get('/tables/:tableId/orders', async (req, res) => {
    const { tableId } = req.params;
    const tableIdInt = parseInt(tableId);

    if (isNaN(tableIdInt)) {
        return res.status(400).json({ error: "ID da mesa inválido." });
    }

    try {
        const activeOrders = await prisma.order.findMany({
            where: {
                tableId: tableIdInt,
                // Busca pedidos que NÃO estão fechados (CLOSED). 
                status: {
                    not: 'CLOSED'
                }
            },
            include: {
                items: {
                    include: {
                        product: true, // Inclui o nome do produto
                    },
                },
                user: {
                    select: { name: true } // Nome do garçom que lançou o pedido
                }
            },
            orderBy: {
                createdAt: 'asc',
            }
        });

        const consolidatedItems = {};
        let total = 0;

        activeOrders.forEach(order => {
            total += order.total;
            order.items.forEach(item => {
                const productName = item.product.name;
                
                if (consolidatedItems[productName]) {
                    consolidatedItems[productName].quantity += item.quantity;
                } else {
                    consolidatedItems[productName] = {
                        name: productName,
                        quantity: item.quantity,
                        price: item.price,
                    };
                }
            });
        });

        const itemsArray = Object.values(consolidatedItems);

        res.json({
            tableId: tableIdInt,
            total: total,
            items: itemsArray,
            individualOrders: activeOrders.map(order => ({
                id: order.id,
                status: order.status,
                total: order.total,
                garcom: order.user.name,
                createdAt: order.createdAt
            }))
        });

    } catch (error) {
        console.error(`Erro ao buscar comanda da Mesa ${tableId}:`, error);
        res.status(500).json({ error: "Erro interno ao buscar a comanda da mesa." });
    }
});


// **********************************************
// Rota POST para ENVIAR um novo pedido (comanda)
// **********************************************
app.post('/orders', async (req, res) => {
    // 1. O ideal é obter o userId através do token JWT (a ser implementado)
    // Por enquanto, usaremos o valor do corpo da requisição ou um fallback
    const { mesaId, items, userId } = req.body; 

    // 1. Validação Básica
    if (!mesaId || !items || items.length === 0) {
        return res.status(400).json({ error: "Dados do pedido incompletos ou carrinho vazio." });
    }
    
    const tableIdInt = parseInt(mesaId); 
    if (isNaN(tableIdInt)) {
        return res.status(400).json({ error: "ID da mesa inválido." });
    }

    // 2. Cálculo do Total
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // CORREÇÃO DE SEGURANÇA: Garantir um userId válido.
    // O id do usuário 'garcom1' é 1. Se userId não vier ou for inválido, usamos 1 como fallback.
    const finalUserId = parseInt(userId) || 1; 


    try {
        // Transação para garantir a consistência
        const newOrder = await prisma.$transaction(async (prisma) => {
            
            // a. Cria o Pedido principal (Order)
            const order = await prisma.order.create({
                data: {
                    tableId: tableIdInt, 
                    userId: finalUserId, // <--- CORREÇÃO APLICADA AQUI
                    status: 'PENDING', 
                    total: totalAmount,
                },
            });

            // b. Cria os itens associados a este pedido
            await prisma.orderItem.createMany({
                data: items.map(item => ({
                    orderId: order.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                })),
            });
            
            // c. Atualiza o status da mesa para OCUPADA (OCCUPIED)
            await prisma.table.update({
                where: { id: tableIdInt },
                data: { status: 'OCCUPIED' },
            });

            return order; // Retorna o pedido criado
        });

        res.status(201).json({ 
            message: "Pedido enviado com sucesso e mesa atualizada!", 
            orderId: newOrder.id 
        });

    } catch (error) {
        console.error("Erro ao processar pedido:", error);
        // O log do terminal deve indicar o erro específico do Prisma (ex: 'P2003', falha na FK)
        res.status(500).json({ error: "Erro interno ao salvar o pedido." });
    }
});


// **********************************************
// Rota para listar Pedidos Pendentes (GET /orders/pending)
// **********************************************
app.get('/orders/pending', async (req, res) => {
    try {
        const pendingOrders = await prisma.order.findMany({
            where: {
                status: 'PENDING', // Apenas pedidos com status PENDING
            },
            include: {
                items: {
                    include: {
                        product: true, // Inclui detalhes do produto (nome, preço)
                    },
                },
                table: {
                    select: { number: true } // Apenas o número da mesa
                },
            },
            orderBy: {
                createdAt: 'asc', // Ordena pelo pedido mais antigo
            }
        });

        const formattedOrders = pendingOrders.map(order => ({
            id: order.id,
            mesa: order.table.number, 
            createdAt: order.createdAt,
            total: order.total,
            status: order.status,
            itens: order.items.map(item => ({
                name: item.product.name,
                quantity: item.quantity,
            }))
        }));

        res.json(formattedOrders);

    } catch (error) {
        console.error("Erro ao buscar pedidos pendentes:", error);
        res.status(500).json({ error: "Erro interno ao buscar pedidos para a cozinha." });
    }
});


// **********************************************
// Rota para Mudar o Status do Pedido para PRONTO (PUT /orders/:orderId/ready)
// **********************************************
app.put('/orders/:orderId/ready', async (req, res) => {
    const { orderId } = req.params;

    console.log(`[LOG] Recebida tentativa de marcar Pedido #${orderId} como PRONTO.`); 

    try {
        // 1. Atualiza o status do pedido para READY
        const updatedOrder = await prisma.order.update({
            where: { id: parseInt(orderId) },
            data: { 
                status: 'READY',
                readyAt: new Date(), 
            },
        });

        res.json({ 
            message: `Pedido #${orderId} marcado como PRONTO.`,
            order: updatedOrder 
        });

    } catch (error) {
        if (error.code === 'P2025') { 
            console.warn(`Tentativa de atualizar pedido #${orderId} que não existe.`);
            return res.status(404).json({ error: `Pedido #${orderId} não encontrado no sistema.` });
        }
        
        console.error(`Erro inesperado ao marcar pedido #${orderId} como pronto:`, error);
        res.status(500).json({ error: "Erro interno do servidor ao atualizar o status." });
    }
});


// **********************************************
// Rota para Fechar a Comanda e Liberar a Mesa (PUT /tables/:tableId/close)
// **********************************************
app.put('/tables/:tableId/close', async (req, res) => {
    const { tableId } = req.params;
    const tableIdInt = parseInt(tableId);

    if (isNaN(tableIdInt)) {
        return res.status(400).json({ error: "ID da mesa inválido." });
    }

    try {
        await prisma.$transaction(async (prisma) => {
            // 1. Fechar todos os pedidos em aberto (PENDING, READY, DELIVERED) daquela mesa, mudando para CLOSED.
            await prisma.order.updateMany({
                where: {
                    tableId: tableIdInt,
                    status: {
                        in: ['PENDING', 'READY', 'DELIVERED'] 
                    }
                },
                data: {
                    status: 'CLOSED',
                },
            });
            
            // 2. Atualiza o status da mesa para LIVRE
            await prisma.table.update({
                where: { id: tableIdInt },
                data: { status: 'LIVRE' },
            });
        });

        res.json({ 
            message: `Mesa #${tableId} liberada e todas as comandas associadas fechadas.`,
        });

    } catch (error) {
        console.error(`Erro ao fechar comanda da Mesa #${tableId}:`, error);
        res.status(500).json({ error: "Erro interno ao tentar fechar a comanda e liberar a mesa." });
    }
});


// **********************************************
// Rota para CADASTRO DE NOVOS USUÁRIOS (POST /users)
// **********************************************
app.post('/users', async (req, res) => {
    const { username, password, name, role } = req.body;

    console.log(`[LOG] Tentativa de cadastro do usuário: ${req.body.username}`);
    
    if (!username || !password || !name) {
        return res.status(400).json({ error: "Campos obrigatórios faltando (username, password, name)." });
    }

    try {
        // 1. Verifica se o usuário já existe
        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            return res.status(409).json({ error: "Nome de usuário já existe." });
        }

        // 2. Cria o novo usuário
        const newUser = await prisma.user.create({
            data: {
                username,
                password, 
                name,
                role: role || 'GARCOM', // Se o papel não for especificado, assume GARCOM
            },
            select: { id: true, username: true, name: true, role: true }, // Não retorna a senha!
        });

        res.status(201).json({ 
            message: "Usuário cadastrado com sucesso!", 
            user: newUser 
        });

    } catch (error) {
        console.error("Erro ao cadastrar novo usuário:", error);
        res.status(500).json({ error: "Erro interno do servidor ao tentar cadastrar o usuário." });
    }
});

// **********************************************
// NOVO: Rota para Listar TODOS os Usuários (GET /users)
// **********************************************
app.get('/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            // Exclui o campo 'password' da resposta por segurança
            select: {
                id: true,
                username: true,
                name: true,
                role: true,
                createdAt: true,
            },
            orderBy: {
                name: 'asc'
            }
        });
        res.json(users);
    } catch (error) {
        console.error("Erro ao listar usuários:", error);
        res.status(500).json({ error: "Não foi possível buscar a lista de usuários." });
    }
});

// **********************************************
// NOVO: Rota para Editar Usuário (PUT /users/:userId)
// **********************************************
app.put('/users/:userId', async (req, res) => {
    const { userId } = req.params;
    const { username, name, role, newPassword } = req.body;
    const idInt = parseInt(userId);

    if (isNaN(idInt)) {
        return res.status(400).json({ error: "ID de usuário inválido." });
    }

    // Objeto para armazenar apenas os campos que serão atualizados
    const dataToUpdate = {};

    if (name) dataToUpdate.name = name;
    if (role) dataToUpdate.role = role;

    // Se uma nova senha for fornecida, atualiza.
    // ATENÇÃO: Mantemos a senha em texto simples para consistência do projeto.
    if (newPassword) dataToUpdate.password = newPassword; 
    
    // O username deve ser tratado com cuidado para garantir a unicidade
    if (username) dataToUpdate.username = username; 

    if (Object.keys(dataToUpdate).length === 0) {
        return res.status(400).json({ error: "Nenhum dado válido fornecido para atualização." });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: idInt },
            data: dataToUpdate,
            select: { id: true, username: true, name: true, role: true },
        });

        res.json({ message: "Usuário atualizado com sucesso!", user: updatedUser });

    } catch (error) {
        if (error.code === 'P2002' && error.meta.target.includes('username')) {
             return res.status(409).json({ error: "Nome de usuário já está em uso." });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }
        console.error("Erro ao atualizar usuário:", error);
        res.status(500).json({ error: "Erro interno do servidor ao atualizar o usuário." });
    }
});

// **********************************************
// NOVO: Rota para Deletar Usuário (DELETE /users/:userId)
// **********************************************
app.delete('/users/:userId', async (req, res) => {
    const { userId } = req.params;
    const idInt = parseInt(userId);

    if (isNaN(idInt)) {
        return res.status(400).json({ error: "ID de usuário inválido." });
    }
    
    // IMPEDIR DE DELETAR O PRÓPRIO ADMIN (Assumindo id 1 é o admin principal)
    if (idInt === 1) {
        return res.status(403).json({ error: "Não é permitido deletar o usuário administrador principal (ID 1)." });
    }

    try {
        await prisma.user.delete({
            where: { id: idInt },
        });

        res.json({ message: `Usuário ${userId} deletado com sucesso.` });

    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }
        // Trata erro de Chave Estrangeira: Se o usuário tiver pedidos ativos, o DB não permitirá a deleção.
        if (error.code === 'P2003') { 
            return res.status(409).json({ error: "Não é possível deletar: O usuário possui registros (pedidos) associados no sistema." });
        }
        
        console.error("Erro ao deletar usuário:", error);
        res.status(500).json({ error: "Erro interno do servidor ao deletar o usuário." });
    }
});

// **********************************************
// Rota para Cadastro de Novas MESAS (POST /tables)
// **********************************************
app.post('/tables', async (req, res) => {
    const { number } = req.body;
    
    if (!number || typeof number !== 'number' || number <= 0) {
        return res.status(400).json({ error: "Número da mesa deve ser um número positivo válido." });
    }

    try {
        const existingTable = await prisma.table.findUnique({ where: { number } });
        if (existingTable) {
            return res.status(409).json({ error: `Mesa ${number} já existe.` });
        }

        const newTable = await prisma.table.create({
            data: {
                number,
                status: 'LIVRE', // Sempre começa como LIVRE
            },
        });
        res.status(201).json({ 
            message: `Mesa ${newTable.number} cadastrada com sucesso!`, 
            table: newTable 
        });

    } catch (error) {
        console.error("Erro ao cadastrar mesa:", error);
        res.status(500).json({ error: "Erro interno do servidor ao tentar cadastrar a mesa." });
    }
});

// **********************************************
// Rota para Cadastro de Novos PRODUTOS (POST /products)
// **********************************************
app.post('/products', async (req, res) => {
    const { name, price, available } = req.body;
    
    if (!name || typeof price !== 'number' || price <= 0) {
        return res.status(400).json({ error: "Nome e preço (válido) são obrigatórios." });
    }

    try {
        const newProduct = await prisma.product.create({
            data: {
                name,
                price,
                available: available !== undefined ? available : true, 
            },
        });
        res.status(201).json({ 
            message: "Produto cadastrado com sucesso!", 
            product: newProduct 
        });

    } catch (error) {
        console.error("Erro ao cadastrar produto:", error);
        res.status(500).json({ error: "Erro interno do servidor ao tentar cadastrar o produto." });
    }
});


// **********************************************
// NOVO: Rota para Listar Comandas Fechadas (GET /orders/closed) - PARA RELATÓRIOS
// **********************************************
app.get('/orders/closed', async (req, res) => {
    try {
        const closedOrders = await prisma.order.findMany({
            where: {
                status: 'CLOSED', // Apenas pedidos com status CLOSED
            },
            include: {
                table: {
                    select: { number: true } 
                },
                user: {
                    select: { name: true } // Nome do usuário que fechou (ou que iniciou)
                }
            },
            orderBy: {
                updatedAt: 'desc', // Ordena pelo fechamento mais recente
            }
        });

        const formattedOrders = closedOrders.map(order => ({
            id: order.id,
            tableNumber: order.table.number, 
            total: order.total,
            userName: order.user.name,
            closedAt: order.closedAt || order.createdAt,
        }));

        res.json(formattedOrders);

    } catch (error) {
        console.error("Erro ao buscar comandas fechadas para relatório:", error);
        res.status(500).json({ error: "Erro interno ao buscar relatório de vendas." });
    }
});


// 4. Inicialização do Servidor
async function main() {
    try {
        await prisma.$connect(); 
        console.log("Conexão com o banco de dados (SQLite) estabelecida com sucesso.");

        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Erro ao iniciar a aplicação:", error);
        process.exit(1);
    }
}

main();

// 5. Configuração para fechar a conexão do DB ao fechar o servidor
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});