import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * Buat notifikasi baru di Firestore
 */
export const createNotification = async ({
  type = 'SESSION_COMPLETED',
  title = '',
  message = '',
  bookingId = null,
  coachId = null,
  coachName = '',
  targetRole = 'admin',
  userId = null,
  metadata = {},
}) => {
  try {
    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      type,
      title,
      message,
      bookingId,
      coachId,
      coachName,
      targetRole,
      userId,
      read: false,
      createdAt: serverTimestamp(),
      ...metadata,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Berlangganan (realtime listener) notifikasi untuk role tertentu (Admin / Member / Coach)
 * Menggunakan onSnapshot agar update seketika saat ada event
 */
export const subscribeToNotifications = (targetRole, callback, userId = null) => {
  let q;
  if (targetRole === 'member' && userId) {
    q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('targetRole', '==', 'member'),
      where('userId', '==', userId)
    );
  } else {
    q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('targetRole', '==', targetRole)
    );
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate() : new Date(),
      }));

      // Urutkan dari notifikasi terbaru di sisi client (menghindari composite index)
      notifications.sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return timeB - timeA;
      });

      callback(notifications);
    },
    (error) => {
      console.error('Error listening to notifications:', error);
      callback([]);
    }
  );
};

/**
 * Tandai notifikasi tertentu sebagai telah dibaca
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(docRef, {
      read: true,
      readAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

/**
 * Tandai seluruh notifikasi unread milik role tertentu sebagai telah dibaca
 */
export const markAllNotificationsAsRead = async (targetRole, userId = null) => {
  try {
    let q;
    if (targetRole === 'member' && userId) {
      q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('targetRole', '==', 'member'),
        where('userId', '==', userId),
        where('read', '==', false)
      );
    } else {
      q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('targetRole', '==', targetRole),
        where('read', '==', false)
      );
    }
    const snap = await getDocs(q);
    const promises = snap.docs.map((d) =>
      updateDoc(doc(db, NOTIFICATIONS_COLLECTION, d.id), {
        read: true,
        readAt: serverTimestamp(),
      })
    );
    await Promise.all(promises);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
};

