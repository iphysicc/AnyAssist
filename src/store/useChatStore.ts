import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  imageData?: string; // Base64 formatında görsel verisi
  imageAnalysis?: string; // Gemini 1.5 Flash tarafından yapılan ön analiz
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  isLoading: boolean;
  createChat: () => string;
  setActiveChat: (chatId: string) => void;
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateChatTitle: (chatId: string, title: string) => void;
  deleteChat: (chatId: string) => void;
  clearChat: (chatId: string) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChatId: null,
      isLoading: false,

      createChat: () => {
        const id = crypto.randomUUID();
        const newChat: Chat = {
          id,
          title: 'Yeni Sohbet',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          chats: [newChat, ...state.chats],
          activeChatId: id,
        }));

        return id;
      },

      setActiveChat: (chatId) => {
        set({ activeChatId: chatId });
      },

      addMessage: (chatId, message) => {
        const newMessage: Message = {
          id: crypto.randomUUID(),
          ...message,
          timestamp: Date.now(),
        };

        set((state) => ({
          chats: state.chats.map((chat) => {
            if (chat.id === chatId) {
              return {
                ...chat,
                messages: [...chat.messages, newMessage],
                updatedAt: Date.now(),
              };
            }
            return chat;
          }),
        }));
      },

      updateChatTitle: (chatId, title) => {
        set((state) => ({
          chats: state.chats.map((chat) => {
            if (chat.id === chatId) {
              return {
                ...chat,
                title,
                updatedAt: Date.now(),
              };
            }
            return chat;
          }),
        }));
      },

      deleteChat: (chatId) => {
        set((state) => {
          const newChats = state.chats.filter((chat) => chat.id !== chatId);
          const newActiveChatId = state.activeChatId === chatId
            ? (newChats.length > 0 ? newChats[0].id : null)
            : state.activeChatId;

          return {
            chats: newChats,
            activeChatId: newActiveChatId,
          };
        });
      },

      clearChat: (chatId) => {
        set((state) => ({
          chats: state.chats.map((chat) => {
            if (chat.id === chatId) {
              return {
                ...chat,
                messages: [],
                updatedAt: Date.now(),
              };
            }
            return chat;
          }),
        }));
      },

      setIsLoading: (isLoading) => {
        set({ isLoading });
      },
    }),
    {
      name: 'anyassist-chats',
      partialize: (state) => ({
        chats: state.chats,
        activeChatId: state.activeChatId,
        // isLoading durumunu kaydetme, her zaman false olarak başlat
      }),
    }
  )
);
