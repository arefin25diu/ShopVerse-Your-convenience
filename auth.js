// Simple authentication for homepage
document.addEventListener('DOMContentLoaded', function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userProfile = document.getElementById('userProfile');
    const userName = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');

    function updateUI() {
        if (currentUser) {
            // User is logged in
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            if (userProfile) {
                userProfile.style.display = 'flex';
                userProfile.classList.remove('hidden');
            }
            if (userName) {
                userName.textContent = `Hello, ${currentUser.name}!`;
            }
        } else {
            // User is not logged in
            if (loginBtn) {
                loginBtn.style.display = 'inline-block';
                loginBtn.href = 'login.html';
            }
            if (registerBtn) {
                registerBtn.style.display = 'inline-block';
                registerBtn.href = 'register.html';
            }
            if (userProfile) {
                userProfile.style.display = 'none';
                userProfile.classList.add('hidden');
            }
        }
    }

    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('currentUser');
            alert('Logged out successfully!');
            window.location.reload();
        });
    }

    // Update UI on page load
    updateUI();
});

