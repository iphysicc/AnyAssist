"use client";
import React from 'react';
import { FiDownload } from 'react-icons/fi';

interface UpdateProgressProps {
  progress: number;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  text?: string;
}

const UpdateProgress: React.FC<UpdateProgressProps> = ({
  progress,
  size = 'medium',
  showText = true,
  text
}) => {
  const sizeClass = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8',
  };

  const progressText = text || `İndiriliyor... ${progress.toFixed(0)}%`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <div className={`animate-spin rounded-full border-2 border-[var(--secondary)] ${sizeClass[size]}`}></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <FiDownload size={size === 'small' ? 10 : size === 'medium' ? 14 : 18} className="text-[var(--primary)]" />
        </div>
      </div>
      
      <div className="w-full max-w-xs">
        <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
          <div 
            className="bg-[var(--primary)] h-1.5 rounded-full" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {showText && (
          <div className="text-xs text-center mt-1 text-gray-500 dark:text-gray-400">
            {progressText}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateProgress;
