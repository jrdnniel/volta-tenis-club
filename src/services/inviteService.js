import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const INVITE_COLLECTION = 'inviteTokens';

/**
 * Generate random token string (16 chars hex).
 */
const generateTokenCode = () => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Create a new invite token.
 * @param {string} createdByUid - UID of admin who created this token
 * @param {string} role - Target role: 'admin' or 'coach'
 * @param {number} expiresInHours - Hours until expiration (default 72)
 * @returns {Object} { id, code, role, ... }
 */
export const createInviteToken = async (createdByUid, role, expiresInHours = 72) => {
  const code = generateTokenCode();
  const expiresAt = Timestamp.fromDate(
    new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
  );

  const docRef = await addDoc(collection(db, INVITE_COLLECTION), {
    code,
    role,
    createdBy: createdByUid,
    createdAt: serverTimestamp(),
    expiresAt,
    isUsed: false,
    usedBy: null,
    usedAt: null,
  });

  return { id: docRef.id, code, role, expiresAt: expiresAt.toDate() };
};

/**
 * Validate an invite token code.
 * @param {string} code - The token code from URL
 * @returns {Object|null} Token data if valid, null if invalid/expired/used
 */
export const validateInviteToken = async (code) => {
  const q = query(
    collection(db, INVITE_COLLECTION),
    where('code', '==', code),
    where('isUsed', '==', false)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const tokenDoc = snapshot.docs[0];
  const data = tokenDoc.data();

  // Check expiration
  if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
    return null;
  }

  return { id: tokenDoc.id, ...data };
};

/**
 * Mark a token as used after successful registration.
 * @param {string} tokenId - Firestore doc ID
 * @param {string} usedByUid - UID of user who used this token
 */
export const markTokenUsed = async (tokenId, usedByUid = null) => {
  await updateDoc(doc(db, INVITE_COLLECTION, tokenId), {
    isUsed: true,
    usedBy: usedByUid,
    usedAt: serverTimestamp(),
  });
};

/**
 * Alias for markTokenUsed. If passed a code instead of an ID, finds and marks the doc.
 */
export const markInviteUsed = async (tokenIdOrCode, usedByUid = null) => {
  try {
    await markTokenUsed(tokenIdOrCode, usedByUid);
  } catch {
    // If not a doc id, search by code
    const q = query(
      collection(db, INVITE_COLLECTION),
      where('code', '==', tokenIdOrCode)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      await markTokenUsed(snapshot.docs[0].id, usedByUid);
    }
  }
};

export const verifyInvite = validateInviteToken;
export const getInviteByToken = validateInviteToken;

/**
 * Get all invite tokens created by a specific admin.
 * @param {string} adminUid - Admin UID
 * @returns {Array} List of tokens
 */
export const getInviteTokensByAdmin = async (adminUid) => {
  const q = query(
    collection(db, INVITE_COLLECTION),
    where('createdBy', '==', adminUid),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.() || null,
    expiresAt: d.data().expiresAt?.toDate?.() || null,
    usedAt: d.data().usedAt?.toDate?.() || null,
  }));
};

/**
 * Get all invite tokens (admin view).
 */
export const getAllInviteTokens = async () => {
  const q = query(
    collection(db, INVITE_COLLECTION),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.() || null,
    expiresAt: d.data().expiresAt?.toDate?.() || null,
    usedAt: d.data().usedAt?.toDate?.() || null,
  }));
};

