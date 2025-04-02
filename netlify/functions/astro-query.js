const fetch = require('node-fetch');

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
};

// Add rate limiting
const RATE_LIMIT = 50; // Requests per day
const quotaStore = new Map();

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { query, type = 'overview', userId } = JSON.parse(event.body);
        
        // Check quota
        const today = new Date().toDateString();
        const userQuota = quotaStore.get(userId) || { date: today, count: 0 };
        
        if (userQuota.date !== today) {
            userQuota.date = today;
            userQuota.count = 0;
        }
        
        if (userQuota.count >= RATE_LIMIT) {
            return {
                statusCode: 429,
                headers,
                body: JSON.stringify({ 
                    error: 'Rate limit exceeded',
                    resetTime: new Date(new Date().setHours(24, 0, 0, 0)).getTime()
                })
            };
        }

        const NLP_API_KEY = process.env.NLP_API_KEY;

        if (!NLP_API_KEY) {
            throw new Error('API key not configured');
        }

        const promptText = type === 'answer' 
            ? `Provide a detailed answer to: ${query}`
            : `You are an AI search assistant named Astro. For this query, provide THREE separate sections:
               1. OVERVIEW: A detailed but concise analysis (2-3 sentences)
               2. QUESTIONS: Generate 4 insightful questions that explore different aspects
               3. RELATED: List 6 carefully selected related search terms that cover different angles
               Query: ${query}`;

        const response = await fetch('https://api.nlpcloud.io/v1/gpu/finetuned-llama-2-70b/generation', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NLP_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: promptText,
                max_length: type === 'answer' ? 500 : 1000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error('NLP API request failed');
        }

        const data = await response.json();
        const content = data.generated_text;

        // Update quota
        userQuota.count++;
        quotaStore.set(userId, userQuota);

        if (type === 'answer') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    answer: content.trim(),
                    quotaRemaining: RATE_LIMIT - userQuota.count
                })
            };
        }

        const sections = content.split(/OVERVIEW:|QUESTIONS:|RELATED:/i)
            .filter(section => section.trim().length > 0);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                overview: sections[0].trim(),
                relatedQuestions: extractQuestions(sections[1]),
                relatedSearches: extractSearchTerms(sections[2]),
                quotaRemaining: RATE_LIMIT - userQuota.count
            })
        };
    } catch (error) {
        console.error('Astro query error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal Server Error',
                message: error.message 
            })
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
