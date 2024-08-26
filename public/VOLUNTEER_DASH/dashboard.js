import { auth, db } from '../firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getDocs, collection } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Function to display user details on the dashboard
async function displayUserDetails(user) {
    if (user) {
        // Get user details from Firestore
        const userDocs = await getDocs(collection(db, 'users'));
        const userData = userDocs.docs.find(doc => doc.id === user.uid)?.data();

        if (userData) {
            // Combine firstName and lastName
            const fullName = `${userData.firstName} ${userData.lastName}`;

            // Update HTML with user details
            document.getElementById('userName').textContent = fullName;
            document.getElementById('userEmail').textContent = user.email;
            document.getElementById('userCity').textContent = userData.city;
        } else {
            console.error('User data not found in Firestore');
        }
    } else {
        // No user is signed in
        window.location.href = 'login.html'; // Redirect to login if no user is signed in
    }
}

// Listen for authentication state changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Display user details
        await displayUserDetails(user);
        // Load additional data (e.g., help requests) if necessary
    } else {
        // Redirect to login if user is not authenticated
        window.location.href = 'login.html';
    }
});
