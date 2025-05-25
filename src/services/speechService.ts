"use client";

// Konuşma tanıma için arayüz
export interface SpeechRecognitionResult {
  text: string;
  isFinal: boolean;
}

// Konuşma tanıma için callback fonksiyonu tipi
export type SpeechRecognitionCallback = (result: SpeechRecognitionResult) => void;

// Konuşma tanıma sınıfı
class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private callback: SpeechRecognitionCallback | null = null;
  private lang: string = 'tr-TR';

  constructor() {
    // Web Speech API desteğini kontrol et
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.setupRecognition();
      }
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.lang;

    this.recognition.onresult = (event) => {
      if (this.callback) {
        const result = event.results[event.results.length - 1];
        const text = result[0].transcript;
        const isFinal = result.isFinal;
        this.callback({ text, isFinal });
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        // Eğer hala dinleme modundaysa, tekrar başlat
        this.recognition?.start();
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Konuşma tanıma hatası:', event.error);
      this.isListening = false;
    };
  }

  public setLanguage(lang: string) {
    this.lang = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public start(callback: SpeechRecognitionCallback) {
    if (!this.recognition) {
      console.error('Konuşma tanıma desteklenmiyor');
      return false;
    }

    if (this.isListening) {
      return true;
    }

    try {
      this.callback = callback;
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (error) {
      console.error('Konuşma tanıma başlatılamadı:', error);
      return false;
    }
  }

  public stop() {
    if (!this.recognition || !this.isListening) {
      return;
    }

    try {
      this.recognition.stop();
      this.isListening = false;
    } catch (error) {
      console.error('Konuşma tanıma durdurulamadı:', error);
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }
}

// Metin-konuşma dönüşümü için sınıf
class SpeechSynthesisService {
  private synthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private preferredVoice: SpeechSynthesisVoice | null = null;
  private lang: string = 'tr-TR';

  constructor() {
    // Web Speech API desteğini kontrol et
    if (typeof window !== 'undefined') {
      if (window.speechSynthesis) {
        this.synthesis = window.speechSynthesis;
        this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synthesis) return;

    // Bazı tarayıcılarda sesler hemen yüklenmeyebilir
    const voicesChanged = () => {
      this.voices = this.synthesis?.getVoices() || [];
      this.selectPreferredVoice();
    };

    // Sesler yüklendiyse hemen al
    if (this.synthesis.getVoices().length > 0) {
      this.voices = this.synthesis.getVoices();
      this.selectPreferredVoice();
    }

    // Sesler değiştiğinde güncelle
    this.synthesis.onvoiceschanged = voicesChanged;
  }

  private selectPreferredVoice() {
    // Tercih edilen dilde bir ses bul
    const langVoices = this.voices.filter(voice => voice.lang.startsWith(this.lang.split('-')[0]));
    
    if (langVoices.length > 0) {
      // Tercih edilen dilde bir ses varsa, ilkini kullan
      this.preferredVoice = langVoices[0];
    } else {
      // Yoksa, varsayılan sesi kullan
      this.preferredVoice = this.voices[0];
    }
  }

  public setLanguage(lang: string) {
    this.lang = lang;
    this.selectPreferredVoice();
  }

  public getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  public speak(text: string, onEnd?: () => void): boolean {
    if (!this.synthesis) {
      console.error('Metin-konuşma dönüşümü desteklenmiyor');
      return false;
    }

    // Konuşmayı durdur
    this.synthesis.cancel();

    // Yeni konuşma oluştur
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Ses ve dil ayarla
    if (this.preferredVoice) {
      utterance.voice = this.preferredVoice;
    }
    utterance.lang = this.lang;
    
    // Konuşma bittiğinde callback çağır
    if (onEnd) {
      utterance.onend = onEnd;
    }

    // Konuşmayı başlat
    this.synthesis.speak(utterance);
    return true;
  }

  public stop() {
    if (!this.synthesis) return;
    this.synthesis.cancel();
  }

  public isSupported(): boolean {
    return !!this.synthesis;
  }
}

// Singleton örnekleri
export const speechRecognition = new SpeechRecognitionService();
export const speechSynthesis = new SpeechSynthesisService();

// Web Speech API için TypeScript tanımlamaları
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
