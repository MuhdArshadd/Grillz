// Navigation management functions
function updateNavigation() {
    const isLoggedIn = sessionStorage.getItem('userLoggedIn') === 'true';
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    
    console.log('Updating navigation - Login status:', isLoggedIn);
    console.log('User data:', userData);

    // Get all relevant elements
    const loggedInMenus = document.querySelectorAll('.logged-in-menu');
    const loggedOutMenus = document.querySelectorAll('.logged-out-menu');
    const cartItems = document.querySelectorAll('.cart-item');
    const userNames = document.querySelectorAll('.user-name');

    if (isLoggedIn) {
        // Show logged-in elements
        loggedInMenus.forEach(menu => menu.style.display = 'block');
        cartItems.forEach(item => item.style.display = 'block');
        // Hide logged-out elements
        loggedOutMenus.forEach(menu => menu.style.display = 'none');
        // Update username if available
        if (userData.fullname) {
            userNames.forEach(name => name.textContent = userData.fullname);
        }
    } else {
        // Show logged-out elements
        loggedOutMenus.forEach(menu => menu.style.display = 'block');
        // Hide logged-in elements
        loggedInMenus.forEach(menu => menu.style.display = 'none');
        cartItems.forEach(item => item.style.display = 'none');
    }
}

// Function to load and initialize navigation
function loadNavigation() {
    const navPlaceholder = document.getElementById('navbar-placeholder');
    if (!navPlaceholder) return;

    fetch('NavigationBar.html')
        .then(response => response.text())
        .then(data => {
            navPlaceholder.innerHTML = data;
            updateNavigation();
        });
}

// Export functions if needed
window.navigationManager = {
    updateNavigation,
    loadNavigation
}; 