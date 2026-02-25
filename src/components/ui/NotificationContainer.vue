<template>
  <div class="fixed top-4 right-4 z-50 space-y-3 max-w-md">
    <transition-group name="notification">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="notificationClasses(notification.type)"
        class="rounded-lg shadow-2xl p-4 flex items-start gap-3 border-l-4"
      >
        <!-- Ícone -->
        <div class="flex-shrink-0 text-2xl">
          {{ getIcon(notification.type) }}
        </div>

        <!-- Conteúdo -->
        <div class="flex-1 min-w-0">
          <h4 v-if="notification.title" class="font-bold text-lg mb-1">
            {{ notification.title }}
          </h4>
          <p class="text-sm">
            {{ notification.message }}
          </p>
        </div>

        <!-- Botão fechar -->
        <button
          @click="remove(notification.id)"
          class="flex-shrink-0 text-xl hover:opacity-70 transition-opacity"
        >
          ✕
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useNotificationStore } from '@/store/notification'

const notificationStore = useNotificationStore()

const notifications = computed(() => notificationStore.notifications)

const notificationClasses = (type) => {
  const classes = {
    success: 'bg-status-pronto border-status-pronto text-white',
    error: 'bg-status-cancelado border-status-cancelado text-white',
    warning: 'bg-status-preparacao border-status-preparacao text-dark-bg',
    info: 'bg-blue-500 border-blue-500 text-white'
  }
  return classes[type] || classes.info
}

const getIcon = (type) => {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }
  return icons[type] || icons.info
}

const remove = (id) => {
  notificationStore.remove(id)
}
</script>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100px);
}
</style>
