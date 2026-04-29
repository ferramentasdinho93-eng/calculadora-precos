# 💰 PrecificaPro — Calculadora de Preços & Comissão

Sistema completo com frontend e backend para calcular preços de produtos e comissões de vendedores.

---

## 📁 Estrutura do projeto

```
calculadora-precos/
├── server.js          ← Backend (Node.js + Express)
├── package.json       ← Dependências do projeto
├── public/
│   ├── index.html     ← Frontend (HTML)
│   ├── style.css      ← Estilo (CSS)
│   └── app.js         ← Lógica do frontend (JS)
└── README.md
```

---

## 🚀 Passo a passo para rodar no VS Code

### 1. Instalar o Node.js (se ainda não tiver)

Acesse https://nodejs.org e baixe a versão **LTS**.
Após instalar, abra o terminal e verifique:
```
node -v
npm -v
```
Ambos devem mostrar uma versão (ex: v20.x.x).

---

### 2. Abrir o projeto no VS Code

- Abra o VS Code
- Clique em **File → Open Folder**
- Selecione a pasta `calculadora-precos`

---

### 3. Abrir o terminal no VS Code

- Pressione **Ctrl + `** (acento grave) ou vá em **Terminal → New Terminal**

---

### 4. Instalar as dependências

No terminal, digite:
```bash
npm install
```
Aguarde baixar os pacotes (express, cors, uuid, nodemon).

---

### 5. Rodar o servidor

```bash
npm run dev
```

Você verá no terminal:
```
✅  Servidor rodando em http://localhost:3000
```

---

### 6. Abrir no navegador

Acesse: **http://localhost:3000**

O sistema estará funcionando com frontend e backend integrados!

---

## 🔁 Modo desenvolvimento (recarrega automático)

O comando `npm run dev` usa o **nodemon**, que reinicia o servidor automaticamente sempre que você salvar um arquivo `.js`.

Para parar o servidor: pressione **Ctrl + C** no terminal.

---

## 📡 Endpoints da API

| Método | Rota                   | Descrição                          |
|--------|------------------------|------------------------------------|
| POST   | /api/calcular          | Calcula preço com markup/margem    |
| POST   | /api/calcular/lote     | Calcula vários produtos de uma vez |
| POST   | /api/comissao          | Calcula comissão de uma venda      |
| GET    | /api/vendedores        | Lista todos os vendedores          |
| POST   | /api/vendedores        | Cadastra novo vendedor             |
| PUT    | /api/vendedores/:id    | Atualiza vendedor                  |
| DELETE | /api/vendedores/:id    | Remove vendedor                    |
| GET    | /api/historico         | Últimos 20 cálculos                |
| DELETE | /api/historico         | Limpa o histórico                  |

---

## 💡 Dicas

- Os dados de vendedores ficam **em memória** — ao reiniciar o servidor, voltam ao padrão.
- Para salvar dados permanentemente no futuro, você pode adicionar um banco de dados como **SQLite** ou **MongoDB**.
- Para deixar online, você pode hospedar gratuitamente no **Railway** ou **Render**.
