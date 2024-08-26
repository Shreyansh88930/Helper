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

document.getElementById('getHelpForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form values
    const description = document.getElementById('description').value;
    const city = document.getElementById('location').value;
    const status = 'pending'; // Default status
    const timestamp = Timestamp.fromDate(new Date()); // Current timestamp

    // Use a hardcoded user ID for demonstration; replace with actual user ID from auth
    const userId = 'user123';

    try {
        // Add a new document with a generated ID
        await addDoc(collection(db, 'helpRequests'), {
            description,
            city, // Store city name
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
