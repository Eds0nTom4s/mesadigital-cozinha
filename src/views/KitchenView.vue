<template>
  <KitchenLayout>
    <!-- Pedidos Novos -->
    <template #novos>
      <PedidoCard
        v-for="pedido in pedidosNovos"
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
import { computed } from 'vue'
import KitchenLayout from '@/components/KitchenLayout.vue'
import PedidoCard from '@/components/PedidoCard.vue'
import { usePedidosStore, STATUS } from '@/store/pedidos'

const store = usePedidosStore()

// Pedidos agrupados por status
const pedidosNovos = computed(() => 
  store.pedidos.filter(p => p.status === STATUS.NOVO).sort((a, b) => a.hora.localeCompare(b.hora))
)

const pedidosEmPreparacao = computed(() => 
  store.pedidos.filter(p => p.status === STATUS.EM_PREPARACAO).sort((a, b) => a.hora.localeCompare(b.hora))
)

const pedidosProntos = computed(() => 
  store.pedidos.filter(p => p.status === STATUS.PRONTO).sort((a, b) => a.hora.localeCompare(b.hora))
)
</script>
