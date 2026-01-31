// Firestore Database Service
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc,
  updateDoc,
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { deleteAllProjectImages } from './firebase';

// ============================================
// USER OPERATIONS
// ============================================

/**
 * Create a new user profile after registration
 */
export const createUserProfile = async (userId, userData) => {
  const userRef = doc(db, 'users', userId);
  
  const newProfile = {
    uid: userId,
    email: userData.email || '',
    displayName: userData.displayName || '',
    photoURL: userData.photoURL || '',
    handle: '', // User sets this during onboarding
    bio: '',
    tagline: '',
    website: '',
    tools: [], // ['Lovable', 'Bolt', 'v0', etc.]
    socialLinks: {
      twitter: '',
      github: '',
      linkedin: '',
      youtube: '',
      discord: ''
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
  return { id: userId, ...newProfile };
};

/**
 * Get user by ID
 */
export const getUserById = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null;
};

/**
 * Get user by handle (username)
 */
export const getUserByHandle = async (handle) => {
  const q = query(
    collection(db, 'users'), 
    where('handle', '==', handle.toLowerCase())
  );
  const querySnap = await getDocs(q);
  if (querySnap.empty) return null;
  const userDoc = querySnap.docs[0];
  return { id: userDoc.id, ...userDoc.data() };
};

/**
 * Check if handle is available
 */
export const isHandleAvailable = async (handle) => {
  const user = await getUserByHandle(handle.toLowerCase());
  return user === null;
};

/**
 * Update user profile (creates the document if it doesn't exist yet)
 */
export const updateUserProfile = async (userId, data) => {
  const userRef = doc(db, 'users', userId);
  
  // If updating handle, convert to lowercase
  const payload = { ...data };
  if (payload.handle) {
    payload.handle = payload.handle.toLowerCase();
  }
  payload.updatedAt = serverTimestamp();
  payload.uid = userId;

  // Use setDoc with merge so first save creates the doc; later saves update it
  await setDoc(userRef, payload, { merge: true });
  
  return await getUserById(userId);
};

/**
 * Complete user profile (after onboarding)
 */
export const completeUserProfile = async (userId, profileData) => {
  const userRef = doc(db, 'users', userId);
  
  await updateDoc(userRef, {
    ...profileData,
    handle: profileData.handle?.toLowerCase() || '',
    isProfileComplete: true,
    updatedAt: serverTimestamp()
  });
  
  return await getUserById(userId);
};

/**
 * Get featured builders
 */
export const getFeaturedVibecoders = async (limitCount = 6) => {
  // First try to get manually featured users
  let q = query(
    collection(db, 'users'),
    where('isFeatured', '==', true),
    where('isProfileComplete', '==', true),
    limit(limitCount)
  );
  
  let querySnap = await getDocs(q);
  
  // If not enough featured, get top users by project count
  if (querySnap.size < limitCount) {
    q = query(
      collection(db, 'users'),
      where('isProfileComplete', '==', true),
      orderBy('projectCount', 'desc'),
      limit(limitCount)
    );
    querySnap = await getDocs(q);
  }
  
  return querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Search users
 */
export const searchUsers = async (searchTerm, limitCount = 10) => {
  // Note: For production, use Algolia or Elasticsearch
  const q = query(
    collection(db, 'users'),
    where('isProfileComplete', '==', true),
    orderBy('displayName'),
    limit(50) // Get more to filter client-side
  );
  
  const querySnap = await getDocs(q);
  const term = searchTerm.toLowerCase();
  
  return querySnap.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(user => 
      user.displayName?.toLowerCase().includes(term) ||
      user.handle?.toLowerCase().includes(term) ||
      user.bio?.toLowerCase().includes(term)
    )
    .slice(0, limitCount);
};

// ============================================
// PROJECT OPERATIONS
// ============================================

/**
 * Create a new project
 */
export const createProject = async (userId, projectData) => {
  // Generate a new document reference to get the ID
  const projectRef = doc(collection(db, 'projects'));
  
  const project = {
    id: projectRef.id,
    userId,
    title: projectData.title || '',
    description: projectData.description || '',
    shortDescription: projectData.shortDescription || '',
    demoUrl: projectData.demoUrl || '',
    githubUrl: projectData.githubUrl || '',
    thumbnailUrl: projectData.thumbnailUrl || '',
    screenshots: projectData.screenshots || [],
    tool: projectData.tool || '', // 'Lovable', 'Bolt', 'v0', etc.
    category: projectData.category || 'Other',
    tags: projectData.tags || [],
    likes: 0,
    views: 0,
    likedBy: [],
    isFeatured: false,
    isPublished: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  // Use batch to update project and user's project count
  const batch = writeBatch(db);
  batch.set(projectRef, project);
  batch.update(doc(db, 'users', userId), {
    projectCount: increment(1)
  });
  
  await batch.commit();

  return { id: projectRef.id, ...project };
};

/**
 * Get project by ID
 */
export const getProjectById = async (projectId, incrementView = false) => {
  const projectRef = doc(db, 'projects', projectId);
  const projectSnap = await getDoc(projectRef);
  
  if (!projectSnap.exists()) return null;
  
  // Increment view count if requested
  if (incrementView) {
    await updateDoc(projectRef, {
      views: increment(1)
    });
  }

  return { id: projectSnap.id, ...projectSnap.data() };
};

/**
 * Get projects by user ID
 */
export const getProjectsByUser = async (userId, includeUnpublished = false) => {
  let q;
  
  if (includeUnpublished) {
    q = query(
      collection(db, 'projects'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
  } else {
    q = query(
      collection(db, 'projects'),
      where('userId', '==', userId),
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc')
    );
  }
  
  const querySnap = await getDocs(q);
  return querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get latest projects (with pagination)
 */
export const getLatestProjects = async (limitCount = 12, lastDoc = null) => {
  let q;
  
  if (lastDoc) {
    q = query(
      collection(db, 'projects'),
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(limitCount)
    );
  } else {
    q = query(
      collection(db, 'projects'),
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
  }

  const querySnap = await getDocs(q);
  
  return {
    projects: querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    lastDoc: querySnap.docs[querySnap.docs.length - 1] || null,
    hasMore: querySnap.docs.length === limitCount
  };
};

/**
 * Get projects by category
 */
export const getProjectsByCategory = async (category, limitCount = 12) => {
  const q = query(
    collection(db, 'projects'),
    where('category', '==', category),
    where('isPublished', '==', true),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  const querySnap = await getDocs(q);
  return querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get projects by tool
 */
export const getProjectsByTool = async (tool, limitCount = 12) => {
  const q = query(
    collection(db, 'projects'),
    where('tool', '==', tool),
    where('isPublished', '==', true),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  const querySnap = await getDocs(q);
  return querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get featured projects
 */
export const getFeaturedProjects = async (limitCount = 6) => {
  const q = query(
    collection(db, 'projects'),
    where('isFeatured', '==', true),
    where('isPublished', '==', true),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  const querySnap = await getDocs(q);
  return querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Update project
 */
export const updateProject = async (projectId, data) => {
  const projectRef = doc(db, 'projects', projectId);
  
  await updateDoc(projectRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
  
  return await getProjectById(projectId);
};

/**
 * Delete project
 */
export const deleteProject = async (projectId, userId) => {
  const project = await getProjectById(projectId);
  
  if (!project || project.userId !== userId) {
    throw new Error('Project not found or unauthorized');
  }

  // Delete project images from storage
  await deleteAllProjectImages(userId, projectId);

  // Delete project and update user's project count
  const batch = writeBatch(db);
  batch.delete(doc(db, 'projects', projectId));
  batch.update(doc(db, 'users', userId), {
    projectCount: increment(-1),
    totalLikes: increment(-project.likes)
  });
  
  await batch.commit();
};

// ============================================
// LIKE OPERATIONS
// ============================================

/**
 * Like a project
 */
export const likeProject = async (projectId, userId) => {
  const projectRef = doc(db, 'projects', projectId);
  const project = await getProjectById(projectId);
  
  if (!project) throw new Error('Project not found');
  if (project.likedBy?.includes(userId)) return; // Already liked
  
  const batch = writeBatch(db);
  
  // Update project likes
  batch.update(projectRef, {
    likes: increment(1),
    likedBy: arrayUnion(userId)
  });
  
  // Update project owner's total likes
  batch.update(doc(db, 'users', project.userId), {
    totalLikes: increment(1)
  });
  
  await batch.commit();
};

/**
 * Unlike a project
 */
export const unlikeProject = async (projectId, userId) => {
  const projectRef = doc(db, 'projects', projectId);
  const project = await getProjectById(projectId);
  
  if (!project) throw new Error('Project not found');
  if (!project.likedBy?.includes(userId)) return; // Not liked
  
  const batch = writeBatch(db);
  
  // Update project likes
  batch.update(projectRef, {
    likes: increment(-1),
    likedBy: arrayRemove(userId)
  });
  
  // Update project owner's total likes
  batch.update(doc(db, 'users', project.userId), {
    totalLikes: increment(-1)
  });
  
  await batch.commit();
};

/**
 * Check if user liked a project
 */
export const hasUserLikedProject = (project, userId) => {
  return project?.likedBy?.includes(userId) || false;
};

// ============================================
// FOLLOW OPERATIONS
// ============================================

/**
 * Follow a user
 */
export const followUser = async (followerId, followingId) => {
  if (followerId === followingId) {
    throw new Error('Cannot follow yourself');
  }

  const followRef = doc(db, 'follows', `${followerId}_${followingId}`);
  const followSnap = await getDoc(followRef);
  
  if (followSnap.exists()) return; // Already following

  const batch = writeBatch(db);
  
  // Create follow relationship
  batch.set(followRef, {
    followerId,
    followingId,
    createdAt: serverTimestamp()
  });
  
  // Update follower's following count
  batch.update(doc(db, 'users', followerId), {
    followingCount: increment(1)
  });
  
  // Update following's follower count
  batch.update(doc(db, 'users', followingId), {
    followerCount: increment(1)
  });
  
  await batch.commit();
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (followerId, followingId) => {
  const followRef = doc(db, 'follows', `${followerId}_${followingId}`);
  const followSnap = await getDoc(followRef);
  
  if (!followSnap.exists()) return; // Not following

  const batch = writeBatch(db);
  
  // Delete follow relationship
  batch.delete(followRef);
  
  // Update counts
  batch.update(doc(db, 'users', followerId), {
    followingCount: increment(-1)
  });
  
  batch.update(doc(db, 'users', followingId), {
    followerCount: increment(-1)
  });
  
  await batch.commit();
};

/**
 * Check if user is following another user
 */
export const isFollowing = async (followerId, followingId) => {
  const followRef = doc(db, 'follows', `${followerId}_${followingId}`);
  const followSnap = await getDoc(followRef);
  return followSnap.exists();
};

/**
 * Get user's followers
 */
export const getFollowers = async (userId, limitCount = 20) => {
  const q = query(
    collection(db, 'follows'),
    where('followingId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  const querySnap = await getDocs(q);
  const followerIds = querySnap.docs.map(doc => doc.data().followerId);
  
  if (followerIds.length === 0) return [];
  
  const followers = await Promise.all(
    followerIds.map(id => getUserById(id))
  );
  
  return followers.filter(Boolean);
};

/**
 * Get users that a user is following
 */
export const getFollowing = async (userId, limitCount = 20) => {
  const q = query(
    collection(db, 'follows'),
    where('followerId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  const querySnap = await getDocs(q);
  const followingIds = querySnap.docs.map(doc => doc.data().followingId);
  
  if (followingIds.length === 0) return [];
  
  const following = await Promise.all(
    followingIds.map(id => getUserById(id))
  );
  
  return following.filter(Boolean);
};

// ============================================
// STATS
// ============================================

/**
 * Get platform statistics
 */
export const getPlatformStats = async () => {
  const [usersSnap, projectsSnap] = await Promise.all([
    getDocs(query(collection(db, 'users'), where('isProfileComplete', '==', true))),
    getDocs(query(collection(db, 'projects'), where('isPublished', '==', true)))
  ]);
  
  return {
    totalUsers: usersSnap.size,
    totalProjects: projectsSnap.size
  };
};

// ============================================
// CONSTANTS
// ============================================

export const TOOLS = [
  'Lovable',
  'Bolt',
  'v0',
  'Cursor',
  'Replit',
  'Claude',
  'ChatGPT',
  'GitHub Copilot',
  'Other'
];

export const CATEGORIES = [
  'SaaS',
  'Landing Page',
  'Dashboard',
  'E-commerce',
  'Mobile App',
  'AI Tool',
  'Portfolio',
  'Blog',
  'Social',
  'Productivity',
  'Developer Tool',
  'Other'
];
