import { auth, db } from "../firebase.js"; // Ensure db is imported
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageElement = document.getElementById('message');
    const submitButton = document.querySelector('button[type="submit"]');

    try {
        // Disable the submit button to prevent multiple submissions
        submitButton.disabled = true;
        submitButton.textContent = "Logging in...";

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("User logged in:", user);

        // Fetch additional user data from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid)); // Assuming 'users' is your collection name
        if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("User data from Firestore:", userData);
            // Do something with the user data (e.g., store it locally, display it)
        } else {
            console.log("No user data found in Firestore");
        }

        messageElement.textContent = "Login successful! Redirecting...";
        messageElement.style.color = "green";

        setTimeout(() => {
            window.location.href = "index.html"; // Redirect to home or dashboard page
        }, 2000);
    } catch (error) {
        console.error("Error during login:", error);
        messageElement.textContent = "Error during login: " + error.message;
        messageElement.style.color = "red";
    } finally {
        // Re-enable the submit button in case of error
        submitButton.disabled = false;
        submitButton.textContent = "Login";
    }
});
