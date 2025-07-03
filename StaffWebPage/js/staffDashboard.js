$(document).ready(function() {
    // Initial load
    loadOrders();
    
    // Refresh every 30 seconds
    setInterval(loadOrders, 30000);

    // Close modal when clicking the close button
    $('.close').click(function() {
        $('#orderModal').hide();
    });

    // Close modal when clicking outside
    $(window).click(function(event) {
        if ($(event.target).is('#orderModal')) {
            $('#orderModal').hide();
        }
    });
});

function loadOrders() {
    $.ajax({
        url: '../php/fetchOrders.php',
        method: 'GET',
        dataType: 'json',
        cache: false,
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Cache-Control', 'no-cache');
        },
        success: function(response) {
            if (response && response.success) {
                updateOrdersTable(response.orders);
            } else {
                console.error('Error loading orders:', response.error || 'Unknown error');
                alert('Error loading orders. Please check the console for details.');
            }
        },
        error: function(xhr, status, error) {
            console.error('AJAX error:', error);
            console.error('Status:', status);
            
            // Log the raw response
            console.error('Raw response:', xhr.responseText);
            
            // Try to clean and parse the response
            if (xhr.responseText) {
                try {
                    // Remove any non-JSON characters at the start
                    const cleanJson = xhr.responseText.substring(xhr.responseText.indexOf('{'));
                    const response = JSON.parse(cleanJson);
                    
                    if (response && response.success) {
                        updateOrdersTable(response.orders);
                        return;
                    }
                } catch (e) {
                    console.error('Error parsing response:', e);
                }
            }
            
            alert('Error connecting to server. Please check your connection and try again.');
        }
    });
}

function updateOrdersTable(orders) {
    const tbody = $('#ordersTableBody');
    tbody.empty();

    orders.forEach((order, index) => {
        const statusClass = getStatusClass(order.orderstatus);
        const orderTypeClass = order.order_type.toLowerCase().replace('-', '');

        // Format the customer identification
        let customerDisplay;
        if (order.bool_isonlineorder) {
            customerDisplay = order.customer_id || `User #${order.userid}`;
        } else {
            // For walk-in orders, use table number
            customerDisplay = order.tableid ? `Table #${order.tableid}` : 'Unknown Table';
        }

        const row = `
            <tr data-order-id="${order.orderid}">
                <td>${index + 1}</td>
                <td>#GRZ${String(order.orderid).padStart(6, '0')}</td>
                <td>${customerDisplay}</td>
                <td><span class="order-type order-${orderTypeClass}">${order.order_type}</span></td>
                <td><span class="status ${statusClass}">${order.orderstatus}</span></td>
                <td>RM${parseFloat(order.totalbill || 0).toFixed(2)}</td>
                <td>${order.paymenttype || 'N/A'}</td>
                <td>
                    <button class="btn btn-view" onclick="viewOrder('${order.orderid}', '${order.cartid}')">View</button>
                    ${getActionButton(order)}
                </td>
            </tr>
        `;
        tbody.append(row);
        
        // Store the full order data in the row for later use
        $(`tr[data-order-id="${order.orderid}"]`).data('order', order);
    });
}

function getStatusClass(status) {
    const statusMap = {
        'Pending': 'status-pending',
        'Processing': 'status-processing',
        'Completed': 'status-completed',
        'Cancelled': 'status-cancelled'
    };
    return statusMap[status.toLowerCase()] || 'status-pending';
}

function getActionButton(order) {
    switch(order.orderstatus.toLowerCase()) {
        case 'pending':
            return `<button class="btn btn-complete" onclick="updateOrderStatus('${order.orderid}', 'Processing')">Mark as Processing</button>`;
        case 'processing':
            return `<button class="btn btn-update" onclick="updateOrderStatus('${order.orderid}', 'Completed')">Mark as Completed</button>`;
        case 'completed':
            return `<button class="btn btn-cancel" onclick="updateOrderStatus('${order.orderid}', 'Cancelled')">Cancel Order</button>`;
        default:
            return '';
    }
}

function viewOrder(orderId, cartId) {
    const order = $(`tr[data-order-id="${orderId}"]`).data('order');
    if (!order) return;

    // Update modal content with order details
    $('#modalOrderNumber').text(`#GRZ${String(orderId).padStart(6, '0')}`);
    $('#modalTimestamp').text(new Date(order.ordertimestamp).toLocaleString());
    
    // Use the customer_id that's already formatted from the SQL query
    $('#modalCustomerName').text(order.customer_id || 'Unknown');
    
    $('#modalOrderType').text(order.order_type);
    $('#modalStatus').text(order.orderstatus);
    $('#modalPaymentMethod').text(order.paymenttype || 'N/A');
    $('#modalAddress').text(order.deliveryaddress || 'N/A');
    $('#modalContact').text(order.phonenumber || 'N/A');
    $('#modalTotal').text(`RM${parseFloat(order.totalbill || 0).toFixed(2)}`);

    // Fetch order items
    $.ajax({
        url: `../php/fetchOrderItems.php?cartId=${cartId}`,
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response && response.success) {
                updateModalItems(response.items);
            } else {
                console.error('Error fetching items:', response.error);
                $('#modalItemsList').empty().append(
                    '<tr><td colspan="4">Error loading items. Please try again.</td></tr>'
                );
            }
        },
        error: function(xhr, status, error) {
            console.error('AJAX error:', error);
            $('#modalItemsList').empty().append(
                '<tr><td colspan="4">Error loading items. Please try again.</td></tr>'
            );
        }
    });

    // Show the modal
    $('#orderModal').show();
}

function updateModalItems(items) {
    const itemsList = $('#modalItemsList');
    itemsList.empty();

    if (!items || items.length === 0) {
        itemsList.append('<tr><td colspan="4">No items found</td></tr>');
        return;
    }

    items.forEach(item => {
        const row = `
            <tr>
                <td>${item.food_name}</td>
                <td>${item.foodquantity}</td>
                <td>RM${parseFloat(item.unit_price).toFixed(2)}</td>
                <td>RM${parseFloat(item.foodtotalprice).toFixed(2)}</td>
            </tr>
        `;
        itemsList.append(row);
    });
}

function updateOrderStatus(orderId, newStatus) {
    $.ajax({
        url: '../php/updateOrderStatus.php',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            orderId: orderId,
            status: newStatus
        }),
        success: function(response) {
            if (response.success) {
                loadOrders(); // Reload the orders after status update
            } else {
                console.error('Error updating order status:', response.error);
            }
        },
        error: function(xhr, status, error) {
            console.error('AJAX error:', error);
            console.error('Response:', xhr.responseText);
        }
    });
} 