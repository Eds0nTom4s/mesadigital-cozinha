# 🏗️ Arquitetura dos Componentes

## Hierarquia Visual

```
App.vue
  └── router-view
       └── KitchenView.vue
            └── KitchenLayout.vue
                 └── PedidoCard.vue (múltiplos)
                      └── StatusBadge.vue
```

## 📊 Diagrama Detalhado

```
┌─────────────────────────────────────────────────┐
│                   App.vue                        │
│              (Componente Raiz)                   │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│              Vue Router                          │
│           (Gestão de Rotas)                      │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│            KitchenView.vue                       │
│         (View Principal da Cozinha)              │
│                                                  │
│  - Obtém pedidos do store                       │
│  - Passa para o layout                          │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│          KitchenLayout.vue                       │
│        (Layout com Header + Grid)                │
│                                                  │
│  ┌────────────────────────────────────┐         │
│  │         HEADER                      │         │
│  │  🍳 COZINHA  |  Contadores          │         │
│  └────────────────────────────────────┘         │
│                                                  │
│  ┌────────────────────────────────────┐         │
│  │         GRID DE PEDIDOS             │         │
│  │  <slot> - recebe PedidoCard's       │         │
│  └────────────────────────────────────┘         │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────┴──────────┬──────────┐
        │                    │          │
        ▼                    ▼          ▼
┌──────────────┐    ┌──────────────┐  ┌──────────────┐
│ PedidoCard   │    │ PedidoCard   │  │ PedidoCard   │
│              │    │              │  │              │
│ ┌──────────┐ │    │ ┌──────────┐ │  │ ┌──────────┐ │
│ │StatusBadge│ │    │ │StatusBadge│ │  │ │StatusBadge│ │
│ └──────────┘ │    │ └──────────┘ │  │ └──────────┘ │
│              │    │              │  │              │
│ Itens do     │    │ Itens do     │  │ Itens do     │
│ Pedido       │    │ Pedido       │  │ Pedido       │
│              │    │              │  │              │
│ [Botões]     │    │ [Botões]     │  │ [Botões]     │
└──────────────┘    └──────────────┘  └──────────────┘
```

## 🧩 Responsabilidades dos Componentes

### App.vue
- Componente raiz
- Apenas renderiza o `<router-view>`
- Sem lógica de negócio

### KitchenView.vue
- View principal
- Conecta com Pinia store
- Obtém lista de pedidos ordenados
- Passa dados para KitchenLayout

### KitchenLayout.vue
- Layout fullscreen
- Header com título e contadores
- Grid responsivo para cards
- Usa `<slot>` para receber pedidos

### PedidoCard.vue
- Card individual do pedido
- Exibe informações completas
- Gerencia ações (botões)
- Comunica com store via actions
- Usa StatusBadge para exibir estado

### StatusBadge.vue
- Badge visual do estado
- Recebe prop: `status`
- Retorna cor e texto correspondentes
- Componente puramente presentacional

## 🗄️ Gestão de Estado (Pinia)

```
┌─────────────────────────────────────────────────┐
│            usePedidosStore (Pinia)               │
│                                                  │
│  STATE:                                          │
│  ├─ pedidos: []           (lista mock)           │
│                                                  │
│  GETTERS:                                        │
│  ├─ pedidosOrdenados      (ordenação automática)│
│  ├─ totalNovos            (contador)             │
│  ├─ totalEmPreparacao     (contador)             │
│  └─ totalProntos          (contador)             │
│                                                  │
│  ACTIONS:                                        │
│  ├─ iniciarPreparacao()   (NOVO → EM_PREPARACAO)│
│  └─ marcarPronto()        (EM_PREPARACAO → PRONTO)│
│                                                  │
└─────────────────────────────────────────────────┘
           ▲                          │
           │                          │
           │                          ▼
     ┌─────────┐              ┌──────────────┐
     │ Leitura │              │ Modificação  │
     │ (Views) │              │ (Actions)    │
     └─────────┘              └──────────────┘
```

## 🔄 Fluxo de Dados

### Leitura (Top-Down)
```
Store (pedidos.js)
  ↓
KitchenView (computed: pedidosOrdenados)
  ↓
KitchenLayout (slot)
  ↓
PedidoCard (props: pedido)
  ↓
StatusBadge (props: status)
```

### Escrita (Bottom-Up)
```
PedidoCard (click no botão)
  ↓
store.iniciarPreparacao(id) ou store.marcarPronto(id)
  ↓
Store atualiza o estado
  ↓
Vue reage automaticamente
  ↓
Interface atualiza
```

## 🎯 Padrões de Comunicação

### Props (Pai → Filho)
```javascript
// KitchenView → PedidoCard
<PedidoCard :pedido="pedido" />

// PedidoCard → StatusBadge
<StatusBadge :status="pedido.status" />
```

### Actions (Componente → Store)
```javascript
// PedidoCard
const store = usePedidosStore()
store.iniciarPreparacao(pedido.id)
```

### Reactivity (Store → Componentes)
```javascript
// Qualquer componente
const pedidosOrdenados = computed(() => store.pedidosOrdenados)
// Atualiza automaticamente quando store muda
```

## 📦 Imports e Dependências

### main.js
```
main.js
  ├─ import Vue
  ├─ import Pinia
  ├─ import Router
  ├─ import App.vue
  └─ import style.css (Tailwind)
```

### Cada Componente
```
Componente.vue
  ├─ import { ref, computed } from 'vue'
  ├─ import outros componentes
  └─ import { usePedidosStore, STATUS } from '@/store/pedidos'
```

## 🎨 Styling

### Abordagem
- **Tailwind CSS**: Classes utilitárias
- **Tema customizado**: Cores no tailwind.config.js
- **Global**: style.css para resets
- **Scoped**: Nada de `<style scoped>` necessário

### Exemplo
```vue
<template>
  <div class="bg-card-bg text-text-primary p-6 rounded-xl">
    <!-- Usa classes do Tailwind com cores customizadas -->
  </div>
</template>
```

## 🚀 Extensibilidade

### Adicionar Novo Componente
1. Criar em `src/components/`
2. Importar onde necessário
3. Passar dados via props
4. Emitir eventos se necessário (não usado atualmente)

### Adicionar Nova View
1. Criar em `src/views/`
2. Adicionar rota em `router/index.js`
3. Usar `<router-link>` para navegar

### Adicionar Novo Estado
1. Adicionar ao store em `store/pedidos.js`
2. Criar getter se necessário
3. Criar action para modificar
4. Componentes reagem automaticamente

---

**Arquitetura simples, clara e preparada para crescer.** 🚀
