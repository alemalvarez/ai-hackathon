// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCMQ5ySUTlpm_epg86T3U14bp7HaM2Sb_s",
    authDomain: "crunchifyai.firebaseapp.com",
    projectId: "crunchifyai",
    storageBucket: "crunchifyai.appspot.com",
    messagingSenderId: "221109441200",
    appId: "1:221109441200:web:3f7bb51af2117856dee175",
    measurementId: "G-X53FDSSLYF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestore = getFirestore(app);

export { firestore }