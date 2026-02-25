import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: []
  }),

  actions: {
    // Adicionar notificação
    add(notification) {
      const id = Date.now() + Math.random()
      const notif = {
        id,
        type: notification.type || 'info', // success, error, warning, info
        title: notification.title || '',
        message: notification.message || '',
        duration: notification.duration || 5000
      }

      this.notifications.push(notif)

      // Auto-remover após duração
      if (notif.duration > 0) {
        setTimeout(() => {
          this.remove(id)
        }, notif.duration)
      }

      return id
    },

    // Remover notificação
    remove(id) {
      this.notifications = this.notifications.filter(n => n.id !== id)
    },

    // Atalhos para tipos específicos
    success(message, title = 'Sucesso') {
      return this.add({ type: 'success', title, message })
    },

    error(message, title = 'Erro') {
      return this.add({ type: 'error', title, message, duration: 7000 })
    },

    warning(message, title = 'Atenção') {
      return this.add({ type: 'warning', title, message })
    },

    info(message, title = 'Informação') {
      return this.add({ type: 'info', title, message })
    }
  }
})
