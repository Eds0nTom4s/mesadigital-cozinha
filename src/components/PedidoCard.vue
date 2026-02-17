<template>
  <div class="bg-card-bg rounded-xl p-6 border-2 border-transparent hover:border-text-secondary transition-all">
    <!-- Cabeçalho do Pedido -->
    <div class="flex justify-between items-start mb-6">
      <div>
        <h3 class="text-3xl font-bold text-text-primary mb-1">
          {{ pedido.mesa }}
        </h3>
        <p class="text-xl text-text-secondary">
          {{ pedido.hora }}
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
              {{ item.nome }}
            </p>
            <p v-if="item.observacoes" class="text-lg text-status-novo mt-1 italic">
              ⚠️ {{ item.observacoes }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Ações do Pedido -->
    <div class="flex gap-3">
      <!-- Botão: Iniciar Preparação (apenas se status = NOVO) -->
      <button
        v-if="pedido.status === STATUS.NOVO"
        @click="iniciarPreparacao"
        class="flex-1 bg-status-preparacao hover:bg-yellow-500 text-dark-bg font-bold text-xl py-4 px-6 rounded-lg transition-all active:scale-95"
      >
        Iniciar Preparação
      </button>

      <!-- Botão: Marcar como Pronto (apenas se status = EM_PREPARACAO) -->
      <button
        v-if="pedido.status === STATUS.EM_PREPARACAO"
        @click="marcarPronto"
        class="flex-1 bg-status-pronto hover:bg-green-600 text-text-primary font-bold text-xl py-4 px-6 rounded-lg transition-all active:scale-95"
      >
        Marcar como Pronto
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
import StatusBadge from './StatusBadge.vue'
import { STATUS, usePedidosStore } from '@/store/pedidos'

const props = defineProps({
  pedido: {
    type: Object,
    required: true
  }
})

const store = usePedidosStore()

// Ação: Iniciar preparação do pedido
const iniciarPreparacao = () => {
  store.iniciarPreparacao(props.pedido.id)
}

// Ação: Marcar pedido como pronto
const marcarPronto = () => {
  store.marcarPronto(props.pedido.id)
}
</script>
