import { auth, db } from "../firebase.js"; // Update path if necessary
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const address = document.getElementById('address').value;
    const address2 = document.getElementById('address2').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const zip = document.getElementById('zip').value;
    const messageElement = document.getElementById('message');
    const submitButton = document.querySelector('button[type="submit"]');

    try {
        // Disable the submit button to prevent multiple submissions
        submitButton.disabled = true;
        submitButton.textContent = "Registering...";

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("User registered:", user);

        await setDoc(doc(db, "users", user.uid), {
            firstName,
            lastName,
            email,
            address,
            address2,
            city,
            state,
            zip,
            createdAt: new Date()
        });

        console.log("User details saved to Firestore.");

        messageElement.textContent = "Registration successful! Redirecting to login...";
        messageElement.style.color = "green";

        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);
    } catch (error) {
        console.error("Error during registration:", error);
        messageElement.textContent = "Error during registration: " + error.message;
        messageElement.style.color = "red";
    } finally {
        // Re-enable the submit button in case of error
        submitButton.disabled = false;
        submitButton.textContent = "Register";
    }
});
