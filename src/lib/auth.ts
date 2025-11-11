/**
 * @deprecated Este archivo se mantiene por compatibilidad.
 * Usa @/lib/session y SessionManager para nuevas implementaciones.
 */

// Re-exportar desde la nueva librería de sesiones
export {
  SessionManager,
  type SessionUser,
  createSessionToken,
  getSessionUser,
  getSessionUserFromRequest,
  destroySession,
  isAuthenticated,
  requireAuth,
} from './session';

