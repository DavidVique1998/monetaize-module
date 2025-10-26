'use client';

import { useState, useEffect } from 'react';

export interface RetellVoice {
  voice_id: string;
  voice_name: string;
  provider: 'elevenlabs' | 'openai' | 'deepgram';
  gender: 'male' | 'female';
  accent?: string;
  age?: string;
  preview_audio_url?: string;
}

export interface VoiceStats {
  total: number;
  byProvider: {
    elevenlabs: number;
    openai: number;
    deepgram: number;
  };
}

export function useVoices() {
  const [voices, setVoices] = useState<RetellVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<RetellVoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVoices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/voices');
      const result = await response.json();
      
      if (result.success) {
        setVoices(result.data);
      } else {
        setError(result.error || 'Failed to load voices');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load voices');
    } finally {
      setLoading(false);
    }
  };

  const selectVoice = (voice: RetellVoice) => {
    setSelectedVoice(voice);
  };

  const previewVoice = (voice: RetellVoice) => {
    if (voice.preview_audio_url) {
      const audio = new Audio(voice.preview_audio_url);
      audio.play().catch(console.error);
    }
  };

  const getVoiceStats = (): VoiceStats => {
    const stats: VoiceStats = {
      total: voices.length,
      byProvider: {
        elevenlabs: 0,
        openai: 0,
        deepgram: 0,
      },
    };

    voices.forEach(voice => {
      if (voice.provider in stats.byProvider) {
        stats.byProvider[voice.provider as keyof typeof stats.byProvider]++;
      }
    });

    return stats;
  };

  useEffect(() => {
    loadVoices();
  }, []);

  return {
    voices,
    selectedVoice,
    loading,
    error,
    loadVoices,
    selectVoice,
    previewVoice,
    getVoiceStats,
  };
}