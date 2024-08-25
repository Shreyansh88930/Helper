import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const auth = getAuth();
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = loginForm['email'].value;
    const password = loginForm['password'].value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in
            window.location.href = '/volunteer-dashboard/index.html'; // Redirect on successful login
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Error: ", errorMessage);
            // You can also add error handling UI here if desired
        });
});
