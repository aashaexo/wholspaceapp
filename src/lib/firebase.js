// Firebase Configuration for Wholspace
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCJI0MnAhhhEkB8ZEMuGKAqQ4kwbBp0i5w",
  authDomain: "wholspace.firebaseapp.com",
  projectId: "wholspace",
  storageBucket: "wholspace.firebasestorage.app",
  messagingSenderId: "456947153984",
  appId: "1:456947153984:web:508b57f0979b5a079b73a5",
  measurementId: "G-SD0ENK0235"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser)
let analytics = null;
isSupported().then(supported => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore Database
const db = getFirestore(app);

// Initialize Storage (for images/files)
const storage = getStorage(app);

// Auth Providers
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

const githubProvider = new GithubAuthProvider();
githubProvider.addScope('read:user');
githubProvider.addScope('user:email');

// ============================================
// STORAGE HELPER FUNCTIONS
// ============================================

/**
 * Upload user avatar to Firebase Storage
 * @param {string} userId - User's UID
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} - Download URL of uploaded image
 */
export const uploadAvatar = async (userId, file) => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload an image file');
  }
  
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be less than 5MB');
  }

  const fileExtension = file.name.split('.').pop();
  const storageRef = ref(storage, `avatars/${userId}/avatar.${fileExtension}`);
  
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

/**
 * Upload project screenshot/thumbnail to Firebase Storage
 * @param {string} userId - User's UID
 * @param {string} projectId - Project ID
 * @param {File} file - Image file to upload
 * @param {number} index - Screenshot index (for multiple screenshots)
 * @returns {Promise<string>} - Download URL of uploaded image
 */
export const uploadProjectImage = async (userId, projectId, file, index = 0) => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload an image file');
  }
  
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image must be less than 10MB');
  }

  const fileExtension = file.name.split('.').pop();
  const fileName = index === 0 ? `thumbnail.${fileExtension}` : `screenshot_${index}.${fileExtension}`;
  const storageRef = ref(storage, `projects/${userId}/${projectId}/${fileName}`);
  
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

/**
 * Delete all images for a project
 * @param {string} userId - User's UID
 * @param {string} projectId - Project ID
 */
export const deleteAllProjectImages = async (userId, projectId) => {
  try {
    const projectRef = ref(storage, `projects/${userId}/${projectId}`);
    const files = await listAll(projectRef);
    await Promise.all(files.items.map(item => deleteObject(item)));
  } catch (error) {
    // Ignore if folder doesn't exist
    if (error.code !== 'storage/object-not-found') {
      console.error('Error deleting project images:', error);
    }
  }
};

export { 
  app, 
  analytics, 
  auth, 
  db, 
  storage, 
  googleProvider, 
  githubProvider 
};
