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
          onNovoPedido: (pedido) => {
            store.adicionarPedido(pedido)
            notification.info(`Novo pedido: ${pedido.mesaCodigo}`, 'Novo Pedido')
            // TODO: Tocar som de notificação
            console.log('🔔 Novo pedido adicionado')
          },
          // ✅ NOVO: Handler para pedidos liberados automaticamente
          onPedidoLiberado: async (evento) => {
            console.log('✅ Pedido liberado automaticamente:', evento)
            // Recarregar pedidos para pegar o status atualizado
            try {
              await store.carregarPedidosAtivos()
              notification.success(
                `Pedido ${evento.pedidoNumero} liberado e pronto para produção`, 
                '🎉 Pedido Confirmado'
              )
              // TODO: Tocar som de notificação diferente (confirmação)
            } catch (error) {
              console.error('Erro ao recarregar pedidos após liberação:', error)
            }
          },
          onAtualizacao: (pedido) => {
            store.atualizarPedido(pedido)
          },
          // Handler para cancelamento de pedidos
          onCancelamento: (pedido) => {
            store.removerPedido(pedido.subPedidoId)
            notification.warning(`Pedido ${pedido.subPedidoId} foi cancelado`, 'Pedido Cancelado')
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
const pedidosPendentes = computed(() => 
  store.pedidos
    .filter(p => p.status === STATUS.PENDENTE)
    .sort((a, b) => new Date(a.recebidoEm) - new Date(b.recebidoEm))
)

const pedidosEmPreparacao = computed(() => 
  store.pedidos
    .filter(p => p.status === STATUS.EM_PREPARACAO)
    .sort((a, b) => new Date(a.timestampInicio) - new Date(b.timestampInicio))
)

const pedidosProntos = computed(() => 
  store.pedidos
    .filter(p => p.status === STATUS.PRONTO)
    .sort((a, b) => new Date(a.timestampConclusao) - new Date(b.timestampConclusao))
)
</script>
