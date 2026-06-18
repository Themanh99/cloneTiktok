import { create } from 'zustand';
import { translations, type LanguageCode } from './translations';

const STORAGE_KEY = 'app-language';

const readInitialLanguage = (): LanguageCode => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'vi' || stored === 'en') return stored;
  return navigator.language.toLowerCase().startsWith('vi') ? 'vi' : 'en';
};

interface LanguageState {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: readInitialLanguage(),
  setLanguage: (language) => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    set({ language });
  },
}));

const getNestedValue = (source: unknown, path: string): string | undefined => {
  let current = source;
  for (const key of path.split('.')) {
    if (!current || typeof current !== 'object' || !(key in current)) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' ? current : undefined;
};

export const useTranslation = () => {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const t = (key: string, values?: Record<string, string | number>) => {
    const template = getNestedValue(translations[language], key) ?? getNestedValue(translations.en, key) ?? key;
    return Object.entries(values ?? {}).reduce(
      (result, [name, value]) => result.split(`{{${name}}}`).join(String(value)),
      template,
    );
  };
  return { language, setLanguage, t };
};

export type { LanguageCode };
