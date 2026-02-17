import { defineStore } from 'pinia'

// Estados possíveis do pedido
export const STATUS = {
  NOVO: 'NOVO',
  EM_PREPARACAO: 'EM_PREPARACAO',
  PRONTO: 'PRONTO'
}

export const usePedidosStore = defineStore('pedidos', {
  state: () => ({
    // Mock inicial de pedidos
    pedidos: [
      {
        id: 1,
        mesa: 'Mesa 5',
        hora: '14:23',
        status: STATUS.NOVO,
        itens: [
          { nome: 'Hambúrguer Clássico', quantidade: 2, observacoes: 'Sem cebola' },
          { nome: 'Batata Frita Grande', quantidade: 1, observacoes: '' }
        ]
      },
      {
        id: 2,
        mesa: 'Mesa 12',
        hora: '14:18',
        status: STATUS.EM_PREPARACAO,
        itens: [
          { nome: 'Pizza Margherita', quantidade: 1, observacoes: 'Bem passada' },
          { nome: 'Refrigerante', quantidade: 2, observacoes: '' }
        ]
      },
      {
        id: 3,
        mesa: 'Mesa 3',
        hora: '14:15',
        status: STATUS.PRONTO,
        itens: [
          { nome: 'Salada Caesar', quantidade: 1, observacoes: 'Sem croutons' }
        ]
      },
      {
        id: 4,
        mesa: 'Balcão 2',
        hora: '14:25',
        status: STATUS.NOVO,
        itens: [
          { nome: 'Tábua de Frios', quantidade: 1, observacoes: '' },
          { nome: 'Vinho Tinto', quantidade: 1, observacoes: 'Garrafa' }
        ]
      },
      {
        id: 5,
        mesa: 'Mesa 8',
        hora: '14:20',
        status: STATUS.EM_PREPARACAO,
        itens: [
          { nome: 'Risotto de Camarão', quantidade: 1, observacoes: 'Picante' },
          { nome: 'Água com Gás', quantidade: 2, observacoes: '' }
        ]
      }
    ]
  }),

  getters: {
    // Pedidos ordenados por status e hora (novos primeiro)
    pedidosOrdenados: (state) => {
      const ordem = {
        [STATUS.NOVO]: 1,
        [STATUS.EM_PREPARACAO]: 2,
        [STATUS.PRONTO]: 3
      }
      return [...state.pedidos].sort((a, b) => {
        if (ordem[a.status] !== ordem[b.status]) {
          return ordem[a.status] - ordem[b.status]
        }
        return a.hora.localeCompare(b.hora)
      })
    },

    // Contadores por status
    totalNovos: (state) => state.pedidos.filter(p => p.status === STATUS.NOVO).length,
    totalEmPreparacao: (state) => state.pedidos.filter(p => p.status === STATUS.EM_PREPARACAO).length,
    totalProntos: (state) => state.pedidos.filter(p => p.status === STATUS.PRONTO).length
  },

  actions: {
    // Iniciar preparação de um pedido
    iniciarPreparacao(pedidoId) {
      const pedido = this.pedidos.find(p => p.id === pedidoId)
      if (pedido && pedido.status === STATUS.NOVO) {
        pedido.status = STATUS.EM_PREPARACAO
      }
    },

    // Marcar pedido como pronto
    marcarPronto(pedidoId) {
      const pedido = this.pedidos.find(p => p.id === pedidoId)
      if (pedido && pedido.status === STATUS.EM_PREPARACAO) {
        pedido.status = STATUS.PRONTO
      }
    }

    // Preparado para integração futura com WebSocket/API
    // conectarWebSocket() {},
    // sincronizarPedidos() {}
  }
})
