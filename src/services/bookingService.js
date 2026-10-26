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
 * Member menentukan lapangan: Lapangan Basecamp (Kosek 1/2, Emerald, Karya)
 * atau Lapangan Out Basecamp (dengan deskripsi nama/alamat).
 */
export const createBooking = async (bookingData) => {
  const {
    coachId,
    coachName,
    date,
    startTime,
    endTime,
    courtType = 'basecamp',
    courtId,
    courtName,
  } = bookingData;

  return await runTransaction(db, async (transaction) => {
    const bookingsRef = collection(db, COLLECTION);

    // 1. Cek bentrok pelatih: Pelatih tidak bisa mengajar 2 sesi pada jam yang sama
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

      // 1b. Cek kontinuitas lapangan untuk sesi berurutan (Consecutive Sessions):
      // Jika coach yang sama memiliki sesi tepat sebelum (booking.endTime === startTime)
      // atau tepat sesudah (booking.startTime === endTime):
      // Lapangan HARUS SAMA. Jika di lapangan berbeda, tolak pemesanan karena pelatih tidak bisa pindah tempat tanpa jeda.
      const adjacentSessionDifferentCourt = existingCoachBookings.find((booking) => {
        const isAdjacentBefore = booking.endTime === startTime;
        const isAdjacentAfter = booking.startTime === endTime;
        if (!isAdjacentBefore && !isAdjacentAfter) return false;

        const bCourtType = booking.courtType || (booking.courtId === 'out_basecamp' ? 'out_basecamp' : 'basecamp');
        const reqCourtType = courtType || (courtId === 'out_basecamp' ? 'out_basecamp' : 'basecamp');

        const sameCourt =
          reqCourtType === 'basecamp' && bCourtType === 'basecamp'
            ? booking.courtId === courtId
            : reqCourtType === 'out_basecamp' && bCourtType === 'out_basecamp'
              ? (booking.courtName || '').trim().toLowerCase() === (courtName || '').trim().toLowerCase()
              : false;

        return !sameCourt;
      });

      if (adjacentSessionDifferentCourt) {
        throw new Error(
          `Pelatih ${coachName || ''} memiliki sesi latihan di "${adjacentSessionDifferentCourt.courtName || 'lapangan lain'}" pada jam ${adjacentSessionDifferentCourt.startTime} - ${adjacentSessionDifferentCourt.endTime}. Sesi berurutan dengan pelatih yang sama wajib dilakukan di lapangan yang sama.`
        );
      }
    }

    // 2. Cek kapasitas lapangan Basecamp (Maksimal 2 sesi bersamaan per lapangan)
    // Sesuai aturan: 1 lapangan bisa dipakai oleh 2 coach berbeda dan 2 member berbeda
    if (courtType === 'basecamp' && courtId) {
      const courtQuery = query(
        bookingsRef,
        where('courtId', '==', courtId),
        where('date', '==', date),
        where('status', '==', BOOKING_STATUS.CONFIRMED)
      );

      const courtSnapshot = await getDocs(courtQuery);
      const existingCourtBookings = courtSnapshot.docs
        .map((d) => d.data())
        .filter((b) => isTimeOverlap(startTime, endTime, b.startTime, b.endTime));

      if (existingCourtBookings.length >= 2) {
        throw new Error(
          `Lapangan "${courtName}" sudah mencapai kapasitas maksimal (2 sesi latihan bersamaan) pada jam ${startTime} - ${endTime}. Silakan pilih lapangan lain atau jam lain.`
        );
      }
    }

    // Buat pemesanan sesi latihan dengan lapangan yang sudah ditentukan member
    const newBookingRef = doc(collection(db, COLLECTION));
    transaction.set(newBookingRef, {
      ...bookingData,
      courtStatus: 'assigned',
      status: BOOKING_STATUS.CONFIRMED,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return newBookingRef.id;
  });
};

/**
 * Admin menugaskan / menentukan lapangan untuk suatu sesi latihan.
 * Memeriksa kapasitas lapangan (maksimal 2 sesi latihan bersamaan untuk lapangan basecamp).
 */
export const assignCourtToBooking = async (bookingId, courtId, courtName, date, startTime, endTime, adminUid = null) => {
  return await runTransaction(db, async (transaction) => {
    // Cek apakah lapangan basecamp sudah mencapai kapasitas maks (2 sesi bersamaan)
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

    const overlappingBookings = existingCourtBookings.filter((b) =>
      isTimeOverlap(startTime, endTime, b.startTime, b.endTime)
    );

    if (overlappingBookings.length >= 2) {
      throw new Error(
        `Lapangan "${courtName}" sudah mencapai batas maksimal 2 sesi latihan pada jam ${startTime} - ${endTime}. Silakan pilih lapangan lain.`
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
