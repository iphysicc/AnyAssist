"use client";
import { useState, useRef, useEffect } from 'react';
import { FiSend, FiImage, FiX } from 'react-icons/fi';
import { ImageUploader } from './ImageUploader';
import { generateImagePreAnalysis } from '@/services/gemini';

interface ChatInputProps {
  onSendMessage: (message: string, imageData?: string, imageAnalysis?: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageAnalysis, setImageAnalysis] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (message.trim() && !isLoading) {
      // Görsel varsa, görsel ve analizi ile birlikte mesajı gönder
      if (imageData && imageAnalysis) {
        onSendMessage(message, imageData, imageAnalysis);

        // Görseli ve analizi temizle
        setImageData(null);
        setImageAnalysis(null);
      } else {
        // Normal metin mesajı gönder
        onSendMessage(message);
      }

      setMessage('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Görsel yükleme işleyicisi
  const handleImageSelect = async (data: string) => {
    setImageData(data);
    setIsAnalyzingImage(true);

    try {
      // Gemini 1.5 Flash ile görselin ön analizini yap
      const analysis = await generateImagePreAnalysis(data);
      setImageAnalysis(analysis);
    } catch (error) {
      console.error('Görsel analiz hatası:', error);
      setImageAnalysis('Görsel analizi yapılamadı. Lütfen sorunuzu yazarken görseli açıklamaya çalışın.');
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  // Görsel temizleme işleyicisi
  const handleClearImage = () => {
    setImageData(null);
    setImageAnalysis(null);
  };

  // Görsel yükleme penceresini aç/kapat
  const toggleImageUploader = () => {
    setShowImageUploader(!showImageUploader);
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [message]);

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto w-full">
      {/* Görsel Yükleyici */}
      {showImageUploader && (
        <div className="mb-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] bg-opacity-50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Görsel Yükle</h3>
            <button
              type="button"
              onClick={toggleImageUploader}
              className="p-1 rounded-full hover:bg-[var(--secondary-hover)]"
              aria-label="Kapat"
            >
              <FiX size={16} />
            </button>
          </div>
          <ImageUploader
            onImageSelect={handleImageSelect}
            onClear={handleClearImage}
            isLoading={isAnalyzingImage}
          />

          {imageAnalysis && !isAnalyzingImage && (
            <div className="mt-2 p-2 rounded bg-[var(--secondary-hover)] text-xs">
              <p className="font-medium mb-1">Ön Analiz (Gemini 1.5 Flash):</p>
              <p>{imageAnalysis}</p>
            </div>
          )}

          {isAnalyzingImage && (
            <div className="mt-2 p-2 rounded bg-[var(--secondary-hover)] text-xs flex items-center gap-2">
              <div className="h-3 w-3 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin"></div>
              <span>Görsel analiz ediliyor...</span>
            </div>
          )}
        </div>
      )}

      {/* Yüklenen Görsel Önizleme */}
      {imageData && !showImageUploader && (
        <div className="mb-3 relative">
          <div className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)] bg-opacity-50">
            <div className="w-12 h-12 rounded overflow-hidden border border-[var(--border)]">
              <img src={imageData} alt="Yüklenen görsel" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 text-xs">
              <p className="font-medium">Görsel yüklendi</p>
              <p className="text-gray-500 truncate">{imageAnalysis || 'Analiz yapılıyor...'}</p>
            </div>
            <button
              type="button"
              onClick={handleClearImage}
              className="p-1 rounded-full hover:bg-[var(--secondary-hover)]"
              aria-label="Görseli kaldır"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Mesaj Giriş Alanı */}
      <div
        className={`relative flex items-end rounded-full border ${
          isFocused
            ? 'border-[var(--primary)] shadow-md'
            : 'border-[var(--border)]'
        } bg-[var(--secondary)] transition-all duration-200`}
      >
        {/* Görsel Yükleme Butonu */}
        <button
          type="button"
          onClick={toggleImageUploader}
          disabled={isLoading}
          className="p-2 ml-1 text-gray-500 hover:text-[var(--primary)] transition-colors"
          aria-label="Görsel yükle"
        >
          <FiImage size={18} />
        </button>

        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={imageData ? "Görsel hakkında bir soru sor veya yorum yap..." : "Herhangi bir şey sor..."}
          className="flex-1 max-h-40 py-3 px-2 pr-14 bg-transparent resize-none outline-none rounded-full text-sm"
          rows={1}
          disabled={isLoading}
        />

        <div className="absolute right-1.5 bottom-1.5">
          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            className={`p-2 rounded-full ${
              message.trim() && !isLoading
                ? 'bg-[var(--message-user-bg)] text-white'
                : 'bg-[var(--secondary-hover)] text-gray-400'
            } transition-colors`}
            aria-label="Mesaj gönder"
          >
            <FiSend size={16} />
          </button>
        </div>
      </div>
    </form>
  );
};
