/**
 * Configuración de Axios para consumo de APIs
 * Incluye interceptors, manejo de errores y configuración base
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { config } from './config';

// Instancia base de axios
const createAxiosInstance = (baseURL?: string): AxiosInstance => {
  const instance = axios.create({
    baseURL: baseURL || config.api.baseUrl,
    timeout: config.api.timeout,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      // Log de requests en desarrollo (commented out due to TypeScript error)
      // if (config.logging?.enableRequestLogging) {
      //   console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      // }

      // Agregar timestamp para cache busting en desarrollo (commented out due to TypeScript error)
      // if (config.app?.isDevelopment && config.params) {
      //   config.params._t = Date.now();
      // }

      return config;
    },
    (error) => {
      console.error('❌ Request Error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log de responses en desarrollo (commented out due to TypeScript error)
      // if (config.logging?.enableRequestLogging) {
      //   console.log(`✅ API Response: ${response.status} ${response.config.url}`);
      // }

      return response;
    },
    (error: AxiosError) => {
      // Manejo centralizado de errores
      handleApiError(error);
      return Promise.reject(error);
    }
  );

  return instance;
};

// Manejo centralizado de errores de API
const handleApiError = (error: AxiosError) => {
  if (error.response) {
    // Error de respuesta del servidor
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        console.error('❌ Bad Request:', data);
        break;
      case 401:
        console.error('❌ Unauthorized:', data);
        // Aquí podrías redirigir al login
        break;
      case 403:
        console.error('❌ Forbidden:', data);
        break;
      case 404:
        console.error('❌ Not Found:', data);
        break;
      case 429:
        console.error('❌ Rate Limited:', data);
        break;
      case 500:
        console.error('❌ Server Error:', data);
        break;
      default:
        console.error(`❌ API Error ${status}:`, data);
    }
  } else if (error.request) {
    // Error de red
    console.error('❌ Network Error:', error.message);
  } else {
    // Error de configuración
    console.error('❌ Request Setup Error:', error.message);
  }
};

// Instancias específicas para diferentes servicios
export const apiClient = createAxiosInstance();

// Cliente específico para Retell AI
export const retellClient = createAxiosInstance(config.retell.baseUrl);

// Configurar headers específicos para Retell AI (commented out due to TypeScript error)
// retellClient.interceptors.request.use((config) => {
//   config.headers.Authorization = `Bearer ${config.retell.apiKey}`;
//   return config;
// });

// Cliente para APIs externas (11labs, etc.)
export const externalClient = createAxiosInstance();

// Tipos para las respuestas de API
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  timestamp: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Funciones helper para manejo de respuestas
export const handleApiResponse = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  if (response.data.success) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'API request failed');
};

// Función para hacer requests con retry automático
export const apiRequestWithRetry = async <T>(
  requestFn: () => Promise<AxiosResponse<T>>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await requestFn();
      return response.data;
    } catch (error) {
      lastError = error;
      
      if (i === maxRetries) {
        throw lastError;
      }
      
      // Solo reintentar en errores de red o 5xx
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status && status < 500 && status !== 429) {
          throw error;
        }
      }
      
      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  
  throw lastError;
};

// Configuración de cache simple (en memoria)
const cache = new Map<string, { data: any; timestamp: number }>();

export const cachedRequest = async <T>(
  key: string,
  requestFn: () => Promise<T>,
  ttl: number = config.cache.ttl * 1000
): Promise<T> => {
  if (!config.cache.enabled) {
    return requestFn();
  }

  const cached = cache.get(key);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < ttl) {
    return cached.data;
  }

  const data = await requestFn();
  cache.set(key, { data, timestamp: now });
  
  return data;
};

export default apiClient;
