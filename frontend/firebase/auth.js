// Firebase Authentication Service
class FirebaseAuthService {
    constructor() {
        if (typeof firebase === 'undefined') {
            console.warn('Firebase not available');
            return;
        }
        
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.googleProvider = new firebase.auth.GoogleAuthProvider();
    }

    // Email/Password Authentication
    async signUpWithEmail(email, password, userData) {
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Update profile
            await user.updateProfile({
                displayName: `${userData.firstName} ${userData.lastName}`
            });

            // Create user document in Firestore
            await this.createUserDocument(user, userData);

            return { success: true, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async signInWithEmail(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Google Authentication
    async signInWithGoogle() {
        try {
            const result = await this.auth.signInWithPopup(this.googleProvider);
            const user = result.user;

            // Check if user document exists
            const userDoc = await this.db.collection('users').doc(user.uid).get();
            if (!userDoc.exists) {
                // Create user document
                await this.createUserDocument(user, {
                    firstName: user.displayName?.split(' ')[0] || '',
                    lastName: user.displayName?.split(' ')[1] || ''
                });
            }

            return { success: true, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // User Management
    async createUserDocument(user, userData) {
        const userDoc = {
            uid: user.uid,
            email: user.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
            preferences: {
                theme: 'light',
                notifications: true,
                language: 'en'
            }
        };

        await this.db.collection('users').doc(user.uid).set(userDoc);
    }

    async getCurrentUser() {
        return new Promise((resolve) => {
            const unsubscribe = this.auth.onAuthStateChanged(user => {
                unsubscribe();
                resolve(user);
            });
        });
    }

    async signOut() {
        try {
            await this.auth.signOut();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Password Reset
    async resetPassword(email) {
        try {
            await this.auth.sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Token Management
    async getIdToken() {
        const user = this.auth.currentUser;
        if (user) {
            return await user.getIdToken();
        }
        return null;
    }

    // Listen to auth state changes
    onAuthStateChanged(callback) {
        return this.auth.onAuthStateChanged(callback);
    }
}

// Create global instance (only if Firebase is available)
const firebaseAuth = typeof firebase !== 'undefined' ? new FirebaseAuthService() : null;