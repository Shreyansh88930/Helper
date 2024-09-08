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

    const userDocRef = doc(db, 'users', user.uid);

    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const userData = docSnap.data();
            userNameElement.textContent = `${userData.firstName} ${userData.lastName}`;
            userEmailElement.textContent = userData.email;
            userCityElement.textContent = userData.city;
            return userData; // Return user data for use in displaying help requests
        } else {
            console.log('No such document!');
            userNameElement.textContent = 'User data not found';
            userEmailElement.textContent = 'User data not found';
            userCityElement.textContent = 'User data not found';
            return null;
        }
    } catch (error) {
        console.error('Error fetching user details: ', error);
        userNameElement.textContent = 'Error fetching details';
        userEmailElement.textContent = 'Error fetching details';
        userCityElement.textContent = 'Error fetching details';
        return null;
    }
}

// Initialize Leaflet map and add live location tracking
let map, userMarker, routeControl;

function initializeMap() {
    map = L.map('map').setView([0, 0], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    userMarker = L.marker([0, 0]).addTo(map);
}

function updateMapAndRoute(volunteerLat, volunteerLng, destinationLat, destinationLng) {
    if (map && userMarker) {
        map.setView([volunteerLat, volunteerLng], 13);
        userMarker.setLatLng([volunteerLat, volunteerLng]);

        if (routeControl) {
            map.removeControl(routeControl);
        }

        routeControl = L.Routing.control({
            waypoints: [
                L.latLng(volunteerLat, volunteerLng),
                L.latLng(destinationLat, destinationLng)
            ],
            routeWhileDragging: true
        }).addTo(map);
    }
}

async function updateUserLocation(position) {
    try {
        const { latitude, longitude } = position.coords;

        // Update the user's location on the map
        userMarker.setLatLng([latitude, longitude]);
        map.setView([latitude, longitude], 13);

        // Fetch the nearest request and update route
        const userCity = document.getElementById('userCity').textContent;
        const nearestRequest = await fetchNearestRequest(userCity, latitude, longitude);

        if (nearestRequest) {
            updateMapAndRoute(latitude, longitude, nearestRequest.location.lat, nearestRequest.location.lng);
        }
    } catch (error) {
        console.error('Error updating user location:', error);
    }
}

async function fetchNearestRequest(userCity, userLat, userLng) {
    if (!userCity) {
        console.log('User city is not available.');
        return null;
    }

    const q = query(collection(db, 'helpRequests'), where('city', '==', userCity), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    requests.forEach(request => {
        request.distance = haversineDistance(userLat, userLng, request.location.lat, request.location.lng);
    });

    requests.sort((a, b) => a.distance - b.distance);

    return requests.length > 0 ? requests[0] : null;
}

// Function to display pending help requests and sort by distance with real-time updates
async function displayPendingRequests(userCity) {
    if (!userCity) {
        console.log('User city is not available.');
        return;
    }

    const q = query(collection(db, 'helpRequests'), where('city', '==', userCity), where('status', '==', 'pending'));
    onSnapshot(q, async (snapshot) => {
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const location = await getCurrentLocation();

        requests.forEach(request => {
            request.distance = haversineDistance(location.latitude, location.longitude, request.location.lat, request.location.lng);
        });

        requests.sort((a, b) => a.distance - b.distance);

        const requestsTable = document.getElementById('requestsTable');
        requestsTable.innerHTML = '';

        requests.forEach(request => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${request.id || 'N/A'}</td>
                <td>${request.city || 'N/A'}</td>
                <td>${request.description || 'N/A'}</td>
                <td>${request.contact || 'N/A'}</td>
                <td>${new Date(request.timestamp.seconds * 1000).toLocaleString() || 'N/A'}</td>
                <td id="status-${request.id}">${request.status || 'N/A'}</td>
                <td>
                    <button class="btn btn-success mark-completed-btn" data-id="${request.id}">Mark as Completed</button>
                    <a href="#" class="btn btn-primary navigate-btn" data-lat="${request.location.lat}" data-lng="${request.location.lng}">Navigate to Location</a>
                </td>
            `;
            requestsTable.appendChild(row);
        });

        document.getElementById('pendingRequests').textContent = `Pending Requests: ${requests.length}`;

        const nearestRequestDistance = requests.length > 0 ? `${requests[0].distance.toFixed(2)} km` : 'N/A';
        document.getElementById('nearestRequest').textContent = `Nearest Request Distance: ${nearestRequestDistance}`;

        addEventListeners(); // Add event listeners to newly added buttons
    });
}

// Function to mark a request as completed
async function markAsCompleted(requestId) {
    try {
        const requestRef = doc(db, 'helpRequests', requestId);
        await updateDoc(requestRef, {
            status: 'Completed'
        });
        console.log(`Request ${requestId} marked as completed.`);

        document.getElementById(`status-${requestId}`).textContent = 'Completed';

        const user = auth.currentUser;
        const userData = await displayUserDetails(user);
        if (userData) {
            await displayPendingRequests(userData.city);
        }
    } catch (error) {
        console.error('Error marking request as completed:', error);
    }
}

// Add event listeners to buttons for marking requests as completed and navigation
function addEventListeners() {
    document.querySelectorAll('.mark-completed-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const requestId = event.target.getAttribute('data-id');
            markAsCompleted(requestId);
        });
    });

    document.querySelectorAll('.navigate-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const lat = parseFloat(event.target.getAttribute('data-lat'));
            const lng = parseFloat(event.target.getAttribute('data-lng'));

            updateMapAndRoute(userMarker.getLatLng().lat, userMarker.getLatLng().lng, lat, lng);
        });
    });
}

// Logout function
async function logout() {
    try {
        await signOut(auth);
        console.log('User logged out.');
        window.location.href = 'home.html'; // Redirect to home page
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

// Check user authentication status and set up map and real-time updates
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log('User logged in:', user.uid);

        initializeMap();
        const userData = await displayUserDetails(user);
        if (userData) {
            displayPendingRequests(userData.city);

            // Start watching user's location
            navigator.geolocation.watchPosition(updateUserLocation, (error) => {
                console.error('Error watching user location:', error);
            }, {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 5000
            });
        }
    } else {
        console.log('No user logged in.');
        window.location.href = 'login.html'; // Redirect to login page
    }
});
