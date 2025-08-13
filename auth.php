<?php
require_once 'config.php';

setCORSHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($method) {
    case 'POST':
        if ($action === 'login') {
            handleLogin();
        } elseif ($action === 'register') {
            handleRegister();
        } elseif ($action === 'logout') {
            handleLogout();
        } else {
            errorResponse('Invalid action');
        }
        break;
    case 'GET':
        if ($action === 'user') {
            handleGetCurrentUser();
        } else {
            errorResponse('Invalid action');
        }
        break;
    default:
        errorResponse('Method not allowed', 405);
}

function handleLogin() {
    global $pdo;
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        errorResponse('Invalid JSON input');
    }
    
    // Validate required fields
    if (!isset($input['email']) || !isset($input['password'])) {
        errorResponse('Email and password are required');
    }
    
    $email = sanitizeInput($input['email']);
    $password = $input['password'];
    
    if (empty($email) || empty($password)) {
        errorResponse('Email and password cannot be empty');
    }
    
    try {
        // Find user by email
        $stmt = $pdo->prepare("SELECT id, name, email, password FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if (!$user) {
            errorResponse('Invalid email or password');
        }
        
        // Verify password (for now, plain text comparison - in production use password_hash/password_verify)
        if ($password !== $user['password']) {
            errorResponse('Invalid email or password');
        }
        
        // Login user
        loginUser($user['id']);
        
        // Return user data (without password)
        unset($user['password']);
        
        successResponse($user, 'Login successful');
        
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function handleRegister() {
    global $pdo;
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        errorResponse('Invalid JSON input');
    }
    
    // Validate required fields
    $required_fields = ['name', 'email', 'password'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty(trim($input[$field]))) {
            errorResponse("Field '$field' is required");
        }
    }
    
    $name = sanitizeInput($input['name']);
    $email = sanitizeInput($input['email']);
    $password = $input['password'];
    $phone = isset($input['phone']) ? sanitizeInput($input['phone']) : '';
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        errorResponse('Invalid email format');
    }
    
    // Validate password length
    if (strlen($password) < 6) {
        errorResponse('Password must be at least 6 characters long');
    }
    
    try {
        // Check if email already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        
        if ($stmt->fetch()) {
            errorResponse('Email already registered');
        }
        
        // Insert new user (in production, hash the password)
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)");
        $stmt->execute([$name, $email, $password, $phone]);
        
        $userId = $pdo->lastInsertId();
        
        // Auto login
        loginUser($userId);
        
        // Get user data
        $stmt = $pdo->prepare("SELECT id, name, email, phone FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        successResponse($user, 'Registration successful');
        
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function handleLogout() {
    logoutUser();
    successResponse([], 'Logout successful');
}

function handleGetCurrentUser() {
    $user = getCurrentUser();
    
    if (!$user) {
        errorResponse('Not authenticated', 401);
    }
    
    successResponse($user);
}
?>

