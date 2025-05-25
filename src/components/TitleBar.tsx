"use client";
import { useState, useEffect, useCallback } from 'react';
import { FiMinus, FiX, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { useSettingsStore } from '@/store/useSettingsStore';
import { getCurrentWindow } from '@tauri-apps/api/window';

export const TitleBar = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { theme } = useSettingsStore();

  // İstemci tarafında tema kontrolü
  useEffect(() => {
    if (!isMounted) return;

    // Tema durumunu kontrol et
    if (theme === 'dark') {
      setIsDarkMode(true);
    } else if (theme === 'system') {
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);

      // Sistem teması değişikliklerini dinle
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        setIsDarkMode(mediaQuery.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setIsDarkMode(false);
    }
  }, [theme, isMounted]);

  // Tauri API'sini kullan
  useEffect(() => {
    setIsMounted(true);

    // Pencere durumunu kontrol et ve değişiklikleri dinle
    const setupWindowListeners = async () => {
      try {
        const appWindow = getCurrentWindow();
        console.log('Pencere durumu kontrol ediliyor...');

        // İlk durumu kontrol et
        const maximized = await appWindow.isMaximized();
        console.log('Pencere durumu:', maximized ? 'Büyütülmüş' : 'Normal');
        setIsMaximized(maximized);

        // Pencere durumu değişikliklerini dinle
        const unlistenResized = await appWindow.onResized(async () => {
          console.log('Pencere boyutu değişti');
          try {
            const max = await appWindow.isMaximized();
            console.log('Yeni pencere durumu (resize):', max ? 'Büyütülmüş' : 'Normal');
            setIsMaximized(max);
          } catch (error) {
            console.error('Pencere durumu kontrol edilemedi (resize):', error);
          }
        });

        return () => {
          unlistenResized();
        };
      } catch (error) {
        console.error('Pencere durumu kontrol edilemedi:', error);
        return () => {};
      }
    };

    let cleanup: (() => void) | undefined;
    setupWindowListeners().then(unlisten => {
      cleanup = unlisten;
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  // Pencere kontrol işlevleri artık doğrudan butonların onClick olaylarında tanımlanmıştır

  // Sürükleme işlevi
  const startDrag = useCallback(async (e: React.MouseEvent) => {
    if (!isMounted) return;

    // Butonların üzerinde sürükleme işlemi başlatma
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }

    try {
      console.log('Sürükleme başlatılıyor...');
      const appWindow = getCurrentWindow();
      await appWindow.startDragging();
      console.log('Sürükleme başlatıldı');
    } catch (error) {
      console.error('Pencere sürüklenemedi:', error);
    }
  }, [isMounted]);

  return (
    <div
      data-tauri-drag-region
      onMouseDown={startDrag}
      className={`h-12 flex items-center justify-between px-4 select-none ${
        isDarkMode
          ? 'bg-gradient-to-r from-[var(--sidebar-bg)] to-[#1d1d20] text-white shadow-md'
          : 'bg-gradient-to-r from-[var(--sidebar-bg)] to-[#f3f4f6] text-gray-800 shadow-sm'
      }`}
    >
      {/* Logo ve Başlık */}
      <div className="flex items-center gap-3 px-1">
        <div className="w-8 h-8 flex items-center justify-center">
          <img src="/favicon.ico" alt="AnyAssist Logo" className="w-full h-full" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-base leading-tight">AnyAssist</span>
          <span className="text-xs opacity-70">AI Asistanı</span>
        </div>
      </div>

      {/* Boş orta alan - sürüklemek için */}
      <div className="flex-1 h-full"></div>

      {/* Pencere Kontrolleri */}
      <div className="flex items-center gap-1 relative z-50">
        <button
          onClick={async (e) => {
            e.stopPropagation();
            console.log('Küçültme butonu tıklandı');
            try {
              const appWindow = getCurrentWindow();
              await appWindow.minimize();
            } catch (error) {
              console.error('Pencere küçültülemedi:', error);
            }
          }}
          className="p-2 rounded-md hover:bg-[var(--secondary-hover)] transition-colors text-opacity-80 hover:text-opacity-100"
          aria-label="Küçült"
          data-tauri-drag-region="false"
        >
          <FiMinus size={16} />
        </button>
        <button
          onClick={async (e) => {
            e.stopPropagation();
            console.log('Büyütme/Küçültme butonu tıklandı');
            try {
              const appWindow = getCurrentWindow();
              // toggleMaximize fonksiyonunu kullanarak pencereyi büyüt/küçült
              await appWindow.toggleMaximize();
              console.log('Pencere durumu değiştirildi');
            } catch (error) {
              console.error('Pencere büyütülemedi/küçültülemedi:', error);
            }
          }}
          className="p-2 rounded-md hover:bg-[var(--secondary-hover)] transition-colors text-opacity-80 hover:text-opacity-100"
          aria-label={isMaximized ? "Küçült" : "Büyüt"}
          data-tauri-drag-region="false"
        >
          {isMaximized ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
        </button>
        <button
          onClick={async (e) => {
            e.stopPropagation();
            console.log('Kapatma butonu tıklandı');
            try {
              const appWindow = getCurrentWindow();
              await appWindow.close();
            } catch (error) {
              console.error('Pencere kapatılamadı:', error);
            }
          }}
          className="p-2 rounded-md hover:bg-red-500 hover:text-white transition-colors ml-1 text-opacity-80 hover:text-opacity-100"
          aria-label="Kapat"
          data-tauri-drag-region="false"
        >
          <FiX size={16} />
        </button>
      </div>
    </div>
  );
};
