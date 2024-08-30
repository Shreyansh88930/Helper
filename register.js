import { auth, db } from "./firebase.js"; // Update path if necessary
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// API Key for CountryStateCity API
const apiKey = 'WDEwVHcyUXB3NXRUbTA4bGx0dE1ORlM3WnI2cEhGcFlpRTQ5NVp5cw==';

// Function to fetch states and populate the state dropdown
async function fetchStates() {
    const apiUrl = 'https://api.countrystatecity.in/v1/countries/IN/states';

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'X-CSCAPI-KEY': apiKey
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        console.log('States data:', data); // Debugging line to check API response

        // Clear existing state options
        const stateSelect = document.getElementById('state');
        stateSelect.innerHTML = '<option value="" selected>Select State</option>';

        // Populate new state options
        data.forEach(state => {
            const option = document.createElement('option');
            option.value = state.iso2;  // Use state ISO2 as value
            option.textContent = state.name;
            stateSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error fetching states:', error);
    }
}

// Function to fetch cities based on selected state and return as a comma-separated string
async function fetchCities(stateIso2) {
    const apiUrl = `https://api.countrystatecity.in/v1/countries/IN/states/${stateIso2}/cities`;
    
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'X-CSCAPI-KEY': apiKey
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Cities data:', data); // Debugging line to check API response

        // Create a string of city names separated by commas
        const cityNames = data.map(city => city.name).join(', ');

        // Clear existing city options and populate with new options
        const citySelect = document.getElementById('city');
        citySelect.innerHTML = '<option value="" selected>Select City</option>';

        if (Array.isArray(data)) {
            data.forEach(city => {
                const option = document.createElement('option');
                option.value = city.name;  // Use city name as value
                option.textContent = city.name;
                citySelect.appendChild(option);
            });
        }

        return cityNames;  // Return the comma-separated city names

    } catch (error) {
        console.error('Error fetching cities:', error);
        return '';  // Return an empty string in case of an error
    }
}

// Handle form submission
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

        // Save data to Firestore, ensuring city and state are stored as strings
        await setDoc(doc(db, "users", user.uid), {
            firstName: String(firstName),
            lastName: String(lastName),
            email: String(email),
            contact: String(contact),
            gender: String(gender),
            address: String(address),
            address2: String(address2),
            city: String(city), // Ensure city is saved as a string
            state: String(state), // Ensure state is saved as a string
            zip: String(zip),
            securityQuestion: String(securityQuestion),
            securityAnswer: String(securityAnswer),
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

// Update cities when state changes
document.getElementById('state').addEventListener('change', function() {
    const selectedStateIso2 = this.value;
    if (selectedStateIso2) {
        fetchCities(selectedStateIso2);
    } else {
        // Clear city dropdown if no state is selected
        const citySelect = document.getElementById('city');
        citySelect.innerHTML = '<option value="" selected>Select City</option>';
    }
});

// Populate states on page load
document.addEventListener('DOMContentLoaded', function() {
    fetchStates();
});
