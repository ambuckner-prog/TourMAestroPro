
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Tour, UserRole, TourDate, Hotel, TravelItem, Note, Song, Setlist } from '../types';

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
  selectedDateId: string | null; 
  login: (email: string, password?: string) => { success: boolean, message?: string };
  logout: () => void;
  register: (name: string, email: string, role: UserRole, password?: string, phone?: string, jobTitle?: string) => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  impersonateUser: (userId: string) => void;
  createTour: (name: string, artist: string) => void;
  updateTour: (tourId: string, updates: Partial<Tour>) => void;
  
  // Tour Dates
  addTourDate: (date: TourDate) => void;
  updateTourDate: (dateId: string, updates: Partial<TourDate>) => void;
  deleteTourDate: (dateId: string) => void;

  selectTour: (tourId: string) => void;
  addCrewToTour: (email: string) => { success: boolean; message: string };
  
  // Hotels
  addHotel: (hotel: Hotel) => void;
  updateHotel: (hotelId: string, updates: Partial<Hotel>) => void;
  deleteHotel: (hotelId: string) => void;

  // Travel
  addTravelItem: (item: TravelItem) => void;
  updateTravelItem: (itemId: string, updates: Partial<TravelItem>) => void;
  deleteTravelItem: (itemId: string) => void;

  // Notes
  addNote: (note: Note) => void;
  updateNote: (noteId: string, updates: Partial<Note>) => void;
  deleteNote: (noteId: string) => void;

  addMasterSong: (song: Song) => void;
  saveSetlist: (setlist: Setlist) => void;
  setSelectedDateId: (id: string | null) => void;
  getAllSystemStats: () => { totalUsers: number; totalTours: number, pendingUsers: number };
  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- SEED DATA ---
// NOTE: ambuckner@gmail.com is the hardcoded Master Admin
const SEED_USERS: User[] = [
  { id: '1', name: 'AM Buckner', email: 'ambuckner@gmail.com', password: 'master admin', role: UserRole.MASTER_ADMIN, assignedTourIds: [], phone: '555-0000', jobTitle: 'System Owner', status: 'APPROVED' },
  { id: '2', name: 'Support Staff', email: 'support@maestro.com', password: 'password123', role: UserRole.SUPPORT_STAFF, assignedTourIds: [], phone: '555-0001', jobTitle: 'Customer Success', status: 'APPROVED' },
  { id: '3', name: 'Kyle James', email: 'manager@band.com', password: 'password123', role: UserRole.TOUR_MANAGER, assignedTourIds: ['t1'], phone: '310-555-0199', jobTitle: 'Tour Director', status: 'APPROVED' },
  { id: '4', name: 'Roadie Rick', email: 'crew@band.com', password: 'password123', role: UserRole.CREW, assignedTourIds: ['t1'], phone: '310-555-0142', jobTitle: 'Production Assistant', status: 'APPROVED' },
];

const SEED_TOURS: Tour[] = [
  { 
      id: 't1', 
      name: 'Neon Horizons 2025', 
      artist: 'The Synthwavers', 
      managerId: '3', 
      crewIds: ['4'],
      storageUsed: 2.1 * 1024 * 1024 * 1024, // 2.1 GB used
      storageLimit: 5 * 1024 * 1024 * 1024 // 5 GB Limit
  }
];

const SEED_DATES: TourDate[] = [
  { id: '1', tourId: 't1', date: '2025-10-15', city: 'Chicago, IL', venue: 'United Center', status: 'Confirmed', capacity: 23500, venuePhone: '312-455-4500' },
  { id: '2', tourId: 't1', date: '2025-10-17', city: 'Detroit, MI', venue: 'Little Caesars Arena', status: 'Confirmed', capacity: 20000 },
  { id: '3', tourId: 't1', date: '2025-10-19', city: 'Toronto, ON', venue: 'Scotiabank Arena', status: 'Pending', capacity: 19800 },
];

const SEED_HOTELS: Hotel[] = [
    { 
        id: 'h1', 
        tourId: 't1', 
        name: 'The Langham Chicago', 
        address: '330 N Wabash Ave, Chicago, IL 60611', 
        phone: '+1 312-923-9988', 
        contactName: 'Front Desk', 
        notes: 'Late checkout requested for band.', 
        checkIn: '2025-10-14', 
        checkOut: '2025-10-16' 
    }
];

const SEED_TRAVEL: TravelItem[] = [
  {
    id: 'tr1',
    tourId: 't1',
    type: 'Flight',
    carrier: 'Delta Airlines',
    number: 'DL442',
    departureDate: '2025-10-14',
    departureTime: '08:00',
    departureLocation: 'LAX',
    arrivalDate: '2025-10-14',
    arrivalTime: '14:30',
    arrivalLocation: 'ORD',
    notes: 'Band + TM'
  }
];

const SEED_NOTES: Note[] = [
    { 
        id: 'n1', 
        tourId: 't1', 
        content: 'Spoke with Production Manager at United Center. Loading dock access opens at 7 AM sharp. Confirmed pyrotechnics permit is on file.', 
        type: 'Call', 
        authorName: 'Kyle James', 
        date: new Date(Date.now() - 86400000).toISOString(), 
        attachments: [],
        visibility: 'Public'
    },
    { 
        id: 'n2', 
        tourId: 't1', 
        content: 'Received updated rider requirements from artist management. Need to add 6x towels and specific brand of coconut water.', 
        type: 'Email', 
        authorName: 'Kyle James', 
        date: new Date(Date.now() - 172800000).toISOString(), 
        attachments: ['rider_v2.pdf'],
        visibility: 'Public'
    },
    { 
        id: 'n3', 
        tourId: 't1', 
        content: 'CONFIDENTIAL: Performance guarantee payment has been wired. Balance due night of show.', 
        type: 'General', 
        authorName: 'Kyle James', 
        date: new Date(Date.now() - 200000000).toISOString(), 
        attachments: [],
        visibility: 'StaffOnly'
    }
];

const SEED_MASTER_SONGS: Song[] = [
    { id: 's1', title: 'Neon Nights', duration: '3:45', bpm: 128, key: 'Cm' },
    { id: 's2', title: 'Cyber Heart', duration: '4:12', bpm: 95, key: 'Am' },
    { id: 's3', title: 'Midnight Drive', duration: '3:30', bpm: 110, key: 'F' },
    { id: 's4', title: 'Digital Love', duration: '2:58', bpm: 130, key: 'G' },
    { id: 's5', title: 'Analog Dreams', duration: '5:10', bpm: 85, key: 'Dm' },
    { id: 's6', title: 'Encore: Velocity', duration: '4:45', bpm: 140, key: 'Em' },
    { id: 's7', title: 'Starlight Fade', duration: '3:20', bpm: 100, key: 'C' },
    { id: 's8', title: 'Bassline Junkie', duration: '2:45', bpm: 174, key: 'Fm' },
    { id: 's9', title: 'Retro Grade', duration: '4:00', bpm: 115, key: 'Bm' },
];

const SEED_SETLISTS: Setlist[] = [
    {
        id: 'sl1',
        tourId: 't1',
        // Undefined dateId means Master
        songs: [
            SEED_MASTER_SONGS[0],
            SEED_MASTER_SONGS[1],
            SEED_MASTER_SONGS[2],
            SEED_MASTER_SONGS[5]
        ]
    }
];

// Helper to load from local storage or fallback to seed
const loadState = <T,>(key: string, seed: T): T => {
    try {
        const saved = localStorage.getItem(key);
        if (saved) return JSON.parse(saved);
        return seed;
    } catch (e) {
        console.error(`Error loading key ${key}`, e);
        return seed;
    }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Session State (CurrentUser / CurrentTour) - separate so we can persist login across refresh
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
      const saved = localStorage.getItem('tm_currentUser');
      return saved ? JSON.parse(saved) : null;
  });
  const [currentTour, setCurrentTour] = useState<Tour | null>(() => {
      const saved = localStorage.getItem('tm_currentTour');
      return saved ? JSON.parse(saved) : null;
  });

  // Database State (Persisted)
  const [users, setUsers] = useState<User[]>(() => loadState('tm_users', SEED_USERS));
  const [tours, setTours] = useState<Tour[]>(() => loadState('tm_tours', SEED_TOURS));
  const [tourDates, setTourDates] = useState<TourDate[]>(() => loadState('tm_tourDates', SEED_DATES));
  const [hotels, setHotels] = useState<Hotel[]>(() => loadState('tm_hotels', SEED_HOTELS));
  const [travelItems, setTravelItems] = useState<TravelItem[]>(() => loadState('tm_travelItems', SEED_TRAVEL));
  const [notes, setNotes] = useState<Note[]>(() => loadState('tm_notes', SEED_NOTES));
  const [masterSongs, setMasterSongs] = useState<Song[]>(() => loadState('tm_masterSongs', SEED_MASTER_SONGS));
  const [setlists, setSetlists] = useState<Setlist[]>(() => loadState('tm_setlists', SEED_SETLISTS));
  
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);

  // --- PERSISTENCE EFFECTS ---
  // Save data to localStorage whenever it changes
  useEffect(() => { localStorage.setItem('tm_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('tm_tours', JSON.stringify(tours)); }, [tours]);
  useEffect(() => { localStorage.setItem('tm_tourDates', JSON.stringify(tourDates)); }, [tourDates]);
  useEffect(() => { localStorage.setItem('tm_hotels', JSON.stringify(hotels)); }, [hotels]);
  useEffect(() => { localStorage.setItem('tm_travelItems', JSON.stringify(travelItems)); }, [travelItems]);
  useEffect(() => { localStorage.setItem('tm_notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('tm_masterSongs', JSON.stringify(masterSongs)); }, [masterSongs]);
  useEffect(() => { localStorage.setItem('tm_setlists', JSON.stringify(setlists)); }, [setlists]);
  
  // Persist Session
  useEffect(() => {
      if (currentUser) localStorage.setItem('tm_currentUser', JSON.stringify(currentUser));
      else localStorage.removeItem('tm_currentUser');
  }, [currentUser]);

  useEffect(() => {
      if (currentTour) localStorage.setItem('tm_currentTour', JSON.stringify(currentTour));
      else localStorage.removeItem('tm_currentTour');
  }, [currentTour]);


  // Helper for System Logging
  const logSystemAction = (content: string, tourId: string) => {
    if (!currentUser) return;
    const auditNote: Note = {
        id: Math.random().toString(36).substr(2, 9),
        tourId: tourId,
        content: content,
        type: 'General',
        authorName: `${currentUser.name} (ID: ${currentUser.id})`,
        date: new Date().toISOString(),
        attachments: [],
        visibility: 'Public' // System logs are generally public or could be made StaffOnly
    };
    setNotes(prev => [auditNote, ...prev]);
  };

  // --- EMAIL SIMULATION SERVICE ---
  const sendSystemEmail = (to: string, subject: string, body: string) => {
      console.log(`%c[EMAIL SYSTEM] Sending to ${to}`, "color: #8b5cf6; font-weight: bold; font-size: 12px;");
      console.log(`SUBJECT: ${subject}`);
      console.log(`BODY: ${body}`);
      return true;
  };

  const login = (email: string, password?: string) => {
    // Standardize input
    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password || '';

    if (!cleanPassword) {
        return { success: false, message: 'Password is required.' };
    }

    const user = users.find(u => u.email.toLowerCase() === cleanEmail);
    
    if (!user) {
        return { success: false, message: 'Account not found.' };
    }

    // STRICT PASSWORD CHECK
    if (user.password !== cleanPassword) {
        return { success: false, message: 'Invalid credentials. Please try again.' };
    }

    if (user.status === 'PENDING') {
        return { success: false, message: 'Account pending approval by Master Admin. Please wait for your welcome email.' };
    }
    
    if (user.status === 'REJECTED') {
        return { success: false, message: 'Account application has been declined.' };
    }
    
    setCurrentUser(user);
    
    // Do NOT auto-select tour. Let Overview handle it.
    setCurrentTour(null);
    setSelectedDateId(null);

    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentTour(null);
    setSelectedDateId(null);
    localStorage.removeItem('tm_currentUser');
    localStorage.removeItem('tm_currentTour');
  };

  const register = (name: string, email: string, role: UserRole, password?: string, phone?: string, jobTitle?: string) => {
    if (users.find(u => u.email === email)) {
        alert("Email already registered");
        return;
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      role,
      password: password || 'password123',
      assignedTourIds: [],
      phone: phone || '',
      jobTitle: jobTitle || '',
      status: 'PENDING'
    };
    
    setUsers(prev => [...prev, newUser]);
    
    sendSystemEmail(
        email, 
        "Confirmation: Registration Received - Tour Maestro Pro", 
        `Dear ${name},\n\nWe have received your request to join Tour Maestro Pro. Your account is currently pending review by our Master Administration team.\n\nYou will receive a subsequent email with your login credentials and tour assignment once your profile has been approved.\n\nThank you,\nTour Maestro Pro Team\nhttp://tourmaestro.com`
    );
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    const updatedUsers = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
    setUsers(updatedUsers);
    if (currentUser?.id === userId) {
        setCurrentUser({ ...currentUser, role: newRole });
    }
  };

  const approveUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const updatedUsers = users.map(u => u.id === userId ? { ...u, status: 'APPROVED' as const } : u);
    setUsers(updatedUsers);

    sendSystemEmail(
        user.email,
        "Welcome Aboard! Your Tour Maestro Pro Account is Active",
        `Hi ${user.name},\n\nWe are pleased to inform you that your account has been approved by the Master Admin.\n\nACCESS DETAILS:\n- URL: https://app.tourmaestro.com\n- Username: ${user.email}\n\nYou now have full access to your assigned tours. Please log in to view your itinerary and dashboard.\n\nLet's get the show on the road!\n\nBest Regards,\nThe Tour Maestro Pro Team`
    );
  };

  const rejectUser = (userId: string) => {
    const updatedUsers = users.map(u => u.id === userId ? { ...u, status: 'REJECTED' as const } : u);
    setUsers(updatedUsers);
  };

  const impersonateUser = (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (user && user.status === 'APPROVED') {
          setCurrentUser(user);
          if(user.assignedTourIds.length > 0) {
              const t = tours.find(tr => tr.id === user.assignedTourIds[0]);
              setCurrentTour(t || null);
          } else {
              setCurrentTour(null);
          }
          alert(`You are now logged in as ${user.name}. Logout to return to your account.`);
      }
  };

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
      storageLimit: 5 * 1024 * 1024 * 1024 // 5 GB
    };

    setTours(prevTours => [...prevTours, newTour]);
    
    // Automatically assign the creator to the tour
    const currentAssigned = currentUser.assignedTourIds || [];
    const updatedAssignedIds = [...currentAssigned, newTour.id];
    const updatedUser = { ...currentUser, assignedTourIds: updatedAssignedIds };

    setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    setCurrentTour(newTour);
    setSelectedDateId(null);
  };

  const updateTour = (tourId: string, updates: Partial<Tour>) => {
      const updatedTours = tours.map(t => t.id === tourId ? { ...t, ...updates } : t);
      setTours(updatedTours);
      if (currentTour?.id === tourId) {
          setCurrentTour({ ...currentTour, ...updates });
      }
      logSystemAction(`System Log: Tour Configuration Updated`, tourId);
  };

  // --- TOUR DATES CRUD ---
  const addTourDate = (date: TourDate) => {
    setTourDates(prev => [...prev, date]);
    setSelectedDateId(date.id); 
    logSystemAction(`System Log: Added Tour Date - ${date.city}`, date.tourId);
  };

  const updateTourDate = (dateId: string, updates: Partial<TourDate>) => {
      setTourDates(prev => prev.map(d => d.id === dateId ? { ...d, ...updates } : d));
  };

  const deleteTourDate = (dateId: string) => {
      setTourDates(prev => prev.filter(d => d.id !== dateId));
      if (selectedDateId === dateId) setSelectedDateId(null);
  };

  const selectTour = (tourId: string) => {
    if (!tourId) {
        setCurrentTour(null);
        setSelectedDateId(null);
        return;
    }
    const tour = tours.find(t => t.id === tourId);
    if (tour && (currentUser?.role === UserRole.MASTER_ADMIN || currentUser?.role === UserRole.SUPPORT_STAFF || currentUser?.assignedTourIds.includes(tourId))) {
        setCurrentTour(tour);
        const tourSpecificDates = tourDates.filter(d => d.tourId === tourId);
        if (tourSpecificDates.length > 0) {
            setSelectedDateId(tourSpecificDates[0].id);
        } else {
            setSelectedDateId(null);
        }
    }
  };

  const addCrewToTour = (email: string) => {
    if (!currentTour || !currentUser) return { success: false, message: 'No active session' };
    const userToAdd = users.find(u => u.email === email);
    if (!userToAdd) return { success: false, message: 'User email not found.' };
    if (userToAdd.status !== 'APPROVED') return { success: false, message: 'User account is not yet approved.' };
    if (currentTour.crewIds.includes(userToAdd.id)) return { success: false, message: 'User already added.' };

    const updatedTour = { ...currentTour, crewIds: [...currentTour.crewIds, userToAdd.id] };
    setTours(tours.map(t => t.id === currentTour.id ? updatedTour : t));
    setCurrentTour(updatedTour);
    const updatedUser = { ...userToAdd, assignedTourIds: [...userToAdd.assignedTourIds, currentTour.id] };
    setUsers(users.map(u => u.id === userToAdd.id ? updatedUser : u));
    logSystemAction(`System Log: Added Staff Member - ${userToAdd.name}`, currentTour.id);
    return { success: true, message: 'Crew member added successfully.' };
  };

  // --- HOTELS CRUD ---
  const addHotel = (hotel: Hotel) => {
      setHotels(prev => [...prev, hotel]);
      logSystemAction(`System Log: Added Hotel - ${hotel.name}`, hotel.tourId);
  };

  const updateHotel = (hotelId: string, updates: Partial<Hotel>) => {
      const oldHotel = hotels.find(h => h.id === hotelId);
      setHotels(prev => prev.map(h => h.id === hotelId ? { ...h, ...updates } : h));
      
      // Auto-Log Changes
      if (oldHotel && currentUser) {
          const changedKeys = Object.keys(updates).filter(key => {
              const k = key as keyof Hotel;
              return updates[k] !== oldHotel[k];
          });
          if (changedKeys.length > 0) {
              logSystemAction(`[Logistics Update] Hotel: ${oldHotel.name}. Updated: ${changedKeys.join(', ')}.`, oldHotel.tourId);
          }
      }
  };

  const deleteHotel = (hotelId: string) => {
      setHotels(prev => prev.filter(h => h.id !== hotelId));
  };

  // --- TRAVEL CRUD ---
  const addTravelItem = (item: TravelItem) => {
    setTravelItems(prev => [...prev, item]);
    logSystemAction(`System Log: Added Travel - ${item.carrier} ${item.number}`, item.tourId);
  };

  const updateTravelItem = (itemId: string, updates: Partial<TravelItem>) => {
      const oldItem = travelItems.find(t => t.id === itemId);
      setTravelItems(prev => prev.map(t => t.id === itemId ? { ...t, ...updates } : t));

      // Auto-Log Changes
      if (oldItem && currentUser) {
          const changedKeys = Object.keys(updates).filter(key => {
              const k = key as keyof TravelItem;
              return updates[k] !== oldItem[k];
          });
          if (changedKeys.length > 0) {
              logSystemAction(`[Logistics Update] Travel: ${oldItem.carrier} ${oldItem.number}. Updated: ${changedKeys.join(', ')}.`, oldItem.tourId);
          }
      }
  };

  const deleteTravelItem = (itemId: string) => {
      setTravelItems(prev => prev.filter(t => t.id !== itemId));
  };

  // --- NOTES CRUD ---
  const addNote = (note: Note) => {
      setNotes(prev => [note, ...prev]);
      if (currentTour && note.attachments.length > 0) {
         const addedSize = note.attachments.length * 5 * 1024 * 1024;
         const updatedTour = { ...currentTour, storageUsed: currentTour.storageUsed + addedSize };
         setTours(tours.map(t => t.id === currentTour.id ? updatedTour : t));
         setCurrentTour(updatedTour);
      }
  };

  const updateNote = (noteId: string, updates: Partial<Note>) => {
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, ...updates } : n));
  };

  const deleteNote = (noteId: string) => {
      setNotes(prev => prev.filter(n => n.id !== noteId));
  };
  
  const addMasterSong = (song: Song) => {
      setMasterSongs(prev => [...prev, song]);
      if(currentTour) logSystemAction(`System Log: Added Song to Master Library - ${song.title}`, currentTour.id);
  };

  const saveSetlist = (setlist: Setlist) => {
      setSetlists(prev => {
          const exists = prev.findIndex(s => s.tourId === setlist.tourId && s.dateId === setlist.dateId);
          if (exists >= 0) {
              const updated = [...prev];
              updated[exists] = setlist;
              return updated;
          }
          return [...prev, setlist];
      });
      logSystemAction(`System Log: Updated Setlist for ${setlist.dateId ? 'Show' : 'Master'}`, setlist.tourId);
  };

  const getAllSystemStats = () => {
      return { 
          totalUsers: users.length, 
          totalTours: tours.length,
          pendingUsers: users.filter(u => u.status === 'PENDING').length
      };
  };

  const resetToDefaults = () => {
      if (window.confirm("Are you sure? This will WIPE ALL DATA and return the app to the initial demo state.")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  return (
    <AppContext.Provider value={{ 
        currentUser, currentTour, users, tours, tourDates, hotels, travelItems, notes, masterSongs, setlists, selectedDateId,
        login, logout, register, updateUserRole, approveUser, rejectUser, impersonateUser, createTour, updateTour, selectTour, addCrewToTour, 
        addTourDate, updateTourDate, deleteTourDate,
        addHotel, updateHotel, deleteHotel,
        addTravelItem, updateTravelItem, deleteTravelItem,
        addNote, updateNote, deleteNote,
        addMasterSong, saveSetlist, setSelectedDateId, getAllSystemStats, resetToDefaults 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
