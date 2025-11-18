# 🚀 Guía de Despliegue en Vercel - Paso a Paso

Esta guía te llevará paso a paso para desplegar tu aplicación en Vercel con todos los cron jobs configurados.

## 📋 Prerequisitos

- ✅ Cuenta en Vercel (gratis en https://vercel.com)
- ✅ Proyecto en Git (GitHub, GitLab o Bitbucket)
- ✅ Base de datos PostgreSQL configurada (Supabase, Railway, etc.)

---

## Paso 1: Preparar el Proyecto

### 1.1 Verificar archivos importantes

Asegúrate de tener estos archivos en tu proyecto:

- ✅ `vercel.json` (ya está creado)
- ✅ `package.json` con scripts de build
- ✅ `.env.local.example` como referencia
- ✅ `prisma/schema.prisma` actualizado

### 1.2 Verificar que todo esté commiteado

```bash
# Verificar estado
git status

# Si hay cambios sin commitear
git add .
git commit -m "Preparar para despliegue en Vercel"
```

### 1.3 Push a tu repositorio

```bash
# Asegúrate de que todo esté en el repositorio remoto
git push origin main
# o
git push origin master
```

---

## Paso 2: Crear Proyecto en Vercel

### 2.1 Iniciar sesión en Vercel

1. Ve a https://vercel.com
2. Inicia sesión con GitHub, GitLab o Bitbucket
3. Si es tu primera vez, autoriza a Vercel a acceder a tus repositorios

### 2.2 Importar Proyecto

1. Haz clic en **"Add New..."** → **"Project"**
2. Selecciona tu repositorio de Git
3. Si no aparece, haz clic en **"Adjust GitHub App Permissions"** y autoriza

### 2.3 Configurar Proyecto

En la pantalla de configuración:

**Framework Preset:**
- Selecciona **"Next.js"** (debería detectarse automáticamente)

**Root Directory:**
- Deja en blanco (si el proyecto está en la raíz)
- O especifica la carpeta si está en un subdirectorio

**Build Command:**
- Deja el predeterminado: `npm run build` o `pnpm build`

**Output Directory:**
- Deja el predeterminado: `.next`

**Install Command:**
- Si usas pnpm: `pnpm install`
- Si usas npm: `npm install`
- Si usas yarn: `yarn install`

---

## Paso 3: Configurar Variables de Entorno

**⚠️ IMPORTANTE:** Configura todas las variables de entorno ANTES de hacer el primer despliegue.

### 3.1 Variables de Base de Datos

En la sección **"Environment Variables"**, agrega:

| Name | Value | Environments |
|------|-------|--------------|
| `DATABASE_URL` | Tu connection string de PostgreSQL | Production, Preview, Development |
| `DIRECT_URL` | Tu connection string directa (sin pooling) | Production, Preview, Development |

**Ejemplo:**
```
DATABASE_URL=postgresql://user:password@host:5432/database?pgbouncer=true
DIRECT_URL=postgresql://user:password@host:5432/database
```

### 3.2 Variables de JWT y Seguridad

| Name | Value | Environments |
|------|-------|--------------|
| `JWT_SECRET` | Genera con: `openssl rand -hex 32` | Production, Preview, Development |
| `JWT_EXPIRES_IN` | `30d` | Production, Preview, Development |
| `CRON_SECRET` | Genera con: `openssl rand -hex 32` | Production, Preview, Development |

**Generar secretos seguros:**
```bash
# En tu terminal local
openssl rand -hex 32
# Copia el resultado y úsalo como valor
```

### 3.3 Variables de Stripe (si usas pagos)

| Name | Value | Environments |
|------|-------|--------------|
| `STRIPE_SECRET_KEY` | `sk_live_...` o `sk_test_...` | Production, Preview |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` o `pk_test_...` | Production, Preview |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Production, Preview |

### 3.4 Variables de GoHighLevel (si aplica)

| Name | Value | Environments |
|------|-------|--------------|
| `GHL_TOKEN` | Tu token de GHL | Production, Preview, Development |
| `GHL_APP_ID` | Tu App ID | Production, Preview, Development |
| `GHL_API_SECRET` | Tu API Secret | Production, Preview, Development |

### 3.5 Variables de Retell AI (si aplica)

| Name | Value | Environments |
|------|-------|--------------|
| `RETELL_API_KEY` | Tu API key | Production, Preview, Development |
| `RETELL_AGENT_ID` | Tu Agent ID | Production, Preview, Development |

### 3.6 Variables de Aplicación

| Name | Value | Environments |
|------|-------|--------------|
| `NEXT_PUBLIC_APP_URL` | `https://tu-dominio.vercel.app` | Production |
| `NODE_ENV` | `production` | Production |

**Nota:** Para obtener la URL de producción, espera a que se complete el primer despliegue.

---

## Paso 4: Configurar Base de Datos

### 4.1 Ejecutar Migraciones

Después del primer despliegue, necesitas ejecutar las migraciones de Prisma:

**Opción 1: Desde Vercel CLI (Recomendado)**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Link al proyecto
vercel link

# Ejecutar migraciones en producción
vercel env pull .env.production
npx prisma migrate deploy
```

**Opción 2: Desde tu máquina local**

```bash
# Configurar DATABASE_URL para producción
export DATABASE_URL="tu-connection-string-de-produccion"

# Ejecutar migraciones
npx prisma migrate deploy
```

**Opción 3: Script de build en Vercel**

Puedes agregar un script postinstall en `package.json`:

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "vercel-build": "prisma migrate deploy && prisma generate && next build"
  }
}
```

Y cambiar el Build Command en Vercel a: `pnpm vercel-build` o `npm run vercel-build`

---

## Paso 5: Desplegar

### 5.1 Primer Despliegue

1. En la pantalla de configuración de Vercel, haz clic en **"Deploy"**
2. Espera a que se complete el build (puede tomar 2-5 minutos)
3. Si hay errores, revisa los logs en la pestaña **"Deployments"**

### 5.2 Verificar Despliegue

1. Una vez completado, verás la URL de tu aplicación
2. Haz clic en la URL para abrirla
3. Verifica que la aplicación cargue correctamente

---

## Paso 6: Configurar Cron Jobs

### 6.1 Verificar vercel.json

El archivo `vercel.json` ya está configurado con:

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

### 6.2 Verificar Cron Jobs en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → **Cron Jobs**
3. Deberías ver los dos cron jobs configurados:
   - `auto-recharge` - Cada 6 horas
   - `process-batches` - Cada 2 minutos

### 6.3 Verificar Ejecución

1. En la pestaña **Cron Jobs**, puedes ver el historial de ejecuciones
2. Haz clic en un cron job para ver logs y estado
3. Si hay errores, revisa los logs

---

## Paso 7: Verificar Endpoints

### 7.1 Probar Endpoint de Consumo

```bash
# Obtén un token JWT desde tu perfil
# Luego prueba el endpoint:

curl -X POST https://tu-dominio.vercel.app/api/wallet/consume-batch \
  -H "Authorization: Bearer TU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 0.01,
    "reason": "Prueba de despliegue",
    "metricType": "test",
    "metricValue": 1
  }'
```

### 7.2 Verificar Logs

1. Ve a Vercel → Tu Proyecto → **Logs**
2. Busca logs de tus endpoints
3. Verifica que no haya errores

---

## Paso 8: Configurar Dominio Personalizado (Opcional)

### 8.1 Agregar Dominio

1. Ve a Settings → **Domains**
2. Agrega tu dominio personalizado
3. Sigue las instrucciones para configurar DNS

### 8.2 Actualizar Variables de Entorno

Actualiza `NEXT_PUBLIC_APP_URL` con tu dominio personalizado:

```
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

---

## 🔧 Troubleshooting

### Error: "Module not found"

**Solución:**
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que el Install Command sea correcto

### Error: "Database connection failed"

**Solución:**
- Verifica que `DATABASE_URL` esté configurada correctamente
- Asegúrate de que la base de datos permita conexiones desde Vercel
- Verifica que no haya restricciones de IP

### Error: "Prisma Client not generated"

**Solución:**
- Agrega `prisma generate` al build command
- O agrega un script postinstall en package.json

### Cron Jobs no se ejecutan

**Solución:**
1. Verifica que `vercel.json` esté en la raíz del proyecto
2. Verifica que el formato del schedule sea correcto
3. Revisa los logs del cron job en Vercel
4. Asegúrate de que el endpoint responda correctamente

### Error: "Unauthorized" en cron jobs

**Solución:**
- Los cron jobs de Vercel se ejecutan internamente, no requieren autenticación
- Si llamas manualmente, usa `CRON_SECRET` en el header Authorization

---

## 📊 Monitoreo

### Ver Logs en Tiempo Real

1. Ve a Vercel → Tu Proyecto → **Logs**
2. Filtra por función o endpoint
3. Monitorea errores y rendimiento

### Ver Métricas

1. Ve a Vercel → Tu Proyecto → **Analytics**
2. Revisa:
   - Requests por segundo
   - Tiempo de respuesta
   - Errores

### Verificar Cron Jobs

1. Ve a Settings → **Cron Jobs**
2. Revisa el historial de ejecuciones
3. Verifica que se ejecuten según el schedule

---

## 🔄 Actualizaciones Futuras

### Desplegar Cambios

Cada vez que hagas push a tu repositorio:

```bash
git add .
git commit -m "Descripción de cambios"
git push origin main
```

Vercel detectará automáticamente los cambios y desplegará una nueva versión.

### Despliegues de Preview

Vercel crea automáticamente un preview para cada pull request:
- Útil para probar cambios antes de producción
- Tiene su propio conjunto de variables de entorno

---

## ✅ Checklist Final

Antes de considerar el despliegue completo:

- [ ] Proyecto desplegado sin errores
- [ ] Variables de entorno configuradas
- [ ] Migraciones de base de datos ejecutadas
- [ ] Cron jobs configurados y funcionando
- [ ] Endpoints probados y funcionando
- [ ] Logs sin errores críticos
- [ ] Dominio personalizado configurado (si aplica)
- [ ] Documentación actualizada con URLs de producción

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs en Vercel
2. Verifica la documentación de Vercel: https://vercel.com/docs
3. Revisa la documentación del proyecto en `docs/`

---

**¡Felicitaciones! Tu aplicación está desplegada en Vercel 🎉**

