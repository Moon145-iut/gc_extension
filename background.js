importScripts('https://www.gstatic.com/firebasejs/10.7.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.2/firebase-auth-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore-compat.js');

 const firebaseConfig = {
    apiKey: "AIzaSyCzRVRcAdi2Fyk4aQA0iysvwl2aIqD5h4w",
    authDomain: "gcextension-37458.firebaseapp.com",
    projectId: "gcextension-37458",
    storageBucket: "gcextension-37458.firebasestorage.app",
    messagingSenderId: "982257392737",
    appId: "1:982257392737:web:6c274d9c5401f5278a5e20",
    measurementId: "G-4BD9H69CCW"
  };
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'sign-in') {
    auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .then(result => sendResponse({ user: result.user }))
      .catch(error => sendResponse({ error }));
    return true;
  }
  if (message.type === 'get-folders') {
    db.collection('users').doc(message.uid).get()
      .then(doc => sendResponse({ folders: doc.data()?.folders || {} }))
      .catch(error => sendResponse({ error }));
    return true;
  }
  if (message.type === 'save-folders') {
    db.collection('users').doc(message.uid).set({ folders: message.folders }, { merge: true })
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ error }));
    return true;
  }
});