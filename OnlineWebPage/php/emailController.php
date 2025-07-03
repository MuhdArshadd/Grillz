<?php
require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../../databaseConnection/db_config.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class EmailController {
    private $mail;
    private $db;

    public function __construct() {
        $this->mail = new PHPMailer(true);
        
        // Use PDO for PostgreSQL
        $dsn = "pgsql:host={$_ENV['DB_HOST']};port={$_ENV['DB_PORT']};dbname={$_ENV['DB_NAME']};sslmode=require";
        $this->db = new PDO($dsn, $_ENV['DB_USER'], $_ENV['DB_PASSWORD'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]);
        
        // Configure PHPMailer
        $this->mail->isSMTP();
        $this->mail->Host = 'smtp.gmail.com';
        $this->mail->SMTPAuth = true;
        $this->mail->Username = $_ENV['EMAIL_USERNAME'];
        $this->mail->Password = $_ENV['EMAIL_PASSWORD'];
        $this->mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $this->mail->Port = 587;
        
        $this->mail->setFrom($_ENV['EMAIL_USERNAME'], 'Grillz Restaurant');
        $this->mail->isHTML(true);
    }

    public function sendOrderConfirmation($orderId) {
        try {
            // Get order and user details
            $orderQuery = "
                SELECT o.orderid, o.cartid, o.ordertimestamp, o.orderstatus, o.orderpaymentstatus, o.bool_isonlineorder,
                       u.fullname, u.emailaddress, u.deliveryaddress
                FROM public.\"Order\" o
                JOIN public.cart c ON o.cartid = c.cartid
                JOIN public.users u ON c.userid = u.userid
                WHERE o.orderid = :orderId
            ";
    
            $stmt = $this->db->prepare($orderQuery);
            $stmt->execute(['orderId' => $orderId]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);
    
            if (!$order) {
                throw new Exception("Order not found");
            }
    
            // Get food items in the cart
            $itemsQuery = "
                SELECT cf.foodquantity, cf.foodtotalprice, f.name, f.price
                FROM public.cart_food cf
                JOIN public.food f ON cf.foodid = f.foodid
                WHERE cf.cartid = :cartId
            ";
            $stmt = $this->db->prepare($itemsQuery);
            $stmt->execute(['cartId' => $order['cartid']]);
            $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
            // Prepare item HTML and calculate total
            $subtotal = 0;
            $itemsHtml = "";
            foreach ($items as $item) {
                $itemTotal = $item['foodquantity'] * $item['price'];
                $subtotal += $itemTotal;
                $itemsHtml .= "
                    <tr>
                        <td style='padding: 10px; border-bottom: 1px solid #ddd;'>{$item['name']}</td>
                        <td style='padding: 10px; border-bottom: 1px solid #ddd;'>{$item['foodquantity']}</td>
                        <td style='padding: 10px; border-bottom: 1px solid #ddd;'>RM {$item['price']}</td>
                        <td style='padding: 10px; border-bottom: 1px solid #ddd;'>RM " . number_format($itemTotal, 2) . "</td>
                    </tr>";
            }
    
            $tax = $subtotal * 0.06;
            $total = $subtotal + $tax;
    
            // Build the email body
            $emailBody = "
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333333;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        background-color: #f8f9fa;
                        padding: 20px;
                        text-align: center;
                        border-bottom: 3px solid #FF9800;
                    }
                    .order-info {
                        margin: 20px 0;
                        padding: 15px;
                        background-color: #ffffff;
                        border: 1px solid #dddddd;
                    }
                    .order-summary {
                        margin: 20px 0;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 15px 0;
                    }
                    th {
                        background-color: #f8f9fa;
                        padding: 12px;
                        text-align: left;
                        border-bottom: 2px solid #dddddd;
                    }
                    td {
                        padding: 12px;
                        border-bottom: 1px solid #dddddd;
                    }
                    .total-section {
                        margin-top: 20px;
                        border-top: 2px solid #dddddd;
                        padding-top: 15px;
                    }
                    .footer {
                        margin-top: 30px;
                        padding: 20px;
                        background-color: #f8f9fa;
                        text-align: center;
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1 style='color: #FF9800; margin: 0;'>Order Confirmation</h1>
                        <p style='margin: 10px 0 0 0;'>Thank you for your order!</p>
                    </div>
            
                    <div class='order-info'>
                        <h2>Order Details</h2>
                        <p><strong>Order ID:</strong> #{$order['orderid']}</p>
                        <p><strong>Order Date:</strong> " . date('F j, Y g:i A', strtotime($order['ordertimestamp'])) . "</p>
                        <p><strong>Customer Name:</strong> {$order['fullname']}</p>
                        <p><strong>Delivery Address:</strong> {$order['deliveryaddress']}</p>
                    </div>
            
                    <div class='order-summary'>
                        <h2>Order Summary</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Quantity</th>
                                    <th>Price</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {$itemsHtml}
                            </tbody>
                        </table>
            
                        <div class='total-section'>
                            <table style='width: 100%;'>
                                <tr>
                                    <td style='text-align: right;'><strong>Subtotal:</strong></td>
                                    <td style='text-align: right; width: 100px;'>RM " . number_format($subtotal, 2) . "</td>
                                </tr>
                                <tr>
                                    <td style='text-align: right;'><strong>Tax (6%):</strong></td>
                                    <td style='text-align: right;'>RM " . number_format($tax, 2) . "</td>
                                </tr>
                                <tr>
                                    <td style='text-align: right;'><strong>Total:</strong></td>
                                    <td style='text-align: right;'><strong>RM " . number_format($total, 2) . "</strong></td>
                                </tr>
                            </table>
                        </div>
                    </div>
            
                    <div class='footer'>
                        <p><strong>Grillz Restaurant</strong></p>
                        <p>If you have any questions about your order, please contact us at {$_ENV['EMAIL_USERNAME']}</p>
                        <p style='color: #666666; font-size: 12px;'>This is an automated email. Please do not reply to this message.</p>
                    </div>
                </div>
            </body>
            </html>
            ";
                
            // Set email details
            $this->mail->addAddress($order['emailaddress'], $order['fullname']);
            $this->mail->Subject = "Grillz - Order Confirmation #$orderId";
            $this->mail->Body = $emailBody;
    
            // Send email
            $this->mail->send();
            return true;
    
        } catch (Exception $e) {
            error_log("Error sending order confirmation email: " . $e->getMessage());
            return false;
        }
    }

} 