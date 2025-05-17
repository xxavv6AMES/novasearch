import { ImageResult } from '@/app/types/images';

interface ImageResultItemProps {
  result: ImageResult;
  onClick?: (image: ImageResult) => void;
}

export default function ImageResultItem({ result, onClick }: ImageResultItemProps) {
  return (
    <div 
      className="group relative overflow-hidden rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onClick?.(result)}
    >
      <div className="block aspect-square relative overflow-hidden">
        <div className="relative w-full h-full">
          {/* Main image with placeholder background */}
          <img
            src={result.properties.url}
            alt={result.title}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
            style={{ 
              backgroundImage: result.properties.placeholder ? `url(${result.properties.placeholder})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
            loading="lazy"
          />
        </div>
        
        {/* Overlay with image info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-white text-sm font-medium truncate">{result.title}</h3>
          <p className="text-white/80 text-xs truncate">{result.source}</p>
        </div>
      </div>
    </div>
  );
}
