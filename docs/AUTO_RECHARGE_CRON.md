# 🔄 Configuración del Cron Job de Recarga Automática

Este documento explica cómo configurar el cron job para ejecutar la verificación periódica de recargas automáticas de wallets.

## 📋 Resumen

El sistema de recarga automática verifica periódicamente todas las wallets que tienen la recarga automática habilitada. Cuando el balance está por debajo del umbral configurado, se crea automáticamente un payment link de Stripe para recargar la wallet.

## 🔧 Configuración

### 1. Variable de Entorno

Agrega la siguiente variable de entorno en tu `.env.local` (desarrollo) o en la configuración de tu plataforma de hosting (producción):

```env
CRON_SECRET=tu-token-secreto-muy-seguro-aqui
```

**⚠️ IMPORTANTE**: Genera un token seguro y aleatorio para producción. Puedes usar:

```bash
# Generar un token seguro
openssl rand -hex 32
```

### 2. Endpoint API

El endpoint está disponible en:

```
POST /api/cron/auto-recharge
```

**Autenticación**: Requiere un header `Authorization` con el token:

```
Authorization: Bearer tu-token-secreto-muy-seguro-aqui
```

## 🚀 Opciones de Configuración del Cron Job

### Opción 1: Vercel Cron Jobs (Recomendado para Vercel)

Si estás usando Vercel, puedes usar Vercel Cron Jobs. Crea un archivo `vercel.json` en la raíz del proyecto:

```json
{
  "crons": [
    {
      "path": "/api/cron/auto-recharge",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

Esto ejecutará el cron job cada 6 horas. Ajusta el schedule según tus necesidades usando formato cron.

**Nota**: Necesitas configurar el header `Authorization` en Vercel. Puedes hacerlo usando variables de entorno en el cron job o configurando un middleware.

### Opción 2: GitHub Actions

Crea un archivo `.github/workflows/auto-recharge.yml`:

```yaml
name: Auto Recharge Cron

on:
  schedule:
    # Ejecutar cada 6 horas
    - cron: '0 */6 * * *'
  workflow_dispatch: # Permite ejecución manual

jobs:
  trigger-auto-recharge:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Auto Recharge
        run: |
          curl -X POST https://tu-dominio.com/api/cron/auto-recharge \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Agrega `CRON_SECRET` como secret en GitHub: Settings → Secrets and variables → Actions.

### Opción 3: Servidor Linux con Cron

Si tienes acceso a un servidor Linux, puedes configurar un cron job:

```bash
# Editar crontab
crontab -e

# Agregar esta línea (ejecuta cada 6 horas)
0 */6 * * * curl -X POST https://tu-dominio.com/api/cron/auto-recharge -H "Authorization: Bearer tu-token-secreto"
```

### Opción 4: Servicios de Cron Externos

Puedes usar servicios como:
- **Cron-job.org**: https://cron-job.org
- **EasyCron**: https://www.easycron.com
- **Cronitor**: https://cronitor.io

Configura una tarea que haga un POST request a tu endpoint con el header de autorización.

## 📊 Respuesta del Endpoint

El endpoint retorna información detallada sobre el proceso:

```json
{
  "success": true,
  "message": "Auto-recharge check completed successfully",
  "duration": "1234ms",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "results": {
    "processed": 2,
    "skipped": 5,
    "errors": 0,
    "details": [
      {
        "walletId": "wallet-123",
        "status": "processed",
        "reason": "Recarga iniciada: $50"
      },
      {
        "walletId": "wallet-456",
        "status": "skipped",
        "reason": "Balance ($15) por encima del umbral ($10)"
      }
    ]
  }
}
```

## 🔍 Verificación

### Probar el Endpoint Manualmente

```bash
# Verificar que el endpoint está activo
curl https://tu-dominio.com/api/cron/auto-recharge

# Ejecutar la verificación (reemplaza con tu token)
curl -X POST https://tu-dominio.com/api/cron/auto-recharge \
  -H "Authorization: Bearer tu-token-secreto"
```

### Monitoreo

Revisa los logs de tu aplicación para ver:
- `[Cron] Iniciando verificación de recargas automáticas...`
- `[Stripe] Verificando X wallets con recarga automática habilitada`
- `[Stripe] Verificación completada: X procesadas, Y omitidas, Z errores`

## ⚙️ Configuración de Frecuencia

La frecuencia recomendada depende de tu uso:

- **Alta frecuencia (cada hora)**: Si tienes muchos usuarios y quieres recargas rápidas
  - Cron: `0 * * * *`

- **Frecuencia media (cada 6 horas)**: Recomendado para la mayoría de casos
  - Cron: `0 */6 * * *`

- **Baja frecuencia (diario)**: Si tienes pocos usuarios
  - Cron: `0 0 * * *` (medianoche)

## 🛡️ Seguridad

1. **Nunca expongas tu `CRON_SECRET`** en el código o repositorio
2. **Usa HTTPS** para todas las requests
3. **Genera un token único y seguro** para producción
4. **Rota el token periódicamente** si es necesario

## 📝 Notas Importantes

- El sistema verifica que no se haya procesado una recarga en las últimas 24 horas para evitar recargas duplicadas
- **Recargas Automáticas con Payment Methods**: Si una wallet tiene un `paymentMethodId` guardado, el sistema intentará hacer un cobro directo automático. Si falla, creará un payment link como fallback.
- Los payment links creados deben ser pagados por el usuario para que se acrediten los créditos
- Los cobros directos se procesan inmediatamente y los créditos se agregan automáticamente a la wallet

## 💳 Recargas Automáticas con Métodos de Pago Guardados

El sistema soporta dos tipos de recargas automáticas:

### 1. **Recarga con Payment Link** (Requiere acción del usuario)
- Se crea un payment link cuando el balance está bajo el umbral
- El usuario debe hacer clic y completar el pago manualmente
- Los créditos se agregan después de que el pago sea exitoso

### 2. **Recarga Automática Directa** (Sin intervención del usuario) ⭐
- Si el usuario ha guardado un método de pago, el sistema intenta cobrar automáticamente
- El cobro se procesa inmediatamente usando Stripe Payment Intents
- Los créditos se agregan automáticamente si el pago es exitoso
- Si el cobro falla (tarjeta rechazada, etc.), se crea un payment link como fallback

### Cómo Guardar un Método de Pago

1. **Crear Setup Intent**: 
   ```
   POST /api/wallet/payment-methods/setup
   ```
   Retorna un `clientSecret` que se usa con Stripe Elements en el frontend.

2. **Confirmar Setup Intent**: 
   Usa Stripe.js en el frontend para confirmar el Setup Intent con los datos de la tarjeta.

3. **Guardar Payment Method**:
   ```
   POST /api/wallet/payment-methods/save
   Body: { setupIntentId: "seti_xxx" }
   ```
   Guarda el payment method en la configuración de recarga automática.

### Endpoints Disponibles

- `GET /api/wallet/payment-methods` - Listar métodos de pago guardados
- `POST /api/wallet/payment-methods/setup` - Crear Setup Intent
- `POST /api/wallet/payment-methods/save` - Guardar método de pago
- `DELETE /api/wallet/payment-methods?paymentMethodId=pm_xxx` - Eliminar método de pago

## 🐛 Troubleshooting

### El cron job no se ejecuta

1. Verifica que `CRON_SECRET` esté configurado correctamente
2. Revisa los logs del cron job para ver errores
3. Prueba el endpoint manualmente con curl

### No se están procesando recargas

1. Verifica que las wallets tengan `enabled: true` en `AutoRechargeSettings`
2. Revisa que el balance esté por debajo del umbral
3. Verifica que no se haya procesado una recarga en las últimas 24 horas
4. Revisa los logs para ver errores específicos

### Errores de autenticación

1. Verifica que el header `Authorization` esté configurado correctamente
2. Asegúrate de que el token coincida con `CRON_SECRET`
3. Verifica que el token no tenga espacios adicionales

