import { BraveSearchResult } from '../types/search';

interface SearchResultItemProps {
  result: BraveSearchResult;
}

export default function SearchResultItem({ result }: SearchResultItemProps) {
  // Extract clean URL for display
  const displayUrl = `${result.meta_url.hostname}${result.meta_url.path}`.replace(/^www\./, '');

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Prevent navigation if the click was on a child element that should handle its own click
    if ((e.target as HTMLElement).tagName === 'A') {
      e.stopPropagation();
    }
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
        <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400 
                     group-hover:text-blue-500 dark:group-hover:text-blue-300 
                     transition-colors mb-1 font-grotesk line-clamp-1">
          {result.title}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 
                    transition-colors line-clamp-1">
          {displayUrl}
        </p>
        <p className="text-sm text-gray-800 dark:text-gray-200 
                    transition-colors line-clamp-2">
          {result.description}
        </p>
      </a>
    </div>
  );
}
