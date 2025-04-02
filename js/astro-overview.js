const NLP_API_ENDPOINT = '/.netlify/functions/astro-query';
const QUOTA_KEY = 'astro:daily:quota';
const ASTRO_ENABLED_KEY = 'astro:enabled';
const userId = localStorage.getItem('userId') || 'anonymous';

export async function generateOverview(query) {
    try {
        // Check local quota cache
        const quota = JSON.parse(localStorage.getItem(QUOTA_KEY) || '{}');
        const today = new Date().toDateString();
        
        if (quota.date === today && quota.remaining <= 0) {
            const resetTime = new Date().setHours(24, 0, 0, 0);
            throw new Error(`Daily quota exceeded. Resets in ${formatTimeRemaining(resetTime - Date.now())}`);
        }

        const response = await fetch(NLP_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, userId })
        });

        if (response.status === 429) {
            const data = await response.json();
            localStorage.setItem(QUOTA_KEY, JSON.stringify({
                date: today,
                remaining: 0,
                resetTime: data.resetTime
            }));
            throw new Error('Rate limit exceeded');
        }

        if (!response.ok) {
            throw new Error('Failed to generate overview');
        }

        const data = await response.json();
        
        // Update quota
        localStorage.setItem(QUOTA_KEY, JSON.stringify({
            date: today,
            remaining: data.quotaRemaining
        }));

        return {
            overview: data.overview,
            relatedQuestions: data.relatedQuestions || [],
            relatedSearches: data.relatedSearches || []
        };
    } catch (error) {
        console.error('Failed to generate overview:', error);
        showToast(error.message);
        return null;
    }
}

function formatTimeRemaining(ms) {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    return `${days} days and ${hours} hours`;
}

function generateRelatedQuestions(context) {
    // Split into sentences and look for question patterns
    const sentences = context.split(/[.!?]+/).map(s => s.trim()).filter(s => s);
    const questions = [];
    
    for (const sentence of sentences) {
        // Look for key phrases that could form questions
        if (/\b(?:how|what|why|when|where|who|which)\b/i.test(sentence)) {
            // Already a question
            if (sentence.endsWith('?')) {
                questions.push(sentence);
            } else {
                // Convert statement to question
                const question = sentence
                    .replace(/\b(?:is|are|was|were)\b\s+(\w+)/i, '$1 is/are')
                    .replace(/\.$/, '?');
                questions.push(question);
            }
        }
    }
    
    // Extract noun phrases as potential "What is" questions
    const nounPhrases = context.match(/\b[A-Z][a-z]+(?:\s+[a-z]+){1,3}\b/g) || [];
    for (const phrase of nounPhrases) {
        if (!questions.find(q => q.includes(phrase))) {
            questions.push(`What is ${phrase}?`);
        }
    }
    
    return questions.slice(0, 4).map(q => ({ question: q, answer: '' }));
}

function generateRelatedSearches(context) {
    const terms = new Set();
    
    // Extract key phrases (capitalized terms)
    const keyPhrases = context.match(/\b[A-Z][a-z]+(?:\s+[a-z]+){0,2}\b/g) || [];
    keyPhrases.forEach(phrase => terms.add(phrase));
    
    // Extract technical terms and concepts
    const technicalTerms = context.match(/\b[a-z]+(?:[-_][a-z]+)*\b/g) || [];
    technicalTerms
        .filter(term => term.length > 5) // Only significant terms
        .forEach(term => terms.add(term));
    
    // Extract noun phrases
    const nounPhrases = context.match(/\b[a-z]+\s+(?:of|for|in|with)\s+[a-z]+(?:\s+[a-z]+)?\b/gi) || [];
    nounPhrases.forEach(phrase => terms.add(phrase));
    
    // Remove duplicates and common words
    const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with']);
    const filteredTerms = [...terms].filter(term => 
        !commonWords.has(term.toLowerCase()) && term.length > 3
    );
    
    // Return top 6 most relevant terms
    return filteredTerms
        .sort((a, b) => b.length - a.length)
        .slice(0, 6);
}

export function displayOverview(data) {
    const overviewElement = document.getElementById('astro-overview');
    if (!overviewElement) {
        console.error('Astro overview element not found');
        return;
    }

    // Check if Astro is enabled
    const isAstroEnabled = localStorage.getItem(ASTRO_ENABLED_KEY) === 'true';
    
    if (!isAstroEnabled) {
        overviewElement.classList.remove('hidden');
        overviewElement.innerHTML = `
            <div class="astro-permission">
                <div class="permission-content">
                    <i class="fas fa-robot permission-icon"></i>
                    <h3>Enable AI-Powered Insights</h3>
                    <p>Get smart summaries, related questions, and contextual suggestions for your searches with Astro AI. This feature uses 1 credit from your daily quota of 50 AI-powered searches.</p>
                    <button class="enable-astro-btn">Enable Astro AI</button>
                    <span class="permission-note">You can disable this feature anytime in settings</span>
                </div>
            </div>
        `;

        // Add event listener for the enable button
        const enableButton = overviewElement.querySelector('.enable-astro-btn');
        enableButton.addEventListener('click', () => {
            localStorage.setItem(ASTRO_ENABLED_KEY, 'true');
            // Reload the overview with the current query
            const urlParams = new URLSearchParams(window.location.search);
            const query = urlParams.get('q');
            if (query) {
                generateOverview(query).then(data => {
                    if (data) displayOverview(data);
                });
            }
        });
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

// Add toast notification
function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    });
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

    // Improve feedback button handling
    document.querySelectorAll('.feedback-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            const content = document.querySelector('.overview-text').textContent;
            submitFeedback(action, content);
            btn.classList.add('active');
            setTimeout(() => btn.classList.remove('active'), 2000);
        });
    });

    // Add disable option to settings
    const settingsContainer = document.querySelector('.settings-section');
    if (settingsContainer) {
        const astroToggle = document.createElement('button');
        astroToggle.className = 'settings-button';
        astroToggle.innerHTML = `
            <i class="fas fa-robot"></i>
            <span>Astro AI Insights</span>
            <div class="toggle-switch" data-enabled="${localStorage.getItem(ASTRO_ENABLED_KEY) === 'true'}"></div>
        `;
        
        astroToggle.addEventListener('click', () => {
            const isEnabled = localStorage.getItem(ASTRO_ENABLED_KEY) === 'true';
            localStorage.setItem(ASTRO_ENABLED_KEY, (!isEnabled).toString());
            astroToggle.querySelector('.toggle-switch').dataset.enabled = (!isEnabled).toString();
            
            // Refresh the current search if on results page
            if (window.location.pathname.includes('results.html')) {
                location.reload();
            }
        });
        
        settingsContainer.appendChild(astroToggle);
    }
});

export async function getQuestionAnswer(question) {
    try {
        const response = await fetch(NLP_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                query: `Provide a detailed answer to: ${question}`,
                type: 'answer',
                userId 
            })
        });

        if (!response.ok) throw new Error('Failed to get answer');
        
        const data = await response.json();
        return data.answer || data.overview;
    } catch (error) {
        console.error('Failed to get answer:', error);
        return 'Sorry, failed to generate an answer. Please try again.';
    }
}

// Improve feedback handling
async function submitFeedback(type, content) {
    try {
        const response = await fetch('/.netlify/functions/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                content,
                userId,
                timestamp: new Date().toISOString()
            })
        });
        
        if (!response.ok) throw new Error('Failed to submit feedback');
        showToast('Thank you for your feedback!');
    } catch (error) {
        console.error('Feedback error:', error);
        showToast('Failed to submit feedback');
    }
}
