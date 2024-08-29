import { auth, db } from "./firebase.js"; // Update path if necessary
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const contact = document.getElementById('contact').value;
    const gender = document.getElementById('gender').value; // Added gender field
    const address = document.getElementById('address').value;
    const address2 = document.getElementById('address2').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const zip = document.getElementById('zip').value;
    const securityQuestion = document.getElementById('securityQuestion').value;
    const securityAnswer = document.getElementById('securityAnswer').value;
    const messageElement = document.getElementById('message');
    const submitButton = document.querySelector('button[type="submit"]');

    try {
        // Disable the submit button to prevent multiple submissions
        submitButton.disabled = true;
        submitButton.textContent = "Registering...";

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("User registered:", user);

        // Save user details to Firestore
        await setDoc(doc(db, "users", user.uid), {
            firstName,
            lastName,
            email,
            contact,   // Save contact field
            gender,    // Save gender field
            address,
            address2,
            city,
            state,
            zip,
            securityQuestion,
            securityAnswer,
            createdAt: new Date()
        });

        console.log("User details saved to Firestore.");

        messageElement.textContent = "Registration successful! Redirecting to login...";
        messageElement.style.color = "green";

        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);

    } catch (error) {
        console.error("Error registering user:", error);
        messageElement.textContent = "Error: " + error.message;
        messageElement.style.color = "red";
    } finally {
        // Enable the submit button and reset text
        submitButton.disabled = false;
        submitButton.textContent = "Register";
    }
});

// Contact field validation
document.getElementById('contact').addEventListener('input', (e) => {
    const contactInput = e.target;
    const contactError = document.getElementById('contactError');
    let value = contactInput.value;

    // Remove non-digit characters and limit input to 10 digits
    value = value.replace(/\D/g, '').slice(0, 10);

    // Update input value with digits only
    contactInput.value = value;

    // Check if the input is exactly 10 digits
    if (value.length < 10) {
        contactError.style.display = 'block'; // Show error message
        contactError.textContent = 'Contact number must be exactly 10 digits.';
    } else {
        contactError.style.display = 'none'; // Hide error message
    }
});
