<?php
// config.php - central config, CORS, DB, and JSON helpers

// ===== DATABASE CONFIG =====
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_NAME', getenv('DB_NAME') ?: 'shopverse');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    }
    return $pdo;
}

// ===== CORS =====
// Adjust the allow-origin for production!
function setCORSHeaders() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

// ===== JSON RESPONSE HELPERS =====
function successResponse($data = null, $message = 'OK', $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([ 'success' => true, 'message' => $message, 'data' => $data ], JSON_UNESCAPED_UNICODE);
    exit;
}
function errorResponse($message = 'Error', $code = 400, $data = null) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([ 'success' => false, 'message' => $message, 'data' => $data ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ===== UTIL =====
function generateOrderNumber(): string {
    return 'SV-' . date('YmdHis') . '-' . bin2hex(random_bytes(3));
}
function generateInvoiceNumber(): string {
    return 'INV-' . date('YmdHis') . '-' . bin2hex(random_bytes(3));
}
