import { BraveSearchResponse } from '../types/search';

interface ChatHistory {
  input: string;
  response: string;
}

interface ChatResponse {
  response: string;
  history: ChatHistory[];
}

interface AstroResponse {
  overview: string;
  error?: string;
}

export class LimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LimitError';
  }
}

export const retryLastMessage = async (
  history: ChatHistory[]
): Promise<ChatResponse> => {
  if (history.length === 0) {
    throw new Error('No message to retry');
  }
  
  const lastMessage = history[history.length - 1];
  const newHistory = history.slice(0, -1);
  
  return sendMessage(lastMessage.input, newHistory);
};

export const sendMessage = async (
  message: string, 
  history: ChatHistory[] = [],
  searchResults?: BraveSearchResponse
): Promise<ChatResponse> => {
  try {
    if (!message || message.trim() === '') {
      throw new Error('Message cannot be empty');
    }

    let searchContext: { title: string; link: string; snippet: string; }[] = [];
    
    if (searchResults && searchResults.web.results.length > 0) {
      searchContext = searchResults.web.results.slice(0, 5).map(result => ({
        title: result.title,
        link: result.url,
        snippet: result.description
      }));
    }    // Convert history to the format expected by the API
    const recentHistory = history.slice(-7);
    const historyForAPI = recentHistory
      .filter(item => item.input && item.input.trim() && item.response && item.response.trim())
      .map(item => [
        { role: 'user', content: item.input.trim() },
        { role: 'assistant', content: item.response.trim() }
      ]).flat();

    // Create context for Astro with search results
    let contextWithSearch = "You are Astro, a helpful AI search assistant created by xxavvTechnologies and Nova Suite. You provide concise, informative summaries of search results. Extract key information and offer useful insights. Be aware that you may have various results from different sources that are completely different topics, so use your best judgment to summarize and categorize/separate them accordingly. Feel free to use markdown formatting for clarity.";
    
    if (searchContext.length > 0) {
      contextWithSearch += '\n\nSearch Results:\n';
      searchContext.forEach((result, index) => {
        contextWithSearch += `\n[${index + 1}] "${result.title}"\nURL: ${result.link}\nDescription: ${result.snippet}\n`;
      });
      contextWithSearch += '\n\nPlease use these search results to provide an informed response to the user query.';
    }

    const requestBody = {
      message: message.trim(),
      context: contextWithSearch,
      history: historyForAPI
    };

    console.log('Sending to API:', JSON.stringify(requestBody, null, 2));    const apiUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || process.env.API_GATEWAY_URL;
    if (!apiUrl) {
      throw new Error('API Gateway URL not configured');
    }

    const response = await fetch(`${apiUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      let errorData: { message?: string };
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: `HTTP ${response.status}: ${errorText}` };
      }
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
      const data: unknown = await response.json();
    console.log('API Response:', data);
    
    // Handle AWS API Gateway Lambda response format
    let responseData: { generated_text?: string } = {};
    if (data && typeof data === 'object' && 'statusCode' in data && 'body' in data) {
      // Parse the stringified body from Lambda
      try {
        responseData = JSON.parse((data as { body: string }).body);
      } catch (parseError) {
        console.error('Failed to parse Lambda response body:', parseError);
        throw new Error('Invalid response format from API');
      }
    } else {
      responseData = data as { generated_text?: string };
    }
    
    if (!responseData?.generated_text) {
      console.error('Unexpected response format:', responseData);
      throw new Error('Invalid response from API');
    }

    const newHistory = [...history, { input: message, response: responseData.generated_text }];
    
    return {
      response: responseData.generated_text,
      history: newHistory
    };  } catch (error: unknown) {
    if (error instanceof LimitError) {
      throw error;
    }
    console.error('Chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
    throw new Error(errorMessage);
  }
};

// Legacy function for backward compatibility with existing generateOverview calls
export async function generateOverview(query: string, searchResults: BraveSearchResponse): Promise<AstroResponse> {
  try {
    const response = await sendMessage(query, [], searchResults);
    return {
      overview: response.response,
    };  } catch (error: unknown) {
    console.error('Error generating overview:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate overview';
    return {
      overview: '',
      error: errorMessage
    };
  }
}
