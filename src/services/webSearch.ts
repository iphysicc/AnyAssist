// Web arama servisi
import { useSettingsStore } from '@/store/useSettingsStore';

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

export async function searchWeb(query: string): Promise<SearchResult[]> {
  const { searchApiKey, searchEngineId } = useSettingsStore.getState();

  // Google Custom Search API kullanarak web araması yap
  if (searchApiKey && searchEngineId) {
    try {
      // Arama URL'ini oluştur
      const url = `https://www.googleapis.com/customsearch/v1?key=${searchApiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}`;

      // API isteği gönder
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Arama yapılırken bir hata oluştu: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Sonuçları işle
      if (data.items && Array.isArray(data.items)) {
        return data.items.map((item: any) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet || '',
        }));
      }

      return [];
    } catch (error) {
      console.error('Web araması hatası:', error);
      throw new Error('Web araması yapılırken bir hata oluştu. Lütfen API anahtarınızı ve Search Engine ID\'nizi kontrol edin.');
    }
  } else {
    // API anahtarı veya Search Engine ID yoksa, kullanıcıya bilgi ver
    console.log('Web araması için API anahtarı veya Search Engine ID eksik');

    // Simüle edilmiş sonuçlar döndür
    return simulateSearchResults(query);
  }
}

// Gerçek API anahtarı olmadan geliştirme yaparken kullanılacak boş sonuçlar
function simulateSearchResults(query: string): SearchResult[] {
  console.log('Web araması yapılamadı, AI kendi bilgisini kullanacak:', query);

  // Boş sonuç döndür - AI kendi bilgisini kullanacak
  return [];
}
