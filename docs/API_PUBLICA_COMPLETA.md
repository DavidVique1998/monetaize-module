# 📚 API Pública Completa - CAMIA

Documentación completa de todos los endpoints públicos de la API de CAMIA para llamadas, agentes, tokens y más.

## 🔐 Autenticación

Todos los endpoints públicos requieren autenticación mediante **JWT (JSON Web Token)** en el header `Authorization`:

```
Authorization: Bearer <tu_token_jwt>
```

---

## 🔑 Tokens

### 1. Generar Token JWT (Autenticado)

**Endpoint:** `POST /api/profile/token`

**Descripción:** Genera o obtiene un token JWT permanente para el usuario autenticado. El token se persiste en la base de datos y se reutiliza en solicitudes posteriores.

**Autenticación:** Requiere sesión activa (cookie de sesión)

**Headers:**
```
Content-Type: application/json
Cookie: monetaize_session=<session_token>
```

**Body (opcional):**
```json
{
  "permanent": true  // Siempre se genera como permanente
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "Nombre Usuario",
      "ghlLocationId": "location-id",
      "ghlCompanyId": "company-id",
      "ghlLocationName": "Nombre Location"
    }
  }
}
```

**Errores:**
- `401 Unauthorized`: No hay sesión activa
- `404 Not Found`: Usuario no encontrado
- `500 Internal Server Error`: Error del servidor

---

### 2. Obtener Token por Location ID (Público)

**Endpoint:** `GET /api/profile/token?locationId=<location_id>`

**Descripción:** Obtiene el token persistente para una ubicación específica. No requiere autenticación previa, pero valida que la ubicación exista.

**Autenticación:** No requiere (público)

**Query Parameters:**
- `locationId` (requerido): ID de la ubicación de GoHighLevel

**Alternativa:** Puedes enviar `locationId` en headers:
- `x-location-id: <location_id>`
- `location-id: <location_id>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "Nombre Usuario",
      "ghlLocationId": "location-id",
      "ghlCompanyId": "company-id",
      "ghlLocationName": "Nombre Location"
    }
  }
}
```

**Errores:**
- `400 Bad Request`: locationId no proporcionado
- `404 Not Found`: Usuario/location no encontrado
- `500 Internal Server Error`: Error del servidor

**Ejemplo:**
```bash
curl -X GET "https://tu-dominio.com/api/profile/token?locationId=abc123" \
  -H "Content-Type: application/json"
```

---

## 🤖 Agentes

### 1. Listar Agentes

**Endpoint:** `GET /api/public/agents`

**Descripción:** Obtiene la lista de todos los agentes del usuario autenticado.

**Autenticación:** JWT Token requerido

**Headers:**
```
Authorization: Bearer <tu_token_jwt>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "agent_id": "oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD",
      "agent_name": "Mi Agente de Ventas",
      "language": "es-ES",
      "voice_id": "11labs-Jenny",
      "enable_transcription": true,
      "enable_recording": true,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Errores:**
- `401 Unauthorized`: Token inválido o expirado
- `500 Internal Server Error`: Error del servidor

**Ejemplo:**
```bash
curl -X GET "https://tu-dominio.com/api/public/agents" \
  -H "Authorization: Bearer tu_token_jwt"
```

---

### 2. Listar Agentes en Formato GHL

**Endpoint:** `POST /api/public/agents/ghl`

**Descripción:** Obtiene la lista de agentes en formato compatible con GoHighLevel (GHL) para usar en workflows y acciones.

**Autenticación:** JWT Token requerido

**Headers:**
```
Authorization: Bearer <tu_token_jwt>
Content-Type: application/json
```

**Body (opcional):**
```json
{
  "locationId": "string (opcional)"  // Filtrar por location ID
}
```

**Response (200 OK):**
```json
{
  "inputs": [
    {
      "section": "Personal Info",
      "fields": [
        {
          "field": "agent_id",
          "title": "Agente",
          "fieldType": "select",
          "required": true,
          "options": [
            {
              "label": "Mi Agente de Ventas",
              "value": "oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD"
            },
            {
              "label": "Agente de Soporte",
              "value": "abc123xyz789"
            }
          ]
        }
      ]
    }
  ]
}
```

**Errores:**
- `401 Unauthorized`: Token inválido o expirado
- `500 Internal Server Error`: Error del servidor

**Ejemplo:**
```bash
curl -X POST "https://tu-dominio.com/api/public/agents/ghl" \
  -H "Authorization: Bearer tu_token_jwt" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Ejemplo con filtro:**
```bash
curl -X POST "https://tu-dominio.com/api/public/agents/ghl" \
  -H "Authorization: Bearer tu_token_jwt" \
  -H "Content-Type: application/json" \
  -d '{
    "locationId": "abc123"
  }'
```

---

## 📞 Llamadas Telefónicas

### 1. Crear Llamada Telefónica

**Endpoint:** `POST /api/public/calls/create`

**Descripción:** Crea una llamada telefónica outbound usando un agente específico de Retell AI.

**Autenticación:** JWT Token requerido

**Headers:**
```
Authorization: Bearer <tu_token_jwt>
Content-Type: application/json
```

**Body:**
```json
{
  "agent_id": "string (requerido)",           // ID del agente de Retell a usar
  "to_number": "string (requerido)",          // Número destino en formato E.164 (ej: +1234567890)
  "from_number": "string (opcional)",        // Número origen en formato E.164
  "agent_version": "number (opcional)",       // Versión específica del agente
  "retell_llm_dynamic_variables": {           // Variables dinámicas para el LLM (opcional)
    "customer_name": "John Doe",
    "order_id": "12345"
  },
  "metadata": {                               // Metadatos adicionales (opcional)
    "campaign": "sales-outreach",
    "customerId": "cust_456"
  },
  "custom_sip_headers": {                     // Headers SIP personalizados (opcional)
    "X-Custom-Header": "Custom Value"
  }
}
```

**Parámetros Detallados:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `agent_id` | string | ✅ Sí | ID del agente de Retell a usar para la llamada |
| `to_number` | string | ✅ Sí | Número destino en formato E.164 (ej: `+1234567890`) |
| `from_number` | string | ❌ No | Número origen en formato E.164. Si no se proporciona, Retell usará el número por defecto |
| `agent_version` | number | ❌ No | Versión específica del agente a usar |
| `retell_llm_dynamic_variables` | object | ❌ No | Variables dinámicas que se pasarán al LLM durante la llamada |
| `metadata` | object | ❌ No | Metadatos adicionales para la llamada |
| `custom_sip_headers` | object | ❌ No | Headers SIP personalizados |

**Formato de Números Telefónicos:**

Todos los números deben estar en formato **E.164**:
- Comienza con `+`
- Seguido del código de país (1-3 dígitos)
- Seguido del número local
- Ejemplos válidos: `+1234567890`, `+521234567890`

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "call_id": "Jabr9TXYYJHfvl6Syypi88rdAHYHmcq6",
    "agent_id": "oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD",
    "agent_name": "My Agent",
    "agent_version": 1,
    "from_number": "+1987654321",
    "to_number": "+1234567890",
    "call_status": "registered",
    "call_type": "phone_call",
    "direction": "outbound",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Errores:**
- `400 Bad Request`: Datos inválidos (formato de número incorrecto, agente no encontrado, etc.)
- `401 Unauthorized`: Token inválido o expirado
- `404 Not Found`: Agente no encontrado o no pertenece a tu cuenta
- `500 Internal Server Error`: Error del servidor

**Ejemplo:**
```bash
curl -X POST "https://tu-dominio.com/api/public/calls/create" \
  -H "Authorization: Bearer tu_token_jwt" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD",
    "to_number": "+1234567890",
    "from_number": "+1987654321",
    "retell_llm_dynamic_variables": {
      "customer_name": "John Doe",
      "order_id": "12345"
    },
    "metadata": {
      "campaign": "sales-outreach"
    }
  }'
```

---

### 2. Obtener Información de una Llamada

**Endpoint:** `GET /api/public/calls/{callId}`

**Descripción:** Obtiene información detallada de una llamada específica, incluyendo transcripción, grabación, costos y análisis.

**Autenticación:** JWT Token requerido

**Headers:**
```
Authorization: Bearer <tu_token_jwt>
```

**Parámetros de URL:**
- `callId` (requerido): ID de la llamada en Retell

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "call_id": "Jabr9TXYYJHfvl6Syypi88rdAHYHmcq6",
    "call_type": "phone_call",
    "from_number": "+1987654321",
    "to_number": "+1234567890",
    "direction": "outbound",
    "agent_id": "oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD",
    "agent_name": "My Agent",
    "agent_version": 1,
    "call_status": "ended",
    "start_timestamp": 1703302407333,
    "end_timestamp": 1703302428855,
    "duration_ms": 10000,
    "transcript": "Agent: hi how are you doing?\nUser: Doing pretty well...",
    "recording_url": "https://retellai.s3.us-west-2.amazonaws.com/.../recording.wav",
    "recording_multi_channel_url": "https://retellai.s3.us-west-2.amazonaws.com/.../recording_multichannel.wav",
    "call_cost": {
      "combined_cost": 0.05,
      "total_duration_seconds": 10
    },
    "llm_token_usage": {
      "average": 150,
      "values": [150]
    },
    "disconnection_reason": "agent_hangup",
    "call_analysis": {
      "call_summary": "The agent called the user...",
      "sentiment": "positive"
    },
    "latency": {
      "e2e": {
        "p50": 800,
        "p90": 1200
      }
    }
  }
}
```

**Errores:**
- `400 Bad Request`: callId no proporcionado
- `401 Unauthorized`: Token inválido o expirado
- `404 Not Found`: Llamada no encontrada o no pertenece a tu cuenta
- `500 Internal Server Error`: Error del servidor

**Ejemplo:**
```bash
curl -X GET "https://tu-dominio.com/api/public/calls/Jabr9TXYYJHfvl6Syypi88rdAHYHmcq6" \
  -H "Authorization: Bearer tu_token_jwt"
```

---

## 💬 Chat / Web Calls

### 1. Crear Chat

**Endpoint:** `POST /api/chat/create`

**Descripción:** Crea una sesión de chat con un agente de IA. No requiere autenticación JWT, pero consume créditos del wallet del usuario.

**Autenticación:** No requiere JWT (público, pero valida agente)

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "agentId": "string (requerido)"  // ID del agente de Retell
}
```

**Response (200 OK):**
```json
{
  "chat_id": "chat_abc123xyz",
  "agent_id": "oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD",
  "chat_status": "active",
  "ephemeral_agent_id": "ephemeral_agent_123"
}
```

**Errores:**
- `400 Bad Request`: agentId no proporcionado
- `500 Internal Server Error`: Error del servidor

**Ejemplo:**
```bash
curl -X POST "https://tu-dominio.com/api/chat/create" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD"
  }'
```

---

### 2. Enviar Mensaje en Chat

**Endpoint:** `POST /api/chat/send-message`

**Descripción:** Envía un mensaje en una sesión de chat activa. Requiere autenticación y consume créditos del wallet.

**Autenticación:** Requiere sesión activa (cookie de sesión)

**Headers:**
```
Content-Type: application/json
Cookie: monetaize_session=<session_token>
```

**Body:**
```json
{
  "chatId": "string (requerido)",    // ID del chat
  "content": "string (requerido)"    // Contenido del mensaje
}
```

**Response (200 OK):**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hola, ¿cómo estás?"
    },
    {
      "role": "assistant",
      "content": "¡Hola! Estoy muy bien, gracias por preguntar. ¿En qué puedo ayudarte hoy?"
    }
  ]
}
```

**Errores:**
- `400 Bad Request`: chatId o content no proporcionados
- `401 Unauthorized`: No hay sesión activa
- `402 Payment Required`: Balance insuficiente
- `500 Internal Server Error`: Error del servidor

**Ejemplo:**
```bash
curl -X POST "https://tu-dominio.com/api/chat/send-message" \
  -H "Content-Type: application/json" \
  -H "Cookie: monetaize_session=tu_session_token" \
  -d '{
    "chatId": "chat_abc123xyz",
    "content": "Hola, ¿cómo estás?"
  }'
```

---

### 3. Crear Web Call

**Endpoint:** `POST /api/web-call`

**Descripción:** Crea una llamada web (video/audio) con un agente de IA. Requiere autenticación.

**Autenticación:** Requiere sesión activa (cookie de sesión)

**Headers:**
```
Content-Type: application/json
Cookie: monetaize_session=<session_token>
```

**Body:**
```json
{
  "agentId": "string (requerido)"  // ID del agente de Retell
}
```

**Response (200 OK):**
```json
{
  "access_token": "web_call_access_token_123",
  "call_id": "web_call_abc123",
  "agent_id": "oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD"
}
```

**Errores:**
- `400 Bad Request`: agentId no proporcionado
- `401 Unauthorized`: No hay sesión activa
- `500 Internal Server Error`: Error del servidor

**Ejemplo:**
```bash
curl -X POST "https://tu-dominio.com/api/web-call" \
  -H "Content-Type: application/json" \
  -H "Cookie: monetaize_session=tu_session_token" \
  -d '{
    "agentId": "oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD"
  }'
```

---

## 📊 Resumen de Endpoints

### Autenticación y Tokens
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| `POST` | `/api/profile/token` | Sesión | Generar/obtener token JWT |
| `GET` | `/api/profile/token?locationId=...` | Público | Obtener token por location ID |

### Agentes
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| `GET` | `/api/public/agents` | JWT | Listar agentes del usuario |
| `POST` | `/api/public/agents/ghl` | JWT | Listar agentes en formato GHL |

### Llamadas Telefónicas
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| `POST` | `/api/public/calls/create` | JWT | Crear llamada telefónica |
| `GET` | `/api/public/calls/{callId}` | JWT | Obtener información de llamada |

### Chat y Web Calls
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| `POST` | `/api/chat/create` | Público | Crear sesión de chat |
| `POST` | `/api/chat/send-message` | Sesión | Enviar mensaje en chat |
| `POST` | `/api/web-call` | Sesión | Crear llamada web |

---

## 🔒 Seguridad

### Tokens JWT
- Los tokens JWT son permanentes y no expiran
- Se almacenan en la base de datos y se reutilizan
- Solo se pueden regenerar desde el perfil del usuario
- **Importante:** Guarda tu token de forma segura, ya que proporciona acceso completo a tu cuenta

### Validación de Propiedad
- Todos los endpoints validan que los recursos (agentes, llamadas) pertenezcan al usuario autenticado
- No es posible acceder a recursos de otros usuarios

### Formato de Números
- Todos los números telefónicos deben estar en formato E.164
- Validación estricta en todos los endpoints

---

## 📝 Notas Adicionales

### Variables Dinámicas del LLM
Las variables dinámicas (`retell_llm_dynamic_variables`) permiten pasar información contextual al agente durante la llamada:

```json
{
  "retell_llm_dynamic_variables": {
    "customer_name": "John Doe",
    "order_id": "12345",
    "product": "iPhone 15",
    "price": "$999"
  }
}
```

Estas variables estarán disponibles para el agente durante la conversación.

### Metadatos
Los metadatos se almacenan junto con la llamada y pueden usarse para:
- Tracking de campañas
- Asociación con contactos
- Análisis y reportes
- Integración con sistemas externos

### Costos
- Las llamadas telefónicas consumen créditos según la duración y uso de LLM
- Los chats consumen créditos por mensaje
- Los web calls consumen créditos según la duración

---

## 🚀 Ejemplos de Integración

### Ejemplo Completo: Crear Llamada con Variables

```bash
# 1. Obtener token
TOKEN=$(curl -X POST "https://tu-dominio.com/api/profile/token" \
  -H "Content-Type: application/json" \
  -H "Cookie: monetaize_session=tu_session" \
  | jq -r '.data.token')

# 2. Crear llamada
curl -X POST "https://tu-dominio.com/api/public/calls/create" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD",
    "to_number": "+1234567890",
    "from_number": "+1987654321",
    "retell_llm_dynamic_variables": {
      "customer_name": "John Doe",
      "order_id": "12345"
    },
    "metadata": {
      "campaign": "sales-outreach"
    }
  }'

# 3. Consultar estado de la llamada
CALL_ID="Jabr9TXYYJHfvl6Syypi88rdAHYHmcq6"
curl -X GET "https://tu-dominio.com/api/public/calls/$CALL_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📞 Soporte

Para más información o soporte, contacta al equipo de CAMIA.

**Última actualización:** Enero 2025
