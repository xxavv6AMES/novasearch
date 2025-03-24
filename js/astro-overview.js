const NLP_API_ENDPOINT = 'https://api.nlpcloud.io/v1/gpu/finetuned-llama-2-70b/generation';
const NLP_API_KEY = 'your_api_key'; // Replace with your actual API key
const QUOTA_KEY = 'astro:daily:quota';
const userId = localStorage.getItem('userId') || 'anonymous';

export async function generateOverview(query) {
    try {
        const now = new Date();
        const quotaKey = `${QUOTA_KEY}`;
        const usageData = JSON.parse(localStorage.getItem(quotaKey) || '{"count": 0, "timestamp": 0}');
        
        // Check if 2.5 weeks (17.5 days) have passed since last reset
        const resetPeriod = 17.5 * 24 * 60 * 60 * 1000; // 2.5 weeks in milliseconds
        if (now.getTime() - usageData.timestamp > resetPeriod) {
            usageData.count = 0;
            usageData.timestamp = now.getTime();
        }
        
        if (usageData.count >= 20) {
            console.log('Quota exceeded. Resets in ' + formatTimeRemaining(usageData.timestamp + resetPeriod - now.getTime()));
            return null;
        }

        const response = await fetch('/api/astro-query', {  // Updated endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, userId })
        });

        if (!response.ok) {
            if (response.status === 429) {
                console.log('Server quota exceeded');
                return null;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) {
            console.error('API error:', data.error);
            return null;
        }
        
        // Update local quota
        usageData.count++;
        usageData.timestamp = new Date().getTime();
        localStorage.setItem(quotaKey, JSON.stringify(usageData));
        
        return data;
    } catch (error) {
        console.error('Failed to generate overview:', error);
        return null;
    }
}

function formatTimeRemaining(ms) {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    return `${days} days and ${hours} hours`;
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
    if (!overviewElement) {
        console.error('Astro overview element not found');
        return;
    }

    const contentElement = overviewElement.querySelector('.overview-content');
    if (!contentElement) {
        console.error('Overview content element not found');
        return;
    }
    
    if (data) {
        // Show loading animation first
        overviewElement.classList.remove('hidden');
        contentElement.innerHTML = '<div class="astro-loading"></div>';
        
        // Add a small delay for smooth animation
        setTimeout(() => {
            // Overview section
            contentElement.innerHTML = `
                <p class="overview-text">${data.overview}</p>
            `;
            
            // Questions section
            const questionsContainer = document.querySelector('.related-questions');
            if (questionsContainer) {
                questionsContainer.innerHTML = '';
                data.relatedQuestions.forEach((q, index) => {
                    const questionEl = document.createElement('div');
                    questionEl.className = 'question-item';
                    questionEl.style.animation = `slideIn 0.3s ease-out ${index * 0.1}s forwards`;
                    questionEl.style.opacity = '0';
                    questionEl.innerHTML = `
                        <div class="question">
                            <span>${q.question}</span>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                        <div class="answer">${q.answer || 'Loading answer...'}</div>
                    `;
                    questionsContainer.appendChild(questionEl);
                });
            }
            
            // Related searches section
            const searchesContainer = document.querySelector('.related-terms');
            if (searchesContainer) {
                searchesContainer.innerHTML = '';
                data.relatedSearches.forEach((term, index) => {
                    const termEl = document.createElement('a');
                    termEl.href = `?q=${encodeURIComponent(term)}`;
                    termEl.className = 'related-term';
                    termEl.style.animation = `slideIn 0.3s ease-out ${index * 0.05}s forwards`;
                    termEl.style.opacity = '0';
                    termEl.textContent = term;
                    searchesContainer.appendChild(termEl);
                });
            }

            // Log success
            console.log('Astro overview displayed successfully');
        }, 500);
    } else {
        overviewElement.classList.add('hidden');
        console.log('No data available for Astro overview');
    }
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Handle question expansion
    document.querySelector('.related-questions').addEventListener('click', async (e) => {
        const questionItem = e.target.closest('.question-item');
        if (questionItem) {
            const answer = questionItem.querySelector('.answer');
            const icon = questionItem.querySelector('.fa-chevron-down');
            
            questionItem.classList.toggle('expanded');
            icon.style.transform = questionItem.classList.contains('expanded') 
                ? 'rotate(180deg)' 
                : 'rotate(0)';
            
            if (questionItem.classList.contains('expanded') && !answer.textContent.trim()) {
                answer.innerHTML = '<div class="astro-loading"></div>';
                const question = questionItem.querySelector('.question span').textContent;
                const answerText = await getQuestionAnswer(question);
                answer.textContent = answerText || 'No answer available';
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
