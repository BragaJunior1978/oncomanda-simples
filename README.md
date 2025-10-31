# oncomanda-simples

Sistema de Gerenciamento de Comandas Eletrônicas para restaurantes e bares, com monitor de cozinha e painel administrativo.

---

## 🚀 Instalação e Execução

Este projeto é uma aplicação Full-Stack dividida em duas partes: **Backend** (Node.js/Express/Prisma) e **Frontend** (React/Vite).

### 📋 Pré-requisitos

Para executar o projeto, você precisa ter instalado:
* Node.js (versão 18 ou superior)
* npm ou Yarn
* Um Banco de Dados suportado pelo Prisma (configurado no seu `schema.prisma`, geralmente PostgreSQL ou SQLite).

1. Instalação e Configuração do Backend
Siga os passos para configurar o servidor e o banco de dados:

Navegue para a pasta backend:

cd backend
Instale as dependências:

npm install
Configurar Variáveis de Ambiente: Crie um arquivo chamado .env na pasta backend com o conteúdo mínimo de configuração do banco de dados (SQLite):

# Exemplo de conteúdo para o arquivo .env
DATABASE_URL="file:./dev.db"
JWT_SECRET="sua_chave_secreta"
PORT=3000
Aplicar o Schema do Banco de Dados (Prisma Migrate): Este comando criará o arquivo de banco de dados e as tabelas:

npx prisma migrate dev
Rodar o Seed (Opcional, mas Recomendado): Se você tiver dados iniciais (usuários, mesas, produtos) para o sistema funcionar:

npx prisma db seed 
Inicie o Servidor:

npm start
O servidor iniciará na porta 3000.

2. Instalação e Execução do Frontend
Com o servidor rodando, inicie o aplicativo React:

Abra um novo terminal e navegue para a pasta frontend:

cd ../frontend
Instale as dependências:

npm install
Inicie o Aplicativo React:

npm run dev
O aplicativo estará acessível em http://localhost:5173.
O sistema utiliza os seguintes papéis para acesso:
* **ADMIN:** Acesso total (Mesas, Pedidos, Cozinha, Relatórios, Criação de Usuário).
* **GARCOM:** Acesso operacional (Mesas, Pedidos, Cozinha).

