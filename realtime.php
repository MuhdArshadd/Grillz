<?php
require_once 'vendor/autoload.php';
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use MyApp\RealtimeHandler;

class RealtimeHandler implements \Ratchet\MessageComponentInterface {
    protected $clients;
    protected $orderUpdates;

    public function __construct() {
        $this->clients = new \SplObjectStorage;
        $this->orderUpdates = [];
    }

    public function onOpen(\Ratchet\ConnectionInterface $conn) {
        $this->clients->attach($conn);
        echo "New connection! ({$conn->resourceId})\n";
    }

    public function onMessage(\Ratchet\ConnectionInterface $from, $msg) {
        $data = json_decode($msg, true);
        
        if ($data['type'] === 'subscribe') {
            // Client wants to subscribe to order updates
            $from->orderId = $data['orderId'];
            echo "Client {$from->resourceId} subscribed to order {$data['orderId']}\n";
            
            // Send current status if available
            if (isset($this->orderUpdates[$data['orderId']])) {
                $from->send(json_encode($this->orderUpdates[$data['orderId']]));
            }
        } elseif ($data['type'] === 'status_update') {
            // Staff updated an order status
            $this->orderUpdates[$data['orderId']] = $data;
            
            // Broadcast to all clients subscribed to this order
            foreach ($this->clients as $client) {
                if ($client->orderId == $data['orderId']) {
                    $client->send(json_encode($data));
                }
            }
        }
    }

    public function onClose(\Ratchet\ConnectionInterface $conn) {
        $this->clients->detach($conn);
        echo "Connection {$conn->resourceId} has disconnected\n";
    }

    public function onError(\Ratchet\ConnectionInterface $conn, \Exception $e) {
        echo "An error has occurred: {$e->getMessage()}\n";
        $conn->close();
    }
}

$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new RealtimeHandler()
        )
    ),
    8080
);

$server->run();