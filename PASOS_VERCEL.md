# 🚀 Pasos para Publicar en Vercel

## 📝 PASO 1: Preparar el Código

```bash
# 1. Verifica que todo esté guardado
git status

# 2. Agrega todos los cambios
git add .

# 3. Haz commit
git commit -m "Preparar para despliegue en Vercel"

# 4. Sube a GitHub/GitLab
git push origin main
```

---

## 🌐 PASO 2: Crear Proyecto en Vercel

1. **Ve a https://vercel.com**
2. **Inicia sesión** (con GitHub, GitLab o Bitbucket)
3. **Haz clic en "Add New..." → "Project"**
4. **Selecciona tu repositorio**
5. **Configura el proyecto:**
   - Framework: **Next.js** (debería detectarse automáticamente)
   - Build Command: `pnpm vercel-build` (o `npm run vercel-build`)
   - Install Command: `pnpm install` (o `npm install`)
   - Root Directory: (deja vacío si está en la raíz)

---

## 🔐 PASO 3: Configurar Variables de Entorno

**ANTES de hacer clic en "Deploy", configura estas variables:**

### Variables Obligatorias:

1. **Base de Datos:**
   ```
   DATABASE_URL = postgresql://user:password@host:5432/database
   DIRECT_URL = postgresql://user:password@host:5432/database
   ```

2. **Seguridad (genera tokens seguros):**
   ```bash
   # En tu terminal, ejecuta:
   openssl rand -hex 32
   # Copia el resultado y úsalo para JWT_SECRET
   ```
   ```
   JWT_SECRET = [resultado del comando anterior]
   JWT_EXPIRES_IN = 30d
   CRON_SECRET = [genera otro con openssl rand -hex 32]
   ```

3. **Aplicación:**
   ```
   NODE_ENV = production
   NEXT_PUBLIC_APP_URL = https://tu-proyecto.vercel.app
   ```
   *(Actualiza la URL después del primer despliegue)*

### Variables Opcionales (si las usas):

- Stripe (si usas pagos)
- GoHighLevel (si usas GHL)
- Retell AI (si usas Retell)

**Para cada variable:**
- Haz clic en "Add" en Environment Variables
- Ingresa el Name y Value
- Selecciona: Production, Preview, Development
- Guarda

---

## 🚀 PASO 4: Desplegar

1. **Haz clic en "Deploy"**
2. **Espera 2-5 minutos** mientras se construye
3. **Cuando termine, verás la URL** de tu aplicación
4. **Haz clic en la URL** para abrirla

---

## 🗄️ PASO 5: Ejecutar Migraciones de Base de Datos

Después del primer despliegue, ejecuta las migraciones:

### Opción A: Desde tu computadora

```bash
# 1. Configura la variable de entorno
export DATABASE_URL="tu-connection-string-de-produccion"

# 2. Ejecuta las migraciones
npx prisma migrate deploy

# 3. Genera el cliente
npx prisma generate
```

### Opción B: Desde Vercel CLI

```bash
# 1. Instala Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link al proyecto
vercel link

# 4. Descarga variables de entorno
vercel env pull .env.production

# 5. Ejecuta migraciones
npx prisma migrate deploy
```

---

## ⏰ PASO 6: Verificar Cron Jobs

1. **Ve a tu proyecto en Vercel**
2. **Settings → Cron Jobs**
3. **Deberías ver 2 cron jobs:**
   - `auto-recharge` (cada 6 horas)
   - `process-batches` (cada 2 minutos)
4. **Haz clic en cada uno** para ver el historial

---

## ✅ PASO 7: Verificar que Todo Funciona

### 7.1 Probar la Aplicación

1. Abre la URL de producción
2. Inicia sesión
3. Verifica que todo cargue correctamente

### 7.2 Probar Endpoints

```bash
# 1. Obtén un token JWT desde tu perfil en la app
# 2. Prueba el endpoint:

curl -X POST https://tu-proyecto.vercel.app/api/wallet/consume-batch \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 0.01,
    "reason": "Prueba de despliegue",
    "metricType": "test"
  }'
```

### 7.3 Verificar Logs

1. Ve a Vercel → Tu Proyecto → **Logs**
2. Busca errores
3. Verifica que los endpoints respondan

---

## 🔄 PASO 8: Actualizar URL en Variables de Entorno

1. **Copia la URL de producción** (ej: `https://monetaize-module.vercel.app`)
2. **Ve a Settings → Environment Variables**
3. **Actualiza `NEXT_PUBLIC_APP_URL`** con la URL real
4. **Redeploy** (Vercel lo hará automáticamente o haz clic en "Redeploy")

---

## 📋 Checklist Rápido

- [ ] Código pusheado a Git
- [ ] Proyecto creado en Vercel
- [ ] Variables de entorno configuradas
- [ ] Primer despliegue completado
- [ ] Migraciones ejecutadas
- [ ] Cron jobs visibles
- [ ] Aplicación funciona
- [ ] Endpoints probados
- [ ] Sin errores en logs

---

## 🆘 Si Algo Sale Mal

### Error en Build
- Revisa los logs en Vercel
- Verifica que todas las dependencias estén en `package.json`

### Error de Base de Datos
- Verifica que `DATABASE_URL` sea correcta
- Asegúrate de que la base de datos permita conexiones externas

### Cron Jobs No Funcionan
- Verifica que `vercel.json` esté en la raíz
- Revisa los logs del cron job en Vercel

### Endpoints No Funcionan
- Verifica que el token JWT sea válido
- Revisa los logs en Vercel
- Verifica que las variables de entorno estén configuradas

---

## 📚 Documentación Completa

Para más detalles, consulta:
- **Guía completa:** `docs/DEPLOY_VERCEL.md`
- **Checklist detallado:** `DEPLOY_CHECKLIST.md`

---

**¡Listo! Tu aplicación está en producción 🎉**

