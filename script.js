// Main Application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the app
    initApp();
});

function initApp() {
    // Set up event listeners
    setupNavToggle();
    setupNavigation();
    checkAuthState();
    
    // Load initial page
    loadPage('home');
}

// Navigation
function setupNavToggle() {
    const toggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    
    toggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link:not(.logout-btn)');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            loadPage(page);
            
            // Close mobile menu if open
            document.getElementById('navLinks').classList.remove('active');
        });
    });
    
    // Logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser();
        });
    }
}

// Page Loading
function loadPage(page) {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
    
    // Hide all pages first
    const pages = ['home', 'menu', 'order', 'login', 'register', 'dashboard', 'kitchen'];
    pages.forEach(p => {
        const elem = document.getElementById(p + 'Page');
        if (elem) elem.style.display = 'none';
    });
    
    // Load the requested page
    switch(page) {
        case 'home':
            loadHomePage();
            break;
        case 'menu':
            loadMenuPage();
            break;
        case 'order':
            loadOrderPage();
            break;
        case 'login':
            loadLoginPage();
            break;
        case 'register':
            loadRegisterPage();
            break;
        case 'dashboard':
            loadDashboardPage();
            break;
        case 'kitchen':
            loadKitchenPage();
            break;
        default:
            loadHomePage();
    }
    
    // Update active link
    updateActiveNavLink(page);
}

function updateActiveNavLink(activePage) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.getAttribute('data-page') === activePage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Authentication
function checkAuthState() {
    fetch('auth_check.php')
        .then(response => response.json())
        .then(data => {
            const authLinks = document.getElementById('authLinks');
            const staffLinks = document.getElementById('staffLinks');
            
            if (data.isLoggedIn) {
                authLinks.style.display = 'none';
                
                if (data.isStaff) {
                    staffLinks.style.display = 'flex';
                }
            } else {
                authLinks.style.display = 'flex';
                staffLinks.style.display = 'none';
            }
        });
}

function logoutUser() {
    fetch('logout.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                checkAuthState();
                loadPage('home');
            }
        });
}

// Page Components
function loadHomePage() {
    const mainContent = document.getElementById('mainContent');
    
    fetch('api/get_featured_items.php')
        .then(response => response.json())
        .then(data => {
            let html = `
                <div id="homePage">
                    <section class="hero">
                        <div class="hero-content">
                            <h2>Experience Our Legendary Sup Tulang ZZ</h2>
                            <p>27 years of authentic recipe passed down through generations</p>
                            <a href="#" class="btn" data-page="menu">View Menu</a>
                        </div>
                    </section>
                    
                    <section class="featured">
                        <h2 class="section-title">Our Signature Dishes</h2>
                        <div class="featured-grid">
            `;
            
            data.forEach(item => {
                html += `
                    <div class="featured-item" data-item-id="${item.item_id}">
                        <img src="${item.image_url || 'placeholder.jpg'}" alt="${item.name}">
                        <h3>${item.name}</h3>
                        <p>RM ${item.price.toFixed(2)}</p>
                        <button class="btn add-to-cart-btn">Add to Order</button>
                    </div>
                `;
            });
            
            html += `
                        </div>
                    </section>
                    
                    <section class="order-options">
                        <div class="card">
                            <h3>Dine-In</h3>
                            <p>Scan the QR code at your table to order</p>
                            <img src="qr-placeholder.png" alt="QR Code" class="qr-placeholder">
                        </div>
                        <div class="card">
                            <h3>Takeaway</h3>
                            <p>Order online for pickup</p>
                            <a href="#" class="btn" data-page="menu">Order Now</a>
                        </div>
                    </section>
                </div>
            `;
            
            mainContent.innerHTML = html;
            setupAddToCartButtons();
        });
}

function loadMenuPage() {
    const mainContent = document.getElementById('mainContent');
    
    fetch('menu_api.php')
        .then(response => response.json())
        .then(categories => {
            let html = `
                <div id="menuPage">
                    <h2 class="section-title">Our Menu</h2>
                    <div class="menu-categories">
            `;
            
            categories.forEach(category => {
                html += `
                    <div class="menu-category" data-category-id="${category.category_id}">
                        <h3>${category.name}</h3>
                        <div class="menu-items" id="category-${category.category_id}"></div>
                    </div>
                `;
            });
            
            html += `</div></div>`;
            mainContent.innerHTML = html;
            
            // Load items for each category
            categories.forEach(category => {
                fetch(`menu_api.php?category_id=${category.category_id}`)
                    .then(response => response.json())
                    .then(items => {
                        const container = document.getElementById(`category-${category.category_id}`);
                        let itemsHtml = '';
                        
                        items.forEach(item => {
                            itemsHtml += `
                                <div class="menu-item ${item.is_signature ? 'signature' : ''}" data-item-id="${item.item_id}">
                                    <div class="item-image">
                                        <img src="${item.image_url || 'placeholder.jpg'}" alt="${item.name}">
                                        ${item.is_signature ? '<span class="signature-badge">Signature</span>' : ''}
                                    </div>
                                    <div class="item-info">
                                        <h4>${item.name}</h4>
                                        <p class="item-desc">${item.description || ''}</p>
                                        <div class="item-footer">
                                            <span class="item-price">RM ${item.price.toFixed(2)}</span>
                                            <button class="btn add-to-cart-btn">Add</button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        
                        container.innerHTML = itemsHtml;
                        setupAddToCartButtons();
                    });
            });
        });
}

function setupAddToCartButtons() {
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.closest('[data-item-id]').getAttribute('data-item-id');
            showItemCustomizationModal(itemId);
        });
    });
}

function showItemCustomizationModal(itemId) {
    fetch(`menu_api.php?item_id=${itemId}`)
        .then(response => response.json())
        .then(item => {
            let optionsHtml = '';
            
            if (item.options && item.options.length > 0) {
                optionsHtml += `<div class="custom-options"><h4>Options</h4>`;
                
                item.options.forEach(option => {
                    optionsHtml += `
                        <div class="form-group">
                            <label class="option-label">
                                <input type="checkbox" name="option" value="${option.option_id}">
                                ${option.name} (+RM ${option.additional_price.toFixed(2)})
                            </label>
                        </div>
                    `;
                });
                
                optionsHtml += `</div>`;
            }
            
            const modalHtml = `
                <div class="modal" id="customizationModal">
                    <div class="modal-content">
                        <span class="close-modal">&times;</span>
                        <h3>${item.name}</h3>
                        <p>${item.description || ''}</p>
                        
                        <div class="form-group">
                            <label class="form-label">Special Requests</label>
                            <textarea class="form-control" id="specialRequests" rows="3"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Quantity</label>
                            <input type="number" class="form-control" id="itemQuantity" min="1" value="1">
                        </div>
                        
                        ${optionsHtml}
                        
                        <button class="btn" id="addToOrderBtn">Add to Order</button>
                    </div>
                </div>
            `;
            
            document.getElementById('modalContainer').innerHTML = modalHtml;
            document.getElementById('customizationModal').style.display = 'block';
            
            // Set up modal close button
            document.querySelector('.close-modal').addEventListener('click', () => {
                document.getElementById('customizationModal').style.display = 'none';
            });
            
            // Set up add to order button
            document.getElementById('addToOrderBtn').addEventListener('click', () => {
                addItemToCart(item);
            });
        });
}

function addItemToCart(item) {
    const quantity = parseInt(document.getElementById('itemQuantity').value) || 1;
    const specialRequests = document.getElementById('specialRequests').value;
    
    // Get selected options
    const selectedOptions = [];
    document.querySelectorAll('input[name="option"]:checked').forEach(option => {
        selectedOptions.push(parseInt(option.value));
    });
    
    // Calculate total price
    let totalPrice = item.price * quantity;
    if (selectedOptions.length > 0) {
        // In a real app, we'd fetch option prices from the server
        totalPrice += selectedOptions.length * 2; // Simplified for demo
    }
    
    // Add to cart (in a real app, this would be saved to session/database)
    const cart = JSON.parse(localStorage.getItem('cart') || []);
    cart.push({
        item_id: item.item_id,
        name: item.name,
        price: item.price,
        total_price: totalPrice,
        quantity: quantity,
        special_requests: specialRequests,
        options: selectedOptions,
        image_url: item.image_url
    });
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Close modal
    document.getElementById('customizationModal').style.display = 'none';
    
    // Show confirmation
    alert(`${item.name} added to your order!`);
}

// Other page loading functions would follow similar patterns
// (login, register, dashboard, kitchen, etc.)

// Utility functions
function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
}