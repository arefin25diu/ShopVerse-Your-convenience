// Order confirmation page functionality
let orderData = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadOrderDetails();
});

// Load order details from URL parameters or localStorage
function loadOrderDetails() {
    try {
        // Get order number from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const orderNumber = urlParams.get('order');
        
        if (orderNumber) {
            // In a real application, this would be an API call
            // For demo purposes, we'll simulate order data
            simulateOrderData(orderNumber);
        } else {
            // Try to get from localStorage (for demo)
            const savedOrder = localStorage.getItem('lastOrder');
            if (savedOrder) {
                orderData = JSON.parse(savedOrder);
                displayOrderDetails();
            } else {
                showError('Order not found. Please check your order number.');
            }
        }
    } catch (error) {
        console.error('Error loading order details:', error);
        showError('Failed to load order details. Please try again.');
    }
}

// Simulate order data for demo purposes
function simulateOrderData(orderNumber) {
    // Simulate API delay
    setTimeout(() => {
        orderData = {
            id: 1001,
            order_number: orderNumber || 'ORD-2024-12345',
            status: 'pending',
            created_at: new Date().toISOString(),
            subtotal: 15.97,
            tax_amount: 1.28,
            shipping_cost: 0,
            total_amount: 17.25,
            payment_method: 'COD',
            shipping_name: 'Arefin Ahmed',
            shipping_email: 'arefin@email.com',
            shipping_phone: '01883071173',
            shipping_address_line1: 'Rajendrapur Cantonment',
            shipping_address_line2: 'MODC Headquarter',
            shipping_city: 'Dhaka',
            shipping_state: 'Dhaka',
            shipping_zip: '1703',
            shipping_country: 'Bangladesh',
            items: [
                {
                    id: 1,
                    product_name: 'Fresh Bananas',
                    product_image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&h=200&fit=crop',
                    quantity: 2,
                    unit_price: 2.99,
                    total_price: 5.98
                },
                {
                    id: 2,
                    product_name: 'Organic Tomatoes',
                    product_image: 'https://images.unsplash.com/photo-1561136594-7f68413baa99?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                    quantity: 1,
                    unit_price: 3.49,
                    total_price: 3.49
                },
                {
                    id: 3,
                    product_name: 'Fresh Apples',
                    product_image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&h=200&fit=crop',
                    quantity: 1,
                    unit_price: 4.99,
                    total_price: 4.99
                },
                {
                    id: 4,
                    product_name: 'Carrots',
                    product_image: 'https://images.unsplash.com/photo-1445282768818-728615cc910a?w=300&h=200&fit=crop',
                    quantity: 1,
                    unit_price: 2.29,
                    total_price: 2.29
                }
            ]
        };
        
        displayOrderDetails();
    }, 1000);
}

// Display order details
function displayOrderDetails() {
    try {
        // Hide loading state
        document.getElementById('loadingState').style.display = 'none';
        
        // Show order content
        document.getElementById('orderContent').style.display = 'block';
        
        // Update order header
        document.getElementById('orderNumber').textContent = `Order #${orderData.order_number}`;
        document.getElementById('orderDate').textContent = `Placed on ${formatDate(orderData.created_at)}`;
        
        // Update order status
        const statusElement = document.getElementById('orderStatus');
        statusElement.textContent = capitalizeFirst(orderData.status);
        statusElement.className = `order-status ${orderData.status}`;
        
        // Update shipping address
        updateShippingAddress();
        
        // Update payment method
        updatePaymentMethod();
        
        // Update order items
        updateOrderItems();
        
        // Update order summary
        updateOrderSummary();
        
        // Update invoice
        updateInvoice();
        
        // Update tracking
        updateTracking();
        
    } catch (error) {
        console.error('Error displaying order details:', error);
        showError('Failed to display order details.');
    }
}

// Update shipping address
function updateShippingAddress() {
    const shippingElement = document.getElementById('shippingAddress');
    shippingElement.innerHTML = `
        <p><strong>${orderData.shipping_name}</strong></p>
        <p>${orderData.shipping_address_line1}</p>
        ${orderData.shipping_address_line2 ? `<p>${orderData.shipping_address_line2}</p>` : ''}
        <p>${orderData.shipping_city}, ${orderData.shipping_state} ${orderData.shipping_zip}</p>
        <p>${orderData.shipping_country}</p>
        <p>Phone: ${orderData.shipping_phone}</p>
        ${orderData.shipping_email ? `<p>Email: ${orderData.shipping_email}</p>` : ''}
    `;
}

// Update payment method
function updatePaymentMethod() {
    const paymentElement = document.getElementById('paymentMethod');
    let paymentHTML = '';
    
    switch (orderData.payment_method) {
        case 'cod':
            paymentHTML = `
                <p><strong>Cash on Delivery</strong></p>
                <p>Pay when your order arrives</p>
            `;
            break;
        case 'card':
            paymentHTML = `
                <p><strong>Credit/Debit Card</strong></p>
                <p>Card ending in ****</p>
            `;
            break;
        case 'mobile':
            paymentHTML = `
                <p><strong>Mobile Payment</strong></p>
                <p>Mobile wallet payment</p>
            `;
            break;
        default:
            paymentHTML = `
                <p><strong>${capitalizeFirst(orderData.payment_method)}</strong></p>
            `;
    }
    
    paymentElement.innerHTML = paymentHTML;
}

// Update order items
function updateOrderItems() {
    const itemsContainer = document.getElementById('orderItems');
    
    const itemsHTML = orderData.items.map(item => `
        <div class="order-item">
            <img src="${item.product_image}" alt="${item.product_name}" class="item-image">
            <div class="item-details">
                <h4>${item.product_name}</h4>
                <p>Unit Price: $${item.unit_price.toFixed(2)}</p>
            </div>
            <div class="item-quantity">Qty: ${item.quantity}</div>
            <div class="item-total">$${item.total_price.toFixed(2)}</div>
        </div>
    `).join('');
    
    itemsContainer.innerHTML = itemsHTML;
}

// Update order summary
function updateOrderSummary() {
    document.getElementById('summarySubtotal').textContent = `$${orderData.subtotal.toFixed(2)}`;
    document.getElementById('summaryTax').textContent = `$${orderData.tax_amount.toFixed(2)}`;
    document.getElementById('summaryShipping').textContent = orderData.shipping_cost === 0 ? 'Free' : `$${orderData.shipping_cost.toFixed(2)}`;
    document.getElementById('summaryTotal').textContent = `$${orderData.total_amount.toFixed(2)}`;
}

// Update invoice
function updateInvoice() {
    // Invoice header
    const invoiceNumber = `INV-${orderData.order_number.replace('ORD-', '')}`;
    document.getElementById('invoiceNumber').textContent = invoiceNumber;
    document.getElementById('invoiceOrderNumber').textContent = orderData.order_number;
    document.getElementById('invoiceDate').textContent = formatDate(orderData.created_at);
    document.getElementById('invoicePaymentMethod').textContent = getPaymentMethodDisplay(orderData.payment_method);
    
    // Customer info
    const customerInfo = document.getElementById('invoiceCustomerInfo');
    customerInfo.innerHTML = `
        <p><strong>${orderData.shipping_name}</strong></p>
        <p>${orderData.shipping_address_line1}</p>
        ${orderData.shipping_address_line2 ? `<p>${orderData.shipping_address_line2}</p>` : ''}
        <p>${orderData.shipping_city}, ${orderData.shipping_state} ${orderData.shipping_zip}</p>
        <p>${orderData.shipping_country}</p>
        <p>Phone: ${orderData.shipping_phone}</p>
        ${orderData.shipping_email ? `<p>Email: ${orderData.shipping_email}</p>` : ''}
    `;
    
    // Invoice items
    const invoiceItemsContainer = document.getElementById('invoiceItems');
    const invoiceItemsHTML = orderData.items.map(item => `
        <tr>
            <td>${item.product_name}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">$${item.unit_price.toFixed(2)}</td>
            <td class="text-right">$${item.total_price.toFixed(2)}</td>
        </tr>
    `).join('');
    
    invoiceItemsContainer.innerHTML = invoiceItemsHTML;
    
    // Invoice totals
    document.getElementById('invoiceSubtotal').textContent = `$${orderData.subtotal.toFixed(2)}`;
    document.getElementById('invoiceTax').textContent = `$${orderData.tax_amount.toFixed(2)}`;
    document.getElementById('invoiceShipping').textContent = orderData.shipping_cost === 0 ? 'Free' : `$${orderData.shipping_cost.toFixed(2)}`;
    document.getElementById('invoiceTotal').textContent = `$${orderData.total_amount.toFixed(2)}`;
}

// Update tracking steps
function updateTracking() {
    const steps = document.querySelectorAll('.tracking-step');
    const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
    const currentStatusIndex = statusOrder.indexOf(orderData.status);
    
    steps.forEach((step, index) => {
        step.classList.remove('active', 'completed');
        
        if (index < currentStatusIndex) {
            step.classList.add('completed');
        } else if (index === currentStatusIndex) {
            step.classList.add('active');
        }
    });
}

// Download invoice
function downloadInvoice() {
    try {
        // Create a simplified invoice data object
        const invoiceData = {
            invoice_number: `INV-${orderData.order_number.replace('ORD-', '')}`,
            order_number: orderData.order_number,
            date: formatDate(orderData.created_at),
            customer: {
                name: orderData.shipping_name,
                address: `${orderData.shipping_address_line1}, ${orderData.shipping_city}, ${orderData.shipping_state} ${orderData.shipping_zip}`,
                phone: orderData.shipping_phone,
                email: orderData.shipping_email
            },
            items: orderData.items,
            totals: {
                subtotal: orderData.subtotal,
                tax: orderData.tax_amount,
                shipping: orderData.shipping_cost,
                total: orderData.total_amount
            },
            payment_method: getPaymentMethodDisplay(orderData.payment_method)
        };
        
        // Convert to JSON and create download
        const dataStr = JSON.stringify(invoiceData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${orderData.order_number}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showNotification('Invoice downloaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error downloading invoice:', error);
        showNotification('Failed to download invoice. Please try again.', 'error');
    }
}

// Print invoice
function printInvoice() {
    try {
        // Hide non-printable elements
        const actionButtons = document.querySelector('.action-buttons');
        const printButtons = document.querySelector('.print-buttons');
        const header = document.querySelector('header');
        
        if (actionButtons) actionButtons.style.display = 'none';
        if (printButtons) printButtons.style.display = 'none';
        if (header) header.style.display = 'none';
        
        // Print
        window.print();
        
        // Restore elements after printing
        setTimeout(() => {
            if (actionButtons) actionButtons.style.display = '';
            if (printButtons) printButtons.style.display = '';
            if (header) header.style.display = '';
        }, 1000);
        
    } catch (error) {
        console.error('Error printing invoice:', error);
        showNotification('Failed to print invoice. Please try again.', 'error');
    }
}

// Download invoice as PDF (simplified version)
function downloadInvoicePDF() {
    // In a real application, you would use a library like jsPDF or send to server
    // For demo purposes, we'll just show a notification
    showNotification('PDF download feature would be implemented with a PDF library in production.', 'info');
}

// Show error message
function showError(message) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getPaymentMethodDisplay(method) {
    switch (method) {
        case 'cod':
            return 'Cash on Delivery';
        case 'card':
            return 'Credit/Debit Card';
        case 'mobile':
            return 'Mobile Payment';
        default:
            return capitalizeFirst(method);
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: 500;
        z-index: 3000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#27ae60';
            break;
        case 'error':
            notification.style.backgroundColor = '#e74c3c';
            break;
        case 'info':
            notification.style.backgroundColor = '#3498db';
            break;
        default:
            notification.style.backgroundColor = '#6c757d';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

