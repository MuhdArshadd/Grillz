<?php
// Azure PostgreSQL connection details
$host = 'foodwebsite.postgres.database.azure.com';
$port = '5432';
$dbname = 'postgres';
$user = 'postgres';
$password = 'foodWeb11';

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;sslmode=require";
    $pdo = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    echo "Connection successful.";
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
}
?>
