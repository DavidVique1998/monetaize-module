'use client';

import React, { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageOption {
  code: 'es' | 'en';
  name: string;
  nativeName: string;
}

const languages: LanguageOption[] = [
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'en', name: 'English', nativeName: 'English' },
];

export function LanguageSelector() {
  const locale = useLocale() as 'es' | 'en';
  const t = useTranslations('userProfile');
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = async (newLocale: 'es' | 'en') => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }

    // Guardar preferencia en cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    
    // Recargar la página para aplicar el nuevo idioma
    window.location.reload();
  };

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer",
          "hover:bg-blue-50 hover:scale-[1.02] hover:shadow-sm",
          "focus:outline-none",
          "text-gray-700 hover:text-blue-700",
          "group"
        )}
      >
        <div className="mr-3 flex-shrink-0 transition-colors duration-200 text-gray-400 group-hover:text-blue-600">
          <Globe className="w-4 h-4" />
        </div>
        <span className="flex-1 text-left">{t('language')}</span>
        <span className="text-xs text-gray-500 ml-2">{currentLanguage.nativeName}</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg border border-gray-200 shadow-lg py-2 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={cn(
                "w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer",
                "hover:bg-blue-50 hover:scale-[1.02] hover:shadow-sm",
                "focus:outline-none",
                locale === lang.code
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:text-blue-700"
              )}
            >
              <div className="mr-3 flex-shrink-0 w-4 h-4 flex items-center justify-center">
                {locale === lang.code && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <span className="flex-1 text-left">{lang.nativeName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

