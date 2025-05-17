import axios from 'axios';
import type { SearchResponse } from './types';

const API_URL = 'https://api.search.brave.com/res/v1/web/search';
const API_KEY = import.meta.env.VITE_BRAVE_API_KEY;

export const searchBrave = async (query: string): Promise<SearchResponse> => {
  try {
    const response = await axios.get(API_URL, {
      params: {
        q: query,
        count: 20,
      },
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching Brave:', error);
    throw error;
  }
};
