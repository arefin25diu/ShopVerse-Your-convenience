<?php
require_once 'config.php';

setCORSHeaders();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'generate':
                    handleGenerateInvoice();
                    break;
                case 'download':
                    handleDownloadInvoice();
                    break;
                case 'view':
                    handleViewInvoice();
                    break;
                default:
                    errorResponse('Invalid action', 400);
            }
        } else {
            errorResponse('Action required', 400);
        }
        break;
    case 'POST':
        if (isset($_GET['action']) && $_GET['action'] === 'email') {
            handleEmailInvoice();
        } else {
            errorResponse('Invalid action', 400);
        }
        break;
    default:
        errorResponse('Method not allowed', 405);
}

function handleGenerateInvoice() {
    global $pdo;
    
    $orderId = intval($_GET['order_id'] ?? 0);
    $format = $_GET['format'] ?? 'json'; // json, html, pdf
    
    if (!$orderId) {
        errorResponse('Order ID is required');
    }
    
    try {
        // Get order details
        $order = getOrderDetails($orderId);
        
        if (!$order) {
            errorResponse('Order not found', 404);
        }
        
        // Generate invoice data
        $invoiceData = generateInvoiceData($order);
        
        switch ($format) {
            case 'html':
                generateHTMLInvoice($invoiceData);
                break;
            case 'pdf':
                generatePDFInvoice($invoiceData);
                break;
            case 'json':
            default:
                successResponse($invoiceData, 'Invoice generated successfully');
                break;
        }
        
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    } catch (Exception $e) {
        errorResponse('Error generating invoice: ' . $e->getMessage(), 500);
    }
}

function handleDownloadInvoice() {
    global $pdo;
    
    $orderId = intval($_GET['order_id'] ?? 0);
    $format = $_GET['format'] ?? 'pdf';
    
    if (!$orderId) {
        errorResponse('Order ID is required');
    }
    
    try {
        $order = getOrderDetails($orderId);
        
        if (!$order) {
            errorResponse('Order not found', 404);
        }
        
        $invoiceData = generateInvoiceData($order);
        
        switch ($format) {
            case 'pdf':
                downloadPDFInvoice($invoiceData);
                break;
            case 'html':
                downloadHTMLInvoice($invoiceData);
                break;
            case 'json':
                downloadJSONInvoice($invoiceData);
                break;
            default:
                errorResponse('Invalid format. Supported formats: pdf, html, json');
        }
        
    } catch (Exception $e) {
        errorResponse('Error downloading invoice: ' . $e->getMessage(), 500);
    }
}

function handleViewInvoice() {
    global $pdo;
    
    $orderId = intval($_GET['order_id'] ?? 0);
    
    if (!$orderId) {
        errorResponse('Order ID is required');
    }
    
    try {
        $order = getOrderDetails($orderId);
        
        if (!$order) {
            errorResponse('Order not found', 404);
        }
        
        $invoiceData = generateInvoiceData($order);
        generateHTMLInvoice($invoiceData, true); // true for view mode
        
    } catch (Exception $e) {
        errorResponse('Error viewing invoice: ' . $e->getMessage(), 500);
    }
}

function handleEmailInvoice() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $orderId = intval($input['order_id'] ?? 0);
    $email = sanitizeInput($input['email'] ?? '');
    
    if (!$orderId || !$email) {
        errorResponse('Order ID and email are required');
    }
    
    if (!validateEmail($email)) {
        errorResponse('Invalid email address');
    }
    
    try {
        $order = getOrderDetails($orderId);
        
        if (!$order) {
            errorResponse('Order not found', 404);
        }
        
        $invoiceData = generateInvoiceData($order);
        
        // In a real application, you would send the email here
        // For demo purposes, we'll just return success
        successResponse([
            'email_sent' => true,
            'recipient' => $email,
            'invoice_number' => $invoiceData['invoice_number']
        ], 'Invoice sent successfully');
        
    } catch (Exception $e) {
        errorResponse('Error sending invoice: ' . $e->getMessage(), 500);
    }
}

function getOrderDetails($orderId) {
    global $pdo;
    
    // Get order information
    $stmt = $pdo->prepare("
        SELECT o.*, 
               COALESCE(u.name, o.shipping_name) as customer_name,
               COALESCE(u.email, o.guest_email, o.shipping_email) as customer_email
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.id 
        WHERE o.id = ?
    ");
    $stmt->execute([$orderId]);
    $order = $stmt->fetch();
    
    if (!$order) {
        return null;
    }
    
    // Get order items
    $stmt = $pdo->prepare("
        SELECT oi.*, 
               COALESCE(oi.product_name, p.name) as item_name,
               COALESCE(oi.product_image, p.image) as item_image
        FROM order_items oi 
        LEFT JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id = ?
    ");
    $stmt->execute([$orderId]);
    $order['items'] = $stmt->fetchAll();
    
    return $order;
}

function generateInvoiceData($order) {
    $invoiceNumber = 'INV-' . str_replace('ORD-', '', $order['order_number']);
    
    return [
        'invoice_number' => $invoiceNumber,
        'order_number' => $order['order_number'],
        'order_date' => $order['created_at'],
        'invoice_date' => date('Y-m-d H:i:s'),
        'status' => $order['status'],
        'payment_method' => $order['payment_method'],
        'payment_status' => $order['payment_status'],
        
        // Shop information
        'shop' => [
            'name' => 'Supershop',
            'logo' => '🛒',
            'tagline' => 'Your One-Stop Shopping Destination',
            'address' => '123 Business Street, Commerce City, CC 12345',
            'phone' => '+1 (555) 123-SHOP',
            'email' => 'support@supershop.com',
            'website' => 'www.supershop.com'
        ],
        
        // Customer information
        'customer' => [
            'name' => $order['customer_name'] ?? $order['shipping_name'],
            'email' => $order['customer_email'] ?? $order['shipping_email'],
            'phone' => $order['shipping_phone'],
            'shipping_address' => [
                'name' => $order['shipping_name'],
                'line1' => $order['shipping_address_line1'],
                'line2' => $order['shipping_address_line2'],
                'city' => $order['shipping_city'],
                'state' => $order['shipping_state'],
                'zip' => $order['shipping_zip'],
                'country' => $order['shipping_country']
            ],
            'billing_address' => [
                'name' => $order['billing_name'] ?? $order['shipping_name'],
                'line1' => $order['billing_address_line1'] ?? $order['shipping_address_line1'],
                'line2' => $order['billing_address_line2'] ?? $order['shipping_address_line2'],
                'city' => $order['billing_city'] ?? $order['shipping_city'],
                'state' => $order['billing_state'] ?? $order['shipping_state'],
                'zip' => $order['billing_zip'] ?? $order['shipping_zip'],
                'country' => $order['billing_country'] ?? $order['shipping_country']
            ]
        ],
        
        // Order items
        'items' => array_map(function($item) {
            return [
                'name' => $item['item_name'],
                'image' => $item['item_image'],
                'quantity' => intval($item['quantity']),
                'unit_price' => floatval($item['unit_price']),
                'total_price' => floatval($item['total_price'])
            ];
        }, $order['items']),
        
        // Financial summary
        'totals' => [
            'subtotal' => floatval($order['subtotal']),
            'tax_amount' => floatval($order['tax_amount']),
            'shipping_cost' => floatval($order['shipping_cost']),
            'total_amount' => floatval($order['total_amount'])
        ],
        
        // Additional information
        'notes' => $order['order_notes'] ?? '',
        'tracking_number' => $order['tracking_number'] ?? '',
        'estimated_delivery' => $order['estimated_delivery'] ?? ''
    ];
}

function generateHTMLInvoice($invoiceData, $viewMode = false) {
    $html = generateInvoiceHTML($invoiceData);
    
    if ($viewMode) {
        // Output directly for viewing
        header('Content-Type: text/html; charset=utf-8');
        echo $html;
    } else {
        // Return as response
        successResponse(['html' => $html], 'HTML invoice generated');
    }
}

function generatePDFInvoice($invoiceData) {
    // For a real implementation, you would use a library like TCPDF, FPDF, or Dompdf
    // For demo purposes, we'll return a placeholder
    
    $pdfContent = "PDF Invoice Generation would be implemented here using a PDF library.\n\n";
    $pdfContent .= "Invoice Number: " . $invoiceData['invoice_number'] . "\n";
    $pdfContent .= "Order Number: " . $invoiceData['order_number'] . "\n";
    $pdfContent .= "Customer: " . $invoiceData['customer']['name'] . "\n";
    $pdfContent .= "Total: $" . number_format($invoiceData['totals']['total_amount'], 2) . "\n";
    
    successResponse([
        'pdf_content' => base64_encode($pdfContent),
        'filename' => 'invoice-' . $invoiceData['order_number'] . '.pdf'
    ], 'PDF invoice generated');
}

function downloadPDFInvoice($invoiceData) {
    // Generate PDF content (simplified for demo)
    $pdfContent = generateSimplePDFContent($invoiceData);
    
    $filename = 'invoice-' . $invoiceData['order_number'] . '.pdf';
    
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . strlen($pdfContent));
    
    echo $pdfContent;
    exit;
}

function downloadHTMLInvoice($invoiceData) {
    $html = generateInvoiceHTML($invoiceData);
    $filename = 'invoice-' . $invoiceData['order_number'] . '.html';
    
    header('Content-Type: text/html; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . strlen($html));
    
    echo $html;
    exit;
}

function downloadJSONInvoice($invoiceData) {
    $json = json_encode($invoiceData, JSON_PRETTY_PRINT);
    $filename = 'invoice-' . $invoiceData['order_number'] . '.json';
    
    header('Content-Type: application/json');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . strlen($json));
    
    echo $json;
    exit;
}

function generateInvoiceHTML($invoiceData) {
    $customer = $invoiceData['customer'];
    $shop = $invoiceData['shop'];
    $totals = $invoiceData['totals'];
    
    $html = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - ' . htmlspecialchars($invoiceData['invoice_number']) . '</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        .invoice-container { max-width: 800px; margin: 0 auto; background: white; }
        .invoice-header { text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 20px; margin-bottom: 30px; }
        .shop-logo { font-size: 2rem; color: #3498db; margin-bottom: 10px; }
        .shop-name { font-size: 2rem; font-weight: bold; color: #2c3e50; margin: 0; }
        .shop-tagline { color: #7f8c8d; margin: 5px 0; }
        .invoice-title { font-size: 1.5rem; color: #e74c3c; margin: 20px 0 10px 0; }
        .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
        .detail-section h3 { color: #2c3e50; border-bottom: 1px solid #ecf0f1; padding-bottom: 5px; }
        .detail-section p { margin: 5px 0; line-height: 1.4; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th, .items-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ecf0f1; }
        .items-table th { background: #f8f9fa; font-weight: bold; color: #2c3e50; }
        .items-table .text-right { text-align: right; }
        .totals-section { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-top: 20px; }
        .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
        .total-row.grand-total { font-weight: bold; font-size: 1.2rem; color: #2c3e50; border-top: 2px solid #dee2e6; padding-top: 10px; margin-top: 10px; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ecf0f1; color: #7f8c8d; }
        @media print { body { margin: 0; } .no-print { display: none; } }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="invoice-header">
            <div class="shop-logo">' . $shop['logo'] . '</div>
            <h1 class="shop-name">' . htmlspecialchars($shop['name']) . '</h1>
            <p class="shop-tagline">' . htmlspecialchars($shop['tagline']) . '</p>
            <h2 class="invoice-title">INVOICE</h2>
        </div>
        
        <div class="invoice-details">
            <div class="detail-section">
                <h3>Invoice Details</h3>
                <p><strong>Invoice Number:</strong> ' . htmlspecialchars($invoiceData['invoice_number']) . '</p>
                <p><strong>Order Number:</strong> ' . htmlspecialchars($invoiceData['order_number']) . '</p>
                <p><strong>Order Date:</strong> ' . date('F j, Y', strtotime($invoiceData['order_date'])) . '</p>
                <p><strong>Invoice Date:</strong> ' . date('F j, Y', strtotime($invoiceData['invoice_date'])) . '</p>
                <p><strong>Payment Method:</strong> ' . htmlspecialchars(getPaymentMethodName($invoiceData['payment_method'])) . '</p>
                <p><strong>Status:</strong> ' . htmlspecialchars(ucfirst($invoiceData['status'])) . '</p>
            </div>
            
            <div class="detail-section">
                <h3>Customer Information</h3>
                <p><strong>' . htmlspecialchars($customer['name']) . '</strong></p>
                <p>' . htmlspecialchars($customer['shipping_address']['line1']) . '</p>';
                
    if (!empty($customer['shipping_address']['line2'])) {
        $html .= '<p>' . htmlspecialchars($customer['shipping_address']['line2']) . '</p>';
    }
    
    $html .= '<p>' . htmlspecialchars($customer['shipping_address']['city']) . ', ' . 
             htmlspecialchars($customer['shipping_address']['state']) . ' ' . 
             htmlspecialchars($customer['shipping_address']['zip']) . '</p>
                <p>' . htmlspecialchars($customer['shipping_address']['country']) . '</p>
                <p>Phone: ' . htmlspecialchars($customer['phone']) . '</p>
                <p>Email: ' . htmlspecialchars($customer['email']) . '</p>
            </div>
        </div>
        
        <table class="items-table">
            <thead>
                <tr>
                    <th>Item Name</th>
                    <th class="text-right">Quantity</th>
                    <th class="text-right">Price per Item</th>
                    <th class="text-right">Total per Item</th>
                </tr>
            </thead>
            <tbody>';
    
    foreach ($invoiceData['items'] as $item) {
        $html .= '<tr>
                    <td>' . htmlspecialchars($item['name']) . '</td>
                    <td class="text-right">' . $item['quantity'] . '</td>
                    <td class="text-right">$' . number_format($item['unit_price'], 2) . '</td>
                    <td class="text-right">$' . number_format($item['total_price'], 2) . '</td>
                  </tr>';
    }
    
    $html .= '</tbody>
        </table>
        
        <div class="totals-section">
            <div class="total-row">
                <span>Subtotal:</span>
                <span>$' . number_format($totals['subtotal'], 2) . '</span>
            </div>
            <div class="total-row">
                <span>Tax:</span>
                <span>$' . number_format($totals['tax_amount'], 2) . '</span>
            </div>
            <div class="total-row">
                <span>Shipping:</span>
                <span>' . ($totals['shipping_cost'] > 0 ? '$' . number_format($totals['shipping_cost'], 2) : 'Free') . '</span>
            </div>
            <div class="total-row grand-total">
                <span>Grand Total:</span>
                <span>$' . number_format($totals['total_amount'], 2) . '</span>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Thank you for shopping with ' . htmlspecialchars($shop['name']) . '!</strong></p>
            <p>For any questions about your order, please contact our customer service.</p>
            <p>Email: ' . htmlspecialchars($shop['email']) . ' | Phone: ' . htmlspecialchars($shop['phone']) . '</p>
            <p>Visit us at: ' . htmlspecialchars($shop['website']) . '</p>
        </div>
    </div>
</body>
</html>';
    
    return $html;
}

function generateSimplePDFContent($invoiceData) {
    // This is a simplified text-based PDF content for demo
    // In a real application, you would use a proper PDF library
    
    $content = "%PDF-1.4\n";
    $content .= "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
    $content .= "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
    $content .= "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n";
    $content .= "4 0 obj\n<< /Length 200 >>\nstream\n";
    $content .= "BT\n/F1 12 Tf\n100 700 Td\n";
    $content .= "(Invoice: " . $invoiceData['invoice_number'] . ") Tj\n";
    $content .= "0 -20 Td\n(Order: " . $invoiceData['order_number'] . ") Tj\n";
    $content .= "0 -20 Td\n(Customer: " . $invoiceData['customer']['name'] . ") Tj\n";
    $content .= "0 -20 Td\n(Total: $" . number_format($invoiceData['totals']['total_amount'], 2) . ") Tj\n";
    $content .= "ET\nendstream\nendobj\n";
    $content .= "xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000206 00000 n \n";
    $content .= "trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n456\n%%EOF";
    
    return $content;
}

function getPaymentMethodName($method) {
    switch ($method) {
        case 'cod':
            return 'Cash on Delivery';
        case 'card':
            return 'Credit/Debit Card';
        case 'mobile':
            return 'Mobile Payment';
        default:
            return ucfirst($method);
    }
}
?>

