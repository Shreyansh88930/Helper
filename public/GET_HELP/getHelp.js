import { getFirestore, collection, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDr-UzzwWiGA7jt_IMQWIjX-2fioeT_Kn4",
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

let map;
let userMarker;

// Initialize Google Map
function initMap() {
    // Initialize the map with a default location
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -34.397, lng: 150.644 }, // Default location
        zoom: 8
    });

    // Attempt to get the user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                const userLatLng = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                // Update the map's center and the user's marker
                map.setCenter(userLatLng);

                if (userMarker) {
                    userMarker.setPosition(userLatLng);
                } else {
                    userMarker = new google.maps.Marker({
                        position: userLatLng,
                        map: map,
                        title: "You are here"
                    });
                }

                // Reverse geocoding to get the address
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: userLatLng }, (results, status) => {
                    if (status === "OK" && results[0]) {
                        const address = results[0].formatted_address;
                        document.getElementById("location").value = address;
                    } else {
                        alert("Geocoder failed due to: " + status);
                    }
                });
            },
            function () {
                handleLocationError(true, map.getCenter());
            }
        );
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, map.getCenter());
    }
}

function handleLocationError(browserHasGeolocation, pos) {
    new google.maps.InfoWindow({
        content: browserHasGeolocation ?
            'Error: The Geolocation service failed.' :
            'Error: Your browser doesn\'t support geolocation.',
        position: pos
    }).open(map);
}

// Handle form submission
document.getElementById("getHelpForm").addEventListener("submit", async (event) => {
    event.preventDefault();  // Prevent the default form submission behavior

    const description = document.getElementById("description").value;
    const location = document.getElementById("location").value;
    const userId = auth.currentUser ? auth.currentUser.uid : 'anonymous';  // Get the current user's ID or use 'anonymous'

    if (description === "") {
        alert("Please select a situation.");
        return;
    }

    try {
        await addDoc(collection(db, "getHelpRequests"), {
            userId: userId,
            location: location,
            description: description,
            timestamp: Timestamp.fromDate(new Date()),
            status: "pending"  // Default status
        });
        alert("Help request submitted successfully!");
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("Failed to submit help request.");
    }
});

// Detect location on button click
document.getElementById("detectLocation").addEventListener("click", () => {
    initMap();  // Reuse the initMap function to initialize and update the map with the user's location
});

// Initialize the map when the page loads
window.onload = initMap;
