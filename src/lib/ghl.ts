/**
 * Helper para acceder fácilmente al contexto de GHL desde cualquier API route
 * Usa los headers agregados por el middleware para obtener el locationId
 */

import { NextRequest } from 'next/server';
import { GHLApp, GHLAppForLocation } from './ghlApp';

/**
 * Obtener el contexto de GHL desde los headers de la request
 * El middleware agrega automáticamente el locationId a los headers
 * 
 * @example
 * export async function GET(request: NextRequest) {
 *   const ghl = await getGHLContext(request);
 *   const location = await ghl.getLocation();
 * }
 */
export async function getGHLContext(request: NextRequest): Promise<GHLAppForLocation> {
  const locationId = request.headers.get('x-ghl-location-id');
  
  if (!locationId) {
    throw new Error('GHL location ID not found in request headers. User may not have a location associated.');
  }

  return await GHLApp.forLocation(locationId);
}

/**
 * Obtener el locationId desde los headers de la request
 * 
 * @example
 * const locationId = getGHLLocationId(request);
 */
export function getGHLLocationId(request: NextRequest): string | null {
  return request.headers.get('x-ghl-location-id');
}

/**
 * Obtener el companyId desde los headers de la request
 * 
 * @example
 * const companyId = getGHLCompanyId(request);
 */
export function getGHLCompanyId(request: NextRequest): string | null {
  return request.headers.get('x-ghl-company-id');
}

/**
 * Obtener información del usuario desde los headers de la request
 * 
 * @example
 * const userInfo = getUserFromHeaders(request);
 */
export function getUserFromHeaders(request: NextRequest): {
  userId: string | null;
  email: string | null;
  role: string | null;
  ghlLocationId: string | null;
  ghlCompanyId: string | null;
} {
  return {
    userId: request.headers.get('x-user-id'),
    email: request.headers.get('x-user-email'),
    role: request.headers.get('x-user-role'),
    ghlLocationId: request.headers.get('x-ghl-location-id'),
    ghlCompanyId: request.headers.get('x-ghl-company-id'),
  };
}
