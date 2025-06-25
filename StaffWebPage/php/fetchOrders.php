<?php
// Prevent any output before JSON
ob_clean();
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);

try {
    require_once '../../databaseConnection/db_config.php';
    
    // Now $pdo should be available from db_config.php
    $sql = "
        SELECT 
            o.orderid,
            o.cartid,
            o.orderstatus,
            o.ordertimestamp,
            o.orderpaymentstatus,
            o.bool_isonlineorder,
            u.fullname as customer_name,
            CASE 
                WHEN o.bool_isonlineorder THEN 'Online' 
                ELSE 'Walk-In' 
            END as order_type,
            p.paymenttype,
            p.totalbill,
            u.deliveryaddress,
            u.phonenumber
        FROM public.\"Order\" o
        LEFT JOIN public.cart c ON o.cartid = c.cartid
        LEFT JOIN public.users u ON c.userid = u.userid
        LEFT JOIN public.payment p ON c.userid = p.userid 
            AND p.paymenttimestamp = o.ordertimestamp
        ORDER BY o.ordertimestamp DESC
    ";

    $stmt = $pdo->query($sql);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Make sure there's no whitespace or other characters before the JSON
    echo json_encode([
        'success' => true, 
        'orders' => $orders,
        'debug' => [
            'connection' => 'Connected successfully',
            'records_found' => count($orders)
        ]
    ]);
    exit;

} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
    exit;
}
?> 