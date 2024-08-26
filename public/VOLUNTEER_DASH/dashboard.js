import { auth, db } from '../firebase.js'; // Adjust the path as necessary
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import { getDoc, doc, getDocs, collection, updateDoc } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

// Function to display the user's details on the dashboard
async function displayUserDetails(user) {
    if (user) {
        try {
            const userDoc = await getDoc(doc(db, 'volunteers', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const fullName = `${userData.firstName || 'N/A'} ${userData.lastName || 'N/A'}`;
                document.getElementById('userName').textContent = fullName;
                document.getElementById('userEmail').textContent = user.email;
                document.getElementById('userCity').textContent = userData.city || 'N/A';
                document.getElementById('userPhone').textContent = userData.phone || 'N/A';
                document.getElementById('userJoinedDate').textContent = new Date(userData.joinedDate.seconds * 1000).toLocaleDateString() || 'N/A';
            } else {
                console.error('User data not found in Firestore');
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
        }
    } else {
        window.location.href = 'login.html';
    }
}

// Function to display pending help requests
async function displayPendingRequests() {
    try {
        const requestsSnapshot = await getDocs(collection(db, 'helpRequests'));
        const requests = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const requestsTable = document.getElementById('requestsTable');
        requestsTable.innerHTML = '';

        requests.forEach(request => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${request.id || 'N/A'}</td>
                <td>${request.city || 'N/A'}</td>
                <td>${request.description || 'N/A'}</td>
                <td>${new Date(request.timestamp.seconds * 1000).toLocaleString() || 'N/A'}</td>
                <td>${request.status || 'N/A'}</td>
                <td>
                    <button class="mark-completed-btn" onclick="markAsCompleted('${request.id}')">Mark as Completed</button>
                </td>
            `;
            requestsTable.appendChild(row);
        });

        document.getElementById('pendingRequests').textContent = requests.length;
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
        await displayUserDetails(user);
        await displayPendingRequests();
    } else {
        window.location.href = 'login.html';
    }
});
