/**
 * Servicio de sincronización entre Retell AI y la base de datos local
 * Vincula recursos de Retell con usuarios del sistema
 */

import { PrismaClient } from '@prisma/client';
import { RetellService, RetellAgent, ImportedPhoneNumber } from './retell';

const prisma = new PrismaClient();

export class RetellSyncService {
  /**
   * Sincronizar agentes de Retell con la base de datos local
   * Solo sincroniza agentes que pertenecen al usuario especificado
   */
  static async syncAgentsForUser(userId: string): Promise<void> {
    try {
      // Obtener todos los agentes de Retell
      const retellAgents = await RetellService.getAgents();
      
      // Obtener agentes locales del usuario
      const localAgents = await prisma.agent.findMany({
        where: { userId },
        select: { retellAgentId: true },
      });
      
      const localRetellIds = new Set(localAgents.map(a => a.retellAgentId).filter(Boolean));
      
      // Sincronizar cada agente de Retell
      for (const retellAgent of retellAgents) {
        // Si el agente ya existe localmente para este usuario, actualizarlo
        if (localRetellIds.has(retellAgent.agent_id)) {
          await prisma.agent.updateMany({
            where: {
              userId,
              retellAgentId: retellAgent.agent_id,
            },
            data: {
              name: retellAgent.agent_name || 'Unnamed Agent',
              voiceId: retellAgent.voice_id || '',
              language: retellAgent.language || 'en-US',
              version: (retellAgent as any).version || 1,
              isActive: (retellAgent as any).is_published || false,
              updatedAt: new Date(),
            },
          });
        }
        // Si no existe, no lo creamos automáticamente - solo se crean cuando el usuario los crea explícitamente
      }
    } catch (error) {
      console.error('Error syncing agents for user:', error);
      throw error;
    }
  }

  /**
   * Obtener agentes del usuario desde la base de datos local
   * Si no hay agentes locales, sincronizar desde Retell
   */
  static async getUserAgents(userId: string): Promise<RetellAgent[]> {
    try {
      // Obtener agentes locales del usuario
      const localAgents = await prisma.agent.findMany({
        where: { userId },
        select: { retellAgentId: true },
      });

      if (localAgents.length === 0) {
        // No hay agentes locales, retornar array vacío
        return [];
      }

      // Obtener detalles de Retell para cada agente
      const retellAgentIds = localAgents
        .map(a => a.retellAgentId)
        .filter((id): id is string => !!id);

      if (retellAgentIds.length === 0) {
        return [];
      }

      // Obtener todos los agentes de Retell y filtrar por los que pertenecen al usuario
      const allRetellAgents = await RetellService.getAgents();
      const userRetellAgents = allRetellAgents.filter(agent =>
        retellAgentIds.includes(agent.agent_id)
      );

      return userRetellAgents;
    } catch (error) {
      console.error('Error getting user agents:', error);
      throw error;
    }
  }

  /**
   * Crear agente en Retell y vincularlo con el usuario en la base de datos local
   */
  static async createAgentForUser(
    userId: string,
    agentData: any
  ): Promise<{ retellAgent: RetellAgent; localAgent: any }> {
    try {
      // Crear agente en Retell
      const retellAgent = await RetellService.createAdvancedAgent(agentData);

      // Guardar en la base de datos local vinculado al usuario
      const localAgent = await prisma.agent.create({
        data: {
          id: retellAgent.agent_id,
          name: retellAgent.agent_name || 'Unnamed Agent',
          voiceId: retellAgent.voice_id || '',
          language: retellAgent.language || 'en-US',
          llmId: retellAgent.response_engine && 'llm_id' in retellAgent.response_engine
            ? retellAgent.response_engine.llm_id
            : null,
          llmType: retellAgent.response_engine?.type || 'retell-llm',
          version: (retellAgent as any).version || 1,
          isActive: (retellAgent as any).is_published || false,
          retellAgentId: retellAgent.agent_id,
          userId: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return { retellAgent, localAgent };
    } catch (error) {
      console.error('Error creating agent for user:', error);
      throw error;
    }
  }

  /**
   * Sincronizar números telefónicos de Retell con la base de datos local
   */
  static async syncPhoneNumbersForUser(userId: string): Promise<void> {
    try {
      // Obtener todos los números de Retell
      const retellPhoneNumbers = await RetellService.getPhoneNumbers();
      
      // Obtener números locales del usuario
      const localPhoneNumbers = await prisma.phoneNumber.findMany({
        where: { userId },
        select: { phoneNumber: true },
      });
      
      const localPhoneNumberSet = new Set(localPhoneNumbers.map(p => p.phoneNumber));
      
      // Sincronizar cada número de Retell
      for (const retellPhone of retellPhoneNumbers) {
        // Si el número ya existe localmente para este usuario, actualizarlo
        if (localPhoneNumberSet.has(retellPhone.phone_number)) {
          await prisma.phoneNumber.updateMany({
            where: {
              userId,
              phoneNumber: retellPhone.phone_number,
            },
            data: {
              phoneNumberPretty: retellPhone.phone_number_pretty || null,
              phoneNumberType: retellPhone.phone_number_type || 'retell-twilio',
              nickname: retellPhone.nickname || null,
              inboundAgentId: retellPhone.inbound_agent_id || null,
              outboundAgentId: retellPhone.outbound_agent_id || null,
              inboundAgentVersion: retellPhone.inbound_agent_version || null,
              outboundAgentVersion: retellPhone.outbound_agent_version || null,
              inboundWebhookUrl: retellPhone.inbound_webhook_url || null,
              updatedAt: new Date(),
            },
          });
        }
        // Si no existe, no lo creamos automáticamente - solo se crean cuando el usuario los importa explícitamente
      }
    } catch (error) {
      console.error('Error syncing phone numbers for user:', error);
      throw error;
    }
  }

  /**
   * Obtener números telefónicos del usuario desde la base de datos local
   */
  static async getUserPhoneNumbers(userId: string): Promise<ImportedPhoneNumber[]> {
    try {
      // Obtener números locales del usuario
      const localPhoneNumbers = await prisma.phoneNumber.findMany({
        where: { userId },
        select: { phoneNumber: true },
      });

      if (localPhoneNumbers.length === 0) {
        return [];
      }

      // Obtener detalles de Retell para cada número
      const phoneNumberList = localPhoneNumbers.map(p => p.phoneNumber);

      // Obtener todos los números de Retell y filtrar por los que pertenecen al usuario
      const allRetellPhoneNumbers = await RetellService.getPhoneNumbers();
      const userRetellPhoneNumbers = allRetellPhoneNumbers.filter(phone =>
        phoneNumberList.includes(phone.phone_number)
      );

      return userRetellPhoneNumbers;
    } catch (error) {
      console.error('Error getting user phone numbers:', error);
      throw error;
    }
  }

  /**
   * Crear/importar número telefónico en Retell y vincularlo con el usuario
   * Soporta tanto crear nuevos números como importar números existentes
   */
  static async createPhoneNumberForUser(
    userId: string,
    phoneData: any,
    isCreating: boolean = false
  ): Promise<{ retellPhone: ImportedPhoneNumber; localPhone: any }> {
    try {
      // Verificar que los agentes asociados pertenecen al usuario ANTES de crear en Retell
      if (phoneData.inbound_agent_id) {
        const inboundAgent = await prisma.agent.findFirst({
          where: {
            userId,
            retellAgentId: phoneData.inbound_agent_id,
          },
        });
        if (!inboundAgent) {
          throw new Error('Inbound agent does not belong to user');
        }
      }

      if (phoneData.outbound_agent_id) {
        const outboundAgent = await prisma.agent.findFirst({
          where: {
            userId,
            retellAgentId: phoneData.outbound_agent_id,
          },
        });
        if (!outboundAgent) {
          throw new Error('Outbound agent does not belong to user');
        }
      }

      // Crear o importar número en Retell según el flag
      let retellPhone: ImportedPhoneNumber;
      console.log('RetellSyncService: Operation type:', isCreating ? 'CREATE' : 'IMPORT');
      console.log('RetellSyncService: Phone data:', phoneData);
      
      if (isCreating) {
        // Crear nuevo número usando create-phone-number
        console.log('RetellSyncService: Creating new phone number...');
        retellPhone = await RetellService.createPhoneNumber(phoneData);
        console.log('RetellSyncService: Phone number created in Retell:', retellPhone.phone_number);
      } else {
        // Importar número existente
        console.log('RetellSyncService: Importing existing phone number...');
        retellPhone = await RetellService.importPhoneNumber(phoneData);
        console.log('RetellSyncService: Phone number imported from Retell:', retellPhone.phone_number);
      }

      // Extraer area code del número si está disponible
      let areaCode: number | null = null;
      if (phoneData.area_code) {
        areaCode = phoneData.area_code;
      } else if (retellPhone.phone_number) {
        // Intentar extraer el área code del número
        const match = retellPhone.phone_number.match(/\+1(\d{3})/);
        if (match) {
          areaCode = parseInt(match[1], 10);
        }
      }

      // Verificar si el número ya existe en la base de datos local
      const existingPhone = await prisma.phoneNumber.findUnique({
        where: { phoneNumber: retellPhone.phone_number },
      });

      let localPhone;
      if (existingPhone) {
        // Si ya existe, actualizarlo en lugar de crear uno nuevo
        console.log('Phone number already exists in local DB, updating...');
        localPhone = await prisma.phoneNumber.update({
          where: { phoneNumber: retellPhone.phone_number },
          data: {
            phoneNumberPretty: retellPhone.phone_number_pretty || null,
            phoneNumberType: retellPhone.phone_number_type || 'retell-twilio',
            nickname: retellPhone.nickname || null,
            areaCode: areaCode,
            inboundAgentId: retellPhone.inbound_agent_id || null,
            outboundAgentId: retellPhone.outbound_agent_id || null,
            inboundAgentVersion: retellPhone.inbound_agent_version || null,
            outboundAgentVersion: retellPhone.outbound_agent_version || null,
            inboundWebhookUrl: retellPhone.inbound_webhook_url || null,
            userId: userId, // Actualizar el userId por si acaso
            updatedAt: new Date(),
          },
        });
      } else {
        // Crear nuevo registro en la base de datos local
        localPhone = await prisma.phoneNumber.create({
        data: {
          phoneNumber: retellPhone.phone_number,
          phoneNumberPretty: retellPhone.phone_number_pretty || null,
          phoneNumberType: retellPhone.phone_number_type || 'retell-twilio',
          nickname: retellPhone.nickname || null,
            areaCode: areaCode,
          inboundAgentId: retellPhone.inbound_agent_id || null,
          outboundAgentId: retellPhone.outbound_agent_id || null,
          inboundAgentVersion: retellPhone.inbound_agent_version || null,
          outboundAgentVersion: retellPhone.outbound_agent_version || null,
          inboundWebhookUrl: retellPhone.inbound_webhook_url || null,
          userId: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      }

      console.log('Phone number saved to local DB successfully:', localPhone.phoneNumber);
      return { retellPhone, localPhone };
    } catch (error: any) {
      console.error('RetellSyncService: Error creating/importing phone number for user:', error);
      console.error('RetellSyncService: Error details:', {
        message: error?.message,
        code: error?.code,
        meta: error?.meta,
        stack: error?.stack
      });
      
      // Si el número se creó en Retell pero falla al guardarlo en la BD, 
      // proporcionar información útil
      if (error?.code === 'P2002' || error?.message?.includes('Unique constraint')) {
        throw new Error(`El número telefónico ya existe en la base de datos. Por favor, recarga la lista.`);
      }
      
      // Re-lanzar el error con un mensaje más descriptivo
      const errorMessage = error?.message || 'Error desconocido al crear/importar número telefónico';
      throw new Error(errorMessage);
    }
  }

  /**
   * Verificar que un agente pertenece al usuario
   */
  static async verifyAgentOwnership(
    userId: string,
    retellAgentId: string
  ): Promise<boolean> {
    try {
      const agent = await prisma.agent.findFirst({
        where: {
          userId,
          retellAgentId,
        },
      });
      return !!agent;
    } catch (error) {
      console.error('Error verifying agent ownership:', error);
      return false;
    }
  }

  /**
   * Verificar que un número telefónico pertenece al usuario
   */
  static async verifyPhoneNumberOwnership(
    userId: string,
    phoneNumber: string
  ): Promise<boolean> {
    try {
      const phone = await prisma.phoneNumber.findFirst({
        where: {
          userId,
          phoneNumber,
        },
      });
      return !!phone;
    } catch (error) {
      console.error('Error verifying phone number ownership:', error);
      return false;
    }
  }
}

