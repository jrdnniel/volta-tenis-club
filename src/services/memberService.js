import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ROLES } from '../utils/constants';

const COLLECTION = 'users';

// Get all members (admin)
export const getAllMembers = async () => {
  const q = query(
    collection(db, COLLECTION),
    where('role', '==', ROLES.MEMBER)
  );
  const snapshot = await getDocs(q);
  const members = snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
  return members.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
};

// Get all coaches
export const getAllCoaches = async () => {
  const q = query(
    collection(db, COLLECTION),
    where('role', '==', ROLES.COACH),
    where('isActive', '==', true)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, uid: doc.id, ...doc.data() }));
};

// Get user by UID
export const getUserById = async (uid) => {
  const docRef = doc(db, COLLECTION, uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { uid: docSnap.id, ...docSnap.data() };
  }
  return null;
};

// Update user profile
export const updateUserProfile = async (uid, data) => {
  const docRef = doc(db, COLLECTION, uid);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// Toggle user active status
export const toggleUserActive = async (uid, isActive) => {
  const docRef = doc(db, COLLECTION, uid);
  await updateDoc(docRef, {
    isActive,
    updatedAt: serverTimestamp(),
  });
};

// Update user role (admin only)
export const updateUserRole = async (uid, role) => {
  const docRef = doc(db, COLLECTION, uid);
  await updateDoc(docRef, {
    role,
    updatedAt: serverTimestamp(),
  });
};

