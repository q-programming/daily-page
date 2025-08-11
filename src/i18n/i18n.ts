import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslations from './locales/en.json';
import plTranslations from './locales/pl.json';

// Configure i18next
i18n.use(LanguageDetector) // Detects user language
    .use(initReactI18next) // Passes i18n down to react-i18next
    .init({
        resources: {
            en: {
                translation: enTranslations,
            },
            pl: {
                translation: plTranslations,
            },
        },
        fallbackLng: 'pl', // Use English as fallback
        interpolation: {
            escapeValue: false, // React already escapes values
        },
        detection: {
            order: ['navigator', 'localStorage', 'htmlTag'],
            caches: ['localStorage'],
        },
    });

export default i18n;
