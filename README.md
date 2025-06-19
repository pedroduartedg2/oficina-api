# API da Oficina Mecânica

API REST completa para sistema de gestão de oficina mecânica, desenvolvida com Node.js, Express e SQLite.

## 🚀 Funcionalidades

- **Gestão de Clientes**: CRUD completo para clientes
- **Gestão de Veículos**: Controle de veículos por cliente
- **Controle de Estoque**: Gerenciamento de peças e componentes
- **Agendamento de Serviços**: Sistema completo de serviços
- **Faturamento**: Geração e controle de faturas
- **Pagamentos**: Controle de pagamentos e status

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn

## 🔧 Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Inicialize o banco de dados:
```bash
npm run init-db
```

4. Inicie o servidor:
```bash
npm start
```

Para desenvolvimento com auto-reload:
```bash
npm run dev
```

## 📚 Endpoints da API

### Clientes
- `GET /api/clientes` - Listar todos os clientes
- `GET /api/clientes/:id` - Buscar cliente por ID
- `POST /api/clientes` - Criar novo cliente
- `PUT /api/clientes/:id` - Atualizar cliente
- `DELETE /api/clientes/:id` - Deletar cliente
- `GET /api/clientes/:id/veiculos` - Listar veículos do cliente

### Veículos
- `GET /api/veiculos` - Listar todos os veículos
- `GET /api/veiculos/:id` - Buscar veículo por ID
- `POST /api/veiculos` - Criar novo veículo
- `PUT /api/veiculos/:id` - Atualizar veículo
- `DELETE /api/veiculos/:id` - Deletar veículo

### Estoque
- `GET /api/estoque` - Listar todas as peças
- `GET /api/estoque/:id` - Buscar peça por ID
- `GET /api/estoque/baixo-estoque` - Listar peças com estoque baixo
- `POST /api/estoque` - Criar nova peça
- `PUT /api/estoque/:id` - Atualizar peça
- `PUT /api/estoque/:id/quantidade` - Atualizar quantidade (adicionar/remover)
- `DELETE /api/estoque/:id` - Deletar peça

### Serviços
- `GET /api/servicos` - Listar todos os serviços
- `GET /api/servicos/:id` - Buscar serviço por ID
- `POST /api/servicos` - Criar novo serviço
- `PUT /api/servicos/:id` - Atualizar serviço
- `DELETE /api/servicos/:id` - Deletar serviço
- `POST /api/servicos/:id/pecas` - Adicionar peça ao serviço
- `DELETE /api/servicos/:id/pecas/:pecaId` - Remover peça do serviço

### Faturas
- `GET /api/faturas` - Listar todas as faturas
- `GET /api/faturas/:id` - Buscar fatura por ID
- `GET /api/faturas/em-aberto` - Listar faturas em aberto
- `POST /api/faturas` - Criar nova fatura
- `PUT /api/faturas/:id` - Atualizar fatura
- `DELETE /api/faturas/:id` - Deletar fatura

### Pagamentos
- `GET /api/pagamentos` - Listar todos os pagamentos
- `GET /api/pagamentos/:id` - Buscar pagamento por ID
- `GET /api/pagamentos/fatura/:faturaId` - Listar pagamentos por fatura
- `POST /api/pagamentos` - Criar novo pagamento
- `PUT /api/pagamentos/:id` - Atualizar pagamento
- `DELETE /api/pagamentos/:id` - Deletar pagamento

## 📝 Exemplos de Uso

### Criar Cliente
```bash
curl -X POST http://localhost:3000/api/clientes \
  -H "Content-Type: application/json" \
  -d '{
    "Nome": "João Silva",
    "Endereco": "Rua das Flores, 123",
    "Telefone": "(11) 99999-9999",
    "Email": "joao@email.com"
  }'
```

### Criar Veículo
```bash
curl -X POST http://localhost:3000/api/veiculos \
  -H "Content-Type: application/json" \
  -d '{
    "ClienteID": 1,
    "Modelo": "Honda Civic 2020",
    "Ano": 2020,
    "Placa": "ABC-1234",
    "Chassi": "9BWZZZ377VT004251"
  }'
```

### Adicionar Peça ao Estoque
```bash
curl -X POST http://localhost:3000/api/estoque \
  -H "Content-Type: application/json" \
  -d '{
    "NomePeca": "Óleo Motor 5W30",
    "Descricao": "Óleo sintético para motor",
    "Quantidade": 50,
    "PrecoCusto": 25.00,
    "PrecoVenda": 35.00,
    "NivelMinimo": 10
  }'
```

## 🛡️ Segurança

A API inclui:
- Rate limiting (100 requests por 15 minutos por IP)
- Helmet.js para headers de segurança
- CORS configurável
- Validação de entrada
- Tratamento de erros

## 🗄️ Banco de Dados

O sistema utiliza SQLite com as seguintes tabelas:
- Clientes
- Veiculos
- Estoque
- Servicos
- ServicosPecas (tabela de junção)
- Faturas
- Pagamentos

## 📊 Health Check

Acesse `GET /health` para verificar o status da API.

## 🔄 Status Codes

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Erro de validação
- `404` - Não encontrado
- `500` - Erro interno do servidor

## 🚀 Deploy

Para produção, configure as variáveis de ambiente:
- `PORT` - Porta do servidor (padrão: 3000)
- `FRONTEND_URL` - URL do frontend para CORS

## 📄 Licença

Este projeto está sob a licença ISC.