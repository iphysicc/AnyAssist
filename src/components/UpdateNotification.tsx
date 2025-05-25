'use client';

import React, { useState, useEffect } from 'react';
import { invoke, listen, relaunch, isTauriAvailable } from '@/lib/tauri';
import { LoadingIndicator } from './LoadingIndicator';
import UpdateProgress from './UpdateProgress';

interface UpdateInfo {
  version: string;
  date: string;
  body: string;
}

interface UpdateNotificationProps {
  onClose: () => void;
  updateInfo: UpdateInfo;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onClose, updateInfo }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const unlisten = listen('tauri://update-status', (event) => {
      const { status, progress } = event.payload as { status: string; progress: number };

      if (status === 'DOWNLOADING') {
        setProgress(progress);
      } else if (status === 'DONE') {
        setIsInstalling(true);
      }
    });

    return () => {
      unlisten.then(unlistenFn => unlistenFn());
    };
  }, []);

  const handleInstall = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Tauri API'sinin kullanılabilir olup olmadığını kontrol et
      if (!isTauriAvailable()) {
        console.warn('Tauri API bu ortamda kullanılamıyor. Tarayıcı ortamında çalışıyor olabilirsiniz.');
        setError('Tauri API bu ortamda kullanılamıyor. Masaüstü uygulamasında çalıştırın.');
        setIsLoading(false);
        return;
      }

      await invoke('install_update');

      // Restart the application after successful update
      await relaunch();
    } catch (err) {
      setError(`Güncelleme yüklenirken hata oluştu: ${err}`);
      setIsLoading(false);
    }
  };

  if (!updateInfo) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
        <h2 className="text-xl font-bold mb-4 dark:text-white">Yeni Güncelleme Mevcut</h2>

        <div className="mb-4 dark:text-gray-300">
          <p className="font-semibold">Sürüm: {updateInfo.version}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Yayınlanma Tarihi: {updateInfo.date}</p>

          <div className="mt-3 text-sm">
            <h3 className="font-semibold mb-1">Değişiklikler:</h3>
            <div className="max-h-40 overflow-y-auto p-2 bg-gray-100 dark:bg-gray-700 rounded">
              {updateInfo.body}
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="mb-4 flex justify-center">
            <UpdateProgress
              progress={progress}
              text={isInstalling ? 'Güncelleme yükleniyor...' : undefined}
            />
          </div>
        )}

        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
            disabled={isLoading}
          >
            Daha Sonra
          </button>

          <button
            onClick={handleInstall}
            disabled={isLoading}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <LoadingIndicator type="thinking" message="" />
            ) : (
              'Şimdi Güncelle'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;
