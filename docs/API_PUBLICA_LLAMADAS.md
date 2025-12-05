# API Pública de Llamadas

Esta documentación describe los endpoints públicos para crear y consultar llamadas telefónicas usando agentes de Retell AI.

## Autenticación

Todos los endpoints requieren autenticación mediante **JWT (JSON Web Token)** en el header `Authorization`:

```
Authorization: Bearer <tu_token_jwt>
```

### Obtener un Token

Los tokens se pueden generar desde el perfil del usuario:

**Endpoint:** `POST /api/profile/token`

**Headers:**
```
Content-Type: application/json
```

**Body (opcional):**
```json
{
  "permanent": true  // Si es true, el token no expirará (recomendado para APIs)
}
```

**Response:**
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
      "ghlLocationName": "Nombre Location"
    }
  }
}
```

**Importante:** 
- Los tokens permanentes (`permanent: true`) no expiran y solo se pueden actualizar desde el perfil del usuario.
- Los tokens temporales expiran después de 30 días (configurable).
- Guarda tu token de forma segura, ya que proporciona acceso completo a tu cuenta.

---

## Endpoints

### 1. Crear Llamada Telefónica

**Endpoint:** `POST /api/public/calls/create`

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
  "from_number": "string (opcional)",         // Número origen en formato E.164
  "agent_version": "number (opcional)",       // Versión específica del agente
  "retell_llm_dynamic_variables": {           // Variables dinámicas para el LLM (opcional)
    "customer_name": "John Doe",
    "order_id": "12345"
  },
  "metadata": {                               // Metadatos adicionales (opcional)
    "custom_field": "value"
  },
  "custom_sip_headers": {                     // Headers SIP personalizados (opcional)
    "X-Custom-Header": "Custom Value"
  }
}
```

**Ejemplo de Request:**
```bash
curl -X POST https://tu-dominio.com/api/public/calls/create \
  -H "Authorization: Bearer tu_token_jwt" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD",
    "to_number": "+1234567890",
    "from_number": "+1987654321",
    "retell_llm_dynamic_variables": {
      "customer_name": "John Doe"
    }
  }'
```

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

**Errores Comunes:**

- `401 Unauthorized`: Token inválido o expirado
- `400 Bad Request`: Datos inválidos (formato de número incorrecto, agente no encontrado, etc.)
- `404 Not Found`: Agente no encontrado o no pertenece a tu cuenta
- `500 Internal Server Error`: Error del servidor

---

### 2. Obtener Información de una Llamada

**Endpoint:** `GET /api/public/calls/{callId}`

**Headers:**
```
Authorization: Bearer <tu_token_jwt>
```

**Parámetros de URL:**
- `callId` (requerido): ID de la llamada en Retell

**Ejemplo de Request:**
```bash
curl -X GET https://tu-dominio.com/api/public/calls/Jabr9TXYYJHfvl6Syypi88rdAHYHmcq6 \
  -H "Authorization: Bearer tu_token_jwt"
```

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

**Errores Comunes:**

- `401 Unauthorized`: Token inválido o expirado
- `400 Bad Request`: callId no proporcionado
- `404 Not Found`: Llamada no encontrada o no pertenece a tu cuenta
- `500 Internal Server Error`: Error del servidor

---

## Parámetros Detallados

### Formato de Números Telefónicos

Todos los números telefónicos deben estar en formato **E.164**:
- Comienza con `+`
- Seguido del código de país (1-3 dígitos)
- Seguido del número local
- Ejemplos válidos: `+1234567890`, `+521234567890`

### Variables Dinámicas (retell_llm_dynamic_variables)

Permiten inyectar valores dinámicos en el prompt del LLM y en las descripciones de herramientas durante cada llamada específica.

#### Uso en Prompts

Las variables dinámicas se usan con la sintaxis `{{nombre_variable}}` directamente en el prompt del agente. Retell AI reemplazará automáticamente estas variables con los valores proporcionados al crear la llamada.

**Ejemplo de Prompt:**
```
Hola {{customer_name}}, gracias por llamar. Veo que tienes una orden con ID {{order_id}} para el producto {{product_name}}. ¿En qué puedo ayudarte hoy?
```

**Al crear la llamada:**
```json
{
  "retell_llm_dynamic_variables": {
    "customer_name": "John Doe",
    "order_id": "12345",
    "product_name": "Widget Pro"
  }
}
```

**Resultado en el prompt procesado:**
```
Hola John Doe, gracias por llamar. Veo que tienes una orden con ID 12345 para el producto Widget Pro. ¿En qué puedo ayudarte hoy?
```

#### Variables del Sistema (Predefinidas)

Retell AI proporciona automáticamente estas variables del sistema que puedes usar en tus prompts sin necesidad de definirlas:

- `{{current_time}}`: Hora actual en formato `America/Los_Angeles`
- `{{direction}}`: Dirección de la llamada (`inbound` o `outbound`)
- `{{user_number}}`: Número de teléfono del usuario
- `{{agent_number}}`: Número de teléfono del agente

**Ejemplo usando variables del sistema:**
```
La llamada es {{direction}} desde {{user_number}}. La hora actual es {{current_time}}.
```

#### Variables No Definidas

Si una variable dinámica no tiene un valor asignado, permanecerá en su forma original con las llaves intactas en el prompt:

- **Prompt:** `"Hola {{customer_name}}, ¿cómo puedo ayudarte?"`
- **Si `customer_name` no se proporciona:** `"Hola {{customer_name}}, ¿cómo puedo ayudarte?"`
- **Si `customer_name` es "Juan":** `"Hola Juan, ¿cómo puedo ayudarte?"`

**Recomendaciones:**
1. **Establecer valores predeterminados a nivel de agente** en la configuración del agente
2. **Diseñar prompts defensivos** que funcionen con o sin variables
3. **Probar exhaustivamente** con variables definidas y no definidas
4. **Documentar requisitos** indicando qué variables son obligatorias y cuáles opcionales

#### Requisitos

- Todos los valores en `retell_llm_dynamic_variables` deben ser **cadenas de texto (strings)**
- Los nombres de las variables pueden contener letras, números y guiones bajos
- Las variables son case-sensitive (distingue mayúsculas y minúsculas)

### Metadatos (metadata)

Metadatos personalizados que se pueden usar para tracking o integración con otros sistemas:

```json
{
  "metadata": {
    "campaign_id": "summer-2024",
    "source": "website",
    "user_id": "12345"
  }
}
```

### Headers SIP Personalizados (custom_sip_headers)

Headers SIP adicionales para la llamada:

```json
{
  "custom_sip_headers": {
    "X-Custom-Header": "Custom Value",
    "X-Another-Header": "Another Value"
  }
}
```

---

## Estados de Llamada

Los posibles estados de una llamada (`call_status`) son:

- `registered`: La llamada ha sido registrada pero aún no ha comenzado
- `ringing`: La llamada está sonando
- `ongoing`: La llamada está en progreso
- `ended`: La llamada ha terminado exitosamente
- `failed`: La llamada falló

---

## Razones de Desconexión

Cuando una llamada termina, puede incluir un campo `disconnection_reason` con valores como:

- `user_hangup`: El usuario colgó
- `agent_hangup`: El agente colgó
- `call_transfer`: La llamada fue transferida
- `voicemail_reached`: Se alcanzó el buzón de voz
- `inactivity`: Desconexión por inactividad
- `max_duration_reached`: Se alcanzó la duración máxima
- `no_valid_payment`: No hay pago válido
- `dial_busy`: Línea ocupada
- `dial_failed`: Error al marcar
- `dial_no_answer`: No hubo respuesta

---

## Ejemplos de Uso

### Ejemplo 1: Llamada Simple

```javascript
const response = await fetch('https://tu-dominio.com/api/public/calls/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    agent_id: 'oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD',
    to_number: '+1234567890',
  }),
});

const data = await response.json();
console.log('Llamada creada:', data.data.call_id);
```

### Ejemplo 2: Llamada con Variables Dinámicas

```javascript
const response = await fetch('https://tu-dominio.com/api/public/calls/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    agent_id: 'oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD',
    to_number: '+1234567890',
    from_number: '+1987654321',
    retell_llm_dynamic_variables: {
      customer_name: 'John Doe',
      order_id: '12345',
    },
    metadata: {
      campaign_id: 'summer-2024',
      source: 'website',
    },
  }),
});
```

### Ejemplo 3: Consultar Estado de Llamada

```javascript
const callId = 'Jabr9TXYYJHfvl6Syypi88rdAHYHmcq6';

const response = await fetch(
  `https://tu-dominio.com/api/public/calls/${callId}`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }
);

const data = await response.json();
console.log('Estado de llamada:', data.data.call_status);
console.log('Transcripción:', data.data.transcript);
```

### Ejemplo 4: Monitorear Llamada hasta que Termine

```javascript
async function waitForCallToEnd(callId, token, maxWaitTime = 300000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    const response = await fetch(
      `https://tu-dominio.com/api/public/calls/${callId}`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );
    
    const data = await response.json();
    
    if (data.data.call_status === 'ended' || data.data.call_status === 'failed') {
      return data.data;
    }
    
    // Esperar 2 segundos antes de verificar de nuevo
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('Timeout esperando que termine la llamada');
}

// Uso
const callData = await waitForCallToEnd(callId, token);
console.log('Llamada terminada:', callData.transcript);
```

---

## Seguridad

1. **Nunca expongas tu token JWT** en código del lado del cliente o repositorios públicos
2. **Usa tokens permanentes** solo para integraciones de servidor a servidor
3. **Rota tus tokens** periódicamente desde el perfil del usuario
4. **Valida los números telefónicos** antes de crear llamadas
5. **Monitorea el uso** de tus tokens y llamadas

---

## Registro en Call History

**✅ Sí, las llamadas creadas a través de esta API se registran automáticamente en el Call History.**

### Configuración Automática del Webhook

**Todos los agentes creados desde esta aplicación tienen configurado automáticamente el webhook URL** que apunta a:

```
https://tu-dominio.com/api/webhooks/retell
```

Esto significa que **no necesitas configurar manualmente el webhook** cuando creas un agente desde la aplicación. El sistema lo hace automáticamente para asegurar que todas las llamadas se registren en el Call History.

### ¿Cómo funciona?

1. **Al crear la llamada**: Se crea la llamada en Retell AI, pero aún no se guarda en la base de datos local.

2. **Cuando termina la llamada**: Retell AI envía un webhook `call_ended` o `call_analyzed` al endpoint `/api/webhooks/retell` configurado en el agente.

3. **Registro automático**: El webhook llama a `RetellService.saveCallData()`, que:
   - Obtiene los datos completos de la llamada desde Retell (costo, duración, transcripción, etc.)
   - Guarda la llamada en la base de datos local
   - Descuenta el costo de la wallet del usuario
   - La llamada aparece en el Call History

### Configuración Manual del Webhook (Opcional)

Si necesitas usar un webhook diferente o personalizado, puedes especificarlo al crear el agente:

```json
{
  "agent_name": "Mi Agente",
  "voice_id": "11labs-Emily",
  "language": "es-ES",
  "response_engine": {
    "type": "retell-llm",
    "llm_id": "tu_llm_id"
  },
  "webhook_url": "https://tu-webhook-personalizado.com/endpoint"
}
```

Si no proporcionas `webhook_url`, se usará automáticamente el webhook por defecto de la aplicación.

### Nota Importante

- **Agentes creados desde la app**: Tienen el webhook configurado automáticamente ✅
- **Agentes importados o creados externamente**: Pueden no tener el webhook configurado. En este caso, las llamadas se crearán en Retell pero **NO se registrarán** en el Call History local.
- El costo **SÍ se descontará** de la wallet cuando Retell procese el webhook (si está configurado).
- Puedes consultar la llamada directamente desde Retell usando `GET /api/public/calls/{callId}`, pero no aparecerá en el historial de la aplicación si no tiene webhook configurado.

---

## Límites y Consideraciones

- Las llamadas se facturan según el uso de Retell AI
- El costo se descuenta automáticamente de la wallet del usuario cuando el webhook procesa la llamada terminada
- Solo puedes crear llamadas con agentes que pertenecen a tu cuenta
- Solo puedes consultar llamadas que pertenecen a tu cuenta
- Los tokens permanentes no expiran, pero se pueden regenerar desde el perfil
- **Importante**: Asegúrate de que tus agentes tengan el webhook configurado para que las llamadas se registren en el Call History

---

## Referencias

- [Documentación de Retell AI - Create Phone Call](https://docs.retellai.com/api-references/create-phone-call)
- [Documentación de Retell AI - Get Call](https://docs.retellai.com/api-references/get-call)
- [Formato E.164 de Números Telefónicos](https://en.wikipedia.org/wiki/E.164)

