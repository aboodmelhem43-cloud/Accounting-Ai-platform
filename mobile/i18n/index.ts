import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import ar from './ar';
import en from './en';

const deviceLang = getLocales()[0]?.languageCode ?? 'ar';

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: deviceLang === 'en' ? 'en' : 'ar', // default to Arabic for MENA
  fallbackLng: 'ar',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18n;
export { i18n };
