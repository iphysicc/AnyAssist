import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  apiKey: string;
  theme: 'light' | 'dark' | 'system';
  modelName: string;
  useFullContext: boolean;
  useWebSearch: boolean;
  searchApiKey: string;
  searchEngineId: string;
  useSpeechRecognition: boolean;
  useSpeechSynthesis: boolean;
  setApiKey: (apiKey: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setModelName: (modelName: string) => void;
  setUseFullContext: (useFullContext: boolean) => void;
  setUseWebSearch: (useWebSearch: boolean) => void;
  setSearchApiKey: (searchApiKey: string) => void;
  setSearchEngineId: (searchEngineId: string) => void;
  setUseSpeechRecognition: (useSpeechRecognition: boolean) => void;
  setUseSpeechSynthesis: (useSpeechSynthesis: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      theme: 'system',
      modelName: 'gemini-1.5-pro',
      useFullContext: true,
      useWebSearch: true,
      searchApiKey: '',
      searchEngineId: '',
      useSpeechRecognition: true,
      useSpeechSynthesis: true,
      setApiKey: (apiKey: string) => set({ apiKey }),
      setTheme: (theme: 'light' | 'dark' | 'system') => set({ theme }),
      setModelName: (modelName: string) => set({ modelName }),
      setUseFullContext: (useFullContext: boolean) => set({ useFullContext }),
      setUseWebSearch: (useWebSearch: boolean) => set({ useWebSearch }),
      setSearchApiKey: (searchApiKey: string) => set({ searchApiKey }),
      setSearchEngineId: (searchEngineId: string) => set({ searchEngineId }),
      setUseSpeechRecognition: (useSpeechRecognition: boolean) => set({ useSpeechRecognition }),
      setUseSpeechSynthesis: (useSpeechSynthesis: boolean) => set({ useSpeechSynthesis }),
    }),
    {
      name: 'anyassist-settings',
    }
  )
);
