/**
 * Configuración centralizada de la aplicación
 * Maneja todas las variables de entorno de forma tipada
 */

// Cargar variables de entorno solo en desarrollo
// En producción (Vercel), las variables se inyectan directamente
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  try {
    // Solo intentar cargar .env.local en desarrollo
    require('dotenv').config({ path: '.env.local' });
  } catch (error) {
    console.warn('Could not load .env.local file:', error);
  }
}

export const config = {
  // Retell AI Configuration
  retell: {
    apiKey: process.env.RETELL_API_KEY || '',
    baseUrl: process.env.RETELL_BASE_URL || 'https://api.retellai.com',
  },

  // GoHighLevel Integration
  ghl: {
    token: process.env.GHL_TOKEN || '',
  },

  // Application Configuration
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Monetaize Agent Panel',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    environment: process.env.NODE_ENV || 'development',
  },

  // API Configuration
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
    timeout: parseInt(process.env.API_TIMEOUT || '30000'),
  },

  // Feature Flags
  features: {
    analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    voicePreview: process.env.NEXT_PUBLIC_ENABLE_VOICE_PREVIEW === 'true',
    realTimeMonitoring: process.env.NEXT_PUBLIC_ENABLE_REAL_TIME_MONITORING === 'true',
  },

  // Rate Limiting
  rateLimit: {
    requestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60'),
    burst: parseInt(process.env.RATE_LIMIT_BURST || '10'),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true',
  },

  // Caching
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300'),
    enabled: process.env.ENABLE_CACHE === 'true',
  },

  // Development helpers
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isStaging: process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_URL?.includes('staging'),
} as const;

// Validación de configuración requerida
export const validateConfig = () => {
  const errors: string[] = [];

  if (!config.retell.apiKey) {
    errors.push('RETELL_API_KEY is required');
  }

  if (!config.ghl.token) {
    errors.push('GHL_TOKEN is required');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors: ${errors.join(', ')}`);
  }
};

// Configuración específica por entorno
export const getEnvironmentConfig = () => {
  if (config.isDevelopment) {
    return {
      ...config,
      logging: {
        ...config.logging,
        level: 'debug',
        enableRequestLogging: true,
      },
      cache: {
        ...config.cache,
        ttl: 60, // Cache más corto en desarrollo
      },
    };
  }

  if (config.isStaging) {
    return {
      ...config,
      logging: {
        ...config.logging,
        level: 'debug',
        enableRequestLogging: true,
      },
      rateLimit: {
        ...config.rateLimit,
        requestsPerMinute: 30, // Límites más bajos en staging
      },
    };
  }

  if (config.isProduction) {
    return {
      ...config,
      logging: {
        ...config.logging,
        level: 'info',
        enableRequestLogging: false,
      },
      cache: {
        ...config.cache,
        ttl: 600, // Cache más largo en producción
      },
    };
  }

  return config;
};

export default config;
