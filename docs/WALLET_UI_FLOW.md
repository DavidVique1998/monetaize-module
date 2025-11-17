# 💰 Flujo de Wallet desde la Interfaz de Usuario

Este documento explica cómo funciona la página de wallet desde la perspectiva del usuario y dónde se ejecutan las acciones de recarga automática.

## 📍 Ubicación de la Página

La página de wallet está en: `/wallet`

**Archivo principal**: `src/app/wallet/page.tsx`

## 🎨 Componentes de la Página

La página de wallet está compuesta por varios componentes:

### 1. **WalletBalanceCard** 
- **Ubicación**: `src/components/wallet/WalletBalanceCard.tsx`
- **Función**: Muestra el balance actual y botón para recarga manual
- **Acciones**:
  - Muestra el saldo actual
  - Botón "Recargar" que abre el modal de recarga

### 2. **AutoRechargeSettings** ⭐
- **Ubicación**: `src/components/wallet/AutoRechargeSettings.tsx`
- **Función**: Configuración de recarga automática
- **Acciones del usuario**:
  1. **Ver métodos de pago guardados** (integrado con PaymentMethodManager)
  2. **Configurar umbral** (ej: $10)
  3. **Configurar monto de recarga** (ej: $50)
  4. **Habilitar/deshabilitar recarga automática** (toggle)
  5. **Guardar configuración**

### 3. **PaymentMethodManager** ⭐
- **Ubicación**: `src/components/wallet/PaymentMethodManager.tsx`
- **Función**: Gestionar métodos de pago guardados
- **Acciones del usuario**:
  1. **Agregar método de pago**:
     - Click en "Agregar"
     - Ingresar datos de tarjeta (número, vencimiento, CVC, nombre)
     - Confirmar y guardar
  2. **Ver métodos de pago guardados**
  3. **Eliminar método de pago**

### 4. **WalletTransactions**
- **Ubicación**: `src/components/wallet/WalletTransactions.tsx`
- **Función**: Historial de transacciones
- **Acciones**: Solo lectura

### 5. **RechargeModal**
- **Ubicación**: `src/components/wallet/RechargeModal.tsx`
- **Función**: Modal para recarga manual
- **Acciones**: Crear payment link para recarga única

## 🔄 Flujo Completo de Recarga Automática

### Paso 1: Usuario Guarda su Método de Pago

**Dónde**: En el componente `PaymentMethodManager` (integrado en `AutoRechargeSettings`)

**Proceso**:
1. Usuario hace clic en "Agregar" en la sección de métodos de pago
2. Se muestra un formulario para ingresar:
   - Nombre en la tarjeta
   - Número de tarjeta
   - Fecha de vencimiento (MM/AA)
   - CVC
3. Usuario completa el formulario y hace clic en "Guardar Tarjeta"
4. **Backend**:
   - Se crea un Setup Intent (`POST /api/wallet/payment-methods/setup`)
   - Se confirma con Stripe.js usando los datos de la tarjeta
   - Se guarda el Payment Method ID (`POST /api/wallet/payment-methods/save`)
5. El método de pago aparece en la lista

**⚠️ IMPORTANTE**: En este punto **NO se cobra nada**. Solo se guarda la tarjeta de forma segura.

### Paso 2: Usuario Configura Recarga Automática

**Dónde**: En el componente `AutoRechargeSettings`

**Proceso**:
1. Usuario configura:
   - **Umbral**: Balance mínimo que activa la recarga (ej: $10)
   - **Monto**: Cuánto se recargará automáticamente (ej: $50)
2. Usuario activa el toggle "Habilitar recarga automática"
   - **Validación**: Si no hay método de pago guardado, se muestra un error
   - **Mensaje de consentimiento**: Se muestra claramente que se cobrará automáticamente
3. Usuario hace clic en "Guardar Configuración"
4. **Backend**: 
   - Se actualiza la configuración (`PATCH /api/wallet/auto-recharge`)
   - Se guarda `enabled: true`, `threshold`, `rechargeAmount`, y `paymentMethodId`

**✅ CONSENTIMIENTO**: Al activar el toggle y guardar, el usuario está dando su consentimiento explícito para:
- Monitoreo automático del balance
- Cobro automático cuando el balance baje del umbral
- Uso del método de pago guardado

### Paso 3: Sistema Procesa Recargas Automáticamente

**Dónde**: Backend (cron job)

**Proceso** (NO requiere acción del usuario):
1. Cron job ejecuta periódicamente: `POST /api/cron/auto-recharge`
2. Sistema verifica todas las wallets con `enabled: true`
3. Para cada wallet:
   - Verifica si `balance <= threshold`
   - Verifica que no se haya procesado una recarga en las últimas 24 horas
   - Si hay `paymentMethodId` guardado:
     - Intenta cobro directo usando `chargePaymentMethod()`
     - Si es exitoso, agrega créditos automáticamente
     - Si falla, crea un payment link como fallback
   - Si no hay `paymentMethodId`:
     - Crea un payment link (el usuario debe pagar manualmente)

## 📱 Interfaz de Usuario - Detalles

### Sección: Recarga Automática

```
┌─────────────────────────────────────────┐
│ ⚙️ Recarga Automática                   │
│ Configura recargas automáticas...       │
├─────────────────────────────────────────┤
│                                         │
│ [PaymentMethodManager integrado]        │
│ - Ver métodos de pago guardados         │
│ - Agregar nuevo método de pago          │
│ - Eliminar método de pago               │
│                                         │
├─────────────────────────────────────────┤
│ ✅ Método de pago guardado              │
│ Las recargas se procesarán...           │
├─────────────────────────────────────────┤
│ [Toggle] Habilitar recarga automática   │
│ Recarga automáticamente cuando...       │
│ Se cobrará $50 cuando balance < $10     │
├─────────────────────────────────────────┤
│ Umbral: $10  │  Monto: $50             │
├─────────────────────────────────────────┤
│ Última recarga: 15 nov, 10:30          │
├─────────────────────────────────────────┤
│ [Guardar Configuración]                 │
└─────────────────────────────────────────┘
```

### Validaciones en la UI

1. **Sin método de pago**:
   - El toggle está deshabilitado
   - Se muestra mensaje: "Método de pago requerido"
   - No se puede habilitar la recarga automática

2. **Con método de pago**:
   - El toggle está habilitado
   - Se muestra mensaje de confirmación: "Se cobrará automáticamente $X cuando el balance baje de $Y"
   - Se puede habilitar/deshabilitar libremente

3. **Al eliminar método de pago**:
   - Si la recarga automática está habilitada, se deshabilita automáticamente
   - Se muestra mensaje de advertencia

## 🔗 Endpoints API Utilizados

### Desde PaymentMethodManager:
- `GET /api/wallet/payment-methods` - Listar métodos de pago
- `POST /api/wallet/payment-methods/setup` - Crear Setup Intent
- `POST /api/wallet/payment-methods/save` - Guardar método de pago
- `DELETE /api/wallet/payment-methods?paymentMethodId=xxx` - Eliminar método de pago

### Desde AutoRechargeSettings:
- `GET /api/wallet/auto-recharge` - Obtener configuración
- `PATCH /api/wallet/auto-recharge` - Actualizar configuración

## 🎯 Flujo de Usuario Típico

### Escenario 1: Usuario Nuevo

1. Usuario va a `/wallet`
2. Ve su balance actual
3. Ve que no tiene métodos de pago guardados
4. Hace clic en "Agregar" en la sección de métodos de pago
5. Ingresa los datos de su tarjeta
6. Guarda la tarjeta
7. Ahora puede configurar la recarga automática:
   - Configura umbral: $10
   - Configura monto: $50
   - Activa el toggle
   - Guarda la configuración
8. ✅ Listo - Las recargas se procesarán automáticamente

### Escenario 2: Usuario Existente

1. Usuario va a `/wallet`
2. Ve su método de pago guardado
3. Puede:
   - Modificar umbral/monto
   - Habilitar/deshabilitar recarga automática
   - Eliminar método de pago
   - Agregar otro método de pago

## 🔒 Seguridad y Privacidad

- Los datos de tarjeta **nunca** se envían directamente al servidor
- Se usa Stripe.js para manejar los datos de forma segura (PCI compliant)
- Solo se guarda el Payment Method ID (referencia segura)
- El usuario puede eliminar su método de pago en cualquier momento
- El usuario puede deshabilitar la recarga automática en cualquier momento

## 📝 Notas Importantes

1. **El usuario debe instalar `@stripe/stripe-js`** para que funcione el guardado de métodos de pago:
   ```bash
   pnpm add @stripe/stripe-js
   ```

2. **Variable de entorno requerida**:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

3. **El componente PaymentMethodManager está integrado** dentro de `AutoRechargeSettings` para una mejor UX

4. **Validaciones**:
   - No se puede habilitar recarga automática sin método de pago
   - No se puede guardar configuración con valores inválidos
   - Se valida que el método de pago exista antes de habilitar

