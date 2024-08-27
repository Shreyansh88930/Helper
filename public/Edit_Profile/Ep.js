import { auth, db } from '../firebase.js'; // Adjust the path if needed
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

    // Create data object for updating
    const updatedData = {
        firstName,
        lastName,
        contact,
        gender,
        address,
        address2,
        city,
        state,
        zip
    };

    // Call the function to update user profile
    updateUserProfile(updatedData);
}

// Add event listener for form submission
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                // Reference to the user's document in Firestore
                const userDoc = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userDoc);

                if (userSnap.exists()) {
                    const userData = userSnap.data();

                    // Prefill form fields with user data
                    document.getElementById('firstName').value = userData.firstName || '';
                    document.getElementById('lastName').value = userData.lastName || '';
                    document.getElementById('contact').value = userData.contact || '';
                    document.getElementById('gender').value = userData.gender || '';
                    document.getElementById('address').value = userData.address || '';
                    document.getElementById('address2').value = userData.address2 || '';
                    document.getElementById('city').value = userData.city || '';
                    document.getElementById('state').value = userData.state || '';
                    document.getElementById('zip').value = userData.zip || '';
                } else {
                    console.error('No such document!');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }

            // Add event listener for form submission
            document.getElementById('editProfileForm').addEventListener('submit', handleFormSubmit);
        } else {
            console.log('No user is signed in.');
            // Optionally redirect to login or show a message
            window.location.href = '../Login/login.html'; // Adjust the path if needed
        }
    });
});
