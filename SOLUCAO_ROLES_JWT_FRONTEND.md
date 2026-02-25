# 🔐 SOLUÇÃO: Verificação de Roles JWT no Frontend

**Data:** 24 de Fevereiro de 2026  
**Problema:** Frontend não reconhece role `ROLE_COZINHA` no token JWT

---

## 🔴 PROBLEMA IDENTIFICADO

**Backend (✅ FUNCIONANDO):**
```
19:46:11.568 INFO - ✅ LOGIN JWT CONCLUÍDO COM SUCESSO
║ Username autenticado: '+244934567890'
║ Roles: [ROLE_COZINHA]
║ Token type: Bearer
```

**Frontend (❌ ERRO):**
```
Acesso Negado
Usuário sem permissão de acesso à cozinha
```

---

## 🧩 CAUSA RAIZ

O frontend está recebendo o token JWT, mas **não está decodificando corretamente** ou **não está extraindo as roles** do payload do token.

---

## ✅ SOLUÇÃO COMPLETA

### 1️⃣ Decodificar o Token JWT

O token JWT contém 3 partes separadas por `.`:
```
header.payload.signature
```

O **payload** é um JSON Base64 codificado que contém as roles:

```json
{
  "sub": "+244934567890",
  "roles": ["ROLE_COZINHA"],
  "nome": "Paulo Cozinheiro",
  "iat": 1708801571,
  "exp": 1708887971
}
```

### 2️⃣ Código TypeScript/JavaScript para Decodificar

```typescript
// utils/jwt.ts

interface JwtPayload {
  sub: string;          // username/telefone
  roles: string[];      // ["ROLE_COZINHA", "ROLE_GERENTE", etc]
  nome: string;
  iat: number;          // issued at (timestamp)
  exp: number;          // expiration (timestamp)
}

/**
 * Decodifica o payload do token JWT
 * NÃO valida assinatura (validação é feita no backend)
 */
export function decodeJWT(token: string): JwtPayload | null {
  try {
    // Token tem formato: header.payload.signature
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      console.error('Token JWT inválido: formato incorreto');
      return null;
    }
    
    // Pega apenas o payload (parte do meio)
    const payload = parts[1];
    
    // Decodifica Base64
    const decoded = atob(payload);
    
    // Parse JSON
    const parsed = JSON.parse(decoded);
    
    return parsed as JwtPayload;
  } catch (error) {
    console.error('Erro ao decodificar token JWT:', error);
    return null;
  }
}

/**
 * Extrai as roles do token JWT armazenado no localStorage
 */
export function getRolesFromToken(): string[] {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.warn('Token não encontrado no localStorage');
    return [];
  }
  
  const payload = decodeJWT(token);
  
  if (!payload || !payload.roles) {
    console.error('Payload do JWT inválido ou sem roles');
    return [];
  }
  
  return payload.roles;
}

/**
 * Verifica se o usuário possui uma role específica
 */
export function hasRole(role: string): boolean {
  const roles = getRolesFromToken();
  
  // Normaliza: aceita "COZINHA" ou "ROLE_COZINHA"
  const normalizedRole = role.startsWith('ROLE_') ? role : `ROLE_${role}`;
  
  return roles.includes(normalizedRole);
}

/**
 * Verifica se o usuário possui qualquer uma das roles
 */
export function hasAnyRole(requiredRoles: string[]): boolean {
  const userRoles = getRolesFromToken();
  
  return requiredRoles.some(role => {
    const normalizedRole = role.startsWith('ROLE_') ? role : `ROLE_${role}`;
    return userRoles.includes(normalizedRole);
  });
}

/**
 * Verifica se o token está expirado
 */
export function isTokenExpired(): boolean {
  const token = localStorage.getItem('token');
  
  if (!token) return true;
  
  const payload = decodeJWT(token);
  
  if (!payload || !payload.exp) return true;
  
  // exp está em segundos, Date.now() está em milissegundos
  const now = Math.floor(Date.now() / 1000);
  
  return payload.exp < now;
}

/**
 * Obtém nome do usuário logado
 */
export function getUserName(): string | null {
  const token = localStorage.getItem('token');
  
  if (!token) return null;
  
  const payload = decodeJWT(token);
  
  return payload?.nome || null;
}
```

---

### 3️⃣ Proteção de Rotas no React Router

```typescript
// components/ProtectedRoute.tsx

import { Navigate } from 'react-router-dom';
import { hasAnyRole } from '../utils/jwt';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles: string[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRoles, 
  redirectTo = '/acesso-negado' 
}: ProtectedRouteProps) {
  
  // Verifica se usuário tem alguma das roles necessárias
  const hasAccess = hasAnyRole(requiredRoles);
  
  if (!hasAccess) {
    console.warn('Acesso negado. Roles necessárias:', requiredRoles);
    console.warn('Roles do usuário:', getRolesFromToken());
    return <Navigate to={redirectTo} replace />;
  }
  
  return <>{children}</>;
}
```

**Uso nas rotas:**

```typescript
// App.tsx ou routes.tsx

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import CozinhaPage from './pages/CozinhaPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Rota protegida para COZINHA */}
        <Route 
          path="/cozinha" 
          element={
            <ProtectedRoute requiredRoles={['ROLE_COZINHA', 'ROLE_GERENTE', 'ROLE_ADMIN']}>
              <CozinhaPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Rota protegida para ATENDENTE */}
        <Route 
          path="/atendimento" 
          element={
            <ProtectedRoute requiredRoles={['ROLE_ATENDENTE', 'ROLE_GERENTE', 'ROLE_ADMIN']}>
              <AtendimentoPage />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/acesso-negado" element={<AcessoNegadoPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

### 4️⃣ Componente de Acesso Negado

```typescript
// pages/AcessoNegadoPage.tsx

import { useNavigate } from 'react-router-dom';
import { getRolesFromToken } from '../utils/jwt';

export default function AcessoNegadoPage() {
  const navigate = useNavigate();
  const userRoles = getRolesFromToken();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            Acesso Negado
          </h1>
          <p className="text-gray-600 mb-4">
            Você não tem permissão para acessar esta página.
          </p>
          
          {/* DEBUG: Mostrar roles do usuário */}
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Suas Permissões:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {userRoles.length > 0 ? (
                userRoles.map(role => (
                  <span 
                    key={role} 
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                  >
                    {role.replace('ROLE_', '')}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 text-sm">
                  Nenhuma permissão encontrada
                </span>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Voltar
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Fazer Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 5️⃣ Armazenar Token no Login

```typescript
// services/authService.ts

interface LoginResponse {
  message: string;
  data: {
    token: string;
    refreshToken?: string;
    expiresIn: number;
    user: {
      id: number;
      username: string;
      nome: string;
      roles: string[];
    };
  };
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch('http://localhost:8080/api/auth/jwt/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  
  if (!response.ok) {
    throw new Error('Falha no login');
  }
  
  const result = await response.json();
  
  // ✅ ARMAZENAR TOKEN NO LOCALSTORAGE
  localStorage.setItem('token', result.data.token);
  
  if (result.data.refreshToken) {
    localStorage.setItem('refreshToken', result.data.refreshToken);
  }
  
  // ✅ ARMAZENAR DADOS DO USUÁRIO (opcional, mas recomendado)
  localStorage.setItem('user', JSON.stringify(result.data.user));
  
  console.log('✅ Login bem-sucedido');
  console.log('Roles:', result.data.user.roles);
  
  return result;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}
```

---

### 6️⃣ Usar Token nas Requisições API

```typescript
// services/api.ts

import { isTokenExpired } from '../utils/jwt';

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Token não encontrado. Faça login novamente.');
  }
  
  if (isTokenExpired()) {
    // Redirecionar para login ou tentar refresh token
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Token expirado');
  }
  
  // ✅ ADICIONAR AUTHORIZATION HEADER
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // Tratar 401 Unauthorized
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Não autorizado');
  }
  
  return response;
}

// Exemplo de uso:
export async function buscarSubPedidosPendentes(cozinhaId: number) {
  const response = await fetchWithAuth(
    `http://localhost:8080/api/subpedidos/cozinha/${cozinhaId}/pendentes`
  );
  
  if (!response.ok) {
    throw new Error('Erro ao buscar subpedidos');
  }
  
  return response.json();
}
```

---

## 🔍 DEBUGGING

### Como verificar se o token está correto:

1. **Console do navegador:**
```javascript
// Colar no console:
const token = localStorage.getItem('token');
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));
console.log('Payload do JWT:', payload);
console.log('Roles:', payload.roles);
```

2. **Usar jwt.io:**
- Acesse: https://jwt.io/
- Cole o token no campo "Encoded"
- Verifique o payload decodificado

3. **Verificar no Network tab:**
- Abrir DevTools → Network
- Fazer login
- Verificar response do endpoint `/api/auth/jwt/login`
- Confirmar que `roles: ["ROLE_COZINHA"]` está presente

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Implementar função `decodeJWT()` em `utils/jwt.ts`
- [ ] Implementar função `hasRole()` e `hasAnyRole()`
- [ ] Criar componente `ProtectedRoute`
- [ ] Armazenar token no `localStorage` após login
- [ ] Adicionar `Authorization: Bearer {token}` em todas requisições
- [ ] Proteger rota `/cozinha` com `ProtectedRoute`
- [ ] Criar página de acesso negado
- [ ] Testar com console.log para debugar roles

---

## 🎯 RESULTADO ESPERADO

Após implementar essas correções:

1. ✅ Usuário faz login com telefone da cozinha
2. ✅ Token JWT é armazenado no localStorage
3. ✅ Função `hasRole('ROLE_COZINHA')` retorna `true`
4. ✅ `ProtectedRoute` permite acesso à página `/cozinha`
5. ✅ Requisições à API incluem `Authorization: Bearer {token}`

---

## 📞 SUPORTE

Se o problema persistir, verificar:

1. Token está sendo armazenado? → `console.log(localStorage.getItem('token'))`
2. Roles estão no payload? → Usar jwt.io para decodificar
3. Função `hasRole()` está sendo chamada? → Adicionar `console.log`
4. Nome da role está correto? → `ROLE_COZINHA` (não `COZINHA`)

---

**Documentação completa criada em 24 de Fevereiro de 2026**
