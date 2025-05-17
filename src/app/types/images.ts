export interface ImageThumbnail {
  src: string;
}

export interface ImageProperties {
  url: string;
  placeholder: string;
}

export interface ImageMetaUrl {
  scheme: string;
  netloc: string;
  hostname: string;
  favicon: string;
  path: string;
}

export interface ImageResult {
  type: 'image_result';
  title: string;
  url: string;
  source: string;
  page_fetched: string;
  thumbnail: ImageThumbnail;
  properties: ImageProperties;
  meta_url: ImageMetaUrl;
}

export interface ImageSearchQuery {
  original: string;
  altered: string;
  spellcheck_off: boolean;
  show_strict_warning: string;
}

export interface ImageSearchResponse {
  type: 'images';
  query: ImageSearchQuery;
  results: ImageResult[];
}

export interface ImageSearchParams {
  q: string;
  country?: string;
  search_lang?: string;
  count?: number;
  safesearch?: 'strict' | 'off';
  spellcheck?: boolean;
}
