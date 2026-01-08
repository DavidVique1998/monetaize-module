'use client';

import { useState, useRef, useEffect } from 'react';
import { Volume2, Play, Pause, Settings as SettingsIcon, X, Search } from 'lucide-react';
import type { RetellVoice } from '@/hooks/useVoices';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface VoiceSelectorProps {
  voices: RetellVoice[];
  value: string;
  onChange: (voiceId: string) => void;
  onSettingsClick?: () => void;
  minimal?: boolean;
}

export function VoiceSelector({ voices, value, onChange, onSettingsClick, minimal = false }: VoiceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedVoice = voices.find(v => v.voice_id === value);
  
  // Filtrar voces basado en búsqueda
  const filteredVoices = voices.filter(voice => 
    voice.voice_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    voice.gender.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (voice.accent && voice.accent.toLowerCase().includes(searchQuery.toLowerCase())) ||
    voice.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePlay = (e: React.MouseEvent, voice: RetellVoice) => {
    e.stopPropagation();
    
    if (playingId === voice.voice_id && audioRef.current) {
      // Si está reproduciendo este audio, pausarlo
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingId(null);
    } else {
      // Detener el audio actual si hay uno
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Iniciar el nuevo audio
      if (voice.preview_audio_url) {
        const audio = new Audio(voice.preview_audio_url);
        audioRef.current = audio;
        setPlayingId(voice.voice_id);

        audio.addEventListener('ended', () => {
          setPlayingId(null);
          audioRef.current = null;
        });

        audio.addEventListener('error', () => {
          setPlayingId(null);
          audioRef.current = null;
        });

        audio.play();
      }
    }
  };

  const handleSelect = (voiceId: string) => {
    onChange(voiceId);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setSearchQuery('');
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Volume2 className="w-4 h-4 text-muted-foreground" />
        </div>
        
        <Button
          variant="ghost"
          onClick={handleOpen}
          className="pl-10 pr-10 h-10 w-full bg-card border border-gray-200 text-foreground text-sm rounded-lg focus:ring-purple-500 focus:border-primary block shadow-sm hover:border-gray-300 transition-all cursor-pointer appearance-none text-left truncate justify-start"
        >
          {selectedVoice?.voice_name || 'Select Voice'}
        </Button>

        <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
          {value && (
            <Button 
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-7 w-7 hover:bg-muted rounded transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          )}

          {onSettingsClick ? (
            <Button 
              variant="ghost"
              size="icon"
              onClick={onSettingsClick}
              className="h-7 w-7 hover:bg-muted rounded transition-colors"
              title="Voice Settings"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          ) : (
            <div className="pointer-events-none p-1">
              <SettingsIcon className="w-3 h-3 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-popover border border-gray-200 rounded-lg shadow-xl z-[100] w-96 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Search bar */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder="Search voices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-foreground placeholder-gray-400 bg-popover focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
            </div>
          </div>

          {/* Voices grid */}
          <div className="grid grid-cols-1 gap-2 p-3 max-h-96 overflow-y-auto">
            {filteredVoices.map((voice) => (
              <div
                key={voice.voice_id}
                className={`px-4 py-3 hover:bg-muted rounded-lg flex items-center justify-between cursor-pointer group transition-all ${
                  value === voice.voice_id ? 'bg-purple-50 border-2 border-purple-300 shadow-sm' : 'border-2 border-gray-100 hover:border-purple-200'
                }`}
                onClick={() => handleSelect(voice.voice_id)}
              >
                <div className="flex items-start justify-between w-full">
                  {/* Voice Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-foreground mb-2">{voice.voice_name}</div>
                    
                    {/* Characteristics Grid */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      <div className="flex items-center space-x-1">
                        <span className="text-muted-foreground">Gender:</span>
                        <span className="font-medium text-gray-700 capitalize">{voice.gender}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <span className="text-muted-foreground">Age:</span>
                        <span className="font-medium text-gray-700 capitalize">{voice.age}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <span className="text-muted-foreground">Accent:</span>
                        <span className="font-medium text-gray-700">{voice.accent || 'N/A'}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <span className="text-muted-foreground">Provider:</span>
                        <span className="font-medium text-gray-700 capitalize">{voice.provider}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Play Button */}
                  {voice.preview_audio_url && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handlePlay(e, voice)}
                      className="ml-3 h-9 w-9 hover:bg-primary/10 rounded-lg transition-colors flex-shrink-0 group/play"
                    >
                      {playingId === voice.voice_id ? (
                        <Pause className="w-5 h-5 text-purple-600" />
                      ) : (
                        <Play className="w-5 h-5 text-muted-foreground group/play:hover:text-primary transition-colors" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

