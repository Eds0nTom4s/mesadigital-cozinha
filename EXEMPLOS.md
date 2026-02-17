# 🔧 Exemplos de Código - Extensões Futuras

## 📡 Integração com WebSocket

### Adicionar ao Store (pedidos.js)

```javascript
// Adicionar ao estado
state: () => ({
  pedidos: [],
  websocket: null,
  conectado: false
}),

// Adicionar actions
actions: {
  // Conectar WebSocket
  conectarWebSocket(url = 'ws://localhost:8080/pedidos') {
    this.websocket = new WebSocket(url)
    
    this.websocket.onopen = () => {
      this.conectado = true
      console.log('WebSocket conectado')
    }
    
    this.websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      this.processarMensagem(data)
    }
    
    this.websocket.onerror = (error) => {
      console.error('Erro WebSocket:', error)
      this.conectado = false
    }
    
    this.websocket.onclose = () => {
      this.conectado = false
      console.log('WebSocket desconectado')
      // Reconectar após 5 segundos
      setTimeout(() => this.conectarWebSocket(url), 5000)
    }
  },
  
  // Processar mensagens recebidas
  processarMensagem(data) {
    switch (data.tipo) {
      case 'NOVO_PEDIDO':
        this.pedidos.push(data.pedido)
        break
      case 'ATUALIZAR_STATUS':
        const pedido = this.pedidos.find(p => p.id === data.pedidoId)
        if (pedido) pedido.status = data.novoStatus
        break
      case 'REMOVER_PEDIDO':
        this.pedidos = this.pedidos.filter(p => p.id !== data.pedidoId)
        break
    }
  },
  
  // Desconectar WebSocket
  desconectarWebSocket() {
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
      this.conectado = false
    }
  }
}
```

### Usar no main.js

```javascript
import { usePedidosStore } from './store/pedidos'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

// Conectar WebSocket após montar
const store = usePedidosStore()
store.conectarWebSocket('ws://seu-servidor.com/pedidos')
```

## 🔊 Notificações Sonoras

### Criar Composable (src/composables/useSound.js)

```javascript
import { ref } from 'vue'

export function useSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  
  // Som de notificação
  const playNotification = () => {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }
  
  return { playNotification }
}
```

### Usar no Store

```javascript
import { useSound } from '@/composables/useSound'

// No action processarMensagem
processarMensagem(data) {
  const { playNotification } = useSound()
  
  switch (data.tipo) {
    case 'NOVO_PEDIDO':
      this.pedidos.push(data.pedido)
      playNotification() // Som quando chega novo pedido
      break
  }
}
```

## ⏱️ Temporizador de Pedidos

### Adicionar ao PedidoCard.vue

```vue
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  pedido: Object
})

// Calcular tempo decorrido
const tempoDecorrido = ref(0)
let intervalo = null

const tempoFormatado = computed(() => {
  const minutos = Math.floor(tempoDecorrido.value / 60)
  const segundos = tempoDecorrido.value % 60
  return `${minutos}:${segundos.toString().padStart(2, '0')}`
})

// Cor baseada no tempo
const corTempo = computed(() => {
  if (tempoDecorrido.value < 600) return 'text-status-pronto' // < 10 min
  if (tempoDecorrido.value < 1200) return 'text-status-preparacao' // < 20 min
  return 'text-status-cancelado' // > 20 min
})

onMounted(() => {
  // Calcular tempo inicial
  const [hora, minuto] = props.pedido.hora.split(':')
  const horaPedido = new Date()
  horaPedido.setHours(parseInt(hora), parseInt(minuto), 0)
  
  const atualizarTempo = () => {
    const agora = new Date()
    tempoDecorrido.value = Math.floor((agora - horaPedido) / 1000)
  }
  
  atualizarTempo()
  intervalo = setInterval(atualizarTempo, 1000)
})

onUnmounted(() => {
  if (intervalo) clearInterval(intervalo)
})
</script>

<template>
  <div class="bg-card-bg rounded-xl p-6">
    <!-- Adicionar ao header -->
    <div class="flex justify-between items-start mb-6">
      <div>
        <h3 class="text-3xl font-bold text-text-primary">
          {{ pedido.mesa }}
        </h3>
        <p class="text-xl text-text-secondary">
          {{ pedido.hora }}
        </p>
        <p :class="['text-lg font-bold mt-1', corTempo]">
          ⏱️ {{ tempoFormatado }}
        </p>
      </div>
      <StatusBadge :status="pedido.status" />
    </div>
    
    <!-- resto do componente -->
  </div>
</template>
```

## 🔍 Filtros de Pedidos

### Adicionar ao Store

```javascript
state: () => ({
  pedidos: [],
  filtroAtivo: 'TODOS' // TODOS, NOVO, EM_PREPARACAO, PRONTO
}),

getters: {
  pedidosFiltrados: (state) => {
    if (state.filtroAtivo === 'TODOS') {
      return state.pedidosOrdenados
    }
    return state.pedidosOrdenados.filter(p => p.status === state.filtroAtivo)
  }
},

actions: {
  setFiltro(filtro) {
    this.filtroAtivo = filtro
  }
}
```

### Adicionar Botões de Filtro no KitchenLayout.vue

```vue
<template>
  <div class="min-h-screen bg-dark-bg">
    <header class="bg-card-bg border-b-2 border-text-secondary/20 px-8 py-6">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-4xl font-bold text-text-primary">
          🍳 COZINHA
        </h1>
      </div>
      
      <!-- Botões de filtro -->
      <div class="flex gap-3">
        <button
          @click="store.setFiltro('TODOS')"
          :class="[
            'px-4 py-2 rounded-lg font-semibold transition',
            store.filtroAtivo === 'TODOS' 
              ? 'bg-text-primary text-dark-bg' 
              : 'bg-card-bg text-text-secondary'
          ]"
        >
          Todos ({{ store.pedidos.length }})
        </button>
        
        <button
          @click="store.setFiltro(STATUS.NOVO)"
          :class="[
            'px-4 py-2 rounded-lg font-semibold transition',
            store.filtroAtivo === STATUS.NOVO 
              ? 'bg-status-novo text-dark-bg' 
              : 'bg-card-bg text-text-secondary'
          ]"
        >
          Novos ({{ store.totalNovos }})
        </button>
        
        <!-- Repetir para outros status -->
      </div>
    </header>
    
    <main class="p-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <slot></slot>
      </div>
    </main>
  </div>
</template>

<script setup>
import { usePedidosStore, STATUS } from '@/store/pedidos'
const store = usePedidosStore()
</script>
```

### Atualizar KitchenView.vue

```vue
<script setup>
import { computed } from 'vue'
import KitchenLayout from '@/components/KitchenLayout.vue'
import PedidoCard from '@/components/PedidoCard.vue'
import { usePedidosStore } from '@/store/pedidos'

const store = usePedidosStore()

// Usar pedidosFiltrados ao invés de pedidosOrdenados
const pedidos = computed(() => store.pedidosFiltrados)
</script>

<template>
  <KitchenLayout>
    <PedidoCard
      v-for="pedido in pedidos"
      :key="pedido.id"
      :pedido="pedido"
    />
  </KitchenLayout>
</template>
```

## 📊 API REST (Alternativa ao WebSocket)

### Criar Service (src/services/api.js)

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export const pedidosAPI = {
  // Buscar todos os pedidos
  async listar() {
    const response = await fetch(`${API_URL}/pedidos`)
    return response.json()
  },
  
  // Atualizar status do pedido
  async atualizarStatus(pedidoId, novoStatus) {
    const response = await fetch(`${API_URL}/pedidos/${pedidoId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus })
    })
    return response.json()
  },
  
  // Buscar pedido específico
  async buscar(pedidoId) {
    const response = await fetch(`${API_URL}/pedidos/${pedidoId}`)
    return response.json()
  }
}
```

### Usar no Store

```javascript
import { pedidosAPI } from '@/services/api'

actions: {
  // Sincronizar com backend
  async sincronizarPedidos() {
    try {
      const pedidos = await pedidosAPI.listar()
      this.pedidos = pedidos
    } catch (error) {
      console.error('Erro ao sincronizar:', error)
    }
  },
  
  // Iniciar preparação (com backend)
  async iniciarPreparacao(pedidoId) {
    const pedido = this.pedidos.find(p => p.id === pedidoId)
    if (pedido && pedido.status === STATUS.NOVO) {
      try {
        await pedidosAPI.atualizarStatus(pedidoId, STATUS.EM_PREPARACAO)
        pedido.status = STATUS.EM_PREPARACAO
      } catch (error) {
        console.error('Erro ao atualizar:', error)
      }
    }
  },
  
  // Marcar pronto (com backend)
  async marcarPronto(pedidoId) {
    const pedido = this.pedidos.find(p => p.id === pedidoId)
    if (pedido && pedido.status === STATUS.EM_PREPARACAO) {
      try {
        await pedidosAPI.atualizarStatus(pedidoId, STATUS.PRONTO)
        pedido.status = STATUS.PRONTO
      } catch (error) {
        console.error('Erro ao atualizar:', error)
      }
    }
  }
}
```

### Polling (Atualização Periódica)

```javascript
// No main.js ou na view
import { usePedidosStore } from './store/pedidos'

const store = usePedidosStore()

// Sincronizar a cada 5 segundos
setInterval(() => {
  store.sincronizarPedidos()
}, 5000)
```

## 🌐 Variáveis de Ambiente

### Criar .env

```env
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/pedidos
VITE_POLLING_INTERVAL=5000
```

### Usar no Código

```javascript
const API_URL = import.meta.env.VITE_API_URL
const WS_URL = import.meta.env.VITE_WS_URL
const POLLING = import.meta.env.VITE_POLLING_INTERVAL
```

## 🧪 Testes (Vitest)

### Instalar
```bash
npm install -D vitest @vue/test-utils
```

### Exemplo de Teste (store/pedidos.spec.js)

```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePedidosStore, STATUS } from './pedidos'

describe('Pedidos Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('deve iniciar preparação corretamente', () => {
    const store = usePedidosStore()
    const pedido = store.pedidos[0]
    
    expect(pedido.status).toBe(STATUS.NOVO)
    
    store.iniciarPreparacao(pedido.id)
    
    expect(pedido.status).toBe(STATUS.EM_PREPARACAO)
  })
  
  it('deve marcar como pronto corretamente', () => {
    const store = usePedidosStore()
    const pedido = store.pedidos[1]
    
    expect(pedido.status).toBe(STATUS.EM_PREPARACAO)
    
    store.marcarPronto(pedido.id)
    
    expect(pedido.status).toBe(STATUS.PRONTO)
  })
  
  it('deve ordenar pedidos corretamente', () => {
    const store = usePedidosStore()
    const ordenados = store.pedidosOrdenados
    
    // Novos primeiro
    expect(ordenados[0].status).toBe(STATUS.NOVO)
  })
})
```

---

**Use estes exemplos como base para expandir a aplicação!** 💡
