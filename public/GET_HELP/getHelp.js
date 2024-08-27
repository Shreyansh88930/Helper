import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, collection, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDr-UzzwWiGA7jt_IMQWIjX-2fioeT_Kn4",
    authDomain: "safetyapp-cf8d9.firebaseapp.com",
    projectId: "safetyapp-cf8d9",
    storageBucket: "safetyapp-cf8d9.appspot.com",
    messagingSenderId: "868230322213",
    appId: "1:868230322213:web:b0eca4dc7d5d8a200dc7cc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

document.getElementById('contact').addEventListener('input', (e) => {
    const contactInput = e.target;
    const contactError = document.getElementById('contactError');
    const value = contactInput.value;

    // Remove non-digit characters
    const digitsOnly = value.replace(/\D/g, '');

    // Update input value with digits only
    contactInput.value = digitsOnly;

    // Check if the input is exactly 10 digits
    if (digitsOnly.length !== 10) {
        contactError.style.display = 'block'; // Show error message
        contactError.textContent = 'Contact number must be exactly 10 digits.';
    } else {
        contactError.style.display = 'none'; // Hide error message
    }
});

document.getElementById('getHelpForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form values
    const description = document.getElementById('description').value;
    const city = document.getElementById('location').value;
    const contact = document.getElementById('contact').value; // Get contact info
    const status = 'pending'; // Default status
    const timestamp = Timestamp.fromDate(new Date()); // Current timestamp

    // Get current user
    const user = auth.currentUser;
    const userId = user ? user.uid : 'anonymous'; // Use 'anonymous' if not logged in

    // Check if the contact number is exactly 12 digits
    if (contact.length !== 10) {
        alert('Contact number must be exactly 12 digits.');
        return;
    }

    try {
        // Add a new document with a generated ID
        await addDoc(collection(db, 'helpRequests'), {
            description,
            city, // Store city name
            contact, // Add contact information
            status,
            timestamp,
            userId
        });
        alert('Help request submitted successfully!');
    } catch (e) {
        console.error('Error adding document: ', e);
        alert('Failed to submit request. Please try again.');
    }
});
