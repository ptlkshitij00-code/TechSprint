// Generic Admin Login Handler (for login.html)
(function () {
    'use strict';

    const form = document.getElementById('adminLoginForm');
    const alertEl = document.getElementById('alert');
    const btnLogin = document.getElementById('btnLogin');

    function showAlert(msg, type = 'danger') {
        alertEl.className = 'alert alert-' + type + ' alert-inline';
        alertEl.innerText = msg;
        alertEl.style.display = 'block';
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        alertEl.style.display = 'none';
        btnLogin.disabled = true;
        btnLogin.innerText = 'Signing in...';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await AuthAPI.login({ email, password });

            // Store token and user info
            TokenService.setToken(response.token);
            localStorage.setItem('user', JSON.stringify(response.user));

            // Check if user is admin
            if (response.user.role === 'admin') {
                window.location.href = 'admin-dashboard';
            } else {
                // Not an admin
                TokenService.removeToken();
                localStorage.removeItem('user');
                showAlert('Access denied. Not an admin user.');
                btnLogin.disabled = false;
                btnLogin.innerText = 'Sign In';
            }
        } catch (err) {
            console.error('Login error:', err);
            showAlert(err.message || 'Login failed. Please check your credentials.');
            btnLogin.disabled = false;
            btnLogin.innerText = 'Sign In';
        }
    });
})();
