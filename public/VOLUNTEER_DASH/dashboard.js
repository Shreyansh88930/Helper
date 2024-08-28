import { auth, db } from '../firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import { getDoc, doc, getDocs, collection, query, where, updateDoc } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

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
            return userData.city; // Return the user's city for use in displaying help requests
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

// Function to display pending help requests for the user's city
async function displayPendingRequests(userCity) {
    try {
        if (!userCity) {
            console.log('User city is not available.');
            return;
        }

        // Query to get help requests for the specific city
        const q = query(collection(db, 'helpRequests'), where('city', '==', userCity), where('status', '==', 'pending'));
        const requestsSnapshot = await getDocs(q);
        const requests = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
                    <a href="https://maps.mapmyindia.com/?ll=${request.latitude},${request.longitude}&dlat=${request.latitude}&dlng=${request.longitude}" target="_blank" class="btn btn-primary">Navigate to Location</a>
                </td>
            `;
            requestsTable.appendChild(row);
        });

        document.getElementById('pendingRequests').textContent = `Pending Requests: ${requests.length}`;

        addEventListeners(); // Add event listeners to newly added buttons
    } catch (error) {
        console.error('Error fetching help requests:', error);
    }
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

        const userCity = await displayUserDetails(auth.currentUser); // Refresh user details to get city
        await displayPendingRequests(userCity); // Refresh the requests list
    } catch (error) {
        console.error('Error marking request as completed:', error);
    }
}

// Add event listeners to buttons for marking requests as completed
function addEventListeners() {
    document.querySelectorAll('.mark-completed-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const requestId = event.target.getAttribute('data-id');
            markAsCompleted(requestId);
        });
    });
}

// Initialize Firebase Authentication state observer
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userCity = await displayUserDetails(user); // Ensure user details are displayed
        await displayPendingRequests(userCity); // Display pending requests
    } else {
        window.location.href = 'login.html'; // Redirect to login page if not authenticated
    }
});
