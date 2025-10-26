'use client';

import React from 'react';
import { User } from 'lucide-react';

interface Message {
  id: string;
  type: 'incoming' | 'outgoing';
  content: string;
  timestamp: string;
  isGenerated?: boolean;
}

interface ConversationDetailProps {
  conversation: {
    id: string;
    name: string;
    startedAt: string;
    messages: Message[];
  } | null;
}

export function ConversationDetail({ conversation }: ConversationDetailProps) {
  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center text-gray-400">
          <User className="w-12 h-12 mx-auto mb-4" />
          <p className="text-sm">Select a conversation to view messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{conversation.name}</h3>
        <p className="text-sm text-gray-500 mt-1">{conversation.id}</p>
        <p className="text-xs text-gray-500 mt-2">
          Conversation Started: {conversation.startedAt}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {conversation.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'incoming' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-4 ${
                message.type === 'incoming'
                  ? 'bg-white border border-gray-200'
                  : 'bg-white text-gray-900'
              }`}
            >
              <p className="text-sm text-gray-900">
                {message.content}
              </p>
              
              {/* Server Logs and User Icon */}
              <div className="flex items-center justify-between mt-2">
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-700">
                    Server Logs
                  </summary>
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                    No server logs available
                  </div>
                </details>
                <button className="text-gray-400 hover:text-gray-600">
                  <User className="w-4 h-4" />
                </button>
              </div>

              {/* Timestamp */}
              <p className="text-xs mt-2 text-gray-500">
                {message.isGenerated && <span className="mr-2">Generated •</span>}
                {message.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

