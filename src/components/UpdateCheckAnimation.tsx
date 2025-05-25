'use client';

import React, { useState, useEffect } from 'react';
import { FiRefreshCw } from 'react-icons/fi';

interface UpdateCheckAnimationProps {
  message?: string;
}

const UpdateCheckAnimation: React.FC<UpdateCheckAnimationProps> = ({
  message = 'Güncellemeler denetleniyor...'
}) => {
  const [subMessage, setSubMessage] = useState('Sunucuya bağlanılıyor');
  
  // Değişen alt mesajlar için useEffect kullanın
  useEffect(() => {
    const messages = [
      'Sunucuya bağlanılıyor',
      'Versiyon bilgisi alınıyor',
      'Yeni sürüm kontrol ediliyor',
      'Değişiklikler denetleniyor'
    ];
    
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % messages.length;
      setSubMessage(messages[currentIndex]);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full flex flex-col items-center">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-[var(--secondary)] border-opacity-50"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--primary)] animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <FiRefreshCw className="text-[var(--primary)] animate-pulse" size={22} />
          </div>
        </div>
        
        <h3 className="text-lg font-semibold mb-2 dark:text-white text-center">{message}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 text-center">{subMessage}</p>
        
        <div className="flex items-center justify-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          <span className="inline-block w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="inline-block w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="inline-block w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </div>
      </div>
    </div>
  );
};

export default UpdateCheckAnimation; 