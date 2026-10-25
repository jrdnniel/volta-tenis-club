import {
  collection,
  doc,
  getDocs,
  getDoc,
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
import { createNotification } from './notificationService';

const COLLECTION = 'bookings';

/**
 * Buat sesi pelatihan baru bersama Coach.
 * Lapangan TIDAK dipilih customer, melainkan akan ditentukan oleh Admin.
 */
export const createBooking = async (bookingData) => {
  const { coachId, coachName, date, startTime, endTime } = bookingData;

  return await runTransaction(db, async (transaction) => {
    const bookingsRef = collection(db, COLLECTION);

    // Cek apakah Coach sudah ada jadwal latihan di tanggal dan jam yang sama
    if (coachId) {
      const coachQuery = query(
        bookingsRef,
        where('coachId', '==', coachId),
        where('date', '==', date),
        where('status', '==', BOOKING_STATUS.CONFIRMED)
      );

      const coachSnapshot = await getDocs(coachQuery);
      const existingCoachBookings = coachSnapshot.docs.map((d) => d.data());

      const coachConflict = existingCoachBookings.find((booking) =>
        isTimeOverlap(startTime, endTime, booking.startTime, booking.endTime)
      );

      if (coachConflict) {
        throw new Error(
          `Pelatih ${coachName || ''} sudah memiliki sesi latihan pada jam ${startTime} - ${endTime}. Silakan pilih jam lain.`
        );
      }
    }

    // Jika tidak ada konflik pada pelatih, buat pemesanan sesi latihan
    const newBookingRef = doc(collection(db, COLLECTION));
    transaction.set(newBookingRef, {
      ...bookingData,
      courtId: bookingData.courtId || null,
      courtName: bookingData.courtName || 'Menunggu Penugasan Admin',
      courtStatus: bookingData.courtId ? 'assigned' : 'unassigned',
      status: BOOKING_STATUS.CONFIRMED,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return newBookingRef.id;
  });
};

/**
 * Admin menugaskan / menentukan lapangan untuk suatu sesi latihan.
 * Memeriksa apakah lapangan tersebut sudah dipakai sesi lain di jam yang sama.
 */
export const assignCourtToBooking = async (bookingId, courtId, courtName, date, startTime, endTime, adminUid = null) => {
  return await runTransaction(db, async (transaction) => {
    // Cek apakah lapangan bentrok dengan sesi lain yang sudah ditugaskan
    const bookingsRef = collection(db, COLLECTION);
    const courtQuery = query(
      bookingsRef,
      where('courtId', '==', courtId),
      where('date', '==', date),
      where('status', '==', BOOKING_STATUS.CONFIRMED)
    );

    const courtSnapshot = await getDocs(courtQuery);
    const existingCourtBookings = courtSnapshot.docs
      .filter((d) => d.id !== bookingId)
      .map((d) => d.data());

    const conflict = existingCourtBookings.find((b) =>
      isTimeOverlap(startTime, endTime, b.startTime, b.endTime)
    );

    if (conflict) {
      throw new Error(
        `Lapangan "${courtName}" sudah digunakan untuk sesi lain pada jam ${conflict.startTime} - ${conflict.endTime}. Silakan pilih lapangan lain.`
      );
    }

    const bookingDocRef = doc(db, COLLECTION, bookingId);
    transaction.update(bookingDocRef, {
      courtId,
      courtName,
      courtStatus: 'assigned',
      assignedBy: adminUid,
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
};

// Ambil semua sesi pelatihan pada tanggal tertentu
export const getBookingsByDate = async (date) => {
  const q = query(
    collection(db, COLLECTION),
    where('date', '==', date),
    where('status', '==', BOOKING_STATUS.CONFIRMED)
  );
  const snapshot = await getDocs(q);
  const bookings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  // Urutkan berdasarkan jam mulai tanpa memerlukan composite index
  return bookings.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
};

// Ambil sesi pelatihan milik member tertentu
export const getMyBookings = async (userId) => {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const bookings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  // Urutkan tanggal terbaru & jam di sisi client (menghindari error composite index Firestore)
  return bookings.sort((a, b) => {
    const dateDiff = (b.date || '').localeCompare(a.date || '');
    if (dateDiff !== 0) return dateDiff;
    return (b.startTime || '').localeCompare(a.startTime || '');
  });
};

// Batalkan sesi pelatihan
export const cancelBooking = async (bookingId) => {
  const docRef = doc(db, COLLECTION, bookingId);
  await updateDoc(docRef, {
    status: BOOKING_STATUS.CANCELLED,
    updatedAt: serverTimestamp(),
  });
};

// Ambil semua data lapangan aktif (untuk penugasan oleh Admin)
export const getAllCourts = async () => {
  const q = query(
    collection(db, 'courts'),
    where('isActive', '==', true)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Ambil semua sesi pelatihan yang ditugaskan kepada Coach tertentu
export const getCoachBookings = async (coachId) => {
  const q = query(
    collection(db, COLLECTION),
    where('coachId', '==', coachId)
  );
  const snapshot = await getDocs(q);
  const bookings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return bookings.sort((a, b) => {
    const dateDiff = (b.date || '').localeCompare(a.date || '');
    if (dateDiff !== 0) return dateDiff;
    return (b.startTime || '').localeCompare(a.startTime || '');
  });
};

// Pelatih melapor bahwa sesi pelatihan telah selesai dilaksanakan
export const reportBookingCompleted = async (
  bookingId,
  { coachNotes = '', coachUid, coachName, bookingData = {} }
) => {
  const docRef = doc(db, COLLECTION, bookingId);
  await updateDoc(docRef, {
    status: BOOKING_STATUS.COMPLETED_BY_COACH,
    completedAt: serverTimestamp(),
    completedByCoach: coachUid,
    coachNotes: coachNotes || '',
    coachReady: true,
    updatedAt: serverTimestamp(),
  });

  // Kirim notifikasi realtime ke Admin
  await createNotification({
    type: 'COACH_SESSION_COMPLETED',
    title: 'Pelatih Melaporkan Selesai Melatih',
    message: `Coach ${coachName || 'Pelatih'} telah menyelesaikan sesi latihan bersama ${
      bookingData.userName || 'Member'
    } (${bookingData.date || 'Hari ini'} pukul ${bookingData.startTime || ''} - ${
      bookingData.endTime || ''
    }). Coach kini telah SIAP untuk jadwal berikutnya.`,
    bookingId,
    coachId: coachUid,
    coachName: coachName || 'Pelatih Volta',
    targetRole: 'admin',
    metadata: {
      date: bookingData.date || '',
      startTime: bookingData.startTime || '',
      endTime: bookingData.endTime || '',
      userName: bookingData.userName || '',
      courtName: bookingData.courtName || 'Lapangan Volta',
    },
  });
};

// Admin mengonfirmasi penyelesaian sesi latihan dari laporan pelatih
export const confirmBookingCompletedByAdmin = async (bookingId, adminUid = null) => {
  const docRef = doc(db, COLLECTION, bookingId);
  const updateData = {
    status: BOOKING_STATUS.COMPLETED,
    verifiedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (adminUid) {
    updateData.verifiedByAdmin = adminUid;
  }
  await updateDoc(docRef, updateData);
};
