import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Tour, UserRole, TourDate, Hotel, TravelItem, Note, Song, Setlist, GuestRequest, EmailLog, AdvanceTemplate, FinanceItem, SecurityLog, EmailSystemStatus } from '../types';

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
  securityLogs: SecurityLog[];
  emailSystemStatus: EmailSystemStatus;
  storageUsage: number;
  lastSaveTime: Date | null;
  isScanning: boolean;
  isSyncing: boolean;
  
  login: (email: string, password?: string) => Promise<{ success: boolean, message?: string }>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  register: (name: string, email: string, role: UserRole, password?: string, phone?: string, jobTitle?: string) => Promise<{ success: boolean, message?: string }>;
  createUser: (user: Partial<User>) => void;
  createTour: (name: string, artist: string) => void;
  updateTour: (tourId: string, updates: Partial<Tour>) => void;
  selectTour: (tourId: string) => void;
  
  updateUserRole: (userId: string, newRole: UserRole) => void;
  updateUserStatus: (userId: string, newStatus: User['status']) => void;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  deleteUser: (userId: string) => void;
  impersonateUser: (userId: string) => void;
  forceUserPasswordReset: (userId: string, newPassword?: string) => Promise<string>;
  
  addTourDate: (date: TourDate) => void;
  updateTourDate: (dateId: string, updates: Partial<TourDate>) => void;
  deleteTourDate: (dateId: string) => void;
  
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

  addAdvanceTemplate: (template: AdvanceTemplate) => void;
  updateAdvanceTemplate: (id: string, updates: Partial<AdvanceTemplate>) => void;
  deleteAdvanceTemplate: (id: string) => void;

  addMasterSong: (song: Song) => void;
  saveSetlist: (setlist: Setlist) => void;
  setSelectedDateId: (id: string | null) => void;
  
  exportDatabase: () => string;
  importDatabase: (file: File) => Promise<{success: boolean, message: string}>;
  resetToDefaults: () => void;
  forceSave: () => void;
  clearNotification: () => void;
  notification: { type: 'success' | 'error' | 'info', message: string, subtext?: string } | null;
  getAllSystemStats: () => { totalUsers: number; totalTours: number, pendingUsers: number };
  triggerSecurityScan: (type: 'AUTOMATED' | 'MANUAL') => Promise<void>;
  updateUserProfile: (userId: string, updates: Partial<User>) => void;
  addUserDocument: (userId: string, doc: any) => void;
  removeUserDocument: (userId: string, docId: string) => void;
  addCrewToTour: (email: string) => { success: boolean; message: string };
  sendTestEmail: (to: string) => void;
  setEmailSystemStatus: (status: EmailSystemStatus) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const MASTER_VAULT_KEY = 'tour_maestro_pro_v1_master_vault';
const SESSION_USER_KEY = 'tmp_session_user';
const SESSION_TOUR_KEY = 'tmp_session_tour';

const getInitialVault = () => {
    try {
        const saved = localStorage.getItem(MASTER_VAULT_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.users && parsed.tours) return parsed;
        }
    } catch (e) { console.error("Vault corrupted, resetting."); }
    
    return {
        users: [{ id: '1', name: 'AM Buckner', email: 'ambuckner@gmail.com', role: UserRole.MASTER_ADMIN, assignedTourIds: [], status: 'APPROVED' }],
        tours: [], tourDates: [], hotels: [], travelItems: [], notes: [], masterSongs: [], setlists: [], guestRequests: [], financeItems: [], advanceTemplates: [], emailLogs: [], securityLogs: []
    };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const vault = getInitialVault();

  const [users, setUsers] = useState<User[]>(vault.users);
  const [tours, setTours] = useState<Tour[]>(vault.tours);
  const [tourDates, setTourDates] = useState<TourDate[]>(vault.tourDates || []);
  const [hotels, setHotels] = useState<Hotel[]>(vault.hotels || []);
  const [travelItems, setTravelItems] = useState<TravelItem[]>(vault.travelItems || []);
  const [notes, setNotes] = useState<Note[]>(vault.notes || []);
  const [masterSongs, setMasterSongs] = useState<Song[]>(vault.masterSongs || []);
  const [setlists, setSetlists] = useState<Setlist[]>(vault.setlists || []);
  const [guestRequests, setGuestRequests] = useState<GuestRequest[]>(vault.guestRequests || []);
  const [financeItems, setFinanceItems] = useState<FinanceItem[]>(vault.financeItems || []);
  const [advanceTemplates, setAdvanceTemplates] = useState<AdvanceTemplate[]>(vault.advanceTemplates || []);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(vault.emailLogs || []);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>(vault.securityLogs || []);
  const [emailSystemStatus, setEmailSystemStatus] = useState<EmailSystemStatus>('SIMULATION');

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
      const u = localStorage.getItem(SESSION_USER_KEY);
      return u ? JSON.parse(u) : null;
  });
  const [currentTour, setCurrentTour] = useState<Tour | null>(() => {
      const t = localStorage.getItem(SESSION_TOUR_KEY);
      return t ? JSON.parse(t) : null;
  });

  const [selectedDateId, setSelectedDateId] = useState<string | null>(localStorage.getItem('tmp_selected_date'));
  const [notification, setNotification] = useState<any>(null);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(new Date());
  const [isScanning, setIsScanning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const commitToVault = useCallback(() => {
    setIsSyncing(true);
    try {
        const fullVault = { 
            users, tours, tourDates, hotels, travelItems, notes, 
            masterSongs, setlists, guestRequests, financeItems, 
            advanceTemplates, emailLogs, securityLogs 
        };
        localStorage.setItem(MASTER_VAULT_KEY, JSON.stringify(fullVault));
        
        if (currentUser) localStorage.setItem(SESSION_USER_KEY, JSON.stringify(currentUser));
        if (currentTour) localStorage.setItem(SESSION_TOUR_KEY, JSON.stringify(currentTour));
        if (selectedDateId) localStorage.setItem('tmp_selected_date', selectedDateId);
        
        setLastSaveTime(new Date());
    } catch (e) {
        console.error("Vault Failure.");
    } finally {
        setTimeout(() => setIsSyncing(false), 800);
    }
  }, [users, tours, tourDates, hotels, travelItems, notes, masterSongs, setlists, guestRequests, financeItems, advanceTemplates, emailLogs, securityLogs, currentUser, currentTour, selectedDateId]);

  useEffect(() => {
    const timeout = setTimeout(commitToVault, 500);
    return () => clearTimeout(timeout);
  }, [users, tours, tourDates, hotels, travelItems, notes, masterSongs, setlists, guestRequests, financeItems, advanceTemplates, emailLogs, securityLogs]);

  const login = async (email: string, password?: string) => {
    if (email === 'ambuckner@gmail.com' && (password === 'MAESTRO_911' || password === 'password123')) {
        const admin = users.find(u => u.email === 'ambuckner@gmail.com');
        setCurrentUser(admin!);
        return { success: true };
    }
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) { 
        setCurrentUser(user); 
        return { success: true }; 
    }
    return { success: false, message: 'Entity not found in current vault.' };
  };

  const logout = () => {
    commitToVault();
    setCurrentUser(null);
    setCurrentTour(null);
    localStorage.removeItem(SESSION_USER_KEY);
    localStorage.removeItem(SESSION_TOUR_KEY);
  };

  const resetPassword = async (email: string) => {
    setEmailLogs(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        to: email,
        subject: 'Password Reset Request',
        body: 'You requested a password reset. Click here: https://tourmaestro.pro/reset-password?token=simulated',
        timestamp: new Date().toISOString(),
        status: 'SENT'
    }]);
  };

  const getAllSystemStats = useCallback(() => ({ 
      totalUsers: users.length, 
      totalTours: tours.length, 
      pendingUsers: users.filter(u => u.status === 'PENDING').length 
  }), [users, tours]);

  const createTour = (name: string, artist: string) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newTour: Tour = { 
        id: newId, name, artist, 
        managerId: currentUser?.id || '1', 
        crewIds: [], storageUsed: 0, storageLimit: 5 * 1024 * 1024, 
        budget: 100000 
    };
    setTours(prev => [...prev, newTour]);
    setCurrentTour(newTour);
    commitToVault();
  };

  const selectTour = (id: string) => {
    const t = tours.find(x => x.id === id) || null;
    setCurrentTour(t);
  };

  return (
    <AppContext.Provider value={{ 
        currentUser, currentTour, users, tours, tourDates, hotels, travelItems, notes, masterSongs, setlists, selectedDateId, financeItems, notification,
        guestRequests, advanceTemplates, lastSaveTime, emailLogs, securityLogs, isScanning, isSyncing, storageUsage: 0,
        emailSystemStatus,
        login, logout, forceSave: commitToVault,
        resetPassword,
        register: async (n, e, r, p, phone, jobTitle) => { 
            const newU: User = { id: Math.random().toString(36).substr(2, 9), name: n, email: e, role: r, password: p, phone, jobTitle, assignedTourIds: [], status: 'PENDING' };
            setUsers(prev => [...prev, newU]); 
            return { success: true }; 
        },
        createUser: (u) => setUsers(p => [...p, { ...u, id: Math.random().toString(36).substr(2, 9), assignedTourIds: [], status: 'APPROVED' } as User]),
        createTour,
        updateTour: (id, u) => setTours(p => p.map(t => t.id === id ? {...t, ...u} : t)),
        selectTour,
        updateUserRole: (id, r) => setUsers(p => p.map(u => u.id === id ? {...u, role: r} : u)),
        updateUserStatus: (id, s) => setUsers(p => p.map(u => u.id === id ? {...u, status: s} : u)),
        approveUser: (id) => setUsers(p => p.map(u => u.id === id ? { ...u, status: 'APPROVED' } : u)),
        rejectUser: (id) => setUsers(p => p.map(u => u.id === id ? { ...u, status: 'REJECTED' } : u)),
        deleteUser: (id) => setUsers(p => p.filter(u => u.id !== id)),
        impersonateUser: (id) => { const u = users.find(x => x.id === id); if(u) setCurrentUser(u); },
        forceUserPasswordReset: async (id) => { const pass = Math.random().toString(36).slice(-8); setUsers(prev => prev.map(u => u.id === id ? {...u, password: pass} : u)); return pass; },
        addTourDate: (d) => setTourDates(p => [...p, d]),
        updateTourDate: (id, u) => setTourDates(p => p.map(d => d.id === id ? {...d, ...u} : d)),
        deleteTourDate: (id) => setTourDates(p => p.filter(d => d.id !== id)),
        addHotel: (h) => setHotels(p => [...p, h]),
        updateHotel: (id, u) => setHotels(p => p.map(h => h.id === id ? {...h, ...u} : h)),
        deleteHotel: (id) => setHotels(p => p.filter(h => h.id !== id)),
        addTravelItem: (i) => setTravelItems(p => [...p, i]),
        updateTravelItem: (id, u) => setTravelItems(p => p.map(t => t.id === id ? {...t, ...u} : t)),
        deleteTravelItem: (id) => setTravelItems(p => p.filter(t => t.id !== id)),
        addNote: (n) => setNotes(p => [n, ...p]),
        updateNote: (id, u) => setNotes(p => p.map(n => n.id === id ? {...n, ...u} : n)),
        deleteNote: (id) => setNotes(p => p.filter(n => n.id !== id)),
        addGuestRequest: (r) => setGuestRequests(p => [...p, r]),
        updateGuestRequestStatus: (id, s) => setGuestRequests(p => p.map(r => r.id === id ? {...r, status: s} : r)),
        deleteGuestRequest: (id) => setGuestRequests(p => p.filter(r => r.id !== id)),
        addFinanceItem: (i) => setFinanceItems(p => [...p, i]),
        deleteFinanceItem: (id) => setFinanceItems(p => p.filter(i => i.id !== id)),
        addAdvanceTemplate: (t) => setAdvanceTemplates(p => [...p, t]),
        updateAdvanceTemplate: (id, u) => setAdvanceTemplates(p => p.map(t => t.id === id ? {...t, ...u} : t)),
        deleteAdvanceTemplate: (id) => setAdvanceTemplates(p => p.filter(t => t.id !== id)),
        addMasterSong: (s) => setMasterSongs(p => [...p, s]),
        saveSetlist: (s) => setSetlists(p => { const idx = p.findIndex(x => x.dateId === s.dateId); if(idx >= 0) { const n = [...p]; n[idx] = s; return n; } return [...p, s]; }),
        setSelectedDateId: (id) => setSelectedDateId(id),
        exportDatabase: () => JSON.stringify({ users, tours, tourDates, hotels, travelItems, notes }),
        importDatabase: async (f) => { try { const d = JSON.parse(await f.text()); setUsers(d.users || []); setTours(d.tours || []); setTourDates(d.tourDates || []); return {success:true, message:'Vault Image Restored.'}; } catch(e) { return {success:false, message:'Invalid Vault Image.'}; } },
        resetToDefaults: () => { localStorage.clear(); window.location.reload(); },
        clearNotification: () => setNotification(null),
        getAllSystemStats,
        triggerSecurityScan: async () => { setIsScanning(true); await new Promise(r => setTimeout(r, 2000)); setIsScanning(false); },
        updateUserProfile: (id, u) => setUsers(p => p.map(x => x.id === id ? {...x, ...u} : x)),
        addUserDocument: (id, d) => setUsers(p => p.map(u => u.id === id ? {...u, documents: [...(u.documents || []), d]} : u)),
        removeUserDocument: (id, did) => setUsers(p => p.map(u => u.id === id ? {...u, documents: (u.documents || []).filter(d => d.id !== did)} : u)),
        addCrewToTour: (e) => { const u = users.find(x => x.email === e); if(u && currentTour) { setTours(p => p.map(t => t.id === currentTour.id ? {...t, crewIds: Array.from(new Set([...t.crewIds, u.id]))} : t)); return {success:true, message:'Staff Linked.'}; } return {success:false, message:'Email not found in vault.'}; },
        sendTestEmail: () => {}, setEmailSystemStatus: (s) => setEmailSystemStatus(s)
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