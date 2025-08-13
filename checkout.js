// Checkout page functionality
let currentStep = 1;
let cartData = [];
let orderData = {
    items: [],
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total: 0,
    authType: 'guest',
    user: null,
    shipping: {},
    payment: {},
    billing: {}
};

// Initialize checkout page
document.addEventListener('DOMContentLoaded', function() {
    loadCartData();
    setupEventListeners();
    updateOrderSummary();
});

// Setup event listeners
function setupEventListeners() {
    // Authentication option selection
    document.querySelectorAll('.auth-option').forEach(option => {
        option.addEventListener('click', function() {
            selectAuthOption(this.dataset.auth);
        });
    });

    // Payment method selection
    document.querySelectorAll('.payment-method').forEach(method => {
        method.addEventListener('click', function() {
            selectPaymentMethod(this.dataset.payment);
        });
    });

    // Card number formatting
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', formatCardNumber);
    }

    // Expiry date formatting
    const cardExpiryInput = document.getElementById('cardExpiry');
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', formatExpiryDate);
    }

    // Billing address checkbox
    const billingCheckbox = document.getElementById('useBillingAddress');
    if (billingCheckbox) {
        billingCheckbox.addEventListener('change', toggleBillingAddress);
    }

    // Form validation on input
    document.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('blur', validateField);
    });
}

// Load cart data from localStorage or API
function loadCartData() {
    try {
        // For demo purposes, we'll use localStorage
        // In a real application, this would be an API call
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            cartData = JSON.parse(savedCart);
        } else {
            // Demo cart data
            cartData = [
                {
                    id: 1,
                    name: 'Fresh Bananas',
                    price: 2.99,
                    quantity: 2,
                    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&h=200&fit=crop'
                },
                {
                    id: 2,
                    name: 'Organic Tomatoes',
                    price: 3.49,
                    quantity: 1,
                    image: 'https://images.unsplash.com/photo-1546470427-e5e5d7f0b6b8?w=300&h=200&fit=crop'
                }
            ];
        }
        
        displayCartItems();
        calculateTotals();
        
    } catch (error) {
        console.error('Error loading cart data:', error);
        showNotification('Error loading cart data', 'error');
    }
}

// Display cart items
function displayCartItems() {
    const cartContainer = document.getElementById('cartItems');
    
    if (cartData.length === 0) {
        cartContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #6c757d;">
                <i class="fas fa-shopping-cart" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <h3>Your cart is empty</h3>
                <p>Add some items to your cart to continue</p>
                <a href="index.html" class="btn-primary">Continue Shopping</a>
            </div>
        `;
        return;
    }

    const cartHTML = cartData.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <img src="${item.image}" alt="${item.name}" class="item-image">
            <div class="item-details">
                <h3>${item.name}</h3>
                <p>Unit Price: $${item.price.toFixed(2)}</p>
            </div>
            <div class="quantity-controls">
                <button class="qty-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">
                    <i class="fas fa-minus"></i>
                </button>
                <input type="number" class="qty-input" value="${item.quantity}" 
                       onchange="updateQuantity(${item.id}, this.value)" min="1">
                <button class="qty-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            <div class="item-price">$${(item.price * item.quantity).toFixed(2)}</div>
            <button class="remove-btn" onclick="removeItem(${item.id})">
                <i class="fas fa-trash"></i> Remove
            </button>
        </div>
    `).join('');

    cartContainer.innerHTML = cartHTML;
}

// Update item quantity
function updateQuantity(itemId, newQuantity) {
    newQuantity = parseInt(newQuantity);
    
    if (newQuantity < 1) {
        removeItem(itemId);
        return;
    }

    const itemIndex = cartData.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
        cartData[itemIndex].quantity = newQuantity;
        saveCartData();
        displayCartItems();
        calculateTotals();
        updateOrderSummary();
        showNotification('Quantity updated', 'success');
    }
}

// Remove item from cart
function removeItem(itemId) {
    cartData = cartData.filter(item => item.id !== itemId);
    saveCartData();
    displayCartItems();
    calculateTotals();
    updateOrderSummary();
    showNotification('Item removed from cart', 'success');
}

// Save cart data to localStorage
function saveCartData() {
    localStorage.setItem('cart', JSON.stringify(cartData));
}

// Calculate totals
function calculateTotals() {
    orderData.subtotal = cartData.reduce((total, item) => total + (item.price * item.quantity), 0);
    orderData.tax = orderData.subtotal * 0.08; // 8% tax
    orderData.shipping = orderData.subtotal > 50 ? 0 : 5.99; // Free shipping over $50
    orderData.total = orderData.subtotal + orderData.tax + orderData.shipping;
    orderData.items = cartData;
}

// Update order summary display
function updateOrderSummary() {
    document.getElementById('subtotalAmount').textContent = `$${orderData.subtotal.toFixed(2)}`;
    document.getElementById('taxAmount').textContent = `$${orderData.tax.toFixed(2)}`;
    document.getElementById('shippingAmount').textContent = orderData.shipping === 0 ? 'Free' : `$${orderData.shipping.toFixed(2)}`;
    document.getElementById('totalAmount').textContent = `$${orderData.total.toFixed(2)}`;
}

// Select authentication option
function selectAuthOption(authType) {
    // Update UI
    document.querySelectorAll('.auth-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector(`[data-auth="${authType}"]`).classList.add('selected');

    // Show/hide forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(`${authType}Form`).classList.add('active');

    orderData.authType = authType;
}

// Handle login
async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    try {
        // In a real application, this would be an API call
        // For demo purposes, we'll simulate a successful login
        showNotification('Login successful!', 'success');
        orderData.user = { email, name: 'John Doe' };
        proceedToNext();
    } catch (error) {
        showNotification('Login failed. Please try again.', 'error');
    }
}

// Handle registration
async function handleRegister() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const phone = document.getElementById('registerPhone').value;

    if (!name || !email || !password) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    try {
        // In a real application, this would be an API call
        // For demo purposes, we'll simulate a successful registration
        showNotification('Account created successfully!', 'success');
        orderData.user = { email, name, phone };
        proceedToNext();
    } catch (error) {
        showNotification('Registration failed. Please try again.', 'error');
    }
}

// Select payment method
function selectPaymentMethod(paymentType) {
    // Update UI
    document.querySelectorAll('.payment-method').forEach(method => {
        method.classList.remove('selected');
    });
    document.querySelector(`[data-payment="${paymentType}"]`).classList.add('selected');

    // Update radio button
    document.querySelector(`input[value="${paymentType}"]`).checked = true;

    // Show/hide payment details
    document.querySelectorAll('.payment-details').forEach(details => {
        details.classList.remove('active');
    });
    document.querySelector(`[data-payment="${paymentType}"] .payment-details`).classList.add('active');

    orderData.payment.method = paymentType;
}

// Format card number input
function formatCardNumber(e) {
    let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    e.target.value = formattedValue;
}

// Format expiry date input
function formatExpiryDate(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    e.target.value = value;
}

// Toggle billing address
function toggleBillingAddress() {
    const checkbox = document.getElementById('useBillingAddress');
    // In a real application, you would show/hide billing address form here
    orderData.useSameAddress = checkbox.checked;
}

// Validate individual field
function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    // Remove existing error styling
    field.classList.remove('error');
    
    // Basic validation
    if (field.hasAttribute('required') && !value) {
        field.classList.add('error');
        return false;
    }
    
    // Email validation
    if (field.type === 'email' && value && !isValidEmail(value)) {
        field.classList.add('error');
        return false;
    }
    
    return true;
}

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Proceed to next step
function proceedToNext() {
    if (!validateCurrentStep()) {
        return;
    }

    if (currentStep < 5) {
        currentStep++;
        updateStepDisplay();
        showCurrentSection();
        updateProceedButton();
    } else {
        // Place order
        placeOrder();
    }
}

// Validate current step
function validateCurrentStep() {
    switch (currentStep) {
        case 1: // Cart Review
            if (cartData.length === 0) {
                showNotification('Your cart is empty', 'error');
                return false;
            }
            return true;

        case 2: // Authentication
            if (orderData.authType === 'guest') {
                const guestEmail = document.getElementById('guestEmail').value;
                if (!guestEmail || !isValidEmail(guestEmail)) {
                    showNotification('Please enter a valid email address', 'error');
                    return false;
                }
                orderData.guestEmail = guestEmail;
            }
            return true;

        case 3: // Shipping
            const requiredFields = ['shippingName', 'shippingPhone', 'shippingAddress1', 'shippingCity', 'shippingState', 'shippingZip', 'shippingCountry'];
            for (let fieldId of requiredFields) {
                const field = document.getElementById(fieldId);
                if (!field.value.trim()) {
                    showNotification('Please fill in all required shipping fields', 'error');
                    field.focus();
                    return false;
                }
            }
            
            // Save shipping data
            orderData.shipping = {
                name: document.getElementById('shippingName').value,
                phone: document.getElementById('shippingPhone').value,
                address1: document.getElementById('shippingAddress1').value,
                address2: document.getElementById('shippingAddress2').value,
                city: document.getElementById('shippingCity').value,
                state: document.getElementById('shippingState').value,
                zip: document.getElementById('shippingZip').value,
                country: document.getElementById('shippingCountry').value
            };
            return true;

        case 4: // Payment
            const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
            orderData.payment.method = paymentMethod;
            
            if (paymentMethod === 'card') {
                const cardFields = ['cardNumber', 'cardExpiry', 'cardCVC', 'cardName'];
                for (let fieldId of cardFields) {
                    const field = document.getElementById(fieldId);
                    if (!field.value.trim()) {
                        showNotification('Please fill in all card details', 'error');
                        field.focus();
                        return false;
                    }
                }
                
                orderData.payment.card = {
                    number: document.getElementById('cardNumber').value,
                    expiry: document.getElementById('cardExpiry').value,
                    cvc: document.getElementById('cardCVC').value,
                    name: document.getElementById('cardName').value
                };
            } else if (paymentMethod === 'mobile') {
                const provider = document.getElementById('mobileProvider').value;
                const number = document.getElementById('mobileNumber').value;
                
                if (!provider || !number) {
                    showNotification('Please fill in mobile payment details', 'error');
                    return false;
                }
                
                orderData.payment.mobile = { provider, number };
            }
            
            // Generate order review
            generateOrderReview();
            return true;

        case 5: // Review
            return true;

        default:
            return true;
    }
}

// Update step display
function updateStepDisplay() {
    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 < currentStep) {
            step.classList.add('completed');
        } else if (index + 1 === currentStep) {
            step.classList.add('active');
        }
    });
}

// Show current section
function showCurrentSection() {
    // Hide all sections
    document.querySelectorAll('.checkout-section').forEach(section => {
        section.classList.add('hidden');
    });

    // Show current section
    const sectionMap = {
        1: 'cartSection',
        2: 'authSection',
        3: 'shippingSection',
        4: 'paymentSection',
        5: 'reviewSection'
    };

    const currentSectionId = sectionMap[currentStep];
    if (currentSectionId) {
        document.getElementById(currentSectionId).classList.remove('hidden');
    }
}

// Update proceed button
function updateProceedButton() {
    const proceedBtn = document.getElementById('proceedBtn');
    const buttonTexts = {
        1: 'Proceed to Authentication',
        2: 'Proceed to Shipping',
        3: 'Proceed to Payment',
        4: 'Review Order',
        5: 'Place Order'
    };

    proceedBtn.textContent = buttonTexts[currentStep];
    
    if (currentStep === 5) {
        proceedBtn.classList.add('place-order');
        proceedBtn.style.background = '#e74c3c';
    }
}

// Generate order review
function generateOrderReview() {
    const reviewContainer = document.getElementById('orderReview');
    
    const itemsHTML = cartData.map(item => `
        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #eee;">
            <span>${item.name} x ${item.quantity}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    const shippingHTML = `
        <div style="margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-radius: 6px;">
            <h4>Shipping Address:</h4>
            <p>${orderData.shipping.name}<br>
            ${orderData.shipping.address1}<br>
            ${orderData.shipping.address2 ? orderData.shipping.address2 + '<br>' : ''}
            ${orderData.shipping.city}, ${orderData.shipping.state} ${orderData.shipping.zip}<br>
            ${orderData.shipping.country}</p>
        </div>
    `;

    const paymentHTML = `
        <div style="margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-radius: 6px;">
            <h4>Payment Method:</h4>
            <p>${getPaymentMethodDisplay()}</p>
        </div>
    `;

    reviewContainer.innerHTML = `
        <h3>Order Items:</h3>
        ${itemsHTML}
        ${shippingHTML}
        ${paymentHTML}
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid #eee;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.2rem;">
                <span>Total: $${orderData.total.toFixed(2)}</span>
            </div>
        </div>
    `;
}

// Get payment method display text
function getPaymentMethodDisplay() {
    switch (orderData.payment.method) {
        case 'cod':
            return 'Cash on Delivery';
        case 'card':
            return `Credit/Debit Card ending in ${orderData.payment.card?.number?.slice(-4) || '****'}`;
        case 'mobile':
            return `${orderData.payment.mobile?.provider || 'Mobile Payment'} - ${orderData.payment.mobile?.number || ''}`;
        default:
            return 'Not selected';
    }
}

// Place order
async function placeOrder() {
    const proceedBtn = document.getElementById('proceedBtn');
    proceedBtn.disabled = true;
    proceedBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order...';

    try {
        // In a real application, this would be an API call to create the order
        // For demo purposes, we'll simulate order creation
        
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
        
        // Generate order number
        const orderNumber = 'ORD-' + Date.now();
        
        // Clear cart
        localStorage.removeItem('cart');
        
        // Redirect to confirmation page
        window.location.href = `order-confirmation.html?order=${orderNumber}`;
        
    } catch (error) {
        console.error('Error placing order:', error);
        showNotification('Failed to place order. Please try again.', 'error');
        proceedBtn.disabled = false;
        proceedBtn.textContent = 'Place Order';
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
    `;
    
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#27ae60';
            break;
        case 'error':
            notification.style.backgroundColor = '#e74c3c';
            break;
        default:
            notification.style.backgroundColor = '#3498db';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add CSS for error styling
const style = document.createElement('style');
style.textContent = `
    .error {
        border-color: #e74c3c !important;
        background-color: #fdf2f2 !important;
    }
    
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

