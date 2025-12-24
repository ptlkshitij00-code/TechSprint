// Admin Login Handler
(function () {
    'use strict';

    // Check if already logged in
    const token = localStorage.getItem('token');
    if (token) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role === 'admin') {
            window.location.href = 'admin-dashboard';
        }
    }

    // Form submission handler
    document.getElementById('loginForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitBtn = this.querySelector('button[type="submit"]');

        if (!email || !password) {
            showAlert('Please fill in all fields', 'danger');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Authenticating...';

        try {
            const response = await AuthAPI.login({ email, password });

            TokenService.set(response.token);

            if (response.user.role !== 'admin') {
                showAlert('Access denied. Admin credentials required.', 'danger');
                TokenService.remove();
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Login';
                return;
            }

            localStorage.setItem('user', JSON.stringify(response.user));

            showAlert('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'admin-dashboard';
            }, 1000);

        } catch (error) {
            console.error('Login error:', error);
            showAlert(error.message || 'Invalid credentials', 'danger');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Login';
        }
    });

    function showAlert(message, type) {
        const existingAlert = document.querySelector('.login-alert');
        if (existingAlert) existingAlert.remove();

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} login-alert mt-3`;
        alertDiv.innerHTML = `
            <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
            ${message}
        `;

        const form = document.getElementById('loginForm');
        form.parentNode.insertBefore(alertDiv, form.nextSibling);
        setTimeout(() => alertDiv.remove(), 5000);
    }
})();
