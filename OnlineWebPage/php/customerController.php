<?php
// Enable error logging
ini_set('display_errors', 0);
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
    
    try {
        // Get POST data
        $rawData = file_get_contents('php://input');
        error_log("Raw registration data received: " . $rawData);
        
        $data = json_decode($rawData, true);
        if (!$data) {
            throw new Exception('Invalid JSON data received');
        }
        
        error_log("Decoded registration data: " . print_r($data, true));

        // Validate required fields with the correct field names
        if (!isset($data['emailAddress']) || !isset($data['password']) || 
            !isset($data['fullName']) || !isset($data['deliveryAddress']) || 
            !isset($data['phoneNumber'])) {
            throw new Exception('Missing required fields');
        }

        // Check if email already exists - use emailAddress instead of email
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE emailaddress = :email");
        $stmt->execute(['email' => $data['emailAddress']]);
        if ($stmt->fetchColumn() > 0) {
            echo json_encode([
                'status' => 'error',
                'message' => 'Email address already exists'
            ]);
            return;
        }

        // Debug log before insert
        error_log("Attempting to insert user with data: " . print_r([
            'fullname' => $data['fullName'],
            'emailaddress' => $data['emailAddress'],
            'password' => $data['password'],
            'deliveryaddress' => $data['deliveryAddress'],
            'phonenumber' => $data['phoneNumber']
        ], true));

        // Insert new user with correct field mappings
        $sql = "INSERT INTO users (fullname, emailaddress, password, deliveryaddress, phonenumber) 
                VALUES (:fullname, :emailaddress, :password, :deliveryaddress, :phonenumber)";
        
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([
            'fullname' => $data['fullName'],
            'emailaddress' => $data['emailAddress'],
            'password' => $data['password'],
            'deliveryaddress' => $data['deliveryAddress'],
            'phonenumber' => $data['phoneNumber']
        ]);

        if ($result) {
            echo json_encode([
                'status' => 'success',
                'message' => 'Registration successful'
            ]);
        } else {
            throw new Exception('Failed to insert user');
        }
        
    } catch (Exception $e) {
        error_log("Registration error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Registration failed: ' . $e->getMessage()
        ]);
    }
}

function handleGetOrderHistory() {
    global $pdo;
    
    try {
        $userId = $_GET['userId'] ?? null;
        
        if (!$userId) {
            throw new Exception('User ID is required');
        }

        // Get all orders for the user with proper type casting
        $sql = "SELECT 
                    o.orderid::integer as orderid,
                    o.orderstatus,
                    o.ordertimestamp::timestamp as ordertimestamp,
                    o.orderpaymentstatus,
                    c.cartid::integer as cartid,
                    CAST(p.totalbill AS DECIMAL(10,2)) as totalbill
                FROM public.\"Order\" o
                JOIN public.cart c ON o.cartid = c.cartid
                JOIN public.payment p ON c.userid = p.userid AND DATE(o.ordertimestamp) = DATE(p.paymenttimestamp)
                WHERE c.userid = :userId
                ORDER BY o.ordertimestamp DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['userId' => $userId]);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get items for each order
        foreach ($orders as &$order) {
            $itemsSql = "SELECT 
                            f.foodid::integer as foodid,
                            f.name,
                            CAST(f.price AS DECIMAL(10,2)) as price,
                            cf.foodquantity::integer as quantity
                        FROM public.cart_food cf
                        JOIN public.food f ON cf.foodid = f.foodid
                        WHERE cf.cartid = :cartId";
            
            $itemsStmt = $pdo->prepare($itemsSql);
            $itemsStmt->execute(['cartId' => $order['cartid']]);
            $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

            // Add image paths to items
            foreach ($items as &$item) {
                $item['image'] = getImagePathForFood($item['foodid']);
            }
            
            $order['items'] = $items;
        }

        echo json_encode([
            'success' => true,
            'orders' => $orders
        ]);

    } catch (Exception $e) {
        error_log("Error in getOrderHistory: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'Failed to fetch order history: ' . $e->getMessage()
        ]);
    }
}

function getImagePathForFood($foodId) {
    $imageMap = [
        1 => "../assets/food/cheese_lover_burger.png",
        2 => "../assets/food/chicken_deluxe_burger.png",
        3 => "../assets/food/grilled_beef_burger.png",
        4 => "../assets/food/1.png",
        5 => "../assets/food/2.png",
        6 => "../assets/food/3.png",
        7 => "../assets/food/4.png",
        8 => "../assets/food/5.png",
        9 => "../assets/food/6.png"
    ];
    
    return $imageMap[$foodId] ?? "../assets/food/1.png"; // Default image if ID not found
}

function handleRegisterVisitor() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validate input
        if (!isset($data['tableId']) || !isset($data['visitorName']) || !isset($data['visitorPhone'])) {
            throw new Exception('Missing required fields');
        }

        // Insert visitor record
        $sql = "INSERT INTO public.visitor (tableid, visitedtimestamp) 
                VALUES (:tableId, NOW()) 
                RETURNING visitorid";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'tableId' => $data['tableId']
        ]);
        
        $visitorId = $stmt->fetchColumn();

        echo json_encode([
            'success' => true,
            'visitorId' => $visitorId,
            'message' => 'Visitor registered successfully'
        ]);

    } catch (Exception $e) {
        error_log("Error in registerVisitor: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'Failed to register visitor: ' . $e->getMessage()
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
        case 'getOrderHistory':
            handleGetOrderHistory();
            break;
        case 'registerVisitor':
            handleRegisterVisitor();
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