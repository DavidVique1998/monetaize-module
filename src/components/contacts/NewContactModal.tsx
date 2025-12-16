'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface NewContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewContactModal({ isOpen, onClose }: NewContactModalProps) {
  const t = useTranslations('contacts.modal');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar Modal */}
      <div 
        className={cn(
          "absolute right-0 top-0 h-full w-[400px] bg-card shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-gray-200",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-foreground">{t('title')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          {/* Name - First and Last */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('name')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder={t('firstName')}
                className="px-4 py-2 border border-input rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
              />
              <input
                type="text"
                placeholder={t('lastName')}
                className="px-4 py-2 border border-input rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('title')}
            </label>
            <input
              type="text"
              placeholder={t('title')}
              className="w-full px-4 py-2 border border-input rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('email')}
            </label>
            <input
              type="email"
              placeholder={t('email')}
              className="w-full px-4 py-2 border border-input rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('phone')}
            </label>
            <input
              type="tel"
              placeholder={t('phone')}
              className="w-full px-4 py-2 border border-input rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('company')}
            </label>
            <input
              type="text"
              placeholder={t('company')}
              className="w-full px-4 py-2 border border-input rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
            />
          </div>

          {/* LinkedIn */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('linkedin')}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                {t('linkedinPrefix')}
              </span>
              <input
                type="text"
                placeholder=""
                className="w-full pl-36 pr-4 py-2 border border-input rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
              />
            </div>
          </div>

          {/* Owner */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('owner')}
            </label>
            <div className="relative">
              <select className="appearance-none w-full px-4 py-2 border border-input rounded-lg text-sm text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background pr-10">
                <option>{t('selectOwner')}</option>
                <option>{t('currentUser')}</option>
                <option>Team member 1</option>
                <option>Team member 2</option>
              </select>
              <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none rotate-90" />
            </div>
          </div>
        </div>

        {/* Footer with button */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-card">
          <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-lg transition-colors">
            {t('addContact')}
          </button>
        </div>
      </div>
    </div>
  );
}
