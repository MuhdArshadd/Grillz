<?php
require_once 'db_config.php';
header('Content-Type: application/json');

try {
    // Get featured/signature items (is_signature = TRUE and is_available = TRUE)
    $stmt = $pdo->prepare("
        SELECT * FROM menu_items 
        WHERE is_signature = TRUE 
        AND is_available = TRUE 
        ORDER BY RAND() 
        LIMIT 4
    ");
    $stmt->execute();
    $featuredItems = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Return the featured items
    echo json_encode($featuredItems);
} catch (PDOException $e) {
    // Handle database errors
    http_response_code(500);
    echo json_encode([
        'error' => 'Database error',
        'message' => $e->getMessage()
    ]);
}
?>
