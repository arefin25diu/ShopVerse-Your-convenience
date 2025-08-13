<?php
require_once 'config.php';

setCORSHeaders();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetProducts();
        break;
    case 'POST':
        handleAddProduct();
        break;
    case 'PUT':
        handleUpdateProduct();
        break;
    case 'DELETE':
        handleDeleteProduct();
        break;
    default:
        errorResponse('Method not allowed', 405);
}

function handleGetProducts() {
    global $pdo;
    
    try {
        $query = "SELECT * FROM products WHERE 1=1";
        $params = [];
        
        // Handle search query
        if (isset($_GET['search']) && !empty($_GET['search'])) {
            $search = '%' . sanitizeInput($_GET['search']) . '%';
            $query .= " AND (name LIKE ? OR description LIKE ? OR category LIKE ?)";
            $params = array_merge($params, [$search, $search, $search]);
        }
        
        // Handle category filter
        if (isset($_GET['category']) && !empty($_GET['category']) && $_GET['category'] !== 'all') {
            $category = sanitizeInput($_GET['category']);
            $query .= " AND category = ?";
            $params[] = $category;
        }
        
        // Handle pagination
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 20;
        $offset = ($page - 1) * $limit;
        
        // Get total count
        $countQuery = str_replace("SELECT *", "SELECT COUNT(*)", $query);
        $countStmt = $pdo->prepare($countQuery);
        $countStmt->execute($params);
        $totalProducts = $countStmt->fetchColumn();
        
        // Add pagination to main query
        $query .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $products = $stmt->fetchAll();
        
        $response = [
            'products' => $products,
            'pagination' => [
                'current_page' => $page,
                'total_pages' => ceil($totalProducts / $limit),
                'total_products' => $totalProducts,
                'per_page' => $limit
            ]
        ];
        
        successResponse($response);
        
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function handleAddProduct() {
    global $pdo;
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        errorResponse('Invalid JSON input');
    }
    
    // Validate required fields
    $required_fields = ['name', 'price', 'category'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty(trim($input[$field]))) {
            errorResponse("Field '$field' is required");
        }
    }
    
    $name = sanitizeInput($input['name']);
    $description = isset($input['description']) ? sanitizeInput($input['description']) : '';
    $price = floatval($input['price']);
    $category = sanitizeInput($input['category']);
    $image = isset($input['image']) ? sanitizeInput($input['image']) : '';
    $stock = isset($input['stock']) ? intval($input['stock']) : 0;
    
    // Validate price
    if ($price <= 0) {
        errorResponse('Price must be greater than 0');
    }
    
    // Validate stock
    if ($stock < 0) {
        errorResponse('Stock cannot be negative');
    }
    
    try {
        $stmt = $pdo->prepare("INSERT INTO products (name, description, price, category, image, stock) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$name, $description, $price, $category, $image, $stock]);
        
        $productId = $pdo->lastInsertId();
        
        // Get the created product
        $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$productId]);
        $product = $stmt->fetch();
        
        successResponse($product, 'Product added successfully');
        
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function handleUpdateProduct() {
    global $pdo;
    
    // Get product ID from URL
    $productId = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$productId) {
        errorResponse('Product ID is required');
    }
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        errorResponse('Invalid JSON input');
    }
    
    try {
        // Check if product exists
        $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$productId]);
        $product = $stmt->fetch();
        
        if (!$product) {
            errorResponse('Product not found', 404);
        }
        
        // Build update query dynamically
        $updateFields = [];
        $params = [];
        
        $allowedFields = ['name', 'description', 'price', 'category', 'image', 'stock'];
        
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                if ($field === 'price') {
                    $value = floatval($input[$field]);
                    if ($value <= 0) {
                        errorResponse('Price must be greater than 0');
                    }
                } elseif ($field === 'stock') {
                    $value = intval($input[$field]);
                    if ($value < 0) {
                        errorResponse('Stock cannot be negative');
                    }
                } else {
                    $value = sanitizeInput($input[$field]);
                }
                
                $updateFields[] = "$field = ?";
                $params[] = $value;
            }
        }
        
        if (empty($updateFields)) {
            errorResponse('No valid fields to update');
        }
        
        $params[] = $productId;
        $query = "UPDATE products SET " . implode(', ', $updateFields) . " WHERE id = ?";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        
        // Get updated product
        $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$productId]);
        $updatedProduct = $stmt->fetch();
        
        successResponse($updatedProduct, 'Product updated successfully');
        
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function handleDeleteProduct() {
    global $pdo;
    
    // Get product ID from URL
    $productId = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$productId) {
        errorResponse('Product ID is required');
    }
    
    try {
        // Check if product exists
        $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$productId]);
        $product = $stmt->fetch();
        
        if (!$product) {
            errorResponse('Product not found', 404);
        }
        
        // Delete product
        $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
        $stmt->execute([$productId]);
        
        successResponse([], 'Product deleted successfully');
        
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

// Get product categories
function getCategories() {
    global $pdo;
    
    try {
        $stmt = $pdo->query("SELECT DISTINCT category FROM products ORDER BY category");
        $categories = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        successResponse($categories);
        
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

// Handle category request
if (isset($_GET['action']) && $_GET['action'] === 'categories') {
    getCategories();
}
?>

