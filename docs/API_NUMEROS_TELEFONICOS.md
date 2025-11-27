# 📱 API de Números Telefónicos - Documentación

## Endpoint: Crear/Importar Número con Agente Predefinido

### `POST /api/phone-numbers/create`

Crea o importa un número telefónico en Retell y lo asocia automáticamente con un agente específico.

---

## Autenticación

Actualmente el endpoint no requiere autenticación, pero puedes habilitarla si lo necesitas.

---

## Request

### Headers

```
Content-Type: application/json
```

### Body Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `phone_number` | string | ✅ Sí | Número de teléfono en formato E.164 (ej: `+14157774444`) |
| `agent_id` | string | ✅ Sí | ID del agente de Retell a asociar con el número |
| `nickname` | string | ❌ No | Nombre descriptivo para el número |
| `termination_uri` | string | ❌ No | URI de terminación SIP (requerido para algunos proveedores como Twilio) |
| `sip_trunk_auth_username` | string | ❌ No | Usuario para autenticación SIP trunk |
| `sip_trunk_auth_password` | string | ❌ No | Contraseña para autenticación SIP trunk |
| `inbound_webhook_url` | string | ❌ No | URL del webhook para llamadas entrantes |
| `use_for_inbound` | boolean | ❌ No | Usar el agente para llamadas entrantes (default: `true`) |
| `use_for_outbound` | boolean | ❌ No | Usar el agente para llamadas salientes (default: `true`) |

### Ejemplo de Request

```json
{
  "phone_number": "+14157774444",
  "agent_id": "agent_abc123xyz",
  "nickname": "Número de Ventas",
  "use_for_inbound": true,
  "use_for_outbound": true,
  "inbound_webhook_url": "https://tu-dominio.com/webhooks/inbound"
}
```

**Para números de Twilio:**
```json
{
  "phone_number": "+14157774444",
  "agent_id": "agent_abc123xyz",
  "nickname": "Twilio Number",
  "termination_uri": "someuri.pstn.twilio.com",
  "sip_trunk_auth_username": "tu_username",
  "sip_trunk_auth_password": "tu_password"
}
```

---

## Response

### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "phone_number": "+14157774444",
    "phone_number_pretty": "(415) 777-4444",
    "phone_number_type": "retell-twilio",
    "inbound_agent_id": "agent_abc123xyz",
    "outbound_agent_id": "agent_abc123xyz",
    "nickname": "Número de Ventas",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Responses

#### 400 Bad Request - Parámetros faltantes o inválidos

```json
{
  "success": false,
  "error": "phone_number es requerido"
}
```

```json
{
  "success": false,
  "error": "phone_number debe estar en formato E.164 (ej: +14157774444)"
}
```

#### 404 Not Found - Agente no encontrado

```json
{
  "success": false,
  "error": "Agente con ID agent_abc123xyz no encontrado"
}
```

#### 409 Conflict - Número ya existe

```json
{
  "success": false,
  "error": "El número +14157774444 ya está registrado en Retell"
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Error al crear/importar el número telefónico"
}
```

---

## Ejemplos de Uso

### JavaScript/TypeScript (Fetch API)

```javascript
async function createPhoneNumber(phoneNumber, agentId, options = {}) {
  try {
    const response = await fetch('/api/phone-numbers/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: phoneNumber,
        agent_id: agentId,
        nickname: options.nickname,
        use_for_inbound: options.useForInbound ?? true,
        use_for_outbound: options.useForOutbound ?? true,
        inbound_webhook_url: options.webhookUrl,
        ...options
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('Número creado:', result.data.phone_number);
      return result.data;
    } else {
      console.error('Error:', result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error al crear número:', error);
    throw error;
  }
}

// Uso básico
createPhoneNumber(
  '+14157774444',
  'agent_abc123xyz',
  { nickname: 'Número de Ventas' }
);

// Para Twilio
createPhoneNumber(
  '+14157774444',
  'agent_abc123xyz',
  {
    nickname: 'Twilio Number',
    termination_uri: 'someuri.pstn.twilio.com',
    sip_trunk_auth_username: 'username',
    sip_trunk_auth_password: 'password'
  }
);
```

### cURL

```bash
curl -X POST https://tu-dominio.com/api/phone-numbers/create \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+14157774444",
    "agent_id": "agent_abc123xyz",
    "nickname": "Número de Ventas",
    "use_for_inbound": true,
    "use_for_outbound": true
  }'
```

### Python (requests)

```python
import requests

def create_phone_number(phone_number, agent_id, **kwargs):
    url = "https://tu-dominio.com/api/phone-numbers/create"
    
    payload = {
        "phone_number": phone_number,
        "agent_id": agent_id,
        "use_for_inbound": kwargs.get("use_for_inbound", True),
        "use_for_outbound": kwargs.get("use_for_outbound", True),
    }
    
    # Agregar campos opcionales
    if "nickname" in kwargs:
        payload["nickname"] = kwargs["nickname"]
    if "termination_uri" in kwargs:
        payload["termination_uri"] = kwargs["termination_uri"]
    if "inbound_webhook_url" in kwargs:
        payload["inbound_webhook_url"] = kwargs["inbound_webhook_url"]
    
    response = requests.post(url, json=payload)
    
    if response.status_code == 201:
        result = response.json()
        print(f"Número creado: {result['data']['phone_number']}")
        return result['data']
    else:
        error = response.json()
        print(f"Error: {error['error']}")
        raise Exception(error['error'])

# Uso
create_phone_number(
    phone_number="+14157774444",
    agent_id="agent_abc123xyz",
    nickname="Número de Ventas"
)
```

---

## Tipos de Números Soportados

Retell AI soporta varios tipos de números telefónicos:

1. **Retell-Twilio**: Números de Twilio
   - Requiere `termination_uri` y credenciales SIP
   - Formato: `someuri.pstn.twilio.com`

2. **Retell-Telnyx**: Números de Telnyx
   - Requiere configuración específica de Telnyx

3. **Custom**: Números personalizados
   - Requiere configuración SIP personalizada

---

## Flujo de Trabajo Recomendado

1. **Obtener lista de agentes disponibles:**
   ```bash
   GET /api/agents
   ```

2. **Crear/importar número con agente:**
   ```bash
   POST /api/phone-numbers/create
   ```

3. **Verificar número creado:**
   ```bash
   GET /api/phone-numbers
   ```

4. **Usar el número en llamadas:**
   ```bash
   POST /api/calls/create
   # Usar el phone_number como fromNumber
   ```

---

## Notas Importantes

1. **Formato E.164**: Los números deben estar en formato E.164 (ej: `+14157774444`)
   - Debe comenzar con `+`
   - Seguido del código de país
   - Seguido del número local

2. **Agente Válido**: El `agent_id` debe existir en tu cuenta de Retell

3. **Números Existentes**: Si el número ya está registrado en Retell, recibirás un error 409

4. **Configuración SIP**: Para números de Twilio y otros proveedores, necesitarás:
   - `termination_uri`
   - Credenciales de autenticación SIP

5. **Webhooks**: Configura `inbound_webhook_url` para recibir eventos de llamadas entrantes

---

## Integración con Llamadas

Una vez creado el número, puedes usarlo para hacer llamadas:

```javascript
// Crear número
const phoneNumber = await createPhoneNumber(
  '+14157774444',
  'agent_abc123xyz',
  { nickname: 'Sales Number' }
);

// Usar el número para hacer una llamada
const call = await fetch('/api/calls/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentId: 'agent_abc123xyz',
    toNumber: '+1234567890',
    fromNumber: phoneNumber.phone_number // Usar el número creado
  })
});
```

---

## Próximas Mejoras

- [ ] Endpoint para actualizar configuración de número: `PATCH /api/phone-numbers/[phoneNumber]`
- [ ] Endpoint para eliminar número: `DELETE /api/phone-numbers/[phoneNumber]`
- [ ] Endpoint para obtener detalles: `GET /api/phone-numbers/[phoneNumber]`
- [ ] Soporte para búsqueda de números disponibles
- [ ] Integración con proveedores de números telefónicos

