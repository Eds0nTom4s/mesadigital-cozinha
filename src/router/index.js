import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import KitchenView from '@/views/KitchenView.vue'
import { useAuthStore } from '@/store/auth'

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
      path: '/kitchen',
      name: 'kitchen',
      component: KitchenView,
      meta: { requiresAuth: true }
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

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    // Rota requer autenticação mas usuário não está logado
    next('/login')
  } else if (to.path === '/login' && authStore.isLoggedIn) {
    // Usuário já está logado, redirecionar para kitchen
    next('/kitchen')
  } else {
    next()
  }
})

export default router
