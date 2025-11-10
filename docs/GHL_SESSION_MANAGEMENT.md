# Gestión de Sesiones en GoHighLevel SDK

## Estructura de Sesiones en MongoDB

El SDK de GoHighLevel utiliza MongoDB para almacenar sesiones con la siguiente estructura:

### Índice Único Compuesto
```javascript
{ applicationId: 1, resourceId: 1 } // Índice único
```

### Campos de la Sesión
- **applicationId**: Extraído automáticamente del `clientId` (primera parte antes del "-")
- **resourceId**: Puede ser un `companyId` O un `locationId`
- **access_token**: Token de acceso
- **refresh_token**: Token de refresco
- **expire_at**: Fecha de expiración calculada automáticamente
- **userType**: 'Company' o 'Location'
- **companyId**: ID de la agencia (siempre presente)
- **locationId**: ID de la location (solo en sesiones de location)

## Tipos de Sesiones

### 1. Sesión de Company (Agency Token)
- **resourceId**: `companyId`
- **userType**: `'Company'`
- **Cuándo se crea**: Durante el callback OAuth cuando el usuario autoriza la aplicación
- **Propósito**: Token de nivel agencia que permite generar tokens de location

### 2. Sesión de Location (Location Token)
- **resourceId**: `locationId`
- **userType**: `'Location'`
- **Cuándo se crea**: Durante el webhook INSTALL cuando se instala la app en una location
- **Propósito**: Token específico para cada location instalada

## Flujo de Sesiones

```
1. OAuth Callback
   ↓
   Guarda sesión con resourceId = companyId
   (Agency Access Token)
   ↓
2. Webhook INSTALL
   ↓
   SDK busca sesión de companyId
   ↓
   Genera Location Access Token
   ↓
   Guarda sesión con resourceId = locationId
   (Location Access Token)
```

## Múltiples Sesiones

**SÍ, puedes manejar múltiples sesiones:**

1. **Una sesión por Company**: `resourceId = companyId`
2. **Múltiples sesiones por Location**: `resourceId = locationId1`, `locationId2`, etc.

Cada combinación `(applicationId, resourceId)` es única, por lo que puedes tener:
- 1 sesión de company: `(appId, companyId)`
- N sesiones de location: `(appId, locationId1)`, `(appId, locationId2)`, etc.

## Ejemplo de Estructura en MongoDB

```javascript
// Colección: application_sessions

[
  {
    applicationId: "68f4fdd5dd6b11887edf383b",
    resourceId: "XkDPrpIPqtMrw7l5hItq",  // companyId
    access_token: "agency_token_...",
    refresh_token: "agency_refresh_...",
    userType: "Company",
    companyId: "XkDPrpIPqtMrw7l5hItq",
    expire_at: ISODate("2024-01-15T10:00:00Z"),
    createdAt: ISODate("2024-01-01T10:00:00Z"),
    updatedAt: ISODate("2024-01-01T10:00:00Z")
  },
  {
    applicationId: "68f4fdd5dd6b11887edf383b",
    resourceId: "bJj4Qp5u7R1NucDUTmnj",  // locationId 1
    access_token: "location_token_1_...",
    refresh_token: "location_refresh_1_...",
    userType: "Location",
    companyId: "XkDPrpIPqtMrw7l5hItq",
    locationId: "bJj4Qp5u7R1NucDUTmnj",
    expire_at: ISODate("2024-01-15T10:00:00Z"),
    createdAt: ISODate("2024-01-01T11:00:00Z"),
    updatedAt: ISODate("2024-01-01T11:00:00Z")
  },
  {
    applicationId: "68f4fdd5dd6b11887edf383b",
    resourceId: "anotherLocationId",  // locationId 2
    access_token: "location_token_2_...",
    refresh_token: "location_refresh_2_...",
    userType: "Location",
    companyId: "XkDPrpIPqtMrw7l5hItq",
    locationId: "anotherLocationId",
    expire_at: ISODate("2024-01-15T10:00:00Z"),
    createdAt: ISODate("2024-01-01T12:00:00Z"),
    updatedAt: ISODate("2024-01-01T12:00:00Z")
  }
]
```

## Cómo el SDK Selecciona la Sesión

Cuando haces una llamada API, el SDK:

1. **Si la llamada requiere locationId**:
   - Busca sesión con `resourceId = locationId`
   - Si no existe, busca sesión con `resourceId = companyId`
   - Usa el token encontrado

2. **Si la llamada requiere companyId**:
   - Busca sesión con `resourceId = companyId`
   - Usa el token encontrado

## Verificación de Sesiones

Puedes verificar las sesiones almacenadas usando:

```typescript
const ghlApp = GHLApp.getInstance();
await ghlApp.initialize();

const sessionStorage = ghlApp.getSessionStorage();

// Obtener todas las sesiones de la aplicación
const allSessions = await sessionStorage.getSessionsByApplication();

// Obtener sesión específica por companyId
const companySession = await sessionStorage.getSession(companyId);

// Obtener sesión específica por locationId
const locationSession = await sessionStorage.getSession(locationId);
```

## Consideraciones Importantes

1. **El companyId siempre debe estar presente**: Antes de generar tokens de location, debe existir una sesión de company.

2. **El SDK maneja automáticamente**: Cuando llamas a `getLocationAccessToken()`, el SDK:
   - Busca la sesión de company
   - Genera el token de location
   - Guarda automáticamente la sesión de location

3. **Múltiples agencias**: Si tu app maneja múltiples agencias, cada una tendrá su propia sesión de company con diferentes `companyId`.

## Implementación Actual

En nuestro código:

- **OAuth Callback**: Guarda sesión con `resourceId = companyId` ✅
- **Webhook INSTALL**: El SDK automáticamente guarda sesión con `resourceId = locationId` ✅
- **Webhook UNINSTALL**: Elimina sesión con `resourceId = locationId` o `companyId` ✅

Todo está configurado correctamente para manejar múltiples sesiones.

