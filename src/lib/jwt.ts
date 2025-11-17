/**
 * Utilidades para generar y verificar tokens JWT
 * Los tokens incluyen userId y ghlLocationId en el payload
 */

import jwt from 'jsonwebtoken';

// Obtener el secreto JWT de las variables de entorno
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d'; // Por defecto 30 días

export interface JWTPayload {
  userId: string;
  ghlLocationId: string | null;
  iat?: number;
  exp?: number;
}

/**
 * Generar un token JWT para un usuario
 * @param userId - ID del usuario en Monetaize
 * @param ghlLocationId - ID de la ubicación en GoHighLevel
 * @returns Token JWT firmado
 */
export function generateToken(userId: string, ghlLocationId: string | null): string {
  const payload: JWTPayload = {
    userId,
    ghlLocationId,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verificar y decodificar un token JWT
 * @param token - Token JWT a verificar
 * @returns Payload decodificado o null si el token es inválido
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('[JWT] Error verificando token:', error);
    return null;
  }
}

/**
 * Extraer el token del header Authorization
 * @param authHeader - Header Authorization (formato: "Bearer <token>")
 * @returns Token extraído o null
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

