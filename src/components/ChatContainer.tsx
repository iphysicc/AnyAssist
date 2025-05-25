"use client";
import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { generateChatResponse, generateChatTitle, ChatMessage as GeminiChatMessage } from '@/services/gemini';
import { searchWeb } from '@/services/webSearch';
import { exportChat, ExportFormat } from '@/services/exportService';
import { speechSynthesis } from '@/services/speechService';
import { LoadingIndicator } from './LoadingIndicator';
import { VoiceControl } from './VoiceControl';
import { RiRobot2Line } from 'react-icons/ri';
import { FiDownload, FiTrash2, FiMoreVertical } from 'react-icons/fi';

export const ChatContainer = () => {
  const { chats, activeChatId, addMessage, updateChatTitle, isLoading, setIsLoading, clearChat, deleteChat } = useChatStore();
  const { useWebSearch } = useSettingsStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [lastAssistantMessage, setLastAssistantMessage] = useState<string | null>(null);

  const activeChat = chats.find((chat) => chat.id === activeChatId);

  const handleSendMessage = async (content: string, imageData?: string, imageAnalysis?: string) => {
    if (!activeChatId) return;

    // Add user message
    addMessage(activeChatId, {
      role: 'user',
      content,
      imageData,
      imageAnalysis,
    });

    setIsLoading(true);

    try {
      // Convert messages to Gemini format
      const messages: GeminiChatMessage[] = [
        ...activeChat?.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          imageData: msg.imageData,
          imageAnalysis: msg.imageAnalysis,
        })) || [],
        {
          role: 'user',
          content,
          imageData,
          imageAnalysis,
        },
      ];

      // Web arama özelliği açıksa
      if (useWebSearch) {
        // İlk olarak normal yanıt oluşturmaya başla
        setIsLoading(true);

        try {
          // Generate response with potential web search
          const { text, usedWebSearch } = await generateChatResponse(messages, true);

          // Eğer web araması yapıldıysa, arama durumunu güncelle
          if (usedWebSearch) {
            setIsSearching(true);
            // Kısa bir gecikme ekleyerek kullanıcıya web araması yapıldığını göster
            await new Promise(resolve => setTimeout(resolve, 1500));
            setIsSearching(false);
          }

          // Add assistant message
          addMessage(activeChatId, {
            role: 'assistant',
            content: text,
          });

          // Son asistan mesajını kaydet
          setLastAssistantMessage(text);

          // Generate title for new chats
          if (activeChat?.messages.length === 0) {
            const updatedMessages = [
              { role: 'user' as const, content },
              { role: 'assistant' as const, content: text },
            ];

            const title = await generateChatTitle(updatedMessages);
            updateChatTitle(activeChatId, title);
          }
        } catch (error) {
          console.error('Response generation error:', error);
          // Hata durumunda normal yanıt vermeye çalış
          const { text } = await generateChatResponse(messages, false);

          // Add assistant message
          addMessage(activeChatId, {
            role: 'assistant',
            content: text,
          });
        }
      } else {
        // Normal yanıt oluştur (web araması olmadan)
        const { text } = await generateChatResponse(messages, false);

        // Add assistant message
        addMessage(activeChatId, {
          role: 'assistant',
          content: text,
        });

        // Son asistan mesajını kaydet
        setLastAssistantMessage(text);

        // Generate title for new chats
        if (activeChat?.messages.length === 0) {
          const updatedMessages = [
            { role: 'user' as const, content },
            { role: 'assistant' as const, content: text },
          ];

          const title = await generateChatTitle(updatedMessages);
          updateChatTitle(activeChatId, title);
        }
      }
    } catch (error) {
      console.error('Error generating response:', error);

      // Add error message
      addMessage(activeChatId, {
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
      });
    } finally {
      // Her durumda yükleme durumlarını sıfırla
      setIsLoading(false);
      setIsSearching(false);

      // Timeout ekleyerek durumun güncellenmesini garanti altına al
      setTimeout(() => {
        setIsLoading(false);
      }, 100);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  // Bileşen yüklendiğinde isLoading durumunu sıfırla
  useEffect(() => {
    // Sayfa yüklendiğinde veya bileşen monte edildiğinde isLoading'i false yap
    setIsLoading(false);
  }, [setIsLoading]);

  // Dışa aktarma işlemi
  const handleExport = async (format: ExportFormat) => {
    if (!activeChat) return;

    setIsExporting(true);
    setShowMenu(false);

    try {
      const success = await exportChat(activeChat, format);
      if (success) {
        // Başarılı mesajı gösterilebilir
        console.log('Sohbet başarıyla dışa aktarıldı');
      }
    } catch (error) {
      console.error('Dışa aktarma hatası:', error);
      // Hata mesajı gösterilebilir
    } finally {
      setIsExporting(false);
    }
  };

  // Sohbeti temizle
  const handleClearChat = () => {
    if (!activeChatId) return;

    if (window.confirm('Bu sohbetteki tüm mesajları silmek istediğinize emin misiniz?')) {
      clearChat(activeChatId);
      setShowMenu(false);
    }
  };

  // Sohbeti sil
  const handleDeleteChat = () => {
    if (!activeChatId) return;

    if (window.confirm('Bu sohbeti tamamen silmek istediğinize emin misiniz?')) {
      deleteChat(activeChatId);
      setShowMenu(false);
    }
  };

  if (!activeChatId || !activeChat) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--chat-bg)]">
        <div className="text-center p-4">
          <h2 className="text-2xl font-semibold mb-2">AnyAssist'e Hoş Geldiniz</h2>
          <p className="text-gray-500 mb-4">
            Sohbet başlatmak için sol menüden yeni bir sohbet oluşturun.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--chat-bg)]">
      <div className="py-3 px-4 border-b border-[var(--border)] bg-[var(--chat-bg)] backdrop-blur-sm bg-opacity-90 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium truncate">{activeChat.title}</h2>
          <div className="flex items-center gap-2 relative">
            {isExporting && (
              <span className="text-xs text-gray-500 animate-pulse mr-2">Dışa aktarılıyor...</span>
            )}

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full hover:bg-[var(--secondary-hover)] transition-colors"
              aria-label="Menü"
            >
              <FiMoreVertical size={18} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-[var(--chat-bg)] border border-[var(--border)] rounded-lg shadow-lg z-20 w-48 py-1">
                <div className="px-3 py-2 border-b border-[var(--border)]">
                  <h3 className="text-sm font-medium">Dışa Aktar</h3>
                  <div className="flex mt-1 gap-1">
                    <button
                      onClick={() => handleExport('text')}
                      disabled={isExporting}
                      className="flex-1 text-xs p-1 rounded bg-[var(--secondary)] hover:bg-[var(--secondary-hover)] transition-colors disabled:opacity-50"
                    >
                      TXT
                    </button>
                    <button
                      onClick={() => handleExport('markdown')}
                      disabled={isExporting}
                      className="flex-1 text-xs p-1 rounded bg-[var(--secondary)] hover:bg-[var(--secondary-hover)] transition-colors disabled:opacity-50"
                    >
                      MD
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      disabled={isExporting}
                      className="flex-1 text-xs p-1 rounded bg-[var(--secondary)] hover:bg-[var(--secondary-hover)] transition-colors disabled:opacity-50"
                    >
                      JSON
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleClearChat}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--secondary-hover)] transition-colors flex items-center gap-2"
                >
                  <FiTrash2 size={14} className="text-gray-500" />
                  <span>Sohbeti Temizle</span>
                </button>

                <button
                  onClick={handleDeleteChat}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 transition-colors flex items-center gap-2"
                >
                  <FiTrash2 size={14} />
                  <span>Sohbeti Sil</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-smooth">
        {activeChat.messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-8 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-[var(--secondary)] flex items-center justify-center text-white mx-auto mb-6">
                <RiRobot2Line size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">AnyAssist'e Hoş Geldiniz</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Yapay zeka asistanınız ile sohbete başlamak için bir mesaj gönderin.
              </p>
              <div className="text-xs text-gray-400 dark:text-gray-500 max-w-xs mx-auto">
                <p>AnyAssist, Gemini API kullanarak yapay zeka destekli bir masaüstü asistanıdır.</p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {activeChat.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {(isLoading || isSearching) && (
              <div className="flex items-start gap-3 py-3 px-3 md:px-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-7 h-7 rounded-full bg-[var(--secondary)] flex items-center justify-center text-white">
                    <RiRobot2Line size={16} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-medium text-xs">AI Asistan</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400">
                    {isSearching ? (
                      <LoadingIndicator type="searching" />
                    ) : (
                      <LoadingIndicator type="thinking" />
                    )}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--chat-bg)] backdrop-blur-sm bg-opacity-95 sticky bottom-0 z-10 p-4 shadow-md">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <VoiceControl
              onSpeechResult={(text) => {
                if (text.trim()) {
                  handleSendMessage(text);
                }
              }}
              onSpeakText={() => {
                if (lastAssistantMessage) {
                  speechSynthesis.speak(lastAssistantMessage);
                }
              }}
              disabled={isLoading}
            />

            {isLoading && (
              <div className="text-xs text-gray-500 animate-pulse">
                {isSearching ? 'Web araması yapılıyor...' : 'Yanıt oluşturuluyor...'}
              </div>
            )}
          </div>

          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};
