# 🏗️ Arquitectura del Panel Retell AI

## 📐 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 16)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Dashboard  │  │   Agents    │  │   Voices    │        │
│  │   Page      │  │ Management  │  │  Config     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Prompts   │  │  Analytics  │  │  Settings   │        │
│  │   Editor    │  │   & Usage   │  │   Panel     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API LAYER (Next.js)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Agents    │  │   Voices    │  │   Prompts   │        │
│  │   API       │  │    API      │  │    API      │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Analytics  │  │  Webhooks   │  │    Auth     │        │
│  │    API      │  │    API      │  │    API      │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Retell AI  │  │   11labs    │  │  Database   │        │
│  │     SDK     │  │     API     │  │ PostgreSQL  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 🗂️ Estructura de Directorios

```
monetaize-module/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   ├── agents/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx
│   │   │   │   └── edit/
│   │   │   └── new/
│   │   ├── voices/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   ├── prompts/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   └── editor/
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── agents/
│   │   │   ├── voices/
│   │   │   ├── prompts/
│   │   │   ├── analytics/
│   │   │   └── webhooks/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── modal.tsx
│   │   │   └── ...
│   │   ├── forms/
│   │   │   ├── agent-form.tsx
│   │   │   ├── voice-selector.tsx
│   │   │   └── prompt-editor.tsx
│   │   ├── charts/
│   │   │   ├── usage-chart.tsx
│   │   │   ├── cost-chart.tsx
│   │   │   └── performance-chart.tsx
│   │   ├── modals/
│   │   │   ├── confirm-modal.tsx
│   │   │   ├── settings-modal.tsx
│   │   │   └── preview-modal.tsx
│   │   └── layout/
│   │       ├── sidebar.tsx
│   │       ├── header.tsx
│   │       └── navigation.tsx
│   ├── hooks/
│   │   ├── use-agents.ts
│   │   ├── use-voices.ts
│   │   ├── use-analytics.ts
│   │   └── use-retell.ts
│   ├── lib/
│   │   ├── retell.ts
│   │   ├── db.ts
│   │   ├── auth.ts
│   │   ├── utils.ts
│   │   └── validations.ts
│   ├── types/
│   │   ├── agent.ts
│   │   ├── voice.ts
│   │   ├── prompt.ts
│   │   └── analytics.ts
│   └── store/
│       ├── agent-store.ts
│       ├── voice-store.ts
│       └── analytics-store.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   ├── icons/
│   └── images/
├── .env.local
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 🔧 Configuración de Base de Datos

### Schema Principal (Prisma)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  agents    Agent[]
  settings  UserSettings?
}

model Agent {
  id          String   @id @default(cuid())
  name        String
  description String?
  voiceId     String
  prompt      String
  isActive    Boolean  @default(true)
  userId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id])
  calls       Call[]
  usage       Usage[]
}

model Voice {
  id          String  @id @default(cuid())
  retellId    String  @unique
  name        String
  provider    String
  language    String
  gender      String?
  description String?
  isActive    Boolean @default(true)
  
  agents      Agent[]
}

model Call {
  id        String   @id @default(cuid())
  agentId   String
  duration  Int      // en segundos
  cost      Float    // en USD
  status    CallStatus
  createdAt DateTime @default(now())
  
  agent     Agent    @relation(fields: [agentId], references: [id])
}

model Usage {
  id        String   @id @default(cuid())
  agentId   String
  tokens    Int
  minutes   Float
  cost      Float
  date      DateTime @default(now())
  
  agent     Agent    @relation(fields: [agentId], references: [id])
}

enum Role {
  USER
  ADMIN
  SUPER_ADMIN
}

enum CallStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
  CANCELLED
}
```

## 🔌 Integración con Retell AI

### Configuración del SDK

```typescript
// lib/retell.ts
import Retell from 'retell-sdk';

const retellClient = new Retell({
  apiKey: process.env.RETELL_API_KEY!,
});

export { retellClient };
```

### Servicios Principales

```typescript
// lib/services/agent-service.ts
export class AgentService {
  async createAgent(data: CreateAgentData) {
    const retellAgent = await retellClient.agent.create({
      response_engine: {
        type: 'retell-llm',
        llm_id: data.llmId,
      },
      agent_name: data.name,
      voice_id: data.voiceId,
      // ... más configuraciones
    });
    
    return this.saveToDatabase(retellAgent, data);
  }
  
  async updateAgent(id: string, data: UpdateAgentData) {
    // Actualizar en Retell AI
    // Actualizar en base de datos local
  }
  
  async deleteAgent(id: string) {
    // Eliminar de Retell AI
    // Eliminar de base de datos local
  }
}
```

## 🎨 Componentes UI Principales

### Agent Management
- `AgentList`: Lista de agentes con filtros
- `AgentCard`: Tarjeta individual de agente
- `AgentForm`: Formulario de creación/edición
- `AgentSettings`: Configuración avanzada

### Voice Configuration
- `VoiceSelector`: Selector de voces con preview
- `VoicePreview`: Reproductor de audio
- `VoiceSettings`: Configuración de parámetros

### Analytics Dashboard
- `UsageChart`: Gráfico de uso por tiempo
- `CostChart`: Gráfico de costos
- `PerformanceMetrics`: Métricas de rendimiento
- `AgentComparison`: Comparación entre agentes

## 🔐 Sistema de Autenticación

```typescript
// lib/auth.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Validar credenciales
        // Retornar usuario o null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      return session;
    }
  }
};
```

## 📊 Sistema de Monitoreo

### Métricas en Tiempo Real
- WebSocket para actualizaciones en vivo
- Redis para cache de métricas
- Alertas automáticas por email/SMS

### Dashboard de Analytics
- Gráficos interactivos con Recharts
- Filtros por fecha, agente, tipo de llamada
- Exportación a PDF/Excel
- Comparativas históricas

## 🚀 Optimizaciones

### Performance
- Server-side rendering para páginas estáticas
- Client-side rendering para dashboards dinámicos
- Lazy loading de componentes pesados
- Memoización de cálculos complejos

### Caching
- Redis para cache de API responses
- Next.js Image Optimization
- CDN para assets estáticos
- Service Worker para cache offline

### Escalabilidad
- Database indexing optimizado
- Connection pooling
- Rate limiting en APIs
- Horizontal scaling con load balancer

---

*Esta arquitectura está diseñada para ser escalable, mantenible y fácil de extender con nuevas funcionalidades.*

