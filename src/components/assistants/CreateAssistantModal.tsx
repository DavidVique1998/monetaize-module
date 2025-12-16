'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { X, Sparkles, Download, Box, Rocket, Info } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { createBlankAssistant } from '@/app/actions/assistants';
import { useTranslations } from 'next-intl';

interface CreateAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (option: string) => void;
  onAgentCreated?: () => void; // Callback para refrescar la lista
}

type AssistantOption = 'generate' | 'import' | 'blank' | 'flowbuilder';

export function CreateAssistantModal({ isOpen, onClose, onSelectOption, onAgentCreated }: CreateAssistantModalProps) {
  const t = useTranslations('assistants.createModal');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleOptionClick = async (option: AssistantOption) => {
    try {
      setIsCreating(true);
      setError(null);
      onSelectOption(option);
      
      if (option === 'blank') {
        try {
          // Create blank assistant using server action
          const result = await createBlankAssistant();
          
          if (result.success && result.data?.agent_id) {
            // Call the callback to refresh the list if provided
            if (onAgentCreated) {
              onAgentCreated();
            }
            handleClose();
            // Navigate to the edit page
            window.location.href = `/assistants/${result.data.agent_id}`;
          } else {
            const errorMsg = result.error || t('error');
            setError(errorMsg);
            console.error('Agent creation failed:', {
              error: errorMsg,
              result: result
            });
          }
        } catch (serverError) {
          console.error('Server action error:', serverError);
          setError(serverError instanceof Error ? serverError.message : t('error'));
        }
      }
    } catch (error: any) {
      console.error('Error creating assistant:', error);
      setError(error.message || t('error'));
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Sidebar Modal */}
      <div 
        className={cn(
          "absolute right-0 top-0 h-full w-[600px] bg-card shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-card z-10">
          <h2 className="text-2xl font-semibold text-foreground">{t('title')}</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          <p className="text-lg text-foreground">{t('question')}</p>

          {/* Assistant Builder Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">{t('assistantBuilder')}</h3>
            
            {/* Generate Assistant */}
            <div 
              onClick={() => handleOptionClick('generate')}
              className="relative p-6 border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer group hover:bg-purple-50/30"
            >
              <div className="absolute top-4 right-4">
                <Info className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-2">{t('generate.title')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('generate.description')}
                  </p>
                </div>
              </div>
            </div>

            {/* Import With ID */}
            <div 
              onClick={() => handleOptionClick('import')}
              className="relative p-6 border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer group hover:bg-purple-50/30"
            >
              <div className="absolute top-4 right-4">
                <Info className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Download className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-2">{t('import.title')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('import.description')}
                  </p>
                </div>
              </div>
            </div>

            {/* Blank Canvas */}
            <div 
              onClick={() => handleOptionClick('blank')}
              className="relative p-6 border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer group hover:bg-purple-50/30"
            >
              <div className="absolute top-4 right-4">
                <Info className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Box className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-2">{t('blank.title')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('blank.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Conversational Pathway Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Conversational Pathway</h3>
            
            {/* Flowbuilder */}
            <div 
              onClick={() => handleOptionClick('flowbuilder')}
              className="relative p-6 border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer group hover:bg-purple-50/30"
            >
              <div className="absolute top-4 right-4">
                <Info className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold text-foreground">{t('flowbuilder.title')}</h4>
                    <span className="bg-purple-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">BETA</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('flowbuilder.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-6 border-t border-gray-200 bg-card">
          <button
            onClick={onClose}
            disabled={isCreating}
            className="w-full text-foreground font-medium py-2 px-4 rounded-lg hover:bg-muted transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <span className="flex items-center justify-center">
                <Spinner size="sm" className="mr-2 text-foreground" />
                {t('creating')}
              </span>
            ) : (
              t('close')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
