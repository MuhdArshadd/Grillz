document.addEventListener('DOMContentLoaded', function() {
  // Load navigation
  window.navigationManager.loadNavigation();

  // Check if user is logged in
  const isLoggedIn = sessionStorage.getItem('userLoggedIn') === 'true';
  if (!isLoggedIn) {
      alert('Please login to proceed with checkout');
      window.location.href = 'LoginPage.html';
      return;
  }

  // Get user data
  const userData = JSON.parse(sessionStorage.getItem('userData'));
  if (!userData) {
      alert('User data not found. Please login again.');
      window.location.href = 'LoginPage.html';
      return;
  }

  // Get checkout data
  const checkoutData = JSON.parse(sessionStorage.getItem('checkoutData'));
  if (!checkoutData || !checkoutData.items || checkoutData.items.length === 0) {
      alert('No items in cart');
      window.location.href = 'ViewOrder.html';
      return;
  }

  // Pre-fill user information
  document.getElementById('fullname').value = userData.fullname || '';
  document.getElementById('email').value = userData.emailaddress || '';
  document.getElementById('phone').value = userData.phonenumber || '';
  document.getElementById('address').value = userData.deliveryaddress || '';

  // Display order summary
  displayOrderSummary(checkoutData);

  // Handle form submission
  document.getElementById('checkoutForm').addEventListener('submit', handleCheckout);
});

function displayOrderSummary(checkoutData) {
  const itemsContainer = document.getElementById('checkout-items');
  
  // Display items
  itemsContainer.innerHTML = checkoutData.items.map(item => `
      <div class="checkout-item mb-3">
          <div class="d-flex justify-content-between">
              <div>
                  <h6>${item.name}</h6>
                  <small class="text-muted">Quantity: ${item.quantity}</small>
              </div>
              <span>RM ${(item.price * item.quantity).toFixed(2)}</span>
          </div>
      </div>
  `).join('');

  // Update totals
  document.getElementById('checkout-subtotal').textContent = `RM ${checkoutData.subtotal.toFixed(2)}`;
  document.getElementById('checkout-tax').textContent = `RM ${checkoutData.tax.toFixed(2)}`;
  document.getElementById('checkout-total').textContent = `RM ${checkoutData.total.toFixed(2)}`;
}

async function handleCheckout(event) {
  event.preventDefault();

  const userData = JSON.parse(sessionStorage.getItem('userData'));
  const checkoutData = JSON.parse(sessionStorage.getItem('checkoutData'));
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
  
  const orderData = {
      user_id: userData.user_id,
      items: checkoutData.items,
      subtotal: checkoutData.subtotal,
      tax: checkoutData.tax,
      total: checkoutData.total,
      delivery_address: document.getElementById('address').value,
      phone_number: document.getElementById('phone').value,
      payment_method: paymentMethod
  };

  try {
      // Show different message based on payment method
      if (paymentMethod === 'paypal') {
          // Simulate PayPal processing
          alert('Redirecting to PayPal... (This is a simulation)');
          await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
      }

      const response = await fetch('http://localhost/webdevproject/Grillz/OnlineWebPage/php/customerController.php?endpoint=placeOrder', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData)
      });

      const result = await response.json();
      
      if (result.status === 'success') {
          // Clear cart and checkout data
          localStorage.removeItem('cart');
          sessionStorage.removeItem('checkoutData');
          
          // Show success message based on payment method
          if (paymentMethod === 'paypal') {
              alert('PayPal payment processed successfully! Your order has been placed.');
          } else {
              alert('Order placed successfully! Please prepare cash for delivery.');
          }
          
          window.location.href = 'UserOrderHistoryPage.html';
      } else {
          alert(result.message || 'Failed to place order');
      }
  } catch (error) {
      console.error('Checkout error:', error);
      alert('An error occurred while placing your order');
  }
}

// Function to handle order cancellation
function cancelOrder() {
    if (confirm('Are you sure you want to cancel your order? This will clear your cart.')) {
        // Clear cart and checkout data
        localStorage.removeItem('cart');
        sessionStorage.removeItem('checkoutData');
        
        // Redirect back to menu
        window.location.href = 'MenuPage.html';
    }
}