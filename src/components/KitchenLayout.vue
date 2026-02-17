<template>
  <div class="h-screen bg-dark-bg flex flex-col overflow-hidden">
    <!-- Header Simples -->
    <header class="bg-card-bg border-b-2 border-text-secondary/20 px-8 py-6 flex-shrink-0">
      <h1 class="text-4xl font-bold text-text-primary text-center">
        🍳 COZINHA
      </h1>
    </header>

    <!-- 3 Colunas -->
    <main class="flex-1 flex gap-4 p-6 overflow-hidden min-h-0">
      <!-- Coluna: Novos -->
      <div class="flex-1 flex flex-col">
        <div class="bg-status-novo text-dark-bg font-bold text-2xl py-4 px-6 rounded-t-xl text-center">
          Novos ({{ store.totalNovos }})
        </div>
        <div class="flex-1 bg-card-bg/30 rounded-b-xl p-4 overflow-y-auto space-y-4">
          <slot name="novos"></slot>
        </div>
      </div>

      <!-- Coluna: Em Preparação -->
      <div class="flex-1 flex flex-col">
        <div class="bg-status-preparacao text-dark-bg font-bold text-2xl py-4 px-6 rounded-t-xl text-center">
          Em Preparação ({{ store.totalEmPreparacao }})
        </div>
        <div class="flex-1 bg-card-bg/30 rounded-b-xl p-4 overflow-y-auto space-y-4">
          <slot name="preparacao"></slot>
        </div>
      </div>

      <!-- Coluna: Prontos -->
      <div class="flex-1 flex flex-col">
        <div class="bg-status-pronto text-text-primary font-bold text-2xl py-4 px-6 rounded-t-xl text-center">
          Prontos ({{ store.totalProntos }})
        </div>
        <div class="flex-1 bg-card-bg/30 rounded-b-xl p-4 overflow-y-auto space-y-4">
          <slot name="prontos"></slot>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-card-bg border-t border-text-secondary/20 py-3 px-8 flex-shrink-0">
      <p class="text-center text-text-secondary text-sm">
        © 2026 Sistema de Restauração - Todos os direitos reservados
      </p>
    </footer>
  </div>
</template>

<script setup>
import { usePedidosStore } from '@/store/pedidos'

const store = usePedidosStore()
</script>
