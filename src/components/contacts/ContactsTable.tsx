'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ContactsTable() {
  const t = useTranslations('contacts');
  const tCommon = useTranslations('common');
  
  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="grid grid-cols-5 gap-4 text-sm font-semibold text-muted-foreground">
          <div>{t('table.name')}</div>
          <div>{t('table.email')}</div>
          <div>{t('table.phone')}</div>
          <div>{t('table.id')}</div>
          <div>{t('table.interactions')}</div>
        </div>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground font-medium">{t('noContacts')}</p>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <select className="appearance-none px-3 py-1.5 border border-input rounded-lg text-sm text-foreground bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
            <option>10</option>
            <option>25</option>
            <option>50</option>
            <option>100</option>
          </select>
          <span className="text-sm text-muted-foreground">{t('showing')}</span>
          <span className="text-sm text-muted-foreground">0 {t('results')}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">{t('pageOf')}</span>
          <button 
            disabled
            className="p-2 text-muted-foreground cursor-not-allowed opacity-50"
          >
            ←
          </button>
          <button 
            disabled
            className="p-2 text-muted-foreground cursor-not-allowed opacity-50"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
