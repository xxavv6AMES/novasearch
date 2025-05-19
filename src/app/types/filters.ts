export interface SearchFilters {
  safesearch: 'strict' | 'moderate' | 'off';
  country?: string;
  search_lang?: string;
  type?: 'web' | 'news' | 'videos' | 'images';
  freshness?: 'past_hour' | 'past_day' | 'past_week' | 'past_month' | 'past_year';
  _timestamp?: string; // Added to support cache busting
}

export const defaultFilters: SearchFilters = {
  safesearch: 'moderate',
};
