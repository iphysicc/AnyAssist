"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiSave, FiMoon, FiSun, FiMonitor, FiLoader, FiMic, FiVolume2, FiDownload, FiRefreshCw } from 'react-icons/fi';
import { useSettingsStore } from '@/store/useSettingsStore';
import { GeminiModel, getAvailableModels } from '@/services/gemini';
import { speechRecognition, speechSynthesis } from '@/services/speechService';
import { useUpdater } from '@/hooks/useUpdater';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import UpdateNotification from '@/components/UpdateNotification';
import UpdateCheckAnimation from '@/components/UpdateCheckAnimation';

export default function Settings() {
  const router = useRouter();
  const {
    apiKey, theme, modelName, useFullContext, useWebSearch, searchApiKey, searchEngineId,
    useSpeechRecognition, useSpeechSynthesis,
    setApiKey, setTheme, setModelName, setUseFullContext, setUseWebSearch, setSearchApiKey, setSearchEngineId,
    setUseSpeechRecognition, setUseSpeechSynthesis
  } = useSettingsStore();

  const [localApiKey, setLocalApiKey] = useState('');
  const [localTheme, setLocalTheme] = useState<'light' | 'dark' | 'system'>(theme);
  const [localModelName, setLocalModelName] = useState(modelName);
  const [localUseFullContext, setLocalUseFullContext] = useState(useFullContext);
  const [localUseWebSearch, setLocalUseWebSearch] = useState(useWebSearch);
  const [localSearchApiKey, setLocalSearchApiKey] = useState(searchApiKey);
  const [localSearchEngineId, setLocalSearchEngineId] = useState(searchEngineId);
  const [localUseSpeechRecognition, setLocalUseSpeechRecognition] = useState(useSpeechRecognition);
  const [localUseSpeechSynthesis, setLocalUseSpeechSynthesis] = useState(useSpeechSynthesis);
  const [isSaved, setIsSaved] = useState(false);
  const [availableModels, setAvailableModels] = useState<GeminiModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isSynthesisSupported, setIsSynthesisSupported] = useState(false);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [updateCheckStatus, setUpdateCheckStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [updateCheckMessage, setUpdateCheckMessage] = useState<string>('');

  // Güncelleme hook'unu kullan
  const {
    isCheckingForUpdate,
    updateAvailable,
    updateInfo,
    error: updateError,
    checkForUpdates
  } = useUpdater(false);

  useEffect(() => {
    setLocalApiKey(apiKey);
    setLocalTheme(theme);
    setLocalModelName(modelName);
    setLocalUseFullContext(useFullContext);
    setLocalUseWebSearch(useWebSearch);
    setLocalSearchApiKey(searchApiKey);
    setLocalSearchEngineId(searchEngineId);
    setLocalUseSpeechRecognition(useSpeechRecognition);
    setLocalUseSpeechSynthesis(useSpeechSynthesis);
  }, [apiKey, theme, modelName, useFullContext, useWebSearch, searchApiKey, searchEngineId, useSpeechRecognition, useSpeechSynthesis]);

  // Tarayıcı desteğini kontrol et
  useEffect(() => {
    setIsSpeechSupported(speechRecognition.isSupported());
    setIsSynthesisSupported(speechSynthesis.isSupported());
  }, []);

  // Güncelleme bilgisi değiştiğinde bildirim göster
  useEffect(() => {
    if (updateAvailable && updateInfo) {
      setShowUpdateNotification(true);
    }
  }, [updateAvailable, updateInfo]);

  // Update the checkForUpdates function to handle animation and use the new hook result
  const handleCheckForUpdates = async () => {
    if (isCheckingForUpdate) return;
    
    setUpdateCheckStatus('checking');
    
    try {
      const result = await checkForUpdates();
      
      // Small delay to ensure the animation is visible
      setTimeout(() => {
        if (result.success) {
          setUpdateCheckStatus('success');
          setUpdateCheckMessage(result.message);
        } else {
          setUpdateCheckStatus('error');
          setUpdateCheckMessage(result.message);
        }
        
        // Reset status after showing message
        setTimeout(() => {
          setUpdateCheckStatus('idle');
        }, 2000);
      }, 1000);
    } catch (error) {
      setUpdateCheckStatus('error');
      setUpdateCheckMessage('Güncelleme kontrolü sırasında beklenmeyen bir hata oluştu.');
      
      // Reset status after showing error message
      setTimeout(() => {
        setUpdateCheckStatus('idle');
      }, 3000);
    }
  };

  // Varsayılan modeller
  const defaultModels = [
    { name: 'gemini-2.0-pro', displayName: 'Gemini 2.0 Pro' },
    { name: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash' },
    { name: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro' },
    { name: 'gemini-1.5-flash', displayName: 'Gemini 1.5 Flash' },
    { name: 'gemini-1.0-pro', displayName: 'Gemini 1.0 Pro' },
    { name: 'gemini-pro', displayName: 'Gemini Pro' },
  ];

  // Sayfa yüklendiğinde API anahtarı varsa modelleri yükle
  useEffect(() => {
    const loadInitialModels = async () => {
      if (apiKey) {
        setIsLoadingModels(true);
        try {
          const models = await getAvailableModels(apiKey);
          setAvailableModels(models);
        } catch (error) {
          console.error('Başlangıç modelleri yüklenirken hata oluştu:', error);
          setAvailableModels(defaultModels);
        } finally {
          setIsLoadingModels(false);
        }
      } else {
        setAvailableModels(defaultModels);
      }
    };

    loadInitialModels();
  }, [apiKey]);

  // API anahtarı değiştiğinde modelleri yükle
  useEffect(() => {
    let isMounted = true;

    // API anahtarı yoksa, sadece varsayılan modelleri göster
    if (!localApiKey) {
      setAvailableModels(defaultModels);
      return () => { isMounted = false; };
    }

    const loadModels = async () => {
      setIsLoadingModels(true);
      try {
        // API'den modelleri al
        const models = await getAvailableModels(localApiKey);

        if (isMounted) {
          setAvailableModels(models);

          // Eğer seçili model listede yoksa, ilk modeli seç
          if (!models.some(model => model.name === localModelName)) {
            setLocalModelName(models[0].name);
          }
        }
      } catch (error) {
        console.error('Modeller yüklenirken hata oluştu:', error);

        // Hata durumunda varsayılan modelleri göster
        if (isMounted) {
          setAvailableModels(defaultModels);
        }
      } finally {
        if (isMounted) {
          setIsLoadingModels(false);
        }
      }
    };

    // API anahtarı değiştiğinde modelleri yükle
    const timer = setTimeout(() => {
      loadModels();
    }, 500); // Kullanıcı yazarken her seferinde istek atmamak için gecikme ekledik

    // Cleanup fonksiyonu
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [localApiKey, localModelName]);

  const handleSave = () => {
    setApiKey(localApiKey);
    setTheme(localTheme);
    setModelName(localModelName);
    setUseFullContext(localUseFullContext);
    setUseWebSearch(localUseWebSearch);
    setSearchApiKey(localSearchApiKey);
    setSearchEngineId(localSearchEngineId);
    setUseSpeechRecognition(localUseSpeechRecognition);
    setUseSpeechSynthesis(localUseSpeechSynthesis);
    setIsSaved(true);

    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {showUpdateNotification && updateInfo && (
        <UpdateNotification
          updateInfo={updateInfo}
          onClose={() => setShowUpdateNotification(false)}
        />
      )}
      
      {updateCheckStatus === 'checking' && (
        <UpdateCheckAnimation message="Güncellemeler denetleniyor..." />
      )}
      
      {updateCheckStatus === 'success' && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full flex flex-col items-center">
            <div className="w-16 h-16 mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 dark:text-white text-center">İşlem Tamamlandı</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center">{updateCheckMessage}</p>
          </div>
        </div>
      )}
      
      {updateCheckStatus === 'error' && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full flex flex-col items-center">
            <div className="w-16 h-16 mb-4 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 dark:text-white text-center">Hata</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center">{updateCheckMessage}</p>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-[var(--secondary-hover)] transition-colors"
            aria-label="Geri dön"
          >
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold">Ayarlar</h1>
        </div>

        <button
          onClick={handleSave}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            isSaved
              ? 'bg-[var(--success)] text-white'
              : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
          } transition-colors`}
        >
          <FiSave size={18} />
          <span>{isSaved ? 'Kaydedildi!' : 'Kaydet'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-8">
          <div className="bg-[var(--chat-bg)] p-6 rounded-lg border border-[var(--border)]">
            <h2 className="text-xl font-medium mb-4">API Ayarları</h2>

            <div className="space-y-6">
              <div>
                <label htmlFor="apiKey" className="block mb-2 font-medium">
                  Gemini API Anahtarı
                </label>
                <input
                  id="apiKey"
                  type="password"
                  value={localApiKey}
                  onChange={(e) => setLocalApiKey(e.target.value)}
                  placeholder="API anahtarınızı girin"
                  className="w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] outline-none transition-colors"
                />
                <p className="mt-2 text-sm text-gray-500">
                  API anahtarınızı{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--primary)] hover:underline"
                  >
                    Google AI Studio
                  </a>{' '}
                  üzerinden alabilirsiniz.
                </p>
              </div>

              <div>
                <label htmlFor="modelName" className="block mb-2 font-medium">
                  Model
                </label>
                <div className="relative">
                  <select
                    id="modelName"
                    value={localModelName}
                    onChange={(e) => setLocalModelName(e.target.value)}
                    className={`w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] outline-none transition-colors ${isLoadingModels ? 'opacity-50' : ''}`}
                    disabled={isLoadingModels}
                  >
                    {availableModels.map((model) => (
                      <option key={model.name} value={model.name}>
                        {model.displayName}
                      </option>
                    ))}
                  </select>
                  {isLoadingModels && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <FiLoader className="animate-spin" size={18} />
                    </div>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {isLoadingModels
                    ? 'Kullanılabilir modeller yükleniyor...'
                    : availableModels.length > 0
                      ? `${availableModels.length} model bulundu`
                      : 'Model listesi alınamadı'}
                </p>

                {localModelName && availableModels.length > 0 && (
                  <div className="mt-3 p-3 bg-[var(--secondary-hover)] rounded-lg text-xs">
                    {availableModels.find(m => m.name === localModelName)?.description && (
                      <p className="mb-2">{availableModels.find(m => m.name === localModelName)?.description}</p>
                    )}
                    {availableModels.find(m => m.name === localModelName)?.inputTokenLimit && (
                      <p>Giriş token limiti: <span className="font-medium">{availableModels.find(m => m.name === localModelName)?.inputTokenLimit?.toLocaleString()}</span></p>
                    )}
                    {availableModels.find(m => m.name === localModelName)?.outputTokenLimit && (
                      <p>Çıkış token limiti: <span className="font-medium">{availableModels.find(m => m.name === localModelName)?.outputTokenLimit?.toLocaleString()}</span></p>
                    )}
                  </div>
                )}

                <div className="mt-4 text-xs text-gray-400">
                  <p>Not: Burada gösterilen modeller, Gemini API'den otomatik olarak alınmaktadır.
                  Kullandığınız API anahtarına bağlı olarak kullanılabilir modeller değişebilir.</p>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localUseFullContext}
                    onChange={(e) => setLocalUseFullContext(e.target.checked)}
                    className="w-4 h-4 text-[var(--primary)] border-[var(--border)] rounded focus:ring-[var(--primary)]"
                  />
                  <span className="font-medium">Tam Sohbet Geçmişini Kullan</span>
                </label>
                <p className="mt-2 text-sm text-gray-500 ml-6">
                  Bu seçenek açıkken, AI asistan tüm sohbet geçmişini hatırlayacaktır. Kapalıyken, sadece son birkaç mesajı hatırlayacaktır.
                  <br />
                  <span className="text-xs mt-1 block">
                    Not: Tam sohbet geçmişi özelliği sadece Gemini 1.5 ve üzeri modellerde 60k token context limiti ile çalışır.
                  </span>
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-[var(--border)]">
                <h3 className="text-lg font-medium mb-4">Web Arama Ayarları</h3>

                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localUseWebSearch}
                      onChange={(e) => setLocalUseWebSearch(e.target.checked)}
                      className="w-4 h-4 text-[var(--primary)] border-[var(--border)] rounded focus:ring-[var(--primary)]"
                    />
                    <span className="font-medium">Web Arama Desteği</span>
                  </label>
                  <p className="mt-2 text-sm text-gray-500 ml-6">
                    Bu seçenek açıkken, AI asistan gerektiğinde web'den bilgi arayabilir ve güncel bilgilerle yanıt verebilir.
                    <br />
                    <span className="text-xs mt-1 block">
                      Not: Web arama özelliği, AI'nin bilgi tabanında olmayan veya güncel bilgi gerektiren sorular için kullanışlıdır.
                    </span>
                  </p>
                </div>

                {localUseWebSearch && (
                  <div className="space-y-4 mt-4 p-4 bg-[var(--secondary)] rounded-lg">
                    <div>
                      <label htmlFor="searchApiKey" className="block mb-2 font-medium">
                        Google Custom Search API Anahtarı
                      </label>
                      <input
                        id="searchApiKey"
                        type="password"
                        value={localSearchApiKey}
                        onChange={(e) => setLocalSearchApiKey(e.target.value)}
                        placeholder="Google Custom Search API anahtarınızı girin"
                        className="w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] outline-none transition-colors"
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        API anahtarınızı{' '}
                        <a
                          href="https://developers.google.com/custom-search/v1/introduction"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--primary)] hover:underline"
                        >
                          Google Cloud Console
                        </a>{' '}
                        üzerinden alabilirsiniz.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="searchEngineId" className="block mb-2 font-medium">
                        Google Custom Search Engine ID
                      </label>
                      <input
                        id="searchEngineId"
                        type="text"
                        value={localSearchEngineId}
                        onChange={(e) => setLocalSearchEngineId(e.target.value)}
                        placeholder="Custom Search Engine ID'nizi girin"
                        className="w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] outline-none transition-colors"
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Search Engine ID'nizi{' '}
                        <a
                          href="https://programmablesearchengine.google.com/controlpanel/create"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--primary)] hover:underline"
                        >
                          Programmable Search Engine
                        </a>{' '}
                        üzerinden oluşturabilirsiniz.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[var(--chat-bg)] p-6 rounded-lg border border-[var(--border)]">
            <h2 className="text-xl font-medium mb-4">Görünüm</h2>

            <div>
              <label className="block mb-2 font-medium">Tema</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setLocalTheme('light')}
                  className={`flex-1 p-4 rounded-lg border ${
                    localTheme === 'light'
                      ? 'border-[var(--primary)] bg-[var(--primary)] bg-opacity-10'
                      : 'border-[var(--border)] hover:bg-[var(--secondary-hover)]'
                  } transition-colors flex flex-col items-center gap-2`}
                >
                  <FiSun size={24} />
                  <span>Açık</span>
                </button>

                <button
                  onClick={() => setLocalTheme('dark')}
                  className={`flex-1 p-4 rounded-lg border ${
                    localTheme === 'dark'
                      ? 'border-[var(--primary)] bg-[var(--primary)] bg-opacity-10'
                      : 'border-[var(--border)] hover:bg-[var(--secondary-hover)]'
                  } transition-colors flex flex-col items-center gap-2`}
                >
                  <FiMoon size={24} />
                  <span>Koyu</span>
                </button>

                <button
                  onClick={() => setLocalTheme('system')}
                  className={`flex-1 p-4 rounded-lg border ${
                    localTheme === 'system'
                      ? 'border-[var(--primary)] bg-[var(--primary)] bg-opacity-10'
                      : 'border-[var(--border)] hover:bg-[var(--secondary-hover)]'
                  } transition-colors flex flex-col items-center gap-2`}
                >
                  <FiMonitor size={24} />
                  <span>Sistem</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[var(--chat-bg)] p-6 rounded-lg border border-[var(--border)]">
            <h2 className="text-xl font-medium mb-4">Sesli Asistan</h2>

            {(isSpeechSupported || isSynthesisSupported) ? (
              <div className="space-y-4">
                {isSpeechSupported && (
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localUseSpeechRecognition}
                        onChange={(e) => setLocalUseSpeechRecognition(e.target.checked)}
                        className="w-4 h-4 text-[var(--primary)] border-[var(--border)] rounded focus:ring-[var(--primary)]"
                      />
                      <span className="font-medium flex items-center gap-2">
                        <FiMic size={18} />
                        Sesli Komut
                      </span>
                    </label>
                    <p className="mt-2 text-sm text-gray-500 ml-6">
                      Bu seçenek açıkken, mikrofon butonuna tıklayarak sesli komutlar verebilirsiniz.
                    </p>
                  </div>
                )}

                {isSynthesisSupported && (
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localUseSpeechSynthesis}
                        onChange={(e) => setLocalUseSpeechSynthesis(e.target.checked)}
                        className="w-4 h-4 text-[var(--primary)] border-[var(--border)] rounded focus:ring-[var(--primary)]"
                      />
                      <span className="font-medium flex items-center gap-2">
                        <FiVolume2 size={18} />
                        Sesli Yanıt
                      </span>
                    </label>
                    <p className="mt-2 text-sm text-gray-500 ml-6">
                      Bu seçenek açıkken, AI asistanın yanıtlarını sesli olarak dinleyebilirsiniz.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-lg">
                <p className="font-medium">Tarayıcı Desteği Bulunamadı</p>
                <p className="text-sm mt-1">
                  Tarayıcınız Web Speech API'yi desteklemiyor. Sesli asistan özelliklerini kullanmak için Chrome, Edge veya Safari gibi modern bir tarayıcı kullanın.
                </p>
              </div>
            )}
          </div>

          <div className="bg-[var(--chat-bg)] p-6 rounded-lg border border-[var(--border)]">
            <h2 className="text-xl font-medium mb-4">Güncelleme</h2>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Otomatik Güncelleme</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Yeni bir sürüm mevcut olduğunda otomatik olarak bildirim alın.
                  </p>
                </div>
                <button
                  onClick={handleCheckForUpdates}
                  disabled={isCheckingForUpdate}
                  className="px-4 py-2 rounded-lg flex items-center gap-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
                >
                  {isCheckingForUpdate ? (
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  ) : (
                    <FiRefreshCw size={18} />
                  )}
                  <span>{isCheckingForUpdate ? 'Denetleniyor...' : 'Güncellemeleri Kontrol Et'}</span>
                </button>
              </div>

              {updateError && !updateError.includes('No updates available') && (
                <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm">
                  {updateError}
                </div>
              )}

              {updateAvailable && updateInfo && (
                <div className="p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Yeni sürüm mevcut: {updateInfo.version}</p>
                      <p className="text-sm mt-1">Yayınlanma Tarihi: {updateInfo.date}</p>
                    </div>
                    <button
                      onClick={() => setShowUpdateNotification(true)}
                      className="px-3 py-1.5 rounded flex items-center gap-1 bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      <FiDownload size={16} />
                      <span>Güncelle</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[var(--chat-bg)] p-6 rounded-lg border border-[var(--border)]">
            <h2 className="text-xl font-medium mb-4">Hakkında</h2>
            <p>AnyAssist v0.1.0</p>
            <p className="text-sm text-gray-500 mt-2">
              AnyAssist, Gemini API kullanarak yapay zeka destekli bir masaüstü asistanıdır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
