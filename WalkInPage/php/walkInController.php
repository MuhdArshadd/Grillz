<?php
// Enable error logging
ini_set('display_errors', 1);
error_reporting(E_ALL);
error_log("WalkIn Controller started");

// Set CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database configuration
require_once '../../DatabaseConnection/db_config.php';

// Get the endpoint from query parameter
$endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';
error_log("Endpoint received: " . $endpoint);

// Route the request to appropriate handler
switch ($endpoint) {
    case 'createOrder':
        handleCreateOrder();
        break;
    case 'getOrderStatus':
        handleGetOrderStatus();
        break;
    case 'updateTableStatus':
        handleUpdateTableStatus();
        break;
    default:
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Unknown endpoint']);
        break;
}

function handleCreateOrder() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        error_log("Received order data: " . json_encode($data));

        if (!isset($data['orderDetails'])) {
            throw new Exception('Missing order details');
        }

        $orderDetails = $data['orderDetails'];
        
        $pdo->beginTransaction();

        // 1. Create visitor record
        $visitorSql = "INSERT INTO public.visitor (tableid, visitedtimestamp) 
                       VALUES (:tableId, CURRENT_TIMESTAMP) 
                       RETURNING visitorid";
        $stmt = $pdo->prepare($visitorSql);
        $stmt->execute(['tableId' => $orderDetails['tableId']]);
        $visitorId = $stmt->fetchColumn();

        // 2. Create cart
        $cartSql = "INSERT INTO public.cart (visitorid, bool_ischeckout) 
                    VALUES (:visitorId, true) 
                    RETURNING cartid";
        $stmt = $pdo->prepare($cartSql);
        $stmt->execute(['visitorId' => $visitorId]);
        $cartId = $stmt->fetchColumn();

        // 3. Add items to cart_food
        $cartFoodSql = "INSERT INTO public.cart_food (cartid, foodid, foodquantity, foodtotalprice) 
                        VALUES (:cartId, :foodId, :quantity, :totalPrice)";
        $stmt = $pdo->prepare($cartFoodSql);
        
        foreach ($orderDetails['items'] as $item) {
            $stmt->execute([
                'cartId' => $cartId,
                'foodId' => $item['id'],
                'quantity' => $item['quantity'],
                'totalPrice' => $item['price'] * $item['quantity']
            ]);
        }

        // 4. Create payment record
        $paymentSql = "INSERT INTO public.payment (
                           visitorid, 
                           paymenttimestamp, 
                           paymenttype, 
                           totalbill, 
                           paypal_order_id
                       ) VALUES (
                           :visitorId, 
                           CURRENT_TIMESTAMP, 
                           :paymentType, 
                           :totalBill, 
                           :paypalOrderId
                       ) RETURNING paymentid";
        
        $stmt = $pdo->prepare($paymentSql);
        $stmt->execute([
            'visitorId' => $visitorId,
            'paymentType' => $orderDetails['paymentMethod'],
            'totalBill' => $orderDetails['total'],
            'paypalOrderId' => isset($orderDetails['paypal_order_id']) ? $orderDetails['paypal_order_id'] : null
        ]);
        $paymentId = $stmt->fetchColumn();

        // 5. Create order record
        $orderSql = "INSERT INTO public.\"Order\" (
                         cartid, 
                         orderstatus, 
                         ordertimestamp, 
                         orderpaymentstatus, 
                         bool_isonlineorder
                     ) VALUES (
                         :cartId, 
                         'Pending', 
                         CURRENT_TIMESTAMP, 
                         :paymentStatus, 
                         false
                     ) RETURNING orderid";
        
        $stmt = $pdo->prepare($orderSql);
        $stmt->execute([
            'cartId' => $cartId,
            'paymentStatus' => $orderDetails['paymentMethod'] === 'cash' ? 'Pending' : 'Paid'
        ]);
        $orderId = $stmt->fetchColumn();

        // 6. Update table status
        $tableSql = "UPDATE public.restaurant_tables 
                     SET status = 'Occupied' 
                     WHERE tableid = :tableId";
        $stmt = $pdo->prepare($tableSql);
        $stmt->execute(['tableId' => $orderDetails['tableId']]);

        $pdo->commit();

        echo json_encode([
            'success' => true,
            'data' => [
                'orderId' => $orderId,
                'visitorId' => $visitorId,
                'cartId' => $cartId,
                'paymentId' => $paymentId
            ]
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        error_log("Error creating order: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

function handleGetOrderStatus() {
    global $pdo;
    
    try {
        if (!isset($_GET['orderId'])) {
            throw new Exception('Missing order ID');
        }

        $sql = "SELECT 
                    o.orderid,
                    o.orderstatus,
                    o.ordertimestamp,
                    o.orderpaymentstatus,
                    c.cartid,
                    cf.foodquantity,
                    cf.foodtotalprice,
                    f.name as food_name,
                    f.price as unit_price,
                    rt.table_number,
                    p.paymenttype,
                    p.totalbill
                FROM public.\"Order\" o
                JOIN public.cart c ON o.cartid = c.cartid
                JOIN public.cart_food cf ON c.cartid = cf.cartid
                JOIN public.food f ON cf.foodid = f.foodid
                JOIN public.visitor v ON c.visitorid = v.visitorid
                JOIN public.restaurant_tables rt ON v.tableid = rt.tableid
                LEFT JOIN public.payment p ON c.visitorid = p.visitorid
                WHERE o.orderid = :orderId";

        $stmt = $pdo->prepare($sql);
        $stmt->execute(['orderId' => $_GET['orderId']]);
        $orderDetails = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($orderDetails)) {
            throw new Exception('Order not found');
        }

        echo json_encode([
            'success' => true,
            'data' => $orderDetails
        ]);

    } catch (Exception $e) {
        error_log("Error getting order status: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

function handleUpdateTableStatus() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['tableId']) || !isset($data['status'])) {
            throw new Exception('Missing table ID or status');
        }

        $sql = "UPDATE public.restaurant_tables 
                SET status = :status 
                WHERE tableid = :tableId";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'tableId' => $data['tableId'],
            'status' => $data['status']
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Table status updated successfully'
        ]);

    } catch (Exception $e) {
        error_log("Error updating table status: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}
?> 