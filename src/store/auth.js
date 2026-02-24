import { defineStore } from 'pinia'
import { authAPI } from '@/services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    isAuthenticated: false
  }),

  getters: {
    // Verificar se o usuário está autenticado
    isLoggedIn: (state) => !!state.token && !!state.user,

    // Obter o nome do usuário
    userName: (state) => state.user?.nome || '',

    // Obter o ID da cozinha do usuário
    cozinhaId: (state) => state.user?.unidadeAtendimentoId || null,

    // Verificar se tem role COZINHA
    isCozinha: (state) => {
      return state.user?.roles?.includes('ROLE_COZINHA') || false
    }
  },

  actions: {
    // Login do cozinheiro
    async login(username, password) {
      try {
        const response = await authAPI.login(username, password)

        this.token = response.data.token
        this.refreshToken = response.data.refreshToken
        this.user = response.data.user
        this.isAuthenticated = true

        // Salvar no localStorage
        localStorage.setItem('token', this.token)
        localStorage.setItem('refreshToken', this.refreshToken)
        localStorage.setItem('user', JSON.stringify(this.user))

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

        this.token = response.data.token
        this.refreshToken = response.data.refreshToken
        this.user = response.data.user

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
