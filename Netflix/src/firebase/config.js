import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAeLYFqxqQYHsiU-COdqLHU92JccNpuy2w",
    authDomain: "netflix-dd25b.firebaseapp.com",
    projectId: "netflix-dd25b",
    storageBucket: "netflix-dd25b.firebasestorage.app",
    messagingSenderId: "519067506911",
    appId: "1:519067506911:web:edcab027831bd5ee87f16a",
    measurementId: "G-J9HNDC5MT8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };