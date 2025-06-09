<?php
require_once 'auth.php';
if (!isStaff()) {
    header("Location: login.php");
    exit();
}

// Get orders that are being prepared
$stmt = $pdo->prepare("
    SELECT o.*, 
           CASE 
             WHEN o.order_type = 'online' THEN ol.customer_name
             ELSE CONCAT('Table ', t.table_number)
           END AS customer_info
    FROM orders o
    LEFT JOIN online_orders ol ON o.order_id = ol.order_id
    LEFT JOIN restaurant_tables t ON o.table_id = t.table_id
    WHERE o.status IN ('confirmed', 'preparing')
    ORDER BY 
        CASE WHEN o.status = 'confirmed' THEN 0 ELSE 1 END,
        o.order_time ASC
");
$stmt->execute();
$orders = $stmt->fetchAll();
?>

<!DOCTYPE html>
<html>
<head>
    <title>Kitchen Display</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        .kitchen-display {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            padding: 20px;
        }
        
        .kitchen-order {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 15px;
        }
        
        .order-header {
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
        }
        
        .order-items {
            margin-bottom: 15px;
        }
        
        .order-item {
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px dashed #eee;
        }
        
        .priority {
            border-left: 5px solid #e74c3c;
            background-color: #fff6f6;
        }
        
        .signature-item {
            background-color: #fffaf0;
        }
    </style>
</head>
<body>
    <div class="kitchen-display">
        <?php foreach ($orders as $order): ?>
        <?php 
        $items = $pdo->query("
            SELECT oi.*, mi.name, mi.is_signature, mi.preparation_time 
            FROM order_items oi
            JOIN menu_items mi ON oi.item_id = mi.item_id
            WHERE oi.order_id = {$order['order_id']}
            ORDER BY mi.is_signature DESC, mi.preparation_time DESC
        ")->fetchAll();
        
        $hasSignature = array_reduce($items, function($carry, $item) {
            return $carry || $item['is_signature'];
        }, false);
        ?>
        
        <div class="kitchen-order <?= $hasSignature ? 'priority' : '' ?>">
            <div class="order-header">
                <div>
                    <h3>Order #<?= $order['order_id'] ?></h3>
                    <p><?= $order['customer_info'] ?></p>
                </div>
                <div class="order-status <?= $order['status'] ?>">
                    <?= ucfirst($order['status']) ?>
                </div>
            </div>
            
            <div class="order-items">
                <?php foreach ($items as $item): ?>
                <div class="order-item <?= $item['is_signature'] ? 'signature-item' : '' ?>">
                    <div class="item-header">
                        <span class="quantity"><?= $item['quantity'] ?>x</span>
                        <span class="item-name"><?= $item['name'] ?></span>
                        <?php if ($item['is_signature']): ?>
                        <span class="signature-badge">Signature</span>
                        <?php endif; ?>
                    </div>
                    
                    <?php if ($item['special_requests']): ?>
                    <p class="special-request">Note: <?= $item['special_requests'] ?></p>
                    <?php endif; ?>
                    
                    <div class="item-timer">
                        <div class="progress-bar" style="width: <?= $order['status'] === 'preparing' ? '50%' : '0%' ?>"></div>
                        <span>Prep time: <?= $item['preparation_time'] ?> mins</span>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
            
            <div class="order-actions">
                <?php if ($order['status'] === 'confirmed'): ?>
                <button class="btn start-btn" data-order-id="<?= $order['order_id'] ?>">Start Preparing</button>
                <?php elseif ($order['status'] === 'preparing'): ?>
                <button class="btn complete-btn" data-order-id="<?= $order['order_id'] ?>">Mark as Ready</button>
                <?php endif; ?>
            </div>
        </div>
        <?php endforeach; ?>
    </div>

    <script src="kitchen.js"></script>
</body>
</html>