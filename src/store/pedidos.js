import { defineStore } from 'pinia'
import { subPedidosAPI } from '@/services/api'
import { useAuthStore } from './auth'

// Estados possíveis do SubPedido (conforme backend)
export const STATUS = {
  PENDENTE: 'PENDENTE',
  EM_PREPARACAO: 'EM_PREPARACAO',
  PRONTO: 'PRONTO',
  ENTREGUE: 'ENTREGUE',
  CANCELADO: 'CANCELADO'
}

export const usePedidosStore = defineStore('pedidos', {
  state: () => ({
    // Lista de SubPedidos (estrutura alinhada com backend)
    pedidos: [],
    loading: false,
    error: null
  }),

  getters: {
    // Pedidos ordenados por status e hora
    pedidosOrdenados: (state) => {
      const ordem = {
        [STATUS.PENDENTE]: 1,
        [STATUS.EM_PREPARACAO]: 2,
        [STATUS.PRONTO]: 3
      }
      return [...state.pedidos].sort((a, b) => {
        if (ordem[a.status] !== ordem[b.status]) {
          return ordem[a.status] - ordem[b.status]
        }
        return new Date(a.timestampCriacao) - new Date(b.timestampCriacao)
      })
    },

    // Contadores por status
    totalPendentes: (state) => state.pedidos.filter(p => p.status === STATUS.PENDENTE).length,
    totalEmPreparacao: (state) => state.pedidos.filter(p => p.status === STATUS.EM_PREPARACAO).length,
    totalProntos: (state) => state.pedidos.filter(p => p.status === STATUS.PRONTO).length,

    // Pedidos atrasados
    pedidosAtrasados: (state) => state.pedidos.filter(p => p.atraso === true)
  },

  actions: {
    // Carregar pedidos ativos da cozinha
    async carregarPedidosAtivos() {
      const authStore = useAuthStore()
      const cozinhaId = authStore.cozinhaId

      if (!cozinhaId) {
        this.error = 'ID da cozinha não disponível'
        return
      }

      try {
        this.loading = true
        this.error = null
        const pedidos = await subPedidosAPI.listarAtivos(cozinhaId)
        this.pedidos = pedidos
      } catch (error) {
        this.error = error.response?.data?.error || 'Erro ao carregar pedidos'
        console.error('Erro ao carregar pedidos:', error)
      } finally {
        this.loading = false
      }
    },

    // Assumir pedido (PENDENTE → EM_PREPARACAO)
    async assumirPedido(pedidoId) {
      try {
        this.loading = true
        const pedidoAtualizado = await subPedidosAPI.assumir(pedidoId)
        
        // Atualizar na lista local
        const index = this.pedidos.findIndex(p => p.id === pedidoId)
        if (index !== -1) {
          this.pedidos[index] = pedidoAtualizado
        }
        
        return pedidoAtualizado
      } catch (error) {
        this.error = error.response?.data?.error || 'Erro ao assumir pedido'
        console.error('Erro ao assumir pedido:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Marcar pedido como pronto (EM_PREPARACAO → PRONTO)
    async marcarPronto(pedidoId) {
      try {
        this.loading = true
        const pedidoAtualizado = await subPedidosAPI.marcarPronto(pedidoId)
        
        // Atualizar na lista local
        const index = this.pedidos.findIndex(p => p.id === pedidoId)
        if (index !== -1) {
          this.pedidos[index] = pedidoAtualizado
        }
        
        return pedidoAtualizado
      } catch (error) {
        this.error = error.response?.data?.error || 'Erro ao marcar como pronto'
        console.error('Erro ao marcar como pronto:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Adicionar novo pedido (via WebSocket)
    adicionarPedido(pedido) {
      // Evitar duplicados
      const existe = this.pedidos.find(p => p.id === pedido.id)
      if (!existe) {
        this.pedidos.push(pedido)
      }
    },

    // Atualizar pedido existente (via WebSocket)
    atualizarPedido(pedidoAtualizado) {
      const index = this.pedidos.findIndex(p => p.id === pedidoAtualizado.id)
      if (index !== -1) {
        this.pedidos[index] = pedidoAtualizado
      }
    },

    // Remover pedido da lista
    removerPedido(pedidoId) {
      this.pedidos = this.pedidos.filter(p => p.id !== pedidoId)
    }
  }
})
