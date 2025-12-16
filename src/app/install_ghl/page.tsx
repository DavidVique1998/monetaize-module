'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LogIn, CheckCircle, AlertCircle, Building2, Lock } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { CamiaLogo } from '@/components/ui/CamiaLogo';
import Link from 'next/link';

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
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
        {/* Background futurista */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(231,22,128,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(231,22,128,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]" />
        </div>
        
        <div className="relative z-10 max-w-md w-full bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-pink-500/20 shadow-2xl p-8">
          <div className="flex flex-col items-center justify-center py-8">
            <Spinner size="lg" className="mb-4 text-pink-400" />
            <p className="text-sm text-slate-300">Verificando sesión...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background futurista con efectos */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(231,22,128,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:40px_40px]" />
        
        {/* Radial gradients para efectos de luz */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Líneas de conexión animadas */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(231,22,128,0.1)" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 max-w-lg w-full">
        {/* Card principal */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-pink-500/20 shadow-2xl p-8 md:p-12">
          {/* Bienvenido a CAMIA */}
          <div className="text-center mb-8">
            <p className="text-slate-300 text-lg mb-4 font-medium">Bienvenido a</p>
            <div className="flex justify-center mb-6">
              <CamiaLogo size="3xl" showGlow={true} />
            </div>
            <p className="text-slate-400 text-sm mt-4">
              Agentes de Inteligencia Artificial en Todos tus Canales
            </p>
          </div>

          {/* Mensajes de éxito/error */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl flex items-start space-x-3 backdrop-blur-sm ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : 'bg-red-500/10 border border-red-500/30'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              )}
              <p
                className={`text-sm flex-1 ${
                  message.type === 'success' ? 'text-emerald-300' : 'text-red-300'
                }`}
              >
                {message.text}
              </p>
            </div>
          )}

          {/* Invitación */}
          <div className="mb-8 text-center">
            <h2 className="text-xl font-semibold text-slate-200 mb-2">
              Conecta tu cuenta de GoHighLevel
            </h2>
            <p className="text-sm text-slate-400">
              Vincula tu location para comenzar a usar los agentes de IA
            </p>
          </div>

          {/* Botón de conexión con GHL */}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full relative inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-xl transition-all duration-300 disabled:cursor-not-allowed shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] overflow-hidden group"
            style={{
              boxShadow: '0 0 20px rgba(231, 22, 128, 0.5), 0 0 40px rgba(231, 22, 128, 0.3)',
            }}
          >
            {/* Efecto de brillo animado */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-2 text-white" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                <span>Conectar con GoHighLevel</span>
              </>
            )}
          </button>

          {/* Link para ingresar con usuario y contraseña */}
          <div className="mt-6 text-center">
            <Link
              href="#"
              className="text-sm text-slate-400 hover:text-slate-300 transition-colors inline-flex items-center gap-1"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implementar login con usuario y contraseña
                console.log('Login con usuario y contraseña');
              }}
            >
              <Lock className="w-4 h-4" />
              <span>Ingresar con usuario y contraseña</span>
            </Link>
          </div>

          {/* Información adicional */}
          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              Al conectar, autorizas a CAMIA a acceder a tu location de GoHighLevel.
              <br />
              Tus datos están seguros y protegidos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InstallGHLPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
        {/* Background futurista */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(231,22,128,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(231,22,128,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]" />
        </div>
        
        <div className="relative z-10 max-w-md w-full bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-pink-500/20 shadow-2xl p-8">
          <div className="flex flex-col items-center justify-center py-8">
            <Spinner size="lg" className="mb-4 text-pink-400" />
            <p className="text-sm text-slate-300">Cargando...</p>
          </div>
        </div>
      </div>
    }>
      <InstallGHLContent />
    </Suspense>
  );
}

