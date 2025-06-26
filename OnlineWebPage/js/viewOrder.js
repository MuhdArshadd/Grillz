// Function to display cart items
function displayCart() {
    const cartContainer = document.getElementById('cart-items');
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart text-center py-5">
                <h3>Your cart is empty</h3>
                <p>Go back to menu and add some delicious burgers!</p>
                <a href="MenuPage.html" class="btn btn-brown mt-3">View Menu</a>
            </div>
        `;
        updateOrderSummary();
        return;
    }
    
    cartContainer.innerHTML = cart.map(item => `
        <div class="cart-item card mb-3">
            <div class="row g-0">
                <div class="col-md-3">
                    <img src="${item.image}" class="img-fluid rounded-start" alt="${item.name}">
                </div>
                <div class="col-md-9">
                    <div class="card-body d-flex justify-content-between">
                        <div>
                            <h5 class="card-title">${item.name}</h5>
                            <p class="card-text">RM ${item.price.toFixed(2)}</p>
                        </div>
                        <div class="quantity-controls">
                            <button class="btn btn-sm btn-outline-secondary" onclick="updateQuantity(${item.id}, -1)">-</button>
                            <span class="mx-2">${item.quantity}</span>
                            <button class="btn btn-sm btn-outline-secondary" onclick="updateQuantity(${item.id}, 1)">+</button>
                            <button class="btn btn-sm btn-outline-danger ms-2" onclick="removeItem(${item.id})">
                                <i class="bi bi-trash"></i> Remove
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    updateOrderSummary();
  }
  
  // Function to update item quantity
  function updateQuantity(id, change) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const index = cart.findIndex(item => item.id === id);
    
    if (index !== -1) {
        cart[index].quantity += change;
        
        if (cart[index].quantity <= 0) {
            cart = cart.filter(item => item.id !== id);
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCart();
        updateCartCounter();
    }
  }
  
  // Function to remove item from cart
  function removeItem(id) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCart();
    updateCartCounter();
  }
  
  // Function to update order summary
  function updateOrderSummary() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.06;
    const total = subtotal + tax;
    
    document.getElementById('subtotal').textContent = `RM ${subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `RM ${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `RM ${total.toFixed(2)}`;
  }
  
  // Function to clear cart
  function clearCart() {
    if (confirm('Are you sure you want to clear your cart?')) {
        localStorage.removeItem('cart');
        displayCart();
        updateCartCounter();
    }
  }
  
  // Function to proceed to checkout
  function proceedToCheckout() {
      // First check if user is logged in
      const isLoggedIn = sessionStorage.getItem('userLoggedIn') === 'true';
      if (!isLoggedIn) {
          alert('Please login to proceed with checkout');
          window.location.href = 'LoginPage.html';
          return;
      }
  
      // Get cart data
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      
      // Check if cart is empty
      if (cart.length === 0) {
          alert('Your cart is empty!');
          return;
      }
  
      // Calculate totals
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * 0.06;
      const total = subtotal + tax;
  
      // Store checkout data in sessionStorage
      const checkoutData = {
          items: cart,
          subtotal: subtotal,
          tax: tax,
          total: total
      };
      
      // Store checkout data before redirect
      sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));
  
      // Redirect to checkout page with absolute path
      window.location.href = 'CheckoutPage.html';
  }
  
  // Initialize the view order page
  document.addEventListener('DOMContentLoaded', () => {
    // Load navbar
    fetch('NavigationBar.html')
        .then(res => res.text())
        .then(data => {
            document.getElementById('navbar-placeholder').innerHTML = data;
        });
    
    displayCart();
  });