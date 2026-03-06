import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { subPedidosAPI } from '@/services/api'
import { useAuthStore } from './auth'

// Estados possíveis do SubPedido (conforme backend)
export const STATUS = {
  CRIADO: 'CRIADO',           // ✅ NOVO: Pedido criado, aguardando confirmação automática
  PENDENTE: 'PENDENTE',       // Confirmado, aguardando cozinha assumir
  EM_PREPARACAO: 'EM_PREPARACAO',
  PRONTO: 'PRONTO',
  ENTREGUE: 'ENTREGUE',
  CANCELADO: 'CANCELADO'
}

export const usePedidosStore = defineStore('pedidos', () => {
  // State
  const pedidos = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Getters (computed)
  const pedidosOrdenados = computed(() => {
    const ordem = {
      [STATUS.CRIADO]: 0,           // CRIADO não deve aparecer na cozinha (bloqueado)
      [STATUS.PENDENTE]: 1,
      [STATUS.EM_PREPARACAO]: 2,
      [STATUS.PRONTO]: 3
    }
    return [...pedidos.value].sort((a, b) => {
      if (ordem[a.status] !== ordem[b.status]) {
        return ordem[a.status] - ordem[b.status]
      }
      // A5: Campo correto é recebidoEm (não timestampCriacao)
      return new Date(a.recebidoEm) - new Date(b.recebidoEm)
    })
  })

  const totalPendentes = computed(() => 
    pedidos.value.filter(p => p.status === STATUS.PENDENTE).length
  )
  
  const totalEmPreparacao = computed(() => 
    pedidos.value.filter(p => p.status === STATUS.EM_PREPARACAO).length
  )
  
  const totalProntos = computed(() => 
    pedidos.value.filter(p => p.status === STATUS.PRONTO).length
  )
  
  const pedidosAtrasados = computed(() => 
    pedidos.value.filter(p => p.atraso === true)
  )

  // Actions
  async function carregarPedidosAtivos() {
    const authStore = useAuthStore()
    const cozinhaId = authStore.cozinhaId

    if (!cozinhaId) {
      error.value = 'ID da cozinha não disponível'
      console.error('❌ CozinhaId não disponível')
      return
    }

    try {
      loading.value = true
      error.value = null
      
      if (import.meta.env.DEV) {
        console.log('📥 Carregando pedidos ativos da cozinha:', cozinhaId)
      }
      
      const pedidosData = await subPedidosAPI.listarAtivos(cozinhaId)
      
      if (import.meta.env.DEV) {
        console.log('✅ Pedidos carregados:', pedidosData)
        console.log('📊 Total de pedidos:', pedidosData?.length || 0)
        console.log('📋 Status dos pedidos:', pedidosData?.map(p => ({ id: p.id, status: p.status })))
      }
      
      pedidos.value = pedidosData || []
    } catch (err) {
      error.value = err.response?.data?.error || 'Erro ao carregar pedidos'
      console.error('❌ Erro ao carregar pedidos:', err)
      console.error('📋 Detalhes do erro:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      })
    } finally {
      loading.value = false
    }
  }

  async function assumirPedido(pedidoId) {
    try {
      loading.value = true
      const pedidoAtualizado = await subPedidosAPI.assumir(pedidoId)
      
      // Atualizar na lista local usando map para reatividade
      pedidos.value = pedidos.value.map(p => 
        p.id === pedidoId ? pedidoAtualizado : p
      )
      
      return pedidoAtualizado
    } catch (err) {
      error.value = err.response?.data?.error || 'Erro ao assumir pedido'
      console.error('Erro ao assumir pedido:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function marcarPronto(pedidoId) {
    try {
      loading.value = true
      const pedidoAtualizado = await subPedidosAPI.marcarPronto(pedidoId)
      
      // Atualizar na lista local usando map para reatividade
      pedidos.value = pedidos.value.map(p => 
        p.id === pedidoId ? pedidoAtualizado : p
      )
      
      return pedidoAtualizado
    } catch (err) {
      error.value = err.response?.data?.error || 'Erro ao marcar como pronto'
      console.error('Erro ao marcar como pronto:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function adicionarPedido(pedido) {
    if (import.meta.env.DEV) {
      console.log('➕ Adicionando pedido via WebSocket:', pedido)
      console.log('📊 Pedidos antes:', pedidos.value.length)
    }
    
    // Evitar duplicados
    const existe = pedidos.value.find(p => p.id === pedido.id)
    if (!existe) {
      // Usar spread operator para garantir reatividade
      pedidos.value = [...pedidos.value, pedido]
      
      if (import.meta.env.DEV) {
        console.log('✅ Pedido adicionado com sucesso')
        console.log('📊 Pedidos depois:', pedidos.value.length)
        console.log('📋 Lista atualizada:', pedidos.value.map(p => ({ id: p.id, status: p.status })))
      }
    } else {
      if (import.meta.env.DEV) {
        console.log('⚠️ Pedido já existe na lista, ignorando duplicado')
      }
    }
  }

  function atualizarPedido(pedidoAtualizado) {
    if (import.meta.env.DEV) {
      console.log('🔄 Atualizando pedido via WebSocket:', pedidoAtualizado)
      console.log('📊 Pedidos antes:', pedidos.value.length)
    }
    
    const index = pedidos.value.findIndex(p => p.id === pedidoAtualizado.id)
    if (index !== -1) {
      // Usar map para garantir reatividade
      pedidos.value = pedidos.value.map((p, i) => 
        i === index ? pedidoAtualizado : p
      )
      
      if (import.meta.env.DEV) {
        console.log('✅ Pedido atualizado com sucesso')
        console.log('📋 Pedido atualizado:', pedidos.value[index])
      }
    } else {
      if (import.meta.env.DEV) {
        console.log('⚠️ Pedido não encontrado na lista, adicionando...')
      }
      // Se não encontrou, adicionar (pode ser um pedido novo que chegou por outra rota)
      adicionarPedido(pedidoAtualizado)
    }
  }

  function removerPedido(pedidoId) {
    if (import.meta.env.DEV) {
      console.log('🗑️ Removendo pedido:', pedidoId)
      console.log('📊 Pedidos antes:', pedidos.value.length)
    }
    
    pedidos.value =pedidos.value.filter(p => p.id !== pedidoId)
    
    if (import.meta.env.DEV) {
      console.log('📊 Pedidos depois:', pedidos.value.length)
    }
  }

  // Return para expor state, getters e actions
  return {
    // State
    pedidos,
    loading,
    error,
    // Getters
    pedidosOrdenados,
    totalPendentes,
    totalEmPreparacao,
    totalProntos,
    pedidosAtrasados,
    // Actions
    carregarPedidosAtivos,
    assumirPedido,
    marcarPronto,
    adicionarPedido,
    atualizarPedido,
    removerPedido
  }
})
