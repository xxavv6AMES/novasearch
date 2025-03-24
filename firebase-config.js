const firebaseConfig = {
  // Your existing Firebase config
  authDomain: "search.novasuite.one",
  // ...other config options
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Configure authorized domains
const auth = firebase.auth();
auth.settings.appVerificationDisabledForTesting = true; // For development only
