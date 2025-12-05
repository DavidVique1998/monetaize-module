/**
 * Servicio para gestionar llamadas y su historial
 * Captura y almacena información de llamadas de Retell AI
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateCallData {
  retellCallId: string;
  callType: 'phone' | 'web';
  direction: 'inbound' | 'outbound';
  status: string;
  agentId?: string;
  agentVersion?: number;
  fromNumber?: string;
  toNumber?: string;
  userId?: string;
  retellMetadata?: any;
  cost?: number;
  totalDurationSeconds?: number;
  tokensUsed?: number;
  duration?: number;
  startTime?: Date;
  endTime?: Date;
  recordingUrl?: string;
  transcript?: string;
  errorMessage?: string;
}

export interface UpdateCallData {
  status?: string;
  duration?: number;
  startTime?: Date;
  endTime?: Date;
  recordingUrl?: string;
  transcript?: string;
  retellMetadata?: any;
  cost?: number;
  totalDurationSeconds?: number;
  tokensUsed?: number;
  errorMessage?: string;
}

export class CallService {
  /**
   * Crear un registro de llamada en la base de datos
   */
  static async createCall(data: CreateCallData) {
    try {
      // Construir el objeto de datos, excluyendo campos undefined
      const callData: any = {
        retellCallId: data.retellCallId,
        callType: data.callType,
        direction: data.direction,
        status: data.status,
        startTime: data.startTime || new Date(),
      };

      // Agregar campos opcionales solo si están definidos
      if (data.agentId !== undefined) callData.agentId = data.agentId;
      if (data.agentVersion !== undefined) callData.agentVersion = data.agentVersion;
      if (data.fromNumber !== undefined) callData.fromNumber = data.fromNumber;
      if (data.toNumber !== undefined) callData.toNumber = data.toNumber;
      
      // Usar la relación owner en lugar de userId directamente
      if (data.userId !== undefined && data.userId !== null) {
        callData.owner = {
          connect: { id: data.userId }
        };
      }
      
      if (data.retellMetadata !== undefined) {
        callData.retellMetadata = data.retellMetadata ? JSON.parse(JSON.stringify(data.retellMetadata)) : null;
      }
      if (data.cost !== undefined) callData.cost = data.cost;
      // totalDurationSeconds está definido en el schema, pero Prisma Client puede no reconocerlo
      // Intentar usar el nombre exacto del schema
      if (data.totalDurationSeconds !== undefined && data.totalDurationSeconds !== null) {
        callData.totalDurationSeconds = data.totalDurationSeconds;
      }
      if (data.tokensUsed !== undefined) callData.tokensUsed = data.tokensUsed;
      if (data.duration !== undefined) callData.duration = data.duration;
      if (data.endTime !== undefined) callData.endTime = data.endTime;
      if (data.recordingUrl !== undefined) callData.recordingUrl = data.recordingUrl;
      if (data.transcript !== undefined) callData.transcript = data.transcript;
      if (data.errorMessage !== undefined) callData.errorMessage = data.errorMessage;

      const call = await prisma.call.create({
        data: callData,
      });
      return call;
    } catch (error: any) {
      console.error('Error creating call record:', error);
      // Si ya existe, intentar actualizar
      if (error.code === 'P2002') {
        return await this.updateCall(data.retellCallId, {
          status: data.status,
          retellMetadata: data.retellMetadata,
        });
      }
      throw error;
    }
  }

  /**
   * Actualizar un registro de llamada
   */
  static async updateCall(retellCallId: string, data: UpdateCallData) {
    try {
      const call = await prisma.call.update({
        where: { retellCallId },
        data: {
          status: data.status,
          duration: data.duration,
          startTime: data.startTime,
          endTime: data.endTime,
          recordingUrl: data.recordingUrl,
          transcript: data.transcript,
          retellMetadata: data.retellMetadata ? JSON.parse(JSON.stringify(data.retellMetadata)) : undefined,
          cost: data.cost,
          totalDurationSeconds: data.totalDurationSeconds,
          tokensUsed: data.tokensUsed,
          errorMessage: data.errorMessage,
          updatedAt: new Date(),
        },
      });
      return call;
    } catch (error) {
      console.error('Error updating call record:', error);
      throw error;
    }
  }

  /**
   * Obtener llamadas de un usuario con filtros
   */
  static async getCallsForUser(
    userId: string,
    options: {
      agentId?: string;
      status?: string;
      callType?: 'phone' | 'web';
      direction?: 'inbound' | 'outbound';
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    try {
      const {
        agentId,
        status,
        callType,
        direction,
        limit = 50,
        offset = 0,
        startDate,
        endDate,
      } = options;

      const where: any = {
        userId,
      };

      if (agentId) {
        where.agentId = agentId;
      }

      if (status) {
        where.status = status;
      }

      if (callType) {
        where.callType = callType;
      }

      if (direction) {
        where.direction = direction;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = startDate;
        }
        if (endDate) {
          where.createdAt.lte = endDate;
        }
      }

      const [calls, total] = await Promise.all([
        prisma.call.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.call.count({ where }),
      ]);

      return {
        calls,
        total,
        limit,
        offset,
      };
    } catch (error) {
      console.error('Error fetching calls:', error);
      throw error;
    }
  }

  /**
   * Obtener una llamada específica por Retell Call ID
   */
  static async getCallByRetellId(retellCallId: string) {
    try {
      const call = await prisma.call.findUnique({
        where: { retellCallId },
      });
      return call;
    } catch (error) {
      console.error('Error fetching call:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de llamadas para un usuario
   */
  static async getCallStats(userId: string, options: {
    startDate?: Date;
    endDate?: Date;
    agentId?: string;
  } = {}) {
    try {
      const { startDate, endDate, agentId } = options;

      const where: any = {
        userId,
      };

      if (agentId) {
        where.agentId = agentId;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = startDate;
        }
        if (endDate) {
          where.createdAt.lte = endDate;
        }
      }

      const [totalCalls, completedCalls, totalDuration, totalCost] = await Promise.all([
        prisma.call.count({ where }),
        prisma.call.count({
          where: {
            ...where,
            status: 'ended',
          },
        }),
        prisma.call.aggregate({
          where: {
            ...where,
            duration: { not: null },
          },
          _sum: {
            duration: true,
          },
        }),
        prisma.call.aggregate({
          where: {
            ...where,
            cost: { not: null },
          },
          _sum: {
            cost: true,
          },
        }),
      ]);

      // Convertir Decimal a número para evitar problemas con toFixed()
      const costValue = totalCost._sum.cost;
      const totalCostNumber = costValue ? Number(costValue) : 0;

      return {
        totalCalls,
        completedCalls,
        failedCalls: totalCalls - completedCalls,
        totalDuration: totalDuration._sum.duration || 0,
        totalCost: totalCostNumber,
        averageDuration: totalDuration._sum.duration && completedCalls > 0
          ? Math.round(totalDuration._sum.duration / completedCalls)
          : 0,
      };
    } catch (error) {
      console.error('Error fetching call stats:', error);
      throw error;
    }
  }
}

