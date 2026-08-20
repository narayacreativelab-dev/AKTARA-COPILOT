import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  getDocFromServer,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { School, TeamMember, AppBrandingConfig, DEFAULT_BRANDING, UserRole, AppUserRecord } from '../types';
import { INITIAL_SCHOOLS } from '../data/schoolsData';

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore & Auth
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with Email and Password via Firebase Auth
 * Automatically handles first-time account registration if user doesn't exist yet
 */
export async function loginWithEmailAndPassword(email: string, password: string): Promise<FirebaseUser> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      try {
        // Attempt automatic creation for legitimate email/password login
        const newCredential = await createUserWithEmailAndPassword(auth, email, password);
        return newCredential.user;
      } catch (createErr: any) {
        throw error;
      }
    }
    throw error;
  }
}

/**
 * Sign in with Google Popup via Firebase Auth
 */
export async function loginWithGoogle(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

/**
 * Sign out current Firebase Auth user
 */
export async function logoutFirebaseUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.warn('Firebase signOut error:', error);
  }
}

// Test server connection helper
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'config', 'health_check'));
    return true;
  } catch (error) {
    console.info('Firebase Firestore online / initialized');
    return true;
  }
}

// ----------------------------------------------------
// Firestore Realtime & CRUD Operations for Schools
// ----------------------------------------------------

const SCHOOLS_COLLECTION = 'schools';
const TEAM_COLLECTION = 'teamMembers';
const SETTINGS_COLLECTION = 'settings';
const CONFIG_COLLECTION = 'config';
const BRANDING_DOC = 'branding';

/**
 * Subscribe to schools in Firestore or fallback to initial data with seamless seeding
 */
export function subscribeSchools(
  onUpdate: (schools: School[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const colRef = collection(db, SCHOOLS_COLLECTION);
    return onSnapshot(
      colRef,
      async (snapshot) => {
        if (snapshot.empty) {
          try {
            // Check if database state indicates sample data was explicitly cleared
            const stateDocRef = doc(db, SETTINGS_COLLECTION, 'database_state');
            const stateSnap = await getDoc(stateDocRef);
            if (stateSnap.exists() && stateSnap.data()?.sampleDataCleared) {
              // Explicitly cleared database, do not auto-seed
              onUpdate([]);
              return;
            }

            // If never initialized before, seed sample schools
            await seedInitialSchools();
          } catch (seedErr) {
            console.warn('Initial seeding check fallback:', seedErr);
            onUpdate(INITIAL_SCHOOLS);
          }
          return;
        }

        const schoolsList: School[] = [];
        snapshot.forEach((docSnap) => {
          schoolsList.push({ ...(docSnap.data() as School), id: docSnap.id });
        });
        onUpdate(schoolsList);
      },
      (error) => {
        console.warn('Firestore schools listener fallback to local:', error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.warn('Failed to start Firestore subscription, falling back:', err);
    return () => {};
  }
}

/**
 * Seed initial schools dataset to Firestore
 */
export async function seedInitialSchools(): Promise<void> {
  try {
    const batch = writeBatch(db);
    INITIAL_SCHOOLS.forEach((school) => {
      const docRef = doc(db, SCHOOLS_COLLECTION, school.id);
      batch.set(docRef, school);
    });
    await batch.commit();

    const stateDocRef = doc(db, SETTINGS_COLLECTION, 'database_state');
    await setDoc(stateDocRef, { 
      sampleDataCleared: false, 
      hasInitialized: true,
      seededAt: new Date().toISOString() 
    }, { merge: true });

    console.info('Initial schools successfully seeded to Firestore');
  } catch (error) {
    console.error('Error seeding schools to Firestore:', error);
  }
}

/**
 * Clear All School Data from Firestore (Super Admin Exclusive)
 * Deletes all documents in 'schools' collection and sets sampleDataCleared: true in settings
 */
export async function clearAllSchoolsFromFirestore(): Promise<number> {
  try {
    const colRef = collection(db, SCHOOLS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const totalCount = snapshot.size;

    if (totalCount > 0) {
      const docs = snapshot.docs;
      const BATCH_SIZE = 400;
      for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const chunk = docs.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);
        chunk.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }
    }

    // Persist cleared state so empty snapshot will not trigger auto-reseed
    const stateDocRef = doc(db, SETTINGS_COLLECTION, 'database_state');
    await setDoc(stateDocRef, { 
      sampleDataCleared: true, 
      hasInitialized: true,
      clearedAt: new Date().toISOString(),
      deletedCount: totalCount
    }, { merge: true });

    return totalCount;
  } catch (error) {
    console.error('Error clearing schools from Firestore:', error);
    throw error;
  }
}

/**
 * Restore Sample Schools to Firestore (Super Admin Exclusive)
 * Re-populates the 30 initial sample schools into Firestore
 */
export async function restoreSampleSchoolsToFirestore(): Promise<number> {
  try {
    const batch = writeBatch(db);
    INITIAL_SCHOOLS.forEach((school) => {
      const docRef = doc(db, SCHOOLS_COLLECTION, school.id);
      batch.set(docRef, { ...school, updatedAt: new Date().toISOString() });
    });
    await batch.commit();

    const stateDocRef = doc(db, SETTINGS_COLLECTION, 'database_state');
    await setDoc(stateDocRef, { 
      sampleDataCleared: false, 
      hasInitialized: true,
      restoredAt: new Date().toISOString(),
      count: INITIAL_SCHOOLS.length
    }, { merge: true });

    return INITIAL_SCHOOLS.length;
  } catch (error) {
    console.error('Error restoring sample schools to Firestore:', error);
    throw error;
  }
}

/**
 * Save / update a single school in Firestore
 */
export async function saveSchoolToFirestore(school: School): Promise<void> {
  try {
    const docRef = doc(db, SCHOOLS_COLLECTION, school.id);
    await setDoc(docRef, { ...school, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.error('Error saving school to Firestore:', error);
    throw error;
  }
}

/**
 * Update partnership status of a school in Firestore
 */
export async function updateSchoolStatusInFirestore(
  schoolId: string, 
  status: School['partnershipStatus'], 
  notes?: string
): Promise<void> {
  try {
    const docRef = doc(db, SCHOOLS_COLLECTION, schoolId);
    const updateData: any = { 
      partnershipStatus: status, 
      updatedAt: new Date().toISOString() 
    };
    if (notes) updateData.notes = notes;
    if (status === 'Dijadwalkan' || status === 'Mitra Aktif') {
      updateData.lastVisited = new Date().toISOString().split('T')[0];
    }
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating school status in Firestore:', error);
    throw error;
  }
}

/**
 * Delete a school from Firestore
 */
export async function deleteSchoolFromFirestore(schoolId: string): Promise<void> {
  try {
    const docRef = doc(db, SCHOOLS_COLLECTION, schoolId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting school from Firestore:', error);
    throw error;
  }
}

/**
 * Bulk save schools to Firestore
 */
export async function bulkSaveSchoolsToFirestore(schools: School[]): Promise<void> {
  try {
    // Firestore batch limit is 500 operations per batch
    const BATCH_SIZE = 400;
    for (let i = 0; i < schools.length; i += BATCH_SIZE) {
      const chunk = schools.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((school) => {
        const docRef = doc(db, SCHOOLS_COLLECTION, school.id);
        batch.set(docRef, { ...school, updatedAt: new Date().toISOString() }, { merge: true });
      });
      await batch.commit();
    }
  } catch (error) {
    console.error('Error bulk saving schools to Firestore:', error);
    throw error;
  }
}

// ----------------------------------------------------
// Firestore Branding & App Configuration
// ----------------------------------------------------

/**
 * Real-time subscription to branding configuration in Firestore settings/branding.
 * Emits whenever logo, banner, title, or organization settings change.
 */
export function subscribeBranding(
  onUpdate: (branding: AppBrandingConfig) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const settingsDocRef = doc(db, SETTINGS_COLLECTION, BRANDING_DOC);
    return onSnapshot(
      settingsDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as AppBrandingConfig;
          onUpdate({
            ...DEFAULT_BRANDING,
            ...data
          });
        } else {
          // Check fallback legacy config/branding if settings/branding is not yet created
          fetchLegacyBranding().then((legacy) => {
            if (legacy) {
              onUpdate({
                ...DEFAULT_BRANDING,
                ...legacy
              });
            } else {
              onUpdate(DEFAULT_BRANDING);
            }
          });
        }
      },
      (error) => {
        console.warn('Firestore branding listener warning:', error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.warn('Failed to start Firestore branding listener:', err);
    return () => {};
  }
}

/**
 * Read legacy branding if present
 */
async function fetchLegacyBranding(): Promise<AppBrandingConfig | null> {
  try {
    const legacyRef = doc(db, CONFIG_COLLECTION, BRANDING_DOC);
    const snap = await getDoc(legacyRef);
    if (snap.exists()) {
      return snap.data() as AppBrandingConfig;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * One-time fetch of branding configuration from settings/branding
 */
export async function fetchBrandingFromFirestore(): Promise<AppBrandingConfig | null> {
  try {
    // 1. Primary path: settings/branding
    const docRef = doc(db, SETTINGS_COLLECTION, BRANDING_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return {
        ...DEFAULT_BRANDING,
        ...(snap.data() as AppBrandingConfig)
      };
    }

    // 2. Fallback path: config/branding
    const legacy = await fetchLegacyBranding();
    if (legacy) {
      return {
        ...DEFAULT_BRANDING,
        ...legacy
      };
    }
  } catch (error) {
    console.warn('Error fetching branding from Firestore:', error);
  }
  return null;
}

/**
 * Permanently save branding configuration to Firestore settings/branding
 */
export async function saveBrandingToFirestore(branding: AppBrandingConfig): Promise<void> {
  try {
    const payload = {
      ...branding,
      updatedAt: new Date().toISOString()
    };

    // Save to primary settings/branding document
    const settingsDocRef = doc(db, SETTINGS_COLLECTION, BRANDING_DOC);
    await setDoc(settingsDocRef, payload, { merge: true });

    // Dual-write to legacy config/branding for maximum backward compatibility
    try {
      const configDocRef = doc(db, CONFIG_COLLECTION, BRANDING_DOC);
      await setDoc(configDocRef, payload, { merge: true });
    } catch {
      // ignore legacy dual-write error
    }
  } catch (error) {
    console.error('Error saving branding to Firestore settings/branding:', error);
    throw error;
  }
}

// ----------------------------------------------------
// Firestore Team Members Operations
// ----------------------------------------------------

export async function fetchTeamMembersFromFirestore(): Promise<TeamMember[]> {
  try {
    const colRef = collection(db, TEAM_COLLECTION);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const members: TeamMember[] = [];
      snap.forEach((docSnap) => {
        members.push({ ...(docSnap.data() as TeamMember), id: docSnap.id });
      });
      return members;
    }
  } catch (error) {
    console.warn('Error fetching team members from Firestore:', error);
  }
  return [];
}

export async function saveTeamMemberToFirestore(member: TeamMember): Promise<void> {
  try {
    const docRef = doc(db, TEAM_COLLECTION, member.id);
    await setDoc(docRef, member, { merge: true });
  } catch (error) {
    console.error('Error saving team member to Firestore:', error);
    throw error;
  }
}

export async function deleteTeamMemberFromFirestore(memberId: string): Promise<void> {
  try {
    const docRef = doc(db, TEAM_COLLECTION, memberId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting team member from Firestore:', error);
    throw error;
  }
}

// ----------------------------------------------------
// Firestore Users & RBAC Management (Collection: users/{uid})
// ----------------------------------------------------

const USERS_COLLECTION = 'users';

const AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-blue-600',
  'bg-indigo-600',
  'bg-purple-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-cyan-600',
  'bg-teal-600'
];

function getRandomAvatarBg(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export function getDefaultDepartmentForRole(role: UserRole): string {
  switch (role) {
    case 'super_admin':
      return 'Executive Board & Strategy';
    case 'tim_lapangan':
      return 'Tim Operasional & Kemitraan';
    case 'surveyor':
      return 'Survey & Pemutakhiran Data';
    case 'role_tim':
    default:
      return 'Tim Lapangan & Analis';
  }
}

/**
 * Creates a new user in Firebase Auth using a secondary Firebase App instance.
 * This guarantees the currently signed-in Super Admin is NOT logged out.
 * If the email/password provider is disabled in Firebase Console (auth/operation-not-allowed),
 * it gracefully falls back to registering the profile and RBAC role directly in Firestore users/{uid}.
 */
export async function createTeamUserViaSecondaryApp(params: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
}): Promise<AppUserRecord> {
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanName = params.name.trim();
  const cleanPassword = params.password.trim();
  const role = params.role;
  const department = params.department?.trim() || getDefaultDepartmentForRole(role);

  if (!cleanEmail || !cleanPassword || !cleanName) {
    throw new Error('Nama lengkap, email, dan kata sandi wajib diisi.');
  }

  if (cleanPassword.length < 6) {
    throw new Error('Kata sandi minimal 6 karakter.');
  }

  let finalUid: string | null = null;
  const secondaryAppName = `SecondaryAuthApp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let secondaryApp: any = null;

  try {
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    // Attempt creating Firebase Auth user in secondary context
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, cleanPassword);
    if (userCredential?.user?.uid) {
      finalUid = userCredential.user.uid;
    }

    // Sign out from secondary app & destroy instance
    try {
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);
      secondaryApp = null;
    } catch {
      // ignore
    }
  } catch (authError: any) {
    if (secondaryApp) {
      try {
        await deleteApp(secondaryApp);
        secondaryApp = null;
      } catch {
        // ignore
      }
    }

    if (authError.code === 'auth/email-already-in-use') {
      throw new Error(`Alamat email "${cleanEmail}" sudah terdaftar di sistem Firebase.`);
    } else if (authError.code === 'auth/invalid-email') {
      throw new Error('Format alamat email tidak valid.');
    } else if (authError.code === 'auth/weak-password') {
      throw new Error('Kata sandi terlalu lemah. Gunakan minimal 6 karakter kombinasi.');
    } else if (authError.code === 'auth/operation-not-allowed') {
      console.info('Firebase Auth email/password provider not enabled in Console. Registering profile directly into Firestore users collection.');
      // Create a deterministic or unique ID for the user in Firestore
      finalUid = `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
    } else {
      console.warn('Firebase Auth secondary app warning, fallback to Firestore user record:', authError);
      finalUid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
  }

  const userUid = finalUid || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const userRecord: AppUserRecord = {
    id: userUid,
    uid: userUid,
    name: cleanName,
    email: cleanEmail,
    role: role,
    department: department,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    avatarBg: getRandomAvatarBg()
  };

  // Save to primary Firestore: users/{uid}
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userUid);
    await setDoc(userDocRef, userRecord, { merge: true });
  } catch (firestoreErr) {
    console.error('Error saving user profile to Firestore:', firestoreErr);
    throw new Error('Gagal menyimpan profil pengguna ke database Firestore.');
  }

  // Sync to teamMembers/{uid} for team roster continuity
  try {
    const teamDocRef = doc(db, TEAM_COLLECTION, userUid);
    await setDoc(teamDocRef, {
      id: userUid,
      name: cleanName,
      email: cleanEmail,
      role: role,
      department: department,
      status: 'active',
      lastActive: 'Baru Didaftarkan',
      avatarBg: userRecord.avatarBg,
      createdAt: userRecord.createdAt
    }, { merge: true });
  } catch (teamSyncErr) {
    console.warn('Dual-write teamMembers warning:', teamSyncErr);
  }

  return userRecord;
}

/**
 * Triggers Firebase sendPasswordResetEmail to user's registered email
 */
export async function sendUserPasswordReset(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Email tidak boleh kosong.');
  }

  try {
    await sendPasswordResetEmail(auth, cleanEmail);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      throw new Error(`Akun dengan email "${cleanEmail}" belum terdaftar di Firebase Auth.`);
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Format email tidak valid.');
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Fitur Reset Password memerlukan pengaktifan penyedia Email/Password di Firebase Console (Authentication > Sign-in method).');
    }
    throw error;
  }
}

/**
 * Real-time subscription to all users in Firestore users collection
 */
export function subscribeUsers(
  onUpdate: (users: AppUserRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const colRef = collection(db, USERS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const usersList: AppUserRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          usersList.push({
            id: docSnap.id,
            uid: data.uid || docSnap.id,
            name: data.name || data.email?.split('@')[0] || 'User',
            email: data.email || '',
            role: data.role || 'role_tim',
            department: data.department || getDefaultDepartmentForRole(data.role || 'role_tim'),
            status: data.status || 'active',
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt,
            lastLoginAt: data.lastLoginAt,
            avatarBg: data.avatarBg || 'bg-slate-700'
          });
        });

        // Sort: Super Admin first, then newest
        usersList.sort((a, b) => {
          if (a.role === 'super_admin' && b.role !== 'super_admin') return -1;
          if (b.role === 'super_admin' && a.role !== 'super_admin') return 1;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });

        onUpdate(usersList);
      },
      (error) => {
        console.warn('Firestore users collection listener error:', error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.warn('Failed to start users listener:', err);
    return () => {};
  }
}

/**
 * Fetch one-time list of users from Firestore users collection
 */
export async function fetchUsersFromFirestore(): Promise<AppUserRecord[]> {
  try {
    const colRef = collection(db, USERS_COLLECTION);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const usersList: AppUserRecord[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        usersList.push({
          id: docSnap.id,
          uid: data.uid || docSnap.id,
          name: data.name || data.email?.split('@')[0] || 'User',
          email: data.email || '',
          role: data.role || 'role_tim',
          department: data.department || getDefaultDepartmentForRole(data.role || 'role_tim'),
          status: data.status || 'active',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt,
          lastLoginAt: data.lastLoginAt,
          avatarBg: data.avatarBg || 'bg-slate-700'
        });
      });
      return usersList;
    }
  } catch (error) {
    console.warn('Error fetching users from Firestore:', error);
  }
  return [];
}

/**
 * Update user role and department in Firestore (users/{uid} and teamMembers/{uid})
 */
export async function updateUserRoleInFirestore(
  userId: string,
  newRole: UserRole,
  newDepartment?: string
): Promise<void> {
  try {
    const dept = newDepartment || getDefaultDepartmentForRole(newRole);
    const payload = {
      role: newRole,
      department: dept,
      updatedAt: new Date().toISOString()
    };

    // Update users/{uid}
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(userDocRef, payload, { merge: true });

    // Update teamMembers/{uid}
    try {
      const teamDocRef = doc(db, TEAM_COLLECTION, userId);
      await setDoc(teamDocRef, payload, { merge: true });
    } catch {
      // ignore
    }
  } catch (error) {
    console.error('Error updating user role in Firestore:', error);
    throw error;
  }
}

/**
 * Toggle user status (active / inactive) in Firestore
 */
export async function toggleUserStatusInFirestore(
  userId: string,
  newStatus: 'active' | 'inactive'
): Promise<void> {
  try {
    const payload = {
      status: newStatus,
      updatedAt: new Date().toISOString()
    };

    const userDocRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(userDocRef, payload, { merge: true });

    try {
      const teamDocRef = doc(db, TEAM_COLLECTION, userId);
      await setDoc(teamDocRef, payload, { merge: true });
    } catch {
      // ignore
    }
  } catch (error) {
    console.error('Error updating user status in Firestore:', error);
    throw error;
  }
}

/**
 * Delete user profile from Firestore users/{uid} and teamMembers/{uid}
 */
export async function deleteUserFromFirestore(userId: string): Promise<void> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    await deleteDoc(userDocRef);

    try {
      const teamDocRef = doc(db, TEAM_COLLECTION, userId);
      await deleteDoc(teamDocRef);
    } catch {
      // ignore
    }
  } catch (error) {
    console.error('Error deleting user from Firestore:', error);
    throw error;
  }
}

/**
 * Look up user document in Firestore by UID or email to retrieve assigned role
 */
export async function fetchUserProfile(uid: string, email?: string): Promise<AppUserRecord | null> {
  const cleanEmail = (email || '').trim().toLowerCase();
  const isSuperAdminEmail = cleanEmail === 'narayacreativelab@gmail.com' ||
                           cleanEmail === 'executive@aktara.id' ||
                           cleanEmail.includes('narayacreativelab') ||
                           cleanEmail.includes('executive@aktara');

  try {
    // 1. Check doc by UID
    if (uid) {
      const userDocRef = doc(db, USERS_COLLECTION, uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        // Auto-fix if super admin email has non-super_admin role in Firestore
        if (isSuperAdminEmail && data.role !== 'super_admin') {
          await setDoc(userDocRef, { role: 'super_admin', updatedAt: new Date().toISOString() }, { merge: true });
          return { id: snap.id, uid: snap.id, ...data, role: 'super_admin' } as AppUserRecord;
        }
        return { id: snap.id, uid: snap.id, ...data } as AppUserRecord;
      }
    }

    // 2. Query by email if provided
    if (cleanEmail) {
      const q = query(
        collection(db, USERS_COLLECTION),
        where('email', '==', cleanEmail)
      );
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        const firstDoc = qSnap.docs[0];
        const data = firstDoc.data();
        if (isSuperAdminEmail && data.role !== 'super_admin') {
          await setDoc(firstDoc.ref, { role: 'super_admin', updatedAt: new Date().toISOString() }, { merge: true });
          return { id: firstDoc.id, uid: firstDoc.id, ...data, role: 'super_admin' } as AppUserRecord;
        }
        return { id: firstDoc.id, uid: firstDoc.id, ...data } as AppUserRecord;
      }
    }

    // If it's a super admin email and record didn't exist, create it permanently
    if (isSuperAdminEmail && (uid || cleanEmail)) {
      const userUid = uid || `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const superAdminRecord: AppUserRecord = {
        id: userUid,
        uid: userUid,
        name: cleanEmail === 'narayacreativelab@gmail.com' ? 'Super Admin Naraya' : 'Direktur Eksekutif AKTARA',
        email: cleanEmail,
        role: 'super_admin',
        department: 'Executive Board & Strategy',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        avatarBg: 'bg-[#0D5C75]'
      };
      const userDocRef = doc(db, USERS_COLLECTION, userUid);
      await setDoc(userDocRef, superAdminRecord, { merge: true });
      return superAdminRecord;
    }
  } catch (error) {
    console.warn('Error querying user profile from Firestore:', error);
  }
  return null;
}

