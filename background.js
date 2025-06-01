importScripts('https://www.gstatic.com/firebasejs/10.7.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.2/firebase-auth-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore-compat.js');

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

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