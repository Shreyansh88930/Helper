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
let map, userMarker;

function initializeMap() {
    map = L.map('map').setView([0, 0], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    userMarker = L.marker([0, 0]).addTo(map);
}

async function updateUserLocation(position) {
    try {
        const { latitude, longitude } = position.coords;
        if (map && userMarker) {
            map.setView([latitude, longitude], 13);
            userMarker.setLatLng([latitude, longitude]);
        }
    } catch (error) {
        console.error('Error updating user location:', error);
    }
}

// Function to display pending help requests and sort by distance with real-time updates
function displayPendingRequests(userCity) {
    if (!userCity) {
        console.log('User city is not available.');
        return;
    }

    // Real-time listener for help requests
    const q = query(collection(db, 'helpRequests'), where('city', '==', userCity), where('status', '==', 'pending'));
    onSnapshot(q, async (snapshot) => {
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Get current location
        const location = await getCurrentLocation();

        // Calculate distance for each request and sort by distance
        requests.forEach(request => {
            request.distance = haversineDistance(
                location.latitude,
                location.longitude,
                request.location.lat,
                request.location.lng
            );
        });

        requests.sort((a, b) => a.distance - b.distance);

        // Update requests table
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

        // Display the distance of the nearest request
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

        // Update the status in the UI
        document.getElementById(`status-${requestId}`).textContent = 'Completed';

        // Refresh the requests list
        const user = auth.currentUser; // Refresh user details to get city
        const userData = await displayUserDetails(user); // Refresh user details
        if (userData) {
            await displayPendingRequests(userData.city); // Refresh the requests list
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
        button.addEventListener('click', async (event) => {
            event.preventDefault(); // Prevent default link behavior
            const destinationLat = parseFloat(event.target.getAttribute('data-lat'));
            const destinationLng = parseFloat(event.target.getAttribute('data-lng'));

            try {
                // Get the current location of the volunteer
                const volunteerLocation = await getCurrentLocation();

                // Open Leaflet map with real-time coordinates
                map.setView([volunteerLocation.latitude, volunteerLocation.longitude], 13);

                // Add a marker for the current location
                L.marker([volunteerLocation.latitude, volunteerLocation.longitude], { icon: L.icon({ iconUrl: 'your-icon-url.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowUrl: 'your-shadow-url.png', shadowSize: [41, 41] }) }).addTo(map)
                    .bindPopup('You are here!')
                    .openPopup();

                // Add a marker for the destination
                L.marker([destinationLat, destinationLng]).addTo(map)
                    .bindPopup('Destination!')
                    .openPopup();

                // Draw a line between the current location and destination
                L.polyline([[volunteerLocation.latitude, volunteerLocation.longitude], [destinationLat, destinationLng]], { color: 'blue' }).addTo(map);
            } catch (error) {
                console.error('Error navigating to location:', error);
            }
        });
    });
}

// Handle sign-out
async function handleSignOut() {
    try {
        await signOut(auth);
        console.log('User signed out successfully.');
        window.location.href = 'index.html'; // Redirect to home page
    } catch (error) {
        console.error('Error signing out:', error);
    }
}

// Initialize everything
async function initializeDashboard() {
    initializeMap();

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userData = await displayUserDetails(user);
            if (userData) {
                await displayPendingRequests(userData.city);
            }
            navigator.geolocation.watchPosition(updateUserLocation, (error) => {
                console.error('Error watching user location:', error);
            }, {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 5000
            });

            // Handle sign-out button click
            document.getElementById('signOutBtn').addEventListener('click', handleSignOut);
        } else {
            window.location.href = 'index.html'; // Redirect to home page if not logged in
        }
    });
}

initializeDashboard();
