import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION = 'coachSchedules';

// Get schedule for a specific coach
export const getCoachSchedule = async (coachId) => {
  const q = query(
    collection(db, COLLECTION),
    where('coachId', '==', coachId),
    orderBy('dayOfWeek')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Add a schedule slot for a coach
export const addCoachSchedule = async (scheduleData) => {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...scheduleData,
    isAvailable: true,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// Update a schedule slot
export const updateCoachSchedule = async (scheduleId, data) => {
  const docRef = doc(db, COLLECTION, scheduleId);
  await updateDoc(docRef, data);
};

// Delete a schedule slot
export const deleteCoachSchedule = async (scheduleId) => {
  await deleteDoc(doc(db, COLLECTION, scheduleId));
};

// Get available coaches for a specific day and time
export const getAvailableCoaches = async (dayOfWeek, startTime, endTime) => {
  const q = query(
    collection(db, COLLECTION),
    where('dayOfWeek', '==', dayOfWeek),
    where('isAvailable', '==', true)
  );
  const snapshot = await getDocs(q);
  const schedules = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // Filter coaches whose schedule covers the requested time
  return schedules.filter(
    (schedule) => schedule.startTime <= startTime && schedule.endTime >= endTime
  );
};

