<?php
require_once '../../databaseConnection/db_config.php';

function getOrderDetails() {
    try {
        $pdo = new PDO("pgsql:host=$host;dbname=$dbname", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        $sql = "
            SELECT 
                o.orderid,
                o.orderstatus,
                o.ordertimestamp,
                o.orderpaymentstatus,
                o.bool_isonlineorder,
                CASE 
                    WHEN o.bool_isonlineorder THEN u.fullname 
                    ELSE CONCAT('Walk-in-', o.orderid) 
                END as customer_name,
                CASE 
                    WHEN o.bool_isonlineorder THEN 'Online' 
                    ELSE 'Walk-In' 
                END as order_type,
                p.paymenttype,
                p.totalbill,
                CASE 
                    WHEN o.bool_isonlineorder THEN u.deliveryaddress 
                    ELSE 'Dine-in' 
                END as delivery_address,
                CASE 
                    WHEN o.bool_isonlineorder THEN u.phonenumber 
                    ELSE '-' 
                END as contact_number
            FROM public.\"Order\" o
            LEFT JOIN public.cart c ON o.cartid = c.cartid
            LEFT JOIN public.users u ON c.userid = u.userid
            LEFT JOIN public.payment p ON c.userid = p.userid 
                AND c.visitorid = p.visitorid
            ORDER BY o.ordertimestamp DESC
        ";

        $orderItemsSql = "
            SELECT 
                cf.cartid,
                f.name as food_name,
                cf.foodquantity,
                f.price as unit_price,
                cf.foodtotalprice
            FROM public.cart_food cf
            JOIN public.food f ON cf.foodid = f.foodid
            WHERE cf.cartid = :cartId
        ";

        $stmt = $pdo->query($sql);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $orderDetails = [];
        foreach ($orders as $order) {
            // Get order items
            $itemStmt = $pdo->prepare($orderItemsSql);
            $itemStmt->execute(['cartId' => $order['cartid']]);
            $orderItems = $itemStmt->fetchAll(PDO::FETCH_ASSOC);
            
            $orderDetails[] = [
                'orderInfo' => $order,
                'items' => $orderItems
            ];
        }

        return json_encode($orderDetails);

    } catch(PDOException $e) {
        return json_encode(['error' => $e->getMessage()]);
    }
}
?> 