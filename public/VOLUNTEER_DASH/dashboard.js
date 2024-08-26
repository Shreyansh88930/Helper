import { auth, db } from '../firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import { getDoc, doc, getDocs, collection, query, where, updateDoc } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

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
            return userData.city; // Return the user's city for use in filtering help requests
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
        const q = query(collection(db, 'helpRequests'), where('city', '==', userCity));
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
                <td>${request.status || 'N/A'}</td>
                <td>
                    <button class="btn btn-success" onclick="markAsCompleted('${request.id}')">Mark as Completed</button>
                </td>
            `;
            requestsTable.appendChild(row);
        });

        document.getElementById('pendingRequests').textContent = `Pending Requests: ${requests.length}`;
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
        displayPendingRequests(); // Refresh the requests list
    } catch (error) {
        console.error('Error marking request as completed:', error);
    }
}

// Initialize Firebase Authentication state observer
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userCity = await displayUserDetails(user);
        await displayPendingRequests(userCity);
    } else {
        window.location.href = 'login.html';
    }
});
