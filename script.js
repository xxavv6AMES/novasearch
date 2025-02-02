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
    const isAuthenticated = await auth0Client.isAuthenticated();
    const loginButton = document.getElementById('login-button');
    const userInfo = document.getElementById('user-info');

    if (isAuthenticated) {
        const user = await auth0Client.getUser();
        document.getElementById('user-picture').src = user.picture;
        document.getElementById('user-name').textContent = user.name;
        loginButton.style.display = 'none';
        userInfo.style.display = 'flex';
    } else {
        loginButton.style.display = 'block';
        userInfo.style.display = 'none';
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

document.addEventListener('DOMContentLoaded', () => {
    initAuth0();
    initializeEventListeners();
    setTheme(localStorage.getItem('theme') || 'style');
});
