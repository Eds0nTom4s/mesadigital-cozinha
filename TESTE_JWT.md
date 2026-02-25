# 🧪 Como Testar JWT no Navegador

## Opção 1: Console do Navegador

Após fazer login, cole este código no console do navegador (F12):

```javascript
// Buscar token do localStorage
const token = localStorage.getItem('token');
console.log('Token JWT:', token);

// Decodificar token manualmente
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));

console.log('\n🔐 PAYLOAD DO TOKEN JWT:');
console.log('Username:', payload.sub);
console.log('Nome:', payload.nome);
console.log('Roles:', payload.roles);
console.log('Emitido em:', new Date(payload.iat * 1000).toLocaleString());
console.log('Expira em:', new Date(payload.exp * 1000).toLocaleString());
```

## Opção 2: Usar jwt.io

1. Acesse: https://jwt.io/
2. Faça login no sistema
3. Abra o console (F12) e execute: `console.log(localStorage.getItem('token'))`
4. Copie o token
5. Cole no campo "Encoded" no site jwt.io
6. Veja o payload decodificado

## Opção 3: Usando as Funções Utilitárias

No console do navegador, após fazer login:

```javascript
// Importar funções (só funciona se você adicionar no window global)
// Para testar, execute manualmente:

const token = localStorage.getItem('token');
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));

// Verificar roles
console.log('Tem role COZINHA?', payload.roles.includes('ROLE_COZINHA'));
console.log('Tem role GERENTE?', payload.roles.includes('ROLE_GERENTE'));
console.log('Tem role ADMIN?', payload.roles.includes('ROLE_ADMIN'));

// Verificar expiração
const now = Math.floor(Date.now() / 1000);
const expired = payload.exp < now;
console.log('Token expirado?', expired);

if (!expired) {
  const remaining = payload.exp - now;
  const minutes = Math.floor(remaining / 60);
  console.log(`Token válido por mais ${minutes} minutos`);
}
```

## Estrutura Esperada do Token

O backend deve retornar um token JWT com este payload:

```json
{
  "sub": "+244934567890",
  "roles": ["ROLE_COZINHA"],
  "nome": "Paulo Cozinheiro",
  "iat": 1708801571,
  "exp": 1708887971
}
```

Onde:
- `sub`: Username/telefone do usuário
- `roles`: Array de roles (ROLE_COZINHA, ROLE_GERENTE, ROLE_ADMIN, etc)
- `nome`: Nome completo do usuário
- `iat`: Issued At - timestamp de quando foi emitido (segundos)
- `exp`: Expiration - timestamp de quando expira (segundos)

## Testar Diferentes Cenários

### 1. Login com role COZINHA (deve funcionar)
```
Username: 934567890
Password: cozinha123
Esperado: Acesso permitido à interface da cozinha
```

### 2. Login com role diferente (deve negar)
```
Username: (outro usuário sem ROLE_COZINHA)
Esperado: Redirecionar para /acesso-negado
```

### 3. Token expirado
```
1. Fazer login
2. Esperar o token expirar
3. Tentar acessar /kitchen
Esperado: Redirecionar para /login
```

## Mensagens de Debug no Console

Após fazer login em modo de desenvolvimento, você verá:

```
🔐 TOKEN JWT DECODIFICADO:
📋 Payload completo: {sub: '+244934567890', roles: Array(1), nome: 'Paulo Cozinheiro', iat: 1708801571, exp: 1708887971}
👤 Usuário: +244934567890
✅ Nome: Paulo Cozinheiro
🎭 Roles: ['ROLE_COZINHA']
⏰ Expira em: 25/02/2026, 19:46:11
```

## Verificar Problemas Comuns

### Problema: "Token JWT inválido: formato incorreto"
- Verifique se o token tem 3 partes separadas por `.`
- Execute: `console.log(localStorage.getItem('token').split('.').length)` deve retornar `3`

### Problema: "Payload do JWT inválido ou sem roles"
- Verifique se o backend está enviando as roles no token
- Use jwt.io para decodificar e confirmar que `roles` existe no payload

### Problema: "Acesso negado" mesmo com ROLE_COZINHA
- Verifique o nome da role: deve ser `ROLE_COZINHA` (com prefixo `ROLE_`)
- Execute no console: `JSON.parse(localStorage.getItem('user')).roles`

### Problema: Token expira muito rápido
- Verifique a configuração de expiração no backend
- O token deve ter validade de pelo menos 1 hora (3600 segundos)
