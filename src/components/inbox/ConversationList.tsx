'use client';

import React from 'react';
import { Search, Mail, MessageSquare } from 'lucide-react';

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread?: boolean;
  avatar?: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: string | null;
  onSelectConversation: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ConversationList({ 
  conversations, 
  selectedConversation, 
  onSelectConversation,
  searchQuery,
  onSearchChange
}: ConversationListProps) {
  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground mb-3">Inbox</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare className="w-12 h-12 mb-4" />
            <p className="text-sm">No conversations yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((conversation) => {
              const isSelected = selectedConversation === conversation.id;
              
              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`
                    w-full flex items-start p-4 cursor-pointer
                    transition-all duration-200
                    ${isSelected 
                      ? 'bg-purple-50 border-l-4 border-purple-600 !border-b-transparent' 
                      : 'hover:bg-primary/5 border-l-4 border-transparent'}
                  `}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {conversation.avatar ? (
                      <img 
                        src={conversation.avatar} 
                        alt={conversation.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {conversation.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="ml-3 flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium truncate text-left ${isSelected ? 'text-purple-700' : 'text-foreground'}`}>
                        {conversation.name}
                      </p>
                      <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                        {conversation.timestamp}
                      </span>
                    </div>
                    <p className={`text-sm truncate mt-1 text-left ${isSelected ? 'text-purple-600' : 'text-muted-foreground'}`}>
                      {conversation.lastMessage}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-border bg-muted">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing 1 - {conversations.length}</span>
          <div className="flex items-center space-x-2">
            <span>Page 1 of 537</span>
            <button 
              disabled 
              className="p-1 text-gray-400 cursor-not-allowed"
            >
              ←
            </button>
            <button 
              disabled 
              className="p-1 text-gray-400 cursor-not-allowed"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

