# 📋 Guia de Utilização - Interface da Cozinha

## 🚀 Como Iniciar

### 1. Instalar Dependências
```bash
cd "/home/centraltec_admin/Documentos/Eng. Margarida/frontend/Cozinha"
npm install
```

### 2. Executar em Desenvolvimento
```bash
npm run dev
```

A aplicação estará disponível em: `http://localhost:3000`

## 🎮 Como Usar a Interface

### Visualização dos Pedidos
- A tela principal exibe todos os pedidos em um grid
- Pedidos são ordenados automaticamente: Novos → Em Preparação → Prontos
- Header mostra contadores em tempo real

### Fluxo de Trabalho

#### 1️⃣ Pedido Novo (Laranja)
- Aparece automaticamente quando chega
- Botão disponível: **"Iniciar Preparação"**
- Clique para começar a preparar

#### 2️⃣ Em Preparação (Amarelo)
- Status muda automaticamente
- Botão disponível: **"Marcar como Pronto"**
- Clique quando terminar de preparar

#### 3️⃣ Pronto (Verde)
- Indica que o pedido está completo
- Sem ações disponíveis
- Aguarda retirada

### Informações no Card
Cada pedido mostra:
- 🏷️ **Mesa/Código**: Identificação do pedido
- 🕐 **Hora**: Quando o pedido foi feito
- 📋 **Itens**: Lista com quantidade
- ⚠️ **Observações**: Destacadas em laranja (ex: "Sem cebola")

## 🎨 Estados Visuais

| Estado | Cor | Badge | Ação Disponível |
|--------|-----|-------|-----------------|
| NOVO | 🟠 Laranja | Novo | Iniciar Preparação |
| EM_PREPARACAO | 🟡 Amarelo | Em Preparação | Marcar como Pronto |
| PRONTO | 🟢 Verde | Pronto | Nenhuma |

## 📊 Dados Mock

Atualmente a aplicação usa dados mock (simulados) em:
- `src/store/pedidos.js`

### Exemplo de Pedido Mock:
```javascript
{
  id: 1,
  mesa: 'Mesa 5',
  hora: '14:23',
  status: 'NOVO',
  itens: [
    { nome: 'Hambúrguer Clássico', quantidade: 2, observacoes: 'Sem cebola' },
    { nome: 'Batata Frita Grande', quantidade: 1, observacoes: '' }
  ]
}
```

## 🔧 Personalização

### Adicionar Mais Pedidos Mock
Edite: `src/store/pedidos.js`

```javascript
state: () => ({
  pedidos: [
    // Adicione novos pedidos aqui
    {
      id: 6,
      mesa: 'Mesa 10',
      hora: '15:00',
      status: STATUS.NOVO,
      itens: [
        { nome: 'Nome do Prato', quantidade: 1, observacoes: '' }
      ]
    }
  ]
})
```

### Alterar Cores
Edite: `tailwind.config.js`

```javascript
colors: {
  'status-novo': '#F2994A',      // Mude para sua cor
  'status-preparacao': '#F2C94C',
  'status-pronto': '#27AE60',
}
```

## 🔌 Integração Futura com Backend

O store está preparado para receber dados reais:

```javascript
// Exemplo de integração futura
actions: {
  async conectarWebSocket() {
    // WebSocket para tempo real
  },
  
  async sincronizarPedidos() {
    // Buscar pedidos da API
  }
}
```

## 📱 Dispositivos Suportados

- ✅ Desktop (monitores grandes)
- ✅ Tablets (touch screen)
- ✅ TVs (visualização à distância)
- ✅ Responsivo para diferentes resoluções

## 🎯 Princípios da Interface

1. **CLAREZA**: Informação visível à distância
2. **VELOCIDADE**: Poucas ações, rápidas
3. **SIMPLICIDADE**: Zero complexidade
4. **OPERACIONAL**: Foco no fluxo de trabalho

## ⚠️ Importante

- Esta é uma **interface operacional**, não administrativa
- Não permite editar pedidos
- Não permite cancelar pedidos
- Apenas reflete o estado do backend

## 🐛 Debug

Para verificar o estado atual:
```javascript
// No console do navegador (F12)
import { usePedidosStore } from '@/store/pedidos'
const store = usePedidosStore()
console.log(store.pedidos)
console.log(store.pedidosOrdenados)
```

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- README.md - Documentação técnica
- src/store/pedidos.js - Lógica de negócio
- src/components/ - Componentes individuais

---

**Interface pronta para uso operacional imediato!** 🎉
