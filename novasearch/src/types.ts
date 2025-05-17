interface SearchResult {
  url: string;
  title: string;
  description: string;
}

interface SearchResponse {
  web: {
    results: SearchResult[];
    total: number;
  };
  query: {
    original: string;
  };
}

export type { SearchResult, SearchResponse };
