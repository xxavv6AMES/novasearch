const axios = require('axios');

const NLP_API_ENDPOINT = 'https://api.nlpcloud.io/v1/gpu/finetuned-llama-2-70b/generation';
const NLP_API_KEY = process.env.NLP_API_KEY;

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const { query } = JSON.parse(event.body);
        
        if (!query) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Query is required' })
            };
        }

        const response = await axios.post(NLP_API_ENDPOINT, {
            text: `You are an AI search assistant. For this query, provide THREE separate sections:

            1. OVERVIEW: A detailed but concise analysis (2-3 sentences)
            2. QUESTIONS: Generate 4 insightful questions that explore different aspects, each with a complete answer
            3. RELATED: List 6 carefully selected related search terms that cover different angles
            
            Make each section highly informative and distinct.
            Query: ${query}`,
            max_length: 1000,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${NLP_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // Split response into cleaner sections
        const content = response.data.generated_text;
        const sections = content.split(/OVERVIEW:|QUESTIONS:|RELATED:/i)
            .filter(section => section.trim().length > 0);

        const result = {
            overview: sections[0].trim(),
            relatedQuestions: extractQuestions(sections[1]),
            relatedSearches: extractSearchTerms(sections[2])
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
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
