'use client';

import { useState, useEffect } from 'react';
import { X, Volume2, Info } from 'lucide-react';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  voiceModel: string | null;
  voiceTemperature: number;
  voiceSpeed: number;
  volume: number;
  onSave: (settings: {
    voiceModel: string | null;
    voiceTemperature: number;
    voiceSpeed: number;
    volume: number;
  }) => void;
}

export function VoiceSettingsModal({
  isOpen,
  onClose,
  voiceModel,
  voiceTemperature,
  voiceSpeed,
  volume,
  onSave
}: VoiceSettingsModalProps) {
  const [localVoiceModel, setLocalVoiceModel] = useState<string | null>(voiceModel);
  const [localVoiceTemperature, setLocalVoiceTemperature] = useState(voiceTemperature);
  const [localVoiceSpeed, setLocalVoiceSpeed] = useState(voiceSpeed);
  const [localVolume, setLocalVolume] = useState(volume);

  useEffect(() => {
    setLocalVoiceModel(voiceModel);
    setLocalVoiceTemperature(voiceTemperature);
    setLocalVoiceSpeed(voiceSpeed);
    setLocalVolume(volume);
  }, [voiceModel, voiceTemperature, voiceSpeed, volume]);

  const handleSave = () => {
    onSave({
      voiceModel: localVoiceModel,
      voiceTemperature: localVoiceTemperature,
      voiceSpeed: localVoiceSpeed,
      volume: localVolume
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/20 transition-opacity" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[500px] bg-card shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Voice Settings</h2>
              <p className="text-xs text-gray-500">Configure your assistant's voice behavior</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Voice Model */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-semibold text-foreground">Voice Model</label>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-xs text-muted-foreground">
              Optionally set the voice model for 11labs voices. Leave as default for auto-selection.
            </p>
            <select
              value={localVoiceModel || ''}
              onChange={(e) => setLocalVoiceModel(e.target.value || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="">Default (Auto-select)</option>
              <option value="eleven_turbo_v2">Eleven Turbo v2</option>
              <option value="eleven_flash_v2">Eleven Flash v2</option>
              <option value="eleven_turbo_v2_5">Eleven Turbo v2.5</option>
              <option value="eleven_flash_v2_5">Eleven Flash v2.5</option>
              <option value="eleven_multilingual_v2">Eleven Multilingual v2</option>
              <option value="tts-1">TTS-1</option>
              <option value="gpt-4o-mini-tts">GPT-4o Mini TTS</option>
            </select>
          </div>

          {/* Voice Temperature */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-semibold text-foreground">Voice Temperature</label>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <span className="text-sm font-medium text-primary">{localVoiceTemperature}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Controls the emotional expression of the voice. Value ranging from [0,2]. Lower value means more calm and stable speech, 
              and higher value means more emotional and expressive speech generation. Currently applies to 11labs voices.
            </p>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={localVoiceTemperature}
              onChange={(e) => setLocalVoiceTemperature(Number(e.target.value))}
              className="w-full h-2 bg-input rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0 (Calm)</span>
              <span>2 (Emotional)</span>
            </div>
          </div>

          {/* Voice Speed */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-semibold text-foreground">Voice Speed</label>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <span className="text-sm font-medium text-primary">{localVoiceSpeed}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Controls speed of voice. Value ranging from [0.5,2]. Lower value means slower speech, 
              while higher value means faster speech rate.
            </p>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={localVoiceSpeed}
              onChange={(e) => setLocalVoiceSpeed(Number(e.target.value))}
              className="w-full h-2 bg-input rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0.5 (Slower)</span>
              <span>2 (Faster)</span>
            </div>
          </div>

          {/* Volume */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-semibold text-foreground">Volume</label>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <span className="text-sm font-medium text-primary">{localVolume}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Controls the volume of the agent. Value ranging from [0,2]. Lower value means quieter 
              agent speech, while higher value means louder agent speech.
            </p>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={localVolume}
              onChange={(e) => setLocalVolume(Number(e.target.value))}
              className="w-full h-2 bg-input rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0 (Quieter)</span>
              <span>2 (Louder)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex justify-end space-x-3 bg-card sticky bottom-0">
          <button 
            onClick={handleSave} 
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}

