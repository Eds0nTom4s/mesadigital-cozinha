<template>
  <div class="bg-card-bg rounded-xl p-6 border-2 border-transparent hover:border-text-secondary transition-all">
    <!-- Cabeçalho do Pedido -->
    <div class="flex justify-between items-start mb-6">
      <div>
        <h3 class="text-3xl font-bold text-text-primary mb-1">
          {{ pedido.mesaCodigo }}
        </h3>
        <p class="text-xl text-text-secondary">
          {{ formatarHora(pedido.timestampCriacao) }}
        </p>
        <p v-if="pedido.minutosDesdeInicio" class="text-lg font-semibold mt-1" :class="pedido.atraso ? 'text-status-cancelado' : 'text-text-secondary'">
          ⏱️ {{ pedido.minutosDesdeInicio }} min {{ pedido.atraso ? '⚠️ ATRASADO' : '' }}
        </p>
      </div>
      <StatusBadge :status="pedido.status" />
    </div>

    <!-- Lista de Itens do Pedido -->
    <div class="space-y-4 mb-6">
      <div
        v-for="(item, index) in pedido.itens"
        :key="index"
        class="border-l-4 border-text-secondary pl-4"
      >
        <div class="flex items-start gap-3">
          <span class="text-2xl font-bold text-text-primary min-w-[3rem]">
            {{ item.quantidade }}x
          </span>
          <div class="flex-1">
            <p class="text-xl font-semibold text-text-primary">
              {{ item.produtoNome }}
            </p>
            <p v-if="item.observacao" class="text-lg text-status-novo mt-1 italic">
              ⚠️ {{ item.observacao }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Ações do Pedido -->
    <div class="flex gap-3">
      <!-- Botão: Assumir Pedido (apenas se status = PENDENTE) -->
      <button
        v-if="pedido.status === STATUS.PENDENTE"
        @click="assumirPedido"
        :disabled="loading"
        class="flex-1 bg-status-preparacao hover:bg-yellow-500 text-dark-bg font-bold text-xl py-4 px-6 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ loading ? 'Aguarde...' : 'Assumir Pedido' }}
      </button>

      <!-- Botão: Marcar como Pronto (apenas se status = EM_PREPARACAO) -->
      <button
        v-if="pedido.status === STATUS.EM_PREPARACAO"
        @click="marcarPronto"
        :disabled="loading"
        class="flex-1 bg-status-pronto hover:bg-green-600 text-text-primary font-bold text-xl py-4 px-6 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ loading ? 'Aguarde...' : 'Marcar como Pronto' }}
      </button>

      <!-- Visual quando Pronto (sem ações) -->
      <div
        v-if="pedido.status === STATUS.PRONTO"
        class="flex-1 bg-status-pronto/20 border-2 border-status-pronto text-status-pronto font-bold text-xl py-4 px-6 rounded-lg text-center"
      >
        ✓ Pedido Pronto
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import StatusBadge from './StatusBadge.vue'
import { STATUS, usePedidosStore } from '@/store/pedidos'
import { useNotificationStore } from '@/store/notification'

const props = defineProps({
  pedido: {
    type: Object,
    required: true
  }
})

const store = usePedidosStore()
const notification = useNotificationStore()
const loading = ref(false)

// Formatar hora do timestamp
const formatarHora = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
}

// Ação: Assumir pedido
const assumirPedido = async () => {
  try {
    loading.value = true
    await store.assumirPedido(props.pedido.id)
    notification.success(`Pedido ${props.pedido.mesaCodigo} assumido com sucesso`, 'Pedido Assumido')
  } catch (error) {
    console.error('Erro ao assumir pedido:', error)
    const errorMsg = error.response?.data?.error || 'Erro ao assumir pedido'
    notification.error(errorMsg, 'Erro')
  } finally {
    loading.value = false
  }
}

// Ação: Marcar pedido como pronto
const marcarPronto = async () => {
  try {
    loading.value = true
    await store.marcarPronto(props.pedido.id)
    notification.success(`Pedido ${props.pedido.mesaCodigo} está pronto!`, 'Pedido Pronto')
  } catch (error) {
    console.error('Erro ao marcar como pronto:', error)
    const errorMsg = error.response?.data?.error || 'Erro ao marcar como pronto'
    notification.error(errorMsg, 'Erro')
  } finally {
    loading.value = false
  }
}
</script>
