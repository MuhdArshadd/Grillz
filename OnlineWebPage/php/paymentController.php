<?php
header('Content-Type: application/json');
error_reporting(0);
ini_set('display_errors', 0);

require_once '../../databaseConnection/db_config.php';

$endpoint = $_GET['endpoint'] ?? '';
$jsonData = file_get_contents('php://input');
$data = json_decode($jsonData, true);

switch ($endpoint) {
    case 'processPayPalPayment':
        handlePayPalPayment($pdo, $data);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid endpoint']);
        break;
}

function handlePayPalPayment($pdo, $data) {
    try {
        // Debug log the incoming data
        error_log('Received data: ' . print_r($data, true));

        // Validate user ID
        if (!isset($data['userId']) || !is_numeric($data['userId'])) {
            throw new Exception('Invalid or missing user ID');
        }

        $userId = (int)$data['userId']; // Convert to integer
        
        $pdo->beginTransaction();

        // Create cart with explicit userId check
        $cartSql = "INSERT INTO public.cart (userid, bool_ischeckout) 
                    VALUES (:userId, true) 
                    RETURNING cartid";
        $cartStmt = $pdo->prepare($cartSql);
        $cartParams = ['userId' => $userId];
        
        // Debug log the cart parameters
        error_log('Cart insert parameters: ' . print_r($cartParams, true));
        
        if (!$cartStmt->execute($cartParams)) {
            throw new Exception('Failed to create cart');
        }
        $cartId = $cartStmt->fetchColumn();

        // Verify cart was created with user ID
        $verifyCartSql = "SELECT userid FROM public.cart WHERE cartid = :cartId";
        $verifyCartStmt = $pdo->prepare($verifyCartSql);
        $verifyCartStmt->execute(['cartId' => $cartId]);
        $verifiedUserId = $verifyCartStmt->fetchColumn();
        
        if ($verifiedUserId != $userId) {
            throw new Exception('Cart creation verification failed');
        }

        // Insert cart items
        $cartItemSql = "INSERT INTO public.cart_food (cartid, foodid, foodquantity, foodtotalprice) 
                        VALUES (:cartId, :foodId, :quantity, :totalPrice)";
        $cartItemStmt = $pdo->prepare($cartItemSql);

        foreach ($data['items'] as $item) {
            $cartItemParams = [
                'cartId' => $cartId,
                'foodId' => (int)$item['id'],
                'quantity' => (int)$item['quantity'],
                'totalPrice' => (float)($item['price'] * $item['quantity'])
            ];
            
            if (!$cartItemStmt->execute($cartItemParams)) {
                throw new Exception('Failed to insert cart item');
            }
        }

        // Create payment record
        $paymentSql = "INSERT INTO public.payment (
                        userid,
                        paymenttimestamp,
                        paymenttype,
                        totalbill
                    ) VALUES (
                        :userId,
                        NOW(),
                        :paymentType,
                        :totalAmount
                    ) RETURNING paymentid";
        
        $paymentParams = [
            'userId' => $userId,
            'paymentType' => $data['paymentType'],
            'totalAmount' => (float)$data['totalAmount']
        ];
        
        // Debug log the payment parameters
        error_log('Payment insert parameters: ' . print_r($paymentParams, true));
        
        $paymentStmt = $pdo->prepare($paymentSql);
        if (!$paymentStmt->execute($paymentParams)) {
            throw new Exception('Failed to create payment record');
        }
        $paymentId = $paymentStmt->fetchColumn();

        // Create order
        $orderSql = "INSERT INTO public.\"Order\" (
                        cartid,
                        orderstatus,
                        ordertimestamp,
                        orderpaymentstatus,
                        bool_isonlineorder
                    ) VALUES (
                        :cartId,
                        'Pending',
                        NOW(),
                        'Paid',
                        true
                    )";
        
        $orderStmt = $pdo->prepare($orderSql);
        if (!$orderStmt->execute(['cartId' => $cartId])) {
            throw new Exception('Failed to create order');
        }

        $pdo->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Payment processed successfully',
            'debug' => [
                'userId' => $userId,
                'cartId' => $cartId,
                'paymentId' => $paymentId
            ]
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        error_log("Payment Error: " . $e->getMessage());
        error_log("Debug data: " . print_r($data, true));
        echo json_encode([
            'success' => false,
            'message' => 'Error processing payment: ' . $e->getMessage(),
            'debug' => [
                'receivedData' => $data
            ]
        ]);
    }
}
?> 