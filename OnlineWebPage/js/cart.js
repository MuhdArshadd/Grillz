// Add this at the beginning of cart.js
function checkAuthBeforeAction(action) {
    if (!isUserLoggedIn()) {
        showLoginPrompt();
        return false;
    }
    return true;
}

let currentItemId = null;

// Function to open quantity modal
function openQuantityModal(id, name, price, image) {
    if (!checkAuthBeforeAction('add')) return;
    
    currentItemId = id;
    document.getElementById('modalItemImage').src = image;
    document.getElementById('modalItemName').textContent = name;
    document.getElementById('modalItemPrice').textContent = `RM ${price.toFixed(2)}`;
    document.getElementById('quantityValue').textContent = '1';
    
    const modal = new bootstrap.Modal(document.getElementById('quantityModal'));
    modal.show();
}

// Function to increment quantity
function incrementQuantity() {
    const quantityElement = document.getElementById('quantityValue');
    let quantity = parseInt(quantityElement.textContent);
    if (quantity < 10) { // Set maximum quantity to 10
        quantityElement.textContent = quantity + 1;
    }
}

// Function to decrement quantity
function decrementQuantity() {
    const quantityElement = document.getElementById('quantityValue');
    let quantity = parseInt(quantityElement.textContent);
    if (quantity > 1) {
        quantityElement.textContent = quantity - 1;
    }
}

// Function to confirm and add to cart
function confirmAddToCart() {
    const quantity = parseInt(document.getElementById('quantityValue').textContent);
    addToCart(currentItemId, quantity);
    
    // Close the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('quantityModal'));
    modal.hide();
}

// Function to add items to cart
function addToCart(id, quantity = 1) {
    if (!checkAuthBeforeAction('add')) return;
    
    try {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const item = menuItems[id];
        
        if (!item) {
            console.error('Item not found:', id);
            return;
        }
        
        // Check if item already exists in cart
        const existingItemIndex = cart.findIndex(cartItem => cartItem.id === id);
        
        if (existingItemIndex !== -1) {
            // Item exists, update quantity
            const newQuantity = cart[existingItemIndex].quantity + quantity;
            if (newQuantity > 10) {
                showNotification('Maximum quantity of 10 items reached');
                return;
            }
            cart[existingItemIndex].quantity = newQuantity;
        } else {
            // Add new item
            cart.push({
                id: id,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: quantity
            });
        }
        
        // Save cart to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Show notification
        showNotification(`Added ${quantity} ${item.name}${quantity > 1 ? 's' : ''} to cart!`);
        
        // Update cart counter
        updateCartCounter();
        
        // Show cart button if hidden
        const cartButton = document.getElementById('cart-button');
        if (cartButton) {
            cartButton.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Error adding item to cart');
    }
}

// Function to show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove notification after 2 seconds
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Function to update cart counter with animation
function updateCartCounter() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const counter = document.getElementById('cart-counter');
    const cartButton = document.getElementById('cart-button');
    
    if (counter && cartButton) {
        counter.textContent = totalItems;
        counter.style.display = totalItems > 0 ? 'flex' : 'none';
        
        // Show/hide cart button based on items and login status
        const isLoggedIn = sessionStorage.getItem('userLoggedIn') === 'true';
        cartButton.style.display = isLoggedIn ? 'flex' : 'none';
        
        // Add animation class
        counter.classList.add('counter-update');
        setTimeout(() => {
            counter.classList.remove('counter-update');
        }, 300);
    }
}

// Initialize cart counter when page loads
document.addEventListener('DOMContentLoaded', updateCartCounter);