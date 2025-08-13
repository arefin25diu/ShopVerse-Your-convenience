// PHP-based authentication for homepage
document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userProfile = document.getElementById('userProfile');
    const userName = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');

    function checkAuthStatus() {
        fetch('auth.php?action=user', {
            method: 'GET',
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // User is logged in
                updateUI(data.data);
            } else {
                // User is not logged in
                updateUI(null);
            }
        })
        .catch(error => {
            console.error('Auth check error:', error);
            // Assume not logged in on error
            updateUI(null);
        });
    }

    function updateUI(currentUser) {
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
                loginBtn.href = 'simple-login.html';
            }
            if (registerBtn) {
                registerBtn.style.display = 'inline-block';
                registerBtn.href = 'simple-register.html';
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
            fetch('auth.php?action=logout', {
                method: 'POST',
                credentials: 'same-origin'
            })
            .then(response => response.json())
            .then(data => {
                alert('Logged out successfully!');
                window.location.reload();
            })
            .catch(error => {
                console.error('Logout error:', error);
                alert('Logged out successfully!');
                window.location.reload();
            });
        });
    }

    // Check authentication status on page load
    checkAuthStatus();
});

