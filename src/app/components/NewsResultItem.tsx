import { BraveNewsResult } from '../types/search';
import Image from 'next/image';

interface NewsResultItemProps {
  result: BraveNewsResult;
}

export default function NewsResultItem({ result }: NewsResultItemProps) {
  // Extract clean URL for display
  const displayUrl = `${result.meta_url.hostname}${result.meta_url.path}`.replace(/^www\./, '');
  
  // Get favicon URL if available
  const faviconUrl = result.meta_url.favicon;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Prevent navigation if the click was on a child element that should handle its own click
    if ((e.target as HTMLElement).tagName === 'A') {
      e.stopPropagation();
    }
  };

  // Function to safely render HTML for <strong> tags only
  const renderDescription = (description: string) => {
    // Simple regex to only allow <strong> tags
    const sanitizedHtml = description.replace(
      /<(?!strong|\/strong)[^>]+>/g, 
      ''
    );
    
    return { __html: sanitizedHtml };
  };

  // Format the age/time
  const formatAge = (age?: string) => {
    if (!age) return null;
    // If age is in a format like "2h" or "1d", return as is
    // Otherwise try to format it nicely
    return age;
  };

  return (
    <div className="group p-4 rounded-lg border-2 border-gray-100 dark:border-gray-800 
                   hover:border-blue-500/20 dark:hover:border-blue-400/20 transition-all 
                   hover:shadow-lg hover:shadow-blue-500/5 dark:hover:shadow-blue-400/5">
      <a href={result.url} 
         target="_blank" 
         rel="noopener noreferrer" 
         onClick={handleClick}
         className="block cursor-pointer">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {faviconUrl && (
              <div className="shrink-0 w-4 h-4 relative">
                <Image 
                  src={faviconUrl}
                  alt=""
                  width={16}
                  height={16}
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
            <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400 
                         group-hover:text-blue-500 dark:group-hover:text-blue-300 
                         transition-colors font-grotesk line-clamp-2">
              {result.title}
            </h2>
          </div>
          {result.breaking && (
            <span className="shrink-0 px-2 py-1 text-xs font-bold bg-red-100 text-red-800 
                           dark:bg-red-900/20 dark:text-red-400 rounded-full">
              BREAKING
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
            {displayUrl}
          </p>
          {result.age && (
            <>
              <span className="text-gray-400 dark:text-gray-600">•</span>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {formatAge(result.age)}
              </p>
            </>
          )}
        </div>
        
        <p 
          className="text-sm text-gray-800 dark:text-gray-200 
                   transition-colors line-clamp-3"
          dangerouslySetInnerHTML={renderDescription(result.description)}
        />
      </a>
    </div>
  );
}
