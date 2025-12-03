/**
 * Ejemplos de uso de Tools en Retell AI
 * 
 * Este archivo muestra cómo usar las funciones de tools implementadas
 * para agregar capacidades de función calling a los agentes de Retell.
 */

import { RetellService } from '@/lib/retell';
import { CommonRetellTools, RetellTool, FunctionTool } from '@/types/retell-tools';

/**
 * Ejemplo 1: Agregar un tool simple (end_call) a un LLM
 */
export async function exampleAddEndCallTool(llmId: string) {
  try {
    const endCallTool = CommonRetellTools.endCall('Terminar la llamada cuando el usuario lo solicite');
    
    const updatedLLM = await RetellService.addToolToLLM(llmId, endCallTool);
    
    console.log('Tool agregado exitosamente:', updatedLLM);
    return updatedLLM;
  } catch (error) {
    console.error('Error agregando tool:', error);
    throw error;
  }
}

/**
 * Ejemplo 2: Agregar un tool personalizado con webhook
 */
export async function exampleAddCustomTool(llmId: string, webhookUrl: string) {
  try {
    const checkOrderTool: FunctionTool = {
      type: 'function',
      name: 'check_order_status',
      description: 'Verificar el estado de una orden por su ID',
      webhook_url: webhookUrl,
      parameters: [
        {
          name: 'order_id',
          type: 'string',
          description: 'El ID de la orden a verificar',
          required: true,
        },
      ],
    };
    
    const updatedLLM = await RetellService.addToolToLLM(llmId, checkOrderTool);
    
    console.log('Tool personalizado agregado:', updatedLLM);
    return updatedLLM;
  } catch (error) {
    console.error('Error agregando tool personalizado:', error);
    throw error;
  }
}

/**
 * Ejemplo 3: Obtener todos los tools de un LLM
 */
export async function exampleGetTools(llmId: string) {
  try {
    const tools = await RetellService.getLLMTools(llmId);
    
    console.log('Tools disponibles:', tools);
    return tools;
  } catch (error) {
    console.error('Error obteniendo tools:', error);
    throw error;
  }
}

/**
 * Ejemplo 4: Actualizar un tool existente
 */
export async function exampleUpdateTool(llmId: string, toolIndex: number) {
  try {
    // Obtener tools actuales
    const currentTools = await RetellService.getLLMTools(llmId);
    
    if (toolIndex >= currentTools.length) {
      throw new Error('Índice de tool inválido');
    }
    
    // Crear tool actualizado
    const updatedTool: RetellTool = {
      ...currentTools[toolIndex],
      description: 'Nueva descripción actualizada',
    };
    
    // Actualizar el tool
    const updatedLLM = await RetellService.updateToolInLLM(llmId, toolIndex, updatedTool);
    
    console.log('Tool actualizado:', updatedLLM);
    return updatedLLM;
  } catch (error) {
    console.error('Error actualizando tool:', error);
    throw error;
  }
}

/**
 * Ejemplo 5: Eliminar un tool
 */
export async function exampleRemoveTool(llmId: string, toolIndex: number) {
  try {
    const updatedLLM = await RetellService.removeToolFromLLM(llmId, toolIndex);
    
    console.log('Tool eliminado:', updatedLLM);
    return updatedLLM;
  } catch (error) {
    console.error('Error eliminando tool:', error);
    throw error;
  }
}

/**
 * Ejemplo 6: Reemplazar todos los tools de un LLM
 */
export async function exampleReplaceAllTools(llmId: string, webhookUrl: string) {
  try {
    const newTools: RetellTool[] = [
      CommonRetellTools.endCall('Terminar la llamada'),
      CommonRetellTools.checkOrderStatus(webhookUrl),
      CommonRetellTools.getWeather(webhookUrl),
      CommonRetellTools.scheduleAppointment(webhookUrl),
    ];
    
    const updatedLLM = await RetellService.replaceLLMTools(llmId, newTools);
    
    console.log('Tools reemplazados:', updatedLLM);
    return updatedLLM;
  } catch (error) {
    console.error('Error reemplazando tools:', error);
    throw error;
  }
}

/**
 * Ejemplo 7: Crear un LLM con tools desde el inicio
 */
export async function exampleCreateLLMWithTools(webhookUrl: string) {
  try {
    const llm = await RetellService.createRetellLLM({
      general_prompt: 'Eres un asistente útil con acceso a varias herramientas.',
      general_tools: [
        CommonRetellTools.endCall('Terminar la llamada cuando sea apropiado'),
        CommonRetellTools.checkOrderStatus(webhookUrl),
        CommonRetellTools.getWeather(webhookUrl),
      ] as any,
      start_speaker: 'agent',
      begin_message: 'Hola, ¿cómo puedo ayudarte hoy?',
    });
    
    console.log('LLM creado con tools:', llm);
    return llm;
  } catch (error) {
    console.error('Error creando LLM con tools:', error);
    throw error;
  }
}

/**
 * Ejemplo 8: Uso con API endpoints (desde el frontend)
 */
export const exampleAPIUsage = {
  /**
   * Obtener tools de un LLM
   */
  getTools: async (llmId: string) => {
    const response = await fetch(`/api/llms/${llmId}/tools`);
    const data = await response.json();
    return data;
  },

  /**
   * Agregar un tool
   */
  addTool: async (llmId: string, tool: RetellTool) => {
    const response = await fetch(`/api/llms/${llmId}/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool }),
    });
    const data = await response.json();
    return data;
  },

  /**
   * Actualizar un tool específico
   */
  updateTool: async (llmId: string, toolIndex: number, tool: RetellTool) => {
    const response = await fetch(`/api/llms/${llmId}/tools`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolIndex, tool }),
    });
    const data = await response.json();
    return data;
  },

  /**
   * Reemplazar todos los tools
   */
  replaceAllTools: async (llmId: string, tools: RetellTool[]) => {
    const response = await fetch(`/api/llms/${llmId}/tools`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tools }),
    });
    const data = await response.json();
    return data;
  },

  /**
   * Eliminar un tool
   */
  removeTool: async (llmId: string, toolIndex: number) => {
    const response = await fetch(`/api/llms/${llmId}/tools?toolIndex=${toolIndex}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return data;
  },
};


