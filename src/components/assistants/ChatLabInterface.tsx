'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Trash2, 
  AlertTriangle, 
  Sparkles, 
  MessageSquare,
  User
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/ui/spinner';

interface ChatLabInterfaceProps {
  agentId: string;
  agentName: string;
}

interface ChatMessage {
  message_id: string;
  role: 'user' | 'agent';
  content: string;
  created_timestamp: number;
}

export function ChatLabInterface({ agentId, agentName }: ChatLabInterfaceProps) {
  const t = useTranslations('chatLab');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChatActive, setIsChatActive] = useState(false);
  const [agentValidation, setAgentValidation] = useState<{
    isValid: boolean;
    issues: string[];
    agent: any;
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Validar agente al cargar el componente
  useEffect(() => {
    validateAgent();
  }, [agentId]);

  // Auto-hide error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const validateAgent = async () => {
    try {
      setIsValidating(true);
      setError(null);

      const response = await fetch(`/api/chat/validate-agent?agentId=${agentId}`);
      const data = await response.json();

      setAgentValidation(data);

      if (!data.isValid) {
        setError(`Agent configuration issues: ${data.issues.join(', ')}`);
      }
    } catch (error: any) {
      console.error('Error validating agent:', error);
      setError('Error validating agent configuration');
    } finally {
      setIsValidating(false);
    }
  };

  const startChat = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Frontend: Starting chat for agent:', agentId);

      const response = await fetch('/api/chat/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentId }),
      });

      console.log('Frontend: Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Frontend: API Error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to create chat`);
      }

      const data = await response.json();
      console.log('Frontend: Chat created:', data);

      const { chat_id } = data;
      setChatId(chat_id);
      setIsChatActive(true);
      
      // Agregar mensaje de bienvenida del agente
      const welcomeMessage: ChatMessage = {
        message_id: 'welcome',
        role: 'agent',
        content: `¡Hola! Soy ${agentName}. ¿En qué puedo ayudarte hoy?`,
        created_timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);
    } catch (error: any) {
      console.error('Frontend: Error starting chat:', error);
      setError(error.message || 'Error al iniciar el chat');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !chatId || isLoading) return;

    const userMessage: ChatMessage = {
      message_id: `user_${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      created_timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          chatId, 
          content: userMessage.content 
        }),
      });
      
      if (!response.ok) {
        if (response.status === 402) {
            throw new Error('Insufficient balance to send message');
        }
        throw new Error('Failed to send message');
      }

      const { messages: newMessages } = await response.json();

      // Agregar solo los mensajes nuevos del agente
      const agentMessages = newMessages.filter((msg: any) => msg.role === 'agent');
      setMessages(prev => [...prev, ...agentMessages]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.message || 'Error al enviar el mensaje');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    // Si la sesión de chat incluía un agente efímero, intentar limpiarlo también.
    // Esto idealmente debería manejarse en el backend al terminar el chat o con un job de limpieza,
    // pero podemos hacer un intento best-effort aquí si tuviéramos el ID.
    // (Por ahora el backend maneja la terminación del chat).

    if (chatId) {
      try {
        await fetch('/api/chat/end', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ chatId }),
        });
      } catch (error) {
        console.error('Error ending chat:', error);
      }
    }
    
    setMessages([]);
    setChatId(null);
    setIsChatActive(false);
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-muted-foreground" />
          <label className="text-sm font-bold text-foreground">
            {agentName}
          </label>
          <span className="text-xs text-muted-foreground font-medium px-2 py-0.5 bg-muted rounded-full">{t('simulator')}</span>
        </div>
        <div className="flex items-center space-x-2">
          {isChatActive && (
            <button
              onClick={clearChat}
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex items-center"
              title={t('clearChat')}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              {t('clearChat')}
            </button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {/* Status Messages (Inline) */}
        {!isChatActive && (
          <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Validation State */}
            {isValidating ? (
              <div className="bg-accent/50 border border-accent rounded-xl p-4 flex items-center justify-center space-x-3 text-primary">
                <Spinner size="sm" className="text-foreground/70" />
                <span className="text-sm font-medium">{t('validating')}</span>
              </div>
            ) : agentValidation ? (
              agentValidation.isValid ? (
                <div className="bg-emerald-600/10 border border-emerald-600/20 rounded-xl p-4 flex flex-col items-center text-center space-y-2">
                  <div className="w-8 h-8 bg-emerald-600/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-emerald-400 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-400 dark:text-emerald-400">{t('readyToChat')}</p>
                    <p className="text-xs text-emerald-400 dark:text-emerald-400 mt-1">
                      {agentValidation.agent?.response_engine?.type === 'retell-llm' 
                        ? `${t('retellLlm')} (${agentValidation.agent?.llm_info?.prompt_length || 0} chars)` 
                        : t('conversationFlow')} • v{agentValidation.agent?.validated_version ?? agentValidation.agent?.version ?? 0}
                    </p>
                    {!agentValidation.agent?.llm_info?.is_published && agentValidation.agent?.published_version && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center justify-center">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {t('publishedAgentWarning', { version: agentValidation.agent.published_version })}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center">
                  <div className="w-8 h-8 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  </div>
                  <p className="text-sm font-bold text-destructive">{t('configIssues')}</p>
                  <ul className="text-xs text-destructive mt-2 space-y-1">
                    {agentValidation.issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )
            ) : null}

            {/* Empty State / Start Prompt */}
            {!isLoading && messages.length === 0 && (
              <div className="text-center py-8">
                <h3 className="text-lg font-bold text-foreground mb-2">{t('startTitle')}</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                  {t('startDescription')}
                </p>
                <button
                  onClick={startChat}
                  disabled={isLoading || !agentValidation?.isValid}
                  className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-medium px-6 py-2.5 rounded-lg transition-all shadow-sm hover:shadow flex items-center mx-auto"
                >
                  {isLoading ? (
                    <>
                      <Spinner size="sm" className="mr-2 text-primary-foreground" />
                      {t('initializing')}
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {t('startSession')}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Messages List */}
        <div className="space-y-6 max-w-3xl mx-auto pb-4">
          {messages.map((message) => (
            <div key={message.message_id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start space-x-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                  message.role === 'user' 
                    ? 'bg-primary' 
                    : 'bg-card border border-gray-200'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-primary-foreground" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="flex flex-col space-y-1">
                  {message.role === 'agent' && (
                    <span className="text-[10px] font-medium text-muted-foreground ml-1">
                      {agentName}
                    </span>
                  )}
                  <div className={`rounded-2xl px-5 py-3 shadow-sm text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-card border border-gray-200 text-foreground rounded-tl-sm'
                  }`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3 max-w-[85%]">
              <div className="w-8 h-8 bg-card border border-gray-200 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-card border border-gray-200 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      {isChatActive && (
        <div className="p-4 bg-background border-t border-gray-200">
          <div className="max-w-3xl mx-auto relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('inputPlaceholder')}
              disabled={isLoading}
              className="w-full pl-5 pr-12 py-3.5 bg-muted/50 border border-input rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input focus:bg-background transition-all disabled:opacity-60"
              autoFocus
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="absolute right-2 top-1.5 p-2 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground rounded-full transition-all shadow-sm disabled:shadow-none"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            {t('disclaimer')}
          </p>
        </div>
      )}

      {/* Error Message - Fixed position to avoid layout shift */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-destructive/10 border border-destructive/20 rounded-lg p-4 shadow-lg max-w-md animate-in slide-in-from-right duration-300">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-destructive font-medium">{t('chatError')}</p>
              <p className="text-xs text-destructive/90 mt-1 break-words">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-destructive/70 hover:text-destructive transition-colors ml-2 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
