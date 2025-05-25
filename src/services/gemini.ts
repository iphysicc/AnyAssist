import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { useSettingsStore } from '@/store/useSettingsStore';
import { searchWeb, SearchResult } from './webSearch';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  webSearchResults?: SearchResult[];
  imageData?: string; // Base64 formatında görsel verisi
  imageAnalysis?: string; // Görsel ön analizi
}

export async function generateChatResponse(
  messages: ChatMessage[],
  useWebSearch: boolean = false
): Promise<{text: string, usedWebSearch: boolean}> {
  const { apiKey, modelName, useFullContext } = useSettingsStore.getState();

  if (!apiKey) {
    throw new Error('API anahtarı ayarlanmamış. Lütfen ayarlar sayfasından API anahtarınızı girin.');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    // Gemini 1.5 modelleri 60k token context'i destekler
    const isGemini15 = modelName.includes('gemini-1.5') || modelName.includes('gemini-2');

    // Tam sohbet geçmişini kullanma ayarı açıksa ve model destekliyorsa tüm mesajları gönder
    // Aksi takdirde sadece son birkaç mesajı gönder (context limitini aşmamak için)
    const historyMessages = useFullContext && isGemini15
      ? messages.slice(0, -1) // Son mesaj hariç tüm mesajlar
      : messages.length > 10
        ? messages.slice(-10, -1) // Son 10 mesaj (son mesaj hariç)
        : messages.slice(0, -1);  // Son mesaj hariç tüm mesajlar (10'dan az mesaj varsa)

    // Sohbet geçmişini hazırla - görsel içeren mesajları özel olarak işle
    const chatHistory = historyMessages.map(msg => {
      // Eğer mesajda görsel varsa, görsel ve analizi içeren bir mesaj oluştur
      if (msg.imageData && msg.imageAnalysis) {
        return {
          role: msg.role === 'assistant' ? 'model' : msg.role,
          parts: [
            { text: `[Görsel içeren mesaj]\n\nGörsel Analizi: ${msg.imageAnalysis}\n\n${msg.content}` }
          ]
        };
      }

      // Normal metin mesajı
      return {
        role: msg.role === 'assistant' ? 'model' : msg.role,
        parts: [{ text: msg.content }]
      };
    });

    const chat = model.startChat({
      history: chatHistory,
    });

    // Son kullanıcı mesajını al
    const lastMessage = messages[messages.length - 1];
    let messageContent = lastMessage.content;
    let usedWebSearch = false;

    // Son mesajda görsel varsa, özel işlem yap
    if (lastMessage.imageData && lastMessage.imageAnalysis) {
      // Görsel içeren mesaj için özel prompt hazırla
      messageContent = `
[Kullanıcı bir görsel paylaştı]

Görsel Analizi (Gemini 1.5 Flash tarafından yapıldı):
${lastMessage.imageAnalysis}

Kullanıcı Sorusu/Yorumu:
${lastMessage.content}

Lütfen hem görseli hem de kullanıcının sorusunu/yorumunu dikkate alarak yanıt ver.
`;

      // Görsel içeren mesajlar için web araması kullanmıyoruz
      if (useWebSearch) {
        useWebSearch = false;
        console.log('Görsel içeren mesaj için web araması devre dışı bırakıldı.');
      }
    }

    // Web araması yapılacaksa, önce web aramasına ihtiyaç olup olmadığını kontrol et
    if (useWebSearch) {
      // Web aramasına ihtiyaç olup olmadığını belirle
      const needsWebSearchResult = await chat.sendMessage(`
Aşağıdaki soruyu değerlendir ve web aramasına ihtiyaç olup olmadığını belirle:

"${lastMessage.content}"

Eğer aşağıdaki kriterlerden herhangi biri geçerliyse, web aramasına ihtiyaç vardır:
1. Soru güncel olaylar veya haberler hakkında (son 1-2 yıl içinde)
2. Soru güncel veriler, istatistikler veya fiyatlar hakkında
3. Soru spesifik ve güncel bilgiler gerektiriyor
4. Soru senin bilgi tabanında olmayan veya bilgi tabanının kesim tarihinden sonraki konular hakkında
5. Soru çok spesifik bir konu, kişi veya olay hakkında ve detaylı bilgi gerekiyor

Sadece "Evet" veya "Hayır" olarak cevap ver.
`);
      const needsWebSearchResponse = await needsWebSearchResult.response;
      const needsWebSearchText = needsWebSearchResponse.text().trim().toLowerCase();

      // Eğer web aramasına ihtiyaç varsa
      if (needsWebSearchText.includes('evet')) {
        const { searchApiKey, searchEngineId } = useSettingsStore.getState();

        // API anahtarı ve Search Engine ID kontrolü
        if (!searchApiKey || !searchEngineId) {
          // API bilgileri eksikse, doğrudan kullanıcı sorusunu gönder
          messageContent = lastMessage.content;
          usedWebSearch = false;
        } else {
          try {
            // Web'de ara
            const searchResults = await searchWeb(lastMessage.content);

            if (searchResults && searchResults.length > 0) {
              // Web arama sonuçlarını mesaja ekle
              const webSearchContent = formatWebSearchResults(searchResults);

              // Web arama sonuçları boş mu kontrol et (simüle edilmiş sonuçlar için boş dönüyor)
              if (!webSearchContent.trim()) {
                // Simüle edilmiş sonuçlar veya boş sonuçlar için AI kendi bilgisini kullanacak
                messageContent = lastMessage.content;
                usedWebSearch = false;
              } else {
                // Gemini'ye gönderilecek prompt'u hazırla - daha temiz ve doğal bir format
                messageContent = `
Kullanıcı sorusu: ${lastMessage.content}

Web araması sonuçları:
${webSearchContent}

Bu web arama sonuçlarını ve kendi bilgilerini kullanarak kullanıcının sorusuna kapsamlı bir yanıt ver.
Lütfen aşağıdaki kurallara uy:

1. Yanıtını doğal ve akıcı bir dille oluştur, sanki bir insan gibi konuşuyormuş gibi.
2. Web kaynaklarından elde ettiğin bilgileri kendi bilgilerinle birleştirerek kapsamlı bir yanıt oluştur.
3. Yanıtında kullandığın web kaynaklarını doğal bir şekilde belirt (örn: "X kaynağına göre..." veya "Y sitesinde belirtildiği üzere...").
4. Yanıtın sonunda kullandığın kaynakları dipnot olarak listele, ancak bunu yanıtın ana akışını bozmayacak şekilde yap.
5. Yanıtını Türkçe olarak ver.
6. Teknik jargon ve gereksiz detaylardan kaçın, bilgiyi özlü ve anlaşılır bir şekilde sun.
7. URL'leri yanıtın içinde değil, sadece dipnot bölümünde kullan.

Örnek format:
"[Yanıtın ana metni burada, kaynakları doğal bir şekilde belirterek]

Kaynaklar:
1. [Kaynak 1 adı]
2. [Kaynak 2 adı]"
`;
                usedWebSearch = true;
              }
            } else {
              // Arama sonuçları boşsa, doğrudan kullanıcı sorusunu gönder
              messageContent = lastMessage.content;
            }
          } catch (error) {
            console.error('Web araması hatası:', error);
            // Web araması başarısız olursa, doğrudan kullanıcı sorusunu gönder
            messageContent = lastMessage.content;
          }
        }
      }
    }

    // Mesajı gönder
    const result = await chat.sendMessage(messageContent);
    const response = await result.response;
    const text = response.text();

    return { text, usedWebSearch };
  } catch (error) {
    console.error('Gemini API hatası:', error);
    throw new Error('Yanıt oluşturulurken bir hata oluştu. Lütfen API anahtarınızı kontrol edin veya daha sonra tekrar deneyin.');
  }
}

// Web arama sonuçlarını formatlama
function formatWebSearchResults(results: SearchResult[]): string {
  // Simüle edilmiş sonuçları kontrol et
  const isSimulated = results.some(result => result.title.includes('SİMÜLE EDİLMİŞ SONUÇ'));

  // Simüle edilmiş sonuçlar için boş dön - AI kendi bilgisini kullanacak
  if (isSimulated) {
    return '';
  }

  // Gerçek sonuçlar için daha temiz bir format
  return results.map((result, index) => {
    return `KAYNAK_${index + 1}:
Başlık: ${result.title}
İçerik: ${result.snippet}
URL: ${result.link}`;
  }).join('\n\n');
}

export async function generateChatTitle(messages: ChatMessage[]): Promise<string> {
  const { apiKey, modelName } = useSettingsStore.getState();

  if (!apiKey || messages.length < 2) {
    return 'Yeni Sohbet';
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `
      Bu bir sohbet. Sohbetin icerigine bakarak, sohbet icin kisa (en fazla 5 kelime) ve aciklayici bir baslik olustur.
      Basligi Turkce olarak ver ve sadece basligi yaz, baska bir sey yazma.

      Sohbet:
      ${messages.map(m => `${m.role === 'user' ? 'Kullanici' : 'Asistan'}: ${m.content.substring(0, 500)}...`).join('\n')}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const title = response.text().trim();

    return title || 'Yeni Sohbet';
  } catch (error) {
    console.error('Baslik olusturma hatasi:', error);
    return 'Yeni Sohbet';
  }
}

export interface GeminiModel {
  name: string;
  displayName: string;
  description?: string;
  supportedGenerationMethods?: string[];
  inputTokenLimit?: number;
  outputTokenLimit?: number;
}

export async function getAvailableModels(apiKey: string): Promise<GeminiModel[]> {
  // Varsayilan modeller - API cagrisi basarisiz olursa bunlar kullanilacak
  const defaultModels: GeminiModel[] = [
    { name: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro' },
    { name: 'gemini-1.5-flash', displayName: 'Gemini 1.5 Flash' },
    { name: 'gemini-1.0-pro', displayName: 'Gemini 1.0 Pro' },
    { name: 'gemini-pro', displayName: 'Gemini Pro' },
    { name: 'gemini-2.0-pro', displayName: 'Gemini 2.0 Pro' },
    { name: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash' },
  ];

  if (!apiKey) {
    // API anahtari yoksa varsayilan modelleri dondur
    return defaultModels;
  }

  try {
    // Gemini API'nin models.list endpoint'ini kullanarak modelleri al
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

    if (!response.ok) {
      throw new Error(`API yanit vermedi: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.models || !Array.isArray(data.models)) {
      throw new Error('API model listesi alinamadi');
    }

    // API'den gelen modelleri isle ve GeminiModel formatina donustur
    const apiModels: GeminiModel[] = data.models
      .filter((model: any) => {
        // Sadece generateContent destekleyen modelleri filtrele
        return model.supportedGenerationMethods &&
               model.supportedGenerationMethods.includes('generateContent');
      })
      .map((model: any) => {
        // Model adini al (models/ onekini kaldir)
        const name = model.name.replace('models/', '');

        return {
          name: name,
          displayName: model.displayName || formatModelName(name),
          description: model.description,
          supportedGenerationMethods: model.supportedGenerationMethods,
          inputTokenLimit: model.inputTokenLimit,
          outputTokenLimit: model.outputTokenLimit
        };
      });

    // Eger API'den model listesi alinabildiyse, bu listeyi dondur
    if (apiModels.length > 0) {
      return apiModels;
    }

    // API'den model listesi alinamadiysa, varsayilan modelleri dondur
    return defaultModels;
  } catch (error) {
    console.error('Model listesi alinirken hata olustu:', error);
    // Hata durumunda varsayilan modelleri dondur
    return defaultModels;
  }
}

// Görsel analiz fonksiyonu
export async function analyzeImage(imageData: string, prompt: string, specificModel?: string): Promise<string> {
  const { apiKey, modelName } = useSettingsStore.getState();

  if (!apiKey) {
    throw new Error('API anahtarı ayarlanmamış. Lütfen ayarlar sayfasından API anahtarınızı girin.');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Eğer belirli bir model belirtilmişse onu kullan
    // Aksi takdirde, görsel analiz için Gemini 1.5 Pro veya Vision destekleyen bir model kullan
    // Eğer seçili model görsel analizi desteklemiyorsa, otomatik olarak Gemini 1.5 Pro'ya geç
    const modelToUse = specificModel || (modelName.includes('gemini-1.5') || modelName.includes('vision')
      ? modelName
      : 'gemini-1.5-pro');

    const model = genAI.getGenerativeModel({
      model: modelToUse,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    // Base64 formatındaki resmi ve prompt'u içeren içerik oluştur
    const imageBase64 = imageData.split(',')[1]; // "data:image/jpeg;base64," kısmını kaldır

    const fullPrompt = prompt || 'Bu resmi detaylı olarak analiz et ve açıkla. Resimde ne görüyorsun?';

    // Türkçe yanıt için ek yönerge
    const promptWithLanguage = `${fullPrompt}\n\nLütfen yanıtını Türkçe olarak ver.`;

    // Görsel ve metin içeren bir istek gönder
    const result = await model.generateContent([
      promptWithLanguage,
      {
        inlineData: {
          mimeType: imageData.split(';')[0].split(':')[1], // "data:image/jpeg" -> "image/jpeg"
          data: imageBase64
        }
      }
    ]);

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Görsel analiz hatası:', error);
    throw new Error('Görsel analiz yapılırken bir hata oluştu. Lütfen API anahtarınızı kontrol edin veya daha sonra tekrar deneyin.');
  }
}

// Sohbet için görsel ön analizi yapan fonksiyon
export async function generateImagePreAnalysis(imageData: string): Promise<string> {
  const { apiKey } = useSettingsStore.getState();

  if (!apiKey) {
    throw new Error('API anahtarı ayarlanmamış. Lütfen ayarlar sayfasından API anahtarınızı girin.');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Görsel ön analizi için her zaman Gemini 1.5 Flash modelini kullan
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    // Base64 formatındaki resmi hazırla
    const imageBase64 = imageData.split(',')[1]; // "data:image/jpeg;base64," kısmını kaldır
    const mimeType = imageData.split(';')[0].split(':')[1]; // "data:image/jpeg" -> "image/jpeg"

    // Ön analiz için prompt
    const preAnalysisPrompt = `
Bu görseli kısaca analiz et ve içeriğini açıkla.
Görselde ne olduğunu, ana öğeleri ve varsa belirgin özellikleri belirt.
Yanıtını kısa ve öz tut, en fazla 3-4 cümle kullan.
Yanıtını Türkçe olarak ver.
`;

    // Görsel ve metin içeren bir istek gönder
    const result = await model.generateContent([
      preAnalysisPrompt,
      {
        inlineData: {
          mimeType: mimeType,
          data: imageBase64
        }
      }
    ]);

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Görsel ön analiz hatası:', error);
    return 'Görsel ön analizi yapılamadı. Lütfen sorunuzu yazarken görseli açıklamaya çalışın.';
  }
}

// Model adini daha okunabilir hale getir
function formatModelName(name: string): string {
  // "models/gemini-1.5-pro" -> "Gemini 1.5 Pro"
  const baseName = name.split('/').pop() || name;

  return baseName
    .split('-')
    .map((part, index) => {
      // Ilk kelimeyi buyuk harfle baslat
      if (index === 0) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      }
      return part;
    })
    .join(' ')
    .replace(/(\d+)\.(\d+)/, '$1.$2') // Sayilari koru
    .replace(/pro|flash|vision/, (match) => match.charAt(0).toUpperCase() + match.slice(1)); // Pro, Flash, Vision gibi kelimeleri buyuk harfle baslat
}


