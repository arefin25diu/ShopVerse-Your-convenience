<?php
require_once 'config.php';

setCORSHeaders();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetOrderHistory();
        break;
    default:
        errorResponse('Method not allowed', 405);
}

function handleGetOrderHistory() {
    global $pdo;
    
    // Check if user is logged in
    if (!isLoggedIn()) {
        errorResponse('Authentication required', 401);
    }
    
    $userId = $_SESSION['user_id'];
    
    try {
        // Handle pagination
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = isset($_GET['limit']) ? max(1, min(50, intval($_GET['limit']))) : 10;
        $offset = ($page - 1) * $limit;
        
        // Handle status filter
        $statusFilter = '';
        $params = [$userId];
        
        if (isset($_GET['status']) && !empty($_GET['status']) && $_GET['status'] !== 'all') {
            $status = sanitizeInput($_GET['status']);
            $statusFilter = " AND status = ?";
            $params[] = $status;
        }
        
        // Handle date filter
        if (isset($_GET['date_from']) && !empty($_GET['date_from'])) {
            $statusFilter .= " AND DATE(created_at) >= ?";
            $params[] = $_GET['date_from'];



        }
        
        if (isset($_GET['date_to']) && !empty($_GET['date_to'])) {
            $statusFilter .= " AND DATE(created_at) <= ?";
            $params[] = $_GET['date_to'];
        }
        
        // Get total count
        $countQuery = "SELECT COUNT(*) FROM orders WHERE user_id = ?" . $statusFilter;
        $countStmt = $pdo->prepare($countQuery);
        $countStmt->execute($params);
        $totalOrders = $countStmt->fetchColumn();
        
        // Get orders with basic info
        $query = "
            SELECT 
                id, 
                total_amount, 
                status, 
                shipping_address, 
                payment_method, 
                created_at,
                updated_at
            FROM orders 
            WHERE user_id = ?" . $statusFilter . "
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        ";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $orders = $stmt->fetchAll();
        
        // Get order items for each order
        foreach ($orders as &$order) {
            $stmt = $pdo->prepare("
                SELECT 
                    oi.quantity,
                    oi.price,
                    p.name,
                    p.image,
                    (oi.quantity * oi.price) as subtotal
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            ");
            $stmt->execute([$order['id']]);
            $order['items'] = $stmt->fetchAll();
            
            // Calculate items count
            $order['items_count'] = count($order['items']);
        }
        
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

// Get order details by ID
function getOrderDetails() {
    global $pdo;
    
    // Check if user is logged in
    if (!isLoggedIn()) {
        errorResponse('Authentication required', 401);
    }
    
    $orderId = isset($_GET['id']) ? intval($_GET['id']) : 0;
    $userId = $_SESSION['user_id'];
    
    if (!$orderId) {
        errorResponse('Order ID is required');
    }
    
    try {
        // Get order with user verification
        $stmt = $pdo->prepare("
            SELECT * FROM orders 
            WHERE id = ? AND user_id = ?
        ");
        $stmt->execute([$orderId, $userId]);
        $order = $stmt->fetch();
        
        if (!$order) {
            errorResponse('Order not found', 404);
        }
        
        // Get order items
        $stmt = $pdo->prepare("
            SELECT 
                oi.*,
                p.name,
                p.image,
                (oi.quantity * oi.price) as subtotal
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        ");
        $stmt->execute([$orderId]);
        $order['items'] = $stmt->fetchAll();
        
        successResponse($order);
        
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

// Handle order details request
if (isset($_GET['action']) && $_GET['action'] === 'details') {
    getOrderDetails();
}
?>

