'use client';

import { useEffect, useCallback } from 'react';
import { ImageResult } from '../types/images';

interface ImageViewerProps {
  image: ImageResult | null;
  onClose: () => void;
}

export default function ImageViewer({ image, onClose }: ImageViewerProps) {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [handleEscape]);

  if (!image) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-gray-900 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                   dark:hover:text-gray-200 z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="h-full overflow-y-auto">
          {/* Image Section */}
          <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-800">
            <img
              src={image.properties.url}
              alt={image.title}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </div>

          {/* Info Section */}
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {image.title}
              </h2>
              <a 
                href={image.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 
                         dark:hover:text-blue-300 flex items-center gap-2"
              >
                <img 
                  src={image.meta_url.favicon} 
                  alt="" 
                  className="w-4 h-4"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/globe.svg';
                  }}
                />
                {image.source}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </a>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-medium text-gray-500 dark:text-gray-400">Source URL</h3>
                <p className="mt-1 text-gray-900 dark:text-gray-100 break-all">{image.meta_url.hostname}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-500 dark:text-gray-400">Last Fetched</h3>
                <p className="mt-1 text-gray-900 dark:text-gray-100">
                  {new Date(image.page_fetched).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-500 dark:text-gray-400">Image URL</h3>
                <p className="mt-1 text-gray-900 dark:text-gray-100 break-all">{image.properties.url}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <a
                href={image.properties.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 
                         dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 
                         dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 
                         dark:hover:bg-gray-700 focus:outline-none focus:ring-2 
                         focus:ring-offset-2 focus:ring-blue-500"
              >
                View Original
              </a>
              <a
                href={image.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent 
                         rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Visit Website
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
