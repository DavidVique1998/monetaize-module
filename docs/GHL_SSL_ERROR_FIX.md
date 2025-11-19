# Solución para Error SSL con GoHighLevel y MongoDB Atlas

## Error

```
80686F666C7F0000:error:0A000438:SSL routines:ssl3_read_bytes:tlsv1 alert internal error:ssl/record/rec_layer_s3.c:912:SSL alert number 80
MongoServerSelectionError: Failed to connect to MongoDB
```

## Causa Detallada

Este error (`ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR` con alert number 80) ocurre durante el **handshake SSL/TLS** entre tu aplicación Node.js y MongoDB Atlas. El servidor MongoDB está rechazando la conexión debido a un problema interno en la negociación SSL/TLS.

### ¿Por qué sucede?

1. **Incompatibilidad de versiones TLS/SSL:**
   - Node.js 22+ usa OpenSSL 3.x con niveles de seguridad más estrictos
   - MongoDB Atlas puede tener configuraciones SSL específicas que no son completamente compatibles
   - El handshake SSL falla antes de completarse

2. **Problemas de resolución DNS (IPv6 vs IPv4):**
   - Node.js puede intentar conectarse usando IPv6 primero
   - Si MongoDB Atlas o la red no soportan IPv6 correctamente, el handshake SSL falla
   - El error se manifiesta como "alert internal error" porque la conexión se interrumpe durante la negociación

3. **Configuración de seguridad de OpenSSL:**
   - Algunos entornos (como Vercel con ciertas configuraciones) pueden tener OpenSSL con niveles de seguridad estrictos
   - Esto puede causar que ciertos cifrados o protocolos TLS sean rechazados

4. **Limitaciones del SDK de GoHighLevel:**
   - El SDK usa `MongoDBSessionStorage` que internamente usa el driver de MongoDB
   - Puede que no esté pasando todas las opciones SSL necesarias al driver
   - El driver puede necesitar opciones adicionales como `family: 4` (forzar IPv4) o parámetros SSL específicos

**Nota:** Este error puede ocurrir tanto con MongoDB Atlas (usado para almacenar sesiones de GoHighLevel) como con las APIs de GoHighLevel directamente.

## Soluciones

### Solución 1: Usar Node.js LTS (Recomendado)

Node.js 20 LTS es más estable y tiene mejor compatibilidad SSL:

```bash
# Si usas nvm
nvm install 20
nvm use 20

# Verificar versión
node --version  # Debe mostrar v20.x.x

# Reinstalar dependencias
rm -rf node_modules
pnpm install
```

### Solución 2: Configurar Variables de Entorno TLS

Agrega estas variables de entorno antes de ejecutar la aplicación:

**En `.env.development` o `.env.local`:**
```env
# Configuración TLS para Node.js 22+
NODE_OPTIONS=--tls-min-v1.2
```

**O ejecutar con variables de entorno:**
```bash
NODE_OPTIONS=--tls-min-v1.2 pnpm dev
```

### Solución 3: Configurar en el Script de Desarrollo

Modifica `package.json`:

```json
{
  "scripts": {
    "dev": "NODE_OPTIONS=--tls-min-v1.2 next dev"
  }
}
```

### Solución 4: Actualizar el SDK de GoHighLevel

Verifica si hay una versión más reciente del SDK:

```bash
pnpm update @gohighlevel/api-client
```

### Solución 5: Usar OpenSSL Legacy Provider (Solo Desarrollo)

⚠️ **ADVERTENCIA**: Solo para desarrollo, nunca en producción.

```bash
NODE_OPTIONS=--openssl-legacy-provider pnpm dev
```

O en `package.json`:
```json
{
  "scripts": {
    "dev": "NODE_OPTIONS=--openssl-legacy-provider next dev"
  }
}
```

## Verificación

Después de aplicar una solución, prueba el login con GoHighLevel:

1. Inicia la aplicación: `pnpm dev`
2. Ve a `/install_ghl`
3. Intenta conectar con GoHighLevel
4. Verifica que no aparezca el error SSL

## Solución Específica para MongoDB Atlas

Si el error ocurre específicamente con MongoDB Atlas, además de las soluciones anteriores:

### Solución MongoDB 1: Verificar IP Whitelisting

1. Ve a MongoDB Atlas Dashboard
2. Ve a **Network Access**
3. Asegúrate de que tu IP de Vercel esté en la lista blanca
4. O agrega `0.0.0.0/0` temporalmente para pruebas (⚠️ solo para desarrollo)

### Solución MongoDB 2: Actualizar URL de Conexión

Modifica tu `MONGODB_URL` para incluir parámetros SSL específicos:

**URL básica con SSL:**
```
mongodb+srv://user:pass@cluster.mongodb.net/database?tls=true&retryWrites=true&w=majority
```

**URL con parámetros SSL adicionales (si el problema persiste):**
```
mongodb+srv://user:pass@cluster.mongodb.net/database?tls=true&tlsAllowInvalidCertificates=false&retryWrites=true&w=majority&appName=Cluster0
```

**Solución alternativa: Forzar IPv4 en la URL (si hay problemas con IPv6):**
Si el problema persiste, puede ser un problema de IPv6. Intenta usar la conexión estándar (no SRV) que fuerza IPv4:

1. Obtén la conexión estándar desde MongoDB Atlas:
   - Ve a MongoDB Atlas → Connect → Connect your application
   - Selecciona "Standard connection string" en lugar de "SRV connection string"
   - Copia la URL que se ve así: `mongodb://...` (sin el `+srv`)

2. Agrega parámetros SSL:
```
mongodb://user:pass@cluster0-shard-00-00.xxxxx.mongodb.net:27017,cluster0-shard-00-01.xxxxx.mongodb.net:27017,cluster0-shard-00-02.xxxxx.mongodb.net:27017/database?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
```

**Nota:** La conexión estándar puede ser más estable que SRV en algunos entornos.

### Solución MongoDB 3: Verificar Versión del Driver

Asegúrate de usar una versión compatible del driver de MongoDB:

```bash
pnpm update mongodb
```

**Nota:** El SDK de GoHighLevel (`@gohighlevel/api-client`) usa internamente el driver de MongoDB. Verifica que la versión del SDK sea compatible:

```bash
pnpm update @gohighlevel/api-client
```

### Solución MongoDB 4: Agregar Variable NODE_OPTIONS en Vercel

**⚠️ CRÍTICO:** Esta es probablemente la solución más efectiva para Vercel:

1. Ve a Vercel Dashboard → Settings → Environment Variables
2. Agrega la variable:
   - **Name:** `NODE_OPTIONS`
   - **Value:** `--tls-min-v1.2`
   - **Environments:** ✅ **Solo Production** (NO marques Development ni Preview)
3. Guarda y redespliega

Esto fuerza a Node.js a usar TLS 1.2 como mínimo, que es compatible con MongoDB Atlas.

### Solución MongoDB 5: Verificar MongoDB Atlas Network Access

**IMPORTANTE:** Asegúrate de que MongoDB Atlas permita conexiones desde Vercel:

1. Ve a MongoDB Atlas Dashboard → **Network Access**
2. Verifica que `0.0.0.0/0` esté en la lista (permite todas las IPs)
   - ⚠️ Para producción, considera agregar solo las IPs de Vercel si es posible
   - Para desarrollo/pruebas, `0.0.0.0/0` es aceptable
3. Si acabas de agregar una IP, espera 1-2 minutos antes de probar

**Nota:** Si la IP no está permitida, MongoDB rechazará la conexión y puede generar este error SSL.

## Solución Recomendada para Producción (Vercel)

**⚠️ IMPORTANTE:** Este error generalmente solo ocurre en producción (Vercel), no en desarrollo local.

### Solución 1: Configurar Node.js 20 LTS en Vercel (Recomendado)

1. Ve a tu proyecto en Vercel Dashboard
2. Ve a **Settings** → **General**
3. Busca la sección **"Node.js Version"**
4. Selecciona **`20.x`** (LTS)
5. Guarda los cambios
6. Redespliega la aplicación

### Solución 2: Agregar Variable de Entorno NODE_OPTIONS (Solo Producción)

Si después de configurar Node.js 20 aún tienes problemas:

1. Ve a **Settings** → **Environment Variables** en Vercel
2. Agrega la variable:
   - **Name:** `NODE_OPTIONS`
   - **Value:** `--tls-min-v1.2`
   - **Environments:** ✅ **Solo Production** (NO marques Development ni Preview)
3. Guarda y redespliega

**⚠️ ADVERTENCIA:** No agregues `NODE_OPTIONS` en Development ni Preview, ya que puede causar problemas en desarrollo local.

### Solución 3: Especificar en package.json

El `package.json` ya incluye:
```json
{
  "engines": {
    "node": ">=20.0.0 <23.0.0"
  }
}
```

Sin embargo, Vercel puede ignorar esto, por lo que es mejor configurarlo explícitamente en Settings (Solución 1).

## Solución Rápida (Checklist) - Orden de Prioridad

Si estás experimentando este error en producción (Vercel), sigue estos pasos **en orden**:

### Paso 1: Verificar MongoDB Atlas Network Access (CRÍTICO)
1. Ve a MongoDB Atlas Dashboard → **Network Access**
2. Asegúrate de que `0.0.0.0/0` esté permitido
3. Si acabas de agregarlo, espera 1-2 minutos

### Paso 2: Configurar Node.js 20 LTS en Vercel (CRÍTICO)
1. Ve a Vercel Dashboard → Settings → **General**
2. Busca **"Node.js Version"**
3. Selecciona **`20.x`** (LTS)
4. Guarda los cambios

### Paso 3: Agregar NODE_OPTIONS en Vercel (MUY RECOMENDADO)
1. Ve a Vercel Dashboard → Settings → **Environment Variables**
2. Agrega la variable:
   - **Name:** `NODE_OPTIONS`
   - **Value:** `--tls-min-v1.2`
   - **Environments:** ✅ **Solo Production** (NO marques Development ni Preview)
3. Guarda

### Paso 4: Verificar MONGODB_URL tiene parámetros SSL
Tu URL debe verse así:
```
mongodb+srv://user:pass@cluster.mongodb.net/database?tls=true&retryWrites=true&w=majority&appName=Cluster0
```

Si tu URL no tiene `?tls=true`, actualízala en Vercel → Settings → Environment Variables

### Paso 5: Redesplegar la aplicación
1. Ve a Vercel Dashboard → **Deployments**
2. Haz clic en los tres puntos del último deployment → **Redeploy**
3. O simplemente haz un nuevo commit y push

### Si el problema persiste después de estos pasos:

**Solución alternativa: Usar conexión estándar (no SRV)**
1. En MongoDB Atlas → Connect → Connect your application
2. Selecciona **"Standard connection string"** (no SRV)
3. Copia la URL y actualiza `MONGODB_URL` en Vercel
4. Asegúrate de que incluya `?ssl=true&retryWrites=true&w=majority`
5. Redespliega

## Referencias

- [Node.js TLS Documentation](https://nodejs.org/api/tls.html)
- [OpenSSL 3.0 Migration Guide](https://www.openssl.org/docs/man3.0/man7/migration_guide.html)
- [GoHighLevel API Client](https://www.npmjs.com/package/@gohighlevel/api-client)
- [MongoDB Atlas Connection String](https://www.mongodb.com/docs/atlas/connection-string/)
- [MongoDB Node.js Driver SSL/TLS](https://www.mongodb.com/docs/drivers/node/current/fundamentals/connection/connection-options/#tls-ssl-options)

