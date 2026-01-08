'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '../ui/button';

interface CreateKnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateKnowledgeBaseModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateKnowledgeBaseModalProps) {
  const t = useTranslations('knowledge.createModal');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [knowledgeBaseName, setKnowledgeBaseName] = useState('');
  const [enableAutoRefresh, setEnableAutoRefresh] = useState(false);
  
  // Textos
  const [texts, setTexts] = useState<Array<{ text: string; title?: string }>>([]);
  const [currentText, setCurrentText] = useState('');
  const [currentTextTitle, setCurrentTextTitle] = useState('');
  
  // URLs
  const [urls, setUrls] = useState<string[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');

  if (!isOpen) return null;

  const handleAddText = () => {
    if (currentText.trim()) {
      setTexts([...texts, { text: currentText.trim(), title: currentTextTitle.trim() || undefined }]);
      setCurrentText('');
      setCurrentTextTitle('');
    }
  };

  const handleRemoveText = (index: number) => {
    setTexts(texts.filter((_, i) => i !== index));
  };

  const handleAddUrl = () => {
    if (currentUrl.trim() && isValidUrl(currentUrl.trim())) {
      setUrls([...urls, currentUrl.trim()]);
      setCurrentUrl('');
    }
  };

  const handleRemoveUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!knowledgeBaseName.trim()) {
      setError(t('errors.nameRequired'));
      return;
    }

    if (knowledgeBaseName.length >= 40) {
      setError(t('errors.nameTooLong'));
      return;
    }

    if (texts.length === 0 && urls.length === 0) {
      setError(t('errors.sourceRequired'));
      return;
    }

    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('knowledge_base_name', knowledgeBaseName.trim());
      formData.append('enable_auto_refresh', String(enableAutoRefresh));

      if (texts.length > 0) {
        formData.append('knowledge_base_texts', JSON.stringify(texts));
      }

      urls.forEach((url) => {
        formData.append('knowledge_base_urls[]', url);
      });

      const response = await fetch('/api/knowledge-bases', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Reset form
        setKnowledgeBaseName('');
        setEnableAutoRefresh(false);
        setTexts([]);
        setUrls([]);
        setCurrentText('');
        setCurrentTextTitle('');
        setCurrentUrl('');
        onSuccess();
      } else {
        setError(data.error || t('errors.createError'));
      }
    } catch (error: any) {
      console.error('Error creating knowledge base:', error);
      setError(t('errors.createError') + ': ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 zbg-muted/30 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-card shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-foreground">{t('title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <div className="mb-4 p-3 bg-redbg-muted/30 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('name')}
              </label>
              <input
                type="text"
                value={knowledgeBaseName}
                onChange={(e) => setKnowledgeBaseName(e.target.value)}
                placeholder={t('namePlaceholder')}
                maxLength={39}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purplebg-muted/300"
                required
              />
              <p className="text-xs text-graybg-muted/300 mt-1">
                {t('maxChars', { count: knowledgeBaseName.length })}
              </p>
            </div>

            {/* Auto-refresh */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t('autoRefresh')}
                </label>
                <p className="text-xs text-graybg-muted/300">
                  {t('autoRefreshDesc')}
                </p>
              </div>
              <input
                type="checkbox"
                checked={enableAutoRefresh}
                onChange={(e) => setEnableAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-primary"
              />
            </div>

            {/* Textos */}
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('texts')}
              </label>
              
              <div className="space-y-2 mb-3">
                {texts.map((text, index) => (
                  <div
                    key={index}
                    className="p-3 bg-muted/30 border border-gray-200 rounded-lg flex items-start justify-between"
                  >
                    <div className="flex-1">
                      {text.title && (
                        <div className="text-sm font-medium text-foreground mb-1">
                          {text.title}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {text.text}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveText(index)}
                      className="ml-2 p-1 text-red-600 hover:bg-destructive/10 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={currentTextTitle}
                  onChange={(e) => setCurrentTextTitle(e.target.value)}
                  placeholder={t('textTitle')}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purplebg-muted/300"
                />
                <textarea
                  value={currentText}
                  onChange={(e) => setCurrentText(e.target.value)}
                  placeholder={t('textPlaceholder')}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purplebg-muted/300"
                />
                <button
                  type="button"
                  onClick={handleAddText}
                  className="w-full px-3 py-2 text-sm text-primary border border-purple-200 rounded-lg hover:bg-purplebg-muted/30 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('addText')}
                </button>
              </div>
            </div>

            {/* URLs */}
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('urls')}
              </label>
              
              <div className="space-y-2 mb-3">
                {urls.map((url, index) => (
                  <div
                    key={index}
                    className="p-3 bg-muted/30 border border-gray-200 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex-1 text-sm text-foreground truncate">
                      {url}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveUrl(index)}
                      className="ml-2 p-1 text-red-600 hover:bg-destructive/10 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={currentUrl}
                  onChange={(e) => setCurrentUrl(e.target.value)}
                  placeholder={t('urlPlaceholder')}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purplebg-muted/300"
                />
                <Button
                  variant="outline-primary"
                  onClick={handleAddUrl}
                >
                  <Plus className="w-4 h-4" />
                  {t('add')}
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <Button
            variant="outline-error"
            onClick={onClose}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? t('creating') : t('create')}
          </Button>
        </div>
      </div>
    </div>
  );
}

