import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import { getDoc, doc, getDocs, collection, query, where, updateDoc } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

// Initialize EmailJS
(function() {
    emailjs.init("fD-o5PaC1ewfFYIGL"); // Your EmailJS user ID
})();

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
            console.log('User Details:', userData); // Debug logging
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

// Function to display pending help requests and sort by distance
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

        // Get current location
        const location = await getCurrentLocation();
        console.log('Current Location:', location); // Debug logging

        // Calculate distance for each request and sort by distance
        requests.forEach(request => {
            request.distance = haversineDistance(
                location.latitude,
                location.longitude,
                request.location.lat,
                request.location.lng
            );

            // Check and log timestamp data
            if (request.timestamp) {
                console.log('Timestamp Data:', request.timestamp); // Debug logging
            } else {
                console.error('Timestamp is missing for request ID:', request.id);
            }
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
                <td>${request.timestamp ? new Date(request.timestamp.seconds * 1000).toLocaleString() : 'N/A'}</td>
                <td id="status-${request.id}">${request.status || 'N/A'}</td>
                <td>
                    <button class="btn btn-success mark-completed-btn" data-id="${request.id}">Mark as Completed</button>
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${request.location.lat},${request.location.lng}" target="_blank" class="btn btn-primary">Navigate to Location</a>
                </td>
            `;
            requestsTable.appendChild(row);
        });

        document.getElementById('pendingRequests').textContent = `Pending Requests: ${requests.length}`;

        // Display the distance of the nearest request
        const nearestRequestDistance = requests.length > 0 ? `${requests[0].distance.toFixed(2)} km` : 'N/A';
        document.getElementById('nearestRequest').textContent = `Nearest Request Distance: ${nearestRequestDistance}`;

        addEventListeners(); // Add event listeners to newly added buttons
    } catch (error) {
        console.error('Error fetching help requests:', error);
    }
}

// Function to mark a request as completed and send an email
async function markAsCompleted(requestId) {
    try {
        const requestRef = doc(db, 'helpRequests', requestId);
        const requestSnap = await getDoc(requestRef);
        
        if (!requestSnap.exists()) {
            console.log('Request not found.');
            return;
        }

        const requestData = requestSnap.data();
        await updateDoc(requestRef, {
            status: 'Completed'
        });
        console.log(`Request ${requestId} marked as completed.`);

        // Send email
        const emailParams = {
            to_email: requestData.email, // Assuming the contact field contains the email
            subject: 'Help Request Completed',
            message: `Your help request with ID ${requestId} has been marked as completed. Thank you for using Safety Initiative!`
        };

        emailjs.send('service_aatvjah', 'template_e7j0df5', emailParams)
            .then(response => {
                console.log('Email sent successfully:', response);
            }, error => {
                console.error('Error sending email:', error);
            });

        // Update the status in the UI
        document.getElementById(`status-${requestId}`).textContent = 'Completed';

        const user = auth.currentUser; // Refresh user details to get city
        const userData = await displayUserDetails(user); // Refresh user details
        if (userData) {
            await displayPendingRequests(userData.city); // Refresh the requests list
        }
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
        const userData = await displayUserDetails(user); // Ensure user details are displayed
        if (userData) {
            await displayPendingRequests(userData.city); // Display pending requests
        }
    } else {
        window.location.href = 'login.html'; // Redirect to login page if not authenticated
    }
});

// Function to handle logout
function handleLogout() {
    signOut(auth).then(() => {
        console.log('User signed out.');
        window.location.href = 'index.html'; // Redirect to home page
    }).catch((error) => {
        console.error('Error signing out:', error);
    });
}

document.getElementById('logoutLink').addEventListener('click', handleLogout);
