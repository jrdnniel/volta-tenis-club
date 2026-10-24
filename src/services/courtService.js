import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION = 'courts';

// Get all courts
export const getAllCourts = async () => {
  const q = query(collection(db, COLLECTION), where('isActive', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Add a new court (admin)
export const addCourt = async (courtData) => {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...courtData,
    isActive: true,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// Update court details
export const updateCourt = async (courtId, data) => {
  const docRef = doc(db, COLLECTION, courtId);
  await updateDoc(docRef, data);
};

// Toggle court availability
export const toggleCourtActive = async (courtId, isActive) => {
  const docRef = doc(db, COLLECTION, courtId);
  await updateDoc(docRef, { isActive });
};

