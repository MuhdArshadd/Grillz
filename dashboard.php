<?php
require_once 'auth.php';
if (!isStaff()) {
    header("Location: login.php");
    exit();
}

// Get pending orders
$stmt = $pdo->prepare("
    SELECT o.*, 
           CASE 
             WHEN o.order_type = 'online' THEN ol.customer_name
             ELSE CONCAT('Table ', t.table_number)
           END AS customer_info,
           COUNT(n.notification_id) AS unread_notifications
    FROM orders o
    LEFT JOIN online_orders ol ON o.order_id = ol.order_id
    LEFT JOIN restaurant_tables t ON o.table_id = t.table_id
    LEFT JOIN notifications n ON o.order_id = n.order_id AND n.is_read = FALSE
    WHERE o.status != 'completed'
    GROUP BY o.order_id
    ORDER BY o.order_time ASC
");
$stmt->execute();
$orders = $stmt->fetchAll();

// Get completed orders count for today
$today = date('Y-m-d');
$completed = $pdo->query("SELECT COUNT(*) FROM orders WHERE status = 'completed' AND DATE(order_time) = '$today'")->fetchColumn();

// Get revenue for today
$revenue = $pdo->query("SELECT SUM(total_amount) FROM orders WHERE status = 'completed' AND DATE(order_time) = '$today'")->fetchColumn();
?>

<!DOCTYPE html>
<html>
<head>
    <title>Staff Dashboard</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="dashboard-container">
        <h1>Staff Dashboard</h1>
        
        <div class="stats-container">
            <div class="stat-card">
                <h3>Pending Orders</h3>
                <p><?= count($orders) ?></p>
            </div>
            <div class="stat-card">
                <h3>Completed Today</h3>
                <p><?= $completed ?></p>
            </div>
            <div class="stat-card">
                <h3>Today's Revenue</h3>
                <p>RM <?= number_format($revenue, 2) ?></p>
            </div>
        </div>
        
        <div class="orders-list">
            <h2>Current Orders</h2>
            
            <?php foreach ($orders as $order): ?>
            <div class="order-card" data-order-id="<?= $order['order_id'] ?>">
                <div class="order-header">
                    <span class="order-id">#<?= $order['order_id'] ?></span>
                    <span class="customer"><?= $order['customer_info'] ?></span>
                    <span class="order-time"><?= date('h:i A', strtotime($order['order_time'])) ?></span>
                    <span class="order-status <?= $order['status'] ?>"><?= ucfirst($order['status']) ?></span>
                </div>
                
                <div class="order-items">
                    <?php 
                    $items = $pdo->query("
                        SELECT oi.*, mi.name 
                        FROM order_items oi
                        JOIN menu_items mi ON oi.item_id = mi.item_id
                        WHERE oi.order_id = {$order['order_id']}
                    ")->fetchAll();
                    
                    foreach ($items as $item): ?>
                    <div class="order-item">
                        <span class="quantity"><?= $item['quantity'] ?>x</span>
                        <span class="item-name"><?= $item['name'] ?></span>
                        <span class="item-price">RM <?= number_format($item['price'] * $item['quantity'], 2) ?></span>
                        <?php if ($item['special_requests']): ?>
                        <p class="special-request">Note: <?= $item['special_requests'] ?></p>
                        <?php endif; ?>
                    </div>
                    <?php endforeach; ?>
                </div>
                
                <div class="order-total">
                    Total: RM <?= number_format($order['total_amount'], 2) ?>
                </div>
                
                <div class="order-actions">
                    <?php if ($order['status'] === 'pending'): ?>
                    <button class="btn confirm-btn" data-status="confirmed">Confirm</button>
                    <?php elseif ($order['status'] === 'confirmed'): ?>
                    <button class="btn preparing-btn" data-status="preparing">Start Preparing</button>
                    <?php elseif ($order['status'] === 'preparing'): ?>
                    <button class="btn ready-btn" data-status="ready">Mark as Ready</button>
                    <?php elseif ($order['status'] === 'ready'): ?>
                    <button class="btn complete-btn" data-status="completed">Complete</button>
                    <?php endif; ?>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </div>

    <script src="dashboard.js"></script>
</body>
</html>