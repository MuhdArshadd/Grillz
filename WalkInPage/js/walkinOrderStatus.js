document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    const tableId = urlParams.get('tableId');

    if (!orderId) {
        alert('Invalid order ID');
        window.location.href = 'WalkInPage.html';
        return;
    }

    // Display table number
    document.getElementById('tableNumber').textContent = tableId;
    document.getElementById('orderId').textContent = orderId;

    // Load and display order
    const order = JSON.parse(localStorage.getItem(`walkInOrder_${orderId}`));
    if (order) {
        displayOrderStatus(order);
        displayOrderItems(order.items);
        simulateOrderProgress(orderId);
    }
});

function displayOrderStatus(order) {
    document.getElementById('orderTime').textContent = new Date(order.timestamps.ordered).toLocaleString();
    updateStatusStep('confirmed', order.timestamps.confirmed);
    
    if (order.timestamps.preparing) {
        updateStatusStep('preparing', order.timestamps.preparing);
    }
    
    if (order.timestamps.ready) {
        updateStatusStep('ready', order.timestamps.ready);
    }
}

function updateStatusStep(step, timestamp) {
    const stepElement = document.getElementById(`${step}Step`);
    stepElement.classList.add('active');
    if (timestamp) {
        document.getElementById(`${step}Time`).textContent = new Date(timestamp).toLocaleString();
    }
}

function displayOrderItems(items) {
    const container = document.getElementById('orderItemsList');
    container.innerHTML = items.map(item => `
        <div class="order-item">
            <div class="d-flex justify-content-between align-items-center w-100">
                <div>
                    <h6 class="mb-0">${item.name}</h6>
                    <small class="text-muted">Quantity: ${item.quantity}</small>
                </div>
                <div class="text-end">
                    <span class="text-orange">RM ${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function simulateOrderProgress(orderId) {
    // Simulate order preparation after 5 seconds
    setTimeout(() => {
        const order = JSON.parse(localStorage.getItem(`walkInOrder_${orderId}`));
        order.status = 'preparing';
        order.timestamps.preparing = new Date().toISOString();
        localStorage.setItem(`walkInOrder_${orderId}`, JSON.stringify(order));
        updateStatusStep('preparing', order.timestamps.preparing);
        
        // Simulate order ready after another 10 seconds
        setTimeout(() => {
            const order = JSON.parse(localStorage.getItem(`walkInOrder_${orderId}`));
            order.status = 'ready';
            order.timestamps.ready = new Date().toISOString();
            localStorage.setItem(`walkInOrder_${orderId}`, JSON.stringify(order));
            updateStatusStep('ready', order.timestamps.ready);
        }, 10000);
    }, 5000);
} 