'use client';

import { useEffect, useState } from 'react';
import { useUpdater } from '@/hooks/useUpdater';
import UpdateNotification from './UpdateNotification';
import { isTauriAvailable } from '@/lib/tauri';

export default function AutoUpdater() {
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);

  // Tauri API'sinin kullanılabilir olup olmadığını kontrol et
  const isTauri = isTauriAvailable();
  const { updateAvailable, updateInfo } = useUpdater(isTauri); // Sadece Tauri ortamında otomatik kontrol yap

  // Güncelleme bilgisi değiştiğinde bildirim göster
  useEffect(() => {
    if (updateAvailable && updateInfo) {
      setShowUpdateNotification(true);
    }
  }, [updateAvailable, updateInfo]);

  if (!isTauri || !showUpdateNotification || !updateInfo) return null;

  return (
    <UpdateNotification
      updateInfo={updateInfo}
      onClose={() => setShowUpdateNotification(false)}
    />
  );
}
