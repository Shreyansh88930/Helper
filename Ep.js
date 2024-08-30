import { auth, db } from './firebase.js'; // Adjust the path if needed
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';

// Function to update user profile
async function updateUserProfile(data) {
    const user = auth.currentUser;
    if (!user) {
        console.error("No user is signed in");
        return;
    }

    const userRef = doc(db, 'users', user.uid); // Adjust "users" to match your Firestore collection

    try {
        await updateDoc(userRef, data);
        console.log("Profile updated successfully");
        document.getElementById("message").textContent = "Profile updated successfully";
        document.getElementById("message").style.color = "green"; // Optional: set text color to green
    } catch (error) {
        console.error("Error updating profile: ", error);
        document.getElementById("message").textContent = "Error updating profile. Please try again.";
        document.getElementById("message").style.color = "red"; // Optional: set text color to red
    }
}

// Function to handle form submission
function handleFormSubmit(event) {
    event.preventDefault(); // Prevent the default form submission

    // Gather form data
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const contact = document.getElementById('contact').value;
    const gender = document.getElementById('gender').value;
    const address = document.getElementById('address').value;
    const address2 = document.getElementById('address2').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const zip = document.getElementById('zip').value;

    // Create data object
    const data = {
        firstName,
        lastName,
        contact, // Include contact
        gender,  // Include gender
        address,
        address2,
        city,
        state,
        zip
    };

    // Update user profile
    updateUserProfile(data);
}

// Function to populate form with user data
async function populateForm() {
    const user = auth.currentUser;
    if (!user) {
        console.error("No user is signed in");
        return;
    }

    const userRef = doc(db, 'users', user.uid); // Adjust "users" to match your Firestore collection
    try {
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            const userData = docSnap.data();
            console.log('User Data:', userData); // Log the retrieved user data

            // Populate form fields with existing user data
            document.getElementById('firstName').value = userData.firstName || '';
            document.getElementById('lastName').value = userData.lastName || '';
            document.getElementById('contact').value = userData.contact || ''; // Default to empty if not present
            document.getElementById('gender').value = userData.gender || '';   // Default to empty if not present
            document.getElementById('address').value = userData.address || '';
            document.getElementById('address2').value = userData.address2 || '';
            document.getElementById('city').value = userData.city || '';
            document.getElementById('state').value = userData.state || '';
            document.getElementById('zip').value = userData.zip || '';
        } else {
            console.error("No such document!");
        }
    } catch (error) {
        console.error("Error getting document: ", error);
    }
}

// Initialize form and set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            populateForm();
        } else {
            console.log('No user is signed in');
            // Optionally redirect or display a message
        }
    });
    document.getElementById('editProfileForm').addEventListener('submit', handleFormSubmit);
});

import { signOut } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';

// Function to handle logout
function handleLogout() {
    signOut(auth).then(() => {
        console.log('User signed out.');
        window.location.href = 'login.html'; // Redirect to the login page
    }).catch((error) => {
        console.error('Error during sign out:', error);
    });
}

// Add event listener to the logout link
document.getElementById('logoutLink').addEventListener('click', (event) => {
    event.preventDefault(); // Prevent the default link behavior
    handleLogout(); // Call the logout function
});
