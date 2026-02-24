// public/firebase-messaging-sw.js
// Service worker for Firebase Cloud Messaging
// This file is already updated with the new Firebase configuration.

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDF1ZCbV6pXye442rwTajhF8LVNOvO8gus",
    authDomain: "testing-27f81.firebaseapp.com",
    projectId: "testing-27f81",
    storageBucket: "testing-27f81.firebasestorage.app",
    messagingSenderId: "271204775984",
    appId: "1:271204775984:web:8837b1490f800cdb0755f5",
    vapidKey: "BAzU7-KAC6JjI0GzGnxMNS11tcqi640L3ame7sdn6zvX9MCK_kbt_jurL-7a1pehtFWwo5uTuVb_euxWncu5Q28"
});

const messaging = firebase.messaging();

// Show notification for both notification and data messages
messaging.onBackgroundMessage(function (payload) {
    let title = payload?.notification?.title || payload?.data?.title || 'Push';
    let options = {
        body: payload?.notification?.body || payload?.data?.body,
        icon: payload?.notification?.icon || payload?.data?.icon || '/android-chrome-192x192.png',
    };
    self.registration.showNotification(title, options);
});
