<?php
// Enable error logging
ini_set('display_errors', 1);
error_reporting(E_ALL);
error_log("Script started");

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

function handleLogin() {
    global $pdo;
    
    // Get POST data
    $rawData = file_get_contents('php://input');
    error_log("Raw data received: " . $rawData);
    
    $data = json_decode($rawData, true);
    error_log("Decoded data: " . print_r($data, true));
    
    if (!$data || !isset($data['email']) || !isset($data['password'])) {
        error_log("Invalid or missing data");
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid request data'
        ]);
        return;
    }

    try {
        error_log("Attempting database query for email: " . $data['email']);
        
        // Debug the SQL query
        $sql = "SELECT * FROM users WHERE emailaddress = :email";
        error_log("SQL Query: " . $sql);
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['email' => $data['email']]);
        $user = $stmt->fetch();
        
        error_log("Database result: " . print_r($user, true));
        error_log("Password from database: " . $user['password'] . "Password from html: " . $data['password']);
        error_log("Email from database: " . $user['emailaddress'] . "Email from html: " . $data['email']);

        if ($user && $user['password'] == $data['password']) {
            error_log("Password verified successfully");
            // Remove sensitive data before sending
            unset($user['password']);
            
            $response = [
                'status' => 'success',
                'message' => 'Login successful',
                'user' => $user
            ];
            error_log("Sending success response: " . json_encode($response));
            echo json_encode($response);
        } else {
            error_log("Invalid credentials");
            http_response_code(401);
            $response = [
                'status' => 'error',
                'message' => 'Invalid credentials'
            ];
            error_log("Sending error response: " . json_encode($response));
            echo json_encode($response);
        }
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
}

function handleRegister() {
    global $pdo;
    
    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);
    
    try {
        // Check if email already exists
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE emailaddress = :email");
        $stmt->execute(['email' => $data['email']]);
        if ($stmt->fetchColumn() > 0) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Email already exists'
            ]);
            return;
        }

        // Insert new user
        $stmt = $pdo->prepare("INSERT INTO users (fullname, emailaddress, password, deliveryaddress, phonenumber) VALUES (:name, :email, :password)");
        $stmt->execute([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $hashedPassword
        ]);

        echo json_encode([
            'status' => 'success',
            'message' => 'Registration successful'
        ]);
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Database error'
        ]);
    }
}

// Route the request to appropriate handler
try {
    switch ($endpoint) {
        case 'login':
            handleLogin();
            break;
        case 'register':
            handleRegister();
            break;
        default:
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Endpoint not found']);
            break;
    }
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?> 