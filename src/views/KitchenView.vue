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
import websocket from '@/services/websocket'

const store = usePedidosStore()
const authStore = useAuthStore()

// Carregar pedidos ao montar o componente
onMounted(async () => {
  // Restaurar sessão se existir
  if (!authStore.isLoggedIn) {
    authStore.restoreSession()
  }

  // Carregar pedidos ativos
  if (authStore.isLoggedIn) {
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
          // Tocar som de notificação (implementar depois)
          console.log('🔔 Novo pedido adicionado')
        },
        onAtualizacao: (pedido) => {
          store.atualizarPedido(pedido)
        },
        onError: (error) => {
          console.error('Erro no WebSocket:', error)
        }
      })
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
    .sort((a, b) => new Date(a.timestampCriacao) - new Date(b.timestampCriacao))
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
