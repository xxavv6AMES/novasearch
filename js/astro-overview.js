const NLP_API_ENDPOINT = 'https://api.nlpcloud.io/v1/gpu/finetuned-llama-2-70b/generation';
const NLP_API_KEY = 'your_api_key'; // Replace with your actual API key
const QUOTA_KEY = 'astro:daily:quota';
const userId = localStorage.getItem('userId') || 'anonymous';

export async function generateOverview(query) {
    try {
        // Check local quota tracking
        const today = new Date().toISOString().split('T')[0];
        const quotaKey = `${QUOTA_KEY}:${today}`;
        const usageCount = parseInt(localStorage.getItem(quotaKey) || '0');

        if (usageCount >= 20) {
            console.log('Daily quota exceeded');
            return null;
        }

        const response = await fetch('/.netlify/functions/astro-query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, userId })
        });

        if (response.status === 429) {
            console.log('Server quota exceeded');
            return null;
        }

        const data = await response.json();
        
        // Update local quota
        localStorage.setItem(quotaKey, (usageCount + 1).toString());
        
        return data;
    } catch (error) {
        console.error('Failed to generate overview:', error);
        return null;
    }
}

function generateRelatedQuestions(context) {
    // Implement logic to extract potential questions from the context
    // This could be done using NLP or a simpler pattern-based approach
    return [];
}

function generateRelatedSearches(context) {
    // Implement logic to generate related search terms
    // Could use keyword extraction or topic modeling
    return [];
}

export function displayOverview(data) {
    const overviewElement = document.getElementById('astro-overview');
    const contentElement = overviewElement.querySelector('.overview-content');
    
    if (data) {
        contentElement.innerHTML = `<p>${data.overview}</p>`;
        overviewElement.classList.remove('hidden');
        
        // Update related questions
        const questionsContainer = document.querySelector('.related-questions');
        questionsContainer.innerHTML = data.relatedQuestions
            .map(q => `
                <div class="question-item">
                    <div class="question">${q.question}</div>
                    <div class="answer">${q.answer}</div>
                </div>
            `)
            .join('');
            
        // Update related searches
        const searchesContainer = document.querySelector('.related-terms');
        searchesContainer.innerHTML = data.relatedSearches
            .map(term => `
                <a href="?q=${encodeURIComponent(term)}" class="related-term">
                    ${term}
                </a>
            `)
            .join('');
    } else {
        overviewElement.classList.add('hidden');
    }
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Handle question expansion
    document.querySelector('.related-questions').addEventListener('click', async (e) => {
        const questionItem = e.target.closest('.question-item');
        if (questionItem) {
            questionItem.classList.toggle('expanded');
            if (questionItem.classList.contains('expanded')) {
                const question = questionItem.querySelector('.question').textContent;
                const answer = await getQuestionAnswer(question);
                questionItem.querySelector('.answer').textContent = answer || 'No answer available';
            }
        }
    });

    // Handle feedback buttons
    document.querySelectorAll('.feedback-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            // Implement feedback tracking logic here
            btn.classList.add('active');
            setTimeout(() => btn.classList.remove('active'), 2000);
        });
    });
});

export async function getQuestionAnswer(question) {
    try {
        const response = await fetch('/.netlify/functions/astro-query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                query: `Provide a detailed answer to: ${question}`,
                userId 
            })
        });

        if (!response.ok) return null;
        
        const data = await response.json();
        return data.overview; // Use the overview as the answer
    } catch (error) {
        console.error('Failed to get answer:', error);
        return null;
    }
}
