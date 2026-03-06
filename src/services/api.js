import axios from 'axios'

// Configuração base do Axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor de Request - Adicionar token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor de Response - Tratar erros e renovar token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Se 401 e não é retry, tentar renovar token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/jwt/refresh`,
            { refreshToken }
          )

          const newToken = data.data.token
          localStorage.setItem('token', newToken)
          localStorage.setItem('refreshToken', data.data.refreshToken)

          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Token expirado, fazer logout
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// ====================================
// ENDPOINTS DE AUTENTICAÇÃO
// ====================================

export const authAPI = {
  // Login do usuário (admin, gerente, atendente, cozinha)
  async login(username, senha) {
    if (import.meta.env.DEV) {
      console.log('🔑 Enviando login:', { username, senha: '***' })
    }
    
    try {
      const response = await api.post('/auth/admin/login', {
        username,
        senha
      })
      
      if (import.meta.env.DEV) {
        console.log('✅ Resposta do login:', response.status, response.data)
      }
      
      // Retornar a resposta completa para que auth.store possa acessar response.data
      return response
    } catch (error) {
      // Log detalhado do erro
      if (import.meta.env.DEV) {
        console.error('❌ Erro no login:')
        console.error('Status:', error.response?.status)
        console.error('Data:', error.response?.data)
        console.error('ValidationErrors:', error.response?.data?.validationErrors)
        console.error('Headers:', error.response?.headers)
      }
      throw error
    }
  },

  // Renovar token
  async refresh(refreshToken) {
    const response = await api.post('/auth/jwt/refresh', {
      refreshToken
    })
    return response
  }
}

// ====================================
// ENDPOINTS DE SUBPEDIDOS (COZINHA)
// ====================================

export const subPedidosAPI = {
  // Listar pedidos ativos de uma cozinha
  async listarAtivos(cozinhaId) {
    const { data } = await api.get(`/subpedidos/cozinha/${cozinhaId}/ativos`)
    return data.data
  },

  // Assumir pedido (PENDENTE → EM_PREPARACAO)
  async assumir(subPedidoId) {
    const { data } = await api.put(`/subpedidos/${subPedidoId}/assumir`)
    return data.data
  },

  // Marcar como pronto (EM_PREPARACAO → PRONTO)
  async marcarPronto(subPedidoId) {
    const { data } = await api.put(`/subpedidos/${subPedidoId}/marcar-pronto`)
    return data.data
  },

  // Listar pedidos prontos
  async listarProntos(cozinhaId) {
    const { data } = await api.get(`/subpedidos/cozinha/${cozinhaId}/prontos`)
    return data.data
  },

  // Buscar detalhes de um subpedido
  async buscar(subPedidoId) {
    const { data } = await api.get(`/subpedidos/${subPedidoId}`)
    return data.data
  },

  // Buscar pedidos atrasados
  async listarAtrasados(minutosAtraso = 30) {
    const { data } = await api.get('/subpedidos/atrasados', {
      params: { minutosAtraso }
    })
    return data.data
  }
}

export default api
