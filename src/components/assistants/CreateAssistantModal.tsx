'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { X, Sparkles, Download, Box, Rocket, Info, Loader2 } from 'lucide-react';
import { createBlankAssistant } from '@/app/actions/assistants';

interface CreateAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (option: string) => void;
  onAgentCreated?: () => void; // Callback para refrescar la lista
}

type AssistantOption = 'generate' | 'import' | 'blank' | 'flowbuilder';

export function CreateAssistantModal({ isOpen, onClose, onSelectOption, onAgentCreated }: CreateAssistantModalProps) {
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
            const errorMsg = result.error || 'Failed to create assistant';
            setError(errorMsg);
            console.error('Agent creation failed:', {
              error: errorMsg,
              result: result
            });
          }
        } catch (serverError) {
          console.error('Server action error:', serverError);
          setError(serverError instanceof Error ? serverError.message : 'Server error occurred');
        }
      }
    } catch (error: any) {
      console.error('Error creating assistant:', error);
      setError(error.message || 'An unexpected error occurred');
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
          "absolute right-0 top-0 h-full w-[600px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-semibold text-gray-900">Create Assistant</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <p className="text-lg text-gray-700">How would you like to create your next employee?</p>

          {/* Assistant Builder Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Assistant Builder</h3>
            
            {/* Generate Assistant */}
            <div 
              onClick={() => handleOptionClick('generate')}
              className="relative p-6 border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group hover:bg-purple-50/30"
            >
              <div className="absolute top-4 right-4">
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">Generate Assistant</h4>
                  <p className="text-sm text-gray-600">
                    Generate an assistant based off of your business's profile and a brief description.
                  </p>
                </div>
              </div>
            </div>

            {/* Import With ID */}
            <div 
              onClick={() => handleOptionClick('import')}
              className="relative p-6 border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group hover:bg-purple-50/30"
            >
              <div className="absolute top-4 right-4">
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Download className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">Import With ID</h4>
                  <p className="text-sm text-gray-600">
                    Import an assistant using the unique ID to create a duplicate in your account.
                  </p>
                </div>
              </div>
            </div>

            {/* Blank Canvas */}
            <div 
              onClick={() => handleOptionClick('blank')}
              className="relative p-6 border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group hover:bg-purple-50/30"
            >
              <div className="absolute top-4 right-4">
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Box className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">Blank Canvas</h4>
                  <p className="text-sm text-gray-600">
                    Create an assistant with no configuration to start building with a blank canvas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Conversational Pathway Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Conversational Pathway</h3>
            
            {/* Flowbuilder */}
            <div 
              onClick={() => handleOptionClick('flowbuilder')}
              className="relative p-6 border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group hover:bg-purple-50/30"
            >
              <div className="absolute top-4 right-4">
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold text-gray-900">Flowbuilder</h4>
                    <span className="bg-purple-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">BETA</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    An objective-based conversational pathway builder. Helps with deterministic routes and AI focus.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-6 border-t border-gray-200 bg-white">
          <button
            onClick={onClose}
            disabled={isCreating}
            className="w-full text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </span>
            ) : (
              'Close'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
