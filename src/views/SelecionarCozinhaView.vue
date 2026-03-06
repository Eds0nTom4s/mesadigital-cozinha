<template>
  <div class="min-h-screen bg-dark-bg flex items-center justify-center p-4">
    <div class="bg-card-bg rounded-2xl shadow-2xl p-8 w-full max-w-md">
      <!-- Título -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-text-primary mb-2">
          🍳 Selecione sua Cozinha
        </h1>
        <p class="text-text-secondary text-lg">
          {{ userName }}, escolha a cozinha em que você está trabalhando hoje
        </p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-8">
        <p class="text-text-secondary">Carregando cozinhas disponíveis...</p>
      </div>

      <!-- Erro -->
      <div v-else-if="error" class="bg-status-cancelado/10 border border-status-cancelado text-status-cancelado px-4 py-3 rounded-lg mb-4">
        {{ error }}
      </div>

      <!-- Lista de Cozinhas -->
      <div v-else class="space-y-3">
        <button
          v-for="cozinha in cozinhas"
          :key="cozinha.id"
          @click="selecionarCozinha(cozinha.id)"
          class="w-full bg-dark-bg hover:bg-status-novo/20 text-text-primary font-semibold text-xl py-4 px-6 rounded-lg border-2 border-text-secondary/20 hover:border-status-novo transition-all text-left"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="font-bold">{{ cozinha.nome }}</p>
              <p v-if="cozinha.tipo" class="text-sm text-text-secondary">{{ cozinha.tipo }}</p>
            </div>
            <span class="text-2xl">→</span>
          </div>
        </button>
      </div>

      <!-- Logout -->
      <button
        @click="handleLogout"
        class="w-full mt-6 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-all"
      >
        ← Voltar ao Login
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { useNotificationStore } from '@/store/notification'
import api from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()
const notification = useNotificationStore()

const cozinhas = ref([])
const loading = ref(true)
const error = ref(null)

const userName = computed(() => authStore.userName)

// Carregar lista de cozinhas disponíveis
onMounted(async () => {
  try {
    // B4: Chamar GET /api/cozinhas para listar todas as cozinhas ativas
    const response = await api.get('/cozinhas')
    cozinhas.value = response.data.data || response.data || []
    
    if (cozinhas.value.length === 0) {
      error.value = 'Nenhuma cozinha disponível no momento.'
    }
  } catch (err) {
    console.error('Erro ao carregar cozinhas:', err)
    error.value = 'Erro ao carregar cozinhas. Tente novamente.'
    notification.error('Erro ao carregar cozinhas', 'Erro')
  } finally {
    loading.value = false
  }
})

// Selecionar cozinha e ir para interface
function selecionarCozinha(cozinhaId) {
  authStore.setCozinhaId(cozinhaId)
  notification.success('Cozinha selecionada com sucesso!', 'Sucesso')
  router.push('/kitchen')
}

// Logout
function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>
