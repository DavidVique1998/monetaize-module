'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ConversationList } from '@/components/inbox/ConversationList';
import { ConversationDetail } from '@/components/inbox/ConversationDetail';

export default function InboxPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - en producción vendría de una API
  const conversations = [
    {
      id: '1',
      name: 'Patricia Hussey',
      lastMessage: '😊',
      timestamp: '3:15 pm',
      avatar: undefined,
    },
    {
      id: '2',
      name: 'Jim',
      lastMessage: 'thank you for your time',
      timestamp: '8:50 pm',
      avatar: undefined,
    },
    {
      id: '3',
      name: 'Timothy Undefined',
      lastMessage: 'Who are you',
      timestamp: '6:17 pm',
      avatar: undefined,
    },
    {
      id: '4',
      name: 'Lee Marvin',
      lastMessage: 'They can reach me late Monday...',
      timestamp: '4:04 pm',
      avatar: undefined,
    },
    {
      id: '5',
      name: 'Leiva Nelson',
      lastMessage: "It's turn key..",
      timestamp: '1:56 pm',
      avatar: undefined,
    },
    {
      id: '6',
      name: 'Milagros Maldona',
      lastMessage: 'Call me or I will find you',
      timestamp: '8:58 am',
      avatar: undefined,
    },
  ];

  const conversationDetails: Record<string, any> = {
    '1': {
      id: 'k6bN4Ua8kCTttXeL14cU',
      name: 'Patricia Hussey',
      startedAt: 'Tue, Jul 22nd, 2025, 3:39 pm',
      messages: [
        {
          id: 'm1',
          type: 'outgoing',
          content: 'Hi Patricia, thanks for confirming you\'d consider a proposal on your property at 850 W Skyview Crossing Dr, Hernando FL 34442. We\'ll have our smart assistant give you a quick call soon, just to confirm a few details. This helps us get you the best and fastest proposal. Thanks, DC Property Buyers',
          timestamp: '07/22/25, 3:39 pm',
          isGenerated: true,
        },
        {
          id: 'm2',
          type: 'incoming',
          content: 'Not looking to sell this is my price if you don\'t like don\'t bother me. You contacted me.',
          timestamp: '07/22/25, 3:41 pm',
        },
        {
          id: 'm3',
          type: 'outgoing',
          content: 'thank you for your time',
          timestamp: '07/22/25, 3:43 pm',
          isGenerated: true,
        },
        {
          id: 'm4',
          type: 'outgoing',
          content: 'Hey Patricia, if you\'re still considering on a proposal we\'re ready for you, let us know when can we call, thank you!',
          timestamp: '08/01/25, 2:42 pm',
        },
        {
          id: 'm5',
          type: 'incoming',
          content: 'Are you agreeing to # I gave you?',
          timestamp: '08/01/25, 2:51 pm',
        },
        {
          id: 'm6',
          type: 'outgoing',
          content: 'Hey totally fair we keep your price in mind one of our agents will contact you when is a good time to call? So we can discuss further',
          timestamp: '08/01/25, 2:55 pm',
        },
      ],
    },
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConvData = selectedConversation 
    ? conversationDetails[selectedConversation] 
    : null;

  return (
    <DashboardLayout>
      <div className="flex h-full bg-gray-50">
        {/* Left Panel - Conversation List */}
        <div className="w-80 flex-shrink-0">
          <ConversationList
            conversations={filteredConversations}
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Right Panel - Conversation Detail */}
        <div className="flex-1">
          <ConversationDetail conversation={selectedConvData} />
        </div>
      </div>
    </DashboardLayout>
  );
}