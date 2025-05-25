"use client";
import { useState, useEffect, useCallback } from 'react';
import { FiMic, FiMicOff, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { speechRecognition, speechSynthesis, SpeechRecognitionResult } from '@/services/speechService';
import { useSettingsStore } from '@/store/useSettingsStore';

interface VoiceControlProps {
  onSpeechResult: (text: string) => void;
  onSpeakText: (text: string) => void;
  disabled?: boolean;
}

export const VoiceControl: React.FC<VoiceControlProps> = ({
  onSpeechResult,
  onSpeakText,
  disabled = false
}) => {
  const { useSpeechRecognition, useSpeechSynthesis } = useSettingsStore();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isSynthesisSupported, setIsSynthesisSupported] = useState(false);
  const [interimText, setInterimText] = useState('');

  // Tarayıcı desteğini kontrol et
  useEffect(() => {
    setIsSpeechSupported(speechRecognition.isSupported());
    setIsSynthesisSupported(speechSynthesis.isSupported());
  }, []);

  // Konuşma tanıma sonuçlarını işle
  const handleSpeechResult = useCallback((result: SpeechRecognitionResult) => {
    if (result.isFinal) {
      onSpeechResult(result.text);
      setInterimText('');
    } else {
      setInterimText(result.text);
    }
  }, [onSpeechResult]);

  // Mikrofonu aç/kapa
  const toggleListening = () => {
    if (disabled) return;

    if (isListening) {
      speechRecognition.stop();
      setIsListening(false);
      setInterimText('');
    } else {
      const success = speechRecognition.start(handleSpeechResult);
      setIsListening(success);
    }
  };

  // Metni seslendir
  const speakText = (text: string) => {
    if (disabled || !text) return;

    setIsSpeaking(true);
    speechSynthesis.speak(text, () => {
      setIsSpeaking(false);
    });

    // Callback'i çağır
    onSpeakText(text);
  };

  // Seslendirmeyi durdur
  const stopSpeaking = () => {
    speechSynthesis.stop();
    setIsSpeaking(false);
  };

  // Bileşen kaldırıldığında dinlemeyi durdur
  useEffect(() => {
    return () => {
      if (isListening) {
        speechRecognition.stop();
      }
      if (isSpeaking) {
        speechSynthesis.stop();
      }
    };
  }, [isListening, isSpeaking]);

  // Eğer tarayıcı desteklemiyor veya ayarlardan kapatılmışsa gösterme
  if ((!isSpeechSupported && !isSynthesisSupported) ||
      (!useSpeechRecognition && !useSpeechSynthesis)) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {isSpeechSupported && useSpeechRecognition && (
        <button
          onClick={toggleListening}
          disabled={disabled}
          className={`p-2 rounded-full transition-colors ${
            isListening
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-[var(--secondary)] hover:bg-[var(--secondary-hover)]'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isListening ? 'Dinlemeyi durdur' : 'Sesli komut ver'}
          aria-label={isListening ? 'Dinlemeyi durdur' : 'Sesli komut ver'}
        >
          {isListening ? <FiMicOff size={18} /> : <FiMic size={18} />}
        </button>
      )}

      {isSynthesisSupported && useSpeechSynthesis && (
        <button
          onClick={isSpeaking ? stopSpeaking : () => speakText('Son mesajı seslendir')}
          disabled={disabled}
          className={`p-2 rounded-full transition-colors ${
            isSpeaking
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-[var(--secondary)] hover:bg-[var(--secondary-hover)]'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isSpeaking ? 'Seslendirmeyi durdur' : 'Son mesajı seslendir'}
          aria-label={isSpeaking ? 'Seslendirmeyi durdur' : 'Son mesajı seslendir'}
        >
          {isSpeaking ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
        </button>
      )}

      {interimText && (
        <div className="px-3 py-1 rounded-full bg-[var(--secondary)] text-xs animate-pulse">
          {interimText}
        </div>
      )}
    </div>
  );
};
