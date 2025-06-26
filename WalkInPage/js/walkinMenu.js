document.addEventListener('DOMContentLoaded', function() {
    // Get table ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tableId = urlParams.get('table');
    
    // Validate table ID
    if (!tableId) {
        alert('Invalid table ID');
        window.location.href = 'WalkInPage.html';
        return;
    }

    // Display table number
    document.getElementById('tableNumber').textContent = tableId;

    // Load menu items
    loadMenuItems();
    updateCartCounter();
});

// Menu items data (you can load this from a database in production)
const menuItems = {
    1: { name: "Cheese Lover Burger", price: 15.90, image: "../assets/food/cheese_lover_burger.png", description: "A heavenly combination of melted cheddar, mozzarella, and Swiss cheese with our signature beef patty and special sauce." },
    2: { name: "Chicken Deluxe Burger", price: 13.90, image: "../assets/food/chicken_deluxe_burger.png", description: "Crispy breaded chicken fillet topped with fresh lettuce, tomatoes, and our signature mayo sauce." },
    3: { name: "Grilled Beef Burger", price: 16.90, image: "../assets/food/grilled_beef_burger.png", description: "Premium beef patty grilled to perfection, topped with caramelized onions and our smoky BBQ sauce." },
    4: { name: "Classic Burger", price: 12.90, image: "../assets/food/1.png", description: "Our timeless classic with 100% beef patty, fresh vegetables, cheese, and house-made special sauce." },
    5: { name: "Double Beef Burger", price: 18.90, image: "../assets/food/2.png", description: "Double the satisfaction with two juicy beef patties, double cheese, and all the fresh toppings." },
    6: { name: "Spicy Chicken Burger", price: 14.90, image: "../assets/food/3.png", description: "Spicy crispy chicken fillet with fresh lettuce, jalapeños, and our signature spicy mayo sauce." },
    7: { name: "Fish Fillet Burger", price: 13.90, image: "../assets/food/4.png", description: "Crispy breaded fish fillet with fresh lettuce, cheese, and our special tartar sauce." },
    8: { name: "Mushroom Swiss Burger", price: 16.90, image: "../assets/food/5.png", description: "Juicy beef patty topped with sautéed mushrooms, melted Swiss cheese, and garlic aioli." },
    9: { name: "BBQ Bacon Burger", price: 17.90, image: "../assets/food/6.png", description: "Beef patty topped with crispy bacon, cheddar cheese, onion rings, and sweet BBQ sauce." }
};

function loadMenuItems() {
    const menuContainer = document.getElementById('menu-container');
    menuContainer.innerHTML = ''; // Clear existing items
    
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
                    <button class="btn btn-brown" onclick="openQuantityModal(${id}, '${item.name}', ${item.price}, '${item.image}')">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
        menuContainer.appendChild(card);
    });
}

let currentItem = null;

function openQuantityModal(id, name, price, image) {
    currentItem = { id, name, price, image };
    document.getElementById('modalItemName').textContent = name;
    document.getElementById('modalItemPrice').textContent = `RM ${price.toFixed(2)}`;
    document.getElementById('modalItemImage').src = image;
    document.getElementById('quantityValue').textContent = '1';
    
    const modal = new bootstrap.Modal(document.getElementById('quantityModal'));
    modal.show();
}

function incrementQuantity() {
    const quantityElement = document.getElementById('quantityValue');
    let quantity = parseInt(quantityElement.textContent);
    quantityElement.textContent = quantity + 1;
}

function decrementQuantity() {
    const quantityElement = document.getElementById('quantityValue');
    let quantity = parseInt(quantityElement.textContent);
    if (quantity > 1) {
        quantityElement.textContent = quantity - 1;
    }
}

function confirmAddToCart() {
    const quantity = parseInt(document.getElementById('quantityValue').textContent);
    const urlParams = new URLSearchParams(window.location.search);
    const tableId = urlParams.get('table');
    
    const cartItem = {
        ...currentItem,
        quantity,
        tableId,
        timestamp: new Date().toISOString()
    };

    // Get existing cart or initialize new one
    let cart = JSON.parse(localStorage.getItem(`walkInCart_${tableId}`)) || [];
    
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(item => item.id === cartItem.id);
    
    if (existingItemIndex !== -1) {
        // Update quantity if item exists
        cart[existingItemIndex].quantity += quantity;
    } else {
        // Add new item if it doesn't exist
        cart.push(cartItem);
    }

    // Save updated cart
    localStorage.setItem(`walkInCart_${tableId}`, JSON.stringify(cart));
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('quantityModal'));
    modal.hide();
    
    // Update cart counter
    updateCartCounter();
}

function updateCartCounter() {
    const urlParams = new URLSearchParams(window.location.search);
    const tableId = urlParams.get('table');
    const cart = JSON.parse(localStorage.getItem(`walkInCart_${tableId}`)) || [];
    
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cart-counter').textContent = totalItems;
}

function goToCheckout() {
    const urlParams = new URLSearchParams(window.location.search);
    const tableId = urlParams.get('table');
    
    if (!tableId) {
        alert('Invalid table ID');
        return;
    }
    
    // Navigate to checkout with table ID
    window.location.href = `WalkInCheckout.html?table=${tableId}`;
}