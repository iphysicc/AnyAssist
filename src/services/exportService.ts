"use client";
import { Chat, Message } from '@/store/useChatStore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export type ExportFormat = 'text' | 'markdown' | 'json';

export async function exportChat(chat: Chat, format: ExportFormat): Promise<boolean> {
  try {
    // Dosya adı için sohbet başlığını ve tarihi kullan
    const dateStr = new Intl.DateTimeFormat('tr', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit'
    }).format(new Date()).split('.').join('-');
    const sanitizedTitle = chat.title.replace(/[\\/:*?"<>|]/g, '_');
    const defaultFileName = `${sanitizedTitle}_${dateStr}`;

    // Dosya uzantısını belirle
    const extension = format === 'text' ? 'txt' : format === 'markdown' ? 'md' : 'json';

    // Seçilen formata göre içeriği oluştur
    const content = formatChatContent(chat, format);

    // Dosyayı indirme işlemi için blob oluştur
    const blob = new Blob([content], {
      type: format === 'json'
        ? 'application/json'
        : 'text/plain'
    });

    // Dosyayı indirme bağlantısı oluştur
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${defaultFileName}.${extension}`;

    // Bağlantıyı tıkla ve temizle
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Dışa aktarma hatası:', error);
    throw new Error('Sohbet dışa aktarılırken bir hata oluştu.');
  }
}

function formatChatContent(chat: Chat, format: ExportFormat): string {
  switch (format) {
    case 'text':
      return formatAsText(chat);
    case 'markdown':
      return formatAsMarkdown(chat);
    case 'json':
      return formatAsJSON(chat);
    default:
      return formatAsText(chat);
  }
}

function formatAsText(chat: Chat): string {
  let content = `Sohbet: ${chat.title}\n`;
  content += `Tarih: ${format(new Date(chat.createdAt), 'PPP', { locale: tr })}\n\n`;

  chat.messages.forEach((message) => {
    const time = format(new Date(message.timestamp), 'HH:mm', { locale: tr });
    const sender = message.role === 'user' ? 'Sen' : 'AI Asistan';

    content += `[${time}] ${sender}:\n${message.content}\n\n`;
  });

  return content;
}

function formatAsMarkdown(chat: Chat): string {
  let content = `# ${chat.title}\n\n`;
  content += `*Oluşturulma Tarihi: ${format(new Date(chat.createdAt), 'PPP', { locale: tr })}*\n\n`;

  chat.messages.forEach((message) => {
    const time = format(new Date(message.timestamp), 'HH:mm', { locale: tr });
    const sender = message.role === 'user' ? '**Sen**' : '**AI Asistan**';

    content += `### ${sender} (${time})\n\n`;

    // AI mesajlarını markdown olarak koru, kullanıcı mesajlarını kod bloğuna al
    if (message.role === 'user') {
      content += `\`\`\`\n${message.content}\n\`\`\`\n\n`;
    } else {
      content += `${message.content}\n\n`;
    }
  });

  content += `---\n*AnyAssist ile oluşturuldu*`;

  return content;
}

function formatAsJSON(chat: Chat): string {
  // Sohbeti JSON formatına dönüştür
  const exportData = {
    title: chat.title,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    messages: chat.messages.map((message: Message) => ({
      role: message.role,
      content: message.content,
      timestamp: message.timestamp
    }))
  };

  return JSON.stringify(exportData, null, 2);
}
