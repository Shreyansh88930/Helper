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

// Handle contact number input
document.getElementById('contact').addEventListener('input', (e) => {
    const contactInput = e.target;
    const contactError = document.getElementById('contactError');
    const value = contactInput.value;

    const digitsOnly = value.replace(/\D/g, '');
    contactInput.value = digitsOnly;

    if (digitsOnly.length !== 10) {
        contactError.style.display = 'block';
        contactError.textContent = 'Contact number must be exactly 10 digits.';
    } else {
        contactError.style.display = 'none';
    }
});

// Handle form submission
document.getElementById('getHelpForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const description = document.getElementById('description').value;
    const city = document.getElementById('location').value;
    const contact = document.getElementById('contact').value;
    const status = 'pending';
    const timestamp = Timestamp.fromDate(new Date());

    // Get current position
    const position = window.currentPosition;
    if (!position) {
        alert('Unable to get current location. Please try again.');
        return;
    }
    const { latitude: lat, longitude: lng } = position;

    const user = auth.currentUser;
    const userId = user ? user.uid : 'anonymous';

    if (contact.length !== 10) {
        alert('Contact number must be exactly 10 digits.');
        return;
    }

    try {
        await addDoc(collection(db, 'helpRequests'), {
            description,
            city,
            contact,
            status,
            timestamp,
            userId,
            location: { lat, lng } // Store the location coordinates
        });

        // Disable the submit button
        const submitButton = document.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        // Show success popup and redirect after OK is clicked
        if (confirm('Help request submitted successfully! Click OK to return to the home page.')) {
            window.location.href = 'index.html';
        }

    } catch (e) {
        console.error('Error adding document: ', e);
        alert('Failed to submit request. Please try again.');
    }
});

// MapmyIndia location finder code
document.getElementById('findLocationBtn').addEventListener('click', function() {
    if (navigator.geolocation) {
        document.getElementById('status').textContent = 'Locating...';

        // Request high accuracy location
        navigator.geolocation.getCurrentPosition(showPosition, showError, { enableHighAccuracy: true });
    } else {
        document.getElementById('status').textContent = 'Geolocation is not supported by this browser.';
    }
});

function showPosition(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    document.getElementById('status').textContent = `Latitude: ${lat}, Longitude: ${lng}`;

    // Store the current position globally for use in form submission
    window.currentPosition = { latitude: lat, longitude: lng };

    var map = new MapmyIndia.Map('map', {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
        hybrid: true
    });

    new MapmyIndia.Marker({
        position: [lat, lng],
        map: map,
        title: 'You are here'
    });
}

function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            document.getElementById('status').textContent = 'User denied the request for Geolocation.';
            break;
        case error.POSITION_UNAVAILABLE:
            document.getElementById('status').textContent = 'Location information is unavailable.';
            break;
        case error.TIMEOUT:
            document.getElementById('status').textContent = 'The request to get user location timed out.';
            break;
        case error.UNKNOWN_ERROR:
            document.getElementById('status').textContent = 'An unknown error occurred.';
            break;
    }
}

// Handle "Back To Home" button click
document.getElementById('backToHomeBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
});
