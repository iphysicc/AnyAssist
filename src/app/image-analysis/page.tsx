"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiSend } from 'react-icons/fi';
import { ImageUploader } from '@/components/ImageUploader';
import { analyzeImage, getAvailableModels, GeminiModel } from '@/services/gemini';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function ImageAnalysis() {
  const router = useRouter();
  const { apiKey } = useSettingsStore();
  const [imageData, setImageData] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<GeminiModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-1.5-pro');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  // Modelleri yükle
  useEffect(() => {
    const loadModels = async () => {
      if (!apiKey) return;

      setIsLoadingModels(true);
      try {
        const models = await getAvailableModels(apiKey);

        // Sadece görsel analizi destekleyen modelleri filtrele
        const visionModels = models.filter(model =>
          model.name.includes('gemini-1.5') ||
          model.name.includes('vision') ||
          model.name.includes('gemini-pro-vision')
        );

        setAvailableModels(visionModels.length > 0 ? visionModels : [
          { name: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro' },
          { name: 'gemini-1.5-flash', displayName: 'Gemini 1.5 Flash' },
          { name: 'gemini-pro-vision', displayName: 'Gemini Pro Vision' }
        ]);
      } catch (error) {
        console.error('Modeller yüklenirken hata oluştu:', error);
        setAvailableModels([
          { name: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro' },
          { name: 'gemini-1.5-flash', displayName: 'Gemini 1.5 Flash' },
          { name: 'gemini-pro-vision', displayName: 'Gemini Pro Vision' }
        ]);
      } finally {
        setIsLoadingModels(false);
      }
    };

    loadModels();
  }, [apiKey]);

  const handleBack = () => {
    router.push('/');
  };

  const handleImageSelect = (data: string) => {
    setImageData(data);
    setResult(null);
    setError(null);

    // Resim yüklendiğinde prompt input'una odaklan
    setTimeout(() => {
      promptInputRef.current?.focus();
    }, 100);
  };

  const handleClearImage = () => {
    setImageData(null);
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!imageData) {
      setError('Lütfen önce bir resim yükleyin.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const analysisResult = await analyzeImage(
        imageData,
        prompt || 'Bu resmi detaylı olarak analiz et ve açıkla. Resimde ne görüyorsun?',
        selectedModel
      );
      setResult(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Görsel analiz sırasında bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze();
    }
  };

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
          <h1 className="text-2xl font-semibold">Görsel Analiz</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h2 className="text-xl font-medium mb-2">Resim Yükle</h2>
            <p className="text-gray-500 mb-4">
              Analiz edilecek bir resim yükleyin. Gemini AI resmi analiz edecek ve açıklayacaktır.
            </p>

            <ImageUploader
              onImageSelect={handleImageSelect}
              onClear={handleClearImage}
              isLoading={isLoading}
            />
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-medium mb-2">Model Seçimi</h2>
            <p className="text-gray-500 mb-4">
              Görsel analiz için kullanılacak modeli seçin. Farklı modeller farklı yeteneklere ve kota sınırlarına sahiptir.
            </p>

            <div className="relative">
              {isLoadingModels ? (
                <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--chat-bg)] flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin"></div>
                  <span className="text-sm">Modeller yükleniyor...</span>
                </div>
              ) : (
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--chat-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  disabled={isLoading}
                >
                  {availableModels.map((model) => (
                    <option key={model.name} value={model.name}>
                      {model.displayName}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {imageData && (
            <div className="mb-6">
              <h2 className="text-xl font-medium mb-2">Soru veya Yönerge (Opsiyonel)</h2>
              <p className="text-gray-500 mb-4">
                Resim hakkında spesifik bir soru sorabilir veya analiz için yönerge verebilirsiniz.
              </p>

              <div className="relative">
                <textarea
                  ref={promptInputRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Örn: Bu resimde ne var? Veya: Bu resmi detaylı olarak analiz et."
                  className="w-full p-3 pr-12 rounded-lg border border-[var(--border)] bg-[var(--chat-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                  rows={3}
                  disabled={isLoading}
                />
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="absolute right-2 bottom-2 p-2 rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Analiz et"
                >
                  <FiSend size={18} />
                </button>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="my-6">
              <LoadingIndicator type="thinking" message="Görsel analiz yapılıyor..." />
            </div>
          )}

          {error && (
            <div className="my-6 p-4 rounded-lg bg-red-100 text-red-700 border border-red-200">
              <p className="font-medium">Hata</p>
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="my-6">
              <h2 className="text-xl font-medium mb-2">Analiz Sonucu</h2>
              <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--chat-bg)]">
                <div className="prose prose-sm max-w-none">
                  {result.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
