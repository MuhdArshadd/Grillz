<?php
require_once 'db_config.php';

// Get table number from QR code parameter
$table_number = isset($_GET['table']) ? $_GET['table'] : 0;
echo "Debug: Table number received: " . $table_number . "<br>";

// Verify table exists and is available
$stmt = $pdo->prepare("SELECT * FROM restaurant_tables WHERE table_number = ? AND status = 'available'");
$stmt->execute([$table_number]);
$table = $stmt->fetch();

if (!$table) {
    // Add more detailed error information
    $stmt = $pdo->prepare("SELECT * FROM restaurant_tables WHERE table_number = ?");
    $stmt->execute([$table_number]);
    $anyTable = $stmt->fetch();
    
    if (!$anyTable) {
        die("Error: No table found with number $table_number");
    } else {
        die("Error: Table $table_number exists but is not available. Current status: " . $anyTable['status']);
    }
}

// Start session for this table
session_start();
$_SESSION['table_id'] = $table['table_id'];
$_SESSION['order_type'] = 'walk-in';

// Redirect to menu page
header("Location: menu.html");
exit();
?>