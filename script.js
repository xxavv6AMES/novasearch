let auth0Client;

// Initialize Auth0
async function initAuth0() {
    auth0Client = await auth0.createAuth0Client({
        domain: 'auth.novawerks.xxavvgroup.com',
        clientId: 'RGfDMp59V4UhqLIBZYwVZqHQwKly3lQ3',
        authorizationParams: {
            redirect_uri: window.location.origin
        }
    });

    // Check if user is returning from authentication
    if (location.search.includes("code=") && location.search.includes("state=")) {
        await auth0Client.handleRedirectCallback();
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    updateUIState();
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

// Login handler
document.getElementById('login-button').addEventListener('click', async () => {
    await auth0Client.loginWithRedirect();
});

// Logout handler
document.getElementById('logout-button').addEventListener('click', async () => {
    await auth0Client.logout({
        logoutParams: {
            returnTo: window.location.origin
        }
    });
});

document.getElementById("app-button").addEventListener("click", () => {
    const sidebar = document.getElementById("sidebar-menu");
    
    // Toggle sidebar visibility
    sidebar.classList.add("open"); // Show sidebar
});

document.getElementById("close-sidebar").addEventListener("click", () => {
    const sidebar = document.getElementById("sidebar-menu");
    
    // Hide sidebar
    sidebar.classList.remove("open"); // Hide sidebar
});

document.addEventListener('DOMContentLoaded', () => {
    initAuth0();

    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    // Check for stored theme preference or default to 'style'
    const currentTheme = localStorage.getItem('theme') || 'style';
    setTheme(currentTheme);

    themeToggle.addEventListener('click', () => {
        const newTheme = document.documentElement.dataset.theme === 'style' ? 'darkstyle' : 'style';
        setTheme(newTheme);
    });

    function setTheme(theme) {
        // Set the theme attribute on the HTML root element
        document.documentElement.dataset.theme = theme;

        // Store the preference in localStorage
        localStorage.setItem('theme', theme);

        // Update the theme icon dynamically
        themeIcon.className = theme === 'darkstyle' ? 'fas fa-sun' : 'fas fa-moon';

        // Update the stylesheet
        let link = document.querySelector('link[rel="stylesheet"][id="theme-style"]');
        if (!link) {
            // If theme stylesheet doesn't exist, create it
            link = document.createElement('link');
            link.id = 'theme-style';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
        link.href = theme === 'darkstyle' ? 'darkstyle.css' : 'style.css';
    }
});
