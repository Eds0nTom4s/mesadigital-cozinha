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
import { computed, onMounted, onUnmounted, watch } from 'vue'
import KitchenLayout from '@/components/KitchenLayout.vue'
import PedidoCard from '@/components/PedidoCard.vue'
import { usePedidosStore, STATUS } from '@/store/pedidos'
import { useAuthStore } from '@/store/auth'
import { useNotificationStore } from '@/store/notification'
import websocket from '@/services/websocket'
import { subPedidosAPI } from '@/services/api'

const store = usePedidosStore()
const authStore = useAuthStore()
const notification = useNotificationStore()

// Watch para debug de reatividade (direto no store, não precisa storeToRefs com Options API)
if (import.meta.env.DEV) {
  watch(() => store.pedidos, (newPedidos, oldPedidos) => {
    console.log('🔍 [WATCH] Array pedidos mudou!')
    console.log('📊 [WATCH] Antes:', oldPedidos?.length || 0, 'pedidos')
    console.log('📊 [WATCH] Depois:', newPedidos?.length || 0, 'pedidos')
    console.log('📋 [WATCH] Novos pedidos:', newPedidos?.map(p => ({ id: p.id, status: p.status })))
  }, { deep: true })
}

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
          onNovoPedido: async (notificacao) => {
            console.log('🔔 [VIEW] Nova notificação de pedido recebida:', notificacao)
            
            const subPedidoId = notificacao.subPedidoId || notificacao.id
            if (!subPedidoId) {
              console.warn('⚠️ [VIEW] Notificação sem ID, ignorando:', notificacao)
              return
            }

            // Helper para normalizar itens (backend pode enviar nomes diferentes no WS vs REST)
            const normalizarItens = (itens) => (itens || []).map(item => ({
              ...item,
              produtoNome: item.produtoNome || item.nomeProduto,
              observacao: item.observacao || item.observacoes
            }))

            // Tentar buscar detalhes completos para garantir itens e mesaCodigo
            let fullPedido = null
            try {
              fullPedido = await subPedidosAPI.buscar(subPedidoId)
              console.log('✅ [VIEW] Detalhes do pedido carregados via API')
            } catch (e) {
              console.error('❌ [VIEW] Erro ao buscar detalhes via API:', e)
            }

            // Transformar NotificacaoSubPedidoDTO em SubPedido (usando fullPedido se disponível)
            const pedido = fullPedido || {
              id: subPedidoId,
              pedidoId: notificacao.pedidoId,
              pedidoNumero: notificacao.pedidoNumero || `PED-${notificacao.pedidoId}`,
              subPedidoNumero: notificacao.subPedidoNumero,
              status: notificacao.status || 'PENDENTE',
              itens: normalizarItens(notificacao.itens),
              observacoes: notificacao.observacoes,
              recebidoEm: notificacao.timestamp || new Date().toISOString(),
              cozinhaId: notificacao.cozinhaId,
              nomeCozinha: notificacao.nomeCozinha,
              mesaCodigo: notificacao.mesaCodigo || `MESA-${notificacao.pedidoId}`
            }
            
            console.log('📦 [VIEW] Pedido pronto para store:', pedido)
            store.atualizarPedido(pedido)
            
            notification.info(
              `Novo pedido #${pedido.pedidoNumero || pedido.id}`, 
              'Novo Pedido'
            )
          },
          // Handler para pedidos liberados automaticamente
          onPedidoLiberado: async (evento) => {
            console.log('🎉 [VIEW] Pedido liberado automaticamente:', evento)
            
            try {
              const subPedidoId = evento.subPedidoId || evento.id
              if (!subPedidoId) {
                console.warn('⚠️ [VIEW] evento sem ID, ignorando:', evento)
                return
              }

              const fullPedido = await subPedidosAPI.buscar(subPedidoId)
              store.atualizarPedido(fullPedido)
              
              notification.success(
                `Pedido ${fullPedido.pedidoNumero || evento.pedidoNumero || subPedidoId} liberado e pronto para produção`, 
                '🎉 Pedido Confirmado'
              )
            } catch (e) {
              console.error('❌ [VIEW] Erro ao carregar pedido liberado:', e)
              // Fallback: recarregar todos se falhar
              store.carregarPedidosAtivos()
            }
          },
          onAtualizacao: async (notificacao) => {
            console.log('🔄 [VIEW] Notificação de atualização recebida:', notificacao)
            
            const subPedidoId = notificacao.subPedidoId || notificacao.id
            if (!subPedidoId) {
              console.warn('⚠️ [VIEW] Notificação de atualização sem ID:', notificacao)
              return
            }

            let pedidoAtualizado = null
            try {
              pedidoAtualizado = await subPedidosAPI.buscar(subPedidoId)
            } catch (e) {
              console.error('❌ [VIEW] Erro ao atualizar detalhes via API:', e)
            }

            if (!pedidoAtualizado) {
              // Fallback: normalização manual
              pedidoAtualizado = {
                id: subPedidoId,
                pedidoId: notificacao.pedidoId,
                pedidoNumero: notificacao.pedidoNumero || `PED-${notificacao.pedidoId}`,
                subPedidoNumero: notificacao.subPedidoNumero,
                status: notificacao.status,
                itens: (notificacao.itens || []).map(item => ({
                  ...item,
                  produtoNome: item.produtoNome || item.nomeProduto,
                  observacao: item.observacao || item.observacoes
                })),
                observacoes: notificacao.observacoes,
                recebidoEm: notificacao.timestamp,
                cozinhaId: notificacao.cozinhaId,
                nomeCozinha: notificacao.nomeCozinha
              }
            }
            
            console.log('📦 [VIEW] Pedido atualizado pronto para store:', pedidoAtualizado)
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
    console.log('🔄 [COMPUTED] pedidosPendentes recalculado:', pendentes.length, 'pedidos')
  }
  
  return pendentes
})

const pedidosEmPreparacao = computed(() => {
  const emPreparacao = store.pedidos
    .filter(p => p.status === STATUS.EM_PREPARACAO)
    .sort((a, b) => new Date(a.timestampInicio) - new Date(b.timestampInicio))
  
  if (import.meta.env.DEV) {
    console.log('🔄 [COMPUTED] pedidosEmPreparacao recalculado:', emPreparacao.length, 'pedidos')
  }
  
  return emPreparacao
})

const pedidosProntos = computed(() => {
  const prontos = store.pedidos
    .filter(p => p.status === STATUS.PRONTO)
    .sort((a, b) => new Date(a.timestampConclusao) - new Date(b.timestampConclusao))
  
  if (import.meta.env.DEV) {
    console.log('🔄 [COMPUTED] pedidosProntos recalculado:', prontos.length, 'pedidos')
  }
  
  return prontos
})
</script>
