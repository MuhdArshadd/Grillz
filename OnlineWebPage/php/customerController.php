<?php
require_once '../databaseConnection/db_config.php';
header('Content-Type: application/json');

// Decode JSON input
$data = json_decode(file_get_contents("php://input"), true);
$action = $data['action'] ?? '';
$response = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($action === 'register') {
        $fullname = $data['fullname'] ?? '';
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';
        $deliveryAddress = $data['deliveryAddress'] ?? '';
        $phoneNumber = $data['phoneNumber'] ?? '';

        if (!$fullname || !$email || !$password || !$deliveryAddress || !$phoneNumber) {
            echo json_encode(['success' => false, 'message' => 'All fields are required.']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT userID FROM users WHERE emailAddress = :email");
        $stmt->execute([':email' => $email]);

        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Email already exists.']);
            exit;
        }

        $stmt = $pdo->prepare("
            INSERT INTO users (fullname, emailAddress, password, deliveryAddress, phoneNumber) 
            VALUES (:fullname, :email, :password, :address, :phone)
        ");
        $stmt->execute([
            ':fullname' => $fullname,
            ':email' => $email,
            ':password' => $password,
            ':address' => $deliveryAddress,
            ':phone' => $phoneNumber
        ]);

        echo json_encode(['success' => true, 'message' => 'Registration successful.']);
        exit;
    }

    elseif ($action === 'login') {
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';

        if (!$email || !$password) {
            echo json_encode(['success' => false, 'message' => 'Email and password are required.']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT * FROM users WHERE emailAddress = :email");
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            echo json_encode(['success' => false, 'message' => 'User not found.']);
            exit;
        }

        if ($user['password'] !== $password) {
            echo json_encode(['success' => false, 'message' => 'Incorrect password.']);
            exit;
        }

        unset($user['password']);
        echo json_encode(['success' => true, 'message' => 'Login successful.', 'user' => $user]);
        exit;
    }

    else {
        echo json_encode(['success' => false, 'message' => 'Invalid action.']);
        exit;
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}
