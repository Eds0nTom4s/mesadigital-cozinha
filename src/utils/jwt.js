/**
 * Utilitários para decodificar e trabalhar com JWT tokens
 */

/**
 * Decodifica o payload do token JWT
 * NÃO valida assinatura (validação é feita no backend)
 * 
 * @param {string} token - Token JWT
 * @returns {Object|null} Payload decodificado ou null se inválido
 */
export function decodeJWT(token) {
  try {
    if (!token) {
      console.warn('Token JWT não fornecido')
      return null
    }

    // Token tem formato: header.payload.signature
    const parts = token.split('.')
    
    if (parts.length !== 3) {
      console.error('Token JWT inválido: formato incorreto')
      return null
    }
    
    // Pega apenas o payload (parte do meio)
    const payload = parts[1]
    
    // Decodifica Base64
    const decoded = atob(payload)
    
    // Parse JSON
    const parsed = JSON.parse(decoded)
    
    return parsed
  } catch (error) {
    console.error('Erro ao decodificar token JWT:', error)
    return null
  }
}

/**
 * Extrai as roles do token JWT armazenado no localStorage
 * 
 * @returns {string[]} Array de roles ou array vazio
 */
export function getRolesFromToken() {
  const token = localStorage.getItem('token')
  
  if (!token) {
    console.warn('Token não encontrado no localStorage')
    return []
  }
  
  const payload = decodeJWT(token)
  
  if (!payload || !payload.roles) {
    console.error('Payload do JWT inválido ou sem roles')
    return []
  }
  
  return payload.roles
}

/**
 * Verifica se o usuário possui uma role específica
 * 
 * @param {string} role - Nome da role (aceita "COZINHA" ou "ROLE_COZINHA")
 * @returns {boolean}
 */
export function hasRole(role) {
  const roles = getRolesFromToken()
  
  // Normaliza: aceita "COZINHA" ou "ROLE_COZINHA"
  const normalizedRole = role.startsWith('ROLE_') ? role : `ROLE_${role}`
  
  return roles.includes(normalizedRole)
}

/**
 * Verifica se o usuário possui qualquer uma das roles
 * 
 * @param {string[]} requiredRoles - Array de roles necessárias
 * @returns {boolean}
 */
export function hasAnyRole(requiredRoles) {
  const userRoles = getRolesFromToken()
  
  return requiredRoles.some(role => {
    const normalizedRole = role.startsWith('ROLE_') ? role : `ROLE_${role}`
    return userRoles.includes(normalizedRole)
  })
}

/**
 * Verifica se o usuário possui todas as roles
 * 
 * @param {string[]} requiredRoles - Array de roles necessárias
 * @returns {boolean}
 */
export function hasAllRoles(requiredRoles) {
  const userRoles = getRolesFromToken()
  
  return requiredRoles.every(role => {
    const normalizedRole = role.startsWith('ROLE_') ? role : `ROLE_${role}`
    return userRoles.includes(normalizedRole)
  })
}

/**
 * Verifica se o token está expirado
 * 
 * @returns {boolean}
 */
export function isTokenExpired() {
  const token = localStorage.getItem('token')
  
  if (!token) return true
  
  const payload = decodeJWT(token)
  
  if (!payload || !payload.exp) return true
  
  // exp está em segundos, Date.now() está em milissegundos
  const now = Math.floor(Date.now() / 1000)
  
  return payload.exp < now
}

/**
 * Obtém o nome do usuário logado do token
 * 
 * @returns {string|null}
 */
export function getUserNameFromToken() {
  const token = localStorage.getItem('token')
  
  if (!token) return null
  
  const payload = decodeJWT(token)
  
  return payload?.nome || null
}

/**
 * Obtém o username (telefone) do usuário logado do token
 * 
 * @returns {string|null}
 */
export function getUsernameFromToken() {
  const token = localStorage.getItem('token')
  
  if (!token) return null
  
  const payload = decodeJWT(token)
  
  return payload?.sub || null
}

/**
 * Obtém todos os dados do payload do token
 * 
 * @returns {Object|null}
 */
export function getTokenPayload() {
  const token = localStorage.getItem('token')
  
  if (!token) return null
  
  return decodeJWT(token)
}

/**
 * Calcula o tempo restante até a expiração do token em segundos
 * 
 * @returns {number} Segundos até expiração ou 0 se expirado
 */
export function getTokenTimeRemaining() {
  const token = localStorage.getItem('token')
  
  if (!token) return 0
  
  const payload = decodeJWT(token)
  
  if (!payload || !payload.exp) return 0
  
  const now = Math.floor(Date.now() / 1000)
  const remaining = payload.exp - now
  
  return Math.max(0, remaining)
}
