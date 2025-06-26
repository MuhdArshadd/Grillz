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
});

function displayOrderItems() {
    const tableId = new URLSearchParams(window.location.search).get('table');
    const cart = JSON.parse(localStorage.getItem(`walkInCart_${tableId}`)) || [];
    const orderItemsContainer = document.getElementById('orderItems');

    orderItemsContainer.innerHTML = '';

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

    updateTotals(cart);
}

function removeItem(itemId) {
    const tableId = new URLSearchParams(window.location.search).get('table');
    let cart = JSON.parse(localStorage.getItem(`walkInCart_${tableId}`)) || [];
    
    cart = cart.filter(item => item.id !== itemId);
    localStorage.setItem(`walkInCart_${tableId}`, JSON.stringify(cart));
    
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
    
    // Enable confirm button
    document.getElementById('confirmOrderBtn').disabled = false;
}

function processPaypalPayment() {
    // Simulate PayPal payment processing
    const paypalBtn = document.querySelector('.paypal-btn');
    paypalBtn.disabled = true;
    paypalBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
    
    setTimeout(() => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('paypalModal'));
        modal.hide();
        proceedToOrderStatus('paypal');
    }, 1500);
}

function confirmOrder() {
    if (!selectedPaymentMethod) {
        alert('Please select a payment method');
        return;
    }

    if (selectedPaymentMethod === 'paypal') {
        const paypalModal = new bootstrap.Modal(document.getElementById('paypalModal'));
        paypalModal.show();
    } else {
        // For cash payment, proceed directly
        proceedToOrderStatus('cash');
    }
}

function proceedToOrderStatus(paymentMethod) {
    const tableId = new URLSearchParams(window.location.search).get('table');
    const cart = JSON.parse(localStorage.getItem(`walkInCart_${tableId}`)) || [];
    
    // Calculate totals
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.06;
    const total = subtotal + tax;
    
    // Create order object
    const order = {
        orderId: generateOrderId(),
        tableId: tableId,
        items: cart,
        subtotal: subtotal,
        tax: tax,
        total: total,
        paymentMethod: paymentMethod,
        status: 'confirmed',
        timestamps: {
            ordered: new Date().toISOString(),
            confirmed: new Date().toISOString()
        }
    };

    // Store order in localStorage
    localStorage.setItem(`walkInOrder_${order.orderId}`, JSON.stringify(order));
    
    // Redirect to status page
    window.location.href = `WalkInOrderStatus.html?orderId=${order.orderId}&tableId=${tableId}`;

    // Clear the cart
    localStorage.removeItem(`walkInCart_${tableId}`);
}

function generateOrderId() {
    return 'ORD' + Date.now().toString().slice(-6);
}

function updateTotals(cart) {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.06; // 6% tax
    const total = subtotal + tax;

    document.getElementById('subtotalAmount').textContent = subtotal.toFixed(2);
    document.getElementById('taxAmount').textContent = tax.toFixed(2);
    document.getElementById('totalAmount').textContent = total.toFixed(2);
}

