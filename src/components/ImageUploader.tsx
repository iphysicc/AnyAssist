"use client";
import { useState, useRef } from 'react';
import { FiUpload, FiX, FiImage } from 'react-icons/fi';

interface ImageUploaderProps {
  onImageSelect: (imageData: string) => void;
  onClear: () => void;
  isLoading?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageSelect, 
  onClear,
  isLoading = false 
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file: File) => {
    // Sadece resim dosyalarını kabul et
    if (!file.type.startsWith('image/')) {
      alert('Lütfen sadece resim dosyaları yükleyin.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
      onImageSelect(result);
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClear();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mb-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {!previewUrl ? (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200 flex flex-col items-center justify-center
            ${isDragging 
              ? 'border-[var(--primary)] bg-[var(--primary-hover)] bg-opacity-10' 
              : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--secondary-hover)]'
            }
          `}
        >
          <FiImage size={32} className="mb-2 text-[var(--primary)]" />
          <p className="font-medium mb-1">Resim Yükle</p>
          <p className="text-sm text-gray-500">
            Analiz edilecek bir resim sürükleyin veya tıklayarak seçin
          </p>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-[var(--border)]">
          <img 
            src={previewUrl} 
            alt="Yüklenen resim" 
            className="w-full object-contain max-h-[300px]" 
          />
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
            </div>
          )}
          {!isLoading && (
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 p-1 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-opacity"
              aria-label="Resmi kaldır"
            >
              <FiX size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
