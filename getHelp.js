import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore, collection, addDoc, Timestamp, doc, updateDoc, query, where, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

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

// WebSocket setup
let ws = new WebSocket('ws://localhost:8080'); // Replace with your WebSocket server URL

ws.onopen = () => {
    console.log('WebSocket connection established');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'update_location') {
        // Handle incoming location updates
        console.log('Received location update:', data);
    }
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    showAlert('WebSocket error. Please try again later.', 'error');
};

// Function to fetch states
async function fetchStates() {
    try {
        const response = await fetch('https://api.countrystatecity.in/v1/countries/IN/states', {
            headers: { 'X-CSCAPI-KEY': apiKey }
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        const stateSelect = document.getElementById('stateSelect');
        stateSelect.innerHTML = ''; // Clear previous options

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
    if (stateCode) {
        console.log(`Fetching cities for state code: ${stateCode}`);
        fetchCities(stateCode);
    } else {
        document.getElementById('citySelect').innerHTML = ''; // Clear cities if no state is selected
    }
});

// Populate the state dropdown on page load
fetchStates();

// Function to initialize the map and place a marker using Leaflet
let mapInitialized = false;
let map;

function displayMap(lat, lng) {
    const mapContainer = document.getElementById('map');

    // Initialize the map only if it's not already initialized
    if (!mapInitialized) {
        map = L.map('map').setView([lat, lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        mapInitialized = true;
    } else {
        map.setView([lat, lng], 15); // Update the map view if already initialized
    }

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

    // Send real-time location via WebSocket
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'update_location',
            latitude: latitude,
            longitude: longitude
        }));
    }
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

// Function to start watching the user's location
let watchId;
function startWatchingPosition() {
    if (navigator.geolocation) {
        document.getElementById('status').textContent = 'Locating...';
        watchId = navigator.geolocation.watchPosition(updatePosition, showError, { enableHighAccuracy: true });
    } else {
        document.getElementById('status').textContent = 'Geolocation is not supported by this browser.';
    }
}

// Function to update the position and Firestore
async function updatePosition(position) {
    const { latitude, longitude } = position.coords;

    document.getElementById('status').textContent = `Latitude: ${latitude}, Longitude: ${longitude}`;

    window.currentPosition = { latitude, longitude };
    displayMap(latitude, longitude);

    // Update Firestore with new position
    const user = auth.currentUser;
    const userId = user ? user.uid : 'anonymous';

    try {
        const helpRequestQuery = query(collection(db, 'helpRequests'), where('userId', '==', userId));
        const querySnapshot = await getDocs(helpRequestQuery);

        querySnapshot.forEach(async (doc) => {
            const helpRequestRef = doc.ref;
            await updateDoc(helpRequestRef, {
                location: { lat: latitude, lng: longitude }
            });
        });

        // Send real-time location via WebSocket
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'update_location',
                latitude: latitude,
                longitude: longitude
            }));
        }
    } catch (e) {
        console.error('Error updating document: ', e);
    }
}

// Event listener for "Get My Location" button
document.getElementById('findLocationBtn').addEventListener('click', startWatchingPosition);

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
    const { latitude, longitude } = window.currentPosition || {};

    if (!description || !city || !state || !contact || !gender) {
        showAlert('All fields are required.', 'error');
        return;
    }

    if (!validateContact(contact)) {
        showAlert('Contact number must be 10 digits.', 'error');
        return;
    }

    if (!latitude || !longitude) {
        showAlert('Location is required. Please click "Get My Location" first.', 'error');
        return;
    }

    try {
        const newRequestId = doc(collection(db, 'helpRequests')).id; // Generate unique ID for the new request
        const docRef = doc(db, 'helpRequests', newRequestId);
        await setDoc(docRef, {
            contact,
            gender,
            description,
            city,
            state,
            location: { lat: latitude, lng: longitude },
            createdAt: Timestamp.now(),
            userId: auth.currentUser ? auth.currentUser.uid : 'anonymous',
            status: 'pending',
            volunteerAssigned: null
        });

        showAlert('Help request submitted successfully.', 'success');
    } catch (error) {
        console.error('Error adding document: ', error);
        showAlert('Error submitting help request. Please try again.', 'error');
    }
});

// Function to show alert messages
function showAlert(message, type) {
    const alertBox = document.getElementById('alert');
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = 'block';

    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 5000);
}
