<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);

try {
    require_once '../../databaseConnection/db_config.php';

    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['orderId']) || !isset($data['status'])) {
        throw new Exception('Order ID and status are required');
    }

    $sql = "UPDATE public.\"Order\" SET orderstatus = :status WHERE orderid = :orderId";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'status' => $data['status'],
        'orderId' => $data['orderId']
    ]);
    
    echo json_encode(['success' => true]);

} catch(Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?> 