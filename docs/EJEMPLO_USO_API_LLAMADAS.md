# 📞 Ejemplo de Uso - API de Llamadas

## Ejemplo Rápido: Crear una Llamada

### 1. Obtener Lista de Agentes Disponibles

Primero, necesitas obtener el ID de un agente:

```bash
curl -X GET http://localhost:3000/api/agents
```

Respuesta:
```json
{
  "success": true,
  "data": [
    {
      "agent_id": "agent_abc123xyz",
      "agent_name": "Asistente de Ventas",
      "voice_id": "11labs-Adrian",
      ...
    },
    {
      "agent_id": "agent_def456uvw",
      "agent_name": "Soporte al Cliente",
      ...
    }
  ]
}
```

### 2. Crear una Llamada

Usa el `agent_id` obtenido para crear una llamada:

```bash
curl -X POST http://localhost:3000/api/calls/create \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent_abc123xyz",
    "toNumber": "+1234567890",
    "fromNumber": "+0987654321",
    "metadata": {
      "campaign": "sales-outreach",
      "customerId": "cust_123"
    }
  }'
```

### 3. Respuesta Exitosa

```json
{
  "success": true,
  "data": {
    "call_id": "call_retell_123456",
    "agent_id": "agent_abc123xyz",
    "from_number": "+0987654321",
    "to_number": "+1234567890",
    "call_status": "ringing",
    "direction": "outbound",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Ejemplo Completo en JavaScript

```javascript
// 1. Obtener lista de agentes
async function getAgents() {
  const response = await fetch('/api/agents');
  const result = await response.json();
  
  if (result.success) {
    console.log('Agentes disponibles:', result.data);
    return result.data;
  }
  throw new Error('Error al obtener agentes');
}

// 2. Crear llamada
async function createCall(agentId, toNumber, fromNumber = null, metadata = null) {
  const response = await fetch('/api/calls/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agentId,
      toNumber,
      fromNumber,
      metadata
    })
  });

  const result = await response.json();

  if (result.success) {
    console.log('✅ Llamada creada exitosamente!');
    console.log('Call ID:', result.data.call_id);
    console.log('Estado:', result.data.call_status);
    return result.data;
  } else {
    console.error('❌ Error:', result.error);
    throw new Error(result.error);
  }
}

// 3. Uso completo
async function ejemploCompleto() {
  try {
    // Obtener agentes
    const agents = await getAgents();
    console.log(`Encontrados ${agents.length} agentes`);
    
    // Seleccionar el primer agente (o buscar uno específico)
    const agent = agents.find(a => a.agent_name.includes('Ventas')) || agents[0];
    console.log(`Usando agente: ${agent.agent_name} (${agent.agent_id})`);
    
    // Crear llamada
    const call = await createCall(
      agent.agent_id,
      '+1234567890',  // Número destino
      '+0987654321',  // Número origen (opcional)
      {
        campaign: 'sales-outreach',
        customerId: 'cust_123',
        notes: 'Cliente VIP'
      }
    );
    
    console.log('Llamada iniciada:', call.call_id);
    
  } catch (error) {
    console.error('Error en el ejemplo:', error);
  }
}

// Ejecutar
ejemploCompleto();
```

---

## Ejemplo en React Component

```tsx
'use client';

import { useState } from 'react';

export function CallCreator() {
  const [agentId, setAgentId] = useState('');
  const [toNumber, setToNumber] = useState('');
  const [fromNumber, setFromNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/calls/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId,
          toNumber,
          fromNumber: fromNumber || undefined,
          metadata: {
            source: 'web-ui',
            timestamp: new Date().toISOString()
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        console.log('Llamada creada:', data.data.call_id);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear la llamada');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Crear Llamada</h2>
      
      <form onSubmit={handleCreateCall} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Agent ID
          </label>
          <input
            type="text"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder="agent_abc123xyz"
            required
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Número Destino
          </label>
          <input
            type="tel"
            value={toNumber}
            onChange={(e) => setToNumber(e.target.value)}
            placeholder="+1234567890"
            required
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Número Origen (opcional)
          </label>
          <input
            type="tel"
            value={fromNumber}
            onChange={(e) => setFromNumber(e.target.value)}
            placeholder="+0987654321"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Creando...' : 'Crear Llamada'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-semibold">✅ Llamada creada exitosamente!</p>
          <div className="mt-2 text-sm text-green-700">
            <p><strong>Call ID:</strong> {result.call_id}</p>
            <p><strong>Estado:</strong> {result.call_status}</p>
            <p><strong>Agente:</strong> {result.agent_id}</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Prueba Rápida con Postman

1. **Método**: POST
2. **URL**: `http://localhost:3000/api/calls/create`
3. **Headers**:
   - `Content-Type: application/json`
4. **Body** (raw JSON):
```json
{
  "agentId": "agent_abc123xyz",
  "toNumber": "+1234567890",
  "fromNumber": "+0987654321"
}
```

---

## Notas Importantes

1. **Formato de Números**: Los números deben estar en formato E.164 (ej: `+1234567890`)
2. **Agente Válido**: El `agentId` debe existir en tu cuenta de Retell
3. **Número Origen**: Si no se proporciona, Retell usará el número por defecto
4. **Estado de Llamada**: La llamada se crea con estado `ringing` y se actualiza automáticamente

---

## Próximos Pasos

- [ ] Implementar endpoint para listar llamadas: `GET /api/calls`
- [ ] Implementar endpoint para obtener detalles: `GET /api/calls/[callId]`
- [ ] Implementar webhooks para actualizar estado en tiempo real
- [ ] Agregar almacenamiento en base de datos

