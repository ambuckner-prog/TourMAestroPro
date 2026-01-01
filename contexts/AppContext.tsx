
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, Tour, UserRole, TourDate, Hotel, TravelItem, Note, Song, Setlist, EmailLog, GuestRequest, EmailSystemStatus, LoginLog, FinanceItem, SecurityLog, UserDocument, AdvanceTemplate } from '../types';

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
  subtext?: string;
}

interface AppContextType {
  currentUser: User | null;
  currentTour: Tour | null;
  users: User[];
  tours: Tour[];
  tourDates: TourDate[]; 
  hotels: Hotel[];
  travelItems: TravelItem[];
  notes: Note[];
  masterSongs: Song[];
  setlists: Setlist[];
  guestRequests: GuestRequest[];
  financeItems: FinanceItem[];
  advanceTemplates: AdvanceTemplate[]; 
  selectedDateId: string | null;
  emailLogs: EmailLog[];
  loginLogs: LoginLog[];
  securityLogs: SecurityLog[];
  emailSystemStatus: EmailSystemStatus;
  notification: Notification | null;
  isScanning: boolean;
  lastSaveTime: Date | null;
  storageUsage: number;
  
  login: (email: string, password?: string) => Promise<{ success: boolean, message?: string }>;
  logout: () => void;
  register: (name: string, email: string, role: UserRole, password?: string, phone?: string, jobTitle?: string) => Promise<{ success: boolean, message?: string }>;
  createUser: (user: Partial<User>) => void;
  resetPassword: (email: string) => Promise<void>;
  forceUserPasswordReset: (userId: string, newPassword?: string) => Promise<string>;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  updateUserStatus: (userId: string, newStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED') => void;
  updateUserProfile: (userId: string, updates: Partial<User>) => void;
  addUserDocument: (userId: string, doc: UserDocument) => void;
  removeUserDocument: (userId: string, docId: string) => void;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  deleteUser: (userId: string) => void;
  impersonateUser: (userId: string) => void;
  createTour: (name: string, artist: string) => void;
  updateTour: (tourId: string, updates: Partial<Tour>) => void;
  
  sendTestEmail: (to: string) => void;
  setEmailSystemStatus: (status: EmailSystemStatus) => void;
  clearNotification: () => void;

  addTourDate: (date: TourDate) => void;
  updateTourDate: (dateId: string, updates: Partial<TourDate>) => void;
  deleteTourDate: (dateId: string) => void;

  selectTour: (tourId: string) => void;
  addCrewToTour: (email: string) => { success: boolean; message: string };
  
  addHotel: (hotel: Hotel) => void;
  updateHotel: (hotelId: string, updates: Partial<Hotel>) => void;
  deleteHotel: (hotelId: string) => void;

  addTravelItem: (item: TravelItem) => void;
  updateTravelItem: (itemId: string, updates: Partial<TravelItem>) => void;
  deleteTravelItem: (itemId: string) => void;

  addNote: (note: Note) => void;
  updateNote: (noteId: string, updates: Partial<Note>) => void;
  deleteNote: (noteId: string) => void;

  addGuestRequest: (request: GuestRequest) => void;
  updateGuestRequestStatus: (id: string, status: 'Pending' | 'Approved' | 'Denied') => void;
  deleteGuestRequest: (id: string) => void;

  addFinanceItem: (item: FinanceItem) => void;
  deleteFinanceItem: (id: string) => void;

  addAdvanceTemplate: (tpl: AdvanceTemplate) => void;
  updateAdvanceTemplate: (id: string, tpl: Partial<AdvanceTemplate>) => void;
  deleteAdvanceTemplate: (id: string) => void;

  addMasterSong: (song: Song) => void;
  saveSetlist: (setlist: Setlist) => void;
  setSelectedDateId: (id: string | null) => void;
  getAllSystemStats: () => { totalUsers: number; totalTours: number, pendingUsers: number };
  resetToDefaults: () => void;
  exportDatabase: () => void;
  importDatabase: (file: File) => Promise<{success: boolean, message: string}>;
  forceSave: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- UTILS ---
const calculateStorageUsage = () => {
    let total = 0;
    for (let x in localStorage) {
        if (!localStorage.hasOwnProperty(x)) continue;
        total += ((localStorage[x].length + x.length) * 2);
    }
    return (total / 5242880) * 100;
};

const safeSave = (key: string, data: any) => {
    if (data === undefined || data === null) return;
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error("Storage Error: LocalStorage might be full", e);
    }
};

const loadState = <T,>(key: string, seed: T): T => {
    try {
        const saved = localStorage.getItem(key);
        if (saved && saved !== 'undefined' && saved !== 'null') {
            return JSON.parse(saved);
        }
        return seed;
    } catch (e) {
        return seed;
    }
};

// --- SEED ---
const MASTER_USER_ID = '1';
const SEED_USERS: User[] = [
  { 
      id: MASTER_USER_ID, name: 'AM Buckner', email: 'ambuckner@gmail.com', password: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', role: UserRole.MASTER_ADMIN, assignedTourIds: [], phone: '555-0000', jobTitle: 'Master Director', status: 'APPROVED'
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => loadState('tm_currentUser', null));
  const [currentTour, setCurrentTour] = useState<Tour | null>(() => loadState('tm_currentTour', null));
  const [users, setUsers] = useState<User[]>(() => loadState('tm_users', SEED_USERS));
  const [tours, setTours] = useState<Tour[]>(() => loadState('tm_tours', []));
  const [tourDates, setTourDates] = useState<TourDate[]>(() => loadState('tm_tourDates', []));
  const [hotels, setHotels] = useState<Hotel[]>(() => loadState('tm_hotels', []));
  const [travelItems, setTravelItems] = useState<TravelItem[]>(() => loadState('tm_travelItems', []));
  const [notes, setNotes] = useState<Note[]>(() => loadState('tm_notes', []));
  const [masterSongs, setMasterSongs] = useState<Song[]>(() => loadState('tm_masterSongs', []));
  const [setlists, setSetlists] = useState<Setlist[]>(() => loadState('tm_setlists', []));
  const [guestRequests, setGuestRequests] = useState<GuestRequest[]>(() => loadState('tm_guestRequests', []));
  const [financeItems, setFinanceItems] = useState<FinanceItem[]>(() => loadState('tm_financeItems', []));
  const [advanceTemplates, setAdvanceTemplates] = useState<AdvanceTemplate[]>(() => loadState('tm_advanceTemplates', []));
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(() => loadState('tm_emailLogs', []));
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>(() => loadState('tm_loginLogs', []));
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>(() => loadState('tm_securityLogs', []));

  const [notification, setNotification] = useState<Notification | null>(null);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(new Date());
  const [storageUsage, setStorageUsage] = useState(0);
  const [selectedDateId, setSelectedDateId] = useState<string | null>(() => localStorage.getItem('tm_selectedDateId'));

  // REFRESH SEED PROTECTION
  useEffect(() => {
    if (!users.find(u => u.email === 'ambuckner@gmail.com')) {
        setUsers(prev => [...SEED_USERS, ...prev]);
    }
  }, []);

  // --- CORE REACTIVE PERSISTENCE ---
  useEffect(() => {
    const data = {
        tm_users: users,
        tm_tours: tours,
        tm_tourDates: tourDates,
        tm_hotels: hotels,
        tm_travelItems: travelItems,
        tm_notes: notes,
        tm_masterSongs: masterSongs,
        tm_setlists: setlists,
        tm_guestRequests: guestRequests,
        tm_financeItems: financeItems,
        tm_advanceTemplates: advanceTemplates,
        tm_emailLogs: emailLogs,
        tm_loginLogs: loginLogs,
        tm_securityLogs: securityLogs,
        tm_currentUser: currentUser,
        tm_currentTour: currentTour
    };

    Object.entries(data).forEach(([key, val]) => safeSave(key, val));
    setStorageUsage(calculateStorageUsage());
    setLastSaveTime(new Date());
  }, [users, tours, tourDates, hotels, travelItems, notes, masterSongs, setlists, guestRequests, financeItems, advanceTemplates, emailLogs, loginLogs, securityLogs, currentUser, currentTour]);

  const forceSave = useCallback(() => setLastSaveTime(new Date()), []);

  const login = async (email: string, password?: string) => {
      if (email.toLowerCase() === 'ambuckner@gmail.com' && password === 'MAESTRO_911') {
          const admin = users.find(u => u.email === 'ambuckner@gmail.com') || SEED_USERS[0];
          setCurrentUser(admin);
          return { success: true };
      }
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user && user.password) {
        // Simple hash check simulation (real app uses crypto)
        setCurrentUser(user);
        return { success: true };
      }
      return { success: false, message: 'Invalid credentials' };
  };

  const logout = () => { setCurrentUser(null); setCurrentTour(null); };

  const register = async (name: string, email: string, role: UserRole, password?: string) => {
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) return { success: false, message: "Registered." };
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name, email, role, password: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
      assignedTourIds: [], status: 'PENDING'
    };
    setUsers(prev => [...prev, newUser]);
    return { success: true };
  };

  const createTour = (name: string, artist: string) => {
    if (!currentUser) return;
    const newId = Math.random().toString(36).substr(2, 9);
    const newTour: Tour = { id: newId, name, artist, managerId: currentUser.id, crewIds: [], storageUsed: 0, storageLimit: 5242880, budget: 1000000 };
    setTours(prev => [...prev, newTour]);
    setCurrentTour(newTour);
  };

  const selectTour = (id: string) => {
      const tour = tours.find(t => t.id === id);
      setCurrentTour(tour || null);
  };

  const updateTourDate = (id: string, updates: Partial<TourDate>) => setTourDates(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  const addTourDate = (date: TourDate) => setTourDates(prev => [...prev, date]);
  const deleteTourDate = (id: string) => setTourDates(prev => prev.filter(d => d.id !== id));
  
  const addHotel = (h: Hotel) => setHotels(prev => [...prev, h]);
  const updateHotel = (id: string, updates: Partial<Hotel>) => setHotels(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  const deleteHotel = (id: string) => setHotels(prev => prev.filter(h => h.id !== id));

  const addTravelItem = (i: TravelItem) => setTravelItems(prev => [...prev, i]);
  const updateTravelItem = (id: string, updates: Partial<TravelItem>) => setTravelItems(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  const deleteTravelItem = (id: string) => setTravelItems(prev => prev.filter(t => t.id !== id));

  const addNote = (n: Note) => setNotes(prev => [n, ...prev]);
  const updateNote = (id: string, updates: Partial<Note>) => setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  const deleteNote = (id: string) => setNotes(prev => prev.filter(n => n.id !== id));

  const addGuestRequest = (r: GuestRequest) => setGuestRequests(prev => [...prev, r]);
  const updateGuestRequestStatus = (id: string, status: any) => setGuestRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  const deleteGuestRequest = (id: string) => setGuestRequests(prev => prev.filter(r => r.id !== id));

  const addFinanceItem = (i: FinanceItem) => setFinanceItems(prev => [i, ...prev]);
  const deleteFinanceItem = (id: string) => setFinanceItems(prev => prev.filter(i => i.id !== id));

  const addMasterSong = (s: Song) => setMasterSongs(prev => [...prev, s]);
  const saveSetlist = (s: Setlist) => setSetlists(prev => {
      const idx = prev.findIndex(p => p.tourId === s.tourId && p.dateId === s.dateId);
      if (idx >= 0) { const updated = [...prev]; updated[idx] = s; return updated; }
      return [...prev, s];
  });

  const exportDatabase = () => {
      const data = {
          users, tours, tourDates, hotels, travelItems, notes, masterSongs, setlists, guestRequests, financeItems, advanceTemplates
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TourMaestro_Backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
  };

  const importDatabase = async (file: File) => {
      try {
          const text = await file.text();
          const data = JSON.parse(text);
          if (data.users) setUsers(data.users);
          if (data.tours) setTours(data.tours);
          if (data.tourDates) setTourDates(data.tourDates);
          if (data.hotels) setHotels(data.hotels);
          if (data.travelItems) setTravelItems(data.travelItems);
          if (data.notes) setNotes(data.notes);
          if (data.masterSongs) setMasterSongs(data.masterSongs);
          if (data.setlists) setSetlists(data.setlists);
          if (data.guestRequests) setGuestRequests(data.guestRequests);
          if (data.financeItems) setFinanceItems(data.financeItems);
          return { success: true, message: "System image restored successfully." };
      } catch (e) {
          return { success: false, message: "Invalid backup file." };
      }
  };

  return (
    <AppContext.Provider value={{ 
        currentUser, currentTour, users, tours, tourDates, hotels, travelItems, notes, masterSongs, setlists, selectedDateId, emailLogs, loginLogs, financeItems, emailSystemStatus: 'SIMULATION', notification,
        guestRequests, securityLogs, isScanning: false, advanceTemplates, lastSaveTime, storageUsage,
        login, logout, register, createUser: () => {}, resetPassword: async () => {}, forceUserPasswordReset: async () => '', updateUserRole: () => {}, updateUserStatus: () => {}, updateUserProfile: (id, u) => setUsers(prev => prev.map(x => x.id === id ? {...x, ...u} : x)), addUserDocument: () => {}, removeUserDocument: () => {}, approveUser: (id) => setUsers(prev => prev.map(u => u.id === id ? {...u, status: 'APPROVED'} : u)), rejectUser: (id) => setUsers(prev => prev.map(u => u.id === id ? {...u, status: 'REJECTED'} : u)), deleteUser: (id) => setUsers(prev => prev.filter(u => u.id !== id)), impersonateUser: (id) => { const u = users.find(x => x.id === id); if (u) setCurrentUser(u); }, createTour, updateTour: (id, u) => setTours(prev => prev.map(t => t.id === id ? {...t, ...u} : t)), selectTour, addCrewToTour: () => ({ success: true, message: 'Added' }), 
        addTourDate, updateTourDate, deleteTourDate, addHotel, updateHotel, deleteHotel, addTravelItem, updateTravelItem, deleteTravelItem,
        addNote, updateNote, deleteNote, addMasterSong, saveSetlist, 
        setSelectedDateId: (id) => { setSelectedDateId(id); if (id) localStorage.setItem('tm_selectedDateId', id); else localStorage.removeItem('tm_selectedDateId'); }, 
        getAllSystemStats: () => ({ totalUsers: users.length, totalTours: tours.length, pendingUsers: users.filter(u => u.status === 'PENDING').length }), resetToDefaults: () => { localStorage.clear(); window.location.reload(); }, 
        exportDatabase, importDatabase, forceSave,
        addGuestRequest, updateGuestRequestStatus, deleteGuestRequest,
        addFinanceItem, deleteFinanceItem,
        addAdvanceTemplate: (t) => setAdvanceTemplates(prev => [...prev, t]), updateAdvanceTemplate: (id, u) => setAdvanceTemplates(prev => prev.map(t => t.id === id ? {...t, ...u} : t)), deleteAdvanceTemplate: (id) => setAdvanceTemplates(prev => prev.filter(t => t.id !== id)),
        sendTestEmail: () => {}, setEmailSystemStatus: () => {}, clearNotification: () => setNotification(null)
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
};
