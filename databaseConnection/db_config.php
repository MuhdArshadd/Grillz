<?php
require_once __DIR__ . '/../vendor/autoload.php'; // Loads composer packages

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__ . '/../'); // Go up to project root
$dotenv->load();

$host     = $_ENV['DB_HOST'];
$port     = $_ENV['DB_PORT'];
$dbname   = $_ENV['DB_NAME'];
$user     = $_ENV['DB_USER'];
$password = $_ENV['DB_PASSWORD'];

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;sslmode=require";
    $pdo = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);

    // Log connection success to error log
    error_log("Database connection successful.");

    // Optional: Debug output if requested via URL param (only for manual test)
    if (isset($_GET['debug']) && $_GET['debug'] == 1) {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'message' => 'Database connection successful.'
        ]);
        exit;
    }

    // Test the connection
    $stmt = $pdo->query("SELECT current_database()");
    error_log("Connected to database: " . $stmt->fetchColumn());
    
    // Check if users table exists and its structure
    $stmt = $pdo->query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
    error_log("Users table structure: " . print_r($stmt->fetchAll(), true));

} catch (PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed.',
        'error' => $e->getMessage()
    ]);
    exit;
}
?>