const ASTRO_CONSENT_KEY = 'astro_consent_given';
const ASTRO_USAGE_KEY = 'astro_monthly_usage';
const ASTRO_USAGE_MONTH_KEY = 'astro_usage_month';
const MONTHLY_LIMIT = 20;

function hasAstroConsent() {
    return localStorage.getItem(ASTRO_CONSENT_KEY) === 'true';
}

function setAstroConsent(consent) {
    localStorage.setItem(ASTRO_CONSENT_KEY, consent.toString());
}

function showAstroConsentDialog() {
    const consentHtml = `
        <div class="astro-consent">
            <div class="consent-header">
                <span class="astro-icon"></span>
                <h2>Enable Astro Overviews?</h2>
            </div>
            <div class="consent-content">
                <p>Astro can provide AI-powered overviews for your searches, helping you quickly understand topics and get more context.</p>
                <ul>
                    <li>Powered by Nova AI technology</li>
                    <li>Provides quick topic summaries</li>
                    <li>Helps with research and learning</li>
                    <li>Limited to ${MONTHLY_LIMIT} uses per month</li>
                    <li>Can be disabled anytime in Settings</li>
                </ul>
                <div class="privacy-note">
                    <span class="info-icon">ℹ️</span>
                    <p>Your searches will be processed securely to generate overviews. No personal data is stored.</p>
                </div>
            </div>
            <div class="consent-actions">
                <button class="consent-button secondary" onclick="handleAstroConsent(false)">Maybe Later</button>
                <button class="consent-button primary" onclick="handleAstroConsent(true)">Enable Astro</button>
            </div>
        </div>
    `;

    const overviewElement = document.getElementById('astro-overview');
    overviewElement.innerHTML = consentHtml;
    overviewElement.classList.add('consent-mode');
}

function handleAstroConsent(consent) {
    setAstroConsent(consent);
    const overviewElement = document.getElementById('astro-overview');
    overviewElement.classList.remove('consent-mode');
    
    if (consent) {
        // Clear history when enabling
        localStorage.setItem('astro_history', '[]');
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        if (query) {
            generateOverview(query);
        }
    } else {
        // Clear history when disabling
        localStorage.removeItem('astro_history');
        overviewElement.style.display = 'none';
    }
}

function getMonthlyUsage() {
    const currentMonth = new Date().getMonth();
    const storedMonth = localStorage.getItem(ASTRO_USAGE_MONTH_KEY);
    
    if (storedMonth !== currentMonth.toString()) {
        localStorage.setItem(ASTRO_USAGE_MONTH_KEY, currentMonth);
        localStorage.setItem(ASTRO_USAGE_KEY, '0');
        return 0;
    }
    
    return parseInt(localStorage.getItem(ASTRO_USAGE_KEY) || '0');
}

function incrementUsage() {
    const usage = getMonthlyUsage();
    localStorage.setItem(ASTRO_USAGE_KEY, (usage + 1).toString());
    return usage + 1;
}

function hasAvailableUsage() {
    return getMonthlyUsage() < MONTHLY_LIMIT;
}

function showUsageLimitMessage() {
    const overviewElement = document.getElementById('astro-overview');
    overviewElement.innerHTML = `
        <div class="overview-content">
            <div class="overview-header">
                <span class="astro-icon"></span>
                <span class="astro-label">Usage Limit Reached</span>
            </div>
            <p>You've reached your ${MONTHLY_LIMIT} free overviews for this month. The limit will reset at the start of next month.</p>
        </div>
    `;
}
