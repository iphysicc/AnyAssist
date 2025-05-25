"use client";
import { useChatStore, Chat } from '@/store/useChatStore';
import { FiPlus, FiMessageSquare, FiTrash2, FiSettings, FiImage, FiMic } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export const Sidebar = () => {
  const { chats, activeChatId, createChat, setActiveChat, deleteChat } = useChatStore();
  const router = useRouter();

  const handleNewChat = () => {
    createChat();
  };

  const handleChatSelect = (chatId: string) => {
    setActiveChat(chatId);
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    deleteChat(chatId);
  };

  const handleSettingsClick = () => {
    router.push('/settings');
  };

  const handleImageAnalysisClick = () => {
    router.push('/image-analysis');
  };

  const handleVoiceAssistantClick = () => {
    router.push('/voice-assistant');
  };

  return (
    <div className="h-full flex flex-col bg-[var(--sidebar-bg)] border-r border-[var(--border)]">
      <div className="p-4 flex items-center justify-end border-b border-[var(--border)] bg-[var(--sidebar-bg)] sticky top-0 z-10">
        <button
          onClick={handleNewChat}
          className="p-2 rounded-full hover:bg-[var(--secondary-hover)] transition-colors"
          aria-label="Yeni sohbet"
        >
          <FiPlus size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {chats.length === 0 ? (
          <div className="text-center p-6 text-gray-500 mt-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--secondary)] flex items-center justify-center">
              <FiMessageSquare size={24} className="text-gray-400" />
            </div>
            <p className="font-medium mb-2">Henüz sohbet yok</p>
            <p className="text-sm">Yeni bir sohbet başlatmak için + butonuna tıklayın</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {chats.map((chat: Chat) => (
              <li
                key={chat.id}
                onClick={() => handleChatSelect(chat.id)}
                className={`
                  p-3 rounded-lg cursor-pointer flex items-center justify-between group
                  ${activeChatId === chat.id
                    ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] text-white shadow-md'
                    : 'hover:bg-[var(--secondary-hover)]'}
                  transition-all duration-200
                `}
              >
                <div className="flex items-center space-x-3 truncate">
                  <FiMessageSquare size={18} />
                  <span className="truncate font-medium">{chat.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  className={`p-1.5 rounded-full transition-all duration-200 ${
                    activeChatId === chat.id
                      ? 'opacity-70 hover:opacity-100 hover:bg-red-500 hover:text-white'
                      : 'opacity-0 group-hover:opacity-70 hover:opacity-100 hover:bg-[var(--secondary)] text-gray-500'
                  }`}
                  aria-label="Sohbeti sil"
                >
                  <FiTrash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-4 border-t border-[var(--border)] bg-[var(--sidebar-bg)] sticky bottom-0 z-10 space-y-3">
        <button
          onClick={handleImageAnalysisClick}
          className="w-full p-3 rounded-lg flex items-center justify-center gap-2 bg-[var(--secondary)] hover:bg-[var(--secondary-hover)] transition-colors shadow-sm"
          aria-label="Görsel Analiz"
        >
          <FiImage size={18} />
          <span className="font-medium">Görsel Analiz</span>
        </button>

        <button
          onClick={handleVoiceAssistantClick}
          className="w-full p-3 rounded-lg flex items-center justify-center gap-2 bg-[var(--secondary)] hover:bg-[var(--secondary-hover)] transition-colors shadow-sm"
          aria-label="Sesli Asistan"
        >
          <FiMic size={18} />
          <span className="font-medium">Sesli Asistan</span>
        </button>

        <button
          onClick={handleSettingsClick}
          className="w-full p-3 rounded-lg flex items-center justify-center gap-2 bg-[var(--secondary)] hover:bg-[var(--secondary-hover)] transition-colors shadow-sm"
          aria-label="Ayarlar"
        >
          <FiSettings size={18} />
          <span className="font-medium">Ayarlar</span>
        </button>
      </div>
    </div>
  );
};



