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
