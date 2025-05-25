"use client";
import React from 'react';
import { FiSearch } from 'react-icons/fi';

interface LoadingIndicatorProps {
  type: 'thinking' | 'searching';
  message?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  type,
  message = type === 'thinking' ? 'Yanıt hazırlanıyor...' : 'Web\'de aranıyor...'
}) => {
  // useEffect ile bileşen monte edildiğinde konsola log yazalım (debug için)
  React.useEffect(() => {
    console.log(`LoadingIndicator mounted: ${type}`);

    // Bileşen kaldırıldığında
    return () => {
      console.log(`LoadingIndicator unmounted: ${type}`);
    };
  }, [type]);

  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-[var(--secondary)] bg-opacity-50 text-sm">
      {type === 'thinking' ? (
        <div className="h-4 w-4 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin"></div>
      ) : (
        <FiSearch className="text-[var(--primary)] animate-pulse" size={16} />
      )}
      <span>{message}</span>
    </div>
  );
};
