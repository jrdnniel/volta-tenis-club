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
  runTransaction,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { BOOKING_STATUS } from '../utils/constants';
import { isTimeOverlap } from '../utils/validators';

const COLLECTION = 'bookings';

/**
 * Create a new booking with anti-double-booking protection.
 * Uses Firestore Transaction to ensure atomic check-and-create.
 */
export const createBooking = async (bookingData) => {
  const { courtId, date, startTime, endTime, coachId } = bookingData;

  return await runTransaction(db, async (transaction) => {
    // 1. Check for court time conflicts
    const courtBookingsRef = collection(db, COLLECTION);
    const courtQuery = query(
      courtBookingsRef,
      where('courtId', '==', courtId),
      where('date', '==', date),
      where('status', '==', BOOKING_STATUS.CONFIRMED)
    );

    const courtSnapshot = await getDocs(courtQuery);
    const existingBookings = courtSnapshot.docs.map((doc) => doc.data());

    // Check for time overlap
    const courtConflict = existingBookings.find((booking) =>
      isTimeOverlap(startTime, endTime, booking.startTime, booking.endTime)
    );

    if (courtConflict) {
      throw new Error(
        `Slot ${startTime}-${endTime} sudah dipesan untuk lapangan ini. Silakan pilih waktu lain.`
      );
    }

    // 2. Check for coach time conflicts (if coach is selected)
    if (coachId) {
      const coachQuery = query(
        courtBookingsRef,
        where('coachId', '==', coachId),
        where('date', '==', date),
        where('status', '==', BOOKING_STATUS.CONFIRMED)
      );

      const coachSnapshot = await getDocs(coachQuery);
      const coachBookings = coachSnapshot.docs.map((doc) => doc.data());

      const coachConflict = coachBookings.find((booking) =>
        isTimeOverlap(startTime, endTime, booking.startTime, booking.endTime)
      );

      if (coachConflict) {
        throw new Error(
          `Coach tidak tersedia pada ${startTime}-${endTime}. Silakan pilih waktu atau coach lain.`
        );
      }
    }

    // 3. No conflicts — create the booking
    const newBookingRef = doc(collection(db, COLLECTION));
    transaction.set(newBookingRef, {
      ...bookingData,
      status: BOOKING_STATUS.CONFIRMED,
      createdAt: serverTimestamp(),
    });

    return newBookingRef.id;
  });
};

// Get all bookings for a specific date
export const getBookingsByDate = async (date) => {
  const q = query(
    collection(db, COLLECTION),
    where('date', '==', date),
    where('status', '==', BOOKING_STATUS.CONFIRMED),
    orderBy('startTime')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Get bookings for a specific court on a specific date
export const getBookingsByCourtAndDate = async (courtId, date) => {
  const q = query(
    collection(db, COLLECTION),
    where('courtId', '==', courtId),
    where('date', '==', date),
    where('status', '==', BOOKING_STATUS.CONFIRMED),
    orderBy('startTime')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Get my bookings
export const getMyBookings = async (userId) => {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Cancel a booking
export const cancelBooking = async (bookingId) => {
  const docRef = doc(db, COLLECTION, bookingId);
  await updateDoc(docRef, {
    status: BOOKING_STATUS.CANCELLED,
  });
};

// Get all courts
export const getAllCourts = async () => {
  const q = query(
    collection(db, 'courts'),
    where('isActive', '==', true)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

