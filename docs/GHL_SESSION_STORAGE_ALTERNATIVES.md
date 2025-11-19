# Alternativas de Almacenamiento de Sesiones para GoHighLevel SDK

## Problema Actual

El SDK de GoHighLevel requiere un `sessionStorage` para almacenar tokens OAuth. Actualmente estás usando `MongoDBSessionStorage` que tiene problemas de conexión SSL con MongoDB Atlas.

## Opciones Disponibles

### Opción 1: Crear SessionStorage Personalizado con PostgreSQL (RECOMENDADO)

Ya tienes PostgreSQL configurado con Prisma. Puedes crear un `SessionStorage` personalizado que use PostgreSQL en lugar de MongoDB.

**Ventajas:**
- ✅ Ya tienes PostgreSQL configurado y funcionando
- ✅ No necesitas MongoDB Atlas adicional
- ✅ Evitas problemas SSL con MongoDB
- ✅ Todo en una sola base de datos

**Desventajas:**
- ⚠️ Requiere implementar la interfaz `SessionStorage` del SDK
- ⚠️ Necesitas mantener la compatibilidad con el SDK

### Opción 2: Usar MongoDB Local o Self-Hosted

Si prefieres seguir con MongoDB pero evitar MongoDB Atlas:

**Opciones:**
- MongoDB local (solo desarrollo)
- MongoDB en un VPS propio
- Servicios como Railway, Render, o DigitalOcean que ofrecen MongoDB

**Ventajas:**
- ✅ Puedes controlar la configuración SSL
- ✅ No dependes de MongoDB Atlas

**Desventajas:**
- ⚠️ Requiere mantener otro servicio
- ⚠️ Costos adicionales
- ⚠️ Más complejidad de infraestructura

### Opción 3: Solucionar el Problema SSL con MongoDB Atlas

Esta es la opción más simple si logras resolver el problema SSL:

**Soluciones a intentar:**
1. Agregar `NODE_OPTIONS=--tls-min-v1.2` en Vercel
2. Usar conexión estándar (no SRV) de MongoDB
3. Verificar Network Access en MongoDB Atlas

**Ventajas:**
- ✅ No requiere cambios de código
- ✅ MongoDB Atlas es un servicio gestionado

**Desventajas:**
- ⚠️ Puede seguir teniendo problemas SSL
- ⚠️ Dependes de MongoDB Atlas

## Implementación: SessionStorage con PostgreSQL

Si decides usar PostgreSQL, aquí está cómo implementarlo:

### Paso 1: Crear Tabla en Prisma Schema

```prisma
model GHLSession {
  id            String   @id @default(uuid())
  applicationId String
  resourceId    String
  accessToken   String   @db.Text
  refreshToken  String?  @db.Text
  expireAt      DateTime
  userType      String   // 'Company' o 'Location'
  companyId     String?
  locationId    String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([applicationId, resourceId])
  @@index([applicationId])
  @@index([resourceId])
  @@index([companyId])
  @@index([locationId])
}
```

### Paso 2: Crear SessionStorage Personalizado

```typescript
// src/lib/ghlPostgresSessionStorage.ts
import { PrismaClient } from '@prisma/client';
import { SessionStorage } from '@gohighlevel/api-client';

const prisma = new PrismaClient();

export class PostgresSessionStorage implements SessionStorage {
  async getSession(resourceId: string): Promise<any> {
    const appId = this.getApplicationId();
    const session = await prisma.gHLSession.findUnique({
      where: {
        applicationId_resourceId: {
          applicationId: appId,
          resourceId: resourceId,
        },
      },
    });

    if (!session) return null;

    return {
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
      expire_at: session.expireAt,
      userType: session.userType,
      companyId: session.companyId,
      locationId: session.locationId,
    };
  }

  async setSession(resourceId: string, sessionData: any): Promise<void> {
    const appId = this.getApplicationId();
    
    await prisma.gHLSession.upsert({
      where: {
        applicationId_resourceId: {
          applicationId: appId,
          resourceId: resourceId,
        },
      },
      update: {
        accessToken: sessionData.access_token,
        refreshToken: sessionData.refresh_token,
        expireAt: new Date(sessionData.expire_at),
        userType: sessionData.userType,
        companyId: sessionData.companyId,
        locationId: sessionData.locationId,
        updatedAt: new Date(),
      },
      create: {
        applicationId: appId,
        resourceId: resourceId,
        accessToken: sessionData.access_token,
        refreshToken: sessionData.refresh_token,
        expireAt: new Date(sessionData.expire_at),
        userType: sessionData.userType,
        companyId: sessionData.companyId,
        locationId: sessionData.locationId,
      },
    });
  }

  async deleteSession(resourceId: string): Promise<void> {
    const appId = this.getApplicationId();
    await prisma.gHLSession.deleteMany({
      where: {
        applicationId: appId,
        resourceId: resourceId,
      },
    });
  }

  async getSessionsByApplication(): Promise<any[]> {
    const appId = this.getApplicationId();
    const sessions = await prisma.gHLSession.findMany({
      where: {
        applicationId: appId,
      },
    });

    return sessions.map(session => ({
      resourceId: session.resourceId,
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
      expire_at: session.expireAt,
      userType: session.userType,
      companyId: session.companyId,
      locationId: session.locationId,
    }));
  }

  async init(): Promise<void> {
    // PostgreSQL ya está inicializado por Prisma
    // No necesitas hacer nada aquí
  }

  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }

  private getApplicationId(): string {
    // Extraer applicationId del clientId (primera parte antes del "-")
    const clientId = process.env.GHL_APP_ID || '';
    return clientId.split('-')[0];
  }
}
```

### Paso 3: Actualizar ghlApp.ts

```typescript
import { PostgresSessionStorage } from './ghlPostgresSessionStorage';

// En el constructor:
this.sessionStorage = new PostgresSessionStorage();
```

## Comparación de Opciones

| Opción | Complejidad | Costo | Mantenimiento | Recomendación |
|--------|------------|-------|---------------|---------------|
| PostgreSQL Personalizado | Media | Bajo | Bajo | ⭐⭐⭐⭐⭐ |
| MongoDB Local/Self-hosted | Alta | Medio | Alto | ⭐⭐⭐ |
| Solucionar SSL MongoDB Atlas | Baja | Bajo | Bajo | ⭐⭐⭐⭐ |

## Recomendación

**Para tu caso específico, recomiendo:**

1. **Primero intenta solucionar el SSL con MongoDB Atlas** (más rápido):
   - Agrega `NODE_OPTIONS=--tls-min-v1.2` en Vercel
   - Usa conexión estándar (no SRV) si persiste el problema

2. **Si el problema persiste, implementa PostgreSQL SessionStorage**:
   - Ya tienes PostgreSQL configurado
   - Evitas problemas SSL adicionales
   - Todo en una sola base de datos
   - Más control sobre tus datos

## Notas Importantes

- El SDK de GoHighLevel requiere que el `SessionStorage` implemente métodos específicos
- Asegúrate de mantener la misma estructura de datos que espera el SDK
- Los tokens OAuth deben almacenarse de forma segura (encriptados si es posible)
- Considera implementar limpieza automática de sesiones expiradas

