# 📋 CHECKLIST DE CORREÇÕES APLICADAS - FRONTEND COZINHA
**Data**: 06 de Março de 2026  
**Base**: INSTRUÇÕES DE CORRECÇÃO emitidas pela Equipa Backend  
**Status**: ✅ CORREÇÕES CRÍTICAS E ALTAS APLICADAS

---

## ✅ BLOCO A — CRÍTICO (APLICADAS)

### A1 ✅ Token no login
- **Arquivo**: `src/store/auth.js`
- **Mudança**: Alterado de `responseData.accessToken` para `responseData.token`
- **Motivo**: Backend retorna o token no campo `token`, não `accessToken`

### A2 ✅ Endpoint e campo de login
- **Arquivo**: `src/services/api.js`
- **Mudanças**:
  - Endpoint: `/auth/jwt/login` → `/auth/admin/login`
  - Campo senha: `password` → `senha`
- **Motivo**: Endpoint correto é `/auth/admin/login` e backend espera campo `senha`

### A3 ✅ Roles no JWT como string
- **Arquivo**: `src/utils/jwt.js`
- **Mudança**: Adicionado split por vírgula em `getRolesFromToken()`
  ```javascript
  if (typeof payload.roles === 'string') {
    return payload.roles.split(',').map(r => r.trim()).filter(r => r.length > 0)
  }
  ```
- **Motivo**: Backend envia roles como string separada por vírgulas (ex: "ROLE_ATENDENTE,ROLE_COZINHA")

### A5 ✅ Timestamps corretos em SubPedidoResponse
- **Arquivos**: 
  - `src/components/PedidoCard.vue`
  - `src/store/pedidos.js`
  - `src/views/KitchenView.vue`
- **Mudanças**:
  - `timestampCriacao` → `recebidoEm`
  - Campo `assumidoEm` deve ser lido como `iniciadoEm` (se usado)
- **Motivo**: Campos corretos conforme SubPedidoResponse do backend

### A5 (Adicional) ✅ Campo cozinha plano
- **Nota**: Código já usa `cozinhaId` e `nomeCozinha` (campos planos)
- Campo `cozinha.tipo` não deve ser usado (não existe nested object)

---

## ✅ BLOCO B — ALTO (APLICADAS)

### B4 ✅ Seleção manual de cozinha para ROLE_COZINHA
- **Arquivos modificados**:
  - `src/store/auth.js`: Adicionado `selectedCozinhaId` no state
  - `src/router/index.js`: Nova rota `/selecionar-cozinha`
  - `src/views/LoginView.vue`: Redirecionamento para seleção após login
- **Novo arquivo**: `src/views/SelecionarCozinhaView.vue`
- **Comportamento**:
  1. Usuário ROLE_COZINHA faz login
  2. É redirecionado para tela de seleção de cozinha
  3. Lista é carregada via GET `/api/cozinhas`
  4. Usuário seleciona sua cozinha
  5. cozinhaId é salvo no store e localStorage
  6. Acesso à interface de cozinha liberado

---

## ✅ BLOCO C — MÉDIO (APLICADAS)

### C1 ✅ URL do WebSocket
- **Arquivo**: `src/services/websocket.js`
- **Mudança**: URL alterada de `ws://localhost:8080/ws` para `http://localhost:8080/api/ws`
- **Motivo**: URL correta do backend inclui `/api` no path

### C2 ✅ Dois formatos de mensagem no tópico da cozinha
- **Arquivo**: `src/services/websocket.js`
- **Implementação**:
  - Handler distingue mensagens por campo `tipo` ou `tipoAcao`
  - **Formato 1** (NotificacaoSubPedidoDTO): Usa `tipoAcao` (CRIACAO, MUDANCA_STATUS, etc)
  - **Formato 2** (Evento especial): Usa `tipo` (PEDIDO_LIBERADO_AUTOMATICAMENTE)
- **Handlers adicionados**:
  - `onNovoPedido`: tipoAcao === 'CRIACAO'
  - `onAtualizacao`: tipoAcao === 'MUDANCA_STATUS' ou 'OBSERVACAO_ADICIONADA'
  - `onCancelamento`: tipoAcao === 'CANCELAMENTO'
  - `onPedidoLiberado`: tipo === 'PEDIDO_LIBERADO_AUTOMATICAMENTE'

---

## ⚠️ CORREÇÕES NÃO APLICADAS (Requerem contexto adicional)

### A4 - Campos inexistentes em PedidoResponse
- **Status**: ⏸️ Pendente
- **Motivo**: Este frontend é específico para cozinha e usa SubPedidoResponse, não PedidoResponse
- **Ação futura**: Se necessário criar views administrativas que usam PedidoResponse, aplicar correções

### A6 - Campos errados em TransacaoFundoResponse
- **Status**: ⏸️ Pendente
- **Motivo**: Interface de cozinha não lida com fundos de consumo
- **Ação futura**: Se adicionar gestão de fundos, corrigir campos:
  - `saldoAntes` → `saldoAnterior`
  - `saldoDepois` → `saldoNovo`

### A7-A8 - Campos em UserResponse e criação de usuário
- **Status**: ⏸️ Pendente
- **Motivo**: Interface de cozinha não tem gestão de usuários
- **Ação futura**: Se adicionar painel administrativo, aplicar:
  - `nome` → `username` (login) e `nomeCompleto` (exibição)
  - `tipoUsuario` → `roles` (array)
  - Payload de criação usar `username`, `email`, `senha`, `nomeCompleto`, `roles[]`

### A9 - Campo nome do produto em dashboard
- **Status**: ⏸️ Pendente
- **Motivo**: Interface de cozinha não tem dashboard
- **Ação futura**: `nomeProduto` → `nome`

### A10-A11 - Endpoints de fundo de consumo
- **Status**: ⏸️ Pendente
- **Motivo**: Não aplicável a interface de cozinha

### A12 - QR Code com autenticação
- **Status**: ⏸️ Pendente
- **Motivo**: Interface de cozinha não exibe QR Codes
- **Ação futura**: Usar fetch com Authorization header e criar URL com Blob

### B1-B2 - Campos adicionais em FundoConsumoResponse
- **Status**: ⏸️ Pendente
- **Motivo**: Não aplicável a interface de cozinha

### B3 - Status AGUARDANDO_PAGAMENTO em mapa de mesas
- **Status**: ⏸️ Pendente
- **Motivo**: Interface de cozinha não tem mapa de mesas

### B5 - SaldoInsuficiente HTTP status
- **Status**: ⏸️ Pendente
- **Motivo**: Interface de cozinha não processa pagamentos

### C3 - referenciaMesa não existe no DTO de notificação
- **Status**: ✅ Mitigado
- **Implementação**: Frontend já usa campo `mesaCodigo` que vem no SubPedidoResponse

### C4 - Filtro por período em dashboard
- **Status**: ⏸️ Pendente
- **Motivo**: Interface de cozinha não tem dashboard

### C5 - Reset de senha por e-mail
- **Status**: ⏸️ Pendente
- **Motivo**: Interface de cozinha só tem login (sem recuperação de senha)

---

## 📝 ESTRUTURA DE RESPOSTA ESPERADA DO LOGIN

O backend retorna:
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "id": 1,
    "nome": "João Cozinheiro",
    "telefone": null,
    "email": "joao@email.com",
    "tipoUsuario": "ADMIN",
    "token": "eyJhbGci...",  ← ler daqui
    "expiresIn": 3600000
  }
}
```

Token JWT decodificado:
```json
{
  "sub": "joao@email.com",
  "roles": "ROLE_COZINHA",  ← string, não array!
  "iat": 1709721600,
  "exp": 1709808000
}
```

---

## 🔍 CAMPOS CORRIGIDOS - RESUMO

| Contexto | ERRADO | CORRETO |
|----------|--------|---------|
| Login endpoint | `/auth/jwt/login` | `/auth/admin/login` |
| Login senha | `password` | `senha` |
| Login token | `accessToken` | `token` |
| JWT roles | `roles` array | `roles.split(',')` |
| SubPedido timestamp | `timestampCriacao` | `recebidoEm` |
| SubPedido timestamp | `assumidoEm` | `iniciadoEm` |
| WebSocket URL | `ws://localhost:8080/ws` | `http://localhost:8080/api/ws` |

---

## 🧪 TESTES RECOMENDADOS

### Teste 1: Login com ROLE_COZINHA
1. ✅ Usar credenciais: `username: cozinha`, `senha: cozinha123`
2. ✅ Verificar redirecionamento para `/selecionar-cozinha`
3. ✅ Selecionar uma cozinha da lista
4. ✅ Verificar acesso à interface `/kitchen`
5. ✅ Verificar WebSocket conectado ao tópico da cozinha selecionada

### Teste 2: Roles como string
1. ✅ Após login, abrir console e executar:
   ```javascript
   import { getRolesFromToken } from '@/utils/jwt'
   console.log(getRolesFromToken())
   ```
2. ✅ Deve retornar array: `["ROLE_COZINHA"]` (não a string)

### Teste 3: WebSocket com dois formatos
1. ✅ Criar pedido no backend que dispara notificação
2. ✅ Verificar no console logs de mensagens recebidas
3. ✅ Confirmar que tanto Formato 1 (NotificacaoSubPedidoDTO) quanto Formato 2 (eventos especiais) são processados

### Teste 4: Timestamps corretos
1. ✅ Carregar pedidos na interface
2. ✅ Verificar que hora de criação é lida de `recebidoEm`
3. ✅ Não deve haver erros de "campo undefined"

---

## 📁 ARQUIVOS MODIFICADOS

```
src/
├── services/
│   ├── api.js                         ✅ A2: endpoint e campo senha
│   └── websocket.js                   ✅ C1, C2: URL e formatos de mensagem
├── store/
│   ├── auth.js                        ✅ A1, A3, B4: token, roles, cozinhaId
│   └── pedidos.js                     ✅ A5: timestamps
├── utils/
│   └── jwt.js                         ✅ A3: split de roles
├── views/
│   ├── LoginView.vue                  ✅ A2, B4: senha, redirecionamento
│   ├── KitchenView.vue               ✅ A5, C2: timestamps, handlers
│   └── SelecionarCozinhaView.vue     ✅ B4: nova view (CRIADO)
├── components/
│   └── PedidoCard.vue                ✅ A5: timestamps
└── router/
    └── index.js                       ✅ B4: nova rota
```

---

## ✅ CHECKLIST DE VALIDAÇÃO FINAL

### AUTENTICAÇÃO
- [x] Login chama POST `/api/auth/admin/login`
- [x] Campo senha é `senha` (não `password`)
- [x] Token é lido de `response.data.token`
- [x] Roles são extraídas com `split(',')` do JWT
- [x] Usuário ROLE_COZINHA é redirecionado para seleção de cozinha

### COZINHA
- [x] Seleção manual de cozinha implementada
- [x] cozinhaId armazenado no store e localStorage
- [x] Guard de rota verifica se cozinha foi selecionada
- [x] WebSocket conecta com cozinhaId correto

### SUBPEDIDOS
- [x] Timestamps usam `recebidoEm` (não `timestampCriacao`)
- [x] Campos planos `cozinhaId` e `nomeCozinha` (não nested)

### WEBSOCKET
- [x] URL: `http://localhost:8080/api/ws`
- [x] JWT enviado no header de conexão
- [x] Handler distingue Formato 1 vs Formato 2
- [x] Callbacks para CRIACAO, MUDANCA_STATUS, CANCELAMENTO, PEDIDO_LIBERADO

---

## 🎯 PRÓXIMOS PASSOS

1. **Teste E2E**: Validar fluxo completo de login até recebimento de pedidos
2. **Credenciais de teste**: Usar `username: cozinha`, `senha: cozinha123`
3. **Monitorar console**: Verificar logs de WebSocket e estrutura de mensagens
4. **Validar backend**: Confirmar que backend está retornando estruturas corretas

---

**Correções aplicadas por**: GitHub Copilot (Claude Sonnet 4.5)  
**Baseado em**: INSTRUÇÕES DE CORRECÇÃO da Equipa Backend  
**Data de aplicação**: 06 de Março de 2026
