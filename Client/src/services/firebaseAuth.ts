import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  confirmPasswordReset,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, firestore, googleProvider, facebookProvider } from './firebase';

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export class FirebaseAuthService {
  // Email/Password Authentication
  static async signUpWithEmail(email: string, password: string, displayName: string): Promise<UserCredential> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with display name
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: displayName
      });
    }

    // Create user document in Firestore
    await this.createUserDocument(userCredential.user, displayName);

    return userCredential;
  }

  static async signInWithEmail(email: string, password: string): Promise<UserCredential> {
    return await signInWithEmailAndPassword(auth, email, password);
  }

  // Social Authentication
  static async signInWithGoogle(): Promise<UserCredential> {
    const userCredential = await signInWithPopup(auth, googleProvider);
    await this.createUserDocument(userCredential.user);
    return userCredential;
  }

  static async signInWithFacebook(): Promise<UserCredential> {
    const userCredential = await signInWithPopup(auth, facebookProvider);
    await this.createUserDocument(userCredential.user);
    return userCredential;
  }

  // Password Reset
  static async resetPassword(email: string): Promise<void> {
    return await sendPasswordResetEmail(auth, email);
  }

  static async confirmResetPassword(oobCode: string, newPassword: string): Promise<void> {
    return await confirmPasswordReset(auth, oobCode, newPassword);
  }

  // Sign Out
  static async signOut(): Promise<void> {
    return await signOut(auth);
  }

  // Firestore User Document
  private static async createUserDocument(user: any, displayName?: string) {
    const userRef = doc(firestore, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        provider: user.providerData[0]?.providerId
      };

      await setDoc(userRef, userData);
    } else {
      // Update last login
      await setDoc(userRef, {
        lastLoginAt: new Date().toISOString()
      }, { merge: true });
    }
  }

  // Get current user
  static getCurrentUser(): FirebaseUser | null {
    const user = auth.currentUser;
    if (!user) return null;

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified
    };
  }
}
