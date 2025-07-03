<?php
require_once '../../Libraries/QRcode/phpqrcode/qrlib.php';

function generateTableQR($tableId) {
    // URL for the walk-in page with table ID
    $url = "http://localhost/Grillz/WalkInPage/html/WalkInPage.html?table=" . $tableId;
    
    // Set the QR code filename
    $qrFile = "../Libraries/QRcode/qrcodesImages/table_" . $tableId . ".png";
    
    // Generate QR code
    QRcode::png($url, $qrFile, QR_ECLEVEL_L, 10);
    
    return $qrFile;
}

// Generate QR codes for all tables
for ($tableId = 1; $tableId <= 10; $tableId++) { // Adjust range based on your number of tables
    generateTableQR($tableId);
}

echo "QR codes generated successfully!";
?>
