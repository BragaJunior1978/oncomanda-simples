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

### 1. Instalação e Configuração do Backend

Siga os passos para configurar o servidor e o banco de dados:

1.  **Navegue para a pasta `backend`:**
    ```bash
    cd backend
    ```
2.  **Instale as dependências:**
    ```bash
    npm install
    ```
3.  **Configure e aplique o banco de dados (Prisma Migrate):**
    *Certifique-se de que a variável de ambiente DATABASE_URL no seu `.env` esteja correta.*
    ```bash
    npx prisma migrate dev
    ```
4.  **Inicie o Servidor:**
    ```bash
    npm start
    ```
    *O servidor iniciará na porta `3000`.*

### 2. Instalação e Execução do Frontend

Com o servidor rodando, inicie o aplicativo React:

1.  **Abra um novo terminal e navegue para a pasta `frontend`:**
    ```bash
    cd ../frontend
    ```
2.  **Instale as dependências:**
    ```bash
    npm install
    ```
3.  **Inicie o Aplicativo React:**
    ```bash
    npm run dev
    ```
    *O aplicativo estará acessível em `http://localhost:5173`.*

---

## 🔑 Acessos e Papéis

O sistema utiliza os seguintes papéis para acesso:
* **ADMIN:** Acesso total (Mesas, Pedidos, Cozinha, Relatórios, Criação de Usuário).
* **GARCOM:** Acesso operacional (Mesas, Pedidos, Cozinha).

