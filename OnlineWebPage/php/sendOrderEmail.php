<?php
require_once 'emailController.php';

header('Content-Type: application/json');

try {
    // Get order ID from POST request
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['orderId'])) {
        throw new Exception('Order ID is required');
    }

    $emailController = new EmailController();
    $result = $emailController->sendOrderConfirmation($data['orderId']);

    if ($result) {
        echo json_encode(['success' => true, 'message' => 'Order confirmation email sent successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to send order confirmation email']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} 