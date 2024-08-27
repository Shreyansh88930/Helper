document.addEventListener('DOMContentLoaded', () => {
    const changePasswordForm = document.getElementById('changePasswordForm');
    const message = document.getElementById('message');
    const togglePassword = document.getElementById('togglePassword');
    const newPassword = document.getElementById('newPassword');

    // Toggle password visibility
    togglePassword.addEventListener('click', () => {
        const type = newPassword.getAttribute('type') === 'password' ? 'text' : 'password';
        newPassword.setAttribute('type', type);

        // Toggle the icon
        togglePassword.classList.toggle('fa-eye');
        togglePassword.classList.toggle('fa-eye-slash');
    });

    // Handle form submission
    changePasswordForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const currentPassword = changePasswordForm.currentPassword.value;
        const newPasswordValue = changePasswordForm.newPassword.value;
        const confirmPassword = changePasswordForm.confirmPassword.value;

        // Simple validation to check if new password and confirm password match
        if (newPasswordValue !== confirmPassword) {
            message.textContent = 'New passwords do not match. Please try again.';
            message.style.color = 'red';
            return;
        }

        const passwordData = {
            currentPassword: currentPassword,
            newPassword: newPasswordValue
        };

        // Send the password data to the server
        fetch('/changePassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(passwordData)
        })
        .then(response => response.json())
        .then(result => {
            message.textContent = result.message;
            message.style.color = result.success ? 'green' : 'red';
        })
        .catch(error => {
            console.error('Error changing password:', error);
            message.textContent = 'Error changing password. Please try again.';
            message.style.color = 'red';
        });
    });
});
