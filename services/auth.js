const firebaseConfig = {
    apiKey: "AIzaSyAeNLHp2EO50B0PrZuBchOJvxhxHlVuVu4",
    authDomain: "novasuite-e4257.firebaseapp.com",
    projectId: "novasuite-e4257",
    storageBucket: "novasuite-e4257.firebasestorage.app",
    messagingSenderId: "349176160657",
    appId: "1:349176160657:web:1359407f2e61174ff63a30",
    measurementId: "G-JR2KLB7FQC"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

export const signIn = async (email, password) => {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return userCredential.user;
    } catch (error) {
        console.error('Sign in error:', error);
        throw error;
    }
};

export const signInWithGoogle = async () => {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        return result.user;
    } catch (error) {
        console.error('Google sign in error:', error);
        throw error;
    }
};

export const signInWithGithub = async () => {
    try {
        const provider = new firebase.auth.GithubAuthProvider();
        const result = await auth.signInWithPopup(provider);
        return result.user;
    } catch (error) {
        console.error('GitHub sign in error:', error);
        throw error;
    }
};

export const signOutUser = async () => {
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
};

export const getCurrentUser = () => {
    return auth.currentUser;
};

export const onAuthStateChanged = (callback) => {
    return auth.onAuthStateChanged(callback);
};
