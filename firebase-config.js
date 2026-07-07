(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyBNacatfuFAjrRtADS1gqkA_HjiI2t2L3Y",
    authDomain: "students-applications-786b7.firebaseapp.com",
    projectId: "students-applications-786b7",
    storageBucket: "students-applications-786b7.firebasestorage.app",
    messagingSenderId: "580305476532",
    appId: "1:580305476532:web:50a7c75d774e26d57ef0e1",
  };

  function initFirebase() {
    if (!window.firebase) {
      console.warn("Firebase SDK was not loaded.");
      return;
    }

    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(firebaseConfig);
    }

    window.ResZaFirebase = {
      app: window.firebase.app(),
      auth: window.firebase.auth(),
      db: window.firebase.firestore(),
      fieldValue: window.firebase.firestore.FieldValue,
    };
  }

  initFirebase();
})();
