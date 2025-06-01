// Import Firebase SDK
try {
  importScripts(
    'https://www.gstatic.com/firebasejs/10.7.2/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.7.2/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore-compat.js'
  );
} catch (error) {
  console.error('Error loading Firebase SDK:', error);
  // Notify the popup about the error
  chrome.runtime.sendMessage({ type: 'firebase-error', error: error.message });
  return;
}

const firebaseConfig = {
    apiKey: "AIzaSyCzRVRcAdi2Fyk4aQA0iysvwl2aIqD5h4w",
    authDomain: "gcextension-37458.firebaseapp.com",
    projectId: "gcextension-37458",
    storageBucket: "gcextension-37458.firebasestorage.app",
    messagingSenderId: "982257392737",
    appId: "1:982257392737:web:6c274d9c5401f5278a5e20"
};

try {
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  // Set up message listener
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) {
      sendResponse({ error: 'Invalid message format' });
      return true;
    }

    switch (message.type) {
      case 'sign-in':
        auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
          .then(result => {
            if (!result.user) throw new Error('Authentication failed');
            sendResponse({ user: result.user });
          })
          .catch(error => {
            console.error('Sign-in error:', error);
            sendResponse({ error: error.message });
          });
        return true;

      case 'get-folders':
        if (!message.uid) {
          sendResponse({ error: 'User ID is required' });
          return true;
        }
        db.collection('users').doc(message.uid).get()
          .then(doc => sendResponse({ folders: doc.data()?.folders || {} }))
          .catch(error => {
            console.error('Get folders error:', error);
            sendResponse({ error: error.message });
          });
        return true;

      case 'save-folders':
        if (!message.uid || !message.folders) {
          sendResponse({ error: 'User ID and folders are required' });
          return true;
        }
        db.collection('users').doc(message.uid).set({ folders: message.folders }, { merge: true })
          .then(() => sendResponse({ success: true }))
          .catch(error => {
            console.error('Save folders error:', error);
            sendResponse({ error: error.message });
          });
        return true;

      default:
        sendResponse({ error: 'Unknown message type' });
        return true;
    }
  });
} catch (error) {
  console.error('Firebase initialization error:', error);
  chrome.runtime.sendMessage({ type: 'firebase-error', error: error.message });
}