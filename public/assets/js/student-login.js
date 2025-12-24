// Student Login Handler
(function () {
    'use strict';

    // Check if already logged in
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = 'student-dashboard';
    }

    // Form submission handler
    document.getElementById('loginForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        const submitBtn = this.querySelector('button[type="submit"]');

        // Validation
        if (!email || !password) {
            showAlert('Please fill in all fields', 'danger');
            return;
        }

        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...';

        try {
            const response = await AuthAPI.login({ email, password });

            // Store token
            TokenService.set(response.token);

            // Store remember me preference
            if (rememberMe) {
                localStorage.setItem('studentEmail', email);
            } else {
                localStorage.removeItem('studentEmail');
            }

            // Verify role
            if (response.user.role !== 'student') {
                showAlert('Access denied. This login is for students only.', 'danger');
                TokenService.remove();
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Login';
                return;
            }

            // Store user info
            localStorage.setItem('user', JSON.stringify(response.user));

            // Redirect to dashboard
            showAlert('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'student-dashboard';
            }, 1000);

        } catch (error) {
            console.error('Login error:', error);
            showAlert(error.message || 'Invalid email or password', 'danger');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Login';
        }
    });

    // Helper function to show alert
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

    // Load remembered email if exists
    const rememberedEmail = localStorage.getItem('studentEmail');
    if (rememberedEmail) {
        document.getElementById('email').value = rememberedEmail;
        document.getElementById('rememberMe').checked = true;
    }
})();
