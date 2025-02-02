export class SearchUI {
    constructor() {
        this.initializeSearch();
        this.bindEvents();
    }

    initializeSearch() {
        // Wait for Google Custom Search to load
        window.__gcse = {
            parsetags: 'explicit',
            callback: this.handleSearchLoad.bind(this)
        };
    }

    handleSearchLoad() {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        
        if (query) {
            const searchElement = google.search.cse.element.getElement('gsc-results');
            searchElement?.execute(query);
        }
    }

    bindEvents() {
        // Handle search input interactions
        document.querySelector('.search-container')?.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch(e.target.value);
            }
        });

        // Handle history state changes
        window.addEventListener('popstate', () => {
            this.handleSearchLoad();
        });
    }

    handleSearch(query) {
        if (!query) return;
        
        // Update URL with search query
        const url = new URL(window.location);
        url.searchParams.set('q', query);
        window.history.pushState({}, '', url);
        
        // Execute search
        this.handleSearchLoad();
    }
}
