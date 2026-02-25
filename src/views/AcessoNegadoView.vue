<template>
  <div class="min-h-screen flex items-center justify-center bg-red-50">
    <div class="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
      <div class="text-center">
        <!-- Ícone de Acesso Negado -->
        <div class="text-6xl mb-4">🚫</div>
        
        <!-- Título -->
        <h1 class="text-2xl font-bold text-red-600 mb-2">
          Acesso Negado
        </h1>
        
        <!-- Mensagem -->
        <p class="text-gray-600 mb-6">
          Você não tem permissão para acessar esta página.
        </p>
        
        <!-- Informações de Debug (Roles do Usuário) -->
        <div class="bg-gray-100 p-4 rounded-lg mb-6">
          <p class="text-sm font-semibold text-gray-700 mb-2">
            Suas Permissões:
          </p>
          <div class="flex flex-wrap gap-2 justify-center">
            <span 
              v-for="role in userRoles" 
              :key="role" 
              class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
            >
              {{ formatRole(role) }}
            </span>
            <span v-if="userRoles.length === 0" class="text-gray-500 text-sm">
              Nenhuma permissão encontrada
            </span>
          </div>
        </div>
        
        <!-- Informações Adicionais -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <p class="text-xs text-blue-800 mb-1">
            <strong>Usuário:</strong> {{ userName || 'Não identificado' }}
          </p>
          <p class="text-xs text-blue-800">
            <strong>Status do Token:</strong> {{ tokenStatus }}
          </p>
        </div>
        
        <!-- Botões de Ação -->
        <div class="flex gap-3">
          <button
            @click="voltar"
            class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            ← Voltar
          </button>
          <button
            @click="irParaLogin"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Fazer Login
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { getRolesFromToken, isTokenExpired, getTokenTimeRemaining } from '@/utils/jwt'

const router = useRouter()
const authStore = useAuthStore()

// Obter roles do token JWT
const userRoles = computed(() => getRolesFromToken())

// Nome do usuário
const userName = computed(() => authStore.userName)

// Status do token
const tokenStatus = computed(() => {
  if (!authStore.token) return 'Não autenticado'
  if (isTokenExpired()) return 'Token expirado'
  
  const timeRemaining = getTokenTimeRemaining()
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  
  return `Válido (${minutes}m ${seconds}s restantes)`
})

// Formatar nome da role (remover ROLE_ prefix)
function formatRole(role) {
  return role.replace('ROLE_', '')
}

// Voltar para página anterior
function voltar() {
  router.back()
}

// Ir para login
function irParaLogin() {
  authStore.logout()
  router.push('/login')
}
</script>
