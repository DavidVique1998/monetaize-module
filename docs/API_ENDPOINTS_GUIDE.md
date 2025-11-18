# 📚 Guía Completa de Endpoints de Consumo de Créditos

Esta guía explica cómo usar los endpoints para consumir créditos de la IA, incluyendo cómo obtener tokens JWT y configurar el procesamiento por lotes.

## 📋 Tabla de Contenidos

1. [Obtener Token JWT](#obtener-token-jwt)
2. [Endpoint: Consumo Inmediato](#endpoint-consumo-inmediato)
3. [Endpoint: Consumo por Lotes (Recomendado para Chatbots)](#endpoint-consumo-por-lotes)
4. [Configuración de Vercel Cron](#configuración-de-vercel-cron)
5. [Ejemplos de Uso](#ejemplos-de-uso)
6. [Troubleshooting](#troubleshooting)

---

## 🔑 Obtener Token JWT

### Opción 1: Desde el Perfil de Usuario (Recomendado)

Cualquier usuario autenticado puede generar su propio token JWT:

1. **Inicia sesión** en la aplicación
2. **Navega a "Mi Perfil"** (`/profile`)
3. **Busca la sección "Token JWT para API"**
4. **Haz clic en "Generar Token"**
5. **Copia el token** generado

El token se mostrará en pantalla y puedes copiarlo con un clic.

**Ventajas:**
- ✅ Accesible para todos los usuarios
- ✅ No requiere permisos de ADMIN
- ✅ Interfaz visual simple
- ✅ Ejemplo de uso incluido

### Opción 2: Desde el Panel de Admin (Solo ADMIN)

Si eres un usuario ADMIN, puedes generar tokens para cualquier usuario:

1. **Inicia sesión como ADMIN**
2. **Navega a `/admin/tokens`**
3. **Selecciona un usuario** de la lista
4. **Haz clic en "Generar Token"**
5. **Copia el token** generado

### Opción 3: Usando la API (Solo ADMIN)

```bash
# Listar usuarios
curl -X GET https://tu-dominio.com/api/admin/tokens \
  -H "Cookie: tu-cookie-de-sesion"

# Generar token para un usuario
curl -X POST https://tu-dominio.com/api/admin/tokens \
  -H "Content-Type: application/json" \
  -H "Cookie: tu-cookie-de-sesion" \
  -d '{
    "userId": "user-id-aqui"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "Usuario",
      "ghlLocationId": "location-id"
    }
  }
}
```

---

## 🚀 Endpoint: Consumo Inmediato

### POST `/api/wallet/consume-token`

Procesa el consumo de créditos **inmediatamente**. Ideal para operaciones críticas o bajo volumen.

**Autenticación:** JWT Token

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "amount": 0.1,
  "reason": "Procesamiento de mensaje de chatbot",
  "metricType": "ai_message",
  "metricValue": 1,
  "conversationId": "conv-123"
}
```

**Campos:**
- `amount` (requerido): Monto en dólares a consumir (debe ser positivo)
- `reason` (requerido): Motivo del consumo (mínimo 1 carácter)
- `metricType` (opcional): Tipo de métrica (ej: "ai_message", "ai_call", "tokens")
- `metricValue` (opcional): Valor de la métrica consumida
- `conversationId` (opcional): ID de conversación si aplica

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "newBalance": 99.9,
    "transactionId": "txn-id-123",
    "userId": "user-id",
    "ghlLocationId": "location-id"
  }
}
```

**Errores comunes:**

| Código | Error | Descripción |
|--------|-------|-------------|
| 401 | Token inválido o expirado | Verifica que el token sea válido |
| 400 | Saldo insuficiente | No hay suficiente crédito en la wallet |
| 400 | Invalid request data | Datos del request inválidos |

**Ejemplo con cURL:**
```bash
curl -X POST https://tu-dominio.com/api/wallet/consume-token \
  -H "Authorization: Bearer TU_JWT_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 0.1,
    "reason": "Procesamiento de mensaje de chatbot",
    "metricType": "ai_message",
    "metricValue": 1
  }'
```

**Ejemplo con JavaScript:**
```javascript
async function consumeCredits(token, amount, reason) {
  const response = await fetch('https://tu-dominio.com/api/wallet/consume-token', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      reason,
      metricType: 'ai_message',
      metricValue: 1,
    }),
  });

  const data = await response.json();
  
  if (data.success) {
    console.log('Créditos consumidos:', data.data);
    return data.data;
  } else {
    throw new Error(data.error);
  }
}

// Uso
consumeCredits('TU_TOKEN', 0.1, 'Mensaje procesado')
  .then(result => console.log('Nuevo balance:', result.newBalance))
  .catch(error => console.error('Error:', error));
```

---

## 📦 Endpoint: Consumo por Lotes (Recomendado para Chatbots)

### POST `/api/wallet/consume-batch`

Acumula consumos y los procesa en lotes cuando se alcanzan umbrales configurados. **Ideal para chatbots con alto volumen de mensajes**.

**Autenticación:** JWT Token

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "amount": 0.01,
  "reason": "Mensaje de chatbot procesado",
  "metricType": "ai_message",
  "metricValue": 1,
  "conversationId": "chatbot-conv-123"
}
```

**Campos:** (Iguales que consume-token)

**Respuesta exitosa - Lote procesado inmediatamente:**
```json
{
  "success": true,
  "data": {
    "pendingId": "pending-id-123",
    "batchProcessed": true,
    "processedCount": 100,
    "totalAmount": 10.50,
    "transactionId": "txn-id-123",
    "userId": "user-id",
    "ghlLocationId": "location-id"
  }
}
```

**Respuesta exitosa - Acumulado (no procesado aún):**
```json
{
  "success": true,
  "data": {
    "pendingId": "pending-id-123",
    "batchProcessed": false,
    "userId": "user-id",
    "ghlLocationId": "location-id"
  }
}
```

**Ventajas del procesamiento por lotes:**
- ✅ Reduce carga en la base de datos
- ✅ Mejor rendimiento con alto volumen
- ✅ Escalable para miles de mensajes simultáneos
- ✅ Procesa automáticamente cuando se alcanzan umbrales

**Configuración de umbrales (por defecto):**
- **maxAmount**: $10 (procesa cuando se acumulan $10)
- **maxTransactions**: 100 (procesa cuando hay 100 transacciones)
- **maxTimeSeconds**: 300 (procesa después de 5 minutos)

**Ejemplo con cURL:**
```bash
curl -X POST https://tu-dominio.com/api/wallet/consume-batch \
  -H "Authorization: Bearer TU_JWT_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 0.01,
    "reason": "Mensaje de chatbot",
    "metricType": "ai_message",
    "metricValue": 1
  }'
```

**Ejemplo con JavaScript (Chatbot):**
```javascript
class ChatbotCreditManager {
  constructor(token, baseUrl = 'https://tu-dominio.com') {
    this.token = token;
    this.baseUrl = baseUrl;
  }

  async consumeCredit(amount, reason, conversationId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/wallet/consume-batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          reason,
          metricType: 'ai_message',
          metricValue: 1,
          conversationId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al consumir créditos');
      }

      // Si el lote fue procesado, loguear información
      if (data.data.batchProcessed) {
        console.log(`Lote procesado: ${data.data.processedCount} consumos, Total: $${data.data.totalAmount}`);
      }

      return data.data;
    } catch (error) {
      console.error('Error consumiendo créditos:', error);
      throw error;
    }
  }

  // Método para procesar un mensaje
  async processMessage(message, conversationId) {
    // Tu lógica de procesamiento aquí
    const cost = 0.01; // Costo por mensaje
    
    return await this.consumeCredit(
      cost,
      `Procesamiento de mensaje: ${message.substring(0, 50)}...`,
      conversationId
    );
  }
}

// Uso
const creditManager = new ChatbotCreditManager('TU_JWT_TOKEN');

// Procesar un mensaje
creditManager.processMessage('Hola, ¿cómo estás?', 'conv-123')
  .then(result => {
    console.log('Crédito consumido:', result);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

---

## ⚙️ Configuración de Vercel Cron

### Paso 1: Crear archivo `vercel.json`

Crea un archivo `vercel.json` en la raíz del proyecto:

```json
{
  "crons": [
    {
      "path": "/api/cron/auto-recharge",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/process-batches",
      "schedule": "*/2 * * * *"
    }
  ]
}
```

**Explicación de los cron jobs:**

1. **`/api/cron/auto-recharge`**: 
   - **Schedule**: `0 */6 * * *` (cada 6 horas)
   - **Propósito**: Verifica wallets con balance bajo y crea payment links de recarga automática

2. **`/api/cron/process-batches`**:
   - **Schedule**: `*/2 * * * *` (cada 2 minutos)
   - **Propósito**: Procesa lotes de consumos pendientes que cumplen los criterios

### Paso 2: Configurar Variable de Entorno

En Vercel, agrega la variable de entorno:

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega:
   - **Name**: `CRON_SECRET`
   - **Value**: Genera un token seguro (ver abajo)
   - **Environments**: Production, Preview, Development

**Generar token seguro:**
```bash
# Opción 1: OpenSSL
openssl rand -hex 32

# Opción 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opción 3: Online
# Usa un generador de tokens seguro online
```

**Nota importante sobre Vercel Cron:**
- Los cron jobs de Vercel se ejecutan **internamente** y no requieren autenticación externa
- El `CRON_SECRET` es útil si quieres llamar los endpoints manualmente o desde otros servicios
- Vercel protege automáticamente los endpoints de cron contra acceso externo no autorizado

### Paso 3: Desplegar

Después de crear `vercel.json` y configurar `CRON_SECRET`, despliega tu aplicación:

```bash
git add vercel.json
git commit -m "Add Vercel cron jobs configuration"
git push
```

Vercel detectará automáticamente los cron jobs y los configurará.

### Paso 4: Verificar Cron Jobs

1. Ve a tu proyecto en Vercel
2. Settings → Cron Jobs
3. Deberías ver los dos cron jobs configurados
4. Puedes ver el historial de ejecuciones y logs

### Formato de Schedule (Cron)

El formato es: `minuto hora día mes día-semana`

| Ejemplo | Descripción |
|---------|-------------|
| `*/2 * * * *` | Cada 2 minutos |
| `*/5 * * * *` | Cada 5 minutos |
| `0 * * * *` | Cada hora |
| `0 */6 * * *` | Cada 6 horas |
| `0 0 * * *` | Diario a medianoche |
| `0 0 * * 0` | Semanal (domingos) |

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Chatbot Simple

```javascript
// chatbot.js
const JWT_TOKEN = 'tu-token-jwt-aqui';
const API_URL = 'https://tu-dominio.com';

async function handleMessage(userMessage, conversationId) {
  // Procesar mensaje con IA
  const aiResponse = await processWithAI(userMessage);
  
  // Consumir créditos (procesamiento por lotes)
  await fetch(`${API_URL}/api/wallet/consume-batch`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${JWT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: 0.01,
      reason: `Procesamiento de mensaje: ${userMessage.substring(0, 50)}`,
      metricType: 'ai_message',
      metricValue: 1,
      conversationId,
    }),
  });
  
  return aiResponse;
}
```

### Ejemplo 2: Verificar Balance Antes de Consumir

```javascript
async function consumeWithBalanceCheck(token, amount) {
  // Verificar balance (requiere sesión, no JWT)
  // Nota: Para verificar balance con JWT, necesitarías otro endpoint
  
  // Consumir créditos
  const response = await fetch('https://tu-dominio.com/api/wallet/consume-batch', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      reason: 'Consumo de créditos',
    }),
  });

  const data = await response.json();

  if (!data.success) {
    if (data.error.includes('insuficiente')) {
      // Manejar saldo insuficiente
      console.error('Saldo insuficiente');
      return null;
    }
    throw new Error(data.error);
  }

  return data.data;
}
```

### Ejemplo 3: Python (Chatbot)

```python
import requests
import os

JWT_TOKEN = os.getenv('JWT_TOKEN')
API_URL = 'https://tu-dominio.com'

def consume_credit(amount, reason, conversation_id=None):
    """Consumir créditos usando procesamiento por lotes"""
    url = f'{API_URL}/api/wallet/consume-batch'
    headers = {
        'Authorization': f'Bearer {JWT_TOKEN}',
        'Content-Type': 'application/json'
    }
    data = {
        'amount': amount,
        'reason': reason,
        'metricType': 'ai_message',
        'metricValue': 1
    }
    
    if conversation_id:
        data['conversationId'] = conversation_id
    
    response = requests.post(url, json=data, headers=headers)
    result = response.json()
    
    if not result.get('success'):
        raise Exception(result.get('error', 'Error desconocido'))
    
    return result['data']

# Uso
try:
    result = consume_credit(
        amount=0.01,
        reason='Procesamiento de mensaje',
        conversation_id='conv-123'
    )
    print(f'Crédito consumido: {result}')
except Exception as e:
    print(f'Error: {e}')
```

---

## 🔍 Troubleshooting

### Error: "Token inválido o expirado"

**Solución:**
1. Verifica que el token sea correcto
2. Genera un nuevo token desde el perfil
3. Los tokens expiran después de 30 días (configurable)

### Error: "Saldo insuficiente"

**Solución:**
1. Recarga créditos en la wallet
2. Verifica el balance actual
3. Ajusta el monto a consumir

### Los lotes no se procesan

**Solución:**
1. Verifica que el cron job esté configurado en Vercel
2. Verifica que `CRON_SECRET` esté configurado
3. Revisa los logs del cron job en Vercel
4. Verifica que haya consumos pendientes

### Error: "Invalid request data"

**Solución:**
1. Verifica que todos los campos requeridos estén presentes
2. Verifica que `amount` sea un número positivo
3. Verifica que `reason` tenga al menos 1 carácter

### Verificar estado de lotes pendientes

```sql
-- Ver consumos pendientes por wallet
SELECT 
  walletId,
  COUNT(*) as pending_count,
  SUM(amount) as total_pending,
  MIN(createdAt) as oldest_pending
FROM "PendingConsumption"
WHERE processed = false
GROUP BY walletId;
```

---

## 📊 Comparación de Endpoints

| Característica | `/consume-token` | `/consume-batch` |
|----------------|------------------|------------------|
| **Procesamiento** | Inmediato | Por lotes |
| **Latencia** | Baja | Media (hasta 5 min) |
| **Carga DB** | Alta | Baja |
| **Escalabilidad** | Limitada | Alta |
| **Uso recomendado** | Bajo volumen, crítico | Alto volumen, chatbots |
| **Respuesta** | Balance actualizado | Puede estar pendiente |

---

## 🔐 Seguridad

1. **Nunca compartas tu token JWT** en repositorios públicos
2. **Usa variables de entorno** para almacenar tokens
3. **Regenera tokens** periódicamente
4. **Protege el endpoint de cron** con `CRON_SECRET`
5. **Monitorea** el uso de créditos regularmente

---

## 📞 Soporte

Si tienes problemas o preguntas:
1. Revisa los logs del servidor
2. Verifica la documentación en `docs/BATCH_PROCESSING.md`
3. Revisa los ejemplos en esta guía

---

**Última actualización:** Enero 2025

