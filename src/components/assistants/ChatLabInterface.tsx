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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-gray-600" />
          <label className="text-sm font-medium text-gray-700">
            Chat Lab - {agentName}
          </label>
        </div>
        <div className="flex items-center space-x-2">
          {isChatActive && (
            <button
              onClick={clearChat}
              className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear conversation
            </button>
          )}
        </div>
      </div>

      {/* Agent Validation Status */}
      {isValidating ? (
        <div className="flex items-start space-x-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <Loader2 className="w-5 h-5 text-blue-600 mt-0.5 animate-spin" />
          <p className="text-sm text-blue-800">Validating agent configuration...</p>
        </div>
      ) : agentValidation ? (
        agentValidation.isValid ? (
          <div className="flex items-start space-x-3 bg-green-50 border border-green-200 rounded-lg p-4">
            <MessageSquare className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm text-green-800 font-medium">Agent ready for chat</p>
              <p className="text-xs text-green-700 mt-1">
                {agentValidation.agent?.response_engine?.type === 'retell-llm' 
                  ? `Using Retell LLM (${agentValidation.agent?.llm_info?.prompt_length || 0} chars)` 
                  : agentValidation.agent?.response_engine?.type === 'conversation-flow'
                  ? 'Using Conversation Flow'
                  : 'Response engine configured'} • Published v{agentValidation.agent?.version || 0}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start space-x-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm text-red-800 font-medium">Agent configuration issues:</p>
              <ul className="text-xs text-red-700 mt-1 list-disc list-inside">
                {agentValidation.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>
          </div>
        )
      ) : (
        <div className="flex items-start space-x-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <p className="text-sm text-yellow-800">
            Chat Lab allows you to test your agent with real text conversations. 
            {!isChatActive && ' Click "Start Chat" to begin testing.'}
          </p>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col min-h-[600px]">
        {/* Chat Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
              <p className="text-sm text-gray-500 mb-6">
                Begin testing your agent by starting a chat session
              </p>
              <button
                onClick={startChat}
                disabled={isLoading || !agentValidation?.isValid}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : !agentValidation?.isValid ? (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Fix Configuration First
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Start Chat
                  </>
                )}
              </button>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.message_id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start space-x-2 max-w-md ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' 
                        ? 'bg-blue-100' 
                        : 'bg-purple-100'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-purple-600" />
                      )}
                    </div>
                    <div>
                      {message.role === 'agent' && (
                        <div className="text-xs font-medium text-gray-700 mb-1">{agentName}</div>
                      )}
                      <div className={`rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2 max-w-md">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1">{agentName}</div>
                      <div className="bg-gray-100 rounded-lg px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                          <span className="text-sm text-gray-500">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        {isChatActive && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message your AI..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold px-4 py-3 rounded-lg transition-colors flex items-center cursor-pointer disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">AI can make mistakes - check important information.</p>
          </div>
        )}
      </div>

      {/* Error Message - Fixed position to avoid layout shift */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-md animate-in slide-in-from-right duration-300">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium">Chat Error</p>
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
