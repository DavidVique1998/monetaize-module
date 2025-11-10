'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LogIn, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function OAuthLogin() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Verificar mensajes de la URL después del callback OAuth
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const messageParam = searchParams.get('message');

    if (success === 'true') {
      setMessage({
        type: 'success',
        text: messageParam || 'Autorización exitosa. Tokens almacenados correctamente.'
      });
      // Limpiar los parámetros de la URL después de mostrar el mensaje
      setTimeout(() => {
        router.replace('/installer');
      }, 5000);
    } else if (error) {
      setMessage({
        type: 'error',
        text: errorDescription || error || 'Error en la autorización'
      });
      // Limpiar los parámetros de la URL después de mostrar el mensaje
      setTimeout(() => {
        router.replace('/installer');
      }, 5000);
    }
  }, [searchParams, router]);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      
      // Llamar al endpoint que genera la URL de autorización
      const response = await fetch('/api/oauth/authorize');
      const result = await response.json();
      
      if (result.success && result.authorizationUrl) {
        // Redirigir a la URL de autorización de GHL
        window.location.href = result.authorizationUrl;
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Error al generar la URL de autorización'
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error iniciando OAuth:', error);
      setMessage({
        type: 'error',
        text: 'Error al iniciar el proceso de autorización'
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Conectar con GoHighLevel
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Autoriza la aplicación para acceder a tus locations de GoHighLevel. 
            Esto permitirá gestionar e instalar la aplicación en tus locations.
          </p>

          {/* Mensajes de éxito/error */}
          {message && (
            <div
              className={`mb-4 p-4 rounded-lg flex items-start space-x-3 ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <p
                className={`text-sm flex-1 ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {message.text}
              </p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Conectar con GoHighLevel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

