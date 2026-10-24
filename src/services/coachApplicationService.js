import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const APPLICATION_COLLECTION = 'coachApplications';

export const APPLICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

/**
 * Submit a new coach application.
 */
export const submitCoachApplication = async (applicationData) => {
  const docRef = await addDoc(collection(db, APPLICATION_COLLECTION), {
    ...applicationData,
    status: APPLICATION_STATUS.PENDING,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: '',
  });

  return docRef.id;
};

/**
 * Get all coach applications (admin view).
 */
export const getAllApplications = async () => {
  const q = query(
    collection(db, APPLICATION_COLLECTION),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.() || null,
    updatedAt: d.data().updatedAt?.toDate?.() || null,
    reviewedAt: d.data().reviewedAt?.toDate?.() || null,
  }));
};

/**
 * Get applications by status.
 */
export const getApplicationsByStatus = async (status) => {
  const q = query(
    collection(db, APPLICATION_COLLECTION),
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.() || null,
  }));
};

/**
 * Update application status (approve/reject).
 */
export const updateApplicationStatus = async (applicationId, status, reviewedByUid, reviewNote = '') => {
  await updateDoc(doc(db, APPLICATION_COLLECTION, applicationId), {
    status,
    reviewedBy: reviewedByUid,
    reviewedAt: serverTimestamp(),
    reviewNote,
    updatedAt: serverTimestamp(),
  });
};

