import { defineStore } from 'pinia'
import { authAPI } from '@/services/api'
import { 
  getRolesFromToken, 
  hasRole, 
  hasAnyRole,
  getUserNameFromToken,
  isTokenExpired,
  getTokenPayload 
} from '@/utils/jwt'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    isAuthenticated: false
  }),

  getters: {
    // Verificar se o usuário está autenticado
    isLoggedIn: (state) => {
      if (!state.token) return false
      
      // Verificar se o token não está expirado
      if (isTokenExpired()) {
        console.warn('Token JWT expirado')
        return false
      }
      
      return true
    },

    // Obter o nome do usuário (do token JWT)
    userName: (state) => {
      // Tentar pegar do state primeiro, depois do token
      if (state.user?.nome) return state.user.nome
      return getUserNameFromToken() || ''
    },

    // Obter o ID da cozinha do usuário
    cozinhaId: (state) => state.user?.unidadeAtendimentoId || null,

    // Verificar se tem role COZINHA (extraindo do token JWT)
    isCozinha: () => {
      return hasRole('ROLE_COZINHA')
    },

    // Obter todas as roles do usuário (do token JWT)
    userRoles: () => {
      return getRolesFromToken()
    },

    // Verificar se tem qualquer uma das roles especificadas
    hasAnyRole: () => (roles) => {
      return hasAnyRole(roles)
    }
  },

  actions: {
    // Login do cozinheiro
    async login(username, password) {
      try {
        const response = await authAPI.login(username, password)

        // DEBUG: Verificar estrutura da resposta
        if (import.meta.env.DEV) {
          console.log('📦 Resposta do login (completa):', response)
          console.log('� Response.data:', response.data)
          console.log('📦 Response.data.data:', response.data?.data)
          console.log('📦 Conteúdo de response.data.data:', JSON.stringify(response.data?.data, null, 2))
        }

        // O backend retorna: { success, message, data: { accessToken, refreshToken, username, roles, ... } }
        // Precisamos acessar response.data.data
        const responseData = response.data.data || response.data
        
        // O backend retorna accessToken (não token) e dados do usuário soltos
        this.token = responseData.accessToken || responseData.token
        this.refreshToken = responseData.refreshToken
        
        // Criar objeto user a partir dos dados do backend
        this.user = {
          username: responseData.username,
          roles: responseData.roles,
          nome: responseData.nome || responseData.username, // fallback para username se nome não existir
          unidadeAtendimentoId: responseData.unidadeAtendimentoId || responseData.cozinhaId
        }
        
        this.isAuthenticated = true

        if (import.meta.env.DEV) {
          console.log('✅ Token extraído:', this.token?.substring(0, 50) + '...')
          console.log('✅ RefreshToken:', this.refreshToken?.substring(0, 50) + '...')
          console.log('✅ User criado:', this.user)
        }

        // Verificar se o token tem o formato correto (3 partes)
        if (this.token) {
          const parts = this.token.split('.')
          if (parts.length !== 3) {
            console.error('⚠️ Token JWT em formato incorreto!')
            console.error('Token recebido:', this.token)
            console.error('Partes encontradas:', parts.length)
            throw new Error('Token JWT inválido recebido do backend')
          }
        } else {
          console.error('⚠️ Token não foi recebido do backend!')
          console.error('Response completo:', response)
          throw new Error('Token não encontrado na resposta do backend')
        }

        // Salvar no localStorage
        localStorage.setItem('token', this.token)
        localStorage.setItem('refreshToken', this.refreshToken)
        localStorage.setItem('user', JSON.stringify(this.user))

        // DEBUG: Verificar se foi salvo corretamente
        if (import.meta.env.DEV) {
          console.log('✅ Token salvo no localStorage:', localStorage.getItem('token')?.substring(0, 50) + '...')
        }

        return response
      } catch (error) {
        this.logout()
        throw error
      }
    },

    // Renovar token
    async refresh() {
      try {
        if (!this.refreshToken) {
          throw new Error('Refresh token não disponível')
        }

        const response = await authAPI.refresh(this.refreshToken)
        
        // O backend pode retornar em dois formatos
        const responseData = response.data.data || response.data

        this.token = responseData.accessToken || responseData.token
        this.refreshToken = responseData.refreshToken
        
        // Atualizar objeto user
        if (responseData.username || responseData.roles) {
          this.user = {
            username: responseData.username || this.user?.username,
            roles: responseData.roles || this.user?.roles,
            nome: responseData.nome || this.user?.nome,
            unidadeAtendimentoId: responseData.unidadeAtendimentoId || this.user?.unidadeAtendimentoId
          }
        } else if (responseData.user) {
          this.user = responseData.user
        }

        localStorage.setItem('token', this.token)
        localStorage.setItem('refreshToken', this.refreshToken)
        localStorage.setItem('user', JSON.stringify(this.user))

        return response
      } catch (error) {
        this.logout()
        throw error
      }
    },

    // Logout
    logout() {
      this.user = null
      this.token = null
      this.refreshToken = null
      this.isAuthenticated = false

      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    },

    // Restaurar sessão do localStorage
    restoreSession() {
      const token = localStorage.getItem('token')
      const refreshToken = localStorage.getItem('refreshToken')
      const userStr = localStorage.getItem('user')

      if (token && refreshToken && userStr) {
        this.token = token
        this.refreshToken = refreshToken
        this.user = JSON.parse(userStr)
        this.isAuthenticated = true
        return true
      }

      return false
    }
  }
})
