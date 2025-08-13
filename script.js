// Global variables
let cart = [];
let products = [];
let currentUser = null;
let searchTimeout;

// Sample product data
const sampleProducts = [
    {
        id: 1,
        name: "Fresh Bananas",
        price: 2.99,
        category: "fruits",
        image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&h=200&fit=crop",
        description: "Fresh organic bananas",
        stock: 50
    },
    {
        id: 2,
        name: "Organic Tomatoes",
        price: 3.49,
        category: "vegetables",
        image: "https://images.unsplash.com/photo-1561136594-7f68413baa99?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        description: "Fresh organic tomatoes",
        stock: 30
    },
    {
        id: 3,
        name: "Fresh Bread",
        price: 2.49,
        category: "bakery",
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=200&fit=crop",
        description: "Freshly baked bread",
        stock: 20
    },
    {
        id: 4,
        name: "Chicken Breast",
        price: 8.99,
        category: "meat",
        image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=300&h=200&fit=crop",
        description: "Fresh chicken breast",
        stock: 15
    },
    {
        id: 5,
        name: "Milk",
        price: 3.99,
        category: "groceries",
        image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=200&fit=crop",
        description: "Fresh whole milk",
        stock: 25
    },
    {
        id: 6,
        name: "Face Cream",
        price: 15.99,
        category: "cosmetics",
        image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=200&fit=crop",
        description: "Moisturizing face cream",
        stock: 10
    },
    {
        id: 7,
        name: "Fresh Apples",
        price: 4.99,
        category: "fruits",
        image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&h=200&fit=crop",
        description: "Crispy red apples",
        stock: 40
    },
    {
        id: 8,
        name: "Carrots",
        price: 2.29,
        category: "vegetables",
        image: "https://images.unsplash.com/photo-1445282768818-728615cc910a?w=300&h=200&fit=crop",
        description: "Fresh organic carrots",
        stock: 35
    }
];

// Check login status on page load
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    initializeApp();
});

// Check if user is logged in
function checkLoginStatus() {
    // Check session storage for user data
    const userData = sessionStorage.getItem('supershop_user') || localStorage.getItem('supershop_user');
    
    if (userData) {
        try {
            currentUser = JSON.parse(userData);
            updateUIForLoggedInUser();
        } catch (e) {
            console.error('Error parsing user data:', e);
            // Clear invalid data
            sessionStorage.removeItem('supershop_user');
            localStorage.removeItem('supershop_user');
        }
    }
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userProfile = document.getElementById('userProfile');
    const userName = document.getElementById('userName');
    
    if (currentUser && loginBtn && registerBtn && userProfile && userName) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        userProfile.classList.remove('hidden');
        userName.textContent = `Welcome, ${currentUser.name}`;
        
        // Add logout functionality
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
    }
}

// Handle logout
function handleLogout() {
    // Clear user data
    sessionStorage.removeItem('supershop_user');
    localStorage.removeItem('supershop_user');
    currentUser = null;
    
    // Reset UI
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userProfile = document.getElementById('userProfile');
    
    if (loginBtn && registerBtn && userProfile) {
        loginBtn.style.display = 'inline-block';
        registerBtn.style.display = 'inline-block';
        userProfile.classList.add('hidden');
    }
    
    // Redirect to login page
    window.location.href = 'login.html?logout=1';
}

// Initialize app
function initializeApp() {
    products = sampleProducts;
    loadCartFromStorage();
    loadUserFromStorage();
    setupEventListeners();
    displayFeaturedProducts();
    startCountdown();
    displayProducts();
    updateCartUI();
    updateUserUI();
    startFlashSaleCountdown();
    initializeChatbot();
}

// Event Listeners Setup
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', handleSearch);
    
    // Category navigation
    const categoryLinks = document.querySelectorAll('[data-category]');
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = e.target.getAttribute('data-category');
            filterProductsByCategory(category);
        });
    });
    
    // Cart icon
    document.querySelector('.cart-icon').addEventListener('click', openCartModal);
    
    // Login/Register buttons
    document.getElementById('loginBtn').addEventListener('click', openLoginModal);
    document.getElementById('registerBtn').addEventListener('click', openRegisterModal);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Modal functionality
    setupModalEventListeners();
    
    // Forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Chatbot
    document.getElementById('chatToggle').addEventListener('click', toggleChat);
    document.getElementById('sendMessage').addEventListener('click', sendChatMessage);
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
}

// Search Functionality
function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        if (query.length > 0) {
            showSearchSuggestions(query);
            filterProducts(query);
        } else {
            hideSearchSuggestions();
            displayProducts();
        }
    }, 300);
}

function showSearchSuggestions(query) {
    const suggestions = products.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
    ).slice(0, 5);
    
    const suggestionsContainer = document.getElementById('searchSuggestions');
    
    if (suggestions.length > 0) {
        suggestionsContainer.innerHTML = suggestions.map(product => 
            `<div class="suggestion-item" onclick="selectSuggestion('${product.name}')">${product.name}</div>`
        ).join('');
        suggestionsContainer.style.display = 'block';
    } else {
        hideSearchSuggestions();
    }
}

function hideSearchSuggestions() {
    document.getElementById('searchSuggestions').style.display = 'none';
}

function selectSuggestion(productName) {
    document.getElementById('searchInput').value = productName;
    hideSearchSuggestions();
    filterProducts(productName.toLowerCase());
}

function filterProducts(query) {
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
    );
    displayProducts(filteredProducts);
}

function filterProductsByCategory(category) {
    if (category === 'all') {
        displayProducts();
    } else {
        const filteredProducts = products.filter(product => product.category === category);
        displayProducts(filteredProducts);
    }
}

// Product Display
function displayProducts(productsToShow = products) {
    const productsGrid = document.getElementById('productsGrid');
    
    if (productsToShow.length === 0) {
        productsGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">No products found.</p>';
        return;
    }
    
    productsGrid.innerHTML = productsToShow.map(product => `
        <div class="product-card" data-product-id="${product.id}">
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <p class="product-description">${product.description}</p>
                <p class="product-stock">Stock: ${product.stock}</p>
                <div class="product-actions">
                    <button class="btn-add-cart" onclick="addToCart(${product.id})">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Cart Management
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock <= 0) {
        showNotification('Product is out of stock!', 'error');
        return;
    }
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity += 1;
            showNotification('Product quantity updated in cart!', 'success');
        } else {
            showNotification('Cannot add more items. Stock limit reached!', 'error');
            return;
        }
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
        showNotification('Product added to cart!', 'success');
    }
    
    updateCartUI();
    saveCartToStorage();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
    saveCartToStorage();
    displayCartItems();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    const product = products.find(p => p.id === productId);
    
    if (item) {
        const newQuantity = item.quantity + change;
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else if (newQuantity <= product.stock) {
            item.quantity = newQuantity;
            updateCartUI();
            saveCartToStorage();
            displayCartItems();
        } else {
            showNotification('Cannot add more items. Stock limit reached!', 'error');
        }
    }
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Update cart total
    const cartTotal = document.getElementById('cartTotal');
    if (cartTotal) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = total.toFixed(2);
    }
}

function displayCartItems() {
    const cartItems = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center;">Your cart is empty</p>';
        return;
    }
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>$${item.price.toFixed(2)} each</p>
            </div>
            <div class="cart-item-actions">
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
                <button class="btn-remove" onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        </div>
    `).join('');
}

// Modal Management
function setupModalEventListeners() {
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModals);
    });
    
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModals();
            }
        });
    });
    
    // Switch between login and register
    document.getElementById('switchToRegister').addEventListener('click', (e) => {
        e.preventDefault();
        closeModals();
        openRegisterModal();
    });
    
    document.getElementById('switchToLogin').addEventListener('click', (e) => {
        e.preventDefault();
        closeModals();
        openLoginModal();
    });
}

function openLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function openRegisterModal() {
    document.getElementById('registerModal').style.display = 'block';
}

function openCartModal() {
    displayCartItems();
    document.getElementById('cartModal').style.display = 'block';
}

function closeModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// User Authentication
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Simulate login (in real app, this would be an API call)
    if (email && password) {
        currentUser = {
            id: 1,
            name: email.split('@')[0],
            email: email
        };
        
        saveUserToStorage();
        updateUserUI();
        closeModals();
        showNotification('Login successful!', 'success');
    } else {
        showNotification('Please fill in all fields', 'error');
    }
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const phone = document.getElementById('registerPhone').value;
    
    // Simulate registration (in real app, this would be an API call)
    if (name && email && password && phone) {
        currentUser = {
            id: Date.now(),
            name: name,
            email: email,
            phone: phone
        };
        
        saveUserToStorage();
        updateUserUI();
        closeModals();
        showNotification('Registration successful!', 'success');
    } else {
        showNotification('Please fill in all fields', 'error');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUserUI();
    showNotification('Logged out successfully!', 'success');
}

function updateUserUI() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userProfile = document.getElementById('userProfile');
    const userName = document.getElementById('userName');
    
    if (currentUser) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        userProfile.classList.remove('hidden');
        userName.textContent = `Hello, ${currentUser.name}`;
    } else {
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        userProfile.classList.add('hidden');
    }
}

// Local Storage Management
function saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

function saveUserToStorage() {
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

function loadUserFromStorage() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }
}

// Flash Sale Countdown
function startFlashSaleCountdown() {
    const endTime = new Date().getTime() + (24 * 60 * 60 * 1000); // 24 hours from now
    
    const countdown = setInterval(() => {
        const now = new Date().getTime();
        const distance = endTime - now;
        
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
        
        if (distance < 0) {
            clearInterval(countdown);
            document.getElementById('flashSaleCountdown').innerHTML = '<p>Sale Ended!</p>';
        }
    }, 1000);
}

// Chatbot Functionality
function initializeChatbot() {
    addChatMessage('Hello! I\'m your virtual assistant. How can I help you today?', 'bot');
}

function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.classList.toggle('hidden');
}

function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (message) {
        addChatMessage(message, 'user');
        chatInput.value = '';
        
        // Simulate bot response
        setTimeout(() => {
            const response = generateBotResponse(message);
            addChatMessage(response, 'bot');
        }, 1000);
    }
}

function addChatMessage(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function generateBotResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    if (message.includes('product') || message.includes('item')) {
        return 'You can browse our products by category or use the search bar to find specific items. We have fresh groceries, vegetables, fruits, meat, bakery items, and cosmetics.';
    } else if (message.includes('shipping') || message.includes('delivery')) {
        return 'We offer free delivery on orders above $50. Standard delivery takes 2-3 business days. Express delivery is available for an additional fee.';
    } else if (message.includes('return') || message.includes('refund')) {
        return 'We have a 30-day return policy for most items. Fresh products can be returned within 3 days if there are quality issues. Please contact our support team for assistance.';
    } else if (message.includes('payment')) {
        return 'We accept all major credit cards, PayPal, and other secure payment methods. Your payment information is encrypted and secure.';
    } else if (message.includes('account') || message.includes('login')) {
        return 'You can create an account to track orders, save favorites, and get personalized recommendations. Click the Register button to get started.';
    } else if (message.includes('help') || message.includes('support')) {
        return 'I\'m here to help! You can ask me about products, shipping, returns, payments, or any other questions about shopping with us.';
    } else {
        return 'Thank you for your message! For specific inquiries, please contact our customer support team. Is there anything else I can help you with regarding our products or services?';
    }
}

// Notification System
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

// Add CSS animation for notifications
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



// Navigation functions
function navigateToProducts() {
    window.location.href = 'products.html';
}

function navigateToHotDeals() {
    window.location.href = 'hot-deals.html';
}

function navigateToBestSellers() {
    window.location.href = 'best-sellers.html';
}

function navigateToDashboard() {
    // Check if user is logged in
    const userData = sessionStorage.getItem('supershop_user') || localStorage.getItem('supershop_user');
    if (!userData) {
        // Redirect to login with return URL
        window.location.href = 'login.html?redirect=dashboard.html';
        return;
    }
    window.location.href = 'dashboard.html';
}

function navigateToContact() {
    window.location.href = 'contact.html';
}

// Search functionality
function performSearch(query) {
    if (!query || query.trim() === '') {
        return [];
    }
    
    const searchTerm = query.toLowerCase().trim();
    return products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
    );
}

function showSearchSuggestions(query) {
    const suggestions = document.getElementById('searchSuggestions');
    if (!suggestions) return;
    
    if (!query || query.trim() === '') {
        suggestions.style.display = 'none';
        return;
    }
    
    const results = performSearch(query).slice(0, 5); // Show max 5 suggestions
    
    if (results.length === 0) {
        suggestions.innerHTML = '<div class="suggestion-item">No products found</div>';
    } else {
        suggestions.innerHTML = results.map(product => 
            `<div class="suggestion-item" onclick="selectSearchSuggestion('${product.name}')">
                <img src="${product.image}" alt="${product.name}" class="suggestion-image">
                <div class="suggestion-details">
                    <div class="suggestion-name">${product.name}</div>
                    <div class="suggestion-price">$${product.price.toFixed(2)}</div>
                </div>
            </div>`
        ).join('');
    }
    
    suggestions.style.display = 'block';
}

function selectSearchSuggestion(productName) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = productName;
    }
    
    const suggestions = document.getElementById('searchSuggestions');
    if (suggestions) {
        suggestions.style.display = 'none';
    }
    
    // Navigate to products page with search
    window.location.href = `products.html?search=${encodeURIComponent(productName)}`;
}

// Enhanced cart functions
function viewCart() {
    // Create a simple cart modal or navigate to checkout
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    // For now, navigate to checkout
    window.location.href = 'checkout.html';
}

function clearCart() {
    if (confirm('Are you sure you want to clear your cart?')) {
        cart = [];
        saveCartToStorage();
        updateCartUI();
        alert('Cart cleared successfully!');
    }
}

// Product view function
function viewProduct(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

// Category filter function
function filterByCategory(category) {
    window.location.href = `products.html?category=${encodeURIComponent(category)}`;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    
    // Setup search functionality
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            showSearchSuggestions(this.value);
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    window.location.href = `products.html?search=${encodeURIComponent(query)}`;
                }
            }
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target)) {
                const suggestions = document.getElementById('searchSuggestions');
                if (suggestions) {
                    suggestions.style.display = 'none';
                }
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const query = searchInput ? searchInput.value.trim() : '';
            if (query) {
                window.location.href = `products.html?search=${encodeURIComponent(query)}`;
            }
        });
    }
    
    // Setup cart icon click
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
        cartIcon.addEventListener('click', viewCart);
    }
    
    // Setup navigation menu clicks for category filtering on home page
    const navLinks = document.querySelectorAll('.nav-menu a[data-category]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.getAttribute('data-category');
            if (category === 'all') {
                displayProducts();
            } else {
                displayProducts(category);
            }
        });
    });
});

// Handle login success redirect
function handleLoginSuccess() {
    // Check for redirect parameter
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect');
    
    if (redirectUrl) {
        window.location.href = redirectUrl;
    } else {
        window.location.href = 'index.html';
    }
}

// Export functions for use in other scripts
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.viewProduct = viewProduct;
window.filterByCategory = filterByCategory;
window.handleLoginSuccess = handleLoginSuccess;
window.navigateToProducts = navigateToProducts;
window.navigateToHotDeals = navigateToHotDeals;
window.navigateToBestSellers = navigateToBestSellers;
window.navigateToDashboard = navigateToDashboard;
window.navigateToContact = navigateToContact;

// Flash Sale Countdown Timer
const flashSaleEndTime = new Date("2025-08-13T00:00:00").getTime(); // Set your sale end time

const countdown = setInterval(function() {
    const now = new Date().getTime();
    const distance = flashSaleEndTime - now;

    // Calculate hours, minutes, seconds
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Update countdown display
    document.getElementById("hours").innerText = hours < 10 ? "0" + hours : hours;
    document.getElementById("minutes").innerText = minutes < 10 ? "0" + minutes : minutes;
    document.getElementById("seconds").innerText = seconds < 10 ? "0" + seconds : seconds;

    // If the countdown finishes
    if (distance < 0) {
        clearInterval(countdown);
        document.getElementById("flashSaleCountdown").innerHTML = "EXPIRED";
    }
}, 1000);
