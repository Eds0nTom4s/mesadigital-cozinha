<template>
  <div class="min-h-screen bg-dark-bg flex items-center justify-center p-4">
    <div class="bg-card-bg rounded-2xl shadow-2xl p-8 w-full max-w-md">
      <!-- Logo/Título -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-text-primary mb-2">
          🍳 COZINHA
        </h1>
        <p class="text-text-secondary text-lg">
          Sistema de Gestão de Pedidos
        </p>
      </div>

      <!-- Formulário de Login -->
      <form @submit.prevent="handleLogin" class="space-y-6">
        <!-- Telefone/Username -->
        <div>
          <label for="username" class="block text-text-primary font-semibold mb-2">
            Telefone
          </label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            placeholder="+244912345678"
            required
            class="w-full px-4 py-3 rounded-lg bg-dark-bg text-text-primary border-2 border-text-secondary/20 focus:border-status-novo focus:outline-none text-lg"
          />
        </div>

        <!-- Senha -->
        <div>
          <label for="password" class="block text-text-primary font-semibold mb-2">
            Senha
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="••••••••"
            required
            class="w-full px-4 py-3 rounded-lg bg-dark-bg text-text-primary border-2 border-text-secondary/20 focus:border-status-novo focus:outline-none text-lg"
          />
        </div>

        <!-- Mensagem de erro -->
        <div v-if="error" class="bg-status-cancelado/10 border border-status-cancelado text-status-cancelado px-4 py-3 rounded-lg">
          {{ error }}
        </div>

        <!-- Botão de Login -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-status-novo hover:bg-orange-600 text-dark-bg font-bold text-xl py-4 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <!-- Informações -->
      <div class="mt-6 text-center text-text-secondary text-sm">
        <p>© 2026 Sistema de Restauração</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  username: '',
  password: ''
})

const loading = ref(false)
const error = ref(null)

const handleLogin = async () => {
  try {
    loading.value = true
    error.value = null

    await authStore.login(form.value.username, form.value.password)

    // Verificar se tem role COZINHA
    if (!authStore.isCozinha) {
      error.value = 'Usuário sem permissão de acesso à cozinha'
      authStore.logout()
      return
    }

    // Redirecionar para a interface da cozinha
    router.push('/kitchen')
  } catch (err) {
    console.error('Erro no login:', err)
    error.value = err.response?.data?.error || 'Erro ao fazer login. Verifique suas credenciais.'
  } finally {
    loading.value = false
  }
}
</script>
