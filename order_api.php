<?php
require_once 'db_config.php';
require_once 'auth.php';
header('Content-Type: application/json');

// Create new order
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Start transaction
    $conn->begin_transaction();
    
    try {
        // Insert order
        $stmt = $conn->prepare("INSERT INTO orders (user_id, table_id, order_type, total_amount, notes) VALUES (?, ?, ?, ?, ?)");
        $user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : NULL;
        $table_id = isset($data['table_id']) ? $data['table_id'] : NULL;
        
        $stmt->bind_param("iisds", 
            $user_id,
            $table_id,
            $data['order_type'],
            $data['total_amount'],
            $data['notes']
        );
        
        $stmt->execute();
        $order_id = $conn->insert_id;
        
        // Insert order items
        $item_stmt = $conn->prepare("INSERT INTO order_items (order_id, item_id, quantity, special_requests, price) VALUES (?, ?, ?, ?, ?)");
        $option_stmt = $conn->prepare("INSERT INTO order_item_options (order_item_id, option_id) VALUES (?, ?)");
        
        foreach ($data['items'] as $item) {
            $item_stmt->bind_param("iiisd", 
                $order_id,
                $item['item_id'],
                $item['quantity'],
                $item['special_requests'],
                $item['price']
            );
            
            $item_stmt->execute();
            $order_item_id = $conn->insert_id;
            
            // Insert item options if any
            if (!empty($item['options'])) {
                foreach ($item['options'] as $option_id) {
                    $option_stmt->bind_param("ii", $order_item_id, $option_id);
                    $option_stmt->execute();
                }
            }
        }
        
        // For online orders, add to online_orders table
        if ($data['order_type'] === 'online') {
            $online_stmt = $conn->prepare("INSERT INTO online_orders (order_id, customer_name, customer_email, delivery_address, contact_number) VALUES (?, ?, ?, ?, ?)");
            $online_stmt->bind_param("issss",
                $order_id,
                $data['customer_name'],
                $data['customer_email'],
                $data['delivery_address'],
                $data['contact_number']
            );
            $online_stmt->execute();
            
            // Send confirmation email
            sendOrderConfirmation($order_id, $data['customer_email']);
        }
        
        // Update table status if it's a walk-in order
        if ($data['order_type'] === 'walk-in' && $table_id) {
            $conn->query("UPDATE restaurant_tables SET status = 'occupied' WHERE table_id = $table_id");
        }
        
        // Create notification for staff
        $conn->query("INSERT INTO notifications (order_id, message) VALUES ($order_id, 'New order received')");
        
        $conn->commit();
        echo json_encode(['success' => true, 'order_id' => $order_id]);
    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// Get orders for staff
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isStaff()) {
    $status = isset($_GET['status']) ? $_GET['status'] : 'pending';
    $orders = [];
    
    $query = "SELECT o.*, 
              CASE 
                WHEN o.order_type = 'online' THEN ol.customer_name
                ELSE CONCAT('Table ', t.table_number)
              END AS customer_info,
              COUNT(n.notification_id) AS unread_notifications
              FROM orders o
              LEFT JOIN online_orders ol ON o.order_id = ol.order_id
              LEFT JOIN restaurant_tables t ON o.table_id = t.table_id
              LEFT JOIN notifications n ON o.order_id = n.order_id AND n.is_read = FALSE
              WHERE o.status = ?
              GROUP BY o.order_id
              ORDER BY o.order_time ASC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $status);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        // Get order items
        $items = [];
        $item_result = $conn->query("SELECT oi.*, mi.name, mi.image_url 
                                   FROM order_items oi
                                   JOIN menu_items mi ON oi.item_id = mi.item_id
                                   WHERE oi.order_id = {$row['order_id']}");
        
        while ($item_row = $item_result->fetch_assoc()) {
            // Get item options
            $options = [];
            $opt_result = $conn->query("SELECT io.* FROM order_item_options oio
                                      JOIN item_options io ON oio.option_id = io.option_id
                                      WHERE oio.order_item_id = {$item_row['order_item_id']}");
            
            while ($opt_row = $opt_result->fetch_assoc()) {
                $options[] = $opt_row;
            }
            
            $item_row['options'] = $options;
            $items[] = $item_row;
        }
        
        $row['items'] = $items;
        $orders[] = $row;
    }
    
    echo json_encode($orders);
}

// Update order status
if ($_SERVER['REQUEST_METHOD'] === 'PUT' && isStaff()) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $conn->prepare("UPDATE orders SET status = ? WHERE order_id = ?");
    $stmt->bind_param("si", $data['status'], $data['order_id']);
    
    if ($stmt->execute()) {
        // If order is completed, free up the table
        if ($data['status'] === 'completed') {
            $conn->query("UPDATE restaurant_tables t
                         JOIN orders o ON t.table_id = o.table_id
                         SET t.status = 'available'
                         WHERE o.order_id = {$data['order_id']}");
        }
        
        // Create notification
        $message = "Order #{$data['order_id']} status updated to {$data['status']}";
        $conn->query("INSERT INTO notifications (order_id, message) VALUES ({$data['order_id']}, '$message')");
        
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => $conn->error]);
    }
}

function sendOrderConfirmation($order_id, $email) {
    // In a real implementation, this would send an actual email
    $subject = "Order Confirmation #$order_id";
    $message = "Thank you for your order! Your order ID is #$order_id.";
    // mail($email, $subject, $message);
    
    // For demo purposes, we'll just log it
    file_put_contents('email_log.txt', "Sent to $email: $subject - $message\n", FILE_APPEND);
}
?>