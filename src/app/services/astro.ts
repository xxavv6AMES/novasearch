// filepath: d:\.d6\hi\novasearch\src\app\services\astro.ts
import { BraveSearchResponse } from '../types/search';

/**
 * Common configuration
 */
const NLPCLOUD_MODEL = 'finetuned-llama-3-70b';

/**
 * Interface definitions
 */
interface AstroResponse {
  overview: string;
  error?: string;
}

interface StreamingOptions {
  onToken: (token: string) => void;
  onComplete: () => void;
  onError: (error: string) => void;
}

/**
 * Helper functions
 */
function prepareSearchContext(searchResults: BraveSearchResponse) {
  // Extract relevant information from search results - use more results for better context
  return searchResults.web.results.slice(0, 5).map(result => ({
    title: result.title,
    description: result.description,
    url: result.url
  }));
}

function getApiUrl(enableGpu: boolean = false): string {
  // Get API URL with optional GPU acceleration
  const gpuPrefix = enableGpu ? 'gpu/' : '';
  return `https://api.nlpcloud.io/v1/${gpuPrefix}${NLPCLOUD_MODEL}/chatbot`;
}

function createRequestPayload(query: string, context: Array<{title: string; description: string; url: string}>, streaming: boolean = false) {
  // Create consistent request payload for both streaming and non-streaming requests
  return {
    input: `I'm looking for information about "${query}". Please provide a helpful summary of these search results.`,
    context: `This is a conversation between a human and an AI search assistant named Astro. The human is looking for information on search results, and Astro provides concise, informative summaries. 
    
Astro should extract key information and offer useful insights. Use proper HTML formatting for structure and emphasis:
- Use <h2> for section headings
- Use <strong> tags to highlight important terms and key concepts
- Use <ul> and <li> for lists
- Use <p> tags for paragraphs
- Use <a> tags for links

Make sure all HTML tags are properly closed and well-formed. Do not use unusual Unicode characters or symbols. 
Be aware that you may have various results from different sources that are completely different topics so use your best judgment to summarize and categorize/separate them accordingly.`,
    history: [
      {
        input: "Here are some search results to summarize:",
        response: "I'll provide a concise summary of these results."
      },
      {
        input: `${context.map((r, index) => 
          `[${index + 1}] Title: ${r.title}\nDescription: ${r.description}\nURL: ${r.url}\n`
        ).join('\n')}`,
        response: "Now I'll create a helpful summary focusing on the key points from these search results."
      }
    ],
    ...(streaming ? { stream: true } : {})
  };
}

function formatResponseText(responseText: string): string {
  // Format the response for better readability
  let formattedText = responseText.replace(/\n{3,}/g, '\n\n'); // Replace excessive newlines
  
  // Fix character encoding and malformed HTML tags (like <�strong>)
  formattedText = formattedText
    // Fix common encoding issues (this could be expanded based on observed errors)
    .replace(/[\uFFFD\u00A0\u2026\u2013\u2014\u2018\u2019\u201C\u201D\u2022]/g, match => {
      // Map Unicode characters to ASCII equivalents
      const replacements: Record<string, string> = {
        '\uFFFD': '', // Replacement character (�)
        '\u00A0': ' ', // Non-breaking space
        '\u2026': '...', // Ellipsis
        '\u2013': '-', // En dash
        '\u2014': '--', // Em dash
        '\u2018': '\'', // Left single quote
        '\u2019': '\'', // Right single quote
        '\u201C': '"', // Left double quote
        '\u201D': '"', // Right double quote
        '\u2022': '*', // Bullet
      };
      return replacements[match] || '';
    })
    // Fix broken HTML tags
    .replace(/<�(\w+)>/g, '<$1>') // Fix opening tags
    .replace(/<\/�(\w+)>/g, '</$1>') // Fix closing tags
    .replace(/�/g, '') // Remove any remaining � characters
    // Fix broken/partial HTML tags
    .replace(/<([a-zA-Z]+)(?![^>]*\/>)[^>]*>(?:(?!<\/\1>)[\s\S])*$/, '') // Remove unclosed opening tags
    .replace(/^[^<]*<\/([a-zA-Z]+)>/, ''); // Remove closing tags without openers
    
  // Ensure HTML tags are properly formatted
  // Convert known markdown patterns to HTML if not already HTML
  if (!formattedText.includes('<h1>') && !formattedText.includes('<h2>')) {
    // Convert markdown headers
    formattedText = formattedText
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  }
  
  // Convert markdown bold/italic if not already HTML
  if (!formattedText.includes('<strong>') && !formattedText.includes('<em>')) {
    formattedText = formattedText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>');
  }
  
  // Convert markdown bullet points if not already HTML
  if (!formattedText.includes('<ul>') && !formattedText.includes('<li>')) {    // First identify lists
    const lines = formattedText.split('\n');
    let inList = false;
    const result = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^[\s]*[-*][\s]+/)) {
        // This is a list item
        if (!inList) {
          inList = true;
          result.push('<ul>');
        }
        result.push(`<li>${line.replace(/^[\s]*[-*][\s]+/, '')}</li>`);
      } else {
        if (inList) {
          inList = false;
          result.push('</ul>');
        }
        result.push(line);
      }
    }
    
    if (inList) {
      result.push('</ul>');
    }
    
    formattedText = result.join('\n');
  }
  
  // Convert plain URLs to clickable links
  formattedText = formattedText.replace(/(https?:\/\/[^\s<]+)/g, 
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#9e00ff] underline">$1</a>');
  
  // Add paragraph tags for better formatting if not already present
  if (!formattedText.includes('<p>')) {
    formattedText = formattedText
      .split('\n\n')
      .filter(p => p.trim() !== '') // Remove empty paragraphs
      .map((p: string) => {
        // Don't wrap content that's already in HTML tags
        if (p.trim().startsWith('<') && p.trim().endsWith('>')) {
          return p;
        }
        return `<p>${p}</p>`;
      })
      .join('');
  }
  
  // Fix any unclosed tags
  const openTags = formattedText.match(/<([a-z][a-z0-9]*)[^>]*>/gi) || [];
  const closedTags = formattedText.match(/<\/([a-z][a-z0-9]*)>/gi) || [];
  
  // Create a map of tags that need to be closed
  const tagMap: Record<string, number> = {};
  
  openTags.forEach(tag => {
    const tagName = tag.match(/<([a-z][a-z0-9]*)/i)?.[1]?.toLowerCase() || '';
    if (tagName && !['br', 'hr', 'img', 'input', 'meta', 'link'].includes(tagName)) {
      tagMap[tagName] = (tagMap[tagName] || 0) + 1;
    }
  });
  
  closedTags.forEach(tag => {
    const tagName = tag.match(/<\/([a-z][a-z0-9]*)/i)?.[1]?.toLowerCase() || '';
    if (tagName) {
      tagMap[tagName] = (tagMap[tagName] || 0) - 1;
    }
  });
  
  // Close any unclosed tags
  let unclosedTags = '';
  Object.entries(tagMap).forEach(([tag, count]) => {
    for (let i = 0; i < count; i++) {
      unclosedTags = `</${tag}>${unclosedTags}`;
    }
  });
  
  if (unclosedTags) {
    formattedText += unclosedTags;
  }
  
  return formattedText;
}

/**
 * Main exported functions
 */
export async function generateOverview(query: string, searchResults: BraveSearchResponse): Promise<AstroResponse> {
  // Check if API key is configured
  const NLPCLOUD_API_KEY = process.env.NLPCLOUD_API_KEY;
  if (!NLPCLOUD_API_KEY) {
    return {
      overview: '',
      error: 'NLPCloud API key is not configured'
    };
  }

  // Prepare search context
  const context = prepareSearchContext(searchResults);
  
  // Handle case with no search results
  if (context.length === 0) {
    return {
      overview: '',
      error: 'No search results found for this query'
    };
  }

  try {
    // Make API request
    const apiUrl = getApiUrl(true); // Use GPU endpoint
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NLPCLOUD_API_KEY}`
      },
      body: JSON.stringify(createRequestPayload(query, context)),
      cache: 'no-cache'
    });

    // Handle API errors
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('API error response:', errorText);
      throw new Error(`NLPCloud API error: ${apiResponse.statusText}`);
    }
    
    // Parse response
    let data;
    try {
      data = await apiResponse.json();
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      const responseText = await apiResponse.text();
      console.error('Raw response:', responseText);
      throw new Error('Failed to parse API response');
    }
    
    // Check for missing response
    if (!data.response) {
      throw new Error('NLPCloud API did not return a response');
    }
    
    // Format and return the response
    return {
      overview: formatResponseText(data.response)
    };
  } catch (error) {
    console.error('Error generating overview:', error);
    return {
      overview: '',
      error: error instanceof Error ? error.message : 'Failed to generate overview'
    };
  }
}

export async function generateOverviewStreaming(
  query: string, 
  searchResults: BraveSearchResponse, 
  streamingOptions: StreamingOptions
): Promise<void> {
  // Check if API key is configured
  const NLPCLOUD_API_KEY = process.env.NLPCLOUD_API_KEY;
  if (!NLPCLOUD_API_KEY) {
    streamingOptions.onError('NLPCloud API key is not configured');
    return;
  }

  // Prepare search context
  const context = prepareSearchContext(searchResults);
  
  // Handle case with no search results
  if (context.length === 0) {
    streamingOptions.onError('No search results found for this query');
    return;
  }

  try {
    // Make API request with streaming
    const apiUrl = getApiUrl(true); // Use GPU for streaming
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NLPCLOUD_API_KEY}`
      },
      body: JSON.stringify(createRequestPayload(query, context, true)),
      cache: 'no-cache'
    });

    // Handle API errors
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('API error response:', errorText);
      streamingOptions.onError(`NLPCloud API error: ${apiResponse.statusText}`);
      return;
    }

    // Handle the streaming response
    if (!apiResponse.body) {
      streamingOptions.onError('No response body');
      return;
    }

    // Process the stream
    const reader = apiResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        // Format final buffer before completing
        if (buffer.trim()) {          const formattedFinal = formatResponseText(buffer);
          streamingOptions.onToken(formattedFinal); // Send final buffer
        }
        streamingOptions.onComplete();
        break;
      }

      const chunk = decoder.decode(value);
      buffer += chunk;
      
      // Check for the [DONE] marker that NLP Cloud API uses
      if (buffer.includes('[DONE]')) {
        // Extract text before [DONE] and format it
        const text = buffer.split('[DONE]')[0];        const formattedText = formatResponseText(text);
        streamingOptions.onToken(formattedText); // Send final text
        streamingOptions.onComplete();
        break;      } else {
        // For streaming, we need to handle partial HTML tags carefully
        // Let's do minimal sanitization for each chunk (remove problematic characters)
        const sanitizedChunk = chunk
          .replace(/�/g, '') // Remove any � characters
          .replace(/<�(\w+)>/g, '<$1>') // Fix opening tags
          .replace(/<\/�(\w+)>/g, '</$1>'); // Fix closing tags
          
        streamingOptions.onToken(sanitizedChunk);
      }
    }
  } catch (error) {
    console.error('Error generating streaming overview:', error);
    streamingOptions.onError(error instanceof Error ? error.message : 'Failed to generate overview');
  }
}
