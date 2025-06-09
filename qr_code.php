<?php
// simple_qr_code.php - Self-contained QR code generator

require_once 'db_config.php'; // Your database config

require_once 'phpqrcode/qrlib.php';

function generateQRCode($data, $filename) {
    QRcode::png($data, $filename, QR_ECLEVEL_L, 6);
}

// Create qrcodes directory if it doesn't exist
if (!file_exists('qrcodes')) {
    mkdir('qrcodes', 0755, true);
}

try {
    // Get all tables from database
    $tables = $pdo->query("SELECT * FROM restaurant_tables")->fetchAll();

    foreach ($tables as $table) {
        $url = "http://localhost/mini_project/qr_handler.php?table=" . $table['table_number'];

        // Set filename
        $filename = "qrcodes/table_" . $table['table_number'] . ".png";

        // Generate real QR code
        generateQRCode($url, $filename);

        // Update database with QR code path
        $stmt = $pdo->prepare("UPDATE restaurant_tables SET qr_code = ? WHERE table_id = ?");
        $stmt->execute([$filename, $table['table_id']]);

        echo "Generated QR code for Table {$table['table_number']}: {$filename}<br>";
    }

    echo "QR code generation completed successfully!";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
