# Solución para Cookies en Iframes de GoHighLevel

## Problema

Cuando la aplicación se ejecuta dentro de un iframe de GoHighLevel, las cookies de sesión no se guardan correctamente después del callback OAuth. El flujo funciona correctamente cuando se ejecuta fuera del iframe, pero dentro del iframe la sesión no persiste.

## Causa

Las cookies tienen restricciones de seguridad que bloquean su uso en contextos de terceros (iframes):

1. **SameSite Cookie Attribute**: Por defecto, las cookies con `sameSite: 'lax'` no se envían en requests de terceros (como cuando estás en un iframe de otro dominio).

2. **Secure Cookie Requirement**: Cuando usas `sameSite: 'none'`, el navegador **requiere** que la cookie tenga `secure: true`, lo que significa que solo funciona en conexiones HTTPS.

3. **X-Frame-Options / CSP**: Algunos headers de seguridad pueden bloquear que la aplicación se cargue en iframes.

## Solución Implementada

### 1. Configuración de Cookies (`src/lib/session.ts`)

Las cookies ahora se configuran automáticamente para funcionar en iframes:

```typescript
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction || process.env.ENABLE_SECURE_COOKIES === 'true',
  sameSite: (enableIframeCookies ? 'none' : 'lax') as 'lax' | 'none',
  maxAge: SESSION_MAX_AGE,
  path: '/',
};
```

**Comportamiento:**
- **En producción**: Automáticamente usa `sameSite: 'none'` y `secure: true`
- **En desarrollo**: Usa `sameSite: 'lax'` (puedes forzar iframe con variable de entorno)

### 2. Headers de Seguridad (`src/middleware.ts`)

Se agregaron headers Content-Security-Policy para permitir que la aplicación se cargue en iframes de GoHighLevel:

```typescript
response.headers.set(
  'Content-Security-Policy',
  `frame-ancestors 'self' https://*.gohighlevel.com https://*.highlevel.com; ${cspHeader}`
);
```

Esto permite que:
- El mismo origen (`'self'`) pueda cargar la app en iframe
- Cualquier subdominio de `gohighlevel.com` pueda cargar la app en iframe
- Cualquier subdominio de `highlevel.com` pueda cargar la app en iframe

## Configuración Requerida

### Variables de Entorno

**En Producción (Vercel):**

Las cookies funcionarán automáticamente porque:
- `NODE_ENV=production` activa `sameSite: 'none'` y `secure: true`
- La aplicación está en HTTPS (requerido para `secure: true`)

**En Desarrollo Local:**

Si quieres probar con iframes en desarrollo local, necesitas:

1. **Usar HTTPS local** (requerido para `secure: true`):
   ```bash
   # Con Next.js puedes usar un proxy HTTPS o configurar SSL local
   # Ejemplo con mkcert:
   mkcert -install
   mkcert localhost 127.0.0.1 ::1
   ```

2. **Agregar variable de entorno** en `.env.local`:
   ```env
   ENABLE_IFRAME_COOKIES=true
   ENABLE_SECURE_COOKIES=true
   ```

**⚠️ IMPORTANTE:** Sin HTTPS en desarrollo local, las cookies con `secure: true` no funcionarán.

## Verificación

### 1. Verificar Cookies en el Navegador

Después del callback OAuth, verifica en las DevTools del navegador:

1. Abre **DevTools** → **Application** → **Cookies**
2. Busca la cookie `monetaize_session`
3. Verifica que tenga:
   - **SameSite**: `None`
   - **Secure**: ✅ (checked)
   - **HttpOnly**: ✅ (checked)

### 2. Verificar Headers de Respuesta

En las DevTools → **Network** → Selecciona cualquier request → **Headers**:

- Debe incluir: `Content-Security-Policy: frame-ancestors 'self' https://*.gohighlevel.com https://*.highlevel.com`
- NO debe incluir: `X-Frame-Options: DENY` o `X-Frame-Options: SAMEORIGIN` (a menos que sea necesario)

### 3. Probar en Iframe de GoHighLevel

1. Abre tu aplicación dentro del iframe de GoHighLevel
2. Inicia el proceso de OAuth
3. Completa el callback
4. Verifica que la sesión persista después del redirect

## Troubleshooting

### Las cookies no se guardan en producción

**Verifica:**
1. ✅ La aplicación está en HTTPS (requerido para `secure: true`)
2. ✅ `NODE_ENV=production` está configurado
3. ✅ Las cookies tienen `SameSite=None` y `Secure=true`

**Solución:**
- Verifica que Vercel esté sirviendo la app en HTTPS
- Revisa los logs del servidor para ver si hay errores al establecer cookies

### Las cookies no se guardan en desarrollo local

**Causa:** Desarrollo local usa HTTP, pero `secure: true` requiere HTTPS.

**Soluciones:**
1. **Opción 1**: Usar HTTPS local (recomendado para pruebas de iframe)
2. **Opción 2**: Desactivar `secure` en desarrollo (menos seguro):
   ```typescript
   secure: false, // Solo para desarrollo local sin HTTPS
   sameSite: 'lax', // Funciona sin HTTPS
   ```

### La aplicación no se carga en el iframe

**Verifica:**
1. ✅ Los headers CSP permiten `frame-ancestors` desde GoHighLevel
2. ✅ No hay headers `X-Frame-Options: DENY`
3. ✅ El dominio de GoHighLevel está en la lista de `frame-ancestors`

**Solución:**
- Verifica que el middleware esté agregando los headers CSP correctos
- Revisa la consola del navegador para errores de CSP

### La sesión se pierde después del redirect

**Causa:** El redirect puede estar limpiando las cookies o cambiando el contexto.

**Solución:**
- Verifica que el redirect use la misma URL base
- Asegúrate de que `path: '/'` en las cookies permita acceso desde todas las rutas
- Verifica que el dominio de la cookie sea correcto (no debe incluir subdominios específicos)

## Referencias

- [MDN: SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [MDN: Content-Security-Policy frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors)
- [Chrome: Cookies in iframes](https://www.chromium.org/updates/same-site)






