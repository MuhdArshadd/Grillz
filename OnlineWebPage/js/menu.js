document.addEventListener('DOMContentLoaded', function() {
    // Check if it's a walk-in order
    const urlParams = new URLSearchParams(window.location.search);
    const isWalkIn = urlParams.get('mode') === 'walkIn';
    const tableId = urlParams.get('table');
    
    if (isWalkIn) {
        const visitorData = JSON.parse(sessionStorage.getItem('visitorData'));
        if (!visitorData || !visitorData.visitorId) {
            alert('Invalid visitor session');
            window.location.href = 'HomePage.html';
            return;
        }
        
        // Update UI for walk-in customers
        document.getElementById('orderType').textContent = `Table #${tableId} - Walk-in Order`;
    } else {
        // Check regular user login
        const isLoggedIn = sessionStorage.getItem('userLoggedIn') === 'true';
        if (!isLoggedIn) {
            alert('Please login to view the menu');
            window.location.href = 'LoginPage.html';
            return;
        }
    }

    // Load menu items as before
    loadMenuItems();
});

function renderMenuItems() {
    const isLoggedIn = isUserLoggedIn();
    const menuContainer = document.getElementById('menu-container');
    
    // Iterate through menu items and create cards
    Object.entries(menuItems).forEach(([id, item]) => {
        const card = document.createElement('div');
        card.className = 'col-md-4';
        card.innerHTML = `
            <div class="card h-100">
                <img src="${item.image}" class="card-img-top" alt="${item.name}">
                <div class="card-body">
                    <h5 class="card-title">${item.name}</h5>
                    <p class="price text-orange">RM ${item.price.toFixed(2)}</p>
                    <p class="card-text">${item.description || ''}</p>
                    ${isLoggedIn ? 
                        `<button class="btn btn-brown" onclick="openQuantityModal(${id}, '${item.name}', ${item.price}, '${item.image}')">
                            Add to Cart
                        </button>` : 
                        `<button class="btn btn-brown" onclick="showLoginPrompt()">
                            Add to Cart
                        </button>`
                    }
                </div>
            </div>
        `;
        menuContainer.appendChild(card);
    });
}

function showLoginPrompt() {
    const loginPromptModal = new bootstrap.Modal(document.getElementById('loginPromptModal'));
    loginPromptModal.show();
}

// Modify your cart handling to include visitor information for walk-in orders
function addToCart(item) {
    const isWalkIn = new URLSearchParams(window.location.search).get('mode') === 'walkIn';
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Add walk-in information if applicable
    if (isWalkIn) {
        const visitorData = JSON.parse(sessionStorage.getItem('visitorData'));
        item.isWalkIn = true;
        item.visitorId = visitorData.visitorId;
        item.tableId = visitorData.tableId;
    }
    
    // Rest of your cart handling code...
} 