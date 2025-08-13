<?php
require_once 'config.php';

setCORSHeaders();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetProfile();
        break;
    case 'PUT':
        handleUpdateProfile();
        break;
    default:
        errorResponse('Method not allowed', 405);
}

function handleGetProfile() {
    // Check if user is logged in
    if (!isLoggedIn()) {
        errorResponse('Authentication required', 401);
    }
    
    $user = getCurrentUser();
    
    if (!$user) {
        errorResponse('User not found', 404);
    }
    
    successResponse($user);
}

function handleUpdateProfile() {
    global $pdo;
    
    // Check if user is logged in
    if (!isLoggedIn()) {
        errorResponse('Authentication required', 401);
    }
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        errorResponse('Invalid JSON input');
    }
    
    $userId = $_SESSION['user_id'];
    
    try {
        // Check if user exists
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        if (!$user) {
            errorResponse('User not found', 404);
        }
        
        // Build update query dynamically
        $updateFields = [];
        $params = [];
        
        $allowedFields = ['name', 'email', 'phone', 'password'];
        
        foreach ($allowedFields as $field) {
            if (isset($input[$field]) && !empty(trim($input[$field]))) {
                $value = sanitizeInput($input[$field]);
                
                // Special validation for email
                if ($field === 'email') {
                    if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                        errorResponse('Invalid email format');
                    }
                    
                    // Check if email is already taken by another user
                    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
                    $stmt->execute([$value, $userId]);
                    if ($stmt->fetch()) {
                        errorResponse('Email already taken by another user');
                    }
                }
                
                // Special validation for password
                if ($field === 'password') {
                    if (strlen($value) < 6) {
                        errorResponse('Password must be at least 6 characters long');
                    }
                    // In production, hash the password here
                }
                
                $updateFields[] = "$field = ?";
                $params[] = $value;
            }
        }
        
        if (empty($updateFields)) {
            errorResponse('No valid fields to update');
        }
        
        $params[] = $userId;
        $query = "UPDATE users SET " . implode(', ', $updateFields) . ", updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        
        // Get updated user data
        $stmt = $pdo->prepare("SELECT id, name, email, phone FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $updatedUser = $stmt->fetch();
        
        successResponse($updatedUser, 'Profile updated successfully');
        
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}
?>

