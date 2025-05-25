'use client';

import { useState, useEffect, useCallback } from 'react';
import { invoke, isTauriAvailable } from '@/lib/tauri';

interface UpdateInfo {
  version: string;
  date: string;
  body: string;
}

interface UseUpdaterResult {
  isCheckingForUpdate: boolean;
  updateAvailable: boolean;
  updateInfo: UpdateInfo | null;
  error: string | null;
  checkForUpdates: () => Promise<{ success: boolean; message: string }>;
}

export function useUpdater(autoCheck = false): UseUpdaterResult {
  const [isCheckingForUpdate, setIsCheckingForUpdate] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkForUpdates = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    // Tauri API'sinin kullanılabilir olup olmadığını kontrol et
    if (!isTauriAvailable()) {
      console.warn('Tauri API bu ortamda kullanılamıyor. Tarayıcı ortamında çalışıyor olabilirsiniz.');
      setIsCheckingForUpdate(false);
      return { 
        success: false, 
        message: 'Tauri API bu ortamda kullanılamıyor. Masaüstü uygulamasında çalıştırın.'
      };
    }

    try {
      setIsCheckingForUpdate(true);
      setError(null);

      // Tauri'nin güncelleme API'sini kullanarak güncelleme kontrolü yap
      const updateResponse = await invoke<string>('check_update');
      
      if (updateResponse) {
        const updateData = JSON.parse(updateResponse);

        // Güncelleme bilgilerini ayarla
        setUpdateAvailable(updateData.available || false);
        if (updateData.available) {
          setUpdateInfo({
            version: updateData.version || 'Bilinmeyen Sürüm',
            date: updateData.date || new Date().toLocaleDateString('tr-TR'),
            body: updateData.body || 'Güncelleme detayları mevcut değil.'
          });
          
          return {
            success: true,
            message: `Yeni sürüm bulundu: ${updateData.version}`
          };
        } else {
          setUpdateInfo(null);
          return {
            success: true,
            message: 'Sisteminiz güncel. Yeni güncelleme yok.'
          };
        }
      } else {
        setUpdateAvailable(false);
        setUpdateInfo(null);
        return {
          success: true,
          message: 'Sisteminiz güncel. Yeni güncelleme yok.'
        };
      }
    } catch (err: any) {
      // Güncelleme mevcut değilse hata döner, bu normal bir durum
      if (err.toString().includes('No updates available')) {
        setUpdateAvailable(false);
        setUpdateInfo(null);
        return {
          success: true,
          message: 'Sisteminiz güncel. Yeni güncelleme yok.'
        };
      } else {
        const errorMessage = `Güncelleme kontrolü sırasında hata oluştu: ${err}`;
        setError(errorMessage);
        console.error('Güncelleme kontrolü hatası:', err);
        return {
          success: false,
          message: errorMessage
        };
      }
    } finally {
      setIsCheckingForUpdate(false);
    }
  }, []);

  // Otomatik güncelleme kontrolü
  useEffect(() => {
    // Tauri API'sinin kullanılabilir olup olmadığını kontrol et
    if (autoCheck) {
      if (isTauriAvailable()) {
        checkForUpdates();
      } else {
        console.warn('Tauri API bu ortamda kullanılamıyor. Otomatik güncelleme kontrolü yapılamıyor.');
      }
    }
  }, [autoCheck, checkForUpdates]);

  return {
    isCheckingForUpdate,
    updateAvailable,
    updateInfo,
    error,
    checkForUpdates
  };
}
