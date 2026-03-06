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
            placeholder="912345678"
            required
            class="w-full px-4 py-3 rounded-lg bg-dark-bg text-text-primary border-2 border-text-secondary/20 focus:border-status-novo focus:outline-none text-lg"
          />
        </div>

        <!-- Senha -->
        <div>
          <label for="password" class="block text-text-primary font-semibold mb-2">
            Senha
          </label>
          <div class="relative">
            <input
              id="password"
              v-model="form.password"
              :type="mostrarSenha ? 'text' : 'password'"
              placeholder="••••••••"
              required
              class="w-full px-4 py-3 pr-12 rounded-lg bg-dark-bg text-text-primary border-2 border-text-secondary/20 focus:border-status-novo focus:outline-none text-lg"
            />
            <button
              type="button"
              @click="mostrarSenha = !mostrarSenha"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors text-2xl"
              :title="mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'"
            >
              {{ mostrarSenha ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
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

        <!-- Preenchimento Rápido (apenas em desenvolvimento) -->
        <button
          v-if="isDev"
          type="button"
          @click="preencherRapido"
          class="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold text-sm py-2 rounded-lg transition-all"
        >
          🚀 Preenchimento Rápido (Dev)
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
import { useNotificationStore } from '@/store/notification'
import { getTokenPayload, getRolesFromToken } from '@/utils/jwt'

const router = useRouter()
const authStore = useAuthStore()
const notification = useNotificationStore()

const form = ref({
  username: '',
  password: ''
})

const loading = ref(false)
const error = ref(null)
const mostrarSenha = ref(false)

// Detectar modo de desenvolvimento
const isDev = import.meta.env.DEV

// Preenchimento rápido para desenvolvimento
const preencherRapido = () => {
  form.value.username = '934567890'
  form.value.password = 'cozinha123'
  notification.info('Credenciais preenchidas automaticamente', 'Modo Desenvolvimento')
}

const handleLogin = async () => {
  try {
    loading.value = true
    error.value = null

    // A2: Backend espera 'senha' (não 'password')
    await authStore.login(form.value.username, form.value.password)

    // DEBUG: Mostrar informações do token JWT em desenvolvimento
    if (import.meta.env.DEV) {
      // Aguardar um momento para garantir que o token foi salvo
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const token = localStorage.getItem('token')
      console.log('🔐 TOKEN NO LOCALSTORAGE:', token?.substring(0, 100) + '...')
      
      const payload = getTokenPayload()
      const roles = getRolesFromToken()
      console.log('🔐 TOKEN JWT DECODIFICADO:')
      console.log('📋 Payload completo:', payload)
      console.log('👤 Usuário:', payload?.sub)
      console.log('✅ Nome:', payload?.nome)
      console.log('🎭 Roles:', roles)
      console.log('⏰ Expira em:', new Date(payload?.exp * 1000).toLocaleString())
    }

    // Verificar se tem role COZINHA
    if (!authStore.isCozinha) {
      const errorMsg = 'Usuário sem permissão de acesso à cozinha'
      error.value = errorMsg
      notification.error(errorMsg, 'Acesso Negado')
      authStore.logout()
      return
    }

    // Sucesso
    notification.success(`Bem-vindo, ${authStore.userName}!`, 'Login realizado')
    
    // B4: Usuários ROLE_COZINHA devem selecionar a cozinha
    if (authStore.isCozinha && !authStore.cozinhaId) {
      router.push('/selecionar-cozinha')
    } else {
      // Redirecionar para a interface da cozinha
      router.push('/kitchen')
    }
  } catch (err) {
    // Log detalhado apenas em desenvolvimento
    if (import.meta.env.DEV) {
      console.error('Erro no login:', err)
    }
    
    // Extrair mensagem de erro específica do backend
    let errorMsg = 'Erro ao fazer login. Tente novamente.'
    let errorTitle = 'Erro no Login'
    
    if (err.response) {
      const status = err.response.status
      const data = err.response.data
      
      switch (status) {
        case 400:
          errorMsg = 'Dados inválidos. Verifique o telefone e senha.'
          break
        case 401:
          errorMsg = 'Telefone ou senha incorretos'
          errorTitle = 'Credenciais Inválidas'
          break
        case 403:
          errorMsg = 'Acesso negado. Você não tem permissão para acessar este sistema.'
          errorTitle = 'Acesso Negado'
          break
        case 404:
          errorMsg = 'Serviço de autenticação não encontrado. Contate o administrador.'
          errorTitle = 'Serviço Indisponível'
          break
        case 500:
        case 502:
        case 503:
          errorMsg = 'Erro no servidor. O sistema está temporariamente indisponível. Tente novamente em alguns instantes.'
          errorTitle = 'Erro no Servidor'
          break
        case 504:
          errorMsg = 'Tempo de resposta excedido. Verifique sua conexão e tente novamente.'
          errorTitle = 'Timeout'
          break
        default:
          errorMsg = data?.error || data?.message || `Erro ${status}: Tente novamente.`
      }
    } else if (err.request) {
      errorMsg = 'Não foi possível conectar ao servidor. Verifique:\n• Se o backend está rodando (http://localhost:8080)\n• Sua conexão com a internet'
      errorTitle = 'Sem Conexão'
    } else {
      errorMsg = err.message || 'Erro inesperado. Tente novamente.'
      errorTitle = 'Erro Inesperado'
    }
    
    error.value = errorMsg
    notification.error(errorMsg, errorTitle)
  } finally {
    loading.value = false
  }
}
</script>
