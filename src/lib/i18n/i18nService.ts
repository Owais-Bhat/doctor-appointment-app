/**
 * Internationalization Service (i18n)
 * Handles translation, language management, and multi-language support
 */

import enTranslations from './translations/en.json';
import esTranslations from './translations/es.json';

type Language = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'pt' | 'ja' | 'ko' | 'ru' | 'ar' | 'he';

interface TranslationSet {
  [key: string]: any;
}

interface LanguageConfig {
  code: Language;
  name: string;
  nativeName: string;
  rtl: boolean;
  flagEmoji: string;
}

const translations: Record<Language, TranslationSet> = {
  en: enTranslations,
  es: esTranslations,
  fr: {},
  de: {},
  zh: {},
  pt: {},
  ja: {},
  ko: {},
  ru: {},
  ar: {},
  he: {},
};

const languages: Record<Language, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    rtl: false,
    flagEmoji: '🇺🇸',
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    rtl: false,
    flagEmoji: '🇪🇸',
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    rtl: false,
    flagEmoji: '🇫🇷',
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    rtl: false,
    flagEmoji: '🇩🇪',
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    rtl: false,
    flagEmoji: '🇨🇳',
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    rtl: false,
    flagEmoji: '🇧🇷',
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    rtl: false,
    flagEmoji: '🇯🇵',
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    rtl: false,
    flagEmoji: '🇰🇷',
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    rtl: false,
    flagEmoji: '🇷🇺',
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    rtl: true,
    flagEmoji: '🇸🇦',
  },
  he: {
    code: 'he',
    name: 'Hebrew',
    nativeName: 'עברית',
    rtl: true,
    flagEmoji: '🇮🇱',
  },
};

export class I18nService {
  private static currentLanguage: Language = 'en';
  private static languageChangeListeners: ((language: Language) => void)[] = [];

  static initialize(language?: Language): void {
    if (language && languages[language]) {
      this.currentLanguage = language;
    } else if (typeof window !== 'undefined') {
      const browserLanguage = this.detectBrowserLanguage();
      if (browserLanguage) {
        this.currentLanguage = browserLanguage;
      }
    }
  }

  static setLanguage(language: Language): void {
    if (languages[language]) {
      this.currentLanguage = language;
      this.notifyListeners();
      this.saveToBrowser();
    }
  }

  static getLanguage(): Language {
    return this.currentLanguage;
  }

  static getLanguageConfig(language?: Language): LanguageConfig {
    const lang = language || this.currentLanguage;
    return languages[lang];
  }

  static translate(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.');
    let value: any = translations[this.currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if translation not found
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if not found
          }
        }
        break;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(`{${paramKey}}`, String(paramValue));
      });
    }

    return value;
  }

  static t(key: string, params?: Record<string, string | number>): string {
    return this.translate(key, params);
  }

  static getSupportedLanguages(): LanguageConfig[] {
    return Object.values(languages);
  }

  static getAvailableLanguages(): Language[] {
    return Object.keys(languages) as Language[];
  }

  static isRTL(language?: Language): boolean {
    const lang = language || this.currentLanguage;
    return languages[lang].rtl;
  }

  static getDirection(language?: Language): 'ltr' | 'rtl' {
    return this.isRTL(language) ? 'rtl' : 'ltr';
  }

  static addLanguageChangeListener(callback: (language: Language) => void): void {
    this.languageChangeListeners.push(callback);
  }

  static removeLanguageChangeListener(callback: (language: Language) => void): void {
    this.languageChangeListeners = this.languageChangeListeners.filter((listener) => listener !== callback);
  }

  private static notifyListeners(): void {
    this.languageChangeListeners.forEach((callback) => {
      callback(this.currentLanguage);
    });
  }

  static saveToBrowser(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-language', this.currentLanguage);
    }
  }

  static loadFromBrowser(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('preferred-language');
      if (saved && languages[saved as Language]) {
        this.currentLanguage = saved as Language;
      }
    }
  }

  private static detectBrowserLanguage(): Language | null {
    if (typeof navigator === 'undefined') {
      return null;
    }

    const browserLang = navigator.language || 'en';
    const langCode = browserLang.split('-')[0] as Language;

    if (languages[langCode]) {
      return langCode;
    }

    return null;
  }

  static getLanguageName(language: Language): string {
    return languages[language].name;
  }

  static getNativeLanguageName(language: Language): string {
    return languages[language].nativeName;
  }

  static getLanguageFlag(language: Language): string {
    return languages[language].flagEmoji;
  }

  static pluralize(
    key: string,
    count: number,
    params?: Record<string, string | number>
  ): string {
    const pluralKey = count === 1 ? `${key}_singular` : `${key}_plural`;
    return this.translate(pluralKey, { count, ...params });
  }

  static getLanguageByRegion(region: string): Language {
    const regionMap: Record<string, Language> = {
      US: 'en',
      GB: 'en',
      ES: 'es',
      MX: 'es',
      FR: 'fr',
      DE: 'de',
      CN: 'zh',
      BR: 'pt',
      JP: 'ja',
      KR: 'ko',
      RU: 'ru',
      SA: 'ar',
      IL: 'he',
    };

    return regionMap[region.toUpperCase()] || 'en';
  }
}
