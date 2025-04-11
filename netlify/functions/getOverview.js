const NLPCloudClient = require('nlpcloud');

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { query, history = [] } = JSON.parse(event.body);
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
            body: JSON.stringify({
                overview: response.data.response,
                history: response.data.history
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        };
    } catch (error) {
        console.error('NLPCloud error:', error.response?.data?.detail || error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to generate overview' })
        };
    }
};
