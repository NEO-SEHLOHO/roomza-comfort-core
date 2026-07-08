(function () {
  const fallbackConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
  };

  function hasUsableConfig(config) {
    return Boolean(
      config &&
        config.apiKey &&
        config.authDomain &&
        config.projectId &&
        config.appId
    );
  }

  function setOfflineFirebase(reason) {
    window.ResZaFirebase = {
      isConfigured: false,
      isOffline: true,
      reason,
    };
    console.warn(`Firebase is not configured. ${reason}`);
  }

  function loadLocalConfig() {
    return new Promise((resolve) => {
      if (window.RESZA_FIREBASE_CONFIG) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "firebase-config.local.js";
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => resolve();
      document.head.appendChild(script);
    });
  }

  async function initFirebase() {
    await loadLocalConfig();

    const firebaseConfig = window.RESZA_FIREBASE_CONFIG || fallbackConfig;

    if (!hasUsableConfig(firebaseConfig)) {
      setOfflineFirebase("Add firebase-config.local.js or paste config into firebase-config.js to enable live submissions.");
      return;
    }

    if (!window.firebase) {
      setOfflineFirebase("Firebase SDK was not loaded.");
      return;
    }

    try {
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(firebaseConfig);
      }

      window.ResZaFirebase = {
        app: window.firebase.app(),
        auth: window.firebase.auth(),
        db: window.firebase.firestore(),
        fieldValue: window.firebase.firestore.FieldValue,
        isConfigured: true,
        isOffline: false,
      };
    } catch (error) {
      setOfflineFirebase("Firebase failed to initialize.");
      console.error(error);
    }
  }

  initFirebase();
})();
