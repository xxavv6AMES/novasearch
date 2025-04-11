document.addEventListener('DOMContentLoaded', function() {
    // Get search query from URL
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');

    // If on results page, set the search input value
    const resultsInput = document.getElementById('search-input-results');
    if (resultsInput && query) {
        resultsInput.value = query;
    }

    // Generate overview for the search query
    if (query) {
        generateOverview(query);
    }

    // Handle time filter
    const timeFilter = document.getElementById('time-filter');
    if (timeFilter) {
        timeFilter.addEventListener('change', () => {
            const searchElement = google.search.cse.element.getElement('results');
            if (searchElement) {
                searchElement.execute(searchElement.getInputQuery(), {
                    sort: `date:r:${timeFilter.value}`
                });
            }
        });
    }

    // Force CSE results to open in new tabs
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {  // ELEMENT_NODE
                        const links = node.getElementsByTagName('a');
                        Array.from(links).forEach(link => {
                            link.setAttribute('target', '_blank');
                        });
                    }
                });
            }
        });
    });

    // Start observing the results container
    const resultsContainer = document.querySelector('.results-container');
    if (resultsContainer) {
        observer.observe(resultsContainer, {
            childList: true,
            subtree: true
        });
    }
});
