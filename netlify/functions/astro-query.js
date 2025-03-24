const axios = require('axios');

const NLP_API_ENDPOINT = 'https://api.nlpcloud.io/v1/gpu/finetuned-llama-2-70b/generation';
const NLP_API_KEY = process.env.NLP_API_KEY;
const REDIS_URL = process.env.REDIS_URL;

const Redis = require('ioredis');
const redis = new Redis(REDIS_URL);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { query, userId } = JSON.parse(event.body);
    
    // Check user's daily quota
    const today = new Date().toISOString().split('T')[0];
    const quotaKey = `astro:quota:${userId}:${today}`;
    const usageCount = await redis.get(quotaKey) || 0;

    if (usageCount >= 20) {
      return {
        statusCode: 429,
        body: JSON.stringify({
          error: 'Daily quota exceeded'
        })
      };
    }

    // Generate content
    const response = await axios.post(NLP_API_ENDPOINT, {
      text: `Analyze this search query and provide:
      1. A concise overview (2-3 sentences)
      2. 3-4 related questions people might ask
      3. 4-5 related search terms
      
      Query: ${query}`,
      max_length: 500,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${NLP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Process the response
    const content = response.data.generated_text;
    const sections = content.split('\n\n');
    
    const result = {
      overview: sections[0].trim(),
      relatedQuestions: extractQuestions(sections[1]),
      relatedSearches: extractSearchTerms(sections[2])
    };

    // Increment usage count
    await redis.incr(quotaKey);
    // Set expiry for quota key (24 hours)
    await redis.expire(quotaKey, 86400);

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Astro query error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};

function extractQuestions(text) {
  return text
    .split('\n')
    .filter(line => line.trim().endsWith('?'))
    .map(question => ({ 
      question: question.trim(),
      answer: '' // Will be populated when user expands the question
    }));
}

function extractSearchTerms(text) {
  return text
    .split('\n')
    .map(term => term.trim())
    .filter(term => term.length > 0);
}
