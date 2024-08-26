import { auth, db } from "../firebase.js";
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
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("User data from Firestore:", userData);
        } else {
            console.log("No user data found in Firestore");
        }

        messageElement.textContent = "Login successful! Redirecting...";
        messageElement.style.color = "green";

        setTimeout(() => {
            console.log("Redirecting to Volunteer Dashboard...");
            window.location.href = "../VOLUNTEER_DASH/index.html"; // Redirect to Volunteer Admin page
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
