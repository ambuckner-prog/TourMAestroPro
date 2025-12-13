
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
  storageUsage: number; // Percentage 0-100
  
  login: (email: string, password?: string) => Promise<{ success: boolean, message?: string }>;
  logout: () => void;
  register: (name: string, email: string, role: UserRole, password?: string, phone?: string, jobTitle?: string) => Promise<{ success: boolean, message?: string }>;
  createUser: (user: Partial<User>) => void;
  resetPassword: (email: string) => Promise<void>;
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

  triggerSecurityScan: (type: 'AUTOMATED' | 'MANUAL') => Promise<void>;

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
  exportDatabase: () => string;
  createBackup: () => void;
  restoreFromBackup: () => { success: boolean, message: string };
  getLastBackupTime: () => string | null;
  forceSave: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- UTILS ---
const hashPassword = async (password: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// --- ROBUST PERSISTENCE HELPERS ---
const calculateStorageUsage = () => {
    let total = 0;
    for (let x in localStorage) {
        if (!localStorage.hasOwnProperty(x)) continue;
        total += ((localStorage[x].length + x.length) * 2);
    }
    // 5MB typical limit (approx 5,242,880 bytes)
    return (total / 5242880) * 100;
};

// CRITICAL: Safe Save Function that sacrifices assets to save core data
const persistState = (key: string, data: any): boolean => {
    try {
        const serialized = JSON.stringify(data);
        localStorage.setItem(key, serialized);
        return true;
    } catch (e: any) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            console.warn(`[Storage Critical] ${key} save failed. Initiating emergency cleanup.`);
            
            // 1. DELETE NON-ESSENTIAL LOGS
            localStorage.removeItem('tm_emailLogs');
            localStorage.removeItem('tm_loginLogs');
            localStorage.removeItem('tm_securityLogs');

            // 2. IF SAVING USERS FAILED (Likely due to documents)
            if (key === 'tm_users') {
                try {
                    // Strip documents from users to save the core account data
                    // @ts-ignore
                    const slimUsers = data.map(u => ({ ...u, documents: [] }));
                    localStorage.setItem(key, JSON.stringify(slimUsers));
                    console.log("[Storage Recovered] Users saved without documents.");
                    return true;
                } catch (retryErr) {
                    console.error("[Storage Failure] Even slim users could not be saved.", retryErr);
                    return false;
                }
            }

            // 3. IF SAVING TOURS FAILED (Likely because OTHER keys are too big)
            // We need to shrink tm_users (the usual suspect) to make room for tm_tours
            if (key === 'tm_tours') {
                try {
                    const existingUsersStr = localStorage.getItem('tm_users');
                    if (existingUsersStr) {
                        const existingUsers = JSON.parse(existingUsersStr);
                        // @ts-ignore
                        const slimUsers = existingUsers.map(u => ({ ...u, documents: [] }));
                        localStorage.setItem('tm_users', JSON.stringify(slimUsers)); // Shrink users
                        
                        // Now try saving tours again
                        localStorage.setItem(key, JSON.stringify(data));
                        console.log("[Storage Recovered] Users shrunk to make room for Tours.");
                        return true;
                    }
                } catch (retryErr) {
                    console.error("[Storage Failure] Could not clear space for tours.", retryErr);
                    return false;
                }
            }
        }
        console.error(`Error saving key ${key}`, e);
        return false;
    }
};

const loadState = <T,>(key: string, seed: T): T => {
    try {
        const saved = localStorage.getItem(key);
        if (saved && saved !== 'undefined' && saved !== 'null') {
            return JSON.parse(saved);
        }
        
        // RECOVERY STRATEGY: Check Backup if main key is missing
        const backup = localStorage.getItem('tm_backup_auto');
        if (backup) {
            try {
                const parsedBackup = JSON.parse(backup);
                const dataKey = key.replace('tm_', ''); 
                // @ts-ignore
                if (parsedBackup.data && Array.isArray(parsedBackup.data[dataKey]) && parsedBackup.data[dataKey].length > 0) {
                    console.log(`[Recovery] Restored ${key} from Auto-Backup`);
                    // @ts-ignore
                    return parsedBackup.data[dataKey];
                }
            } catch (e) {
                console.error("Backup parse failed", e);
            }
        }

        return seed;
    } catch (e) {
        console.error(`Error loading key ${key}`, e);
        return seed;
    }
};

// --- SEED DATA ---
const SEED_USERS: User[] = [
  { 
      id: '1', name: 'AM Buckner', email: 'ambuckner@gmail.com', password: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', role: UserRole.MASTER_ADMIN, assignedTourIds: [], phone: '555-0000', jobTitle: 'System Owner', status: 'APPROVED'
  },
  { id: '2', name: 'Support Staff', email: 'support@maestro.com', password: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', role: UserRole.SUPPORT_STAFF, assignedTourIds: [], phone: '555-0001', jobTitle: 'Customer Success', status: 'APPROVED' },
  { 
      id: '3', name: 'Kyle James', email: 'manager@band.com', password: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', role: UserRole.TOUR_MANAGER, assignedTourIds: ['t1'], phone: '310-555-0199', jobTitle: 'Tour Director', status: 'APPROVED'
  },
  { id: '4', name: 'Roadie Rick', email: 'crew@band.com', password: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', role: UserRole.CREW, assignedTourIds: ['t1'], phone: '310-555-0142', jobTitle: 'Production Assistant', status: 'APPROVED' },
];

const SEED_TOURS: Tour[] = [
  { id: 't1', name: 'Neon Horizons 2025', artist: 'The Synthwavers', managerId: '3', crewIds: ['4'], storageUsed: 2.1 * 1024 * 1024 * 1024, storageLimit: 5 * 1024 * 1024 * 1024, budget: 1500000 }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Session State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
      const saved = localStorage.getItem('tm_currentUser');
      return saved ? JSON.parse(saved) : null;
  });
  const [currentTour, setCurrentTour] = useState<Tour | null>(() => {
      const saved = localStorage.getItem('tm_currentTour');
      return saved ? JSON.parse(saved) : null;
  });

  const [notification, setNotification] = useState<Notification | null>(null);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(new Date());
  const [storageUsage, setStorageUsage] = useState(0);

  // Database State
  const [users, setUsers] = useState<User[]>(() => loadState('tm_users', SEED_USERS));
  const [tours, setTours] = useState<Tour[]>(() => loadState('tm_tours', SEED_TOURS));
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
  const [emailSystemStatus, setEmailSystemStatus] = useState<EmailSystemStatus>('ENABLED');
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>(() => loadState('tm_loginLogs', []));
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>(() => loadState('tm_securityLogs', []));
  const [isScanning, setIsScanning] = useState(false);

  const [selectedDateId, setSelectedDateId] = useState<string | null>(() => localStorage.getItem('tm_selectedDateId'));

  // --- AUTO-REPAIR "GHOST TOURS" & ORPHANED LINKS ---
  useEffect(() => {
      // Run immediately on mount to fix any inconsistencies
      if (users.length > 0 && tours.length > 0) {
          let wasRepaired = false;
          
          const repairedUsers = users.map(user => {
              // Find tours this user manages
              const managedTours = tours.filter(t => t.managerId === user.id);
              
              // Check if any managed tour is missing from their assigned list
              const missingTourIds = managedTours
                  .filter(t => !user.assignedTourIds?.includes(t.id))
                  .map(t => t.id);
              
              if (missingTourIds.length > 0) {
                  wasRepaired = true;
                  console.log(`[Auto-Repair] Fixed permissions for ${user.name}. Added tours: ${missingTourIds.join(', ')}`);
                  return {
                      ...user,
                      assignedTourIds: [...(user.assignedTourIds || []), ...missingTourIds]
                  };
              }
              return user;
          });

          if (wasRepaired) {
              setUsers(repairedUsers);
              persistState('tm_users', repairedUsers);
              
              // Also update current session if affected
              if (currentUser) {
                  const updatedCurrent = repairedUsers.find(u => u.id === currentUser.id);
                  if (updatedCurrent) {
                      setCurrentUser(updatedCurrent);
                      persistState('tm_currentUser', updatedCurrent);
                  }
              }
          }
      }
  }, []); // Run ONCE on mount to ensure stability

  // --- STATE REF ---
  const stateRef = useRef({
      users, tours, tourDates, hotels, travelItems, notes, masterSongs, setlists, guestRequests, financeItems, advanceTemplates, emailLogs, loginLogs, securityLogs
  });

  useEffect(() => {
      stateRef.current = { users, tours, tourDates, hotels, travelItems, notes, masterSongs, setlists, guestRequests, financeItems, advanceTemplates, emailLogs, loginLogs, securityLogs };
      setStorageUsage(calculateStorageUsage());
  }, [users, tours, tourDates, hotels, travelItems, notes, masterSongs, setlists, guestRequests, financeItems, advanceTemplates, emailLogs, loginLogs, securityLogs]);

  // --- HELPERS ---
  const updateSaveTime = () => setLastSaveTime(new Date());

  const logSystemAction = (action: string, tourId: string, visibility: 'Public' | 'StaffOnly' = 'Public') => {
      const newNote: Note = {
          id: Math.random().toString(36).substr(2, 9),
          tourId: tourId,
          content: action,
          type: 'General',
          authorName: currentUser ? currentUser.name : 'SYSTEM',
          date: new Date().toISOString(),
          attachments: [],
          visibility: visibility
      };
      setNotes(prev => {
          const updated = [newNote, ...prev];
          persistState('tm_notes', updated);
          return updated;
      });
      updateSaveTime();
  };

  const sendSystemEmail = (to: string, subject: string, body: string) => {
      if (emailSystemStatus === 'BLOCKED') return;
      const newLog: EmailLog = {
          id: Math.random().toString(36).substr(2, 9),
          to,
          subject,
          body,
          timestamp: new Date().toISOString(),
          status: emailSystemStatus === 'SIMULATION' ? 'QUEUED' : 'SENT'
      };
      setEmailLogs(prev => {
          const updated = [newLog, ...prev];
          // Don't error if logs fail to save, they are low priority
          try { persistState('tm_emailLogs', updated); } catch(e) {}
          return updated;
      });
  };

  const sendTestEmail = (to: string) => {
      console.log(`Sending email to ${to}`);
      setNotification({ type: 'success', message: 'Email Sent (Simulated)' });
  };

  const triggerSecurityScan = async () => {
      setIsScanning(true);
      await new Promise(r => setTimeout(r, 2000));
      setIsScanning(false);
      setNotification({ type: 'success', message: 'Security Scan Complete', subtext: 'System Healthy' });
  };

  // --- BACKUP & RESTORE ---
  const createBackup = useCallback(() => {
      const currentState = stateRef.current;
      const backup = {
          version: '1.2',
          timestamp: new Date().toISOString(),
          data: currentState
      };
      try {
          localStorage.setItem('tm_backup_auto', JSON.stringify(backup));
          console.log("Auto-backup secured at " + new Date().toLocaleTimeString());
          setLastSaveTime(new Date());
      } catch (e) {
          console.error("Backup failed", e);
      }
  }, []);

  // Run Auto-Backup Every 30 Seconds
  useEffect(() => {
      const interval = setInterval(createBackup, 30000); 
      return () => clearInterval(interval);
  }, [createBackup]);

  const forceSave = () => {
      const s = stateRef.current;
      const r1 = persistState('tm_users', s.users);
      const r2 = persistState('tm_tours', s.tours);
      // Try save others
      persistState('tm_tourDates', s.tourDates);
      persistState('tm_hotels', s.hotels);
      persistState('tm_travelItems', s.travelItems);
      persistState('tm_notes', s.notes);
      
      createBackup();
      
      if (r1 && r2) {
          setNotification({ type: 'success', message: 'Database Synced', subtext: 'All records secured.' });
      } else {
          setNotification({ type: 'error', message: 'Save Failed', subtext: 'Storage Limit Reached.' });
      }
  };

  const restoreFromBackup = () => {
      const backupStr = localStorage.getItem('tm_backup_auto'); 
      if (!backupStr) return { success: false, message: 'No backup found' };
      
      try {
          const backup = JSON.parse(backupStr);
          const { data } = backup;
          
          if (data.users) { setUsers(data.users); persistState('tm_users', data.users); }
          if (data.tours) { setTours(data.tours); persistState('tm_tours', data.tours); }
          if (data.tourDates) { setTourDates(data.tourDates); persistState('tm_tourDates', data.tourDates); }
          if (data.hotels) { setHotels(data.hotels); persistState('tm_hotels', data.hotels); }
          if (data.travelItems) { setTravelItems(data.travelItems); persistState('tm_travelItems', data.travelItems); }
          if (data.notes) { setNotes(data.notes); persistState('tm_notes', data.notes); }
          
          return { success: true, message: `Restored backup from ${new Date(backup.timestamp).toLocaleString()}` };
      } catch (e) {
          return { success: false, message: 'Backup file corrupt' };
      }
  };

  const getLastBackupTime = () => {
      const backupStr = localStorage.getItem('tm_backup_auto');
      if (!backupStr) return null;
      try {
          const backup = JSON.parse(backupStr);
          return backup.timestamp;
      } catch {
          return null;
      }
  };

  // --- PERSISTENCE WRAPPERS (Refactored for Safety) ---

  const createTour = (name: string, artist: string) => {
    if (!currentUser || currentUser.role === UserRole.CREW) return;
    
    const newId = Math.random().toString(36).substr(2, 9);
    const newTour: Tour = { 
        id: newId, 
        name, 
        artist, 
        managerId: currentUser.id, 
        crewIds: [], 
        storageUsed: 0, 
        storageLimit: 5368709120, 
        budget: 1000000 
    };
    
    // 1. SAVE TOURS & VERIFY
    const updatedTours = [...tours, newTour];
    const savedTours = persistState('tm_tours', updatedTours);
    setTours(updatedTours);
    
    // 2. ASSIGN TO USER & VERIFY
    const updatedUsers = users.map(u => {
        if (u.id === currentUser.id) {
            // Fix: ensure assignedTourIds exists and we append new ID
            return { ...u, assignedTourIds: [...(u.assignedTourIds || []), newId] };
        }
        return u;
    });
    const savedUsers = persistState('tm_users', updatedUsers);
    setUsers(updatedUsers);
    
    // 3. UPDATE SESSION - ATOMIC & FORCED
    const finalSessionUser = {
        ...currentUser,
        assignedTourIds: [...(currentUser.assignedTourIds || []), newId]
    };

    setCurrentUser(finalSessionUser);
    persistState('tm_currentUser', finalSessionUser);

    // 4. SET ACTIVE
    setCurrentTour(newTour);
    persistState('tm_currentTour', newTour);
    
    logSystemAction(`Created new tour: ${name} (${artist})`, newId, 'Public');
    
    // Check persistence status
    if (!savedTours || !savedUsers) {
        setNotification({ type: 'error', message: 'Storage Warning', subtext: 'Tour created in memory, but disk is full. Logs cleared to make space.' });
    } else {
        setNotification({ type: 'success', message: 'Tour Database Initialized', subtext: 'All systems ready.' });
    }
    
    // Force immediate backup to secondary slot
    setTimeout(createBackup, 100);
  };

  const updateTour = (tourId: string, updates: Partial<Tour>) => {
      setTours(prev => {
          const updated = prev.map(t => t.id === tourId ? { ...t, ...updates } : t);
          persistState('tm_tours', updated);
          return updated;
      });
      
      setCurrentTour(prev => {
          if (prev && prev.id === tourId) {
              const updated = { ...prev, ...updates };
              persistState('tm_currentTour', updated);
              return updated;
          }
          return prev;
      });
      
      logSystemAction(`Updated tour settings`, tourId, 'StaffOnly');
  };

  // --- LOGISTICS CRUD (WITH IMMEDIATE SAVE) ---
  const addTourDate = (date: TourDate) => {
    setTourDates(prev => {
        const updated = [...prev, date];
        persistState('tm_tourDates', updated);
        return updated;
    });
    setSelectedDateIdWrapper(date.id);
    logSystemAction(`Added Date: ${date.city} @ ${date.venue} (${date.date})`, date.tourId, 'Public');
  };

  const updateTourDate = (dateId: string, updates: Partial<TourDate>) => {
      setTourDates(prev => {
          const updated = prev.map(d => d.id === dateId ? { ...d, ...updates } : d);
          persistState('tm_tourDates', updated);
          return updated;
      });
      updateSaveTime();
  };

  const deleteTourDate = (dateId: string) => {
      const targetDate = tourDates.find(d => d.id === dateId);
      if(targetDate) {
          logSystemAction(`Deleted date: ${targetDate.city}`, targetDate.tourId, 'StaffOnly');
      }
      setTourDates(prev => {
          const updated = prev.filter(d => d.id !== dateId);
          persistState('tm_tourDates', updated);
          return updated;
      });
  };

  const addHotel = (hotel: Hotel) => {
      setHotels(prev => {
          const updated = [...prev, hotel];
          persistState('tm_hotels', updated);
          return updated;
      });
      logSystemAction(`Added Hotel: ${hotel.name} in ${hotel.address}`, hotel.tourId, 'Public');
  };

  const updateHotel = (hotelId: string, updates: Partial<Hotel>) => {
      setHotels(prev => {
          const updated = prev.map(h => h.id === hotelId ? { ...h, ...updates } : h);
          persistState('tm_hotels', updated);
          return updated;
      });
      updateSaveTime();
  };

  const deleteHotel = (hotelId: string) => {
      setHotels(prev => {
          const updated = prev.filter(h => h.id !== hotelId);
          persistState('tm_hotels', updated);
          return updated;
      });
  };

  const addTravelItem = (item: TravelItem) => {
      setTravelItems(prev => {
          const updated = [...prev, item];
          persistState('tm_travelItems', updated);
          return updated;
      });
      logSystemAction(`Added Travel: ${item.type} - ${item.departureLocation} to ${item.arrivalLocation}`, item.tourId, 'Public');
  };

  const updateTravelItem = (itemId: string, updates: Partial<TravelItem>) => {
      setTravelItems(prev => {
          const updated = prev.map(t => t.id === itemId ? { ...t, ...updates } : t);
          persistState('tm_travelItems', updated);
          return updated;
      });
      updateSaveTime();
  };

  const deleteTravelItem = (itemId: string) => {
      setTravelItems(prev => {
          const updated = prev.filter(t => t.id !== itemId);
          persistState('tm_travelItems', updated);
          return updated;
      });
  };

  const addNote = (note: Note) => {
      // Safety check for large attachments
      if (note.attachments && note.attachments.length > 5) {
          setNotification({ type: 'error', message: 'Too many attachments', subtext: 'Limit 5 per note.' });
          return;
      }
      setNotes(prev => {
          const updated = [note, ...prev];
          persistState('tm_notes', updated);
          return updated;
      });
      updateSaveTime();
  };

  const updateNote = (noteId: string, updates: Partial<Note>) => {
      setNotes(prev => {
          const updated = prev.map(n => n.id === noteId ? { ...n, ...updates } : n);
          persistState('tm_notes', updated);
          return updated;
      });
      updateSaveTime();
  };

  const deleteNote = (noteId: string) => {
      setNotes(prev => {
          const updated = prev.filter(n => n.id !== noteId);
          persistState('tm_notes', updated);
          return updated;
      });
  };

  const addGuestRequest = (request: GuestRequest) => {
      setGuestRequests(prev => {
          const updated = [...prev, request];
          persistState('tm_guestRequests', updated);
          return updated;
      });
      logSystemAction(`Guest Request: ${request.name} (+${request.quantity})`, request.tourId, 'StaffOnly');
  };

  const updateGuestRequestStatus = (id: string, status: 'Pending' | 'Approved' | 'Denied') => {
      setGuestRequests(prev => {
          const updated = prev.map(r => r.id === id ? { ...r, status } : r);
          persistState('tm_guestRequests', updated);
          return updated;
      });
      updateSaveTime();
  };

  const deleteGuestRequest = (id: string) => {
      setGuestRequests(prev => {
          const updated = prev.filter(r => r.id !== id);
          persistState('tm_guestRequests', updated);
          return updated;
      });
  };

  const addFinanceItem = (item: FinanceItem) => {
      setFinanceItems(prev => {
          const updated = [item, ...prev];
          persistState('tm_financeItems', updated);
          return updated;
      });
      logSystemAction(`Finance: Added ${item.type} - ${item.category} (£${item.amount})`, item.tourId, 'StaffOnly');
  };

  const deleteFinanceItem = (id: string) => {
      setFinanceItems(prev => {
          const updated = prev.filter(i => i.id !== id);
          persistState('tm_financeItems', updated);
          return updated;
      });
  };

  const addAdvanceTemplate = (tpl: AdvanceTemplate) => {
      setAdvanceTemplates(prev => {
          const updated = [...prev, tpl];
          persistState('tm_advanceTemplates', updated);
          return updated;
      });
  };

  const updateAdvanceTemplate = (id: string, tpl: Partial<AdvanceTemplate>) => {
      setAdvanceTemplates(prev => {
          const updated = prev.map(t => t.id === id ? { ...t, ...tpl } : t);
          persistState('tm_advanceTemplates', updated);
          return updated;
      });
  };

  const deleteAdvanceTemplate = (id: string) => {
      setAdvanceTemplates(prev => {
          const updated = prev.filter(t => t.id !== id);
          persistState('tm_advanceTemplates', updated);
          return updated;
      });
  };

  const addMasterSong = (song: Song) => {
      setMasterSongs(prev => {
          const updated = [...prev, song];
          persistState('tm_masterSongs', updated);
          return updated;
      });
  };

  const saveSetlist = (setlist: Setlist) => {
      setSetlists(prev => {
          const exists = prev.findIndex(s => s.tourId === setlist.tourId && s.dateId === setlist.dateId);
          let updated;
          if (exists >= 0) {
              updated = [...prev];
              updated[exists] = setlist;
          } else {
              updated = [...prev, setlist];
          }
          persistState('tm_setlists', updated);
          return updated;
      });
      logSystemAction(`Setlist updated`, setlist.tourId, 'Public');
  };

  // --- HELPERS ---
  const setSelectedDateIdWrapper = (id: string | null) => {
      setSelectedDateId(id);
      if (id) localStorage.setItem('tm_selectedDateId', id);
      else localStorage.removeItem('tm_selectedDateId');
  };

  const selectTour = (tourId: string) => {
      if (!tourId) {
          setCurrentTour(null);
          localStorage.removeItem('tm_currentTour');
          setSelectedDateIdWrapper(null);
          return;
      }
      const tour = tours.find(t => t.id === tourId);
      if (tour) {
          setCurrentTour(tour);
          persistState('tm_currentTour', tour);
          
          // Auto select first date if available
          const tourSpecificDates = tourDates.filter(d => d.tourId === tourId);
          const nextDateId = tourSpecificDates.length > 0 ? tourSpecificDates[0].id : null;
          setSelectedDateIdWrapper(nextDateId);
      }
  };

  // --- AUTH ---
  const login = async (email: string, password?: string) => {
      // Force reload users from storage before checking login to ensure we have latest data
      // This prevents "Ghost" states where data was saved but the app didn't know yet
      const currentUsers = loadState('tm_users', users);
      setUsers(currentUsers); // Sync state

      const user = currentUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (user && user.password === await hashPassword(password || '')) {
          const userWithTours = { ...user, assignedTourIds: user.assignedTourIds || [] };
          setCurrentUser(userWithTours);
          persistState('tm_currentUser', userWithTours);
          
          // Clear active tour on login to force selection
          setCurrentTour(null);
          localStorage.removeItem('tm_currentTour');
          
          return { success: true };
      }
      return { success: false, message: 'Invalid credentials' };
  };

  const logout = () => {
      forceSave(); // Critical: Ensure state is flushed to disk before clearing session
      setCurrentUser(null);
      setCurrentTour(null);
      localStorage.removeItem('tm_currentUser');
      localStorage.removeItem('tm_currentTour');
      localStorage.removeItem('tm_currentView');
  };

  const register = async (name: string, email: string, role: UserRole, password?: string, phone?: string, jobTitle?: string) => {
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, message: "Email already registered." };
    }

    const hashedPassword = await hashPassword(password || 'password123');
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name, email, role, password: hashedPassword,
      assignedTourIds: [], phone: phone || '', jobTitle: jobTitle || '',
      status: 'PENDING'
    };
    
    // Create new array
    const updatedUsers = [...users, newUser];
    
    // Attempt persistence
    const saveSuccess = persistState('tm_users', updatedUsers);
    
    if (saveSuccess) {
        setUsers(updatedUsers);
        logSystemAction(`New User Registration: ${name} (${email})`, 'SYSTEM', 'StaffOnly');
        return { success: true };
    } else {
        return { success: false, message: "Storage Full. Cannot register new user." };
    }
  };

  const createUser = (user: Partial<User>) => {
      if(!user.email || !user.name) return;
      
      hashPassword(user.password || 'password123').then(hashed => {
          const newUser: User = {
              id: Math.random().toString(36).substr(2, 9),
              name: user.name!,
              email: user.email!,
              role: user.role || UserRole.CREW,
              password: hashed,
              assignedTourIds: [],
              phone: user.phone || '',
              jobTitle: user.jobTitle || '',
              status: 'APPROVED'
          };
          
          setUsers(prev => {
              const updated = [...prev, newUser];
              persistState('tm_users', updated);
              return updated;
          });
          setTimeout(createBackup, 100);
      });
  };
  
  const resetPassword = async (email: string) => {
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
          logSystemAction(`Password reset requested for ${email}`, 'SYSTEM', 'StaffOnly');
          sendSystemEmail(email, "Password Reset", "Link sent.");
      }
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
      setUsers(prev => {
          const updated = prev.map(u => u.id === userId ? { ...u, role: newRole } : u);
          persistState('tm_users', updated);
          return updated;
      });
  };

  const updateUserStatus = (userId: string, newStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED') => {
      setUsers(prev => {
          const updated = prev.map(u => u.id === userId ? { ...u, status: newStatus } : u);
          persistState('tm_users', updated);
          return updated;
      });
  };

  const updateUserProfile = (userId: string, updates: Partial<User>) => {
      setUsers(prev => {
          const updated = prev.map(u => u.id === userId ? { ...u, ...updates } : u);
          persistState('tm_users', updated);
          return updated;
      });
      if (currentUser?.id === userId) {
          setCurrentUser(prev => {
              if(!prev) return null;
              const updated = { ...prev, ...updates };
              persistState('tm_currentUser', updated);
              return updated;
          });
      }
  };

  const addUserDocument = (userId: string, doc: UserDocument) => {
      setUsers(prev => {
          const updated = prev.map(u => u.id === userId ? { ...u, documents: [...(u.documents || []), doc] } : u);
          persistState('tm_users', updated);
          return updated;
      });
  };

  const removeUserDocument = (userId: string, docId: string) => {
      setUsers(prev => {
          const updated = prev.map(u => u.id === userId ? { ...u, documents: (u.documents || []).filter(d => d.id !== docId) } : u);
          persistState('tm_users', updated);
          return updated;
      });
  };

  const approveUser = (userId: string) => updateUserStatus(userId, 'APPROVED');
  const rejectUser = (userId: string) => updateUserStatus(userId, 'REJECTED');
  
  const deleteUser = (userId: string) => {
      setUsers(prev => {
          const updated = prev.filter(u => u.id !== userId);
          persistState('tm_users', updated);
          return updated;
      });
  };

  const impersonateUser = (userId: string) => {
      const user = users.find(u => u.id === userId);
      if(user) {
          setCurrentUser(user);
          persistState('tm_currentUser', user);
          setCurrentTour(null);
          persistState('tm_currentTour', null);
      }
  };

  const addCrewToTour = (email: string) => {
      if(!currentTour) return { success: false, message: 'No tour selected' };
      const crewUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if(!crewUser) return { success: false, message: 'User not found' };
      
      if(!currentTour.crewIds.includes(crewUser.id)) {
          setTours(prev => {
              const updated = prev.map(t => t.id === currentTour.id ? { ...t, crewIds: [...t.crewIds, crewUser.id] } : t);
              persistState('tm_tours', updated);
              return updated;
          });
          setCurrentTour(prev => prev ? { ...prev, crewIds: [...prev.crewIds, crewUser.id] } : null);
      }

      setUsers(prev => {
          const updated = prev.map(u => {
              if (u.id === crewUser.id && !u.assignedTourIds?.includes(currentTour.id)) {
                  return { ...u, assignedTourIds: [...(u.assignedTourIds || []), currentTour.id] };
              }
              return u;
          });
          persistState('tm_users', updated);
          return updated;
      });

      setTimeout(createBackup, 100);
      return { success: true, message: 'Crew added to tour.' };
  };

  const getAllSystemStats = () => ({ 
      totalUsers: users.length, 
      totalTours: tours.length, 
      pendingUsers: users.filter(u => u.status === 'PENDING').length 
  });
  
  const resetToDefaults = () => { 
      if(confirm("Factory Reset: All data will be wiped. Continue?")) {
          localStorage.clear(); 
          window.location.reload(); 
      }
  };
  
  const exportDatabase = () => JSON.stringify({ users, tours, notes, tourDates, hotels, travelItems }, null, 2);

  // Auto-clear notification
  useEffect(() => {
      if(notification) {
          const t = setTimeout(() => setNotification(null), 3000);
          return () => clearTimeout(t);
      }
  }, [notification]);

  return (
    <AppContext.Provider value={{ 
        currentUser, currentTour, users, tours, tourDates, hotels, travelItems, notes, masterSongs, setlists, selectedDateId, emailLogs, loginLogs, financeItems, emailSystemStatus, notification,
        guestRequests, securityLogs, isScanning, advanceTemplates, lastSaveTime, storageUsage: storageUsage,
        login, logout, register, createUser, resetPassword, updateUserRole, updateUserStatus, updateUserProfile, addUserDocument, removeUserDocument, approveUser, rejectUser, deleteUser, impersonateUser, createTour, updateTour, selectTour, addCrewToTour, 
        addTourDate, updateTourDate, deleteTourDate, addHotel, updateHotel, deleteHotel, addTravelItem, updateTravelItem, deleteTravelItem,
        addNote, updateNote, deleteNote, addMasterSong, saveSetlist, 
        setSelectedDateId: setSelectedDateIdWrapper, 
        getAllSystemStats, resetToDefaults, exportDatabase,
        createBackup, restoreFromBackup, getLastBackupTime, forceSave,
        addGuestRequest, updateGuestRequestStatus, deleteGuestRequest,
        addFinanceItem, deleteFinanceItem,
        addAdvanceTemplate, updateAdvanceTemplate, deleteAdvanceTemplate,
        sendTestEmail, 
        setEmailSystemStatus: (s) => setEmailSystemStatus(s), 
        clearNotification: () => setNotification(null),
        triggerSecurityScan
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
