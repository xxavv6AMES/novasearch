async function generateOverview(query) {
    if (!hasAstroConsent()) {
        showAstroConsentDialog();
        return;
    }

    if (!hasAvailableUsage()) {
        showUsageLimitMessage();
        return;
    }

    const history = JSON.parse(localStorage.getItem('astro_history') || '[]');

    try {
        const response = await fetch('/.netlify/functions/getOverview', {
            method: 'POST',
            body: JSON.stringify({ query, history }),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        // Save updated history
        if (data.history) {
            localStorage.setItem('astro_history', JSON.stringify(data.history));
        }

        // Increment usage after successful response
        incrementUsage();
        
        const overviewElement = document.getElementById('astro-overview');
        overviewElement.innerHTML = `
            <div class="overview-content">
                <div class="overview-header">
                    <span class="astro-icon"></span>
                    <span class="astro-label">Astro Overview (${MONTHLY_LIMIT - getMonthlyUsage()} uses left)</span>
                </div>
                <p>${data.overview}</p>
                ${hasAvailableUsage() ? `
                    <div class="followup-section">
                        <p class="followup-hint">Have a follow-up question? (Counts as 1 use)</p>
                        <div class="followup-input">
                            <input type="text" placeholder="Ask a question..." id="followup-question">
                            <button onclick="handleFollowup()">Ask</button>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        overviewElement.classList.add('loaded');
        
        // Store current context for followups
        localStorage.setItem('astro_current_topic', query);
    } catch (error) {
        console.error('Overview generation failed:', error);
        const overviewElement = document.getElementById('astro-overview');
        overviewElement.innerHTML = `
            <div class="overview-error">
                <p>Unable to generate overview at this time.</p>
            </div>
        `;
    }
}

async function handleFollowup() {
    const followupInput = document.getElementById('followup-question');
    const question = followupInput.value.trim();
    
    if (!question || !hasAvailableUsage()) return;
    
    const currentTopic = localStorage.getItem('astro_current_topic');
    const history = JSON.parse(localStorage.getItem('astro_history') || '[]');
    
    try {
        followupInput.disabled = true;
        const response = await fetch('/.netlify/functions/getOverview', {
            method: 'POST',
            body: JSON.stringify({ 
                query: `Follow-up about "${currentTopic}": ${question}`,
                history 
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        if (data.history) {
            localStorage.setItem('astro_history', JSON.stringify(data.history));
        }

        incrementUsage();

        const overviewElement = document.getElementById('astro-overview');
        const existingContent = overviewElement.querySelector('.overview-content');
        
        // Add the new response
        const followupResponse = document.createElement('div');
        followupResponse.className = 'followup-response';
        followupResponse.innerHTML = `
            <div class="followup-question">${question}</div>
            <p>${data.overview}</p>
        `;
        existingContent.insertBefore(followupResponse, existingContent.lastElementChild);
        
        // Clear and re-enable input
        followupInput.value = '';
        followupInput.disabled = false;

        // Update uses left or remove input if limit reached
        if (!hasAvailableUsage()) {
            existingContent.lastElementChild.remove();
        }
    } catch (error) {
        console.error('Followup failed:', error);
        followupInput.disabled = false;
    }
}
