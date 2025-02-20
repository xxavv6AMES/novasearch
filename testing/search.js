const SEARCH_API_KEY = 'AIzaSyBH9AJ632LTZzwzLrCxKi4UKVhNnWK3W_Q'; // Replace with your API key
const SEARCH_ENGINE_ID = '4776225bf1aee432e'; // Your existing search engine ID
const SUGGESTIONS_ENDPOINT = 'https://suggestqueries.google.com/complete/search';
const SEARCHAPI_KEY = 'AmGGDPP7Yjc8W2otJGkaHbGz'; // Add your SearchAPI.io key here
const DDG_ENDPOINT = 'https://www.searchapi.io/api/v1/search';

export async function getSearchSuggestions(query) {
    const params = new URLSearchParams({
        client: 'youtube', // Using YouTube's client for better suggestions
        q: query,
        ds: 'web' // Specify web search suggestions
    });

    try {
        const response = await fetch(`${SUGGESTIONS_ENDPOINT}?${params}`);
        const data = await response.json();
        return data[1] || []; // Return array of suggestions
    } catch (error) {
        console.error('Suggestions error:', error);
        return [];
    }
}

export async function performSearch(query, startIndex = 1, searchType = 'web') {
    const endpoint = 'https://www.googleapis.com/customsearch/v1';
    const params = new URLSearchParams({
        key: SEARCH_API_KEY,
        cx: SEARCH_ENGINE_ID,
        q: query,
        start: startIndex,
        num: 10
    });

    // Only add searchType for image searches
    if (searchType === 'image') {
        params.append('searchType', 'image');
    }

    // Add specific parameters for different search types
    switch (searchType) {
        case 'news':
            params.append('sort', 'date');
            params.append('dateRestrict', 'd[7]');
            break;
        case 'video':
            query += ' video';
            params.set('q', query);
            break;
    }

    try {
        const response = await fetch(`${endpoint}?${params}`);
        const data = await response.json();

        if (response.status === 429 || data.error?.message?.includes('Quota exceeded')) {
            console.log('API quota exceeded, trying DuckDuckGo fallback...');
            try {
                const ddgResults = await performDuckDuckGoSearch(query, startIndex);
                return ddgResults;
            } catch (ddgError) {
                console.log('DuckDuckGo fallback failed, trying TSQS...');
                return performTSQSSearch(query, startIndex);
            }
        }

        if (!response.ok) {
            throw new Error(data.error?.message || 'Search failed');
        }

        return {
            items: data.items || [],
            searchInformation: data.searchInformation,
            queries: data.queries,
            spelling: data.spelling,
            knowledge: extractKnowledgePanel(data),
            searchType
        };
    } catch (error) {
        console.error('Primary search error:', error);
        // Try DuckDuckGo first, then TSQS
        try {
            console.log('Trying DuckDuckGo fallback...');
            return await performDuckDuckGoSearch(query, startIndex);
        } catch (ddgError) {
            console.log('DuckDuckGo fallback failed, trying TSQS...');
            return performTSQSSearch(query, startIndex);
        }
    }
}

async function performDuckDuckGoSearch(query, startIndex = 1) {
    const page = Math.ceil(startIndex / 10);
    const params = new URLSearchParams({
        engine: 'duckduckgo',
        api_key: SEARCHAPI_KEY,
        q: query,
        page: page,
        safe: 'moderate',
        time_period: 'any_time'
    });

    try {
        const response = await fetch(`${DDG_ENDPOINT}?${params}`, {
            headers: {
                'Authorization': `Bearer ${SEARCHAPI_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error('DuckDuckGo search failed');
        }

        const data = await response.json();
        
        // Convert DuckDuckGo results to match our format
        const items = data.organic_results.map(result => ({
            title: result.title,
            link: result.link,
            snippet: result.description,
            displayLink: new URL(result.link).hostname,
            pagemap: {
                // Add minimal pagemap to support result type detection
                metatags: [{ 'og:type': result.type || 'website' }]
            }
        }));

        return {
            items,
            searchInformation: {
                formattedTotalResults: `${data.total_results || items.length}+`,
                formattedSearchTime: data.time_taken || "0.1",
            },
            queries: {
                request: [{ startIndex }],
                nextPage: items.length >= 10 ? [{ startIndex: startIndex + 10 }] : null,
                previousPage: page > 1 ? [{ startIndex: Math.max(1, startIndex - 10) }] : null
            }
        };
    } catch (error) {
        console.error('DuckDuckGo search error:', error);
        throw error;
    }
}

function performTSQSSearch(query, startIndex = 1) {
    return new Promise((resolve, reject) => {
        try {
            // Create a temporary element to hold CSE results
            const tempDiv = document.createElement('div');
            tempDiv.style.display = 'none';
            document.body.appendChild(tempDiv);

            // Initialize CSE
            const cx = SEARCH_ENGINE_ID;
            const gcse = google.search.cse;
            
            gcse.execute(query, {
                start: startIndex,
                element: tempDiv
            });

            // Set a timeout to reject if results don't come back
            const timeout = setTimeout(() => {
                observer.disconnect();
                document.body.removeChild(tempDiv);
                reject(new Error('TSQS search timeout'));
            }, 10000); // 10 second timeout

            // Watch for results
            const observer = new MutationObserver((mutations, obs) => {
                const results = tempDiv.querySelectorAll('.gsc-result');
                if (results.length > 0) {
                    clearTimeout(timeout);
                    obs.disconnect();
                    
                    // Convert CSE results to our format
                    const items = Array.from(results).map(result => ({
                        title: result.querySelector('.gs-title')?.textContent || 'No Title',
                        link: result.querySelector('.gs-title a')?.href || '#',
                        snippet: result.querySelector('.gs-snippet')?.textContent || '',
                        displayLink: result.querySelector('.gs-visibleUrl')?.textContent 
                            || new URL(result.querySelector('.gs-title a')?.href || window.location.href).hostname
                    }));

                    // Clean up
                    document.body.removeChild(tempDiv);

                    resolve({
                        items,
                        searchInformation: {
                            formattedTotalResults: "Multiple",
                            formattedSearchTime: "0.1"
                        },
                        queries: {
                            request: [{ startIndex }],
                            nextPage: items.length === 10 ? [{ startIndex: startIndex + 10 }] : null,
                            previousPage: startIndex > 1 ? [{ startIndex: Math.max(1, startIndex - 10) }] : null
                        }
                    });
                }
            });

            observer.observe(tempDiv, { childList: true, subtree: true });
        } catch (error) {
            reject(error);
        }
    });
}

function extractKnowledgePanel(data) {
    if (!data.items?.[0]) return null;

    const firstResult = data.items[0];
    // Check if the first result looks like an entity (Wikipedia, official website, etc.)
    if (firstResult.pagemap?.metatags?.[0]?.['og:type'] === 'website' ||
        firstResult.link.includes('wikipedia.org')) {
        
        return {
            title: firstResult.title,
            snippet: firstResult.snippet,
            image: firstResult.pagemap?.cse_image?.[0]?.src,
            type: firstResult.pagemap?.metatags?.[0]?.['og:type'],
            source: new URL(firstResult.link).hostname
        };
    }
    return null;
}

export function createSearchResult(item) {
    if (item.pagemap?.videoobject) {
        return createVideoResult(item);
    } else if (item.pagemap?.newsarticle) {
        return createNewsResult(item);
    } else if (item.pagemap?.cse_image) {
        return createImageResult(item);
    }
    return createWebResult(item);
}

function createWebResult(item) {
    return `
        <div class="search-result">
            <div class="result-url">${item.displayLink}</div>
            <a href="${item.link}" class="result-title">${item.title}</a>
            <div class="result-snippet">${item.snippet}</div>
        </div>
    `;
}

function createVideoResult(item) {
    const video = item.pagemap.videoobject[0];
    return `
        <div class="search-result video-result">
            <div class="result-url">${item.displayLink}</div>
            <a href="${item.link}" class="result-title">
                <div class="video-thumbnail">
                    <img src="${video.thumbnailurl}" alt="${item.title}">
                    <span class="video-duration">${video.duration || ''}</span>
                </div>
                ${item.title}
            </a>
            <div class="result-snippet">${item.snippet}</div>
        </div>
    `;
}

function createNewsResult(item) {
    const news = item.pagemap.newsarticle[0];
    const date = new Date(news.datepublished).toLocaleDateString();
    return `
        <div class="search-result news-result">
            <div class="result-url">${item.displayLink} · ${date}</div>
            <a href="${item.link}" class="result-title">${item.title}</a>
            <div class="result-snippet">${item.snippet}</div>
        </div>
    `;
}

function createImageResult(item) {
    const image = item.pagemap.cse_image[0];
    return `
        <div class="search-result image-result">
            <a href="${item.link}" class="result-image">
                <img src="${image.src}" alt="${item.title}">
            </a>
            <div class="image-details">
                <div class="result-url">${item.displayLink}</div>
                <a href="${item.link}" class="result-title">${item.title}</a>
            </div>
        </div>
    `;
}

export function createPagination(queries) {
    const currentPage = Math.floor(queries.request[0].startIndex / 10) + 1;
    const totalResults = parseInt(queries.totalResults) || 0;
    const totalPages = Math.ceil(totalResults / 10);

    return `
        <div class="pagination">
            ${currentPage > 1 ? `
                <button class="page-btn prev-page" data-start="${queries.previousPage?.[0].startIndex || 1}">
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
            ` : ''}
            <span class="page-info">Page ${currentPage}</span>
            ${queries.nextPage ? `
                <button class="page-btn next-page" data-start="${queries.nextPage[0].startIndex}">
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            ` : ''}
        </div>
    `;
}

function formatResults(items, startIndex) {
    return {
        items,
        searchInformation: {
            formattedTotalResults: `${items.length}+`,
            formattedSearchTime: "0.1",
        },
        queries: {
            request: [{ startIndex }],
            nextPage: items.length === 10 ? [{ startIndex: startIndex + 10 }] : null,
            previousPage: startIndex > 1 ? [{ startIndex: Math.max(1, startIndex - 10) }] : null
        }
    };
}
