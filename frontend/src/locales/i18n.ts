import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
// utils
import { localStorageAvailable, localStorageGetItem } from 'src/utils/storage-available';
//
import { defaultLang, allLangs } from './config-lang';
//
import translationRu from './langs/ru.json';
import translationUz from './langs/uz.json';

// ----------------------------------------------------------------------

const supportedLngs = allLangs.map((l) => l.value);
const stored = localStorageGetItem('i18nextLng', defaultLang.value) || defaultLang.value;
const lng: string = supportedLngs.includes(stored) ? stored : defaultLang.value;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translations: translationRu },
      uz: { translations: translationUz },
    },
    lng,
    fallbackLng: defaultLang.value,
    supportedLngs,
    debug: false,
    ns: ['translations'],
    defaultNS: 'translations',
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on('languageChanged', (nextLng) => {
  if (localStorageAvailable()) {
    localStorage.setItem('language', nextLng);
  }
});

export default i18n;
