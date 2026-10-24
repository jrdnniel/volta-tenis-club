import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { DUES_STATUS } from '../utils/constants';

const DUES_COLLECTION = 'dues';
const PAYMENTS_COLLECTION = 'payments';

// Generate monthly dues for all active members
export const generateMonthlyDues = async (year, month, amount, members) => {
  const results = [];

  for (const member of members) {
    const duesId = `${member.uid}_${year}_${String(month).padStart(2, '0')}`;
    const docRef = doc(db, DUES_COLLECTION, duesId);
    const existing = await getDoc(docRef);

    if (!existing.exists()) {
      await setDoc(docRef, {
        userId: member.uid,
        userName: member.displayName,
        year,
        month,
        amount,
        amountPaid: 0,
        status: DUES_STATUS.UNPAID,
        paidAt: null,
        createdAt: serverTimestamp(),
      });
      results.push(duesId);
    }
  }

  return results;
};

// Get dues for a specific user
export const getUserDues = async (userId) => {
  const q = query(
    collection(db, DUES_COLLECTION),
    where('userId', '==', userId),
    orderBy('year', 'desc'),
    orderBy('month', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Get all dues with a specific status
export const getDuesByStatus = async (status) => {
  const q = query(
    collection(db, DUES_COLLECTION),
    where('status', '==', status),
    orderBy('year', 'desc'),
    orderBy('month', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Get dues for a specific period
export const getDuesByPeriod = async (year, month) => {
  const q = query(
    collection(db, DUES_COLLECTION),
    where('year', '==', year),
    where('month', '==', month)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Record a payment
export const recordPayment = async (paymentData) => {
  // Add payment record
  const paymentRef = await addDoc(collection(db, PAYMENTS_COLLECTION), {
    ...paymentData,
    verificationStatus: 'pending',
    verifiedBy: null,
    paidAt: serverTimestamp(),
  });

  // Update dues amount paid
  const duesRef = doc(db, DUES_COLLECTION, paymentData.duesId);
  const duesDoc = await getDoc(duesRef);

  if (duesDoc.exists()) {
    const duesData = duesDoc.data();
    const newAmountPaid = (duesData.amountPaid || 0) + paymentData.amount;
    const newStatus =
      newAmountPaid >= duesData.amount ? DUES_STATUS.PAID : DUES_STATUS.PARTIAL;

    await updateDoc(duesRef, {
      amountPaid: newAmountPaid,
      status: newStatus,
      paidAt: newStatus === DUES_STATUS.PAID ? serverTimestamp() : null,
    });
  }

  return paymentRef.id;
};

// Get payment history for a user
export const getUserPayments = async (userId) => {
  const q = query(
    collection(db, PAYMENTS_COLLECTION),
    where('userId', '==', userId),
    orderBy('paidAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Verify a payment (admin)
export const verifyPayment = async (paymentId, adminUid, status) => {
  const docRef = doc(db, PAYMENTS_COLLECTION, paymentId);
  await updateDoc(docRef, {
    verificationStatus: status,
    verifiedBy: adminUid,
  });
};

// Get pending payments (admin)
export const getPendingPayments = async () => {
  const q = query(
    collection(db, PAYMENTS_COLLECTION),
    where('verificationStatus', '==', 'pending'),
    orderBy('paidAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

