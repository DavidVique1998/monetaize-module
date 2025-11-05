'use client';

import { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface WebCallInterfaceProps {
  agentId: string;
  agentName: string;
  onCallStart?: () => void;
  onCallEnd?: () => void;
}

export function WebCallInterface({ 
  agentId, 
  agentName, 
  onCallStart, 
  onCallEnd 
}: WebCallInterfaceProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const callDurationRef = useRef<NodeJS.Timeout | null>(null);
  const retellClientRef = useRef<any>(null);

  useEffect(() => {
    // Inicializar el cliente de Retell cuando el componente se monta
    const initializeRetellClient = async () => {
      try {
        // Importar dinámicamente el SDK de Retell para evitar problemas de SSR
        const { RetellWebClient } = await import('retell-client-js-sdk');
        
        // Inicializar el cliente sin argumentos (el SDK gestiona la configuración internamente)
        retellClientRef.current = new RetellWebClient();
        
        // Configurar listeners para eventos de la llamada
        retellClientRef.current.on('call_started', () => {
          console.log('Call started!');
        });

        retellClientRef.current.on('call_ended', () => {
          console.log('Call ended!');
          setIsCallActive(false);
        });

        retellClientRef.current.on('update', (update: any) => {
          console.log('Call update:', update);
          // Aquí puedes recibir transcripciones en tiempo real, estados, etc.
        });

        retellClientRef.current.on('error', (error: any) => {
          console.error('Call error:', error);
          setError('Error durante la llamada');
        });
        
        console.log('Retell Web Client initialized');
      } catch (error) {
        console.error('Error initializing Retell client:', error);
        setError('Error al inicializar el cliente de llamadas');
      }
    };

    initializeRetellClient();

    // Cleanup al desmontar
    return () => {
      if (callDurationRef.current) {
        clearInterval(callDurationRef.current);
      }
      if (retellClientRef.current && isCallActive) {
        retellClientRef.current.stopCall();
      }
    };
  }, []);

  const startCall = async () => {
    if (!retellClientRef.current) {
      setError('Cliente de Retell no inicializado');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Solicitar permisos de micrófono
      await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });

      // Obtener el token de acceso desde el backend
      const response = await fetch('/api/web-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentId }),
      });

      if (!response.ok) {
        throw new Error('Failed to get access token');
      }

      const { access_token } = await response.json();

      // Iniciar la llamada con el token de acceso
      await retellClientRef.current.startCall({
        accessToken: access_token,
      });

      setIsCallActive(true);
      setIsConnecting(false);
      onCallStart?.();

      // Iniciar contador de duración
      callDurationRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

    } catch (error: any) {
      console.error('Error starting call:', error);
      setError(error.message || 'Error al iniciar la llamada');
      setIsConnecting(false);
    }
  };

  const endCall = async () => {
    if (!retellClientRef.current) return;

    try {
      await retellClientRef.current.stopCall();
      
      setIsCallActive(false);
      setIsConnecting(false);
      setCallDuration(0);
      
      if (callDurationRef.current) {
        clearInterval(callDurationRef.current);
        callDurationRef.current = null;
      }
      
      onCallEnd?.();
    } catch (error) {
      console.error('Error ending call:', error);
      setError('Error al terminar la llamada');
    }
  };

  const toggleMute = () => {
    if (!retellClientRef.current) return;
    
    try {
      if (isMuted) {
        retellClientRef.current.unmute();
      } else {
        retellClientRef.current.mute();
      }
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const toggleSpeaker = () => {
    if (!retellClientRef.current) return;
    
    try {
      if (isSpeakerMuted) {
        retellClientRef.current.unmuteSpeaker();
      } else {
        retellClientRef.current.muteSpeaker();
      }
      setIsSpeakerMuted(!isSpeakerMuted);
    } catch (error) {
      console.error('Error toggling speaker:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Voice Lab - {agentName}
        </h3>
        <p className="text-sm text-gray-600">
          Prueba tu agente con una llamada web en tiempo real
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Estado de la llamada */}
      <div className="text-center mb-6">
        {isCallActive && (
          <div className="mb-4">
            <div className="text-2xl font-mono text-green-600 mb-2">
              {formatDuration(callDuration)}
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">
                Llamada en curso
              </span>
            </div>
          </div>
        )}
        
        {isConnecting && (
          <div className="mb-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-blue-600">Conectando...</p>
          </div>
        )}
      </div>

      {/* Controles de llamada */}
      <div className="flex justify-center space-x-4 mb-6">
        {!isCallActive && !isConnecting && (
          <button
            onClick={startCall}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <Phone className="w-5 h-5" />
            <span>Iniciar Llamada</span>
          </button>
        )}

        {isCallActive && (
          <>
            <button
              onClick={toggleMute}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isMuted 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              <span>{isMuted ? 'Desactivar Mic' : 'Activar Mic'}</span>
            </button>

            <button
              onClick={toggleSpeaker}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isSpeakerMuted 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              <span>{isSpeakerMuted ? 'Activar Audio' : 'Silenciar Audio'}</span>
            </button>

            <button
              onClick={endCall}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <PhoneOff className="w-5 h-5" />
              <span>Terminar</span>
            </button>
          </>
        )}
      </div>

      {/* Información adicional */}
      <div className="text-center text-xs text-gray-500">
        <p>• Asegúrate de tener permisos de micrófono habilitados</p>
        <p>• Usa auriculares para mejor experiencia de audio</p>
        <p>• Esta es una simulación de llamada para testing</p>
      </div>
    </div>
  );
}
