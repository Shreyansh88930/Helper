import { db } from "../firebase.js"; // Import the Firebase Firestore instance
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function () {
    const userId = sessionStorage.getItem('loggedInUser');

    if (!userId) {
        window.location.href = "../Login/login.html";  // Redirect to login page if not logged in
    } else {
        // If logged in, fetch and display volunteer data in real-time
        fetchVolunteerData(userId);
    }
});

function fetchVolunteerData(userId) {
    const userDocRef = doc(db, "users", userId);

    // Use onSnapshot to listen for real-time updates
    onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
            const userData = doc.data();
            
            // Update the dashboard with user's name
            document.getElementById('userName').textContent = userData.name || "Volunteer";
            
            // Update profile section with user data
            document.querySelector('.profile p:nth-child(2)').textContent = `Email: ${userData.email}`;
            
            // You can update other parts of the dashboard similarly
        } else {
            console.error("No such document!");
        }
    }, (error) => {
        console.error("Error fetching volunteer data:", error);
    });
}

// Function to initialize the Google Map
function initMap() {
    const mapOptions = {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 8
    };
    const map = new google.maps.Map(document.getElementById('map'), mapOptions);

    // Add any additional map configuration here
}

// Check if the user is logged in and fetch their data
document.addEventListener('DOMContentLoaded', function() {
    const userIsLoggedIn = sessionStorage.getItem('loggedInUser');
    
    if (!userIsLoggedIn) {
        window.location.href = "../Login/login.html";  // Redirect to login page if not logged in
    } else {
        fetchVolunteerData(userIsLoggedIn);
    }
});

async function fetchVolunteerData(userId) {
    try {
        const response = await fetch(`/api/volunteer/${userId}`);
        const data = await response.json();

        // Populate dashboard with volunteer data
        document.getElementById('userName').textContent = `${data.firstName} ${data.lastName}`;
        document.getElementById('profileName').textContent = `${data.firstName} ${data.lastName}`;
        document.getElementById('profileEmail').textContent = data.email;

        // Assuming `data` includes statistics
        document.getElementById('pendingRequests').textContent = data.pendingRequests || 0;
        document.getElementById('activeRequests').textContent = data.activeRequests || 0;
        document.getElementById('completedRequests').textContent = data.completedRequests || 0;
        document.getElementById('requestsResponded').textContent = data.requestsResponded || 0;
        document.getElementById('avgResponseTime').textContent = data.avgResponseTime || 'N/A';
        document.getElementById('successRate').textContent = data.successRate || 'N/A';

        // Handle map location if applicable
        if (data.location) {
            const { lat, lng } = data.location;
            const map = new google.maps.Map(document.getElementById('map'), {
                center: { lat, lng },
                zoom: 12
            });
        }

    } catch (error) {
        console.error('Error fetching volunteer data:', error);
    }
}
