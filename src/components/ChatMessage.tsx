"use client";
import { useState } from 'react';
import { Message } from '@/store/useChatStore';
import { FiUser, FiCopy, FiThumbsUp, FiThumbsDown, FiVolume2 } from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);

  // Mesaj zamanını formatla - saat:dakika formatında
  const formattedTime = format(new Date(message.timestamp), 'HH:mm', { locale: tr });

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = () => {
    setLiked(true);
  };

  const handleDislike = () => {
    setLiked(false);
  };

  return (
    <div className={`group flex items-start gap-3 py-3 px-3 md:px-4 transition-colors duration-200`}>
      <div className="flex-shrink-0 mt-1">
        {isUser ? (
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white">
            <FiUser size={14} />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full bg-[var(--secondary)] flex items-center justify-center text-white">
            <RiRobot2Line size={16} />
          </div>
        )}
      </div>

      <div className="flex-1 max-w-[calc(100%-2.5rem)]">
        <div className="flex items-center gap-2 mb-1">
          <div className="font-medium text-xs">
            {isUser ? 'Sen' : 'AI Asistan'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {formattedTime}
          </div>
        </div>

        {/* Görsel varsa göster */}
        {isUser && message.imageData && (
          <div className="mb-2">
            <div className="rounded-lg overflow-hidden border border-[var(--border)] max-w-xs">
              <img
                src={message.imageData}
                alt="Kullanıcı tarafından paylaşılan görsel"
                className="w-full object-contain max-h-[200px]"
              />
            </div>
            {message.imageAnalysis && (
              <div className="mt-1 text-xs text-gray-300 italic">
                <span className="font-medium">Görsel Analizi (Gemini 1.5 Flash):</span> {message.imageAnalysis}
              </div>
            )}
          </div>
        )}

        <div className={`rounded-lg p-2.5 ${
          isUser
            ? 'bg-[var(--message-user-bg)] text-white font-semibold'
            : 'bg-[var(--message-ai-bg)]'
        } w-full overflow-hidden`}>
          <div className={`${isUser ? 'text-white' : 'text-gray-800 dark:text-gray-100'} text-sm leading-normal break-words prose prose-sm max-w-none`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
              components={{
                code: ({node, inline, className, children, ...props}: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <div className="relative group">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                          // Kopyalandı bildirimi gösterilebilir
                        }}
                        className="absolute top-2 right-2 p-1 rounded bg-gray-700 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Kodu kopyala"
                      >
                        <FiCopy size={14} />
                      </button>
                      <SyntaxHighlighter
                        // @ts-ignore
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{
                          fontSize: '0.85rem',
                          borderRadius: '0.375rem',
                          maxWidth: '100%',
                          overflowX: 'auto',
                          padding: '1rem',
                          marginTop: '0.5rem',
                          marginBottom: '0.5rem'
                        }}
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code
                      className={`${inline ? 'px-1 py-0.5 rounded text-xs font-mono' : ''} ${
                        isUser ? 'bg-blue-900' : 'bg-[var(--secondary-hover)]'
                      }`}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                p: ({children}: any) => <p className="my-2 break-words">{children}</p>,
                ul: ({children}: any) => <ul className="list-disc pl-5 my-2">{children}</ul>,
                ol: ({children}: any) => <ol className="list-decimal pl-5 my-2">{children}</ol>,
                li: ({children}: any) => <li className="my-1">{children}</li>,
                a: ({href, children}: any) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`underline ${isUser ? 'text-blue-200' : 'text-blue-500'} hover:opacity-80 break-all`}
                  >
                    {children}
                  </a>
                ),
                blockquote: ({children}: any) => (
                  <blockquote className={`border-l-4 ${
                    isUser ? 'border-blue-400' : 'border-gray-400'
                  } pl-3 my-3 italic`}>
                    {children}
                  </blockquote>
                ),
                h1: ({children}: any) => <h1 className="text-lg font-bold my-3">{children}</h1>,
                h2: ({children}: any) => <h2 className="text-base font-bold my-2">{children}</h2>,
                h3: ({children}: any) => <h3 className="text-sm font-bold my-2">{children}</h3>,
                pre: ({children}: any) => <pre className="max-w-full overflow-x-auto my-3 bg-transparent">{children}</pre>,
                table: ({children}: any) => (
                  <div className="overflow-x-auto my-3">
                    <table className="min-w-full border border-gray-300 dark:border-gray-700">
                      {children}
                    </table>
                  </div>
                ),
                th: ({children}: any) => (
                  <th className="border border-gray-300 dark:border-gray-700 px-3 py-1 bg-gray-100 dark:bg-gray-800">
                    {children}
                  </th>
                ),
                td: ({children}: any) => (
                  <td className="border border-gray-300 dark:border-gray-700 px-3 py-1">
                    {children}
                  </td>
                )
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {!isUser && (
          <div className="mt-1.5 flex items-center gap-1">
            <button
              onClick={handleLike}
              className={`p-1 rounded-full hover:bg-[var(--secondary-hover)] transition-colors ${liked === true ? 'text-green-500' : 'text-gray-400'}`}
              title="Beğen"
            >
              <FiThumbsUp size={12} />
            </button>
            <button
              onClick={handleDislike}
              className={`p-1 rounded-full hover:bg-[var(--secondary-hover)] transition-colors ${liked === false ? 'text-red-500' : 'text-gray-400'}`}
              title="Beğenme"
            >
              <FiThumbsDown size={12} />
            </button>
            <button
              onClick={handleCopy}
              className="p-1 rounded-full hover:bg-[var(--secondary-hover)] transition-colors text-gray-400"
              title={copied ? "Kopyalandı!" : "Kopyala"}
            >
              <FiCopy size={12} />
            </button>
            <button
              className="p-1 rounded-full hover:bg-[var(--secondary-hover)] transition-colors text-gray-400"
              title="Sesli oku"
            >
              <FiVolume2 size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
