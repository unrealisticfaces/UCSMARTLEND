import { createContext, useState, useContext, useEffect, useRef } from 'react';
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
  
  const [isLoading, setIsLoading] = useState(false); 
  const [isAuthReady, setIsAuthReady] = useState(false); 
  
  const [hasAdmin, setHasAdmin] = useState(false);

  const isRegisteringRef = useRef(false);

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

  const sendNotification = async (targetUid, title, message, customId = null) => {
    const id = customId || `notif_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    await set(ref(db, `notifications/${targetUid}/${id}`), {
      id, title, message, time, read: false, timestamp: Date.now()
    });
  };

  const notifyRole = async (targetRole, title, message) => {
    const snap = await get(ref(db, 'users'));
    if(snap.exists()){
      Object.entries(snap.val()).forEach(([uid, u]) => {
        if(u.role === targetRole) sendNotification(uid, title, message);
      });
    }
  };

  const attachUserListeners = (uid, userData) => {
    setUser(userData);
    onValue(ref(db, `users/${uid}`), (s) => { if (s.exists()) setUser({ uid, ...s.val() }); });
    onValue(ref(db, 'inventory'), (s) => setInventory(s.val() ? Object.values(s.val()) : []));
    onValue(ref(db, 'transactions'), (s) => setTransactions(s.val() ? Object.values(s.val()).sort((a, b) => b.transaction_id.localeCompare(a.transaction_id)) : []));
    onValue(ref(db, `notifications/${uid}`), (s) => {
      const notifs = s.val() ? Object.values(s.val()) : [];
      setNotifications(notifs.sort((a, b) => b.timestamp - a.timestamp));
    });
    onValue(ref(db, 'genres'), (s) => setGenres(s.val() ? Object.values(s.val()) : []));

    if (userData.role === 'student') {
      get(ref(db, 'transactions')).then(tsnap => {
        if (tsnap.exists()) {
          const todayStr = new Date().toISOString().split('T')[0];
          Object.values(tsnap.val()).forEach(tx => {
            if (tx.student_id === userData.id && tx.status === 'Borrowed' && tx.expected_return_date <= todayStr) {
              const isOverdue = tx.expected_return_date < todayStr;
              const notifId = `due_alert_${tx.transaction_id}_${todayStr}`;
              get(ref(db, `notifications/${uid}/${notifId}`)).then(nsnap => {
                if (!nsnap.exists()) {
                  sendNotification(uid, isOverdue ? 'Asset Overdue!' : 'Asset Due Today', `Your borrowed asset for transaction ${tx.transaction_id} is due. Please visit the SAO desk.`, notifId);
                }
              });
            }
          });
        }
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        if (isRegisteringRef.current) {
          setIsAuthReady(true);
          return;
        }

        const userRef = ref(db, `users/${authUser.uid}`);
        const snap = await get(userRef);
        
        if (snap.exists()) {
          const userData = { uid: authUser.uid, ...snap.val() };
          attachUserListeners(authUser.uid, userData);
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
      setIsAuthReady(true);
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
    isRegisteringRef.current = true;
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
      await notifyRole('admin', 'New User Registered', `${name} joined as a ${assignedRole}.`);
      
      // Sign out immediately so the user must manually log in
      await signOut(auth);
      setUser(null);

      return newUser;
    } finally {
      isRegisteringRef.current = false;
      setIsLoading(false);
    }
  };

  const adminCreateUser = async (name, idNumber, email, password, requestedRole) => {
    setIsLoading(true);
    try {
      const apiKey = auth.app.options.apiKey;
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: false })
      });
      
      const data = await response.json();
      if (!response.ok) {
        if (data.error.message === 'EMAIL_EXISTS') throw new Error('This email is already in use by another account.');
        throw new Error(data.error.message);
      }
      
      const newUid = data.localId;
      const assignedDepartment = requestedRole === 'sao' ? 'Student Affairs' : (requestedRole === 'admin' ? 'System Administrator' : 'BSIT');
      const defaultPerms = requestedRole === 'admin' ? { create: true, read: true, update: true, delete: true } : 
                           requestedRole === 'sao' ? { create: false, read: true, update: true, delete: false } :
                           { create: false, read: true, update: false, delete: false };

      const newUser = {
        id: idNumber, name, email, role: requestedRole, department: assignedDepartment,
        permissions: defaultPerms,
        avatar: `https://ui-avatars.com/api/?name=${name.replace(/ /g, '+')}&background=random&color=fff`
      };
      
      await set(ref(db, `users/${newUid}`), newUser);
      await notifyRole('admin', 'Account Provisioned', `System Admin created an account for ${name}.`);

      showToast('User account successfully provisioned.');
      setIsLoading(false);
      return newUser;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const verifyPassword = async (password) => {
    if (!auth.currentUser || !user) throw new Error('No active session.');
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(auth.currentUser, credential);
      return true;
    } catch (error) {
      throw new Error('Incorrect admin password.');
    }
  };

  const exportDatabase = async () => {
    const snap = await get(ref(db, '/'));
    return snap.val();
  };

  const importDatabase = async (jsonData) => {
    const updates = {};
    if (jsonData.inventory) updates['inventory'] = jsonData.inventory;
    if (jsonData.transactions) updates['transactions'] = jsonData.transactions;
    if (jsonData.genres) updates['genres'] = jsonData.genres;
    if (jsonData.users) updates['users'] = jsonData.users;
    if (jsonData.notifications) updates['notifications'] = jsonData.notifications;
    await update(ref(db, '/'), updates);
  };

  const wipeDatabase = async () => {
    await remove(ref(db, 'inventory'));
    await remove(ref(db, 'transactions'));
    await remove(ref(db, 'genres'));
    await remove(ref(db, 'notifications'));
  };

  const logout = async () => { setIsLoading(true); await signOut(auth); setIsLoading(false); };
  const resetPassword = async (email) => await sendPasswordResetEmail(auth, email);
  
  const changePassword = async (currentPassword, newPassword) => { 
    await verifyPassword(currentPassword);
    await updatePassword(auth.currentUser, newPassword); 
    showToast('Security protocol updated successfully.'); 
  };

  const updateProfile = async (updatedData) => { if (user) { await update(ref(db, `users/${user.uid}`), updatedData); showToast('Profile updated.'); } };
  const updateUserRole = async (userId, newRole) => { await update(ref(db, `users/${userId}`), { role: newRole }); showToast(`Access updated to ${newRole.toUpperCase()}.`); };
  const updateUserPermissions = async (userId, permissions) => { await update(ref(db, `users/${userId}/permissions`), permissions); showToast('Permissions updated.'); };

  const addInventoryItem = async (item) => { 
    await set(ref(db, `inventory/${item.id}`), item); 
    await notifyRole('admin', 'Inventory Expanded', `A new asset (${item.inventory_code}) was added to the database.`);
    showToast('Asset added successfully.'); 
  };
  
  const updateInventoryItem = async (updatedItem) => { await update(ref(db, `inventory/${updatedItem.id}`), updatedItem); showToast('Asset updated.'); };
  const deleteInventoryItem = async (id) => { await remove(ref(db, `inventory/${id}`)); showToast('Asset removed.', 'warning'); };
  const addGenre = async (name) => { const id = `genre_${Date.now()}`; await set(ref(db, `genres/${id}`), { id, name }); showToast('Category created.'); };
  const deleteGenre = async (id) => { await remove(ref(db, `genres/${id}`)); showToast('Category deleted.', 'warning'); };

  const addTransaction = async (tx) => {
    await set(ref(db, `transactions/${tx.transaction_id}`), tx);
    await notifyRole('sao', 'New Borrow Request', `A new asset request was submitted by ${tx.student_id}.`);
    if (user) await sendNotification(user.uid, 'Request Submitted', 'Your borrow request has been sent to the SAO for review.');
  };

  const updateTransaction = async (txId, updates) => {
    await update(ref(db, `transactions/${txId}`), updates);
    const tx = transactions.find(t => t.transaction_id === txId);
    
    if (tx && updates.status) {
      const studentData = usersList.find(u => u.id === tx.student_id);
      if (studentData) {
        if (updates.status === 'Borrowed') sendNotification(studentData.uid, 'Request Approved', 'Your request was approved. Please claim your asset at the SAO.');
        if (updates.status === 'Declined') sendNotification(studentData.uid, 'Request Declined', 'Your borrow request was declined by the SAO.');
        if (updates.status === 'Returned') sendNotification(studentData.uid, 'Return Confirmed', 'Your asset return has been successfully processed.');
      }
    }
  };

  const markNotificationsRead = () => { notifications.forEach(async (n) => { if (!n.read) await update(ref(db, `notifications/${user.uid}/${n.id}`), { read: true }); }); };
  const clearAllNotifications = async () => { await remove(ref(db, `notifications/${user.uid}`)); setNotifications([]); };

  return (
    <AppContext.Provider value={{ 
      inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem,
      genres, addGenre, deleteGenre,
      transactions, addTransaction, updateTransaction, 
      usersList, updateUserRole, updateUserPermissions, notifications, markNotificationsRead, clearAllNotifications,
      user, login, registerUser, adminCreateUser, logout, resetPassword, changePassword, updateProfile, hasAdmin,
      verifyPassword, exportDatabase, importDatabase, wipeDatabase,
      isDarkMode, setIsDarkMode, toast, showToast, clearToast, isLoading, isAuthReady,
      requestConfirm, confirmConfig, cancelConfirm, executeConfirm 
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);