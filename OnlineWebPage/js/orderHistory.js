document.addEventListener('DOMContentLoaded', function() {
    loadOrderHistory();
});

async function loadOrderHistory() {
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    
    if (!userData || !userData.userid) {
        alert('Please login to view your order history');
        window.location.href = 'LoginPage.html';
        return;
    }

    try {
        const response = await fetch(`http://localhost/Grillz-1/OnlineWebPage/php/customerController.php?endpoint=getOrderHistory&userId=${userData.userid}`);
        const result = await response.json();

        if (result.success) {
            displayOrders(result.orders);
        } else {
            throw new Error(result.message || 'Failed to fetch order history');
        }
    } catch (error) {
        console.error('Error loading order history:', error);
        document.getElementById('orderHistory').innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger" role="alert">
                    Failed to load order history. Please try again later.
                </div>
            </div>
        `;
    }
}

function displayOrders(orders) {
    const orderHistoryContainer = document.getElementById('orderHistory');
    
    if (!orders || orders.length === 0) {
        orderHistoryContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info" role="alert">
                    You haven't placed any orders yet.
                </div>
            </div>
        `;
        return;
    }

    orderHistoryContainer.innerHTML = orders.map(order => {
        // Convert totalbill to number and handle null/undefined
        const totalBill = parseFloat(order.totalbill) || 0;
        
        return `
        <div class="col-md-6 mb-4">
            <div class="card order-card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="card-title">Order #${order.orderid}</h5>
                        <span class="badge ${getStatusBadgeClass(order.orderstatus)}">${order.orderstatus}</span>
                    </div>
                    <p class="card-text">
                        <small class="text-muted">Ordered on: ${formatDate(order.ordertimestamp)}</small>
                    </p>
                    <div class="order-items mb-3">
                        ${order.items ? order.items.map(item => {
                            const itemTotal = parseFloat(item.price) * parseInt(item.quantity);
                            return `
                                <div class="order-item d-flex align-items-center mb-2">
                                    <img src="${item.image}" alt="${item.name}" class="order-item-img me-3" width="50" height="50">
                                    <div class="flex-grow-1">
                                        <div class="d-flex justify-content-between">
                                            <h6 class="mb-0">${item.name}</h6>
                                            <span>RM ${itemTotal.toFixed(2)}</span>
                                        </div>
                                        <small class="text-muted">Quantity: ${item.quantity}</small>
                                    </div>
                                </div>
                            `;
                        }).join('') : '<p>No items found</p>'}
                    </div>
                    <div class="order-total d-flex justify-content-between border-top pt-3">
                        <strong>Total:</strong>
                        <strong>RM ${totalBill.toFixed(2)}</strong>
                    </div>
                    ${order.orderpaymentstatus === 'Paid' ? 
                        '<div class="text-success mt-2"><i class="bi bi-check-circle"></i> Payment Completed</div>' : 
                        '<div class="text-warning mt-2"><i class="bi bi-clock"></i> Payment Pending</div>'
                    }
                </div>
            </div>
        </div>
    `}).join('');
}

function getStatusBadgeClass(status) {
    switch (status?.toLowerCase()) {
        case 'pending':
            return 'bg-warning';
        case 'preparing':
            return 'bg-info';
        case 'ready':
            return 'bg-success';
        case 'delivered':
            return 'bg-primary';
        case 'cancelled':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Date not available';
    
    try {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
} 