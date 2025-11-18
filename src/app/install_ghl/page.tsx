'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LogIn, CheckCircle, AlertCircle, Loader2, Building2 } from 'lucide-react';

function InstallGHLContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Verificar si hay sesión activa al cargar la página
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me');
        
        // Verificar que la respuesta sea JSON antes de parsear
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          // Si no es JSON, probablemente hubo un error o redirección
          setIsCheckingSession(false);
          return;
        }
        
        const result = await response.json();
        
        // Si hay sesión activa, redirigir al dashboard
        if (result.success && result.user) {
          const redirectTo = searchParams.get('redirect') || '/';
          router.push(redirectTo);
          return;
        }
      } catch (error) {
        console.error('Error checking session:', error);
        // En caso de error, continuar mostrando la página de instalación
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [router, searchParams]);

  // Verificar mensajes de la URL después del callback OAuth
  useEffect(() => {
    if (isCheckingSession) return;

    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (success === 'true') {
      setMessage({
        type: 'success',
        text: 'Instalación exitosa. Redirigiendo...'
      });
      // Redirigir al dashboard después de 1 segundo
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } else if (error) {
      setMessage({
        type: 'error',
        text: errorDescription || error || 'Error en la instalación'
      });
    }
  }, [searchParams, router, isCheckingSession]);

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

  // Mostrar loading mientras se verifica la sesión
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-sm text-gray-600">Verificando sesión...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Conectar con GoHighLevel
        </h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Vincula tu location de GoHighLevel con Monetaize para comenzar
        </p>

        {/* Mensajes de éxito/error */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
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

        {/* Botón de conexión */}
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed shadow-md hover:shadow-lg"
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

        {/* Información adicional */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Al conectar, autorizas a Monetaize a acceder a tu location de GoHighLevel.
            <br />
            Tus datos están seguros y protegidos.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function InstallGHLPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-sm text-gray-600">Cargando...</p>
          </div>
        </div>
      </div>
    }>
      <InstallGHLContent />
    </Suspense>
  );
}

