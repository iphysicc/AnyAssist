"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiMic, FiMicOff, FiVolume2, FiVolumeX, FiMessageSquare } from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';
import { speechRecognition, speechSynthesis, SpeechRecognitionResult } from '@/services/speechService';
import { generateChatResponse, ChatMessage as GeminiChatMessage } from '@/services/gemini';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useChatStore } from '@/store/useChatStore';
import { LoadingIndicator } from '@/components/LoadingIndicator';

export default function VoiceAssistant() {
  const router = useRouter();
  const { apiKey, modelName } = useSettingsStore();
  const { addMessage, activeChatId } = useChatStore();
  
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isSynthesisSupported, setIsSynthesisSupported] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [isWelcomeMessagePlayed, setIsWelcomeMessagePlayed] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const welcomeMessage = "Merhaba! Ben sesli asistanınızım. Size nasıl yardımcı olabilirim?";

  // Tarayıcı desteğini kontrol et
  useEffect(() => {
    setIsSpeechSupported(speechRecognition.isSupported());
    setIsSynthesisSupported(speechSynthesis.isSupported());
  }, []);

  // Hoş geldin mesajını oynat
  useEffect(() => {
    if (isSynthesisSupported && !isWelcomeMessagePlayed) {
      setIsWelcomeMessagePlayed(true);
      setMessages(prev => [...prev, { role: 'assistant', content: welcomeMessage }]);
      
      // Kısa bir gecikme ile hoş geldin mesajını seslendir
      setTimeout(() => {
        speakText(welcomeMessage);
      }, 1000);
    }
  }, [isSynthesisSupported, isWelcomeMessagePlayed]);

  // Mesajlar değiştiğinde en alta kaydır
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Konuşma tanıma sonuçlarını işle
  const handleSpeechResult = (result: SpeechRecognitionResult) => {
    if (result.isFinal) {
      setTranscript(result.text);
      setInterimTranscript('');
      
      // Eğer konuşma bitmiş ve bir şeyler söylenmişse, yanıt oluştur
      if (result.text.trim()) {
        handleUserInput(result.text);
      }
    } else {
      setInterimTranscript(result.text);
    }
  };

  // Kullanıcı girdisini işle
  const handleUserInput = async (text: string) => {
    if (isProcessing) return;
    
    // Kullanıcı mesajını ekle
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    
    // İşleme başla
    setIsProcessing(true);
    setError(null);
    
    try {
      // Dinlemeyi durdur
      if (isListening) {
        speechRecognition.stop();
        setIsListening(false);
      }
      
      // Gemini API'ye istek gönder
      const geminiMessages: GeminiChatMessage[] = [
        ...messages.map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: text }
      ];
      
      const { text: responseText } = await generateChatResponse(geminiMessages, false);
      
      // Yanıtı ekle
      setResponse(responseText);
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
      
      // Aktif sohbete mesajları ekle
      if (activeChatId) {
        addMessage(activeChatId, { role: 'user', content: text });
        addMessage(activeChatId, { role: 'assistant', content: responseText });
      }
      
      // Yanıtı seslendir
      speakText(responseText);
    } catch (err) {
      console.error('Yanıt oluşturma hatası:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Yanıt oluşturulurken bir hata oluştu.';
      
      setError(errorMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
      
      // Hata mesajını seslendir
      speakText('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsProcessing(false);
      
      // Yanıt verildikten sonra tekrar dinlemeye başla
      setTimeout(() => {
        if (!isListening && !isSpeaking) {
          startListening();
        }
      }, 1000);
    }
  };

  // Metni seslendir
  const speakText = (text: string) => {
    setIsSpeaking(true);
    speechSynthesis.speak(text, () => {
      setIsSpeaking(false);
      
      // Konuşma bittiğinde tekrar dinlemeye başla
      if (!isListening) {
        startListening();
      }
    });
  };

  // Dinlemeyi başlat
  const startListening = () => {
    if (!isSpeechSupported || isListening) return;
    
    const success = speechRecognition.start(handleSpeechResult);
    setIsListening(success);
  };

  // Dinlemeyi durdur
  const stopListening = () => {
    if (!isSpeechSupported || !isListening) return;
    
    speechRecognition.stop();
    setIsListening(false);
  };

  // Seslendirmeyi durdur
  const stopSpeaking = () => {
    if (!isSynthesisSupported || !isSpeaking) return;
    
    speechSynthesis.stop();
    setIsSpeaking(false);
  };

  // Dinleme/konuşma durumunu değiştir
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Seslendirme durumunu değiştir
  const toggleSpeaking = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
  };

  // Geri dön
  const handleBack = () => {
    // Dinleme ve konuşmayı durdur
    stopListening();
    stopSpeaking();
    
    // Ana sayfaya dön
    router.push('/');
  };

  // Sohbet sayfasına git
  const goToChat = () => {
    // Dinleme ve konuşmayı durdur
    stopListening();
    stopSpeaking();
    
    // Sohbet sayfasına git
    router.push('/');
  };

  // Bileşen kaldırıldığında dinleme ve konuşmayı durdur
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

  if (!isSpeechSupported || !isSynthesisSupported) {
    return (
      <div className="h-full flex flex-col bg-[var(--background)]">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 rounded-full hover:bg-[var(--secondary-hover)] transition-colors"
              aria-label="Geri dön"
            >
              <FiArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-semibold">Sesli Asistan</h1>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 bg-[var(--chat-bg)] rounded-lg border border-[var(--border)] text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
              <FiMicOff size={32} className="text-yellow-800 dark:text-yellow-200" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Tarayıcı Desteği Bulunamadı</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Tarayıcınız Web Speech API'yi desteklemiyor. Sesli asistan özelliklerini kullanmak için Chrome, Edge veya Safari gibi modern bir tarayıcı kullanın.
            </p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
            >
              Geri Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-[var(--secondary-hover)] transition-colors"
            aria-label="Geri dön"
          >
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold">Sesli Asistan</h1>
        </div>
        
        <button
          onClick={goToChat}
          className="p-2 rounded-full hover:bg-[var(--secondary-hover)] transition-colors flex items-center gap-2"
          title="Sohbet moduna geç"
        >
          <FiMessageSquare size={18} />
          <span className="text-sm hidden sm:inline">Sohbet Modu</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--secondary)] flex items-center justify-center">
                  <RiRobot2Line size={40} className="text-[var(--primary)]" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Sesli Asistan Hazır</h2>
                <p className="text-gray-500 mb-6 max-w-md">
                  Mikrofon butonuna tıklayarak konuşmaya başlayabilirsiniz. Sesli asistan sizi dinleyecek ve yanıt verecektir.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--chat-bg)] border border-[var(--border)]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-[var(--secondary)] flex items-center justify-center">
                        <RiRobot2Line size={14} />
                      </div>
                    )}
                    <div className="text-xs font-medium">
                      {message.role === 'user' ? 'Sen' : 'AI Asistan'}
                    </div>
                  </div>
                  <p>{message.content}</p>
                </div>
              </div>
            ))
          )}
          
          {isProcessing && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-[var(--chat-bg)] border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-[var(--secondary)] flex items-center justify-center">
                    <RiRobot2Line size={14} />
                  </div>
                  <div className="text-xs font-medium">AI Asistan</div>
                </div>
                <LoadingIndicator type="thinking" />
              </div>
            </div>
          )}
          
          {interimTranscript && (
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-lg p-3 bg-[var(--secondary)] text-gray-700 dark:text-gray-200">
                <div className="text-xs font-medium mb-1">Sen (dinleniyor...)</div>
                <p className="italic">{interimTranscript}</p>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--chat-bg)] p-4 flex items-center justify-center">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleListening}
            className={`p-4 rounded-full transition-colors ${
              isListening
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
            } ${isProcessing || isSpeaking ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isProcessing || isSpeaking}
            title={isListening ? 'Dinlemeyi durdur' : 'Konuşmaya başla'}
          >
            {isListening ? <FiMicOff size={24} /> : <FiMic size={24} />}
          </button>
          
          {isSpeaking && (
            <button
              onClick={toggleSpeaking}
              className="p-4 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              title="Konuşmayı durdur"
            >
              <FiVolumeX size={24} />
            </button>
          )}
          
          {isListening && (
            <div className="text-sm text-gray-500 animate-pulse">
              Sizi dinliyorum...
            </div>
          )}
          
          {isSpeaking && (
            <div className="text-sm text-gray-500 animate-pulse">
              Konuşuyorum...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
