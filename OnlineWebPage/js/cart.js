// Add this at the beginning of cart.js
function checkAuthBeforeAction(action) {
    if (!isUserLoggedIn()) {
        showLoginPrompt();
        return false;
    }
    return true;
}

// Store menu items data
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
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const item = menuItems[id];
    
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(cartItem => cartItem.id === id);
    
    if (existingItemIndex !== -1) {
        // Item exists, add quantity
        cart[existingItemIndex].quantity += quantity;
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
    if (counter) {
        counter.textContent = totalItems;
        counter.style.display = totalItems > 0 ? 'flex' : 'none';
        
        // Add animation class
        counter.classList.add('counter-update');
        setTimeout(() => {
            counter.classList.remove('counter-update');
        }, 300);
    }
}

// Initialize cart counter when page loads
document.addEventListener('DOMContentLoaded', updateCartCounter);