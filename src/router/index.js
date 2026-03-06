import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import KitchenView from '@/views/KitchenView.vue'
import SelecionarCozinhaView from '@/views/SelecionarCozinhaView.vue'
import { useAuthStore } from '@/store/auth'
import { hasAnyRole } from '@/utils/jwt'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/kitchen'
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false }
    },
    {
      path: '/selecionar-cozinha',
      name: 'selecionar-cozinha',
      component: SelecionarCozinhaView,
      meta: { 
        requiresAuth: true,
        requiredRoles: ['ROLE_COZINHA']
      }
    },
    {
      path: '/kitchen',
      name: 'kitchen',
      component: KitchenView,
      meta: { 
        requiresAuth: true,
        requiredRoles: ['ROLE_COZINHA', 'ROLE_GERENTE', 'ROLE_ADMIN']
      }
    },
    {
      path: '/acesso-negado',
      name: 'acesso-negado',
      component: () => import('@/views/AcessoNegadoView.vue'),
      meta: { requiresAuth: false }
    }
  ]
})

// Guard de navegação para proteger rotas
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Tentar restaurar sessão se não estiver logado
  if (!authStore.isLoggedIn) {
    authStore.restoreSession()
  }

  if (to.meta.requiresAuth) {
    // Rota requer autenticação
    if (!authStore.isLoggedIn) {
      console.warn('Usuário não autenticado, redirecionando para login')
      next('/login')
      return
    }

    // Verificar roles se especificadas
    if (to.meta.requiredRoles && to.meta.requiredRoles.length > 0) {
      const hasPermission = hasAnyRole(to.meta.requiredRoles)
      
      if (!hasPermission) {
        console.warn('Usuário sem permissão para acessar esta rota')
        console.warn('Roles necessárias:', to.meta.requiredRoles)
        console.warn('Roles do usuário:', authStore.userRoles)
        next('/acesso-negado')
        return
      }
      
      // B4: Usuários ROLE_COZINHA precisam selecionar cozinha antes de acessar /kitchen
      if (to.path === '/kitchen' && hasAnyRole(['ROLE_COZINHA']) && !authStore.cozinhaId) {
        console.warn('Usuário ROLE_COZINHA precisa selecionar uma cozinha')
        next('/selecionar-cozinha')
        return
      }
    }
  }

  // Se já está logado e tenta acessar login, redireciona para kitchen
  if (to.path === '/login' && authStore.isLoggedIn) {
    next('/kitchen')
    return
  }

  next()
})

export default router
