/**
 * Localization Service
 * Handles date, time, number, currency, and locale-specific formatting
 */

type Locale = 'en-US' | 'es-ES' | 'fr-FR' | 'de-DE' | 'zh-CN' | 'pt-BR' | 'ja-JP' | 'ko-KR' | 'ru-RU' | 'ar-SA' | 'he-IL';

interface LocaleConfig {
  dateFormat: string;
  timeFormat: string;
  dateTimeFormat: string;
  numberFormat: Intl.NumberFormatOptions;
  currencyFormat: Intl.NumberFormatOptions;
  timezone: string;
}

const localeConfigs: Record<Locale, LocaleConfig> = {
  'en-US': {
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'h:mm A',
    dateTimeFormat: 'MM/DD/YYYY h:mm A',
    numberFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    currencyFormat: { style: 'currency', currency: 'USD' },
    timezone: 'America/New_York',
  },
  'es-ES': {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'DD/MM/YYYY HH:mm',
    numberFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    currencyFormat: { style: 'currency', currency: 'EUR' },
    timezone: 'Europe/Madrid',
  },
  'fr-FR': {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'DD/MM/YYYY HH:mm',
    numberFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    currencyFormat: { style: 'currency', currency: 'EUR' },
    timezone: 'Europe/Paris',
  },
  'de-DE': {
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'DD.MM.YYYY HH:mm',
    numberFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    currencyFormat: { style: 'currency', currency: 'EUR' },
    timezone: 'Europe/Berlin',
  },
  'zh-CN': {
    dateFormat: 'YYYY年MM月DD日',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'YYYY年MM月DD日 HH:mm',
    numberFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    currencyFormat: { style: 'currency', currency: 'CNY' },
    timezone: 'Asia/Shanghai',
  },
  'pt-BR': {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'DD/MM/YYYY HH:mm',
    numberFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    currencyFormat: { style: 'currency', currency: 'BRL' },
    timezone: 'America/Sao_Paulo',
  },
  'ja-JP': {
    dateFormat: 'YYYY年MM月DD日',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'YYYY年MM月DD日 HH:mm',
    numberFormat: { minimumFractionDigits: 0, maximumFractionDigits: 0 },
    currencyFormat: { style: 'currency', currency: 'JPY' },
    timezone: 'Asia/Tokyo',
  },
  'ko-KR': {
    dateFormat: 'YYYY.MM.DD',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'YYYY.MM.DD HH:mm',
    numberFormat: { minimumFractionDigits: 0, maximumFractionDigits: 0 },
    currencyFormat: { style: 'currency', currency: 'KRW' },
    timezone: 'Asia/Seoul',
  },
  'ru-RU': {
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'DD.MM.YYYY HH:mm',
    numberFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    currencyFormat: { style: 'currency', currency: 'RUB' },
    timezone: 'Europe/Moscow',
  },
  'ar-SA': {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'DD/MM/YYYY HH:mm',
    numberFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    currencyFormat: { style: 'currency', currency: 'SAR' },
    timezone: 'Asia/Riyadh',
  },
  'he-IL': {
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'DD.MM.YYYY HH:mm',
    numberFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    currencyFormat: { style: 'currency', currency: 'ILS' },
    timezone: 'Asia/Jerusalem',
  },
};

const rtlLanguages = ['ar', 'he', 'fa', 'ur'];

export class LocalizationService {
  static formatDate(date: Date, locale: Locale = 'en-US'): string {
    return new Intl.DateTimeFormat(locale).format(date);
  }

  static formatTime(date: Date, locale: Locale = 'en-US'): string {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: locale.startsWith('en'),
    }).format(date);
  }

  static formatDateTime(date: Date, locale: Locale = 'en-US'): string {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: locale.startsWith('en'),
    }).format(date);
  }

  static formatNumber(value: number, locale: Locale = 'en-US'): string {
    const config = localeConfigs[locale];
    return new Intl.NumberFormat(locale, config.numberFormat).format(value);
  }

  static formatCurrency(value: number, locale: Locale = 'en-US'): string {
    const config = localeConfigs[locale];
    return new Intl.NumberFormat(locale, config.currencyFormat).format(value);
  }

  static formatAddress(
    street: string,
    city: string,
    state: string,
    zip: string,
    country: string,
    locale: Locale = 'en-US'
  ): string {
    // US format: Street, City, State ZIP
    if (locale.startsWith('en-US')) {
      return `${street}, ${city}, ${state} ${zip}, ${country}`;
    }

    // European format: Street, ZIP City, Country
    if (['es-ES', 'fr-FR', 'de-DE'].includes(locale)) {
      return `${street}, ${zip} ${city}, ${country}`;
    }

    // Asian format: Country, State/Province, City, Street, ZIP
    if (['zh-CN', 'ja-JP', 'ko-KR'].includes(locale)) {
      return `${country}, ${state}, ${city}, ${street} ${zip}`;
    }

    return `${street}, ${city}, ${state} ${zip}, ${country}`;
  }

  static formatPhoneNumber(phone: string, locale: Locale = 'en-US'): string {
    const countryCode: Record<string, string> = {
      'en-US': '+1',
      'es-ES': '+34',
      'fr-FR': '+33',
      'de-DE': '+49',
      'zh-CN': '+86',
      'pt-BR': '+55',
      'ja-JP': '+81',
      'ko-KR': '+82',
      'ru-RU': '+7',
      'ar-SA': '+966',
      'he-IL': '+972',
    };

    const cleaned = phone.replace(/\D/g, '');

    if (locale === 'en-US') {
      // Format as (XXX) XXX-XXXX
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      }
    }

    return countryCode[locale] + cleaned;
  }

  static isRTL(language: string): boolean {
    return rtlLanguages.includes(language.split('-')[0].toLowerCase());
  }

  static getTimezone(locale: Locale = 'en-US'): string {
    return localeConfigs[locale].timezone;
  }

  static getConfig(locale: Locale = 'en-US'): LocaleConfig {
    return localeConfigs[locale];
  }

  static getSupportedLocales(): Locale[] {
    return Object.keys(localeConfigs) as Locale[];
  }

  static detectLocale(): Locale {
    if (typeof navigator === 'undefined') {
      return 'en-US';
    }

    const browserLocale = navigator.language || 'en-US';
    const supportedLocales = Object.keys(localeConfigs);

    // Try exact match first
    if (supportedLocales.includes(browserLocale as Locale)) {
      return browserLocale as Locale;
    }

    // Try language code match
    const languageCode = browserLocale.split('-')[0];
    const found = supportedLocales.find((locale) => locale.startsWith(languageCode));

    return (found as Locale) || 'en-US';
  }

  static parseDate(dateString: string, locale: Locale = 'en-US'): Date | null {
    // Simple parsing - in production, use a library like date-fns
    try {
      return new Date(dateString);
    } catch {
      return null;
    }
  }

  static getRelativeTime(date: Date, locale: Locale = 'en-US'): string {
    const rtf = new Intl.RelativeTimeFormat(locale);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffSecs = Math.round(diffMs / 1000);
    const diffMins = Math.round(diffSecs / 60);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);

    if (Math.abs(diffSecs) < 60) {
      return rtf.format(diffSecs, 'second');
    } else if (Math.abs(diffMins) < 60) {
      return rtf.format(diffMins, 'minute');
    } else if (Math.abs(diffHours) < 24) {
      return rtf.format(diffHours, 'hour');
    } else {
      return rtf.format(diffDays, 'day');
    }
  }
}
