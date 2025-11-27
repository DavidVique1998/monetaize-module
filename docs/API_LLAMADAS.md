# 📞 API de Llamadas - Documentación

## Endpoint: Crear Llamada con Agente Específico

### `POST /api/calls/create`

Crea una llamada telefónica outbound usando un agente específico de Retell.

---

## Autenticación

Actualmente el endpoint no requiere autenticación, pero puedes habilitarla descomentando las líneas en el código si lo necesitas.

---

## Request

### Headers

```
Content-Type: application/json
```

### Body Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `agentId` | string | ✅ Sí | ID del agente de Retell a usar para la llamada |
| `toNumber` | string | ✅ Sí | Número de teléfono destino en formato E.164 (ej: `+1234567890`) |
| `fromNumber` | string | ❌ No | Número de teléfono origen en formato E.164. Si no se proporciona, Retell usará el número por defecto configurado |
| `metadata` | object | ❌ No | Metadatos adicionales para la llamada (se pasarán a Retell) |

### Ejemplo de Request

```json
{
  "agentId": "agent_abc123xyz",
  "toNumber": "+1234567890",
  "fromNumber": "+0987654321",
  "metadata": {
    "campaign": "sales-outreach",
    "customerId": "cust_456",
    "notes": "Cliente VIP"
  }
}
```

---

## Response

### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "call_id": "call_retell_123456",
    "agent_id": "agent_abc123xyz",
    "from_number": "+0987654321",
    "to_number": "+1234567890",
    "call_status": "ringing",
    "direction": "outbound",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Responses

#### 400 Bad Request - Parámetros faltantes o inválidos

```json
{
  "success": false,
  "error": "agentId es requerido"
}
```

```json
{
  "success": false,
  "error": "toNumber debe estar en formato E.164 (ej: +1234567890)"
}
```

#### 404 Not Found - Agente no encontrado

```json
{
  "success": false,
  "error": "Agente con ID agent_abc123xyz no encontrado"
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Error al crear la llamada"
}
```

---

## Ejemplos de Uso

### JavaScript/TypeScript (Fetch API)

```javascript
async function createCall(agentId, toNumber, fromNumber = null, metadata = null) {
  try {
    const response = await fetch('/api/calls/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentId: agentId,
        toNumber: toNumber,
        fromNumber: fromNumber,
        metadata: metadata
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('Llamada creada:', result.data.call_id);
      return result.data;
    } else {
      console.error('Error:', result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error al crear llamada:', error);
    throw error;
  }
}

// Uso
createCall(
  'agent_abc123xyz',
  '+1234567890',
  '+0987654321',
  { campaign: 'sales-outreach' }
);
```

### cURL

```bash
curl -X POST https://tu-dominio.com/api/calls/create \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent_abc123xyz",
    "toNumber": "+1234567890",
    "fromNumber": "+0987654321",
    "metadata": {
      "campaign": "sales-outreach"
    }
  }'
```

### Python (requests)

```python
import requests

def create_call(agent_id, to_number, from_number=None, metadata=None):
    url = "https://tu-dominio.com/api/calls/create"
    
    payload = {
        "agentId": agent_id,
        "toNumber": to_number,
    }
    
    if from_number:
        payload["fromNumber"] = from_number
    
    if metadata:
        payload["metadata"] = metadata
    
    response = requests.post(url, json=payload)
    
    if response.status_code == 201:
        result = response.json()
        print(f"Llamada creada: {result['data']['call_id']}")
        return result['data']
    else:
        error = response.json()
        print(f"Error: {error['error']}")
        raise Exception(error['error'])

# Uso
create_call(
    agent_id="agent_abc123xyz",
    to_number="+1234567890",
    from_number="+0987654321",
    metadata={"campaign": "sales-outreach"}
)
```

### Node.js (axios)

```javascript
const axios = require('axios');

async function createCall(agentId, toNumber, fromNumber = null, metadata = null) {
  try {
    const response = await axios.post('/api/calls/create', {
      agentId,
      toNumber,
      fromNumber,
      metadata
    });

    console.log('Llamada creada:', response.data.data.call_id);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      console.error('Error:', error.response.data.error);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// Uso
createCall(
  'agent_abc123xyz',
  '+1234567890',
  '+0987654321',
  { campaign: 'sales-outreach' }
);
```

---

## Validaciones

1. **Formato de Números Telefónicos**: Deben estar en formato E.164 (ej: `+1234567890`)
   - Debe comenzar con `+`
   - Seguido del código de país (1-3 dígitos)
   - Seguido del número local (máximo 15 dígitos totales)

2. **Agente**: El `agentId` debe existir en tu cuenta de Retell

3. **Número Origen**: Si no se proporciona, Retell usará el número por defecto configurado en tu cuenta

---

## Notas Importantes

1. **Llamadas Outbound**: Este endpoint crea llamadas salientes. Para llamadas entrantes, usa `/api/new-call`

2. **Estado de la Llamada**: La llamada se crea con estado `ringing`. El estado se actualizará automáticamente cuando:
   - El destinatario conteste → `in-progress`
   - La llamada termine → `completed` o `failed`

3. **Webhooks**: Para recibir actualizaciones del estado de la llamada, configura webhooks en Retell que apunten a tu endpoint `/api/webhooks/retell`

4. **Costos**: Las llamadas outbound tienen costo según tu plan de Retell. Asegúrate de tener créditos suficientes.

5. **Rate Limiting**: Considera implementar rate limiting para evitar abuso del endpoint.

---

## Obtener Lista de Agentes

Para obtener la lista de agentes disponibles, usa:

```
GET /api/agents
```

Esto te devolverá todos los agentes disponibles con sus IDs que puedes usar en `agentId`.

---

## Próximas Mejoras

- [ ] Endpoint para listar llamadas: `GET /api/calls`
- [ ] Endpoint para obtener detalles de llamada: `GET /api/calls/[callId]`
- [ ] Endpoint para terminar llamada: `POST /api/calls/[callId]/end`
- [ ] Webhooks para actualizar estado en tiempo real
- [ ] Almacenamiento de llamadas en base de datos
- [ ] Autenticación y autorización
- [ ] Rate limiting
- [ ] Validación de permisos por usuario

