document.getElementById("app-button").addEventListener("click", () => {
    const sidebar = document.getElementById("sidebar-menu");
    
    // Toggle sidebar visibility
    if (sidebar.style.right === "0px") {
        sidebar.style.right = "-250px"; // Hide
    } else {
        sidebar.style.right = "0px"; // Show
    }
});

document.getElementById("close-sidebar").addEventListener("click", () => {
    const sidebar = document.getElementById("sidebar-menu");
    
    // Hide sidebar
    sidebar.style.right = "-250px";
});