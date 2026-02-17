import { createRouter, createWebHistory } from 'vue-router'
import KitchenView from '@/views/KitchenView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'kitchen',
      component: KitchenView
    }
  ]
})

export default router
