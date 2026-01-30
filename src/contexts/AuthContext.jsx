// Auth Context - Manages user authentication state
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, githubProvider } from '../lib/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingVerification, setPendingVerification] = useState(null);

  // Create or get user profile in Firestore
  const syncUserProfile = async (firebaseUser) => {
    if (!firebaseUser) return null;

    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Create new user profile
      const newProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || '',
        handle: '',
        bio: '',
        tagline: '',
        website: '',
        tools: [],
        socialLinks: {
          twitter: '',
          github: '',
          linkedin: '',
          youtube: ''
        },
        projectCount: 0,
        followerCount: 0,
        followingCount: 0,
        totalLikes: 0,
        isFeatured: false,
        isProfileComplete: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(userRef, newProfile);
      return { id: firebaseUser.uid, ...newProfile };
    } else {
      // Update last login
      await setDoc(userRef, { 
        lastLoginAt: serverTimestamp() 
      }, { merge: true });
      
      return { id: userSnap.id, ...userSnap.data() };
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if email is verified (for email/password users)
        const isEmailProvider = firebaseUser.providerData[0]?.providerId === 'password';
        
        if (isEmailProvider && !firebaseUser.emailVerified) {
          // Email not verified - block access
          setUser(null);
          setUserProfile(null);
          setPendingVerification({
            email: firebaseUser.email,
            uid: firebaseUser.uid
          });
          await signOut(auth);
        } else {
          // Verified user - sync profile
          setUser(firebaseUser);
          const profile = await syncUserProfile(firebaseUser);
          setUserProfile(profile);
          setPendingVerification(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Register with email/password
  const registerWithEmail = async (email, password) => {
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(result.user);
      setPendingVerification({
        email: result.user.email,
        uid: result.user.uid
      });
      await signOut(auth);
      return { success: true, email: result.user.email };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Sign in with email/password
  const signInWithEmail = async (email, password) => {
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      if (!result.user.emailVerified) {
        setPendingVerification({
          email: result.user.email,
          uid: result.user.uid
        });
        await sendEmailVerification(result.user);
        await signOut(auth);
        throw new Error('Please verify your email before logging in. A new verification email has been sent.');
      }
      
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setPendingVerification(null);
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Sign in with GitHub
  const signInWithGithub = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, githubProvider);
      setPendingVerification(null);
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Sign out
  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
      setPendingVerification(null);
      setUserProfile(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Refresh user profile from Firestore
  const refreshProfile = async () => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      setUserProfile({ id: userSnap.id, ...userSnap.data() });
    }
  };

  // Clear pending verification
  const clearPendingVerification = () => {
    setPendingVerification(null);
  };

  const value = {
    user,
    userProfile,
    loading,
    error,
    pendingVerification,
    registerWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signInWithGithub,
    logout,
    refreshProfile,
    clearPendingVerification
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
