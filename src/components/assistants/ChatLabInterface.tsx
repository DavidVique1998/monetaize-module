'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Trash2, 
  AlertTriangle, 
  Sparkles, 
  Loader2,
  MessageSquare,
  User
} from 'lucide-react';
import { useTranslations } from 'next-intl';

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
      <div className="flex items-center justify-between border-b border-gray-100 p-4 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-gray-600" />
          <label className="text-sm font-bold text-gray-700">
            {agentName}
          </label>
          <span className="text-xs text-gray-400 font-medium px-2 py-0.5 bg-gray-100 rounded-full">{t('simulator')}</span>
        </div>
        <div className="flex items-center space-x-2">
          {isChatActive && (
            <button
              onClick={clearChat}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center"
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
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-center justify-center space-x-3 text-blue-700">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">{t('validating')}</span>
              </div>
            ) : agentValidation ? (
              agentValidation.isValid ? (
                <div className="bg-green-50/50 border border-green-100 rounded-xl p-4 flex flex-col items-center text-center space-y-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-800">{t('readyToChat')}</p>
                    <p className="text-xs text-green-600 mt-1">
                      {agentValidation.agent?.response_engine?.type === 'retell-llm' 
                        ? `${t('retellLlm')} (${agentValidation.agent?.llm_info?.prompt_length || 0} chars)` 
                        : t('conversationFlow')} • v{agentValidation.agent?.validated_version ?? agentValidation.agent?.version ?? 0}
                    </p>
                    {!agentValidation.agent?.llm_info?.is_published && agentValidation.agent?.published_version && (
                      <p className="text-xs text-orange-600 mt-1 flex items-center justify-center">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {t('publishedAgentWarning', { version: agentValidation.agent.published_version })}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 text-center">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-sm font-bold text-red-800">{t('configIssues')}</p>
                  <ul className="text-xs text-red-600 mt-2 space-y-1">
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
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('startTitle')}</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                  {t('startDescription')}
                </p>
                <button
                  onClick={startChat}
                  disabled={isLoading || !agentValidation?.isValid}
                  className="bg-black hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium px-6 py-2.5 rounded-lg transition-all shadow-sm hover:shadow flex items-center mx-auto"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
                    ? 'bg-blue-600' 
                    : 'bg-white border border-gray-200'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-purple-600" />
                  )}
                </div>
                <div className="flex flex-col space-y-1">
                  {message.role === 'agent' && (
                    <span className="text-[10px] font-medium text-gray-400 ml-1">
                      {agentName}
                    </span>
                  )}
                  <div className={`rounded-2xl px-5 py-3 shadow-sm text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
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
                <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="max-w-3xl mx-auto relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('inputPlaceholder')}
              disabled={isLoading}
              className="w-full pl-5 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-300 focus:bg-white transition-all disabled:opacity-60"
              autoFocus
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="absolute right-2 top-1.5 p-2 bg-black hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-full transition-all shadow-sm disabled:shadow-none"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-center text-gray-400 mt-2">
            {t('disclaimer')}
          </p>
        </div>
      )}

      {/* Error Message - Fixed position to avoid layout shift */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-md animate-in slide-in-from-right duration-300">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium">{t('chatError')}</p>
              <p className="text-xs text-red-700 mt-1 break-words">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 transition-colors ml-2 flex-shrink-0"
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
