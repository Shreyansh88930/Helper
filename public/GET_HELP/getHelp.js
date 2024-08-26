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

// Handle location detection
document.getElementById("detectLocation").addEventListener("click", () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
});

function showPosition(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    // Initialize the Google Map
    const map = new google.maps.Map(document.getElementById("map"), {
        center: { lat, lng },
        zoom: 15,
    });

    // Create an AdvancedMarkerElement instead of Marker
    new google.maps.marker.AdvancedMarkerElement({
        position: { lat, lng },
        map: map,
        title: "Your Location",
    });

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results[0]) {
            const address = results[0].formatted_address;
            document.getElementById("location").value = address;
        } else {
            alert("Geocoder failed due to: " + status);
        }
    });
}

function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            alert("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            alert("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            alert("An unknown error occurred.");
        break;
    }
}
