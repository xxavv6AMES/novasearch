export interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  meta_url: {
    scheme: string;
    hostname: string;
    path: string;
    favicon?: string;
  };
  family_friendly: boolean;
  is_navigational: boolean;
  rank: number;
  deep_results: Array<{
    type: string;
    [key: string]: unknown;
  }>;
}

export interface BraveNewsResult {
  title: string;
  url: string;
  description: string;
  meta_url: {
    scheme: string;
    hostname: string;
    path: string;
    favicon?: string;
  };
  age?: string;
  breaking: boolean;
  page_age?: string;
  page_fetched?: string;
}

export interface BraveSearchResponse {
  type: string;
  web: {
    results: BraveSearchResult[];
    total: number;
  };
  query: {
    original: string;
    show_strict_warning: boolean;
  };
  mixed: boolean;
}

export interface BraveNewsResponse {
  type: string;
  news: {
    results: BraveNewsResult[];
    total: number;
  };
  query: {
    original: string;
    show_strict_warning: boolean;
  };
  mixed: boolean;
}
