/**
 * Librería centralizada para manejo de sesiones
 * Proporciona una interfaz unificada para crear, validar y destruir sesiones
 * 
 * IMPORTANTE: El middleware se ejecuta en Edge Runtime y NO puede usar Prisma.
 * Por lo tanto, almacenamos información básica del usuario en la cookie misma.
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

const prisma = new PrismaClient();

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'LOCATION';
  ghlLocationId: string | null;
  ghlCompanyId: string | null;
}

// Configuración de la sesión
const SESSION_COOKIE_NAME = 'monetaize_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 días en segundos
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: SESSION_MAX_AGE,
  path: '/',
};

// Clave secreta para firmar las cookies (en producción usar variable de entorno)
const SESSION_SECRET = process.env.SESSION_SECRET || 'monetaize-session-secret-change-in-production';

/**
 * Clase para manejar sesiones de usuario
 */
export class SessionManager {
  /**
   * Codificar datos del usuario en un token de sesión
   * Formato: base64(userId|email|role|timestamp|random)
   */
  static encodeSessionToken(user: SessionUser): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const data = `${user.id}|${user.email}|${user.role}|${timestamp}|${random}`;
    return Buffer.from(data).toString('base64url');
  }

  /**
   * Decodificar token de sesión y extraer información básica
   * Retorna null si el token es inválido
   */
  static decodeSessionToken(sessionToken: string): { userId: string; email: string; role: string } | null {
    if (!sessionToken) return null;
    
    try {
      const decoded = Buffer.from(sessionToken, 'base64url').toString('utf-8');
      const parts = decoded.split('|');
      
      if (parts.length < 3) return null;
      
      return {
        userId: parts[0],
        email: parts[1],
        role: parts[2],
      };
    } catch (error) {
      console.error('Error decoding session token:', error);
      return null;
    }
  }

  /**
   * Crear un token de sesión único (método legacy, mantener por compatibilidad)
   */
  static createSessionToken(userId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${userId}-${timestamp}-${random}`;
  }

  /**
   * Extraer el userId de un token de sesión (método legacy)
   */
  static extractUserIdFromToken(sessionToken: string): string | null {
    if (!sessionToken) return null;
    
    // Intentar decodificar como nuevo formato
    const decoded = this.decodeSessionToken(sessionToken);
    if (decoded) return decoded.userId;
    
    // Fallback a formato legacy
    const parts = sessionToken.split('-');
    return parts.length > 0 ? parts[0] : null;
  }

  /**
   * Obtener el token de sesión desde las cookies
   */
  static getSessionTokenFromCookies(
    cookieStore: ReadonlyRequestCookies | ReturnType<typeof cookies>
  ): string | null {
    try {
      if ('get' in cookieStore && typeof cookieStore.get === 'function') {
        return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
      }
    } catch (error) {
      console.error('Error getting session token from cookies:', error);
    }
    return null;
  }

  /**
   * Obtener usuario desde un token de sesión
   */
  static async getUserFromToken(sessionToken: string | null): Promise<SessionUser | null> {
    if (!sessionToken) {
      return null;
    }

    const userId = this.extractUserIdFromToken(sessionToken);
    if (!userId) {
      return null;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          ghlLocationId: true,
          ghlCompanyId: true,
        },
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as 'ADMIN' | 'LOCATION',
        ghlLocationId: user.ghlLocationId,
        ghlCompanyId: user.ghlCompanyId,
      };
    } catch (error) {
      console.error('Error getting user from session token:', error);
      return null;
    }
  }

  /**
   * Obtener usuario de la sesión actual (para API routes y server components)
   */
  static async getSessionUser(): Promise<SessionUser | null> {
    try {
      const cookieStore = await cookies();
      const sessionToken = this.getSessionTokenFromCookies(cookieStore);
      return await this.getUserFromToken(sessionToken);
    } catch (error) {
      console.error('Error getting session user:', error);
      return null;
    }
  }

  /**
   * Obtener información básica del usuario desde cookies (para middleware - Edge Runtime)
   * NO usa Prisma, solo decodifica la información de la cookie
   */
  static getSessionUserFromRequest(
    cookieStore: ReadonlyRequestCookies
  ): { userId: string; email: string; role: string } | null {
    try {
      const sessionToken = this.getSessionTokenFromCookies(cookieStore);
      if (!sessionToken) return null;
      
      return this.decodeSessionToken(sessionToken);
    } catch (error) {
      console.error('Error getting session user from request:', error);
      return null;
    }
  }

  /**
   * Verificar si hay una sesión válida (para middleware - Edge Runtime)
   * NO usa Prisma, solo verifica la existencia y formato de la cookie
   */
  static hasValidSession(cookieStore: ReadonlyRequestCookies): boolean {
    const user = this.getSessionUserFromRequest(cookieStore);
    return user !== null;
  }

  /**
   * Crear una sesión y establecer la cookie en un NextResponse
   * Almacena información del usuario en la cookie para que el middleware pueda validarla sin Prisma
   */
  static createSession(response: NextResponse, user: SessionUser): NextResponse {
    const sessionToken = this.encodeSessionToken(user);
    
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, SESSION_COOKIE_OPTIONS);
    
    console.log(`[SessionManager] Sesión creada para usuario: ${user.id} (${user.email})`);
    
    return response;
  }

  /**
   * Crear una sesión usando solo userId (obtiene datos del usuario desde DB)
   * Para usar cuando solo tenemos el userId
   */
  static async createSessionFromUserId(response: NextResponse, userId: string): Promise<NextResponse> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          ghlLocationId: true,
          ghlCompanyId: true,
        },
      });

      if (!user) {
        throw new Error(`Usuario no encontrado: ${userId}`);
      }

      const sessionUser: SessionUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as 'ADMIN' | 'LOCATION',
        ghlLocationId: user.ghlLocationId,
        ghlCompanyId: user.ghlCompanyId,
      };

      return this.createSession(response, sessionUser);
    } catch (error) {
      console.error('Error creating session from userId:', error);
      throw error;
    }
  }

  /**
   * Crear una sesión en un NextResponse existente o crear uno nuevo (usando userId)
   */
  static async createSessionInResponse(
    responseOrUrl: NextResponse | string | URL,
    userId: string
  ): Promise<NextResponse> {
    let response: NextResponse;

    if (responseOrUrl instanceof NextResponse) {
      response = responseOrUrl;
    } else {
      const url = typeof responseOrUrl === 'string' ? new URL(responseOrUrl) : responseOrUrl;
      response = NextResponse.redirect(url);
    }

    return await this.createSessionFromUserId(response, userId);
  }

  /**
   * Destruir la sesión actual
   */
  static async destroySession(): Promise<void> {
    try {
      const cookieStore = await cookies();
      cookieStore.delete(SESSION_COOKIE_NAME);
      console.log('[SessionManager] Sesión destruida');
    } catch (error) {
      console.error('Error destroying session:', error);
    }
  }

  /**
   * Verificar si el usuario está autenticado
   */
  static async isAuthenticated(): Promise<boolean> {
    const user = await this.getSessionUser();
    return user !== null;
  }

  /**
   * Requerir autenticación (lanza error si no está autenticado)
   */
  static async requireAuth(): Promise<SessionUser> {
    const user = await this.getSessionUser();
    
    if (!user) {
      throw new Error('Unauthorized: No hay sesión activa');
    }

    return user;
  }

  /**
   * Validar y refrescar una sesión existente
   */
  static async validateSession(sessionToken: string | null): Promise<SessionUser | null> {
    if (!sessionToken) {
      return null;
    }

    const user = await this.getUserFromToken(sessionToken);
    return user;
  }
}

// Exportar funciones de compatibilidad con el código existente
export const createSessionToken = SessionManager.createSessionToken.bind(SessionManager);
export const getSessionUser = SessionManager.getSessionUser.bind(SessionManager);
export const getSessionUserFromRequest = SessionManager.getSessionUserFromRequest.bind(SessionManager);
export const destroySession = SessionManager.destroySession.bind(SessionManager);
export const isAuthenticated = SessionManager.isAuthenticated.bind(SessionManager);
export const requireAuth = SessionManager.requireAuth.bind(SessionManager);

