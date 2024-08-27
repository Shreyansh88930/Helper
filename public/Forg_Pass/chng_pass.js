import { auth } from '../firebase.js'; // Adjust the path if needed
import { reauthenticateWithCredential, updatePassword, EmailAuthProvider } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const changePasswordForm = document.getElementById('changePasswordForm');
    const message = document.getElementById('message');
    const toggleNewPassword = document.getElementById('toggleNewPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');

    // Toggle password visibility
    toggleNewPassword.addEventListener('click', () => {
        const type = newPassword.getAttribute('type') === 'password' ? 'text' : 'password';
        newPassword.setAttribute('type', type);
        
        // Toggle the icon
        toggleNewPassword.classList.toggle('fa-eye');
        toggleNewPassword.classList.toggle('fa-eye-slash');
    });

    // Handle form submission
    changePasswordForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const currentPassword = prompt("Please enter your current password"); // Prompt for current password
        const newPasswordValue = newPassword.value;
        const confirmPasswordValue = confirmPassword.value;

        // Simple validation to check if new password and confirm password match
        if (newPasswordValue !== confirmPasswordValue) {
            message.textContent = 'New passwords do not match. Please try again.';
            message.style.color = 'red';
            return;
        }

        const user = auth.currentUser;

        if (!user) {
            message.textContent = 'No user is currently signed in.';
            message.style.color = 'red';
            return;
        }

        try {
            // Re-authenticate user
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Update password
            await updatePassword(user, newPasswordValue);

            message.textContent = 'Password updated successfully.';
            message.style.color = 'green';
        } catch (error) {
            console.error('Error changing password:', error);
            message.textContent = 'Error changing password. Please try again.';
            message.style.color = 'red';
        }
    });
});
