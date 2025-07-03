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
            c.userid,
            c.visitorid,
            v.tableid,
            CASE 
                WHEN o.bool_isonlineorder = true AND u.fullname IS NOT NULL THEN u.fullname
                WHEN o.bool_isonlineorder = true AND c.userid IS NOT NULL THEN 'User #' || c.userid::text
                WHEN o.bool_isonlineorder = false AND v.tableid IS NOT NULL THEN 'Table #' || v.tableid::text
                ELSE 'Unknown'
            END as customer_id,
            CASE 
                WHEN o.bool_isonlineorder THEN 'Online' 
                ELSE 'Walk-In' 
            END as order_type,
            COALESCE(p.paymenttype, 'cash') as paymenttype,
            COALESCE(p.totalbill, 0) as totalbill,
            u.deliveryaddress,
            u.phonenumber
        FROM public.\"Order\" o
        INNER JOIN public.cart c ON o.cartid = c.cartid
        LEFT JOIN public.users u ON c.userid = u.userid
        LEFT JOIN public.visitor v ON c.visitorid = v.visitorid
        LEFT JOIN public.payment p ON (
            (c.userid = p.userid AND p.paymenttimestamp = o.ordertimestamp) OR
            (c.visitorid = p.visitorid AND p.paymenttimestamp = o.ordertimestamp)
        )
        ORDER BY o.ordertimestamp DESC
    ";

    // Add error logging to see what's being returned
    error_log("SQL Query: " . $sql);
    $stmt = $pdo->query($sql);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    error_log("Orders data: " . json_encode($orders));
    
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