let statusCheckInterval;
let currentStatus = '';
let tableId = ''; 

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    tableId = urlParams.get('tableId'); // <-- Set global value
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

    // Start checking order status
   // Start checking order status immediately
    checkOrderStatus(orderId);
    // Check status every 5 seconds
    statusCheckInterval = setInterval(() => checkOrderStatus(orderId), 5000);
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

async function checkOrderStatus(orderId) {
    try {
        const response = await fetch(`/Grillz/WalkInPage/php/walkInController.php?endpoint=getOrderStatus&orderId=${orderId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message);
        }

        const orderData = result.data[0];
        
        // Update status only if it has changed
        if (currentStatus !== orderData.orderstatus) {
            currentStatus = orderData.orderstatus;
            updateOrderStatus(orderData.orderstatus, orderData.ordertimestamp);
        }
        
        displayOrderDetails(result.data);

        // Stop checking if order is completed or cancelled
        if (orderData.orderstatus === 'Completed' || orderData.orderstatus === 'Cancelled') {
            clearInterval(statusCheckInterval);
        }

    } catch (error) {
        console.error('Error checking order status:', error);
    }
}

function updateOrderStatus(status, timestamp) {
    const steps = ['pending', 'processing', 'completed', 'cancelled'];
    const statusMap = {
        'Pending': 0,
        'Processing': 1,
        'Completed': 2,
        'Cancelled': 3
    };

    const currentStep = statusMap[status];
    const currentTime = new Date(timestamp).toLocaleTimeString();

    // Reset all steps
    steps.forEach(step => {
        const element = document.getElementById(`${step}Step`);
        element.classList.remove('active');
    });

    // Update status based on current status
    if (status === 'Cancelled') {
        // If cancelled, only show cancelled step
        document.getElementById('cancelledStep').classList.add('active');
        document.getElementById('cancelledTime').textContent = currentTime;
    } else {
        // For other statuses, show progress up to current step
        for (let i = 0; i <= currentStep; i++) {
            const step = document.getElementById(`${steps[i]}Step`);
            if (step) {
                step.classList.add('active');
                const timeElement = document.getElementById(`${steps[i]}Time`);
                if (timeElement) {
                    timeElement.textContent = currentTime;
                }
            }
        }
    }

    // Update status colors
    document.querySelectorAll('.status-step').forEach(step => {
        step.classList.remove('pending', 'processing', 'completed', 'cancelled');
        if (step.classList.contains('active')) {
            step.classList.add(status.toLowerCase());
        }
    });
}

function displayOrderDetails(orderData) {
    const firstOrder = orderData[0];
    
   // Update table number
    document.getElementById('tableNumber').textContent = firstOrder.table_number;

    
    // Update order time
    document.getElementById('orderTime').textContent = new Date(firstOrder.ordertimestamp).toLocaleString();
    
    // Update order items
    const orderItemsContainer = document.getElementById('orderItemsList');
    orderItemsContainer.innerHTML = orderData.map(item => `
        <div class="order-item mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-0">${item.food_name}</h6>
                    <small class="text-muted">RM ${parseFloat(item.unit_price).toFixed(2)} × ${item.foodquantity}</small>
                </div>
                <div class="text-end">
                    <h6 class="mb-0">RM ${parseFloat(item.foodtotalprice).toFixed(2)}</h6>
                </div>
            </div>
        </div>
    `).join('');

    // Update payment info
    document.getElementById('paymentMethod').textContent = firstOrder.paymenttype;
    document.getElementById('paymentStatus').textContent = firstOrder.orderpaymentstatus;
    document.getElementById('totalAmount').textContent = parseFloat(firstOrder.totalbill).toFixed(2);
}

// Clean up interval when leaving page
window.addEventListener('beforeunload', function() {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
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

async function checkOrderStatus(orderId) {
    try {
        const response = await fetch(`/Grillz/WalkInPage/php/walkInController.php?endpoint=getOrderStatus&orderId=${orderId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message);
        }

        const orderData = result.data[0];
        
        // Update status only if it has changed
        if (currentStatus !== orderData.orderstatus) {
            currentStatus = orderData.orderstatus;
            updateOrderStatus(orderData.orderstatus, orderData.ordertimestamp);
        }
        
        displayOrderDetails(result.data);

        // Stop checking if order is completed or cancelled
        if (orderData.orderstatus === 'Completed' || orderData.orderstatus === 'Cancelled') {
            clearInterval(statusCheckInterval);
        }

    } catch (error) {
        console.error('Error checking order status:', error);
    }
}

function updateOrderStatus(status, timestamp) {
    const steps = ['pending', 'processing', 'completed', 'cancelled'];
    const statusMap = {
        'Pending': 0,
        'Processing': 1,
        'Completed': 2,
        'Cancelled': 3
    };

    const currentStep = statusMap[status];
    const currentTime = new Date(timestamp).toLocaleTimeString();

    // Reset all steps
    steps.forEach(step => {
        const element = document.getElementById(`${step}Step`);
        element.classList.remove('active');
    });

    // Update status based on current status
    if (status === 'Cancelled') {
        // If cancelled, only show cancelled step
        document.getElementById('cancelledStep').classList.add('active');
        document.getElementById('cancelledTime').textContent = currentTime;
    } else {
        // For other statuses, show progress up to current step
        for (let i = 0; i <= currentStep; i++) {
            const step = document.getElementById(`${steps[i]}Step`);
            if (step) {
                step.classList.add('active');
                const timeElement = document.getElementById(`${steps[i]}Time`);
                if (timeElement) {
                    timeElement.textContent = currentTime;
                }
            }
        }
    }

    // Update status colors
    document.querySelectorAll('.status-step').forEach(step => {
        step.classList.remove('pending', 'processing', 'completed', 'cancelled');
        if (step.classList.contains('active')) {
            step.classList.add(status.toLowerCase());
        }
    });
}

function displayOrderDetails(orderData) {
    const firstOrder = orderData[0];
    
    // Update table number
    document.getElementById('tableNumber').textContent = tableId;
    
    // Update order time
    document.getElementById('orderTime').textContent = new Date(firstOrder.ordertimestamp).toLocaleString();
    
    // Update order items
    const orderItemsContainer = document.getElementById('orderItemsList');
    orderItemsContainer.innerHTML = orderData.map(item => `
        <div class="order-item mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-0">${item.food_name}</h6>
                    <small class="text-muted">RM ${parseFloat(item.unit_price).toFixed(2)} × ${item.foodquantity}</small>
                </div>
                <div class="text-end">
                    <h6 class="mb-0">RM ${parseFloat(item.foodtotalprice).toFixed(2)}</h6>
                </div>
            </div>
        </div>
    `).join('');

    // Update payment info
    document.getElementById('paymentMethod').textContent = firstOrder.paymenttype;
    document.getElementById('paymentStatus').textContent = firstOrder.orderpaymentstatus;
    document.getElementById('totalAmount').textContent = parseFloat(firstOrder.totalbill).toFixed(2);
}

// Clean up interval when leaving page
window.addEventListener('beforeunload', function() {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
    }
}); 
