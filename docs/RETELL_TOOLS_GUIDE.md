# 🔧 Guía: Tools/Functions en Retell AI

## 📖 Introducción

Retell AI **NO tiene un campo directo "tools" o "functions"** como otros servicios (OpenAI, Anthropic, etc.), pero puedes integrar herramientas de múltiples maneras según tus necesidades.

## 🎯 Métodos para Implementar Tools

### **Método 1: Via Prompts** ⭐ (Más Simple)

Descubre las herramientas disponibles en el prompt del agente.

#### Ventajas:
- ✅ Fácil de implementar
- ✅ No requiere configuración adicional
- ✅ El agente puede mencionar herramientas naturalmente

#### Desventajas:
- ❌ No hay validación automática de parámetros
- ❌ Las herramientas no se ejecutan automáticamente
- ❌ Requiere procesamiento manual del webhook

#### Ejemplo de Implementación:

```typescript
import { RetellService } from '@/lib/retell';

const agentData = {
  agent_name: 'Customer Service with Tools',
  voice_id: '11labs-Adrian',
  response_engine: { type: 'retell-llm' },
  language: 'en-US',
  
  prompt: `You are a customer service agent with access to these tools:

TOOLS AVAILABLE:
1. get_weather(location: string)
2. schedule_appointment(date, time, service)
3. check_order_status(order_id: string)
4. cancel_order(order_id: string)

INSTRUCTIONS:
- When you need to use a tool, say "Let me check that for you"
- Webhooks will handle the actual execution
- Always confirm results with the user`,
  
  webhook_url: 'https://your-api.com/retell-webhook',
  webhook_events: ['call_started', 'call_ended', 'call_analyzed'],
};

const agent = await RetellService.createAdvancedAgent(agentData);
```

---

### **Método 2: Via Custom LLM** 🔌 (Más Poderoso)

Usa un LLM personalizado configurado en Retell con soporte de functions/tools.

#### Ventajas:
- ✅ Soporte para llamadas a funciones estructurado
- ✅ Validación de parámetros
- ✅ Integración directa con APIs

#### Desventajas:
- ❌ Requiere configuración previa en el dashboard de Retell
- ❌ Más complejo de configurar

#### Ejemplo de Implementación:

```typescript
const agentData = {
  agent_name: 'Agent with Custom LLM',
  voice_id: '11labs-Sarah',
  
  // Usar tu LLM personalizado configurado en Retell
  response_engine: {
    type: 'custom-llm',
    llm_id: 'your-custom-llm-id', // Configurado en dashboard
  },
  
  webhook_url: 'https://your-api.com/custom-llm-handler',
};

const agent = await RetellService.createAdvancedAgent(agentData);
```

---

### **Método 3: Via Webhooks** 🌐 (Más Flexible)

Maneja la ejecución de herramientas mediante tu propio backend webhook.

#### Ventajas:
- ✅ Control del proceso
- ✅ Integración con cualquier sistema externo
- ✅ Ejecución de lógica compleja

#### Desventajas:
- ❌ Requiere infraestructura de backend
- ❌ Más implementación manual

#### Estructura del Webhook:

```typescript
// app/api/retell-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const data = await request.json();
  
  // Eventos disponibles: 'call_started', 'call_ended', 'call_analyzed', 'function_call'
  const { event, ...payload } = data;
  
  switch (event) {
    case 'function_call':
      // El agente necesita ejecutar una función
      const toolName = payload.tool_name;
      const params = payload.params;
      
      // Ejecutar la función
      const result = await executeTool(toolName, params);
      
      return NextResponse.json({
        action: 'modify_response',
        response: result,
      });
    
    case 'call_ended':
      // Análisis post-llamada
      console.log('Call ended:', payload);
      break;
  }
  
  return NextResponse.json({ success: true });
}

// Función helper para ejecutar tools
async function executeTool(toolName: string, params: any) {
  switch (toolName) {
    case 'get_weather':
      // Llamada a API de clima
      return await fetch(`https://api.weather.com/...`);
      
    case 'check_order_status':
      // Consultar base de datos de órdenes
      return await db.orders.find({ order_id: params.order_id });
      
    default:
      return 'Tool not available';
  }
}
```

---

### **Método 4: Via Dynamic Variables** 📊 (Para Datos Estáticos)

Pasa datos precalculados al agente usando variables dinámicas.

#### Ventajas:
- ✅ Simple para datos conocidos
- ✅ Sin llamadas a APIs durante la llamada

#### Desventajas:
- ❌ No sirve para datos en tiempo real
- ❌ Los datos son fijos por llamada

#### Ejemplo:

```typescript
const agentData = {
  agent_name: 'Agent with Pre-loaded Data',
  voice_id: '11labs-Adrian',
  response_engine: { type: 'retell-llm' },
  language: 'en-US',
  
  // Variables disponibles durante la llamada
  dynamic_variables: {
    user_name: 'John Doe',
    user_order_count: '5',
    available_products: 'Product A, Product B, Product C',
    current_promotion: '20% off all items this week',
  },
};
```

---

## 🏗️ Arquitectura Recomendada

### **Flujo Completo con Tools:**

```
┌─────────────────┐
│   Retell Agent  │
│   (El agente)   │
└────────┬────────┘
         │
         │ Usuario: "¿Cuál es el estado de mi orden #123?"
         ↓
┌─────────────────────────────┐
│     Retell AI Platform      │
│  (Processa la solicitud)    │
└────────┬────────────────────┘
         │
         │ Detecta necesidad de tool
         ↓
┌─────────────────────────────┐
│   Tu Webhook Backend        │
│  (API Route Handler)        │
├─────────────────────────────┤
│ 1. Detecta tool requerido   │
│ 2. Valida parámetros        │
│ 3. Ejecuta función externa  │
│ 4. Retorna resultado        │
└────────┬────────────────────┘
         │
         │ Resultado: "Tu orden está en tránsito"
         ↓
┌─────────────────────────────┐
│   Retell Agent contesta     │
│ "Tu orden #123 está..."     │
└─────────────────────────────┘
```

---

## 💡 Casos de Uso Comunes

### **1. Agente de E-commerce**

```typescript
const ecommerceAgent = {
  agent_name: 'E-commerce Support',
  voice_id: '11labs-Adrian',
  response_engine: { type: 'retell-llm' },
  
  prompt: `You are an e-commerce support agent with these tools:

TOOLS:
- check_order(order_id) - Check order status
- track_shipment(tracking_number) - Track package
- initiate_refund(order_id, reason) - Start refund process
- update_delivery_address(order_id, new_address) - Change address

Always confirm with the customer before using tools.`,
  
  boosted_keywords: ['order', 'shipment', 'tracking', 'refund', 'delivery'],
  webhook_url: 'https://your-store.com/api/retell-tools',
};
```

### **2. Agente de Citas Médicas**

```typescript
const appointmentAgent = {
  agent_name: 'Medical Appointment Scheduler',
  voice_id: '11labs-Sarah',
  response_engine: { type: 'retell-llm' },
  
  prompt: `You are a medical appointment scheduler with these tools:

TOOLS:
- check_availability(date, doctor_id) - Check doctor availability
- book_appointment(date, time, patient_id, doctor_id) - Book appointment
- reschedule_appointment(appointment_id, new_date) - Reschedule
- cancel_appointment(appointment_id) - Cancel

Always confirm patient details before booking.`,
  
  webhook_url: 'https://your-clinic.com/api/appointments',
};
```

### **3. Agente de Información en Tiempo Real**

```typescript
const weatherAgent = {
  agent_name: 'Weather Information Agent',
  voice_id: 'openai-Alloy',
  response_engine: { type: 'custom-llm', llm_id: 'custom-weather-llm' },
  
  dynamic_variables: {
    supported_cities: 'New York, Los Angeles, Chicago, Houston',
  },
  
  webhook_url: 'https://weather-api.com/retell',
};
```

---

## 🎨 Best Practices

### ✅ **DO's:**

1. **Describe claramente las tools en el prompt**
   - Incluye qué hace cada tool
   - Indica cuándo usarla
   - Ejemplos de uso

2. **Usa boosted_keywords**
   - Ayudan al agente a detectar cuándo usar herramientas

3. **Implementa validación en webhooks**
   - Valida parámetros antes de ejecutar
   - Maneja errores gracefully

4. **Usa post_call_analysis**
   - Tracking de herramientas usadas
   - Métricas de efectividad

### ❌ **DON'Ts:**

1. **No asumas que las tools se ejecutan automáticamente**
   - Siempre requiere webhook o custom LLM

2. **No pongas mucha lógica compleja en el prompt**
   - Mantén el prompt enfocado en comportamiento

3. **No olvides manejar errores**
   - Siempre maneja casos de falla

---

## 📚 Recursos Adicionales

### **Documentación Oficial:**
- [Retell AI Documentation](https://docs.retellai.com)
- [Custom LLM Setup](https://docs.retellai.com/custom-llm)
- [Webhook Events](https://docs.retellai.com/webhooks)

### **Ejemplos en el Proyecto:**
- `src/examples/retell-tools-example.ts` - Ejemplos completos
- `src/lib/retell.ts` - Service principal
- `src/examples/advanced-agent-example.ts` - Agentes avanzados

---

## 🚀 Próximos Pasos

1. Revisa los ejemplos en `src/examples/retell-tools-example.ts`
2. Configura tu primer webhook en `app/api/retell-webhook/route.ts`
3. Crea un agente de prueba con tools
4. Implementa herramientas según tu caso de uso

¡Listo para comenzar a integrar tools en tus agentes de Retell AI! 🎉
