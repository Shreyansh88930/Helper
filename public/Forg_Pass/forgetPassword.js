import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Handle the form submission
document.getElementById("forgotPasswordForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const messageElement = document.getElementById("message");

    sendPasswordResetEmail(auth, email)
        .then(() => {
            messageElement.textContent = "Reset link sent! Check your email.";
            messageElement.style.color = "green";
        })
        .catch((error) => {
            messageElement.textContent = "Error: " + error.message;
            messageElement.style.color = "red";
        });
});
