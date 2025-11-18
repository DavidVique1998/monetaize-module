# Sistema de Procesamiento por Lotes (Batch Processing)

## Descripción

Sistema de acumulación de consumos de créditos diseñado para manejar alta concurrencia desde chatbots y aplicaciones externas. En lugar de procesar cada consumo individualmente, el sistema acumula consumos y los procesa en lotes cuando se alcanzan umbrales configurados.

## Problema que Resuelve

- **Alta concurrencia**: Miles de mensajes simultáneos desde múltiples cuentas
- **Sobrecarga de base de datos**: Evita miles de transacciones individuales
- **Costo de API**: Reduce llamadas a la API de consumo
- **Rendimiento**: Mejora la latencia al procesar en lotes

## Arquitectura

### Componentes

1. **PendingConsumption**: Tabla que almacena consumos pendientes de procesar
2. **BatchProcessingConfig**: Configuración de umbrales por wallet
3. **Endpoint `/api/wallet/consume-batch`**: Acumula consumos
4. **Función `processBatch()`**: Procesa un lote de consumos
5. **Cron Job `/api/cron/process-batches`**: Procesa lotes automáticamente

### Flujo

```
1. Chatbot → POST /api/wallet/consume-batch
2. Sistema → Agrega consumo a PendingConsumption
3. Sistema → Verifica umbrales:
   - ¿Monto acumulado >= maxAmount?
   - ¿Transacciones >= maxTransactions?
   - ¿Tiempo >= maxTimeSeconds?
4. Si se alcanza umbral → Procesa lote inmediatamente
5. Si no → Espera a que cron job procese
6. Cron Job → Procesa lotes que cumplen criterios
```

## Configuración de Umbrales

Cada wallet tiene su propia configuración con los siguientes parámetros:

- **maxAmount**: Máximo de créditos acumulados antes de procesar (default: $10)
- **maxTransactions**: Máximo de transacciones pendientes (default: 100)
- **maxTimeSeconds**: Máximo tiempo en segundos antes de procesar (default: 300 = 5 min)
- **enabled**: Habilitar/deshabilitar procesamiento por lotes (default: true)

### Ejemplo de Configuración

```typescript
{
  walletId: "wallet-123",
  enabled: true,
  maxAmount: 10.00,        // Procesar cuando se acumulen $10
  maxTransactions: 100,    // O cuando haya 100 transacciones
  maxTimeSeconds: 300      // O después de 5 minutos
}
```

## Endpoints

### POST `/api/wallet/consume-batch`

Acumula un consumo de créditos. Si se alcanza un umbral, procesa el lote inmediatamente.

**Autenticación**: JWT Token

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "amount": 0.1,
  "reason": "Mensaje de chatbot",
  "metricType": "ai_message",
  "metricValue": 1,
  "conversationId": "conv-123"
}
```

**Respuesta exitosa:**
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

**Respuesta (acumulado, no procesado aún):**
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

### POST `/api/cron/process-batches`

Procesa todos los lotes que cumplen los criterios. Debe ejecutarse periódicamente (recomendado: cada 1-2 minutos).

**Autenticación**: Token secreto (opcional pero recomendado)

**Headers:**
```
Authorization: Bearer <CRON_SECRET>
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "processed": 5,
    "errors": 0,
    "details": [
      { "walletId": "wallet-1", "success": true },
      { "walletId": "wallet-2", "success": true }
    ],
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Configuración del Cron Job

### Opción 1: Vercel Cron (Recomendado)

Agregar a `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-batches",
      "schedule": "*/2 * * * *"
    }
  ]
}
```

### Opción 2: Cron tradicional

```bash
# Ejecutar cada 2 minutos
*/2 * * * * curl -X POST https://tu-dominio.com/api/cron/process-batches -H "Authorization: Bearer $CRON_SECRET"
```

### Opción 3: GitHub Actions / CI/CD

```yaml
name: Process Batches
on:
  schedule:
    - cron: '*/2 * * * *'  # Cada 2 minutos
jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Process batches
        run: |
          curl -X POST ${{ secrets.API_URL }}/api/cron/process-batches \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## Variables de Entorno

Agregar a `.env`:

```env
# Token secreto para proteger el endpoint de cron
CRON_SECRET=tu-token-secreto-muy-seguro-aqui
```

## Migración de Base de Datos

Ejecutar la migración de Prisma:

```bash
npx prisma migrate dev --name add_batch_processing
```

O en producción:

```bash
npx prisma migrate deploy
```

## Uso desde Chatbot

### Ejemplo con cURL

```bash
curl -X POST https://tu-dominio.com/api/wallet/consume-batch \
  -H "Authorization: Bearer TU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 0.01,
    "reason": "Procesamiento de mensaje de chatbot",
    "metricType": "ai_message",
    "metricValue": 1,
    "conversationId": "chatbot-conv-123"
  }'
```

### Ejemplo con JavaScript/TypeScript

```typescript
async function consumeCredit(token: string, amount: number, reason: string) {
  const response = await fetch('https://tu-dominio.com/api/wallet/consume-batch', {
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
  return data;
}
```

## Ventajas del Sistema

1. **Reducción de carga**: En lugar de 1000 transacciones, procesa 10 lotes
2. **Mejor rendimiento**: Menos escrituras a la base de datos
3. **Escalabilidad**: Maneja miles de mensajes simultáneos
4. **Flexibilidad**: Configuración por wallet
5. **Resiliencia**: Si falla un lote, no afecta a otros

## Monitoreo

### Ver consumos pendientes

```sql
SELECT 
  walletId,
  COUNT(*) as pending_count,
  SUM(amount) as total_pending,
  MIN(createdAt) as oldest_pending
FROM "PendingConsumption"
WHERE processed = false
GROUP BY walletId;
```

### Ver configuración de lotes

```sql
SELECT 
  w.userId,
  bpc.enabled,
  bpc."maxAmount",
  bpc."maxTransactions",
  bpc."maxTimeSeconds",
  bpc."lastProcessedAt"
FROM "BatchProcessingConfig" bpc
JOIN "Wallet" w ON w.id = bpc."walletId";
```

## Troubleshooting

### Los lotes no se procesan

1. Verificar que el cron job esté ejecutándose
2. Verificar que `enabled = true` en BatchProcessingConfig
3. Verificar que haya consumos pendientes
4. Revisar logs del servidor

### Error: "Saldo insuficiente"

El sistema verifica el saldo antes de procesar un lote. Si no hay suficiente saldo, marca los consumos como fallidos.

### Deshabilitar procesamiento por lotes

```typescript
// Para una wallet específica
await prisma.batchProcessingConfig.update({
  where: { walletId: 'wallet-id' },
  data: { enabled: false },
});
```

Cuando está deshabilitado, los consumos se procesan inmediatamente (como antes).

## Comparación: Inmediato vs. Por Lotes

| Aspecto | Inmediato | Por Lotes |
|---------|-----------|-----------|
| Latencia | Baja | Media (hasta 5 min) |
| Carga DB | Alta | Baja |
| Escalabilidad | Limitada | Alta |
| Complejidad | Baja | Media |
| Uso recomendado | Bajo volumen | Alto volumen |

## Recomendaciones

1. **Para chatbots de alto volumen**: Usar `/api/wallet/consume-batch`
2. **Para operaciones críticas**: Usar `/api/wallet/consume-token` (inmediato)
3. **Configurar umbrales** según el volumen esperado
4. **Monitorear** el procesamiento de lotes regularmente
5. **Ajustar cron job** según necesidades (1-5 minutos)



