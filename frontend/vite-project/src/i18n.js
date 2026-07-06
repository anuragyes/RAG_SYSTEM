import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Simple translations (We can add more languages and translation keys later)
const resources = {
  en: {
    translation: {
      "AI Eligibility Chat": "AI Eligibility Chat",
      "Hide Profile": "Hide Profile",
      "Set Profile": "Set Profile",
      "Describe your situation...": "Describe your situation... (e.g. I am a farmer in UP)",
      "Speak": "Speak",
      "Stop": "Stop",
      "Upload Document": "Upload Document",
      "Extracting...": "Extracting..."
    }
  },
  hi: {
    translation: {
      "AI Eligibility Chat": "एआई पात्रता चैट (AI Eligibility Chat)",
      "Hide Profile": "प्रोफ़ाइल छिपाएं",
      "Set Profile": "प्रोफ़ाइल सेट करें",
      "Describe your situation...": "अपनी स्थिति का वर्णन करें... (उदा. मैं यूपी में एक किसान हूँ)",
      "Speak": "बोलें",
      "Stop": "रुकें",
      "Upload Document": "दस्तावेज़ अपलोड करें",
      "Extracting...": "निकाल रहा है..."
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
