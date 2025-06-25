document.addEventListener('DOMContentLoaded', () => {
    // Check authentication status and update UI
    const isLoggedIn = isUserLoggedIn();
    const cartButton = document.getElementById('cart-button');
    
    if (isLoggedIn && cartButton) {
        cartButton.style.display = 'block';
    }

    // Render menu items
    renderMenuItems();
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