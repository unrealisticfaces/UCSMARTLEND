import { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail, 
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential 
} from 'firebase/auth';
import { ref, onValue, set, update, remove, get } from 'firebase/database';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [genres, setGenres] = useState([]); 
  
  const [user, setUser] = useState(null); 
  const [isDarkMode, setIsDarkMode] = useState(false); 
  const [toast, setToast] = useState(null);
  
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  
  // FIXED: Separated initial auth loading from button loading
  const [isLoading, setIsLoading] = useState(false); 
  const [isAuthReady, setIsAuthReady] = useState(false); 
  
  const [hasAdmin, setHasAdmin] = useState(false);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const snap = await get(ref(db, 'users'));
        if (snap.exists()) setHasAdmin(Object.values(snap.val()).some(u => u.role === 'admin'));
      } catch (e) { setHasAdmin(true); }
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    const usersRef = ref(db, 'users');
    const unsubUsers = onValue(usersRef, (snap) => {
      if (snap.exists()) {
        const usersArray = [];
        snap.forEach((childSnap) => { usersArray.push({ uid: childSnap.key, ...childSnap.val() }); });
        setUsersList(usersArray);
        setHasAdmin(usersArray.some(u => u.role === 'admin'));
      } else {
        setUsersList([]);
        setHasAdmin(false);
      }
    });
    return () => unsubUsers();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        const userRef = ref(db, `users/${authUser.uid}`);
        const snap = await get(userRef);
        
        if (snap.exists()) {
          setUser({ uid: authUser.uid, ...snap.val() });
          onValue(userRef, (s) => { if (s.exists()) setUser({ uid: authUser.uid, ...s.val() }); });
          onValue(ref(db, 'inventory'), (s) => setInventory(s.val() ? Object.values(s.val()) : []));
          onValue(ref(db, 'transactions'), (s) => setTransactions(s.val() ? Object.values(s.val()).sort((a, b) => b.transaction_id.localeCompare(a.transaction_id)) : []));
          onValue(ref(db, `notifications/${authUser.uid}`), (s) => setNotifications(s.val() ? Object.values(s.val()) : []));
          onValue(ref(db, 'genres'), (s) => setGenres(s.val() ? Object.values(s.val()) : []));
        } else {
          await signOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
        setInventory([]);
        setTransactions([]);
        setNotifications([]);
        setGenres([]);
      }
      setIsAuthReady(true); // Tells the app it is safe to render the page
    });
    return () => unsubscribe();
  }, []);

  const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 4000); };
  const clearToast = () => setToast(null);

  const requestConfirm = (title, message, onConfirm) => setConfirmConfig({ isOpen: true, title, message, onConfirm });
  const cancelConfirm = () => setConfirmConfig({ isOpen: false, title: '', message: '', onConfirm: null });
  const executeConfirm = async () => {
    if (confirmConfig.onConfirm) await confirmConfig.onConfirm();
    cancelConfirm();
  };

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await get(ref(db, `users/${userCred.user.uid}`));
      if (snap.exists()) {
        const userData = { uid: userCred.user.uid, ...snap.val() };
        setUser(userData);
        setIsLoading(false);
        return userData;
      } else {
        await signOut(auth);
        throw new Error('Profile missing. Please register a new account.');
      }
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const registerUser = async (name, idNumber, email, password, requestedRole) => {
    setIsLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const usersSnap = await get(ref(db, 'users'));
      let adminExists = false;
      if (usersSnap.exists()) adminExists = Object.values(usersSnap.val()).some(u => u.role === 'admin');

      if (requestedRole === 'admin' && adminExists) {
        await userCred.user.delete();
        await signOut(auth);
        throw new Error('admin-exists');
      }

      const assignedRole = (!adminExists && requestedRole === 'admin') ? 'admin' : (requestedRole === 'sao' ? 'sao' : 'student');
      const assignedDepartment = assignedRole === 'sao' ? 'Student Affairs' : (assignedRole === 'admin' ? 'System Administrator' : 'BSIT');
      
      const defaultPerms = assignedRole === 'admin' ? { create: true, read: true, update: true, delete: true } : 
                           assignedRole === 'sao' ? { create: false, read: true, update: true, delete: false } :
                           { create: false, read: true, update: false, delete: false };

      const newUser = {
        id: idNumber, name, email, role: assignedRole, department: assignedDepartment,
        permissions: defaultPerms,
        avatar: `https://ui-avatars.com/api/?name=${name.replace(/ /g, '+')}&background=random&color=fff`
      };
      
      await set(ref(db, `users/${userCred.user.uid}`), newUser);
      setIsLoading(false);
      return newUser;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const logout = async () => { setIsLoading(true); await signOut(auth); setIsLoading(false); };
  const resetPassword = async (email) => await sendPasswordResetEmail(auth, email);
  
  const changePassword = async (currentPassword, newPassword) => { 
    if (auth.currentUser && user) { 
      try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, newPassword); 
        showToast('Security protocol updated successfully.'); 
      } catch (error) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
          throw new Error('Incorrect current password.');
        }
        throw error;
      }
    } 
  };

  const updateProfile = async (updatedData) => { if (user) { await update(ref(db, `users/${user.uid}`), updatedData); showToast('Profile updated.'); } };
  const updateUserRole = async (userId, newRole) => { await update(ref(db, `users/${userId}`), { role: newRole }); showToast(`Access updated to ${newRole.toUpperCase()}.`); };
  const updateUserPermissions = async (userId, permissions) => { await update(ref(db, `users/${userId}/permissions`), permissions); showToast('Permissions updated.'); };

  const addInventoryItem = async (item) => { await set(ref(db, `inventory/${item.id}`), item); showToast('Book added successfully.'); };
  const updateInventoryItem = async (updatedItem) => { await update(ref(db, `inventory/${updatedItem.id}`), updatedItem); showToast('Book updated.'); };
  const deleteInventoryItem = async (id) => { await remove(ref(db, `inventory/${id}`)); showToast('Book removed.', 'warning'); };
  
  const addGenre = async (name) => { const id = `genre_${Date.now()}`; await set(ref(db, `genres/${id}`), { id, name }); showToast('Category created.'); };
  const deleteGenre = async (id) => { await remove(ref(db, `genres/${id}`)); showToast('Category deleted.', 'warning'); };

  const addTransaction = async (tx) => await set(ref(db, `transactions/${tx.transaction_id}`), tx);
  const updateTransaction = async (txId, updates) => await update(ref(db, `transactions/${txId}`), updates);
  const markNotificationsRead = () => { notifications.forEach(async (n) => { if (!n.read) await update(ref(db, `notifications/${user.uid}/${n.id}`), { read: true }); }); };

  return (
    <AppContext.Provider value={{ 
      inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem,
      genres, addGenre, deleteGenre,
      transactions, addTransaction, updateTransaction, 
      usersList, updateUserRole, updateUserPermissions, notifications, markNotificationsRead,
      user, login, registerUser, logout, resetPassword, changePassword, updateProfile, hasAdmin,
      isDarkMode, setIsDarkMode, toast, showToast, clearToast, isLoading, isAuthReady,
      requestConfirm, confirmConfig, cancelConfirm, executeConfirm 
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);