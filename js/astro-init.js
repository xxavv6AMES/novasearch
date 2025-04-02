import { generateOverview, displayOverview } from './astro-overview.js';

const ASTRO_PERMISSION_KEY = 'astro:permission';

export async function initializeAstroOverview() {
    const overviewElement = document.getElementById('astro-overview');
    if (!overviewElement) return;

    if (!localStorage.getItem(ASTRO_PERMISSION_KEY)) {
        overviewElement.classList.remove('hidden');
        overviewElement.innerHTML = `
            <div class="astro-permission">
                <div class="permission-content">
                    <i class="fas fa-robot permission-icon"></i>
                    <h3>Enable AI-Powered Insights</h3>
                    <p>Get smart summaries, related questions, and contextual suggestions for your searches with Astro AI. This feature uses AI to analyze your searches and provide helpful insights.</p>
                    <button class="enable-astro-btn" onclick="enableAstroOverview()">Enable Astro AI</button>
                    <span class="permission-note">You can disable this feature anytime in settings</span>
                </div>
            </div>
        `;
        return;
    }

    if (localStorage.getItem(ASTRO_PERMISSION_KEY) === 'granted') {
        // Setup Google CSE callback for granted permission
        window.__gcse = {
            callback: function() {
                const element = google.search.cse.element.getElement('searchresults');
                element.addResultSelectedCallback(() => {
                    const urlParams = new URLSearchParams(window.location.search);
                    const query = urlParams.get('q');
                    if (query) {
                        generateOverview(query).then(data => {
                            if (data) displayOverview(data);
                        });
                    }
                });
            }
        };
    }
}

// Make this available to the onclick handler
window.enableAstroOverview = function() {
    localStorage.setItem(ASTRO_PERMISSION_KEY, 'granted');
    location.reload(); // Reload to initialize with new permission
};
