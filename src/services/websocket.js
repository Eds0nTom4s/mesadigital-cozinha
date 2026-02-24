import SockJS from 'sockjs-client'
import { Stomp } from '@stomp/stompjs'

class WebSocketService {
  constructor() {
    this.stompClient = null
    this.connected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 5000
  }

  // Conectar ao WebSocket
  connect(cozinhaId, callbacks = {}) {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'
    const token = localStorage.getItem('token')

    if (!token) {
      console.error('Token não disponível para WebSocket')
      return
    }

    const socket = new SockJS(wsUrl)
    this.stompClient = Stomp.over(socket)

    // Desabilitar logs de debug em produção
    this.stompClient.debug = (msg) => {
      if (import.meta.env.DEV) {
        console.log(msg)
      }
    }

    this.stompClient.connect(
      { Authorization: `Bearer ${token}` },
      () => {
        console.log('✅ WebSocket conectado')
        this.connected = true
        this.reconnectAttempts = 0

        // Callback de conexão bem-sucedida
        if (callbacks.onConnect) {
          callbacks.onConnect()
        }

        // Inscrever-se em novos pedidos da cozinha
        this.stompClient.subscribe(
          `/topic/cozinha/${cozinhaId}/novos-pedidos`,
          (message) => {
            const subPedido = JSON.parse(message.body)
            console.log('🔔 Novo pedido recebido:', subPedido)
            
            if (callbacks.onNovoPedido) {
              callbacks.onNovoPedido(subPedido)
            }
          }
        )

        // Inscrever-se em atualizações de pedidos
        this.stompClient.subscribe(
          `/topic/cozinha/${cozinhaId}/atualizacoes`,
          (message) => {
            const subPedido = JSON.parse(message.body)
            console.log('🔄 Pedido atualizado:', subPedido)
            
            if (callbacks.onAtualizacao) {
              callbacks.onAtualizacao(subPedido)
            }
          }
        )
      },
      (error) => {
        console.error('❌ Erro na conexão WebSocket:', error)
        this.connected = false

        // Callback de erro
        if (callbacks.onError) {
          callbacks.onError(error)
        }

        // Tentar reconectar
        this.reconnect(cozinhaId, callbacks)
      }
    )
  }

  // Reconectar ao WebSocket
  reconnect(cozinhaId, callbacks) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`🔄 Tentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      
      setTimeout(() => {
        this.connect(cozinhaId, callbacks)
      }, this.reconnectDelay)
    } else {
      console.error('❌ Máximo de tentativas de reconexão atingido')
      if (callbacks.onMaxReconnectFailed) {
        callbacks.onMaxReconnectFailed()
      }
    }
  }

  // Desconectar do WebSocket
  disconnect() {
    if (this.stompClient && this.connected) {
      this.stompClient.disconnect(() => {
        console.log('🔌 WebSocket desconectado')
        this.connected = false
      })
    }
  }

  // Verificar se está conectado
  isConnected() {
    return this.connected
  }

  // Enviar mensagem (uso futuro)
  send(destination, body) {
    if (this.connected && this.stompClient) {
      this.stompClient.send(destination, {}, JSON.stringify(body))
    } else {
      console.error('WebSocket não está conectado')
    }
  }
}

// Exportar instância única (singleton)
export default new WebSocketService()
