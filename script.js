let auth0Client;

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
            if (user && user.picture) {
                document.getElementById('user-picture').src = user.picture;
            }
            if (user && user.name) {
                document.getElementById('user-name').textContent = user.name;
            }
            loginButton.style.display = 'none';
            userInfo.style.display = 'flex';
        } else {
            loginButton.style.display = 'block';
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
    const backgrounds = [
        'https://source.unsplash.com/daily?nature',
        'https://source.unsplash.com/daily?landscape',
        'https://source.unsplash.com/daily?city'
    ];
    
    const savedBackground = localStorage.getItem('background') || backgrounds[0];
    setBackground(savedBackground);
}

function setBackground(url) {
    document.querySelector('.page-background').style.backgroundImage = `url(${url})`;
    localStorage.setItem('background', url);
}

// Quick access tiles
function initializeQuickAccess() {
    const tiles = document.querySelectorAll('.quick-tile');
    tiles.forEach(tile => {
        if (tile.dataset.url) {
            tile.addEventListener('click', () => window.location.href = tile.dataset.url);
        }
    });

    document.getElementById('add-tile').addEventListener('click', addNewTile);
}

function addNewTile() {
    const url = prompt('Enter the website URL:');
    const name = prompt('Enter a name for this shortcut:');
    
    if (url && name) {
        const quickAccess = document.querySelector('.quick-access');
        const newTile = document.createElement('div');
        newTile.className = 'quick-tile';
        newTile.dataset.url = url;
        
        // Use DuckDuckGo's favicon service
        const domain = new URL(url).hostname;
        const favicon = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
        
        newTile.innerHTML = `
            <img src="${favicon}" alt="${name}" class="nova-icon" onerror="this.onerror=null; this.src='https://icons.duckduckgo.com/ip3/nova.xxavvgroup.com.ico';">
            <span>${name}</span>
        `;
        newTile.addEventListener('click', () => window.location.href = url);
        quickAccess.insertBefore(newTile, document.getElementById('add-tile'));
        
        // Save to localStorage
        saveQuickAccess();
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
    
    // Store dismissal in localStorage
    localStorage.setItem('bannerDismissed_v2.2', 'true');
    
    // Remove banner after animation
    setTimeout(() => banner.remove(), 300);
}

// Check if banner should be shown
function checkBanner() {
    if (localStorage.getItem('bannerDismissed_v2.2')) {
        const banner = document.getElementById('update-banner');
        if (banner) banner.remove();
    }
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
    
    // Update welcome message every hour
    setInterval(updateWelcomeMessage, 3600000);
});
