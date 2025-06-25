<?php
// Start output buffering to prevent unwanted output before JSON
ob_start();

// Set content-type header for JSON response
header('Content-Type: application/json');

// Enable strict error reporting, but do NOT display errors directly to client
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/php_errors.log'); // Make sure this path is writable

// Autoload or DB connection config
require_once '../databaseConnection/db_config.php';

// Helper function to return JSON response and exit
function respond($data)
{
    // Clear any buffered output to avoid corrupting JSON
    ob_end_clean();
    echo json_encode($data);
    exit;
}

// Read content type
$contentType = $_SERVER["CONTENT_TYPE"] ?? '';

// Determine action from input
$action = '';
if (stripos($contentType, "multipart/form-data") !== false) {
    $action = $_POST['action'] ?? '';
} else {
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);

    // Check for JSON decode errors
    if (json_last_error() !== JSON_ERROR_NONE) {
        respond([
            'success' => false,
            'message' => 'Invalid JSON input.',
            'json_error' => json_last_error_msg()
        ]);
    }

    $action = $data['action'] ?? '';
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'message' => 'Invalid request method.']);
}

try {
    if ($action === 'getMenu') {
        $stmt = $pdo->query("SELECT foodid, name, description, category, price, foodstatus, foodpicture, image_type FROM food ORDER BY category, name");
        $menuItems = [];

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if ($row['foodpicture']) {
                if (is_resource($row['foodpicture'])) {
                    $imageData = stream_get_contents($row['foodpicture']);
                } else {
                    $imageData = $row['foodpicture'];
                }
                $base64Image = base64_encode($imageData);
                $imageSrc = "data:" . $row['image_type'] . ";base64," . $base64Image;
            } else {
                $base64Image = null;
                $imageSrc = null;
            }

            $menuItems[] = [
                'foodid' => $row['foodid'],
                'name' => $row['name'],
                'description' => $row['description'],
                'category' => $row['category'],
                'price' => $row['price'],
                'foodstatus' => $row['foodstatus'],
                'image_src' => $imageSrc
            ];
        }


        respond(['success' => true, 'menu' => $menuItems]);

    } elseif ($action === 'addMenu') {
        // Validate form data (multipart/form-data)
        $name = $_POST['name'] ?? '';
        $description = $_POST['description'] ?? '';
        $category = $_POST['category'] ?? '';
        $price = $_POST['price'] ?? '';
        $status = $_POST['foodstatus'] ?? 'available';

        if (!$name || !$description || !$category || !$price) {
            respond(['success' => false, 'message' => 'All fields are required']);
        }

        if (!isset($_FILES['foodpicture']) || $_FILES['foodpicture']['error'] !== UPLOAD_ERR_OK) {
            respond(['success' => false, 'message' => 'Image upload failed']);
        }

        $imgTmp = $_FILES['foodpicture']['tmp_name'];
        $imgData = file_get_contents($imgTmp);
        $imgType = $_FILES['foodpicture']['type'];

        $stmt = $pdo->prepare("
            INSERT INTO food (name, description, category, price, foodstatus, foodpicture, image_type)
            VALUES (:name, :description, :category, :price, :foodstatus, :foodpicture, :image_type)
        ");
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':category', $category);
        $stmt->bindParam(':price', $price);
        $stmt->bindParam(':foodstatus', $status);
        $stmt->bindParam(':foodpicture', $imgData, PDO::PARAM_LOB);
        $stmt->bindParam(':image_type', $imgType);

        $stmt->execute();

        respond(['success' => true, 'message' => 'Menu item added successfully']);

    } else {
        respond(['success' => false, 'message' => 'Invalid action.']);
    }
} catch (PDOException $e) {
    // Log error and respond safely
    error_log('Database error: ' . $e->getMessage());
    respond(['success' => false, 'message' => 'Database error occurred.']);
} catch (Exception $e) {
    error_log('General error: ' . $e->getMessage());
    respond(['success' => false, 'message' => 'An unexpected error occurred.']);
}
