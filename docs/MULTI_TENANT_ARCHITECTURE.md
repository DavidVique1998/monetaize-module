# 🏢 Arquitectura Multi-Tenant - Retell AI Integration

## 📋 Resumen

El sistema ahora implementa una arquitectura multi-tenant donde cada usuario (location_id/user_id) solo puede ver y modificar sus propios recursos de Retell (agentes, números telefónicos, etc.). Todos los recursos de Retell están vinculados a usuarios específicos en la base de datos local.

---

## 🏗️ Arquitectura

### Modelo de Datos

```
User (Usuario)
  ├── Agent[] (Agentes del usuario)
  │   └── retellAgentId → Retell AI
  └── PhoneNumber[] (Números telefónicos del usuario)
      └── phoneNumber → Retell AI
```

### Flujo de Sincronización

1. **Creación de Recurso**:
   - Usuario crea agente/número en la UI
   - Se crea en Retell AI
   - Se guarda en DB local vinculado al `userId`

2. **Consulta de Recursos**:
   - Se obtienen recursos de Retell AI
   - Se filtran por los que pertenecen al usuario (según DB local)
   - Solo se muestran los recursos del usuario autenticado

3. **Modificación/Eliminación**:
   - Se verifica que el recurso pertenece al usuario
   - Se actualiza/elimina en Retell AI
   - Se actualiza/elimina en DB local

---

## 🔧 Componentes Implementados

### 1. Servicio de Sincronización (`src/lib/retell-sync.ts`)

Servicio centralizado que maneja la sincronización entre Retell AI y la base de datos local:

- `syncAgentsForUser(userId)`: Sincroniza agentes de Retell con la DB local
- `getUserAgents(userId)`: Obtiene agentes del usuario desde la DB local
- `createAgentForUser(userId, agentData)`: Crea agente en Retell y lo vincula con el usuario
- `syncPhoneNumbersForUser(userId)`: Sincroniza números telefónicos
- `getUserPhoneNumbers(userId)`: Obtiene números telefónicos del usuario
- `createPhoneNumberForUser(userId, phoneData)`: Crea número en Retell y lo vincula
- `verifyAgentOwnership(userId, retellAgentId)`: Verifica propiedad de agente
- `verifyPhoneNumberOwnership(userId, phoneNumber)`: Verifica propiedad de número

### 2. Endpoints API Refactorizados

#### Agentes

- **GET `/api/agents`**: 
  - ✅ Filtra por `userId` del usuario autenticado
  - ✅ Solo retorna agentes que pertenecen al usuario

- **POST `/api/agents`**: 
  - ✅ Crea agente en Retell
  - ✅ Guarda en DB local con `userId`

- **GET `/api/agents/[agentId]`**: 
  - ✅ Verifica que el agente pertenece al usuario
  - ✅ Retorna 404 si no pertenece

- **PATCH `/api/agents/[agentId]`**: 
  - ✅ Verifica propiedad antes de actualizar

- **DELETE `/api/agents/[agentId]`**: 
  - ✅ Verifica propiedad antes de eliminar
  - ✅ Elimina de Retell y de DB local

- **POST `/api/agents/[agentId]/publish`**: 
  - ✅ Verifica propiedad antes de publicar

#### Números Telefónicos

- **GET `/api/phone-numbers`**: 
  - ✅ Filtra por `userId` del usuario autenticado
  - ✅ Solo retorna números que pertenecen al usuario

- **POST `/api/phone-numbers`**: 
  - ✅ Crea número en Retell
  - ✅ Guarda en DB local con `userId`
  - ✅ Verifica que los agentes asociados pertenecen al usuario

- **POST `/api/phone-numbers/create`**: 
  - ✅ Crea número con agente predefinido
  - ✅ Verifica propiedad del agente
  - ✅ Vincula con `userId`

#### Llamadas

- **POST `/api/calls/create`**: 
  - ✅ Verifica que el agente pertenece al usuario
  - ✅ Solo permite crear llamadas con agentes propios

---

## 🔐 Seguridad

### Autenticación

Todos los endpoints requieren autenticación mediante `SessionManager.requireAuth()`:

```typescript
const user = await SessionManager.requireAuth();
if (!user) {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  );
}
```

### Verificación de Propiedad

Antes de cualquier operación (GET, PATCH, DELETE), se verifica que el recurso pertenece al usuario:

```typescript
const agentExists = await RetellSyncService.verifyAgentOwnership(user.id, agentId);
if (!agentExists) {
  return NextResponse.json(
    { success: false, error: 'Agent not found or does not belong to your account' },
    { status: 404 }
  );
}
```

---

## 📊 Base de Datos

### Modelo Agent

```prisma
model Agent {
  id            String   @id
  userId        String?  // Vinculado al usuario
  retellAgentId String?  @unique // ID en Retell AI
  // ... otros campos
  owner         User?    @relation(fields: [userId], references: [id])
}
```

### Modelo PhoneNumber

```prisma
model PhoneNumber {
  id          String  @id @default(uuid())
  phoneNumber String  @unique
  userId      String? // Vinculado al usuario
  // ... otros campos
  owner       User?   @relation(fields: [userId], references: [id])
}
```

---

## 🔄 Flujo de Trabajo

### Crear un Agente

1. Usuario hace POST a `/api/agents` con datos del agente
2. Sistema autentica al usuario
3. Se crea agente en Retell AI
4. Se guarda en DB local con `userId`
5. Se retorna el agente creado

### Listar Agentes

1. Usuario hace GET a `/api/agents`
2. Sistema autentica al usuario
3. Se obtienen agentes de Retell AI
4. Se filtran por los que tienen `retellAgentId` en DB local con `userId` del usuario
5. Se retornan solo los agentes del usuario

### Crear un Número Telefónico

1. Usuario hace POST a `/api/phone-numbers/create` con `agent_id`
2. Sistema autentica al usuario
3. Se verifica que el `agent_id` pertenece al usuario
4. Se crea número en Retell AI
5. Se guarda en DB local con `userId`
6. Se retorna el número creado

---

## 🚀 Migración de Datos Existentes

Si ya tienes recursos en Retell que no están vinculados a usuarios, necesitarás:

1. **Crear un script de migración** que:
   - Obtenga todos los recursos de Retell
   - Los asigne a un usuario específico (o crear registros para cada usuario)
   - Los guarde en la DB local

2. **Ejemplo de migración**:

```typescript
// scripts/migrate-retell-resources.ts
import { PrismaClient } from '@prisma/client';
import { RetellService } from '@/lib/retell';

const prisma = new PrismaClient();

async function migrateAgents() {
  // Obtener todos los agentes de Retell
  const retellAgents = await RetellService.getAgents();
  
  // Asignar a un usuario específico (o crear para cada usuario)
  const defaultUserId = 'user-id-here';
  
  for (const agent of retellAgents) {
    await prisma.agent.upsert({
      where: { retellAgentId: agent.agent_id },
      update: { userId: defaultUserId },
      create: {
        id: agent.agent_id,
        name: agent.agent_name,
        retellAgentId: agent.agent_id,
        userId: defaultUserId,
        // ... otros campos
      },
    });
  }
}
```

---

## 📝 Notas Importantes

1. **Aislamiento de Datos**: Cada usuario solo ve sus propios recursos
2. **Sincronización**: Los recursos se sincronizan entre Retell y la DB local
3. **Validación**: Se valida propiedad antes de cualquier operación
4. **Escalabilidad**: La arquitectura permite múltiples usuarios sin conflictos

---

## 🔮 Próximos Pasos

- [ ] Implementar sincronización automática periódica
- [ ] Agregar logs de auditoría para cambios
- [ ] Implementar permisos granulares (ADMIN puede ver todos)
- [ ] Agregar métricas por usuario
- [ ] Implementar soft delete para recursos

---

## 🐛 Troubleshooting

### Error: "Agent not found or does not belong to your account"

**Causa**: El agente no está vinculado al usuario en la DB local.

**Solución**: 
1. Verificar que el agente existe en Retell
2. Verificar que existe un registro en `Agent` con `userId` correcto
3. Si no existe, crear el registro manualmente o usar el script de migración

### Error: "Unauthorized"

**Causa**: El usuario no está autenticado.

**Solución**: 
1. Verificar que la sesión está activa
2. Verificar que el middleware está configurado correctamente
3. Verificar que los headers de autenticación están presentes

---

*Última actualización: 2024-01-15*










