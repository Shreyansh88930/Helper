import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageElement = document.getElementById('message');
    const submitButton = document.querySelector('button[type="submit"]');

    try {
        submitButton.disabled = true;
        submitButton.textContent = "Logging in...";

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("User logged in:", user);

        // Fetch additional user data from Firestore
        const userDoc = await getDoc(doc(db, "volunteers", user.uid)); // Adjusted collection name
        if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("User data from Firestore:", userData);

            // Store user details in local storage to pass to the dashboard
            localStorage.setItem('userName', `${userData.firstName} ${userData.lastName}`);
            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('userCity', userData.city);
            localStorage.setItem('userPhone', userData.phone);
            localStorage.setItem('userJoinedDate', new Date(userData.joinedDate.seconds * 1000).toLocaleDateString());
        } else {
            console.log("No user data found in Firestore");
        }

        messageElement.textContent = "Login successful! Redirecting...";
        messageElement.style.color = "green";

        setTimeout(() => {
            console.log("Redirecting to Volunteer Dashboard...");
            window.location.href = "Vd.html"; // Redirect to Volunteer Admin page
        }, 2000);
    } catch (error) {
        console.error("Error during login:", error);
        messageElement.textContent = "Error during login: " + error.message;
        messageElement.style.color = "red";
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Login";
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    togglePassword.addEventListener('click', function () {
        // Toggle the password visibility
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            togglePassword.classList.remove('fa-eye');
            togglePassword.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            togglePassword.classList.remove('fa-eye-slash');
            togglePassword.classList.add('fa-eye');
        }
    });
});
