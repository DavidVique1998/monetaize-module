/**
 * Servicio para integración con GoHighLevel
 * Maneja la sincronización de datos y webhooks
 */

import { config } from './config';
import { apiClient } from './axios';

// Tipos para GoHighLevel
export interface GHLContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  tags: string[];
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface GHLAppointment {
  id: string;
  contactId: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  location?: string;
}

export interface GHLWebhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
}

// Servicio principal de GoHighLevel
export class GHLService {
  private static baseUrl = 'https://services.leadconnectorhq.com';
  private static token = config.ghl.token;

  /**
   * Obtener contactos de GoHighLevel
   */
  static async getContacts(limit: number = 50, offset: number = 0): Promise<GHLContact[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/contacts`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        params: {
          limit,
          offset,
        },
      });

      return response.data.contacts || [];
    } catch (error) {
      console.error('Error fetching GHL contacts:', error);
      throw new Error('Failed to fetch contacts from GoHighLevel');
    }
  }

  /**
   * Obtener un contacto específico
   */
  static async getContact(contactId: string): Promise<GHLContact> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/contacts/${contactId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      return response.data.contact;
    } catch (error) {
      console.error('Error fetching GHL contact:', error);
      throw new Error('Failed to fetch contact from GoHighLevel');
    }
  }

  /**
   * Crear o actualizar un contacto
   */
  static async upsertContact(contactData: Partial<GHLContact>): Promise<GHLContact> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/contacts`, contactData, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      return response.data.contact;
    } catch (error) {
      console.error('Error upserting GHL contact:', error);
      throw new Error('Failed to upsert contact in GoHighLevel');
    }
  }

  /**
   * Obtener citas de GoHighLevel
   */
  static async getAppointments(contactId?: string, startDate?: string, endDate?: string): Promise<GHLAppointment[]> {
    try {
      const params: any = {};
      if (contactId) params.contactId = contactId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await apiClient.get(`${this.baseUrl}/appointments`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        params,
      });

      return response.data.appointments || [];
    } catch (error) {
      console.error('Error fetching GHL appointments:', error);
      throw new Error('Failed to fetch appointments from GoHighLevel');
    }
  }

  /**
   * Crear una cita
   */
  static async createAppointment(appointmentData: Omit<GHLAppointment, 'id'>): Promise<GHLAppointment> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/appointments`, appointmentData, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      return response.data.appointment;
    } catch (error) {
      console.error('Error creating GHL appointment:', error);
      throw new Error('Failed to create appointment in GoHighLevel');
    }
  }

  /**
   * Configurar webhook para sincronización
   */
  static async createWebhook(webhookData: Omit<GHLWebhook, 'id'>): Promise<GHLWebhook> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/webhooks`, webhookData, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      return response.data.webhook;
    } catch (error) {
      console.error('Error creating GHL webhook:', error);
      throw new Error('Failed to create webhook in GoHighLevel');
    }
  }

  /**
   * Obtener webhooks configurados
   */
  static async getWebhooks(): Promise<GHLWebhook[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/webhooks`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      return response.data.webhooks || [];
    } catch (error) {
      console.error('Error fetching GHL webhooks:', error);
      throw new Error('Failed to fetch webhooks from GoHighLevel');
    }
  }

  /**
   * Sincronizar datos de llamada con GoHighLevel
   */
  static async syncCallData(callData: {
    contactId: string;
    callDuration: number;
    callStatus: string;
    transcript?: string;
    recordingUrl?: string;
  }): Promise<void> {
    try {
      // Actualizar el contacto con información de la llamada
      await this.upsertContact({
        id: callData.contactId,
        customFields: {
          lastCallDate: new Date().toISOString(),
          lastCallDuration: callData.callDuration,
          lastCallStatus: callData.callStatus,
          callTranscript: callData.transcript,
          callRecording: callData.recordingUrl,
        },
      });

      // Crear una nota de la llamada si hay transcript
      if (callData.transcript) {
        await apiClient.post(`${this.baseUrl}/contacts/${callData.contactId}/notes`, {
          body: `Call completed - Duration: ${callData.callDuration}s - Status: ${callData.callStatus}\n\nTranscript: ${callData.transcript}`,
        }, {
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        });
      }
    } catch (error) {
      console.error('Error syncing call data with GHL:', error);
      throw new Error('Failed to sync call data with GoHighLevel');
    }
  }

  /**
   * Validar token de GoHighLevel
   */
  static async validateToken(): Promise<boolean> {
    try {
      await apiClient.get(`${this.baseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });
      return true;
    } catch (error) {
      console.error('GHL token validation failed:', error);
      return false;
    }
  }

  /**
   * Obtener información de la cuenta
   */
  static async getAccountInfo(): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching GHL account info:', error);
      throw new Error('Failed to fetch account info from GoHighLevel');
    }
  }
}

export default GHLService;
