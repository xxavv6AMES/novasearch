let auth0Client;
const UNSPLASH_ACCESS_KEY = 'Xo9yT7MRQzqOOFc0-VzykE1geqsTNIxb-iMYJkFgveM'; // You'll need to get this from Unsplash
const BACKGROUND_CATEGORIES = ['nature', 'landscape', 'architecture', 'minimal'];

// Initialize Auth0
async function initAuth0() {
    try {
        auth0Client = await auth0.createAuth0Client({
            domain: 'auth.novawerks.xxavvgroup.com',
            clientId: 'RGfDMp59V4UhqLIBZYwVZqHQwKly3lQ3',
            authorizationParams: {
                redirect_uri: window.location.origin
            }
        });

        if (location.search.includes("code=") && location.search.includes("state=")) {
            await auth0Client.handleRedirectCallback();
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        await updateUIState();
    } catch (error) {
        console.error('Auth0 initialization failed:', error);
    }
}

// Update UI based on authentication state
async function updateUIState() {
    try {
        const isAuthenticated = await auth0Client.isAuthenticated();
        const loginButton = document.getElementById('login-button');
        const userInfo = document.getElementById('user-info');

        if (isAuthenticated) {
            const user = await auth0Client.getUser();
            if (user) {
                document.getElementById('user-picture').src = user.picture;
                document.getElementById('user-picture-large').src = user.picture;
                document.getElementById('user-name').textContent = user.name;
                document.getElementById('user-email').textContent = user.email;
            }
            loginButton.style.display = 'none';
            userInfo.style.display = 'flex';
        } else {
            loginButton.style.display = 'flex';
            userInfo.style.display = 'none';
        }
    } catch (error) {
        console.error('Error updating UI state:', error);
    }
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

    // Auth events
    document.getElementById('login-button').addEventListener('click', () => auth0Client.loginWithRedirect());
    document.getElementById('logout-button').addEventListener('click', () => 
        auth0Client.logout({ logoutParams: { returnTo: window.location.origin } }));

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
    loadSavedTiles();
    
    const tiles = document.querySelectorAll('.quick-tile');
    tiles.forEach(tile => {
        if (tile.dataset.url) {
            // Add delete button to existing tiles
            addDeleteButton(tile);
            tile.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-tile')) {
                    window.location.href = tile.dataset.url;
                }
            });
        }
    });

    document.getElementById('add-tile').addEventListener('click', addNewTile);
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

    const domain = new URL(url).hostname;
    const favicon = `https://icons.duckduckgo.com/ip3/${domain}.ico`;

    tile.innerHTML = `
        <img src="${favicon}" alt="${name}" class="nova-icon" onerror="this.onerror=null; this.src='https://icons.duckduckgo.com/ip3/nova.xxavvgroup.com.ico';">
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
    const hour = new Date().getHours();
    const timeSpan = document.getElementById('timeOfDay');
    
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
                <button class="auth-button" onclick="requestWeatherPermission()">Enable Weather</button>
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

async function requestWeatherPermission() {
    try {
        const position = await getCurrentPosition();
        localStorage.setItem('weatherPermission', 'granted');
        await updateWeather(position.coords.latitude, position.coords.longitude);
    } catch (error) {
        localStorage.setItem('weatherPermission', 'denied');
        document.getElementById('weather-content').innerHTML = '<p>Weather access denied</p>';
    }
}

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
    localStorage.setItem('bannerDismissed_v2.4', 'true');
    
    setTimeout(() => banner.remove(), 300);
}

// Check if banner should be shown
function checkBanner() {
    // Updated version number in storage key
    if (localStorage.getItem('bannerDismissed_v2.4')) {
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

document.addEventListener('DOMContentLoaded', () => {
    initAuth0();
    initializeEventListeners();
    setTheme(localStorage.getItem('theme') || 'style');
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
});
