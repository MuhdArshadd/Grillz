document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const tableId = urlParams.get('table');
    
    if (!tableId) {
        alert('Invalid table ID');
        window.location.href = 'WalkInPage.html';
        return;
    }

    // Display table number
    document.getElementById('tableNumber').textContent = tableId;
    
    // Load and display cart items
    displayOrderItems();

    // Initialize PayPal Buttons
    initializePayPalButtons();
});

function initializePayPalButtons() {
    paypal.Buttons({
        style: {
            layout: 'vertical',
            color:  'gold',
            shape:  'rect',
            label:  'paypal'
        },
        
        createOrder: function(data, actions) {
            const tableId = new URLSearchParams(window.location.search).get('table');
            const cart = JSON.parse(localStorage.getItem(`walkInCart_${tableId}`)) || [];
            
            // Calculate totals
            const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
            const tax = subtotal * 0.06;
            const total = subtotal + tax;
            
            return actions.order.create({
                purchase_units: [{
                    amount: {
                        currency_code: "MYR",
                        value: total.toFixed(2),
                        breakdown: {
                            item_total: {
                                currency_code: "MYR",
                                value: subtotal.toFixed(2)
                            },
                            tax_total: {
                                currency_code: "MYR",
                                value: tax.toFixed(2)
                            }
                        }
                    },
                    items: cart.map(item => ({
                        name: item.name,
                        unit_amount: {
                            currency_code: "MYR",
                            value: item.price.toFixed(2)
                        },
                        quantity: item.quantity
                    }))
                }]
            });
        },
        
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(orderData) {
                // Payment successful
                proceedToOrderStatus('paypal', orderData.id);
            });
        },
        
        onError: function(err) {
            console.error('PayPal Error:', err);
            alert('There was an error processing your payment. Please try again.');
        }
    }).render('#paypal-button-container');
}

function displayOrderItems() {
    const tableId = new URLSearchParams(window.location.search).get('table');
    const cart = JSON.parse(localStorage.getItem(`walkInCart_${tableId}`)) || [];
    const orderTotals = JSON.parse(localStorage.getItem(`walkInTotals_${tableId}`));
    const orderItemsContainer = document.getElementById('orderItems');

    orderItemsContainer.innerHTML = '';

    // Display cart items
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'order-item';
        itemElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                    <img src="${item.image}" alt="${item.name}" class="order-item-image me-3">
                    <div>
                        <h6 class="mb-0">${item.name}</h6>
                        <small class="text-muted">RM ${item.price.toFixed(2)} × ${item.quantity}</small>
                    </div>
                </div>
                <div class="text-end">
                    <h6 class="mb-0">RM ${itemTotal.toFixed(2)}</h6>
                    <button class="btn btn-sm btn-outline-danger mt-2" onclick="removeItem(${item.id})">Remove</button>
                </div>
            </div>
        `;
        orderItemsContainer.appendChild(itemElement);
    });

    // Use pre-calculated totals if available and valid
    if (orderTotals && orderTotals.calculatedAt) {
        const calculatedTime = new Date(orderTotals.calculatedAt);
        const now = new Date();
        const timeDiff = now - calculatedTime;
        
        // Use pre-calculated totals if they're less than 5 minutes old
        if (timeDiff < 300000) { // 5 minutes in milliseconds
            document.getElementById('subtotalAmount').textContent = orderTotals.subtotal.toFixed(2);
            document.getElementById('taxAmount').textContent = orderTotals.tax.toFixed(2);
            document.getElementById('totalAmount').textContent = orderTotals.total.toFixed(2);
            return;
        }
    }

    // Fallback: recalculate totals if pre-calculated totals are not available or too old
    updateTotals(cart);
}

function removeItem(itemId) {
    const tableId = new URLSearchParams(window.location.search).get('table');
    let cart = JSON.parse(localStorage.getItem(`walkInCart_${tableId}`)) || [];
    
    cart = cart.filter(item => item.id !== itemId);
    localStorage.setItem(`walkInCart_${tableId}`, JSON.stringify(cart));
    
    // Recalculate and store new totals
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.06;
    const total = subtotal + tax;
    
    const orderTotals = {
        subtotal: subtotal,
        tax: tax,
        total: total,
        calculatedAt: new Date().toISOString()
    };
    localStorage.setItem(`walkInTotals_${tableId}`, JSON.stringify(orderTotals));
    
    displayOrderItems();
}

let selectedPaymentMethod = null;

function selectPayment(method) {
    selectedPaymentMethod = method;
    
    // Update radio button selection visually
    document.querySelectorAll('.payment-option-wrapper').forEach(wrapper => {
        const radio = wrapper.querySelector('.payment-radio');
        if (radio && radio.value === method) {
            wrapper.classList.add('selected');
        } else {
            wrapper.classList.remove('selected');
        }
    });
    
    // Show/hide PayPal buttons and confirm button based on selection
    const paypalContainer = document.getElementById('paypal-button-container');
    const confirmOrderBtn = document.getElementById('confirmOrderBtn');
    
    if (method === 'paypal') {
        paypalContainer.style.display = 'block';
        confirmOrderBtn.style.display = 'none';
    } else {
        paypalContainer.style.display = 'none';
        confirmOrderBtn.style.display = 'block';
        confirmOrderBtn.disabled = false;
    }
}

function confirmOrder() {
    if (!selectedPaymentMethod) {
        alert('Please select a payment method');
        return;
    }

    // Only handle cash payments here
    if (selectedPaymentMethod === 'cash') {
        proceedToOrderStatus('cash');
    }
    // PayPal payments are handled by the PayPal buttons themselves
}

async function proceedToOrderStatus(paymentMethod, paypalOrderId = null) {
    const tableId = new URLSearchParams(window.location.search).get('table');
    const cart = JSON.parse(localStorage.getItem(`walkInCart_${tableId}`)) || [];
    
    // Calculate totals
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.06;
    const total = subtotal + tax;
    
    // Create order object
    const orderDetails = {
        tableId: tableId,
        items: cart,
        subtotal: subtotal,
        tax: tax,
        total: total,
        paymentMethod: paymentMethod,
        paypal_order_id: paypalOrderId
    };

    try {
        const response = await fetch('/Grillz/WalkInPage/php/walkInController.php?endpoint=createOrder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orderDetails })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Failed to create order');
        }

        // Clear the cart
        localStorage.removeItem(`walkInCart_${tableId}`);
        
        // Redirect to status page with database orderId
        window.location.href = `WalkInOrderStatus.html?orderId=${result.data.orderId}&tableId=${tableId}`;
    } catch (error) {
        console.error('Error creating order:', error);
        alert('Failed to create order. Please try again.');
    }
}

function generateOrderId() {
    return 'ORD' + Date.now().toString().slice(-6);
}

function generatePaypalOrderId() {
    // Implementation of generatePaypalOrderId function
    // This is a placeholder and should be replaced with the actual implementation
    return 'PAYPAL' + Date.now().toString().slice(-6);
}

function updateTotals(cart) {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.06; // 6% tax
    const total = subtotal + tax;

    document.getElementById('subtotalAmount').textContent = subtotal.toFixed(2);
    document.getElementById('taxAmount').textContent = tax.toFixed(2);
    document.getElementById('totalAmount').textContent = total.toFixed(2);
}

