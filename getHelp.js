import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore, collection, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBQc8nvdP9XM2EEgH3eUS10JECKVR9Bl8M",
    authDomain: "safetyapp-cf8d9.firebaseapp.com",
    projectId: "safetyapp-cf8d9",
    storageBucket: "safetyapp-cf8d9.appspot.com",
    messagingSenderId: "868230322213",
    appId: "1:868230322213:web:b0eca4dc7d5d8a200dc7cc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// API Key for fetching states and cities
const apiKey = 'WDEwVHcyUXB3NXRUbTA4bGx0dE1ORlM3WnI2cEhGcFlpRTQ5NVp5cw==';

// Function to fetch states
async function fetchStates() {
    try {
        const response = await fetch('https://api.countrystatecity.in/v1/countries/IN/states', {
            headers: { 'X-CSCAPI-KEY': apiKey }
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        const stateSelect = document.getElementById('stateSelect');

        if (Array.isArray(data)) {
            data.forEach(state => {
                const option = document.createElement('option');
                option.value = state.iso2;
                option.textContent = state.name;
                stateSelect.appendChild(option);
            });
        } else {
            console.error('Unexpected data format:', data);
        }
    } catch (error) {
        console.error('Error fetching states:', error);
    }
}

// Function to fetch cities
async function fetchCities(stateCode) {
    try {
        const response = await fetch(`https://api.countrystatecity.in/v1/countries/IN/states/${stateCode}/cities`, {
            headers: { 'X-CSCAPI-KEY': apiKey }
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        const citySelect = document.getElementById('citySelect');
        citySelect.innerHTML = ''; // Clear previous options

        if (Array.isArray(data)) {
            data.forEach(city => {
                const option = document.createElement('option');
                option.value = city.name;
                option.textContent = city.name;
                citySelect.appendChild(option);
            });
        } else {
            console.error('Unexpected data format:', data);
        }
    } catch (error) {
        console.error('Error fetching cities:', error);
    }
}

// Event listener for state selection
document.getElementById('stateSelect').addEventListener('change', (e) => {
    const stateCode = e.target.value;
    if (stateCode) fetchCities(stateCode);
});

// Populate the state dropdown on page load
fetchStates();

// Function to initialize the map and place a marker using Leaflet
function displayMap(lat, lng) {
    const map = L.map('map').setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.marker([lat, lng]).addTo(map)
        .bindPopup('You are here')
        .openPopup();
}

// Function to handle geolocation success
function showPosition(position) {
    const { latitude, longitude } = position.coords;

    document.getElementById('status').textContent = `Latitude: ${latitude}, Longitude: ${longitude}`;

    window.currentPosition = { latitude, longitude };
    displayMap(latitude, longitude);
}

// Function to handle geolocation errors
function showError(error) {
    const status = document.getElementById('status');

    switch (error.code) {
        case error.PERMISSION_DENIED:
            status.textContent = 'User denied the request for Geolocation.';
            break;
        case error.POSITION_UNAVAILABLE:
            status.textContent = 'Location information is unavailable.';
            break;
        case error.TIMEOUT:
            status.textContent = 'The request to get user location timed out.';
            break;
        case error.UNKNOWN_ERROR:
            status.textContent = 'An unknown error occurred.';
            break;
    }
}

// Function to get the user's location
function getLocation() {
    if (navigator.geolocation) {
        document.getElementById('status').textContent = 'Locating...';
        navigator.geolocation.getCurrentPosition(showPosition, showError, { enableHighAccuracy: true });
    } else {
        document.getElementById('status').textContent = 'Geolocation is not supported by this browser.';
    }
}

// Event listener for "Get My Location" button
document.getElementById('findLocationBtn').addEventListener('click', getLocation);

// Contact validation function
function validateContact(contact) {
    return /^\d{10}$/.test(contact);
}

// Handle form submission
document.getElementById('submitRequestBtn').addEventListener('click', async () => {
    const description = document.getElementById('description').value;
    const city = document.getElementById('citySelect').value;
    const state = document.getElementById('stateSelect').value;
    const contact = document.getElementById('contact').value;
    const gender = document.getElementById('gender').value;
    const status = 'pending';
    const timestamp = Timestamp.fromDate(new Date());

    // Check if the user's current position is available
    const position = window.currentPosition;
    if (!position) {
        showAlert('Unable to get current location. Please try again.', 'error');
        return;
    }

    const { latitude: lat, longitude: lng } = position;
    const user = auth.currentUser;
    const userId = user ? user.uid : 'anonymous';

    if (!validateContact(contact)) {
        document.getElementById('contactError').style.display = 'block';
        return;
    } else {
        document.getElementById('contactError').style.display = 'none';
    }

    try {
        await addDoc(collection(db, 'helpRequests'), {
            description,
            city,
            state,
            gender,
            contact,
            status,
            timestamp,
            userId,
            location: { lat, lng }
        });

        showAlert('Help request submitted successfully!', 'success');
        document.getElementById('submitRequestBtn').disabled = true;
        setTimeout(() => { window.location.href = 'index.html'; }, 2000); // Redirect after 2 seconds
    } catch (e) {
        console.error('Error adding document: ', e);
        showAlert('Failed to submit request. Please try again.', 'error');
    }
});

// Function to show alert messages
function showAlert(message, type) {
    const alertBox = document.createElement('div');
    alertBox.className = `alert ${type}`;
    alertBox.textContent = message;
    document.body.appendChild(alertBox);
    setTimeout(() => { alertBox.remove(); }, 5000); // Remove alert after 5 seconds
}

// Event listener for "Back To Home" button
document.getElementById('backToHomeBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
});
