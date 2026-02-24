// lib/firebaseClient.ts
// Firebase client initialization for web push
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, onMessage, getToken } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: "AIzaSyDF1ZCbV6pXye442rwTajhF8LVNOvO8gus",
    authDomain: "testing-27f81.firebaseapp.com",
    projectId: "testing-27f81",
    storageBucket: "testing-27f81.firebasestorage.app",
    messagingSenderId: "271204775984",
    appId: "1:271204775984:web:8837b1490f800cdb0755f5"
};

// VAPID public key for FCM web push
export const VAPID_PUBLIC_KEY = "BAzU7-KAC6JjI0GzGnxMNS11tcqi640L3ame7sdn6zvX9MCK_kbt_jurL-7a1pehtFWwo5uTuVb_euxWncu5Q28";

export function initFirebase() {
    if (!getApps().length) {
        initializeApp(firebaseConfig);
    }
}

export function getFirebaseMessaging() {
    initFirebase();
    return getMessaging();
}

export { onMessage, getToken };