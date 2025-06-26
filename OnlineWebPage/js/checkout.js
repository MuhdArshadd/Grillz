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
  
  // Add PayPal button initialization
  function initializePayPalButton() {
    paypal.Buttons({
        createOrder: function(data, actions) {
            const checkoutData = JSON.parse(sessionStorage.getItem('checkoutData'));
            
            return actions.order.create({
                purchase_units: [{
                    amount: {
                        currency_code: "MYR",
                        value: checkoutData.total.toFixed(2)
                    },
                    description: "Grillz Food Order"
                }]
            });
        },
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
                // Handle successful payment
                processPayPalPayment(details);
            });
        },
        onError: function(err) {
            console.error('PayPal Error:', err);
            alert('There was an error processing your PayPal payment. Please try again.');
        }
    }).render('#paypal-button-container');
  }
  
  // Function to process PayPal payment
  async function processPayPalPayment(paypalDetails) {
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    const checkoutData = JSON.parse(sessionStorage.getItem('checkoutData'));
    
    // Debug log the user data
    console.log('Processing payment with user data:', userData);
    
    if (!userData || !userData.userid) {
        alert('User information is missing. Please login again.');
        window.location.href = 'LoginPage.html';
        return;
    }

    const orderData = {
        userId: parseInt(userData.userid), // Ensure it's a number
        items: checkoutData.items.map(item => ({
            id: parseInt(item.id),
            quantity: parseInt(item.quantity),
            price: parseFloat(item.price)
        })),
        totalAmount: parseFloat(checkoutData.total),
        paymentType: 'paypal',
        paypalOrderId: paypalDetails.id,
        deliveryAddress: document.getElementById('address').value,
        phoneNumber: document.getElementById('phone').value
    };

    // Debug log the order data being sent
    console.log('Sending order data:', orderData);

    try {
        const response = await fetch('http://localhost/Grillz-1/OnlineWebPage/php/paymentController.php?endpoint=processPayPalPayment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();
        console.log('Payment result:', result);
        
        if (result.success) {
            localStorage.removeItem('cart');
            sessionStorage.removeItem('checkoutData');
            alert('Payment processed successfully! Your order has been placed.');
            window.location.href = 'UserOrderHistoryPage.html';
        } else {
            throw new Error(result.message || 'Failed to process payment');
        }
    } catch (error) {
        console.error('Payment processing error:', error);
        alert('An error occurred while processing your payment: ' + error.message);
    }
  }
  
  // Modify the existing handleCheckout function
  async function handleCheckout(event) {
    event.preventDefault();
    
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const paypalButtonContainer = document.getElementById('paypal-button-container');
    
    if (paymentMethod === 'paypal') {
        // Show PayPal button and hide form submit button
        paypalButtonContainer.style.display = 'block';
        event.target.querySelector('button[type="submit"]').style.display = 'none';
        
        // Initialize PayPal button if not already initialized
        if (!paypalButtonContainer.hasChildNodes()) {
            initializePayPalButton();
        }
    } else {
        // Handle COD payment as before
        const userData = JSON.parse(sessionStorage.getItem('userData'));
        const checkoutData = JSON.parse(sessionStorage.getItem('checkoutData'));
        
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
            const response = await fetch('http://localhost/Grillz-1/OnlineWebPage/php/customerController.php?endpoint=placeOrder', {
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
                
                alert('Order placed successfully! Please prepare cash for delivery.');
                window.location.href = 'UserOrderHistoryPage.html';
            } else {
                alert(result.message || 'Failed to place order');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('An error occurred while placing your order');
        }
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