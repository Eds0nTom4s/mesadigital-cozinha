<template>
  <span :class="badgeClasses" class="px-4 py-2 rounded-lg font-bold text-base uppercase tracking-wide">
    {{ statusTexto }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { STATUS } from '@/store/pedidos'

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (value) => Object.values(STATUS).includes(value)
  }
})

// Texto exibido para cada status
const statusTexto = computed(() => {
  const textos = {
    [STATUS.NOVO]: 'Novo',
    [STATUS.EM_PREPARACAO]: 'Em Preparação',
    [STATUS.PRONTO]: 'Pronto'
  }
  return textos[props.status] || props.status
})

// Classes CSS dinâmicas baseadas no status
const badgeClasses = computed(() => {
  const classes = {
    [STATUS.NOVO]: 'bg-status-novo text-dark-bg',
    [STATUS.EM_PREPARACAO]: 'bg-status-preparacao text-dark-bg',
    [STATUS.PRONTO]: 'bg-status-pronto text-text-primary'
  }
  return classes[props.status] || 'bg-gray-500 text-text-primary'
})
</script>
