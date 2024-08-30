import { auth, db } from "./firebase.js"; // Update path if necessary
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const contact = document.getElementById('contact').value;
    const gender = document.getElementById('gender').value;
    const address = document.getElementById('address').value;
    const address2 = document.getElementById('address2').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const zip = document.getElementById('zip').value;
    const securityQuestion = document.getElementById('securityQuestion').value;
    const securityAnswer = document.getElementById('securityAnswer').value;
    const messageElement = document.getElementById('message');
    const submitButton = document.querySelector('button[type="submit"]');

    try {
        submitButton.disabled = true;
        submitButton.textContent = "Registering...";

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("User registered:", user);

        await setDoc(doc(db, "users", user.uid), {
            firstName,
            lastName,
            email,
            contact,
            gender,
            address,
            address2,
            city,
            state,
            zip,
            securityQuestion,
            securityAnswer,
            createdAt: new Date()
        });

        console.log("User details saved to Firestore.");

        messageElement.textContent = "Registration successful! Redirecting to login...";
        messageElement.style.color = "green";

        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);

    } catch (error) {
        console.error("Error registering user:", error);
        messageElement.textContent = "Error: " + error.message;
        messageElement.style.color = "red";
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Register";
    }
});

function autoFillCity(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    const apiKey = 'f0901418c9b1deb823ea2e4a532d9ffd';
    const reverseGeocodeUrl = `https://apis.mapmyindia.com/advancedmaps/v1/${apiKey}/rev_geocode?lat=${lat}&lng=${lng}`;

    fetch(reverseGeocodeUrl)
        .then(response => response.json())
        .then(data => {
            console.log('Reverse Geocoding Data:', data); // Debug output
            if (data.results && data.results.length > 0) {
                const address = data.results[0];
                const city = address.city || '';
                const zip = address.pincode || '';

                console.log('City:', city); // Debug output
                console.log('Zip:', zip); // Debug output

                // Auto-fill only city and zip code
                document.getElementById('city').value = city;
                document.getElementById('zip').value = zip;
            } else {
                console.warn('No results found for the location.');
            }
        })
        .catch(error => {
            console.error('Error fetching address:', error);
        });
}

function handleLocationError() {
    console.error('Unable to retrieve your location.');
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(autoFillCity, handleLocationError);
    } else {
        console.error('Geolocation is not supported by this browser.');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    getLocation();
});
