'use client';

// Tauri API'lerini istemci tarafında kullanmak için sarmalayıcı
// Bu dosya, Tauri API'lerini Next.js ile kullanırken oluşabilecek sorunları çözmek için kullanılır

// Tauri 2.0 için import yöntemi değişti. Modüller ayrı ayrı import edilmeli.

// Tauri API'lerinin yüklenip yüklenmediğini kontrol eden fonksiyon
export function isTauriAvailable(): boolean {
  if (typeof window !== 'undefined') {
    // Tauri 2.0'da __TAURI__ nesnesi bazen biraz gecikebilir, daha güvenilir bir yaklaşım kullanaralım
    try {
      // Çeşitli Tauri 2.0 global değişkenlerini kontrol et
      // @ts-ignore
      return typeof window.__TAURI_INTERNALS__ !== 'undefined' || 
             // @ts-ignore
             typeof window.__TAURI__ !== 'undefined' ||
             // Diğer olası Tauri 2.0 global değişkenleri
             // @ts-ignore
             typeof window.__TAURI_METADATA__ !== 'undefined';
    } catch (e) {
      console.error('Tauri ortamı kontrolü sırasında hata:', e);
      return false;
    }
  }
  
  return false;
}

// Tauri invoke API'sini sarmalayan fonksiyon
export async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauriAvailable()) {
    console.warn('Tauri API bu ortamda kullanılamıyor. Tarayıcı ortamında çalışıyor olabilirsiniz.');
    return {} as T; // Tarayıcı ortamında boş bir nesne döndür
  }

  try {
    // Tauri 2.0'da API yapısı değişti
    const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
    return tauriInvoke<T>(command, args);
  } catch (error) {
    console.error('Tauri API yüklenirken hata oluştu:', error);
    throw new Error('Tauri API yüklenemedi.');
  }
}

// Tauri listen API'sini sarmalayan fonksiyon
export async function listen<T>(event: string, callback: (event: { payload: T }) => void) {
  if (!isTauriAvailable()) {
    console.warn('Tauri API bu ortamda kullanılamıyor. Tarayıcı ortamında çalışıyor olabilirsiniz.');
    // Tarayıcı ortamında sahte bir unsubscribe fonksiyonu döndür
    return Promise.resolve(() => {});
  }

  try {
    // Tauri 2.0 event API'sini içe aktarma
    const { listen: tauriListen } = await import('@tauri-apps/api/event');
    return tauriListen<T>(event, callback);
  } catch (error) {
    console.error('Tauri Event API yüklenirken hata oluştu:', error);
    throw new Error('Tauri Event API yüklenemedi.');
  }
}

// Tauri relaunch API'sini sarmalayan fonksiyon
export async function relaunch() {
  if (!isTauriAvailable()) {
    console.warn('Tauri API bu ortamda kullanılamıyor. Tarayıcı ortamında çalışıyor olabilirsiniz.');
    // Tarayıcı ortamında hiçbir şey yapma
    return Promise.resolve();
  }

  try {
    // Tauri 2.0'da plugin API'lerine erişim şekli
    const processApi = await import('@tauri-apps/plugin-process');
    return processApi.relaunch();
  } catch (error) {
    console.error('Tauri Process API yüklenirken hata oluştu:', error);
    throw new Error('Tauri Process API yüklenemedi.');
  }
}
