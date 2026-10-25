import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const profile = { uid, ...userDoc.data() };
        setUserProfile(profile);
        return profile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Register with email/password (supports both positional args and object payload)
  const register = async (emailOrData, passwordArg, displayNameArg, phoneArg) => {
    let email, password, displayName, phone, role;
    if (typeof emailOrData === 'object' && emailOrData !== null) {
      email = emailOrData.email;
      password = emailOrData.password;
      displayName = emailOrData.name || emailOrData.displayName || '';
      phone = emailOrData.phone || '';
      role = emailOrData.role || ROLES.MEMBER;
    } else {
      email = emailOrData;
      password = passwordArg;
      displayName = displayNameArg || '';
      phone = phoneArg || '';
      role = ROLES.MEMBER;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (displayName) {
      await updateProfile(user, { displayName });
    }

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email,
      displayName,
      phone: phone || '',
      address: '',
      photoURL: '',
      role: role || ROLES.MEMBER,
      joinDate: serverTimestamp(),
      isActive: true,
      membershipType: role === ROLES.ADMIN ? 'admin' : (role === ROLES.COACH ? 'coach' : 'basic'),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await fetchUserProfile(user.uid);
    return user;
  };

  // Login with email/password
  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await fetchUserProfile(userCredential.user.uid);
    return userCredential.user;
  };

  // Login with Google
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user profile exists, if not create one
    const existingProfile = await fetchUserProfile(user.uid);
    if (!existingProfile) {
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName || '',
        phone: user.phoneNumber || '',
        address: '',
        photoURL: user.photoURL || '',
        role: ROLES.MEMBER,
        joinDate: serverTimestamp(),
        isActive: true,
        membershipType: 'basic',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await fetchUserProfile(user.uid);
    }

    return user;
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
  };

  // Update foto profil (tersimpan di Firestore & Auth)
  const updateProfilePhoto = async (photoUrl) => {
    if (!currentUser) throw new Error('Pengguna belum login.');

    // 1. Sinkronisasi ke profil Firebase Auth
    try {
      await updateProfile(currentUser, { photoURL: photoUrl || '' });
    } catch (authErr) {
      console.warn('Peringatan saat sinkronisasi photoURL Firebase Auth:', authErr);
    }

    // 2. Simpan permanen ke dokumen Firestore users
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
      photoURL: photoUrl || '',
      updatedAt: serverTimestamp(),
    });

    // 3. Muat ulang profil terbaru ke state aplikasi
    return await fetchUserProfile(currentUser.uid);
  };

  // Update informasi teks profil pengguna (nama, no. hp, spesialisasi, dll)
  const updateProfileDetails = async (details) => {
    if (!currentUser) throw new Error('Pengguna belum login.');

    if (details.displayName && details.displayName !== currentUser.displayName) {
      try {
        await updateProfile(currentUser, { displayName: details.displayName });
      } catch (authErr) {
        console.warn('Peringatan saat sinkronisasi displayName Firebase Auth:', authErr);
      }
    }

    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
      ...details,
      updatedAt: serverTimestamp(),
    });

    return await fetchUserProfile(currentUser.uid);
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    register,
    login,
    loginWithGoogle,
    logout,
    fetchUserProfile,
    updateProfilePhoto,
    updateProfileDetails,
    isAdmin: userProfile?.role === ROLES.ADMIN,
    isCoach: userProfile?.role === ROLES.COACH,
    isMember: userProfile?.role === ROLES.MEMBER,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
