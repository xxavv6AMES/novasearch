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
