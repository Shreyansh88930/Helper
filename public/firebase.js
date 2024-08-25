// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
apiKey: "AIzaSyC2ha9tam0L3pEqoDCDPBpNy3p87Y4KVvE",
authDomain: "womensafetyapp-a7789.firebaseapp.com",
projectId: "womensafetyapp-a7789",
storageBucket: "womensafetyapp-a7789.appspot.com",
messagingSenderId: "686918420611",
appId: "1:686918420611:web:2637e30d280598edc973b6",
measurementId: "G-BBJRG1JD1Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);