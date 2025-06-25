<?php
ob_start();
header('Content-Type: application/json');
error_reporting(0);
ini_set('display_errors', 0);

try {
    require_once '../../databaseConnection/db_config.php';

    if (!isset($_GET['cartId'])) {
        throw new Exception('Cart ID is required');
    }

    $sql = "
        SELECT 
            f.name as food_name,
            cf.foodquantity,
            f.price as unit_price,
            cf.foodtotalprice
        FROM public.cart_food cf
        JOIN public.food f ON cf.foodid = f.foodid
        WHERE cf.cartid = :cartId
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['cartId' => $_GET['cartId']]);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    ob_clean();
    echo json_encode([
        'success' => true,
        'items' => $items
    ]);

} catch(Exception $e) {
    ob_clean();
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

ob_end_flush();
exit;
?> 