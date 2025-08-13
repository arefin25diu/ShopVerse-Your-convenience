<?php
require_once 'config.php';

setCORSHeaders();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        if (isset($_GET['action']) && $_GET['action'] === 'process') {
            handleProcessOrder();
        } else {
            handleCreateOrder();
        }
        break;
    case 'GET':
        if (isset($_GET['action']) && $_GET['action'] === 'orders') {
            handleGetOrders();
        } elseif (isset($_GET['id'])) {
            handleGetOrder();
        } else {
            errorResponse('Invalid request');
        }
        break;
    case 'PUT':
        handleUpdateOrderStatus();
        break;
    default:
        errorResponse('Method not allowed', 405);
}

function handleCreateOrder() {
    global $pdo;
    
    $userId = getUserId();
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        errorResponse('Invalid JSON input');
    }
    
    // Validate required fields
    $required_fields = ['shipping_address', 'payment_method'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty(trim($input[$field]))) {
            errorResponse("Field '$field' is required");
        }
    }
    
    $shippingAddress = sanitizeInput($input['shipping_address']);
    $paymentMethod = sanitizeInput($input['payment_method']);
    
    try {
        // Start transaction
        $pdo->beginTransaction();
        
        // Get cart items
        $stmt = $pdo->prepare("
            SELECT 
                c.product_id,
                c.quantity,
                p.name,
                p.price,
                p.stock,
                (c.quantity * p.price) as subtotal
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
        ");
        $stmt->execute([$userId]);
        $cartItems = $stmt->fetchAll();
        
        if (empty($cartItems)) {
            $pdo->rollBack();
            errorResponse('Cart is empty');
        }
        
        // Calculate total and validate stock
        $totalAmount = 0;
        foreach ($cartItems as $item) {
            if ($item['quantity'] > $item['stock']) {
                $pdo->rollBack();
                errorResponse("Insufficient stock for product: {$item['name']}");
            }
            $totalAmount += $item['subtotal'];
        }
        
        // Create order
        $stmt = $pdo->prepare("
            INSERT INTO orders (user_id, total_amount, shipping_address, payment_method, status) 
            VALUES (?, ?, ?, ?, 'pending')
        ");
        $stmt->execute([$userId, $totalAmount, $shippingAddress, $paymentMethod]);
        $orderId = $pdo->lastInsertId();
        
        // Create order items and update stock
        $stmt = $pdo->prepare("
            INSERT INTO order_items (order_id, product_id, quantity, price) 
            VALUES (?, ?, ?, ?)
        ");
        
        $updateStockStmt = $pdo->prepare("
            UPDATE products SET stock = stock - ? WHERE id = ?
        ");
        
        foreach ($cartItems as $item) {
            // Add order item
            $stmt->execute([
                $orderId,
                $item['product_id'],
                $item['quantity'],
                $item['price']
            ]);
            
            // Update product stock
            $updateStockStmt->execute([
                $item['quantity'],
                $item['product_id']
            ]);
        }
        
        // Clear cart
        $stmt = $pdo->prepare("DELETE FROM cart WHERE user_id = ?");
        $stmt->execute([$userId]);
        
        // Commit transaction
        $pdo->commit();
        
        // Get created order
        $order = getOrderById($orderId);
        
        successResponse($order, 'Order created successfully');
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        errorResponse('Database error: ' . $e->getMessage(), 500);
    } catch (Exception $e) {
        $pdo->rollBack();
        errorResponse('Server error: ' . $e->getMessage(), 500);
    }
}

function handleProcessOrder() {
    global $pdo;
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['order_id'])) {
        errorResponse('Order ID is required');
    }
    
    $orderId = intval($input['order_id']);
    $paymentDetails = isset($input['payment_details']) ? $input['payment_details'] : [];
    
    try {
        // Get order
        $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();
        
        if (!$order) {
            errorResponse('Order not found', 404);
        }
        
        if ($order['status'] !== 'pending') {
            errorResponse('Order has already been processed');
        }
        
        // Simulate payment processing
        $paymentSuccess = processPayment($order, $paymentDetails);
        
        if ($paymentSuccess) {
            // Update order status
            $stmt = $pdo->prepare("UPDATE orders SET status = 'confirmed' WHERE id = ?");
            $stmt->execute([$orderId]);
            
            successResponse(['order_id' => $orderId], 'Payment processed successfully');
        } else {
            errorResponse('Payment processing failed');
        }
        
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function handleGetOrders() {
    global $pdo;
    
    $userId = getUserId();
    
    try {
        // Handle pagination
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = isset($_GET['limit']) ? max(1, min(50, intval($_GET['limit']))) : 10;
        $offset = ($page - 1) * $limit;
        
        // Handle date filter
        $dateFilter = '';
        $params = [$userId];
        
        if (isset($_GET['date_from']) && !empty($_GET['date_from'])) {
            $dateFilter .= " AND created_at >= ?";
            $params[] = $_GET['date_from'] . ' 00:00:00';
        }
        
        if (isset($_GET['date_to']) && !empty($_GET['date_to'])) {
            $dateFilter .= " AND created_at <= ?";
            $params[] = $_GET['date_to'] . ' 23:59:59';
        }
        
        // Handle category filter
        if (isset($_GET['category']) && !empty($_GET['category'])) {
            $category = sanitizeInput($_GET['category']);
            $dateFilter .= " AND id IN (
                SELECT DISTINCT o.id 
                FROM orders o 
                JOIN order_items oi ON o.id = oi.order_id 
                JOIN products p ON oi.product_id = p.id 
                WHERE p.category = ?
            )";
            $params[] = $category;
        }
        
        // Get total count
        $countQuery = "SELECT COUNT(*) FROM orders WHERE user_id = ?" . $dateFilter;
        $countStmt = $pdo->prepare($countQuery);
        $countStmt->execute($params);
        $totalOrders = $countStmt->fetchColumn();
        
        // Get orders
        $query = "
            SELECT id, total_amount, status, shipping_address, payment_method, created_at
            FROM orders 
            WHERE user_id = ?" . $dateFilter . "
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        ";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $orders = $stmt->fetchAll();
        
        $response = [
            'orders' => $orders,
            'pagination' => [
                'current_page' => $page,
                'total_pages' => ceil($totalOrders / $limit),
                'total_orders' => $totalOrders,
                'per_page' => $limit
            ]
        ];
        
        successResponse($response);
        
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function handleGetOrder() {
    global $pdo;
    
    $orderId = intval($_GET['id']);
    $userId = getUserId();
    
    try {
        $order = getOrderById($orderId, $userId);
        
        if (!$order) {
            errorResponse('Order not found', 404);
        }
        
        successResponse($order);
        
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function handleUpdateOrderStatus() {
    global $pdo;
    
    // Get order ID from URL
    $orderId = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$orderId) {
        errorResponse('Order ID is required');
    }
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['status'])) {
        errorResponse('Status is required');
    }
    
    $status = sanitizeInput($input['status']);
    $allowedStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!in_array($status, $allowedStatuses)) {
        errorResponse('Invalid status');
    }
    
    try {
        // Check if order exists
        $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();
        
        if (!$order) {
            errorResponse('Order not found', 404);
        }
        
        // Update status
        $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $stmt->execute([$status, $orderId]);
        
        successResponse([], 'Order status updated successfully');
        
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function getOrderById($orderId, $userId = null) {
    global $pdo;
    
    try {
        $query = "SELECT * FROM orders WHERE id = ?";
        $params = [$orderId];
        
        if ($userId) {
            $query .= " AND user_id = ?";
            $params[] = $userId;
        }
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $order = $stmt->fetch();
        
        if (!$order) {
            return null;
        }
        
        // Get order items
        $stmt = $pdo->prepare("
            SELECT 
                oi.*,
                p.name,
                p.image
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        ");
        $stmt->execute([$orderId]);
        $order['items'] = $stmt->fetchAll();
        
        return $order;
        
    } catch (PDOException $e) {
        throw $e;
    }
}

function processPayment($order, $paymentDetails) {
    // Simulate payment processing
    // In a real application, you would integrate with payment gateways like Stripe, PayPal, etc.
    
    // For demo purposes, we'll just return true
    // You can add validation for payment details here
    
    return true;
}

function getUserId() {
    // Same implementation as in cart.php
    $userId = null;
    
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $auth = $headers['Authorization'];
        if (preg_match('/Bearer\s+(\d+)/', $auth, $matches)) {
            $userId = intval($matches[1]);
        }
    }
    
    if (!$userId && isset($_GET['user_id'])) {
        $userId = intval($_GET['user_id']);
    }
    
    if (!$userId && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (isset($input['user_id'])) {
            $userId = intval($input['user_id']);
        }
    }
    
    if (!$userId) {
        errorResponse('User authentication required', 401);
    }
    
    return $userId;
}

// Generate invoice
function generateInvoice() {
    $orderId = isset($_GET['order_id']) ? intval($_GET['order_id']) : 0;
    $userId = getUserId();
    
    if (!$orderId) {
        errorResponse('Order ID is required');
    }
    
    try {
        $order = getOrderById($orderId, $userId);
        
        if (!$order) {
            errorResponse('Order not found', 404);
        }
        
        // Generate PDF invoice (simplified)
        $invoiceData = [
            'order_id' => $order['id'],
            'date' => $order['created_at'],
            'total' => $order['total_amount'],
            'status' => $order['status'],
            'items' => $order['items']
        ];
        
        successResponse($invoiceData, 'Invoice generated successfully');
        
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

// Handle invoice request
if (isset($_GET['action']) && $_GET['action'] === 'invoice') {
    generateInvoice();
}
?>

