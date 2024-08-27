import { auth, db } from "../firebase.js"; // Importing auth and db from your firebase.js
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Handle the form submission
document.getElementById("forgotPasswordForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const securityQuestion = document.getElementById("securityQuestion").value;
    const securityAnswer = document.getElementById("securityAnswer").value;
    const messageElement = document.getElementById("message");

    try {
        // Retrieve the user document from Firestore
        const userDocRef = doc(db, "users", email);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            messageElement.textContent = "Error: Email not found.";
            messageElement.style.color = "red";
            return;
        }

        const userData = userDoc.data();

        // Check if the security question and answer match
        if (
            userData.securityQuestion === securityQuestion &&
            userData.securityAnswer === securityAnswer
        ) {
            // Redirect to the change password page
            window.location.href = "change-password.html";
        } else {
            messageElement.textContent = "Error: Security question or answer does not match.";
            messageElement.style.color = "red";
        }
    } catch (error) {
        console.error("Error checking security question and answer:", error);
        messageElement.textContent = "Error: " + error.message;
        messageElement.style.color = "red";
    }
});
