"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'vi';
type LanguageLabels = Record<Language, string>;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  languageLabels: LanguageLabels;
}

const languageLabels: LanguageLabels = {
  en: 'English',
  vi: 'Tiếng Việt',
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Start with default language to avoid hydration mismatch
  const [language, setLanguage] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  // Only run on client-side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    const storedLanguage = localStorage.getItem('language') as Language;
    if (storedLanguage && Object.keys(languageLabels).includes(storedLanguage)) {
      setLanguage(storedLanguage);
    }
  }, []);

  // Save language preference to localStorage when it changes, but only on client-side
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('language', language);
      document.documentElement.lang = language;
    }
  }, [language, mounted]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, languageLabels }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 