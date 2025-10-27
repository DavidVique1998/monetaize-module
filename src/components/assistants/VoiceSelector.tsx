'use client';

import { useState, useRef, useEffect } from 'react';
import { Volume2, Play, Pause, Settings as SettingsIcon, X, Search } from 'lucide-react';
import type { RetellVoice } from '@/hooks/useVoices';

interface VoiceSelectorProps {
  voices: RetellVoice[];
  value: string;
  onChange: (voiceId: string) => void;
}

export function VoiceSelector({ voices, value, onChange }: VoiceSelectorProps) {
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
    <div className="flex items-center space-x-2 px-3 py-1.5 border border-gray-300 rounded-lg relative" ref={dropdownRef}>
      <Volume2 className="w-3 h-3 text-gray-400" />
      
      <button
        onClick={handleOpen}
        className="text-sm font-medium text-gray-900 bg-transparent border-0 outline-0 cursor-pointer flex-1 text-left"
      >
        {selectedVoice?.voice_name || 'Select Voice'}
      </button>

      {value && (
        <button 
          onClick={handleClear}
          className="hover:bg-gray-100 rounded p-0.5 transition-colors cursor-pointer"
          title="Clear selection"
        >
          <X className="w-3 h-3 text-gray-400" />
        </button>
      )}

      <button className="hover:bg-gray-100 rounded p-0.5 transition-colors cursor-pointer">
        <SettingsIcon className="w-3 h-3 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-96">
          {/* Search bar */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search voices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
            </div>
          </div>

          {/* Voices grid */}
          <div className="grid grid-cols-1 gap-2 p-3 max-h-96 overflow-y-auto">
            {filteredVoices.map((voice) => (
              <div
                key={voice.voice_id}
                className={`px-4 py-3 hover:bg-gray-50 rounded-lg flex items-center justify-between cursor-pointer group transition-all ${
                  value === voice.voice_id ? 'bg-purple-50 border-2 border-purple-300 shadow-sm' : 'border-2 border-gray-100 hover:border-purple-200'
                }`}
                onClick={() => handleSelect(voice.voice_id)}
              >
                <div className="flex items-start justify-between w-full">
                  {/* Voice Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-gray-900 mb-2">{voice.voice_name}</div>
                    
                    {/* Characteristics Grid */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-500">Gender:</span>
                        <span className="font-medium text-gray-700 capitalize">{voice.gender}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-500">Age:</span>
                        <span className="font-medium text-gray-700 capitalize">{voice.age}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-500">Accent:</span>
                        <span className="font-medium text-gray-700">{voice.accent || 'N/A'}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-500">Provider:</span>
                        <span className="font-medium text-gray-700 capitalize">{voice.provider}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Play Button */}
                  {voice.preview_audio_url && (
                    <button
                      onClick={(e) => handlePlay(e, voice)}
                      className="ml-3 p-2 hover:bg-purple-100 rounded-lg transition-colors flex-shrink-0 group/play cursor-pointer"
                    >
                      {playingId === voice.voice_id ? (
                        <Pause className="w-5 h-5 text-purple-600" />
                      ) : (
                        <Play className="w-5 h-5 text-gray-400 group/play:hover:text-purple-600 transition-colors" />
                      )}
                    </button>
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

