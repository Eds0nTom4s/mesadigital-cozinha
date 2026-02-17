# 🍳 KDS - Kitchen Display System (Cozinha)

Interface operacional para cozinha - Sistema de gestão de pedidos para restaurantes.

## 🎯 Características

- ✅ Interface extremamente simples e funcional
- ✅ Leitura rápida à distância
- ✅ Estados visuais claros (Novo, Em Preparação, Pronto)
- ✅ Apenas 2 ações: Iniciar Preparação e Marcar como Pronto
- ✅ Grid responsivo de pedidos
- ✅ Contador em tempo real por estado
- ✅ Preparado para integração WebSocket

## 🛠️ Stack Tecnológica

- **Vue 3** - Framework frontend
- **Composition API** - API moderna do Vue
- **Pinia** - Gestão de estado
- **Vue Router** - Navegação
- **Tailwind CSS** - Estilização
- **Vite** - Build tool

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build de produção
npm run preview
```

## 🎨 Identidade Visual

### Cores Base
- Fundo: `#1F1F1F` (dark)
- Card: `#2C2C2C`
- Texto principal: `#FFFFFF`
- Texto secundário: `#BDBDBD`

### Estados do Pedido
- 🟠 Novo: `#F2994A`
- 🟡 Em Preparação: `#F2C94C`
- 🟢 Pronto: `#27AE60`
- 🔴 Cancelado: `#EB5757`

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── KitchenLayout.vue    # Layout fullscreen com header e grid
│   ├── PedidoCard.vue        # Card individual do pedido
│   └── StatusBadge.vue       # Badge de estado do pedido
├── store/
│   └── pedidos.js            # Store Pinia com lógica de pedidos
├── views/
│   └── KitchenView.vue       # View principal da cozinha
├── router/
│   └── index.js              # Configuração do Vue Router
├── App.vue                   # Componente raiz
├── main.js                   # Ponto de entrada
└── style.css                 # Estilos globais com Tailwind
```

## 🚀 Funcionalidades

### Pedidos
Cada pedido exibe:
- Número da mesa ou identificador
- Hora do pedido
- Lista de itens com quantidade
- Observações destacadas em laranja
- Estado atual com badge colorido

### Ações Disponíveis
1. **Iniciar Preparação** - Muda status de NOVO para EM_PREPARACAO
2. **Marcar como Pronto** - Muda status de EM_PREPARACAO para PRONTO

### Estados do Pedido
- `NOVO` - Pedido acabou de chegar
- `EM_PREPARACAO` - Cozinha está preparando
- `PRONTO` - Pedido finalizado e pronto para servir

## 💾 Estado Global (Pinia)

O store (`pedidos.js`) contém:
- Lista de pedidos mock
- Getters para ordenação e contadores
- Actions para alterar estados
- Estrutura preparada para WebSocket

```javascript
// Exemplo de uso
import { usePedidosStore } from '@/store/pedidos'

const store = usePedidosStore()
store.iniciarPreparacao(pedidoId)
store.marcarPronto(pedidoId)
```

## 🎯 Próximos Passos

- [ ] Integração com backend real
- [ ] WebSocket para atualizações em tempo real
- [ ] Notificações sonoras para novos pedidos
- [ ] Filtros por tipo de pedido
- [ ] Histórico de pedidos completados
- [ ] Métricas de tempo de preparação
- [ ] Modo noturno adicional

## 📱 Otimização

Interface otimizada para:
- Tablets (tela touch)
- TVs (visualização à distância)
- Monitores grandes (cozinhas profissionais)

## 🔧 Desenvolvimento

```bash
# Estrutura de desenvolvimento
npm run dev  # Inicia servidor em localhost:3000
```

## 📄 Licença

Projeto interno - Uso exclusivo.

---

**Desenvolvido para operação de cozinha profissional - Simplicidade e clareza em primeiro lugar.**
