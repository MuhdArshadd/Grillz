<?php
require_once 'db_config.php';
require_once 'auth.php';
header('Content-Type: application/json');

// Helper function to validate inputs
function validateInput($input) {
    if (is_array($input)) {
        return array_map('validateInput', $input);
    }
    return htmlspecialchars(strip_tags(trim($input)));
}

// Get all menu categories
if ($_SERVER['REQUEST_METHOD'] === 'GET' && !isset($_GET['category_id'])) {
    try {
        $stmt = $pdo->query("SELECT * FROM menu_categories ORDER BY name");
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $categories]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Database error']);
    }
    exit;
}

// Get menu items by category
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['category_id'])) {
    try {
        $category_id = (int)$_GET['category_id'];
        
        $stmt = $pdo->prepare("SELECT * FROM menu_items WHERE category_id = ? AND is_available = TRUE");
        $stmt->execute([$category_id]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($items as &$item) {
            $opt_stmt = $pdo->prepare("SELECT * FROM item_options WHERE item_id = ?");
            $opt_stmt->execute([$item['item_id']]);
            $item['options'] = $opt_stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        echo json_encode(['success' => true, 'data' => $items]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Database error']);
    }
    exit;
}

// Add new menu item (Admin only)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isAdmin()) {
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        exit;
    }
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON data');
        }
        
        $data = validateInput($data);
        
        $pdo->beginTransaction();
        
        $stmt = $pdo->prepare("INSERT INTO menu_items (category_id, name, description, price, image_url, is_available, is_signature, preparation_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            (int)$data['category_id'],
            $data['name'],
            $data['description'] ?? '',
            (float)$data['price'],
            $data['image_url'] ?? '',
            (bool)($data['is_available'] ?? true),
            (bool)($data['is_signature'] ?? false),
            (int)$data['preparation_time']
        ]);
        
        $item_id = $pdo->lastInsertId();
        
        if (!empty($data['options'])) {
            $opt_stmt = $pdo->prepare("INSERT INTO item_options (item_id, name, additional_price) VALUES (?, ?, ?)");
            foreach ($data['options'] as $option) {
                $opt_stmt->execute([
                    $item_id,
                    $option['name'],
                    (float)($option['additional_price'] ?? 0)
                ]);
            }
        }
        
        $pdo->commit();
        echo json_encode(['success' => true, 'item_id' => $item_id]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// For any other case
echo json_encode(['success' => false, 'error' => 'Invalid request']);