<template>
  <KitchenLayout>
    <!-- Pedidos Pendentes -->
    <template #pendentes>
      <PedidoCard
        v-for="pedido in pedidosPendentes"
        :key="pedido.id"
        :pedido="pedido"
      />
    </template>

    <!-- Pedidos Em Preparação -->
    <template #preparacao>
      <PedidoCard
        v-for="pedido in pedidosEmPreparacao"
        :key="pedido.id"
        :pedido="pedido"
      />
    </template>

    <!-- Pedidos Prontos -->
    <template #prontos>
      <PedidoCard
        v-for="pedido in pedidosProntos"
        :key="pedido.id"
        :pedido="pedido"
      />
    </template>
  </KitchenLayout>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import KitchenLayout from '@/components/KitchenLayout.vue'
import PedidoCard from '@/components/PedidoCard.vue'
import { usePedidosStore, STATUS } from '@/store/pedidos'
import { useAuthStore } from '@/store/auth'
import { useNotificationStore } from '@/store/notification'
import websocket from '@/services/websocket'

const store = usePedidosStore()
const authStore = useAuthStore()
const notification = useNotificationStore()

// Carregar pedidos ao montar o componente
onMounted(async () => {
  // Restaurar sessão se existir
  if (!authStore.isLoggedIn) {
    authStore.restoreSession()
  }

  // Carregar pedidos ativos
  if (authStore.isLoggedIn) {
    try {
      await store.carregarPedidosAtivos()
      
      // Conectar ao WebSocket para receber atualizações em tempo real
      const cozinhaId = authStore.cozinhaId
      if (cozinhaId) {
        websocket.connect(cozinhaId, {
          onConnect: () => {
            console.log('WebSocket conectado com sucesso')
          },
          onNovoPedido: (notificacao) => {
            console.log('🔔 Nova notificação de pedido recebida:', notificacao)
            
            // Transformar NotificacaoSubPedidoDTO em SubPedido
            const pedido = {
              id: notificacao.subPedidoId,
              pedidoId: notificacao.pedidoId,
              status: notificacao.status,
              itens: notificacao.itens || [],
              observacoes: notificacao.observacoes,
              recebidoEm: notificacao.timestamp,
              cozinhaId: notificacao.cozinhaId,
              nomeCozinha: notificacao.nomeCozinha
            }
            
            console.log('📦 Pedido transformado:', pedido)
            store.adicionarPedido(pedido)
            
            notification.info(
              `Novo pedido da ${pedido.nomeCozinha || 'cozinha'}`, 
              'Novo Pedido'
            )
            // TODO: Tocar som de notificação
          },
          // ✅ NOVO: Handler para pedidos liberados automaticamente
          onPedidoLiberado: async (evento) => {
            console.log('🎉 Pedido liberado automaticamente:', evento)
            console.log('📊 Estado atual dos pedidos:', store.pedidos.length, 'pedidos')
            
            // Recarregar pedidos para pegar o status atualizado
            try {
              console.log('🔄 Recarregando pedidos ativos...')
              await store.carregarPedidosAtivos()
              
              console.log('✅ Pedidos recarregados. Total:', store.pedidos.length)
              console.log('📋 Pedidos após reload:', store.pedidos.map(p => ({ 
                id: p.id, 
                status: p.status,
                pedidoNumero: p.pedidoNumero
              })))
              
              notification.success(
                `Pedido ${evento.pedidoNumero || evento.pedidoId} liberado e pronto para produção`, 
                '🎉 Pedido Confirmado'
              )
              // TODO: Tocar som de notificação diferente (confirmação)
            } catch (error) {
              console.error('❌ Erro ao recarregar pedidos após liberação:', error)
            }
          },
          onAtualizacao: (notificacao) => {
            console.log('🔄 Notificação de atualização recebida:', notificacao)
            
            // Transformar NotificacaoSubPedidoDTO em SubPedido
            const pedidoAtualizado = {
              id: notificacao.subPedidoId,
              pedidoId: notificacao.pedidoId,
              status: notificacao.status,
              itens: notificacao.itens || [],
              observacoes: notificacao.observacoes,
              recebidoEm: notificacao.timestamp,
              cozinhaId: notificacao.cozinhaId,
              nomeCozinha: notificacao.nomeCozinha
            }
            
            console.log('📦 Pedido atualizado transformado:', pedidoAtualizado)
            store.atualizarPedido(pedidoAtualizado)
            
            if (notificacao.tipoAcao === 'MUDANCA_STATUS') {
              notification.info(
                `Status alterado para ${notificacao.status}`,
                'Atualização'
              )
            }
          },
          // Handler para cancelamento de pedidos
          onCancelamento: (notificacao) => {
            console.log('❌ Notificação de cancelamento recebida:', notificacao)
            
            store.removerPedido(notificacao.subPedidoId)
            notification.warning(
              `Pedido #${notificacao.subPedidoId} foi cancelado`, 
              'Pedido Cancelado'
            )
          },
          onError: (error) => {
            console.error('Erro no WebSocket:', error)
            notification.warning('Conexão em tempo real perdida. Reconectando...', 'WebSocket')
          }
        })
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
      notification.error('Erro ao carregar pedidos. Tente recarregar a página.', 'Erro')
    }
  }
})

// Desconectar WebSocket ao desmontar
onUnmounted(() => {
  websocket.disconnect()
})

// Pedidos agrupados por status
const pedidosPendentes = computed(() => {
  const pendentes = store.pedidos
    .filter(p => p.status === STATUS.PENDENTE)
    .sort((a, b) => new Date(a.recebidoEm) - new Date(b.recebidoEm))
  
  if (import.meta.env.DEV) {
    console.log('🔄 Computed pedidosPendentes recalculado:', pendentes.length, 'pedidos')
  }
  
  return pendentes
})

const pedidosEmPreparacao = computed(() => {
  const emPreparacao = store.pedidos
    .filter(p => p.status === STATUS.EM_PREPARACAO)
    .sort((a, b) => new Date(a.timestampInicio) - new Date(b.timestampInicio))
  
  if (import.meta.env.DEV) {
    console.log('🔄 Computed pedidosEmPreparacao recalculado:', emPreparacao.length, 'pedidos')
  }
  
  return emPreparacao
})

const pedidosProntos = computed(() => {
  const prontos = store.pedidos
    .filter(p => p.status === STATUS.PRONTO)
    .sort((a, b) => new Date(a.timestampConclusao) - new Date(b.timestampConclusao))
  
  if (import.meta.env.DEV) {
    console.log('🔄 Computed pedidosProntos recalculado:', prontos.length, 'pedidos')
  }
  
  return prontos
})
</script>
