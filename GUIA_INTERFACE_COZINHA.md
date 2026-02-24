# 🍳 GUIA COMPLETO - INTERFACE DA COZINHA

**Sistema de Restauração - Mesa Digital**  
**Data:** 24 de Fevereiro de 2026  
**Versão:** 1.0

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Autenticação](#autenticação)
3. [Endpoints da Cozinha](#endpoints-da-cozinha)
4. [Fluxo de Trabalho](#fluxo-de-trabalho)
5. [WebSocket (Tempo Real)](#websocket-tempo-real)
6. [Gestão de Sessão](#gestão-de-sessão)
7. [Interface Sugerida](#interface-sugerida)
8. [Tratamento de Erros](#tratamento-de-erros)
9. [Exemplos Completos](#exemplos-completos)

---

## 🎯 VISÃO GERAL

### Papel do Cozinheiro

O operador da cozinha (role `COZINHA`) é responsável por:
- ✅ Visualizar pedidos pendentes
- ✅ Assumir pedidos (PENDENTE → EM_PREPARACAO)
- ✅ Marcar pedidos como prontos (EM_PREPARACAO → PRONTO)
- ✅ Visualizar tempo de preparação
- ✅ Receber notificações em tempo real de novos pedidos

### Estados do SubPedido

```
CRIADO → PENDENTE → EM_PREPARACAO → PRONTO → ENTREGUE
   ↓         ↓            ↓
CANCELADO  CANCELADO  CANCELADO
```

**Estados que a COZINHA manipula:**
- 📥 **PENDENTE**: Aguardando início de preparação
- 🔥 **EM_PREPARACAO**: Sendo preparado pela cozinha
- ✅ **PRONTO**: Preparado, aguardando entrega pelo atendente

---

## 🔐 AUTENTICAÇÃO

### 1️⃣ Login do Cozinheiro

**Endpoint:** `POST /api/auth/jwt/login`

**Request:**
```json
{
  "username": "+244912345678",
  "password": "senha123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login realizado com sucesso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh-token-aqui",
    "expiresIn": 3600,
    "user": {
      "id": 5,
      "username": "+244912345678",
      "nome": "João Cozinheiro",
      "roles": ["ROLE_COZINHA"],
      "unidadeAtendimentoId": 1
    }
  },
  "error": null
}
```

**Exemplo cURL:**
```bash
curl -X POST http://localhost:8080/api/auth/jwt/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "+244912345678",
    "password": "senha123"
  }'
```

**Exemplo JavaScript:**
```javascript
async function fazerLogin(telefone, senha) {
  const response = await fetch('http://localhost:8080/api/auth/jwt/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: telefone,
      password: senha
    })
  });
  
  if (!response.ok) {
    throw new Error('Login falhou');
  }
  
  const data = await response.json();
  
  // Salvar token no localStorage
  localStorage.setItem('token', data.data.token);
  localStorage.setItem('refreshToken', data.data.refreshToken);
  localStorage.setItem('user', JSON.stringify(data.data.user));
  
  return data.data;
}
```

### 2️⃣ Renovar Token (Refresh)

**Endpoint:** `POST /api/auth/jwt/refresh`

**Request:**
```json
{
  "refreshToken": "refresh-token-aqui"
}
```

**Response (200 OK):**
```json
{
  "message": "Token renovado com sucesso",
  "data": {
    "token": "novo-token-aqui",
    "refreshToken": "novo-refresh-token",
    "expiresIn": 3600,
    "user": { ... }
  }
}
```

**Exemplo JavaScript:**
```javascript
async function renovarToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch('http://localhost:8080/api/auth/jwt/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refreshToken })
  });
  
  if (!response.ok) {
    // Token expirado, fazer logout
    fazerLogout();
    return null;
  }
  
  const data = await response.json();
  localStorage.setItem('token', data.data.token);
  localStorage.setItem('refreshToken', data.data.refreshToken);
  
  return data.data.token;
}
```

### 3️⃣ Logout

**Apenas Frontend - Limpar Dados:**
```javascript
function fazerLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  // Redirecionar para tela de login
  window.location.href = '/login';
}
```

---

## 🍽️ ENDPOINTS DA COZINHA

### Authorization Header

**Todos os endpoints requerem autenticação:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1️⃣ Listar Pedidos Ativos da Cozinha

**Endpoint:** `GET /api/subpedidos/cozinha/{cozinhaId}/ativos`

**Descrição:** Retorna todos os SubPedidos com status PENDENTE ou EM_PREPARACAO de uma cozinha específica.

**Parâmetros:**
- `cozinhaId` (path): ID da cozinha (obter do perfil do usuário ou endpoint de cozinhas)

**Response (200 OK):**
```json
{
  "message": "Sucesso",
  "data": [
    {
      "id": 101,
      "pedidoId": 45,
      "mesaCodigo": "MESA-01",
      "cozinhaId": 1,
      "cozinhaNome": "Cozinha Principal",
      "status": "PENDENTE",
      "prioridade": "NORMAL",
      "itens": [
        {
          "id": 201,
          "produtoId": 10,
          "produtoNome": "Bife Grelhado",
          "produtoCodigo": "BIFE-001",
          "quantidade": 2,
          "precoUnitario": 2500.00,
          "observacao": "Mal passado"
        },
        {
          "id": 202,
          "produtoId": 11,
          "produtoNome": "Batata Frita",
          "quantidade": 1,
          "precoUnitario": 500.00,
          "observacao": null
        }
      ],
      "tempoEstimadoMinutos": 20,
      "timestampCriacao": "2026-02-24T14:30:00",
      "timestampInicio": null,
      "timestampConclusao": null,
      "observacoes": "Cliente com alergia a glúten",
      "atraso": false,
      "minutosDesdeInicio": 0
    },
    {
      "id": 102,
      "pedidoId": 46,
      "mesaCodigo": "MESA-05",
      "status": "EM_PREPARACAO",
      "prioridade": "URGENTE",
      "itens": [ ... ],
      "timestampInicio": "2026-02-24T14:25:00",
      "atraso": true,
      "minutosDesdeInicio": 25
    }
  ],
  "error": null
}
```

**Exemplo cURL:**
```bash
curl -X GET http://localhost:8080/api/subpedidos/cozinha/1/ativos \
  -H "Authorization: Bearer $TOKEN"
```

**Exemplo JavaScript:**
```javascript
async function buscarPedidosAtivos(cozinhaId) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(
    `http://localhost:8080/api/subpedidos/cozinha/${cozinhaId}/ativos`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  if (response.status === 401) {
    // Token expirado
    await renovarToken();
    return buscarPedidosAtivos(cozinhaId); // Retry
  }
  
  const data = await response.json();
  return data.data;
}
```

---

### 2️⃣ Assumir Pedido (PENDENTE → EM_PREPARACAO)

**Endpoint:** `PUT /api/subpedidos/{id}/assumir`

**Descrição:** Cozinha assume o pedido e inicia a preparação.

**Parâmetros:**
- `id` (path): ID do SubPedido

**Request:** Sem body

**Response (200 OK):**
```json
{
  "message": "SubPedido assumido",
  "data": {
    "id": 101,
    "pedidoId": 45,
    "mesaCodigo": "MESA-01",
    "status": "EM_PREPARACAO",
    "timestampInicio": "2026-02-24T14:35:00",
    "itens": [ ... ]
  },
  "error": null
}
```

**Response (400 BAD REQUEST) - Transição inválida:**
```json
{
  "message": null,
  "data": null,
  "error": "Transição inválida: SubPedido já está EM_PREPARACAO"
}
```

**Exemplo cURL:**
```bash
curl -X PUT http://localhost:8080/api/subpedidos/101/assumir \
  -H "Authorization: Bearer $TOKEN"
```

**Exemplo JavaScript:**
```javascript
async function assumirPedido(subPedidoId) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(
    `http://localhost:8080/api/subpedidos/${subPedidoId}/assumir`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao assumir pedido');
  }
  
  const data = await response.json();
  return data.data;
}
```

---

### 3️⃣ Marcar como Pronto (EM_PREPARACAO → PRONTO)

**Endpoint:** `PUT /api/subpedidos/{id}/marcar-pronto`

**Descrição:** Cozinha finaliza a preparação e marca o pedido como pronto.

**Parâmetros:**
- `id` (path): ID do SubPedido

**Request:** Sem body

**Response (200 OK):**
```json
{
  "message": "SubPedido pronto",
  "data": {
    "id": 101,
    "pedidoId": 45,
    "mesaCodigo": "MESA-01",
    "status": "PRONTO",
    "timestampInicio": "2026-02-24T14:35:00",
    "timestampConclusao": "2026-02-24T14:55:00",
    "tempoPreparacaoMinutos": 20,
    "itens": [ ... ]
  },
  "error": null
}
```

**Response (400 BAD REQUEST):**
```json
{
  "error": "SubPedido não está EM_PREPARACAO"
}
```

**Exemplo cURL:**
```bash
curl -X PUT http://localhost:8080/api/subpedidos/101/marcar-pronto \
  -H "Authorization: Bearer $TOKEN"
```

**Exemplo JavaScript:**
```javascript
async function marcarComoPronto(subPedidoId) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(
    `http://localhost:8080/api/subpedidos/${subPedidoId}/marcar-pronto`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao marcar como pronto');
  }
  
  const data = await response.json();
  return data.data;
}
```

---

### 4️⃣ Listar Pedidos Prontos (Para Impressão)

**Endpoint:** `GET /api/subpedidos/cozinha/{cozinhaId}/prontos`

**Descrição:** Retorna SubPedidos com status PRONTO aguardando entrega.

**Response (200 OK):**
```json
{
  "message": "Sucesso",
  "data": [
    {
      "id": 103,
      "pedidoId": 47,
      "mesaCodigo": "MESA-03",
      "status": "PRONTO",
      "timestampConclusao": "2026-02-24T14:50:00",
      "tempoPreparacaoMinutos": 18,
      "itens": [ ... ]
    }
  ]
}
```

---

### 5️⃣ Buscar Pedidos com Atraso

**Endpoint:** `GET /api/subpedidos/atrasados?minutosAtraso=30`

**Descrição:** Retorna SubPedidos em atraso (EM_PREPARACAO há mais de X minutos).

**Query Parameters:**
- `minutosAtraso` (opcional, default: 30): Minutos de atraso para considerar

**Response (200 OK):**
```json
{
  "message": "Sucesso",
  "data": [
    {
      "id": 102,
      "status": "EM_PREPARACAO",
      "timestampInicio": "2026-02-24T14:00:00",
      "minutosDesdeInicio": 35,
      "atraso": true,
      "tempoEstimadoMinutos": 20
    }
  ]
}
```

---

### 6️⃣ Buscar Detalhes de um SubPedido

**Endpoint:** `GET /api/subpedidos/{id}`

**Response (200 OK):**
```json
{
  "message": "Sucesso",
  "data": {
    "id": 101,
    "pedidoId": 45,
    "mesaCodigo": "MESA-01",
    "cozinhaId": 1,
    "cozinhaNome": "Cozinha Principal",
    "status": "EM_PREPARACAO",
    "prioridade": "NORMAL",
    "itens": [
      {
        "id": 201,
        "produtoId": 10,
        "produtoNome": "Bife Grelhado",
        "produtoCodigo": "BIFE-001",
        "quantidade": 2,
        "precoUnitario": 2500.00,
        "subtotal": 5000.00,
        "observacao": "Mal passado"
      }
    ],
    "tempoEstimadoMinutos": 20,
    "timestampCriacao": "2026-02-24T14:30:00",
    "timestampInicio": "2026-02-24T14:35:00",
    "timestampConclusao": null,
    "observacoes": "Cliente com alergia a glúten",
    "minutosDesdeInicio": 15,
    "atraso": false
  }
}
```

---

### 7️⃣ KPI - Tempo Médio de Preparação

**Endpoint:** `GET /api/subpedidos/kpi/tempo-medio`

**Descrição:** Retorna tempo médio de preparação por cozinha (para dashboard).

**Response (200 OK):**
```json
{
  "message": "Sucesso",
  "data": {
    "Cozinha Principal": 18.5,
    "Cozinha Pizzas": 15.2,
    "Cozinha Sobremesas": 8.7
  }
}
```

---

## 📊 FLUXO DE TRABALHO DA COZINHA

### Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│  1. COZINHEIRO FAZ LOGIN                                    │
│     POST /api/auth/jwt/login                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. CONECTA AO WEBSOCKET (Notificações em Tempo Real)      │
│     ws://localhost:8080/ws                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. CARREGA LISTA DE PEDIDOS ATIVOS                         │
│     GET /api/subpedidos/cozinha/{cozinhaId}/ativos          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. LOOP PRINCIPAL:                                         │
│     - Visualiza pedidos PENDENTES                           │
│     - Assume pedido: PUT /api/subpedidos/{id}/assumir       │
│     - Prepara pedido (estado EM_PREPARACAO)                 │
│     - Marca pronto: PUT /api/subpedidos/{id}/marcar-pronto  │
│     - Recebe novos pedidos via WebSocket                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. ATENDENTE ENTREGA PEDIDO                                │
│     PUT /api/subpedidos/{id}/marcar-entregue                │
│     (não é responsabilidade da cozinha)                     │
└─────────────────────────────────────────────────────────────┘
```

### Ciclo de um Pedido

```
PEDIDO CRIADO PELO CLIENTE
         ↓
[PENDENTE] ← Aparece na lista da cozinha
         ↓
COZINHEIRO CLICA EM "ASSUMIR"
         ↓
[EM_PREPARACAO] ← Timer começa a contar
         ↓
COZINHEIRO PREPARA O PEDIDO
         ↓
COZINHEIRO CLICA EM "PRONTO"
         ↓
[PRONTO] ← Notifica atendente
         ↓
ATENDENTE ENTREGA À MESA
         ↓
[ENTREGUE] ← Pedido completo
```

---

## 🔔 WEBSOCKET (TEMPO REAL)

### Conexão WebSocket

**URL:** `ws://localhost:8080/ws`

**Protocolo:** SockJS + STOMP

### Instalação (Frontend)

```bash
npm install sockjs-client stompjs
```

### Exemplo de Implementação

```javascript
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

class CozinhaWebSocket {
  constructor(cozinhaId, onNovoPedido, onAtualizacaoPedido) {
    this.cozinhaId = cozinhaId;
    this.onNovoPedido = onNovoPedido;
    this.onAtualizacaoPedido = onAtualizacaoPedido;
    this.stompClient = null;
  }

  conectar() {
    const socket = new SockJS('http://localhost:8080/ws');
    this.stompClient = Stomp.over(socket);

    const token = localStorage.getItem('token');

    this.stompClient.connect(
      { Authorization: `Bearer ${token}` },
      () => {
        console.log('✅ Conectado ao WebSocket');

        // Inscrever-se em novos pedidos da cozinha
        this.stompClient.subscribe(
          `/topic/cozinha/${this.cozinhaId}/novos-pedidos`,
          (message) => {
            const subPedido = JSON.parse(message.body);
            console.log('🔔 Novo pedido recebido:', subPedido);
            this.onNovoPedido(subPedido);
          }
        );

        // Inscrever-se em atualizações de pedidos
        this.stompClient.subscribe(
          `/topic/cozinha/${this.cozinhaId}/atualizacoes`,
          (message) => {
            const subPedido = JSON.parse(message.body);
            console.log('🔄 Pedido atualizado:', subPedido);
            this.onAtualizacaoPedido(subPedido);
          }
        );
      },
      (error) => {
        console.error('❌ Erro na conexão WebSocket:', error);
        // Tentar reconectar após 5 segundos
        setTimeout(() => this.conectar(), 5000);
      }
    );
  }

  desconectar() {
    if (this.stompClient) {
      this.stompClient.disconnect();
      console.log('🔌 Desconectado do WebSocket');
    }
  }
}

// Uso:
const ws = new CozinhaWebSocket(
  1, // ID da cozinha
  (novoPedido) => {
    // Adicionar pedido à lista
    adicionarPedidoNaLista(novoPedido);
    // Tocar som de notificação
    tocarSomNotificacao();
  },
  (pedidoAtualizado) => {
    // Atualizar pedido na lista
    atualizarPedidoNaLista(pedidoAtualizado);
  }
);

ws.conectar();
```

### Tópicos WebSocket Disponíveis

| Tópico | Descrição |
|--------|-----------|
| `/topic/cozinha/{id}/novos-pedidos` | Novos SubPedidos (PENDENTE) |
| `/topic/cozinha/{id}/atualizacoes` | Atualizações de status |
| `/topic/subpedido/{id}/status` | Status de um SubPedido específico |

---

## 🔄 GESTÃO DE SESSÃO

### Persistência do Token

**LocalStorage (Recomendado):**
```javascript
// Salvar ao fazer login
localStorage.setItem('token', token);
localStorage.setItem('refreshToken', refreshToken);
localStorage.setItem('tokenExpiration', expiresIn);

// Carregar ao iniciar app
const token = localStorage.getItem('token');
if (token) {
  // Verificar se não expirou
  const expiration = localStorage.getItem('tokenExpiration');
  if (Date.now() < expiration) {
    // Token válido, carregar interface
    carregarInterfaceCozinha();
  } else {
    // Token expirado, tentar renovar
    renovarToken();
  }
}
```

### Auto-Renovação de Token

```javascript
// Renovar token automaticamente antes de expirar
function iniciarAutoRenovacao() {
  const RENOVAR_ANTES_MS = 5 * 60 * 1000; // 5 minutos antes
  const expiresIn = localStorage.getItem('tokenExpiration');
  const tempoAteExpiracao = expiresIn - Date.now();
  const tempoAteRenovacao = tempoAteExpiracao - RENOVAR_ANTES_MS;

  if (tempoAteRenovacao > 0) {
    setTimeout(async () => {
      try {
        await renovarToken();
        iniciarAutoRenovacao(); // Agendar próxima renovação
      } catch (error) {
        console.error('Erro ao renovar token:', error);
        fazerLogout();
      }
    }, tempoAteRenovacao);
  }
}

// Iniciar ao fazer login
iniciarAutoRenovacao();
```

### Interceptor HTTP (Renovação Automática)

```javascript
async function fetchComRenovacao(url, options = {}) {
  let token = localStorage.getItem('token');
  
  const requestOptions = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  };

  let response = await fetch(url, requestOptions);

  // Se 401, tentar renovar token e fazer request novamente
  if (response.status === 401) {
    token = await renovarToken();
    
    if (token) {
      requestOptions.headers['Authorization'] = `Bearer ${token}`;
      response = await fetch(url, requestOptions);
    } else {
      fazerLogout();
      throw new Error('Sessão expirada');
    }
  }

  return response;
}
```

### Manter Sessão Ativa

**Backend mantém sessão por 1 hora. Para sessões longas:**

```javascript
// Ping a cada 10 minutos para manter sessão ativa
setInterval(async () => {
  try {
    await fetchComRenovacao('/api/health');
    console.log('✅ Sessão mantida ativa');
  } catch (error) {
    console.error('Erro ao manter sessão:', error);
  }
}, 10 * 60 * 1000);
```

---

## 🖥️ INTERFACE SUGERIDA

### Layout da Tela Principal

```
┌─────────────────────────────────────────────────────────────┐
│  🍳 COZINHA PRINCIPAL         João Cozinheiro  [Logout]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ PEDIDOS PENDENTES (3) ─────────────────────────────┐   │
│  │                                                       │   │
│  │  ┌─ MESA-01 ─────────────────┐  [⏱️ 5 min atrás]   │   │
│  │  │ 🍖 2x Bife Grelhado       │  [ASSUMIR]          │   │
│  │  │ 🍟 1x Batata Frita        │                      │   │
│  │  │ 📝 Mal passado            │                      │   │
│  │  └───────────────────────────┘                      │   │
│  │                                                       │   │
│  │  ┌─ MESA-05 ─────────────────┐  [⏱️ 2 min atrás]   │   │
│  │  │ 🍕 1x Pizza Margherita     │  [ASSUMIR]          │   │
│  │  │ 🥗 1x Salada Caesar        │                      │   │
│  │  └───────────────────────────┘                      │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ EM PREPARAÇÃO (2) ──────────────────────────────────┐   │
│  │                                                       │   │
│  │  ┌─ MESA-03 ─────────────────┐  [⏱️ 15/20 min] 🔥  │   │
│  │  │ 🍝 1x Spaghetti Carbonara  │  [MARCAR PRONTO]   │   │
│  │  │ 🥩 1x Bife Ancho          │                      │   │
│  │  └───────────────────────────┘                      │   │
│  │                                                       │   │
│  │  ┌─ MESA-07 ─────────────────┐  [⏱️ 25/20 min] ⚠️   │   │
│  │  │ 🐟 2x Salmão Grelhado      │  [MARCAR PRONTO]   │   │
│  │  └───────────────────────────┘  ⚠️ ATRASADO!       │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ PRONTOS PARA ENTREGA (1) ───────────────────────────┐   │
│  │                                                       │   │
│  │  ┌─ MESA-09 ─────────────────┐  [✅ Pronto há 3min] │   │
│  │  │ 🍗 2x Frango Assado        │                      │   │
│  │  └───────────────────────────┘                      │   │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Componentes Principais

#### 1. Card de Pedido Pendente
```jsx
<div className="pedido-card pendente">
  <div className="header">
    <span className="mesa">MESA-01</span>
    <span className="tempo">⏱️ 5 min atrás</span>
  </div>
  
  <div className="itens">
    <div className="item">
      <span className="emoji">🍖</span>
      <span className="quantidade">2x</span>
      <span className="nome">Bife Grelhado</span>
    </div>
    <div className="item">
      <span className="emoji">🍟</span>
      <span className="quantidade">1x</span>
      <span className="nome">Batata Frita</span>
    </div>
  </div>
  
  <div className="observacoes">
    📝 Mal passado
  </div>
  
  <button 
    className="btn-assumir"
    onClick={() => assumirPedido(pedido.id)}
  >
    ASSUMIR PEDIDO
  </button>
</div>
```

#### 2. Card de Pedido em Preparação
```jsx
<div className="pedido-card em-preparacao">
  <div className="header">
    <span className="mesa">MESA-03</span>
    <span className={`tempo ${pedido.atraso ? 'atrasado' : ''}`}>
      ⏱️ {pedido.minutosDesdeInicio}/{pedido.tempoEstimadoMinutos} min
      {pedido.atraso && ' ⚠️'}
    </span>
  </div>
  
  <div className="itens">
    {/* Lista de itens */}
  </div>
  
  <button 
    className="btn-pronto"
    onClick={() => marcarComoPronto(pedido.id)}
  >
    ✅ MARCAR COMO PRONTO
  </button>
</div>
```

### Feedback Visual

**Cores sugeridas:**
- 🟦 Azul: Pedido PENDENTE
- 🟧 Laranja: EM_PREPARACAO (normal)
- 🟥 Vermelho: EM_PREPARACAO (atrasado)
- 🟩 Verde: PRONTO

**Sons:**
- 🔔 Notificação sonora ao receber novo pedido
- ✅ Som de confirmação ao assumir/marcar pronto
- ⚠️ Alerta para pedidos atrasados

---

## ⚠️ TRATAMENTO DE ERROS

### Erros Comuns

#### 401 Unauthorized
```json
{
  "timestamp": "2026-02-24T14:30:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Token inválido ou expirado"
}
```
**Solução:** Renovar token ou fazer logout

#### 403 Forbidden
```json
{
  "error": "Acesso negado. Role COZINHA necessária."
}
```
**Solução:** Verificar role do usuário

#### 400 Bad Request - Transição Inválida
```json
{
  "error": "Transição inválida: SubPedido já está EM_PREPARACAO"
}
```
**Solução:** Recarregar estado do pedido

#### 404 Not Found
```json
{
  "error": "SubPedido não encontrado"
}
```
**Solução:** Pedido foi cancelado ou removido

### Tratamento Global de Erros

```javascript
async function handleApiError(response) {
  if (!response.ok) {
    const data = await response.json();
    
    switch (response.status) {
      case 401:
        // Tentar renovar token
        await renovarToken();
        break;
        
      case 403:
        alert('Você não tem permissão para esta ação');
        break;
        
      case 400:
        alert(data.error || 'Dados inválidos');
        break;
        
      case 404:
        alert('Recurso não encontrado');
        // Recarregar lista
        await buscarPedidosAtivos();
        break;
        
      case 500:
        alert('Erro no servidor. Tente novamente.');
        break;
        
      default:
        alert('Erro desconhecido');
    }
    
    throw new Error(data.error || 'Erro na requisição');
  }
}
```

---

## 📱 EXEMPLOS COMPLETOS

### Aplicação React Completa

```jsx
import React, { useState, useEffect } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

function CozinhaApp() {
  const [pedidos, setPedidos] = useState({
    pendentes: [],
    emPreparacao: [],
    prontos: []
  });
  const [usuario, setUsuario] = useState(null);
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    // Carregar usuário do localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    setUsuario(user);

    if (user) {
      carregarPedidos();
      conectarWebSocket(user.unidadeAtendimentoId);
    }
  }, []);

  async function carregarPedidos() {
    try {
      const token = localStorage.getItem('token');
      const cozinhaId = 1; // Obter do usuário

      const response = await fetch(
        `http://localhost:8080/api/subpedidos/cozinha/${cozinhaId}/ativos`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Erro ao carregar pedidos');

      const data = await response.json();
      const pedidos = data.data;

      setPedidos({
        pendentes: pedidos.filter(p => p.status === 'PENDENTE'),
        emPreparacao: pedidos.filter(p => p.status === 'EM_PREPARACAO'),
        prontos: []
      });
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    }
  }

  function conectarWebSocket(cozinhaId) {
    const socket = new SockJS('http://localhost:8080/ws');
    const stompClient = Stomp.over(socket);
    const token = localStorage.getItem('token');

    stompClient.connect(
      { Authorization: `Bearer ${token}` },
      () => {
        console.log('✅ Conectado ao WebSocket');
        setConectado(true);

        stompClient.subscribe(
          `/topic/cozinha/${cozinhaId}/novos-pedidos`,
          (message) => {
            const novoPedido = JSON.parse(message.body);
            setPedidos(prev => ({
              ...prev,
              pendentes: [...prev.pendentes, novoPedido]
            }));
            tocarSomNotificacao();
          }
        );
      }
    );
  }

  async function assumirPedido(id) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8080/api/subpedidos/${id}/assumir`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Erro ao assumir pedido');

      const data = await response.json();
      const pedidoAtualizado = data.data;

      // Mover de pendentes para em preparação
      setPedidos(prev => ({
        pendentes: prev.pendentes.filter(p => p.id !== id),
        emPreparacao: [...prev.emPreparacao, pedidoAtualizado],
        prontos: prev.prontos
      }));
    } catch (error) {
      alert('Erro ao assumir pedido: ' + error.message);
    }
  }

  async function marcarComoPronto(id) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8080/api/subpedidos/${id}/marcar-pronto`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Erro ao marcar como pronto');

      const data = await response.json();
      const pedidoAtualizado = data.data;

      // Mover de em preparação para prontos
      setPedidos(prev => ({
        pendentes: prev.pendentes,
        emPreparacao: prev.emPreparacao.filter(p => p.id !== id),
        prontos: [...prev.prontos, pedidoAtualizado]
      }));
    } catch (error) {
      alert('Erro ao marcar como pronto: ' + error.message);
    }
  }

  function tocarSomNotificacao() {
    const audio = new Audio('/notificacao.mp3');
    audio.play();
  }

  return (
    <div className="cozinha-app">
      <header>
        <h1>🍳 Cozinha Principal</h1>
        <div className="user-info">
          {usuario?.nome}
          <span className={conectado ? 'status online' : 'status offline'}>
            {conectado ? '🟢 Online' : '🔴 Offline'}
          </span>
          <button onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}>
            Logout
          </button>
        </div>
      </header>

      <main>
        <section className="pedidos-section">
          <h2>📥 Pedidos Pendentes ({pedidos.pendentes.length})</h2>
          <div className="pedidos-grid">
            {pedidos.pendentes.map(pedido => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                onAssumirClick={() => assumirPedido(pedido.id)}
              />
            ))}
          </div>
        </section>

        <section className="pedidos-section">
          <h2>🔥 Em Preparação ({pedidos.emPreparacao.length})</h2>
          <div className="pedidos-grid">
            {pedidos.emPreparacao.map(pedido => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                onProntoClick={() => marcarComoPronto(pedido.id)}
              />
            ))}
          </div>
        </section>

        <section className="pedidos-section">
          <h2>✅ Prontos ({pedidos.prontos.length})</h2>
          <div className="pedidos-grid">
            {pedidos.prontos.map(pedido => (
              <PedidoCard key={pedido.id} pedido={pedido} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function PedidoCard({ pedido, onAssumirClick, onProntoClick }) {
  const statusClass = pedido.status.toLowerCase().replace('_', '-');
  const atrasado = pedido.atraso;

  return (
    <div className={`pedido-card ${statusClass} ${atrasado ? 'atrasado' : ''}`}>
      <div className="header">
        <span className="mesa">{pedido.mesaCodigo}</span>
        {pedido.status === 'EM_PREPARACAO' && (
          <span className="tempo">
            ⏱️ {pedido.minutosDesdeInicio}/{pedido.tempoEstimadoMinutos} min
            {atrasado && ' ⚠️'}
          </span>
        )}
      </div>

      <div className="itens">
        {pedido.itens.map(item => (
          <div key={item.id} className="item">
            <span className="quantidade">{item.quantidade}x</span>
            <span className="nome">{item.produtoNome}</span>
            {item.observacao && (
              <span className="obs">📝 {item.observacao}</span>
            )}
          </div>
        ))}
      </div>

      {pedido.observacoes && (
        <div className="observacoes">
          📋 {pedido.observacoes}
        </div>
      )}

      {pedido.status === 'PENDENTE' && onAssumirClick && (
        <button className="btn-assumir" onClick={onAssumirClick}>
          ASSUMIR PEDIDO
        </button>
      )}

      {pedido.status === 'EM_PREPARACAO' && onProntoClick && (
        <button className="btn-pronto" onClick={onProntoClick}>
          ✅ MARCAR COMO PRONTO
        </button>
      )}

      {pedido.status === 'PRONTO' && (
        <div className="status-pronto">
          ✅ Aguardando entrega
        </div>
      )}
    </div>
  );
}

export default CozinhaApp;
```

### CSS Sugerido

```css
.cozinha-app {
  font-family: Arial, sans-serif;
  background: #f5f5f5;
  min-height: 100vh;
}

header {
  background: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status {
  font-size: 0.8rem;
}

.status.online { color: #2ecc71; }
.status.offline { color: #e74c3c; }

.pedidos-section {
  padding: 2rem;
}

.pedidos-section h2 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.pedidos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.pedido-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border-left: 4px solid;
}

.pedido-card.pendente {
  border-color: #3498db;
}

.pedido-card.em-preparacao {
  border-color: #f39c12;
}

.pedido-card.em-preparacao.atrasado {
  border-color: #e74c3c;
  animation: pulse 2s infinite;
}

.pedido-card.pronto {
  border-color: #2ecc71;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.pedido-card .header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  font-weight: bold;
}

.pedido-card .mesa {
  font-size: 1.2rem;
  color: #2c3e50;
}

.pedido-card .tempo {
  font-size: 0.9rem;
  color: #7f8c8d;
}

.pedido-card.atrasado .tempo {
  color: #e74c3c;
}

.pedido-card .itens {
  margin-bottom: 1rem;
}

.pedido-card .item {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #ecf0f1;
}

.pedido-card .item:last-child {
  border-bottom: none;
}

.pedido-card .observacoes {
  background: #f8f9fa;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

button {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 1rem;
  transition: opacity 0.2s;
}

button:hover {
  opacity: 0.8;
}

.btn-assumir {
  background: #3498db;
  color: white;
}

.btn-pronto {
  background: #2ecc71;
  color: white;
}

.status-pronto {
  text-align: center;
  color: #2ecc71;
  font-weight: bold;
  margin-top: 1rem;
}
```

---

## 📚 RESUMO DOS ENDPOINTS

| Endpoint | Método | Descrição | Role Necessária |
|----------|--------|-----------|-----------------|
| `/api/auth/jwt/login` | POST | Login do cozinheiro | - |
| `/api/auth/jwt/refresh` | POST | Renovar token | - |
| `/api/subpedidos/cozinha/{id}/ativos` | GET | Pedidos ativos | COZINHA |
| `/api/subpedidos/{id}/assumir` | PUT | Assumir pedido | COZINHA |
| `/api/subpedidos/{id}/marcar-pronto` | PUT | Marcar pronto | COZINHA |
| `/api/subpedidos/cozinha/{id}/prontos` | GET | Pedidos prontos | COZINHA |
| `/api/subpedidos/atrasados` | GET | Pedidos atrasados | COZINHA |
| `/api/subpedidos/{id}` | GET | Detalhes de um pedido | COZINHA |

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Frontend

- [ ] Tela de login do cozinheiro
- [ ] Persistência do token no localStorage
- [ ] Auto-renovação de token
- [ ] Conexão WebSocket para notificações
- [ ] Lista de pedidos pendentes
- [ ] Lista de pedidos em preparação
- [ ] Lista de pedidos prontos
- [ ] Botão "Assumir Pedido"
- [ ] Botão "Marcar como Pronto"
- [ ] Timer de preparação
- [ ] Indicador visual de atraso
- [ ] Som de notificação para novos pedidos
- [ ] Tratamento de erros
- [ ] Logout

### Testes

- [ ] Login bem-sucedido
- [ ] Login com credenciais inválidas
- [ ] Carregar pedidos ativos
- [ ] Assumir pedido
- [ ] Marcar pedido como pronto
- [ ] Receber notificação de novo pedido via WebSocket
- [ ] Renovação automática de token
- [ ] Logout

---

## 🎓 BOAS PRÁTICAS

1. **Sempre verificar o token antes de fazer requisições**
2. **Implementar retry automático em caso de falha de rede**
3. **Usar WebSocket para atualizações em tempo real**
4. **Dar feedback visual claro ao usuário (loading, sucesso, erro)**
5. **Implementar sons para notificações importantes**
6. **Usar cores para diferenciar estados dos pedidos**
7. **Mostrar timer de preparação em destaque**
8. **Destacar pedidos atrasados visualmente**
9. **Implementar auto-refresh periódico como fallback do WebSocket**
10. **Logar ações importantes para debugging**

---

## 📞 SUPORTE

**Documentação completa:** `/RESPOSTA_QUESTIONARIO_BACKEND.md`  
**Swagger:** http://localhost:8080/swagger-ui.html  
**Porta Backend:** 8080  
**Protocolo WebSocket:** SockJS + STOMP

---

*Última atualização: 24 de Fevereiro de 2026*
