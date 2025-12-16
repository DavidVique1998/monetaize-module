'use client';

import { useState, useEffect } from 'react';
import { X, Settings, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  llmId: string;
  onSave: (llmId: string) => void;
  availableLLMs?: Array<{ llm_id: string; llm_name?: string }>;
}

export function ModelConfigDrawer({ 
  isOpen, 
  onClose, 
  llmId, 
  onSave,
  availableLLMs = []
}: ModelConfigDrawerProps) {
  const [selectedLlmId, setSelectedLlmId] = useState(llmId);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedLlmId(llmId);
    }
  }, [isOpen, llmId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(selectedLlmId);
      onClose();
    } catch (error) {
      console.error('Error saving model config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Modelos LLM disponibles
  const defaultLLMs = [
    { llm_id: 'gpt-4o', llm_name: 'GPT-4o' },
    { llm_id: 'gpt-4', llm_name: 'GPT-4' },
    { llm_id: 'gpt-3.5-turbo', llm_name: 'GPT-3.5 Turbo' },
    { llm_id: 'gemini-2.0-flash-exp', llm_name: 'Gemini 2.0 Flash' },
    { llm_id: 'claude-3-5-sonnet-20241022', llm_name: 'Claude 3.5 Sonnet' },
  ];

  const llms = availableLLMs.length > 0 ? availableLLMs : defaultLLMs;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-96 bg-card shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-hidden",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-gray-900">Model Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {/* LLM Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Language Model
            </label>
            <div className="space-y-2">
              {llms.map((llm) => (
                <label
                  key={llm.llm_id}
                  className={cn(
                    "flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors",
                    selectedLlmId === llm.llm_id
                      ? "border-primary bg-primary/10"
                      : "border-gray-200 hover:border-gray-200 hover:bg-muted"
                  )}
                >
                  <input
                    type="radio"
                    name="llm"
                    value={llm.llm_id}
                    checked={selectedLlmId === llm.llm_id}
                    onChange={(e) => setSelectedLlmId(e.target.value)}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {llm.llm_name || llm.llm_id}
                    </p>
                    <p className="text-xs text-muted-foreground">{llm.llm_id}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Model Info */}
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Model Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost:</span>
                <span className="text-gray-900 font-medium">$0.115/min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Latency:</span>
                <span className="text-gray-900 font-medium">970-1300ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tokens:</span>
                <span className="text-gray-900 font-medium">65-305</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-card">
          <button
            onClick={handleSave}
            disabled={isSaving || selectedLlmId === llmId}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

