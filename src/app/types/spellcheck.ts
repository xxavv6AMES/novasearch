export interface SpellcheckResponse {
  type: string;
  query: {
    original: string;
  };
  results: SpellcheckResult[];
}

export interface SpellcheckResult {
  query: string;
}
