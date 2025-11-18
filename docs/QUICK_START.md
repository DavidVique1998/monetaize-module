# 🚀 Guía Rápida - Endpoints de Consumo de Créditos

## ⚡ Inicio Rápido

### 1. Obtener Token JWT

**Opción más fácil:**
1. Inicia sesión en la aplicación
2. Ve a **Mi Perfil** (`/profile`)
3. Haz clic en **"Generar Token"** en la sección "Token JWT para API"
4. Copia el token

### 2. Usar el Endpoint

**Para chatbots (alto volumen):**
```bash
curl -X POST https://tu-dominio.com/api/wallet/consume-batch \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 0.01,
    "reason": "Mensaje de chatbot",
    "metricType": "ai_message",
    "metricValue": 1
  }'
```

**Para operaciones críticas (bajo volumen):**
```bash
curl -X POST https://tu-dominio.com/api/wallet/consume-token \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 0.1,
    "reason": "Operación crítica",
    "metricType": "ai_call",
    "metricValue": 1
  }'
```

### 3. Configurar Vercel Cron

1. **Crea `vercel.json`** en la raíz (ya está creado)
2. **Agrega variable de entorno** en Vercel:
   - Name: `CRON_SECRET`
   - Value: Genera con `openssl rand -hex 32`
3. **Despliega** - Vercel configurará automáticamente los cron jobs

## 📚 Documentación Completa

- **Guía completa de endpoints**: [`docs/API_ENDPOINTS_GUIDE.md`](./API_ENDPOINTS_GUIDE.md)
- **Sistema de procesamiento por lotes**: [`docs/BATCH_PROCESSING.md`](./BATCH_PROCESSING.md)

## 🔧 Configuración de Vercel

El archivo `vercel.json` ya está configurado con:

- **Auto-recharge**: Cada 6 horas (`0 */6 * * *`)
- **Process batches**: Cada 2 minutos (`*/2 * * * *`)

Solo necesitas:
1. Agregar `CRON_SECRET` en Vercel
2. Desplegar

## ❓ ¿Necesitas ayuda?

Consulta la [guía completa](./API_ENDPOINTS_GUIDE.md) para:
- Ejemplos detallados
- Troubleshooting
- Mejores prácticas
- Seguridad

