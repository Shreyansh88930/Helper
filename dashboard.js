import { auth, db } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import { getDoc, doc, onSnapshot, collection, query, where, updateDoc } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { signOut } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';

// Haversine distance function
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

// Function to get the volunteer's current location
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 5000
                }
            );
        } else {
            reject(new Error('Geolocation is not supported by this browser.'));
        }
    });
}

// Function to display the user's details on the dashboard
async function displayUserDetails(user) {
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');
    const userCityElement = document.getElementById('userCity');

    if (!user) {
        console.log('No user is logged in.');
        return;
    }

    const userDocRef = doc(db, 'users', user.uid);

    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const userData = docSnap.data();
            if (userData.firstName && userData.lastName && userData.email && userData.city) {
                userNameElement.textContent = `${userData.firstName} ${userData.lastName}`;
                userEmailElement.textContent = userData.email;
                userCityElement.textContent = userData.city;
                return userData;
            } else {
                userNameElement.textContent = 'User data is incomplete';
                userEmailElement.textContent = 'User data is incomplete';
                userCityElement.textContent = 'User data is incomplete';
            }
        } else {
            userNameElement.textContent = 'User data not found';
            userEmailElement.textContent = 'User data not found';
            userCityElement.textContent = 'User data not found';
        }
    } catch (error) {
        userNameElement.textContent = 'Error fetching details';
        userEmailElement.textContent = 'Error fetching details';
        userCityElement.textContent = 'Error fetching details';
    }
    return null;
}

// Initialize Leaflet map and add live location tracking
let map, userMarker, routeControl;

// Initialize WebSocket
const ws = new WebSocket('ws://localhost:8080'); // Replace with your WebSocket server URL

ws.onopen = () => {
    console.log('WebSocket connection established');
};

ws.onmessage = (event) => {
    // Handle incoming WebSocket messages
    const data = JSON.parse(event.data);
    if (data.type === 'update_location') {
        // Update map with received location data
        console.log('Received location update:', data);
        if (userMarker) {
            userMarker.setLatLng([data.latitude, data.longitude]);
            map.setView([data.latitude, data.longitude], 13);
        }
    }
};

// Function to initialize the map
function initializeMap() {
    map = L.map('map').setView([0, 0], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    if (userMarker) {
        userMarker.remove();
    }
    userMarker = L.marker([0, 0]).addTo(map);
    routeControl = L.Routing.control({
        waypoints: [],
        routeWhileDragging: true,
        geocoder: L.Control.Geocoder.nominatim(),
    }).addTo(map);

    // Optionally, fetch and display the current location of the user
    getCurrentLocation().then(position => {
        userMarker.setLatLng([position.latitude, position.longitude]);
        map.setView([position.latitude, position.longitude], 13);

        // Send initial location to WebSocket server
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'update_location',
                latitude: position.latitude,
                longitude: position.longitude
            }));
        }
    }).catch(error => {
        console.error('Error getting current location:', error);
    });
}

// Function to display help requests on the dashboard
async function displayHelpRequests() {
    const requestsTable = document.getElementById('requestsTable');
    requestsTable.innerHTML = ''; // Clear existing rows

    const q = query(collection(db, 'helpRequests'), where('status', '==', 'pending'));
    onSnapshot(q, async (querySnapshot) => {
        requestsTable.innerHTML = ''; // Clear existing rows

        const userLocation = await getCurrentLocation();
        let nearestDistance = Infinity;
        let nearestRequest = null;

        querySnapshot.forEach((doc) => {
            const request = doc.data();
            const requestId = doc.id;
            const requestLocation = {
                latitude: request.location.lat,
                longitude: request.location.lng
            };

            const distance = haversineDistance(userLocation.latitude, userLocation.longitude, requestLocation.latitude, requestLocation.longitude);

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestRequest = {
                    id: requestId,
                    ...request
                };
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${requestId}</td>
                <td>${request.city}</td>
                <td>${request.description}</td>
                <td>${request.contact}</td>
                <td>${request.timestamp.toDate().toLocaleString()}</td>
                <td>${request.status}</td>
                <td>
                    <button class="btn btn-success" onclick="markRequestCompleted('${requestId}')">Mark Completed</button>
                    <button class="btn btn-info" onclick="navigateToRequest(${requestLocation.latitude}, ${requestLocation.longitude})">Navigate</button>
                </td>
            `;
            requestsTable.appendChild(row);
        });

        if (nearestRequest) {
            document.getElementById('nearestRequest').textContent = `Nearest Request: ${nearestRequest.city}, Distance: ${nearestDistance.toFixed(2)} km`;
            routeControl.setWaypoints([
                L.latLng(userLocation.latitude, userLocation.longitude),
                L.latLng(nearestRequest.location.lat, nearestRequest.location.lng)
            ]);
        }
    });
}

// Function to mark a help request as completed
async function markRequestCompleted(requestId) {
    const requestDocRef = doc(db, 'helpRequests', requestId);
    try {
        await updateDoc(requestDocRef, { status: 'completed' });
        console.log('Request marked as completed');

        // Notify WebSocket server about the update if needed
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'request_update',
                requestId: requestId,
                status: 'completed'
            }));
        }
    } catch (error) {
        console.error('Error marking request as completed: ', error);
    }
}

// Function to navigate to a help request
function navigateToRequest(lat, lon) {
    map.setView([lat, lon], 13);
    routeControl.setWaypoints([
        L.latLng(userMarker.getLatLng().lat, userMarker.getLatLng().lng),
        L.latLng(lat, lon)
    ]);
}

// Function to set up event listeners
function addEventListeners() {
    document.getElementById('logoutLink').addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = 'login.html'; // Redirect to login page
        }).catch((error) => {
            console.error('Sign out error: ', error);
        });
    });
}

// Function to initialize the dashboard
function initializeDashboard() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await displayUserDetails(user);
            await displayHelpRequests();
            initializeMap();
            addEventListeners();
        } else {
            window.location.href = 'login.html'; // Redirect to login if not logged in
        }
    });
}

// Initialize the dashboard on page load
document.addEventListener('DOMContentLoaded', initializeDashboard);
