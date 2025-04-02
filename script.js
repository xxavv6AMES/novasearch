import { signIn, signInWithGoogle, signInWithGithub, signOutUser, onAuthStateChanged } from './services/auth.js';
import { generateOverview, displayOverview } from './js/astro-overview.js';

const UNSPLASH_ACCESS_KEY = 'Xo9yT7MRQzqOOFc0-VzykE1geqsTNIxb-iMYJkFgveM';
const BACKGROUND_CATEGORIES = ['nature', 'landscape', 'architecture', 'minimal'];

// Authentication state management
function initializeAuth() {
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const userInfo = document.getElementById('user-info');
    const loginDialog = document.getElementById('login-dialog');
    const loginForm = document.getElementById('login-form');
    const closeDialog = loginDialog.querySelector('.close-dialog');
    const errorMessage = loginDialog.querySelector('.error-message');
    const loginVideo = document.getElementById('login-video');

    loginVideo.addEventListener('ended', () => {
        loginVideo.classList.add('paused');
    });

    loginButton.addEventListener('click', () => {
        loginDialog.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Reset video when opening dialog
        loginVideo.classList.remove('paused');
        loginVideo.currentTime = 0;
        loginVideo.play();
    });

    closeDialog.addEventListener('click', () => {
        loginDialog.classList.remove('active');
        document.body.style.overflow = '';
        errorMessage.style.display = 'none';
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            await signIn(email, password);
            loginDialog.classList.remove('active');
            document.body.style.overflow = '';
            loginForm.reset();
            errorMessage.style.display = 'none';
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                window.location.href = 'https://account.nova.xxavvgroup.com/signup.html';
            } else {
                errorMessage.textContent = error.message;
                errorMessage.style.display = 'block';
            }
        }
    });

    document.getElementById('google-login').addEventListener('click', async () => {
        try {
            await signInWithGoogle();
            loginDialog.classList.remove('active');
            document.body.style.overflow = '';
            errorMessage.style.display = 'none';
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        }
    });

    document.getElementById('github-login').addEventListener('click', async () => {
        try {
            await signInWithGithub();
            loginDialog.classList.remove('active');
            document.body.style.overflow = '';
            errorMessage.style.display = 'none';
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        }
    });

    logoutButton.addEventListener('click', () => {
        signOutUser().catch(error => {
            console.error('Logout failed:', error);
        });
    });

    onAuthStateChanged((user) => {
        if (user) {
            // Update display name and avatars
            const displayName = user.displayName || user.email.split('@')[0];
            document.querySelector('.display-name').textContent = displayName;
            document.querySelector('.user-name').textContent = displayName;
            document.querySelector('.user-email').textContent = user.email;
            
            // Update avatar images
            const avatarUrl = user.photoURL || 'https://d2zcpib8duehag.cloudfront.net/accountuser.png';
            document.querySelector('.avatar').src = avatarUrl;
            document.querySelector('.dropdown-avatar').src = avatarUrl;
            
            loginButton.style.display = 'none';
            userInfo.style.display = 'flex';
        } else {
            loginButton.style.display = 'flex';
            userInfo.style.display = 'none';
        }
    });
}

function initializeEventListeners() {
    // Sidebar toggle
    const sidebar = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('overlay');
    
    document.getElementById('app-button').addEventListener('click', () => {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    document.getElementById('close-sidebar').addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Theme handling
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        const newTheme = document.documentElement.dataset.theme === 'style' ? 'darkstyle' : 'style';
        setTheme(newTheme);
    });
}

function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
    
    document.getElementById('theme-icon').className = theme === 'darkstyle' ? 'fas fa-sun' : 'fas fa-moon';
    
    const link = document.querySelector('link[rel="stylesheet"][id="theme-style"]') 
        || document.head.appendChild(Object.assign(document.createElement('link'), {
            id: 'theme-style',
            rel: 'stylesheet'
        }));
    link.href = `${theme}.css`;
}

// Background handling
function initializeBackgrounds() {
    const backgroundType = localStorage.getItem('backgroundType');
    if (backgroundType === 'daily') {
        checkAndUpdateDailyBackground();
    } else if (backgroundType === 'custom') {
        const customBackground = localStorage.getItem('customBackground');
        if (customBackground) {
            setBackground(customBackground);
        }
    }
}

async function checkAndUpdateDailyBackground() {
    const lastUpdate = localStorage.getItem('lastBackgroundUpdate');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const lastUpdateDate = lastUpdate ? new Date(parseInt(lastUpdate)).getTime() : null;
    
    // Use cached background if we already updated today
    if (lastUpdate && lastUpdateDate >= today) {
        const cachedBackground = localStorage.getItem('dailyBackground');
        if (cachedBackground) {
            setBackground(cachedBackground);
            return;
        }
    }
    
    // If it's a new day or no previous background, fetch new one
    await fetchNewDailyBackground();
}

async function fetchNewDailyBackground() {
    try {
        const randomCategory = BACKGROUND_CATEGORIES[Math.floor(Math.random() * BACKGROUND_CATEGORIES.length)];
        const response = await fetch(
            `https://api.unsplash.com/photos/random?query=${randomCategory}&orientation=landscape&w=2560&h=1440&fit=crop&q=90`,
            {
                headers: {
                    'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
                }
            }
        );
        
        const data = await response.json();
        const imageUrl = data.urls.full;
        
        // Save the new background with today's date at midnight
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        localStorage.setItem('lastBackgroundUpdate', today.getTime().toString());
        localStorage.setItem('dailyBackground', imageUrl);
        
        setBackground(imageUrl);
        
        // Track attribution as required by Unsplash
        fetch(data.links.download_location, {
            headers: {
                'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
            }
        });
    } catch (error) {
        console.error('Failed to fetch daily background:', error);
        setBackground('https://source.unsplash.com/2560x1440/?nature');
    }
}

function setBackground(url) {
    document.querySelector('.page-background').style.backgroundImage = `url(${url})`;
    localStorage.setItem('background', url);
}

// Background management
function initializeBackgroundControls() {
    const dailyBackground = document.getElementById('daily-background');
    const customBackground = document.getElementById('custom-background');
    const resetBackground = document.getElementById('reset-background');

    dailyBackground.addEventListener('click', async () => {
        localStorage.setItem('backgroundType', 'daily');
        await fetchNewDailyBackground();
        customizePopup.classList.remove('active');
    });

    customBackground.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setBackground(e.target.result);
                    localStorage.setItem('backgroundType', 'custom');
                    localStorage.setItem('customBackground', e.target.result);
                };
                reader.readAsDataURL(file);
            }
        };
        
        input.click();
    });

    resetBackground.addEventListener('click', () => {
        document.querySelector('.page-background').style.backgroundImage = '';
        localStorage.removeItem('background');
        localStorage.removeItem('backgroundType');
        localStorage.removeItem('customBackground');
        localStorage.removeItem('dailyBackground');
        localStorage.removeItem('lastBackgroundUpdate');
    });
}

// Quick access tiles
function initializeQuickAccess() {
    const quickAccess = document.querySelector('.quick-access');
    const addTile = document.getElementById('add-tile');
    
    if (!quickAccess || !addTile) {
        console.log('Quick access elements not found');
        return;
    }

    loadSavedTiles();
    
    const tiles = document.querySelectorAll('.quick-tile');
    tiles.forEach(tile => {
        if (tile.dataset.url) {
            addDeleteButton(tile);
            tile.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-tile')) {
                    window.location.href = tile.dataset.url;
                }
            });
        }
    });

    addTile.addEventListener('click', addNewTile);
}

function addDeleteButton(tile) {
    if (!tile.id || tile.id !== 'add-tile') {
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-tile';
        deleteButton.innerHTML = '<i class="fas fa-times"></i>';
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTile(tile);
        });
        tile.appendChild(deleteButton);
    }
}

function deleteTile(tile) {
    const tileData = {
        url: tile.dataset.url,
        name: tile.querySelector('span').textContent
    };
    
    tile.remove();
    
    // Update localStorage
    const savedTiles = JSON.parse(localStorage.getItem('quickAccessTiles') || '[]');
    const updatedTiles = savedTiles.filter(saved => 
        saved.url !== tileData.url || saved.name !== tileData.name
    );
    localStorage.setItem('quickAccessTiles', JSON.stringify(updatedTiles));
}

function loadSavedTiles() {
    const savedTiles = JSON.parse(localStorage.getItem('quickAccessTiles') || '[]');
    const quickAccess = document.querySelector('.quick-access');
    const addTile = document.getElementById('add-tile');

    savedTiles.forEach(tileData => {
        const tile = createTile(tileData.url, tileData.name);
        quickAccess.insertBefore(tile, addTile);
    });
}

function createTile(url, name) {
    const tile = document.createElement('div');
    tile.className = 'quick-tile';
    tile.dataset.url = url;

    // Set default icon in case the domain's icon fails
    const domain = new URL(url).hostname;
    tile.innerHTML = `
        <img src="https://icons.duckduckgo.com/ip3/${domain}.ico" 
             alt="${name}" 
             class="nova-icon"
             onerror="this.src='https://d2zcpib8duehag.cloudfront.net/default-icon.png';">
        <span>${name}</span>
    `;

    addDeleteButton(tile);
    tile.addEventListener('click', (e) => {
        if (!e.target.closest('.delete-tile')) {
            window.location.href = url;
        }
    });

    return tile;
}

function saveQuickAccess() {
    const tiles = Array.from(document.querySelectorAll('.quick-tile'))
        .filter(tile => tile.id !== 'add-tile')
        .map(tile => ({
            url: tile.dataset.url,
            name: tile.querySelector('span').textContent
        }));
    
    localStorage.setItem('quickAccessTiles', JSON.stringify(tiles));
}

function addNewTile() {
    const url = prompt('Enter the website URL:');
    if (!url) return;
    
    try {
        // Validate URL
        new URL(url);
        
        const name = prompt('Enter a name for this shortcut:');
        if (!name) return;
        
        const quickAccess = document.querySelector('.quick-access');
        const tile = createTile(url, name);
        quickAccess.insertBefore(tile, document.getElementById('add-tile'));
        
        saveQuickAccess();
    } catch (error) {
        alert('Please enter a valid URL (include https:// or http://)');
    }
}

// Welcome message
function updateWelcomeMessage() {
    const timeSpan = document.getElementById('timeOfDay');
    if (!timeSpan) return; // Add check to prevent error on results page
    
    const hour = new Date().getHours();
    if (hour < 12) timeSpan.textContent = 'morning';
    else if (hour < 18) timeSpan.textContent = 'afternoon';
    else timeSpan.textContent = 'evening';
}

// Weather functionality
const WEATHER_API_KEY = 'fdeafcc5a8c0ea20c5b28b7782a8793b'; // You'll need to sign up for a free API key

async function initializeWeather() {
    const weatherWidget = document.getElementById('weather-content');
    
    if (!localStorage.getItem('weatherPermission')) {
        weatherWidget.innerHTML = `
            <div class="weather-permission">
                <p>Would you like to see local weather information?</p>
                <button class="button" onclick="requestWeatherPermission()">Enable Weather</button>
            </div>
        `;
        return;
    }

    if (localStorage.getItem('weatherPermission') === 'granted') {
        try {
            const position = await getCurrentPosition();
            await updateWeather(position.coords.latitude, position.coords.longitude);
            // Update weather every 30 minutes
            setInterval(() => updateWeather(position.coords.latitude, position.coords.longitude), 1800000);
        } catch (error) {
            console.error('Weather error:', error);
            weatherWidget.innerHTML = '<p>Unable to fetch weather data</p>';
        }
    }
}

function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 300000 // 5 minutes
        });
    });
}

// Expose requestWeatherPermission to global scope
window.requestWeatherPermission = async function() {
    try {
        const position = await getCurrentPosition();
        localStorage.setItem('weatherPermission', 'granted');
        await updateWeather(position.coords.latitude, position.coords.longitude);
    } catch (error) {
        localStorage.setItem('weatherPermission', 'denied');
        document.getElementById('weather-content').innerHTML = '<p>Weather access denied</p>';
    }
};

async function updateWeather(lat, lon) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
        );
        const data = await response.json();
        
        const weatherWidget = document.getElementById('weather-content');
        weatherWidget.innerHTML = `
            <div class="weather-info">
                <div class="weather-main">
                    <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" 
                         alt="${data.weather[0].description}">
                    <span class="temperature">${Math.round(data.main.temp)}°C</span>
                </div>
                <div class="weather-details">
                    <span>${data.weather[0].description}</span>
                    <span>${data.name}</span>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Weather update failed:', error);
    }
}

// Banner handling
function dismissBanner() {
    const banner = document.getElementById('update-banner');
    banner.style.height = banner.offsetHeight + 'px';
    banner.offsetHeight; // Force reflow
    banner.style.height = '0';
    banner.style.opacity = '0';
    banner.style.padding = '0';
    banner.style.overflow = 'hidden';
    banner.style.transition = 'all 0.3s ease';
    
    // Updated version number in storage key
    localStorage.setItem('bannerDismissed_v2.7.0', 'true');
    
    setTimeout(() => banner.remove(), 300);
}

// Check if banner should be shown
function checkBanner() {
    // Updated version number in storage key
    if (localStorage.getItem('bannerDismissed_v2.7.0')) {
        const banner = document.getElementById('update-banner');
        if (banner) banner.remove();
    }
}

// Customize popup functionality
function initializeCustomizePopup() {
    const customizeToggle = document.querySelector('.customize-toggle');
    const customizePopup = document.querySelector('.customize-popup');
    const closePopup = document.querySelector('.close-popup');

    customizeToggle.addEventListener('click', () => {
        customizePopup.classList.add('active');
    });

    closePopup.addEventListener('click', () => {
        customizePopup.classList.remove('active');
    });

    // Initialize background controls in the popup
    const dailyBackground = document.querySelector('.popup-content #daily-background');
    const customBackground = document.querySelector('.popup-content #custom-background');
    const resetBackground = document.querySelector('.popup-content #reset-background');

    dailyBackground.addEventListener('click', async () => {
        localStorage.setItem('backgroundType', 'daily');
        await fetchNewDailyBackground();
        customizePopup.classList.remove('active');
    });

    customBackground.addEventListener('click', () => {
        const choice = confirm('Do you want to:\nOK - Upload an image\nCancel - Enter a URL');
        
        if (choice) {
            // File upload
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        setBackground(e.target.result);
                        localStorage.setItem('backgroundType', 'custom');
                        localStorage.setItem('customBackground', e.target.result);
                        customizePopup.classList.remove('active');
                    };
                    reader.readAsDataURL(file);
                }
            };
            
            input.click();
        } else {
            // URL input
            const url = prompt('Enter the image URL:');
            if (url) {
                try {
                    new URL(url); // Validate URL
                    setBackground(url);
                    localStorage.setItem('backgroundType', 'custom');
                    localStorage.setItem('customBackground', url);
                    customizePopup.classList.remove('active');
                } catch (error) {
                    alert('Please enter a valid URL');
                }
            }
        }
    });

    resetBackground.addEventListener('click', () => {
        document.querySelector('.page-background').style.backgroundImage = '';
        localStorage.removeItem('backgroundType');
        localStorage.removeItem('customBackground');
        customizePopup.classList.remove('active');
    });

    // Close popup when clicking outside
    document.addEventListener('click', (e) => {
        if (!customizePopup.contains(e.target) && !customizeToggle.contains(e.target)) {
            customizePopup.classList.remove('active');
        }
    });
}

// Add a function to check for background updates periodically
function startBackgroundUpdateCheck() {
    // Calculate time until next day
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilTomorrow = tomorrow - now;

    // First check at midnight
    setTimeout(() => {
        if (localStorage.getItem('backgroundType') === 'daily') {
            checkAndUpdateDailyBackground();
        }
        // Then check every 24 hours
        setInterval(() => {
            if (localStorage.getItem('backgroundType') === 'daily') {
                checkAndUpdateDailyBackground();
            }
        }, 86400000); // 24 hours
    }, timeUntilTomorrow);
}

function initializeMobileFeatures() {
    if (window.innerWidth > 768) return;

    // Mobile navigation handlers
    document.getElementById('mobile-apps')?.addEventListener('click', () => {
        document.getElementById('sidebar-menu').classList.add('open');
        document.getElementById('overlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    document.getElementById('mobile-theme')?.addEventListener('click', () => {
        const newTheme = document.documentElement.dataset.theme === 'style' ? 'darkstyle' : 'style';
        setTheme(newTheme);
        const icon = document.querySelector('#mobile-theme i');
        icon.className = newTheme === 'darkstyle' ? 'fas fa-sun' : 'fas fa-moon';
    });

    // Pull to refresh
    let touchStart = 0;
    let touchY = 0;
    const pullIndicator = document.querySelector('.pull-indicator');
    const mainContent = document.querySelector('.main-content');

    document.addEventListener('touchstart', (e) => {
        touchStart = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (window.scrollY === 0) {
            touchY = e.touches[0].clientY - touchStart;
            if (touchY > 0 && touchY < 120) {
                pullIndicator.style.transform = `translateY(${Math.min(touchY - 60, 0)}px)`;
                e.preventDefault();
            }
        }
    }, { passive: false });

    document.addEventListener('touchend', () => {
        if (touchY > 60) {
            pullIndicator.style.transform = 'translateY(0)';
            // Add loading animation
            pullIndicator.querySelector('i').style.animation = 'spin 1s linear infinite';
            // Refresh after animation
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } else {
            pullIndicator.style.transform = 'translateY(-100%)';
        }
        touchY = 0;
    });

    // Active states for touch elements
    const touchElements = document.querySelectorAll('.quick-tile, .sidebar-link, .auth-button, .dropdown-item, .nav-item');
    touchElements.forEach(element => {
        element.addEventListener('touchstart', () => element.classList.add('active'), { passive: true });
        element.addEventListener('touchend', () => element.classList.remove('active'), { passive: true });
        element.addEventListener('touchcancel', () => element.classList.remove('active'), { passive: true });
    });

    // Handle bottom nav active states
    const pathname = window.location.pathname;
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('href') === pathname) {
            item.classList.add('active');
        }
    });

    // Add voice search functionality
    if ('webkitSpeechRecognition' in window) {
        const voiceSearchBtn = document.createElement('button');
        voiceSearchBtn.className = 'voice-search-btn';
        voiceSearchBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        document.querySelector('.search-box').appendChild(voiceSearchBtn);

        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        voiceSearchBtn.addEventListener('click', () => {
            recognition.start();
            voiceSearchBtn.classList.add('listening');
        });

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.querySelector('input[name="q"]').value = transcript;
            if (!window.location.pathname.includes('results.html')) {
                window.location.href = `results.html?q=${encodeURIComponent(transcript)}`;
            } else {
                document.querySelector('.search-form').submit();
            }
        };

        recognition.onend = () => {
            voiceSearchBtn.classList.remove('listening');
        };
    }

    // Add swipe navigation for results page
    if (window.location.pathname.includes('results.html')) {
        let touchStartX = 0;
        let touchEndX = 0;
        
        document.addEventListener('touchstart', e => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        document.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].clientX;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            const swipeDistance = touchEndX - touchStartX;
            if (Math.abs(swipeDistance) > 100) {
                const nextBtn = document.querySelector('.next-page');
                const prevBtn = document.querySelector('.prev-page');
                if (swipeDistance > 0 && prevBtn) {
                    prevBtn.click();
                } else if (swipeDistance < 0 && nextBtn) {
                    nextBtn.click();
                }
            }
        }
    }

    // Add bottom sheet for filters on mobile
    if (window.location.pathname.includes('results.html')) {
        const filtersBtn = document.createElement('button');
        filtersBtn.className = 'mobile-filters-btn';
        filtersBtn.innerHTML = '<i class="fas fa-filter"></i>';
        document.querySelector('.header-right').appendChild(filtersBtn);

        const filterSheet = document.createElement('div');
        filterSheet.className = 'filter-sheet';
        filterSheet.innerHTML = `
            <div class="filter-sheet-content">
                <div class="filter-sheet-header">
                    <h3>Filters</h3>
                    <button class="close-sheet"><i class="fas fa-times"></i></button>
                </div>
                <div class="filter-options">
                    <!-- Filters will be moved here -->
                </div>
            </div>
        `;
        document.body.appendChild(filterSheet);

        filtersBtn.addEventListener('click', () => {
            filterSheet.classList.add('active');
        });

        filterSheet.querySelector('.close-sheet').addEventListener('click', () => {
            filterSheet.classList.remove('active');
        });

        // Move filters to sheet on mobile
        const filters = document.querySelector('.search-filters');
        if (filters) {
            filterSheet.querySelector('.filter-options').appendChild(filters.cloneNode(true));
            filters.style.display = 'none';
        }
    }

    // Add loading skeleton for results
    if (window.location.pathname.includes('results.html')) {
        const resultsContainer = document.querySelector('.results-container');
        const loadingSkeleton = `
            <div class="skeleton-loader">
                ${Array(5).fill(`
                    <div class="skeleton-result">
                        <div class="skeleton-title"></div>
                        <div class="skeleton-url"></div>
                        <div class="skeleton-snippet"></div>
                    </div>
                `).join('')}
            </div>
        `;
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    const loading = mutation.addedNodes[0];
                    if (loading.className === 'loading') {
                        loading.innerHTML = loadingSkeleton;
                    }
                }
            });
        });

        observer.observe(resultsContainer, { childList: true });
    }
}

// News API key (you'll need to sign up for one)
const YOUTUBE_API_KEY = 'AIzaSyC9Sdcw7_34F02AaqgM_0K6ZfquDDDOlQk';

async function initializeDiscover() {
    // Tab switching
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show correct content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${target}-content`).classList.add('active');
            
            // Load content if needed
            if (target === 'news' && !document.querySelector('.news-card')) {
                loadNews();
            } else if (target === 'videos' && !document.querySelector('.video-card')) {
                loadVideos();
            } else if (target === 'topics' && !document.querySelector('.topic-card')) {
                loadTopics();
            }
        });
    });

    // Load initial news
    loadNews();
}

async function loadNews() {
    try {
        // Replace Reuters with a CORS-friendly news API
        const newsGrid = document.querySelector('.news-grid');
        if (!newsGrid) return;

        const response = await fetch('https://api.nytimes.com/svc/topstories/v2/technology.json?api-key=YOUR_NYT_API_KEY');
        const data = await response.json();
        
        newsGrid.innerHTML = data.results.slice(0, 6).map(article => `
            <article class="news-card">
                <img src="${article.multimedia?.[0]?.url || 'https://d2zcpib8duehag.cloudfront.net/default-news.jpg'}" 
                     alt="${article.title}" class="news-image">
                <div class="news-content">
                    <div class="news-source">New York Times</div>
                    <h3 class="news-title">${article.title}</h3>
                    <time class="news-date">${new Date(article.published_date).toLocaleDateString()}</time>
                </div>
            </article>
        `).join('');
    } catch (error) {
        console.error('Failed to load news:', error);
        const newsGrid = document.querySelector('.news-grid');
        if (newsGrid) {
            newsGrid.innerHTML = '<div class="error-message">Unable to load news at this time</div>';
        }
    }
}

async function loadVideos() {
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&chart=mostPopular&maxResults=6&key=${YOUTUBE_API_KEY}`);
        const data = await response.json();
        
        const videoGrid = document.querySelector('.video-grid');
        videoGrid.innerHTML = data.items.map(video => `
            <article class="video-card">
                <img src="${video.snippet.thumbnails.medium.url}" alt="${video.snippet.title}" class="video-thumbnail">
                <span class="video-duration">${formatDuration(video.contentDetails.duration)}</span>
                <div class="video-info">
                    <h3 class="video-title">${video.snippet.title}</h3>
                    <div class="video-channel">${video.snippet.channelTitle}</div>
                </div>
            </article>
        `).join('');
    } catch (error) {
        console.error('Failed to load videos:', error);
    }
}

function loadTopics() {
    const topics = [
        { icon: '🌍', name: 'World' },
        { icon: '💻', name: 'Technology' },
        { icon: '🎮', name: 'Gaming' },
        { icon: '🎬', name: 'Entertainment' },
        { icon: '📈', name: 'Business' },
        { icon: '🔬', name: 'Science' },
        { icon: '⚽', name: 'Sports' },
        { icon: '🎨', name: 'Arts' }
    ];
    
    const topicsGrid = document.querySelector('.topics-grid');
    topicsGrid.innerHTML = topics.map(topic => `
        <div class="topic-card">
            <div class="topic-icon">${topic.icon}</div>
            <div class="topic-name">${topic.name}</div>
        </div>
    `).join('');
}

function formatDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = match[1] ? match[1].replace('H', '') : 0;
    const minutes = match[2] ? match[2].replace('M', '') : 0;
    const seconds = match[3] ? match[3].replace('S', '') : 0;
    
    if (hours > 0) {
        return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.padStart(2, '0')}`;
}

// Initialize general features
function initializeGeneralFeatures() {
    initializeTooltips();
    initializeKeyboardShortcuts();
    initializeA11y();
    initializeClipboard();
    initializeScrollProgress();
    initializeOfflineMode();
}

function initializeTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(element => {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = element.dataset.tooltip;
        
        element.addEventListener('mouseenter', () => {
            document.body.appendChild(tooltip);
            const rect = element.getBoundingClientRect();
            tooltip.style.top = `${rect.bottom + 10}px`;
            tooltip.style.left = `${rect.left + (rect.width/2) - (tooltip.offsetWidth/2)}px`;
            setTimeout(() => tooltip.classList.add('visible'), 10);
        });

        element.addEventListener('mouseleave', () => {
            tooltip.classList.remove('visible');
            setTimeout(() => tooltip.remove(), 200);
        });
    });
}

function initializeKeyboardShortcuts() {
    const shortcuts = {
        '/': () => document.querySelector('.search-input').focus(),
        'g h': () => window.location.href = 'index.html',
        'g r': () => window.location.href = 'results.html',
        'g s': () => document.querySelector('.search-filters').focus(),
        'Escape': () => document.activeElement.blur()
    };

    let keys = [];
    document.addEventListener('keydown', (e) => {
        if (e.target.matches('input, textarea')) return;
        
        keys.push(e.key);
        const combo = keys.join(' ');
        
        if (shortcuts[combo]) {
            e.preventDefault();
            shortcuts[combo]();
        }
        
        setTimeout(() => keys = [], 1000);
    });
}

function initializeA11y() {
    // Add ARIA labels and roles
    document.querySelectorAll('.search-result').forEach(result => {
        result.setAttribute('role', 'article');
    });

    document.querySelectorAll('.filter-option').forEach(filter => {
        filter.setAttribute('role', 'tab');
        filter.setAttribute('tabindex', '0');
    });

    // Add keyboard navigation for filter options
    const filterOptions = document.querySelectorAll('.filter-option');
    filterOptions.forEach(option => {
        option.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                option.click();
            }
        });
    });
}

function initializeClipboard() {
    document.querySelectorAll('.result-url').forEach(url => {
        url.style.cursor = 'pointer';
        url.setAttribute('role', 'button');
        url.setAttribute('tabindex', '0');
        url.setAttribute('data-tooltip', 'Click to copy URL');
        
        url.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(url.textContent);
                showToast('URL copied to clipboard');
            } catch (err) {
                showToast('Failed to copy URL');
            }
        });
    });
}

function initializeScrollProgress() {
    const progress = document.createElement('div');
    progress.className = 'scroll-progress';
    document.body.appendChild(progress);

    window.addEventListener('scroll', () => {
        const winScroll = document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progress.style.width = scrolled + '%';
    });
}

function initializeOfflineMode() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registered');
            })
            .catch(error => {
                console.error('ServiceWorker registration failed:', error);
            });
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
}

function updateOnlineStatus() {
    const status = navigator.onLine;
    const offlineBanner = document.querySelector('.offline-banner') || createOfflineBanner();
    
    if (!status) {
        document.body.appendChild(offlineBanner);
        document.body.classList.add('offline');
    } else {
        offlineBanner.remove();
        document.body.classList.remove('offline');
    }
}

function createOfflineBanner() {
    const banner = document.createElement('div');
    banner.className = 'offline-banner';
    banner.innerHTML = `
        <i class="fas fa-wifi-slash"></i>
        <span>You are currently offline</span>
        <button onclick="location.reload()">Retry</button>
    `;
    return banner;
}

function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('visible');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 200);
    }, duration);
}

// Initialize search filters
function initializeSearchFilters() {
    const filters = document.querySelectorAll('.filter-option');
    const searchForm = document.querySelector('.search-form');

    filters.forEach(filter => {
        filter.addEventListener('click', () => {
            // Update active state
            filters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');

            // Get current search query
            const urlParams = new URLSearchParams(window.location.search);
            const query = urlParams.get('q');
            if (!query) return;

            const searchType = filter.dataset.type;
            handleFilteredSearch(query, searchType);
        });
    });
}

async function handleFilteredSearch(query, searchType) {
    const resultsContainer = document.querySelector('.results-container');
    resultsContainer.innerHTML = '<div class="loading">Searching...</div>';

    try {
        const results = await performSearch(query, 1, searchType);
        
        // Update URL without reload
        const url = new URL(window.location);
        url.searchParams.set('type', searchType);
        window.history.pushState({}, '', url);

        let searchHTML = `
            <div class="search-stats">
                About ${results.searchInformation.formattedTotalResults} results 
                (${results.searchInformation.formattedSearchTime} seconds)
            </div>
            <div class="search-results">
                ${results.items.map(createSearchResult).join('')}
            </div>
            ${createPagination(results.queries)}
        `;
        
        resultsContainer.innerHTML = searchHTML;
        
        // Add pagination event listeners
        document.querySelectorAll('.page-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const startIndex = parseInt(e.currentTarget.dataset.start);
                handleFilteredSearch(query, searchType, startIndex);
                window.scrollTo(0, 0);
            });
        });
    } catch (error) {
        resultsContainer.innerHTML = `
            <div class="error-message">
                <p>Sorry, something went wrong with the search.</p>
                <p>${error.message}</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const initGoogleSearch = () => {
        const resultsDiv = document.getElementById('search-results');
        if (!resultsDiv) return;

        if (window.google && google.search && google.search.cse.element) {
            google.search.cse.element.render({
                div: 'search-results',
                tag: 'searchresults-only'
            });
        } else {
            const fallback = document.getElementById('search-fallback');
            if (fallback) {
                fallback.style.display = 'block';
            }
            // Try again in a second
            setTimeout(initGoogleSearch, 1000);
        }
    };

    initGoogleSearch();
    
    const isHomePage = !window.location.pathname.includes('results.html');
    
    // Always initialize these features
    initializeAuth();
    initializeEventListeners();
    setTheme(localStorage.getItem('theme') || 'style');
    
    // Initialize search with Astro support
    if (!isHomePage) {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        
        if (query) {
            // Handle Astro overview generation
            generateOverview(query).then(data => {
                if (data) {
                    displayOverview(data);
                }
            });
        }

        // Add event listener for new searches
        document.querySelector('.search-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const searchQuery = e.target.querySelector('input[name="q"]').value;
            
            // Update URL
            const url = new URL(window.location);
            url.searchParams.set('q', searchQuery);
            window.history.pushState({}, '', url);

            // Generate new Astro overview
            const data = await generateOverview(searchQuery);
            if (data) {
                displayOverview(data);
            }

            // Trigger Google CSE search
            const gsc = document.querySelector('.gsc-control-cse');
            if (gsc) {
                const gscInput = gsc.querySelector('.gsc-input-box input');
                const gscButton = gsc.querySelector('.gsc-search-button');
                if (gscInput && gscButton) {
                    gscInput.value = searchQuery;
                    gscButton.click();
                }
            }
        });
    }

    // Only initialize home page features if we're on the home page
    if (isHomePage) {
        initializeBackgrounds();
        initializeQuickAccess();
        updateWelcomeMessage();
        initializeWeather();
        checkBanner();
        initializeBackgroundControls();
        initializeCustomizePopup();
        startBackgroundUpdateCheck();
        
        // Restore background settings
        const backgroundType = localStorage.getItem('backgroundType');
        if (backgroundType === 'daily') {
            document.getElementById('daily-background').click();
        } else if (backgroundType === 'custom') {
            const customBackground = localStorage.getItem('customBackground');
            if (customBackground) {
                setBackground(customBackground);
            }
        }
        
        // Update welcome message every hour
        setInterval(updateWelcomeMessage, 3600000);
    }

    initializeMobileFeatures();
    initializeDiscover();
    initializeGeneralFeatures();
    
    if (!isHomePage) {
        initializeSearchFilters();
        
        // Set initial active filter based on URL
        const urlParams = new URLSearchParams(window.location.search);
        const searchType = urlParams.get('type') || 'all';
        document.querySelector(`.filter-option[data-type="${searchType}"]`)?.classList.add('active');
    }
});