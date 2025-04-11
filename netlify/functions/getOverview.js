const NLPCloudClient = require('nlpcloud');

exports.handler = async function(event) {
    // Add CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers
        };
    }

    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        // Validate API key
        if (!process.env.NLPCLOUD_API_KEY) {
            throw new Error('Missing API key configuration');
        }

        const { query, history = [] } = JSON.parse(event.body);
        
        // Validate input
        if (!query) {
            throw new Error('Query is required');
        }

        const client = new NLPCloudClient({
            model: 'finetuned-llama-3-70b',
            token: process.env.NLPCLOUD_API_KEY,
            gpu: true
        });

        const response = await client.chatbot({
            input: `Generate a clear, concise overview of: ${query}`,
            context: 'You are Astro, an AI assistant that provides helpful overviews of topics. Keep responses clear, factual and informative.',
            history
        });

        return {
            statusCode: 200,
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                overview: response.data.response,
                history: response.data.history
            })
        };
    } catch (error) {
        console.error('NLPCloud error:', error);
        
        return {
            statusCode: 500,
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                error: 'Failed to generate overview',
                details: error.response?.data?.detail || error.message
            })
        };
    }
};
