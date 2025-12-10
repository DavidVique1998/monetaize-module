/**
 * Componente para mostrar una tarjeta de voz individual
 * Basado en la documentación oficial de Retell AI
 */

import { RetellVoice } from '@/lib/retell';
import { Play, Pause, Volume2 } from 'lucide-react';
import { useState } from 'react';

interface VoiceCardProps {
  voice: RetellVoice;
  isSelected?: boolean;
  onSelect?: (voice: RetellVoice) => void;
  onPreview?: (voice: RetellVoice) => void;
}

export function VoiceCard({ voice, isSelected, onSelect, onPreview }: VoiceCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const handlePlayPreview = async () => {
    if (!voice.preview_audio_url) return;

    if (isPlaying && audio) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      const newAudio = new Audio(voice.preview_audio_url);
      newAudio.addEventListener('ended', () => setIsPlaying(false));
      newAudio.addEventListener('error', () => {
        console.error('Error playing audio preview');
        setIsPlaying(false);
      });
      
      await newAudio.play();
      setAudio(newAudio);
      setIsPlaying(true);
      onPreview?.(voice);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'elevenlabs':
        return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
      case 'openai':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'deepgram':
        return 'bg-bluebg-muted text-blue-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getGenderIcon = (gender: string) => {
    return gender === 'male' ? '👨' : '👩';
  };

  return (
    <div
      className={`
        relative p-4 border rounded-lg cursor-pointer transition-all duration-200
        ${isSelected 
          ? 'border-primary bg-primary/5 shadow-md' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }
      `}
      onClick={() => onSelect?.(voice)}
    >
      {/* Header con nombre y proveedor */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getGenderIcon(voice.gender)}</span>
          <h3 className="font-semibold text-gray-900">{voice.voice_name}</h3>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getProviderColor(voice.provider)}`}>
          {voice.provider}
        </span>
      </div>

      {/* Información de la voz */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span className="capitalize">{voice.gender}</span>
          {voice.accent && (
            <span className="px-2 py-1 bg-muted rounded text-xs">
              {voice.accent}
            </span>
          )}
          {voice.age && (
            <span className="px-2 py-1 bg-muted rounded text-xs">
              {voice.age}
            </span>
          )}
        </div>
      </div>

      {/* Preview de audio */}
      {voice.preview_audio_url && (
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePlayPreview();
            }}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{isPlaying ? 'Pausar' : 'Escuchar'}</span>
          </button>
          <Volume2 className="w-4 h-4 text-gray-400" />
        </div>
      )}

      {/* Indicador de selección */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
        </div>
      )}
    </div>
  );
}
