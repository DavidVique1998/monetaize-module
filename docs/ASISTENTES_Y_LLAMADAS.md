# 📞 Sistema de Asistentes y Llamadas - Estado Actual y Plan Futuro

## 📋 Estado Actual del Sistema

### 1. **Gestión de Asistentes (Agentes)**

#### Funcionalidades Implementadas:

**A. Listado de Asistentes** (`/assistants`)
- ✅ Visualización de todos los agentes de Retell
- ✅ Búsqueda por nombre o ID
- ✅ Filtros: All, Favorites, Imported, Archived (estructura lista, pendiente implementación)
- ✅ Información mostrada:
  - Nombre del agente
  - Modelo LLM (GPT-4o, Gemini, etc.)
  - Fecha de última modificación
  - Estado (Published/Draft)
  - Versión del agente
  - ID del agente

**B. Creación de Asistentes**
- ✅ Modal para crear nuevos asistentes
- ✅ Creación de asistentes en blanco con configuración mínima
- ✅ Integración con Retell LLM
- ✅ Configuración automática de herramientas básicas (end_call)

**C. Edición de Asistentes** (`/assistants/[agentId]`)
- ✅ 4 pestañas principales:
  1. **Builder**: Edición del prompt global
  2. **Voice Lab**: Pruebas de llamadas web en tiempo real
  3. **Chat Lab**: Pruebas de chat con el agente
  4. **Knowledge Lab**: Gestión de base de conocimiento (UI lista, funcionalidad pendiente)

- ✅ Configuración de voz:
  - Selección de voz (VoiceSelector)
  - Ajustes de voz (temperatura, velocidad, volumen)
  - Modelo de voz

- ✅ Configuración de llamadas:
  - Call Settings Modal (estructura lista)
  - Configuración de webhooks
  - Configuración de comportamiento de llamada

- ✅ Publicación de agentes:
  - Botón "Publish Agent" que marca el agente como publicado
  - Validación de estado antes de publicar

#### Arquitectura Técnica:

**Frontend:**
- `src/app/assistants/page.tsx` - Lista principal de asistentes
- `src/app/assistants/[agentId]/page.tsx` - Editor de asistente individual
- `src/hooks/useAgents.ts` - Hook para gestión de agentes
- `src/components/assistants/` - Componentes relacionados

**Backend:**
- `src/lib/retell.ts` - Servicio principal de integración con Retell
- `src/app/api/agents/` - Endpoints API para CRUD de agentes
- `src/app/actions/assistants.ts` - Server actions para creación

**Funciones Clave del Servicio Retell:**
```typescript
RetellService.getAgents()           // Listar todos los agentes
RetellService.getAgent(agentId)     // Obtener un agente específico
RetellService.createAgent(data)     // Crear nuevo agente
RetellService.updateAgent(id, data) // Actualizar agente
RetellService.publishAgent(id)      // Publicar agente
RetellService.deleteAgent(id)       // Eliminar agente
```

### 2. **Sistema de Llamadas Actual**

#### Tipos de Llamadas Implementadas:

**A. Llamadas Web (Web Calls)**
- ✅ Implementado en Voice Lab
- ✅ Interfaz completa con controles:
  - Iniciar/Terminar llamada
  - Mute/Unmute micrófono
  - Mute/Unmute altavoz
  - Contador de duración
- ✅ Integración con `retell-client-js-sdk`
- ✅ Endpoint: `/api/web-call` que crea llamadas web usando `RetellService.createWebCall(agentId)`

**B. Llamadas Telefónicas (Phone Calls)**
- ✅ Endpoint `/api/new-call` para llamadas entrantes de Twilio
- ✅ Integración con Retell usando `RetellService.createCall()`
- ⚠️ **Limitación actual**: Usa un `agentId` fijo desde configuración (`config.retell.agentId`)
- ⚠️ No permite seleccionar dinámicamente qué agente usar

#### Flujo Actual de Llamadas Telefónicas:

```
1. Twilio recibe llamada entrante
2. Twilio llama a /api/new-call
3. Se crea llamada en Retell con agentId fijo (config.retell.agentId)
4. Se conecta vía SIP a LiveKit
```

**Problema Identificado:**
- El sistema actual no permite elegir qué agente usar para cada llamada
- Todos usan el mismo agente configurado en variables de entorno

---

## 🚀 Plan Futuro: Crear Llamadas con Agentes Predefinidos

### Objetivo
Permitir crear llamadas telefónicas (outbound) usando cualquier agente predefinido en Retell, no solo el configurado por defecto.

### Funcionalidades a Implementar

#### 1. **Interfaz de Usuario para Crear Llamadas**

**A. Nueva Página: `/calls` o `/calls/new`**
- Formulario para crear llamada outbound:
  - Selector de agente (dropdown con todos los agentes disponibles)
  - Campo para número de teléfono destino
  - Campo opcional para número de origen
  - Botón "Iniciar Llamada"
  - Lista de llamadas recientes/activas

**B. Integración en Página de Asistentes**
- Botón "Hacer Llamada" en cada agente de la lista
- Modal rápido para ingresar número y hacer llamada
- Acceso directo desde el editor del agente

**C. Dashboard de Llamadas**
- Lista de llamadas activas
- Historial de llamadas
- Estado de cada llamada (en curso, completada, fallida)
- Información de cada llamada:
  - Agente usado
  - Números (origen/destino)
  - Duración
  - Timestamp
  - Estado

#### 2. **Backend: Endpoints API**

**A. Crear Llamada Outbound**
```typescript
POST /api/calls/create
Body: {
  agentId: string,      // ID del agente a usar
  toNumber: string,     // Número destino
  fromNumber?: string,  // Número origen (opcional)
  metadata?: object     // Metadatos adicionales
}
```

**B. Listar Llamadas**
```typescript
GET /api/calls
Query params:
  - agentId?: string    // Filtrar por agente
  - status?: string     // Filtrar por estado
  - limit?: number
  - offset?: number
```

**C. Obtener Detalles de Llamada**
```typescript
GET /api/calls/[callId]
```

**D. Terminar Llamada**
```typescript
POST /api/calls/[callId]/end
```

#### 3. **Servicio Retell: Mejoras**

**A. Función Mejorada para Crear Llamadas**
```typescript
RetellService.createCall({
  agent_id: string,        // Agente específico a usar
  from_number: string,     // Número origen
  to_number: string,       // Número destino
  metadata?: object,       // Metadatos personalizados
  retell_llm_dynamic_variables?: object  // Variables dinámicas
})
```

**B. Gestión de Llamadas Activas**
- Tracking de llamadas en curso
- Almacenamiento en base de datos (Prisma)
- Webhooks para actualizar estado

#### 4. **Base de Datos: Modelo de Llamadas**

**Nuevo Modelo Prisma:**
```prisma
model Call {
  id              String   @id @default(uuid())
  retellCallId    String   @unique  // ID de Retell
  agentId         String   // ID del agente usado
  fromNumber      String
  toNumber        String
  status          String   // "ringing", "in-progress", "completed", "failed"
  direction       String   // "inbound", "outbound"
  duration        Int?     // Duración en segundos
  startedAt       DateTime
  endedAt         DateTime?
  metadata        Json?
  userId          String?
  owner           User?    @relation(fields: [userId], references: [id])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([agentId])
  @@index([status])
  @@index([userId])
}
```

#### 5. **Webhooks de Retell**

**Nuevo Endpoint: `/api/webhooks/retell`**
- Manejar eventos de Retell:
  - `call_started` - Actualizar estado a "in-progress"
  - `call_ended` - Actualizar estado a "completed", guardar duración
  - `call_analyzed` - Guardar análisis de la llamada
  - `call_transcription` - Guardar transcripción

#### 6. **Componentes React**

**A. `CallCreator` Component**
- Formulario para crear llamadas
- Selector de agente
- Validación de números telefónicos
- Feedback visual del estado

**B. `CallList` Component**
- Lista de llamadas con filtros
- Paginación
- Búsqueda

**C. `CallCard` Component**
- Tarjeta individual de llamada
- Información resumida
- Acciones (ver detalles, terminar si está activa)

**D. `ActiveCallMonitor` Component**
- Monitor en tiempo real de llamadas activas
- Actualización automática vía polling o websockets

### Fases de Implementación

#### **Fase 1: Backend Básico** (Prioridad Alta)
1. ✅ Crear modelo Prisma para Call
2. ✅ Migración de base de datos
3. ✅ Extender `RetellService.createCall()` para aceptar `agent_id`
4. ✅ Crear endpoint `/api/calls/create`
5. ✅ Crear endpoint `/api/calls` (listar)
6. ✅ Crear endpoint `/api/webhooks/retell`

#### **Fase 2: Interfaz Básica** (Prioridad Alta)
1. ✅ Crear página `/calls`
2. ✅ Componente `CallCreator`
3. ✅ Componente `CallList`
4. ✅ Integrar selector de agentes

#### **Fase 3: Funcionalidades Avanzadas** (Prioridad Media)
1. ⏳ Dashboard de llamadas con estadísticas
2. ⏳ Filtros avanzados
3. ⏳ Exportación de datos
4. ⏳ Grabaciones de llamadas
5. ⏳ Transcripciones

#### **Fase 4: Mejoras UX** (Prioridad Baja)
1. ⏳ Notificaciones en tiempo real
2. ⏳ Integración con calendario
3. ⏳ Programación de llamadas
4. ⏳ Templates de llamadas

### Consideraciones Técnicas

#### **Seguridad:**
- Validar que el usuario tenga permiso para usar el agente seleccionado
- Validar formato de números telefónicos
- Rate limiting en creación de llamadas
- Autenticación requerida para todos los endpoints

#### **Rendimiento:**
- Caché de lista de agentes
- Paginación en listado de llamadas
- Índices en base de datos para búsquedas rápidas

#### **Manejo de Errores:**
- Validación de números telefónicos
- Manejo de errores de Retell API
- Feedback claro al usuario sobre errores
- Reintentos automáticos para errores transitorios

#### **Testing:**
- Tests unitarios para servicios
- Tests de integración para endpoints
- Tests E2E para flujo completo de creación de llamada

### Ejemplo de Uso Futuro

```typescript
// En el frontend
const createCall = async () => {
  const response = await fetch('/api/calls/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentId: 'agent_123abc',
      toNumber: '+1234567890',
      fromNumber: '+0987654321',
      metadata: {
        campaign: 'sales-outreach',
        customerId: 'cust_456'
      }
    })
  });
  
  const call = await response.json();
  // Llamada iniciada, mostrar estado
};
```

---

## 📝 Resumen

### ✅ Lo que ya funciona:
- Gestión completa de agentes (CRUD)
- Llamadas web para testing (Voice Lab)
- Llamadas telefónicas entrantes (con agente fijo)
- Integración completa con Retell API

### 🚧 Lo que falta:
- Crear llamadas outbound con agente seleccionable
- Interfaz para gestionar llamadas
- Tracking y almacenamiento de llamadas
- Webhooks para actualizar estado en tiempo real

### 🎯 Próximos Pasos Recomendados:
1. Implementar Fase 1 (Backend Básico)
2. Implementar Fase 2 (Interfaz Básica)
3. Testing y refinamiento
4. Implementar fases siguientes según necesidades




