// Navigation management functions
class NavigationManager {
    constructor() {
        this.currentPage = window.location.pathname.split('/').pop();
    }

    async loadNavigation() {
        try {
            const response = await fetch('../html/NavigationBar.html');
            const html = await response.text();
            document.getElementById('navbar-placeholder').innerHTML = html;
            
            this.updateNavigation();
            this.setActiveLink();
        } catch (error) {
            console.error('Error loading navigation:', error);
        }
    }

    updateNavigation() {
        const isLoggedIn = sessionStorage.getItem('userLoggedIn') === 'true';
        const userData = JSON.parse(sessionStorage.getItem('userData'));
        
        console.log('Updating navigation - Login status:', isLoggedIn);
        console.log('User data:', userData);

        const guestNav = document.querySelector('.guest-nav');
        const userNav = document.querySelector('.user-nav');
        const userFullName = document.getElementById('userFullName');

        if (isLoggedIn && userData) {
            guestNav.style.display = 'none';
            userNav.style.display = 'block';
            userFullName.textContent = userData.fullname || 'User';
        } else {
            guestNav.style.display = 'block';
            userNav.style.display = 'none';
        }
    }

    setActiveLink() {
        const links = document.querySelectorAll('.nav-link');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href === this.currentPage) {
                link.classList.add('active');
            }
        });
    }
}

// Handle logout
function handleLogout() {
    // Clear session storage
    sessionStorage.removeItem('userLoggedIn');
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('checkoutData');
    
    // Clear local storage cart
    localStorage.removeItem('cart');
    
    // Redirect to home page
    window.location.href = 'HomePage.html';
}

// Initialize navigation
const navigationManager = new NavigationManager();
window.navigationManager = navigationManager;

// If the page has a navbar placeholder, load the navigation
if (document.getElementById('navbar-placeholder')) {
    navigationManager.loadNavigation();
} 