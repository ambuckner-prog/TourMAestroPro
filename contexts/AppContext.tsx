
import React, { createContext, useContext, useState, useEffect } from 'react';
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
  advanceTemplates: AdvanceTemplate[]; // New
  selectedDateId: string | null;
  emailLogs: EmailLog[];
  loginLogs: LoginLog[];
  securityLogs: SecurityLog[];
  emailSystemStatus: EmailSystemStatus;
  notification: Notification | null; // Global notification
  isScanning: boolean;
  
  login: (email: string, password?: string) => Promise<{ success: boolean, message?: string }>;
  logout: () => void;
  register: (name: string, email: string, role: UserRole, password?: string, phone?: string, jobTitle?: string) => Promise<{ success: boolean, message?: string }>;
  createUser: (user: Partial<User>) => void; // Manual create
  resetPassword: (email: string) => Promise<void>;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  updateUserStatus: (userId: string, newStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED') => void;
  updateUserProfile: (userId: string, updates: Partial<User>) => void; // New profile updater
  addUserDocument: (userId: string, doc: UserDocument) => void; // New
  removeUserDocument: (userId: string, docId: string) => void; // New
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  deleteUser: (userId: string) => void;
  impersonateUser: (userId: string) => void;
  createTour: (name: string, artist: string) => void;
  updateTour: (tourId: string, updates: Partial<Tour>) => void;
  
  // Email System
  sendTestEmail: (to: string) => void;
  setEmailSystemStatus: (status: EmailSystemStatus) => void;
  clearNotification: () => void;

  // Security
  triggerSecurityScan: (type: 'AUTOMATED' | 'MANUAL') => Promise<void>;

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

  // Guest List
  addGuestRequest: (request: GuestRequest) => void;
  updateGuestRequestStatus: (id: string, status: 'Pending' | 'Approved' | 'Denied') => void;
  deleteGuestRequest: (id: string) => void;

  // Finance
  addFinanceItem: (item: FinanceItem) => void;
  deleteFinanceItem: (id: string) => void;

  // Templates
  addAdvanceTemplate: (tpl: AdvanceTemplate) => void;
  updateAdvanceTemplate: (id: string, tpl: Partial<AdvanceTemplate>) => void;
  deleteAdvanceTemplate: (id: string) => void;

  addMasterSong: (song: Song) => void;
  saveSetlist: (setlist: Setlist) => void;
  setSelectedDateId: (id: string | null) => void;
  getAllSystemStats: () => { totalUsers: number; totalTours: number, pendingUsers: number };
  resetToDefaults: () => void;
  exportDatabase: () => string; // Returns JSON string
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- UTILS ---
const hashPassword = async (password: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// --- SEED DATA ---
const SEED_USERS: User[] = [
  // Password for all seed users is 'password123' (hash: ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f)
  { 
      id: '1', name: 'AM Buckner', email: 'ambuckner@gmail.com', password: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', role: UserRole.MASTER_ADMIN, assignedTourIds: [], phone: '555-0000', jobTitle: 'System Owner', status: 'APPROVED',
      emergencyContactName: 'Management Office', emergencyContactPhone: '555-9999', emergencyContactRelation: 'Business'
  },
  { id: '2', name: 'Support Staff', email: 'support@maestro.com', password: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', role: UserRole.SUPPORT_STAFF, assignedTourIds: [], phone: '555-0001', jobTitle: 'Customer Success', status: 'APPROVED' },
  { 
      id: '3', name: 'Kyle James', email: 'manager@band.com', password: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', role: UserRole.TOUR_MANAGER, assignedTourIds: ['t1'], phone: '310-555-0199', jobTitle: 'Tour Director', status: 'APPROVED',
      dietaryRestrictions: 'Vegan', shirtSize: 'L', passportNumber: 'US99887766'
  },
  { id: '4', name: 'Roadie Rick', email: 'crew@band.com', password: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', role: UserRole.CREW, assignedTourIds: ['t1'], phone: '310-555-0142', jobTitle: 'Production Assistant', status: 'APPROVED' },
];

const SEED_TOURS: Tour[] = [
  { 
      id: 't1', 
      name: 'Neon Horizons 2025', 
      artist: 'The Synthwavers', 
      managerId: '3', 
      crewIds: ['4'],
      storageUsed: 2.1 * 1024 * 1024 * 1024, // 2.1 GB used
      storageLimit: 5 * 1024 * 1024 * 1024, // 5 GB Limit
      budget: 1500000 // 1.5M Budget
  }
];

const SEED_ADVANCE_TEMPLATES: AdvanceTemplate[] = [
    {
        id: 't_standard',
        tourId: 'SYSTEM',
        name: 'Standard Venue Advance',
        description: 'Typical advance for 500-2000 cap rooms.',
        fields: [
            { id: 'f1', label: 'Load-in Parking', defaultValue: 'Confirm truck/bus parking location and power.', category: 'Production' },
            { id: 'f2', label: 'Shore Power', defaultValue: 'Need 60A 3-Phase for Audio, 60A for Lights.', category: 'Production' },
            { id: 'f3', label: 'Dressing Rooms', defaultValue: 'Need 1 large room (Band) + 1 small (Production).', category: 'Hospitality' },
            { id: 'f4', label: 'Merch Rate', defaultValue: 'Confirm 80/20 soft, 90/10 recorded.', category: 'Merch' },
            { id: 'f5', label: 'Security Meeting', defaultValue: 'Time: 30 mins before doors.', category: 'Security' },
        ]
    },
    {
        id: 't_festival',
        tourId: 'SYSTEM',
        name: 'Festival Main Stage',
        description: 'Short changeover, high strictness.',
        fields: [
            { id: 'f1', label: 'Rolling Risers', defaultValue: 'Are rolling risers provided? Dimensions?', category: 'Production' },
            { id: 'f2', label: 'Changeover Time', defaultValue: 'Strict 20 min set change.', category: 'Production' },
            { id: 'f3', label: 'Catering', defaultValue: 'Confirm artist catering access passes.', category: 'Hospitality' },
            { id: 'f4', label: 'Guest List', defaultValue: 'Submit list 48h prior. No adds day of show.', category: 'Security' },
        ]
    }
];

const SEED_DATES: TourDate[] = [
  { 
      id: '1', 
      tourId: 't1', 
      date: '2025-10-15', 
      city: 'Chicago, IL', 
      venue: 'United Center', 
      status: 'Confirmed', 
      advanceStatus: 'CONFIRMED', // Already done
      capacity: 23500, 
      venuePhone: '312-455-4500',
      venueContactName: 'John Doe',
      venueContactPhone: '312-555-0199',
      venueContactEmail: 'j.doe@unitedcenter.com',
      documents: [],
      schedule: [
          { id: 's1', title: 'Load In', startTime: '08:00', type: 'Production' },
          { id: 's2', title: 'Lunch', startTime: '13:00', endTime: '14:00', type: 'Other' },
          { id: 's3', title: 'Soundcheck', startTime: '16:00', endTime: '17:30', type: 'Production' },
          { id: 's4', title: 'Doors', startTime: '19:00', type: 'Show' },
          { id: 's5', title: 'Show', startTime: '20:00', endTime: '22:30', type: 'Show' },
      ]
  },
  { 
      id: '2', 
      tourId: 't1', 
      date: '2025-10-17', 
      city: 'Detroit, MI', 
      venue: 'Little Caesars Arena', 
      status: 'Confirmed', 
      advanceStatus: 'IN_PROGRESS', 
      capacity: 20000, 
      schedule: [], 
      documents: [] 
  },
  { 
      id: '3', 
      tourId: 't1', 
      date: '2025-10-19', 
      city: 'Toronto, ON', 
      venue: 'Scotiabank Arena', 
      status: 'Pending', 
      advanceStatus: 'NOT_STARTED',
      capacity: 19800, 
      schedule: [], 
      documents: [] 
  },
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

const SEED_GUEST_REQUESTS: GuestRequest[] = [
    { id: 'g1', tourId: 't1', dateId: '1', name: 'John Doe', affiliation: 'Label Rep', quantity: 2, status: 'Pending' },
    { id: 'g2', tourId: 't1', dateId: '1', name: 'Sarah Smith', affiliation: 'Radio Contest', quantity: 4, status: 'Approved' },
    { id: 'g3', tourId: 't1', dateId: '2', name: 'Mike Jones', affiliation: 'Band Family', quantity: 2, status: 'Pending' },
    { id: 'g4', tourId: 't1', dateId: '2', name: 'Emily Davis', affiliation: 'Press', quantity: 1, status: 'Denied' },
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
        songs: [SEED_MASTER_SONGS[0], SEED_MASTER_SONGS[1], SEED_MASTER_SONGS[2], SEED_MASTER_SONGS[5]]
    }
];

const SEED_FINANCE: FinanceItem[] = [
    { id: 'f1', tourId: 't1', type: 'EXPENSE', category: 'Travel', amount: 4500.00, paySource: 'Amex 8812', description: 'Flights: LAX -> ORD', date: '2025-10-14' },
    { id: 'f2', tourId: 't1', type: 'EXPENSE', category: 'Accommodation', amount: 8200.50, paySource: 'Amex 8812', description: 'Chicago Hotel Block', date: '2025-10-15' },
    { id: 'f3', tourId: 't1', type: 'INCOME', category: 'Guarantee', amount: 150000.00, paySource: 'Wire Transfer', description: 'United Center 50% Deposit', date: '2025-10-15' },
    { id: 'f4', tourId: 't1', type: 'EXPENSE', category: 'Production', amount: 2100.00, paySource: 'Wire Transfer', description: 'Backline Rental', date: '2025-10-15' },
];

// Helper to load from local storage
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
  // Session State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
      const saved = localStorage.getItem('tm_currentUser');
      return saved ? JSON.parse(saved) : null;
  });
  const [currentTour, setCurrentTour] = useState<Tour | null>(() => {
      const saved = localStorage.getItem('tm_currentTour');
      return saved ? JSON.parse(saved) : null;
  });

  // Global Notification System
  const [notification, setNotification] = useState<Notification | null>(null);

  // Database State
  const [users, setUsers] = useState<User[]>(() => loadState('tm_users', SEED_USERS));
  const [tours, setTours] = useState<Tour[]>(() => loadState('tm_tours', SEED_TOURS));
  const [tourDates, setTourDates] = useState<TourDate[]>(() => loadState('tm_tourDates', SEED_DATES));
  const [hotels, setHotels] = useState<Hotel[]>(() => loadState('tm_hotels', SEED_HOTELS));
  const [travelItems, setTravelItems] = useState<TravelItem[]>(() => loadState('tm_travelItems', SEED_TRAVEL));
  const [notes, setNotes] = useState<Note[]>(() => loadState('tm_notes', SEED_NOTES));
  const [masterSongs, setMasterSongs] = useState<Song[]>(() => loadState('tm_masterSongs', SEED_MASTER_SONGS));
  const [setlists, setSetlists] = useState<Setlist[]>(() => loadState('tm_setlists', SEED_SETLISTS));
  const [guestRequests, setGuestRequests] = useState<GuestRequest[]>(() => loadState('tm_guestRequests', SEED_GUEST_REQUESTS));
  const [financeItems, setFinanceItems] = useState<FinanceItem[]>(() => loadState('tm_financeItems', SEED_FINANCE));
  const [advanceTemplates, setAdvanceTemplates] = useState<AdvanceTemplate[]>(() => loadState('tm_advanceTemplates', SEED_ADVANCE_TEMPLATES));
  
  // Email System State
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(() => loadState('tm_emailLogs', []));
  const [emailSystemStatus, setEmailSystemStatus] = useState<EmailSystemStatus>('ENABLED');
  
  // Auth & Security Logs
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>(() => loadState('tm_loginLogs', []));
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>(() => loadState('tm_securityLogs', []));
  const [isScanning, setIsScanning] = useState(false);

  // Persistent Selected Date
  const [selectedDateId, setSelectedDateId] = useState<string | null>(() => {
      return localStorage.getItem('tm_selectedDateId');
  });

  // --- PERSISTENCE ---
  useEffect(() => { localStorage.setItem('tm_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('tm_tours', JSON.stringify(tours)); }, [tours]);
  useEffect(() => { localStorage.setItem('tm_tourDates', JSON.stringify(tourDates)); }, [tourDates]);
  useEffect(() => { localStorage.setItem('tm_hotels', JSON.stringify(hotels)); }, [hotels]);
  useEffect(() => { localStorage.setItem('tm_travelItems', JSON.stringify(travelItems)); }, [travelItems]);
  useEffect(() => { localStorage.setItem('tm_notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('tm_masterSongs', JSON.stringify(masterSongs)); }, [masterSongs]);
  useEffect(() => { localStorage.setItem('tm_setlists', JSON.stringify(setlists)); }, [setlists]);
  useEffect(() => { localStorage.setItem('tm_guestRequests', JSON.stringify(guestRequests)); }, [guestRequests]);
  useEffect(() => { localStorage.setItem('tm_financeItems', JSON.stringify(financeItems)); }, [financeItems]);
  useEffect(() => { localStorage.setItem('tm_advanceTemplates', JSON.stringify(advanceTemplates)); }, [advanceTemplates]);
  useEffect(() => { localStorage.setItem('tm_emailLogs', JSON.stringify(emailLogs)); }, [emailLogs]);
  useEffect(() => { localStorage.setItem('tm_loginLogs', JSON.stringify(loginLogs)); }, [loginLogs]);
  useEffect(() => { localStorage.setItem('tm_securityLogs', JSON.stringify(securityLogs)); }, [securityLogs]);
  
  useEffect(() => {
      if (currentUser) localStorage.setItem('tm_currentUser', JSON.stringify(currentUser));
      else localStorage.removeItem('tm_currentUser');
  }, [currentUser]);

  useEffect(() => {
      if (currentTour) localStorage.setItem('tm_currentTour', JSON.stringify(currentTour));
      else localStorage.removeItem('tm_currentTour');
  }, [currentTour]);

  // Persist Selected Date ID to prevent context loss on refresh
  useEffect(() => {
      if (selectedDateId) localStorage.setItem('tm_selectedDateId', selectedDateId);
      else localStorage.removeItem('tm_selectedDateId');
  }, [selectedDateId]);

  // --- AUTOMATED SECURITY SCAN (Every 4 Hours) ---
  useEffect(() => {
      const intervalMs = 4 * 60 * 60 * 1000; // 4 Hours
      const intervalId = setInterval(() => {
          triggerSecurityScan('AUTOMATED');
      }, intervalMs);

      return () => clearInterval(intervalId);
  }, []); // Run once on mount to set interval

  const triggerSecurityScan = async (type: 'AUTOMATED' | 'MANUAL') => {
      setIsScanning(true);
      
      // Simulate scan duration
      await new Promise(resolve => setTimeout(resolve, 3000));

      const threats: string[] = [];
      
      // 1. Check for failed logins
      const recentFailures = loginLogs.slice(0, 10).filter(l => l.status === 'FAILED');
      if (recentFailures.length > 5) {
          threats.push("Excessive failed login attempts detected.");
      }

      // 2. Check for blocked users
      const blockedUsers = users.filter(u => u.status === 'BLOCKED');
      if (blockedUsers.length > 0) {
          threats.push(`${blockedUsers.length} blocked account(s) present in active registry.`);
      }

      // 3. Random simulated threat (10% chance)
      if (Math.random() < 0.1) {
          threats.push("Unusual traffic pattern from unknown IP address.");
      }

      const status = threats.length > 0 ? (type === 'MANUAL' ? 'WARNING' : 'CRITICAL') : 'CLEAN';
      const details = threats.length > 0 
          ? threats.join(' | ') 
          : "System integrity verified. No anomalies detected.";

      const log: SecurityLog = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          scanType: type,
          status,
          details,
          threatsFound: threats.length
      };

      setSecurityLogs(prev => [log, ...prev]);
      
      if (status !== 'CLEAN' && currentUser?.role === UserRole.MASTER_ADMIN) {
          setNotification({ 
              type: 'error', 
              message: `Security Alert: ${status}`, 
              subtext: `${threats.length} threat(s) detected during scan.` 
          });
      } else if (type === 'MANUAL') {
          setNotification({ type: 'success', message: 'Security Scan Complete', subtext: 'System is healthy.' });
      }

      setIsScanning(false);
  };

  // Auto-clear notifications
  useEffect(() => {
      if (notification) {
          const timer = setTimeout(() => setNotification(null), 5000);
          return () => clearTimeout(timer);
      }
  }, [notification]);

  const clearNotification = () => setNotification(null);

  const logSystemAction = (content: string, tourId: string) => {
    // If no currentUser (e.g. registration), use 'SYSTEM' as author
    const author = currentUser ? `${currentUser.name} (ID: ${currentUser.id})` : 'SYSTEM';
    const auditNote: Note = {
        id: Math.random().toString(36).substr(2, 9),
        tourId: tourId,
        content: content,
        type: 'General',
        authorName: author,
        date: new Date().toISOString(),
        attachments: [],
        visibility: 'StaffOnly'
    };
    setNotes(prev => [auditNote, ...prev]);
  };

  const recordLoginAttempt = (email: string, status: 'SUCCESS' | 'FAILED' | 'BLOCKED') => {
      const log: LoginLog = {
          id: Math.random().toString(36).substr(2, 9),
          email,
          status,
          timestamp: new Date().toISOString(),
          ip: '127.0.0.1 (Local)', // Simulated environment
          userAgent: navigator.userAgent
      };
      setLoginLogs(prev => [log, ...prev]);
  };

  // --- EMAIL SERVICE ---
  const sendSystemEmail = (to: string, subject: string, body: string) => {
      if (emailSystemStatus === 'BLOCKED') {
          console.log(`[EMAIL BLOCKED] System disabled. Destination: ${to}`);
          setNotification({ type: 'error', message: 'Email Blocked (SMTP Disabled)' });
          return false;
      }
      
      const newLog: EmailLog = {
          id: Math.random().toString(36).substr(2, 9),
          to,
          subject: emailSystemStatus === 'SIMULATION' ? `[SIM] ${subject}` : subject,
          body,
          timestamp: new Date().toISOString(),
          status: emailSystemStatus === 'SIMULATION' ? 'QUEUED' : 'SENT'
      };
      
      setEmailLogs(prev => [newLog, ...prev]);
      
      // Trigger UI Toast
      setNotification({
          type: emailSystemStatus === 'SIMULATION' ? 'info' : 'success',
          message: emailSystemStatus === 'SIMULATION' ? `Simulated Email to ${to}` : `Email Sent to ${to}`,
          subtext: "View in Inbox"
      });
      
      console.log(`[EMAIL ${emailSystemStatus}] To: ${to} | Subject: ${subject}`);
      return true;
  };

  const sendTestEmail = (to: string) => {
      sendSystemEmail(
          to, 
          "Test Notification: SMTP Verification", 
          "This is a test email sent from the Back Office to verify the automated email infrastructure is active and routing correctly."
      );
  };

  const login = async (email: string, password?: string) => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password || '';

    if (!cleanPassword) {
        recordLoginAttempt(cleanEmail, 'FAILED');
        return { success: false, message: 'Password is required.' };
    }

    const user = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
        recordLoginAttempt(cleanEmail, 'FAILED');
        return { success: false, message: 'Account not found.' };
    }

    if (user.status === 'BLOCKED') {
        recordLoginAttempt(cleanEmail, 'BLOCKED');
        return { success: false, message: 'Your account has been blocked by the administrator.' };
    }

    const hashedInput = await hashPassword(cleanPassword);
    
    if (user.password !== hashedInput) {
        if (user.password !== cleanPassword) {
            recordLoginAttempt(cleanEmail, 'FAILED');
            return { success: false, message: 'Invalid credentials. Please try again.' };
        }
    }

    if (user.status === 'PENDING') {
        recordLoginAttempt(cleanEmail, 'FAILED');
        return { success: false, message: 'Account pending approval by Master Admin.' };
    }
    
    if (user.status === 'REJECTED') {
        recordLoginAttempt(cleanEmail, 'BLOCKED');
        return { success: false, message: 'Account application has been declined.' };
    }
    
    recordLoginAttempt(cleanEmail, 'SUCCESS');
    setCurrentUser(user);
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
    localStorage.removeItem('tm_selectedDateId');
    localStorage.removeItem('tm_currentView'); // Also clear view on logout
  };

  const register = async (name: string, email: string, role: UserRole, password?: string, phone?: string, jobTitle?: string) => {
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, message: "Email already registered. Please login or use a different email." };
    }

    const hashedPassword = await hashPassword(password || 'password123');
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name, email, role, password: hashedPassword,
      assignedTourIds: [], phone: phone || '', jobTitle: jobTitle || '',
      status: 'PENDING'
    };
    
    setUsers(prev => [...prev, newUser]);
    
    // Log for Audit
    logSystemAction(`New User Registration: ${name} (${email}) - Pending Approval`, 'SYSTEM');
    
    // Explicitly send email here so it shows up in logs immediately
    sendSystemEmail(
        email, 
        "Registration Received", 
        `Dear ${name}, your request is pending Master Admin approval.`
    );
    
    // Also notify master admin (simulated)
    sendSystemEmail(
        "ambuckner@gmail.com",
        "New User Registration",
        `New user ${name} (${email}) has registered and is pending approval.`
    );

    return { success: true };
  };

  const createUser = async (userData: Partial<User>) => {
      // Manual creation by admin
      if (!userData.email || !userData.name) return;
      if (users.find(u => u.email.toLowerCase() === userData.email?.toLowerCase())) return;

      const defaultPass = await hashPassword(userData.password || 'password123');
      
      const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          name: userData.name,
          email: userData.email,
          role: userData.role || UserRole.CREW,
          password: defaultPass,
          assignedTourIds: [],
          phone: userData.phone || '',
          jobTitle: userData.jobTitle || '',
          status: 'APPROVED' // Auto-approve manual adds
      };

      setUsers(prev => [...prev, newUser]);
      logSystemAction(`Manual User Creation: ${newUser.name} created by Admin`, 'SYSTEM');
      
      sendSystemEmail(
          newUser.email,
          "Account Created",
          `Welcome to Tour Maestro Pro. Your account has been created by the administrator.\n\nLogin: ${newUser.email}\nTemp Password: ${userData.password || 'password123'}`
      );
      setNotification({ type: 'success', message: 'User Created Successfully' });
  };

  const resetPassword = async (email: string) => {
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      await new Promise(resolve => setTimeout(resolve, 800));

      if (user) {
          sendSystemEmail(
              user.email, 
              "Password Reset Request - Tour Maestro Pro", 
              `Hello ${user.name},\n\nWe received a request to reset your password.\n\nClick here to reset: https://app.tourmaestro.com/reset-password?token=${Math.random().toString(36).substr(2)}\n\nIf you did not request this, please ignore this email.`
          );
      } else {
           sendSystemEmail(
               email,
               "Account Recovery Attempt (Unregistered)",
               "A password reset was requested for this email address, but no matching account was found in the database. No action required."
           );
      }
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    const updatedUsers = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
    setUsers(updatedUsers);
    if (currentUser?.id === userId) setCurrentUser({ ...currentUser, role: newRole });
    setNotification({ type: 'success', message: 'User Role Updated' });
  };

  const updateUserStatus = (userId: string, newStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED') => {
      const user = users.find(u => u.id === userId);
      if(!user) return;

      const updatedUsers = users.map(u => u.id === userId ? { ...u, status: newStatus } : u);
      setUsers(updatedUsers);
      
      logSystemAction(`User Status Changed: ${user.name} -> ${newStatus}`, 'SYSTEM');
      
      if (newStatus === 'APPROVED' && user.status !== 'APPROVED') {
           sendSystemEmail(user.email, "Account Approved", "Your account has been approved.");
      } else if (newStatus === 'BLOCKED') {
           // Optionally send email or just silently block
      }

      setNotification({ type: 'success', message: `User status set to ${newStatus}` });
  };

  const updateUserProfile = (userId: string, updates: Partial<User>) => {
      const updatedUsers = users.map(u => u.id === userId ? { ...u, ...updates } : u);
      setUsers(updatedUsers);
      if (currentUser?.id === userId) {
          setCurrentUser(prev => prev ? ({ ...prev, ...updates }) : null);
      }
      setNotification({ type: 'success', message: 'Profile updated' });
  };

  const addUserDocument = (userId: string, doc: UserDocument) => {
      setUsers(prev => prev.map(u => {
          if (u.id === userId) {
              return { ...u, documents: [...(u.documents || []), doc] };
          }
          return u;
      }));
      setNotification({ type: 'success', message: 'Document added' });
  };

  const removeUserDocument = (userId: string, docId: string) => {
      setUsers(prev => prev.map(u => {
          if (u.id === userId) {
              return { ...u, documents: (u.documents || []).filter(d => d.id !== docId) };
          }
          return u;
      }));
      setNotification({ type: 'info', message: 'Document removed' });
  };

  const approveUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    // 1. Update status
    setUsers(users.map(u => u.id === userId ? { ...u, status: 'APPROVED' } : u));
    logSystemAction(`User Approved: ${user.name} (${user.email})`, 'SYSTEM');
    
    // 2. Email the User (Welcome)
    sendSystemEmail(
        user.email, 
        "Welcome Aboard! Account Active", 
        `Hi ${user.name},\n\nYour account has been approved by the Master Admin.\n\nYou can now log in at: https://app.tourmaestro.com`
    );

    setNotification({ type: 'success', message: 'User Approved', subtext: `${user.name} is now active.` });
  };

  const rejectUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    setUsers(users.map(u => u.id === userId ? { ...u, status: 'REJECTED' } : u));
    logSystemAction(`User Declined: ${user.name} (${user.email})`, 'SYSTEM');
    
    // Email the User (Rejection)
    sendSystemEmail(
        user.email,
        "Account Status Update",
        `Dear ${user.name},\n\nYour request for access to Tour Maestro Pro has been declined at this time. Please contact support if you believe this is an error.`
    );

    setNotification({ type: 'error', message: 'User Declined', subtext: 'Rejection email sent.' });
  };

  const deleteUser = (userId: string) => {
      // UK GDPR Right to Erasure
      const user = users.find(u => u.id === userId);
      if(!user) return;

      logSystemAction(`GDPR Deletion: User ${user.email} (ID: ${userId}) was permanently deleted.`, 'SYSTEM');
      
      setUsers(prev => prev.filter(u => u.id !== userId));
      
      setTours(prev => prev.map(t => ({
          ...t,
          crewIds: t.crewIds.filter(id => id !== userId),
      })));

      setNotification({ type: 'success', message: 'User Deleted (GDPR)', subtext: 'All data removed.' });
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
          setNotification({ type: 'info', message: `Logged in as ${user.name}` });
      }
  };

  const createTour = (name: string, artist: string) => {
    if (!currentUser || currentUser.role === UserRole.CREW) return;
    const newId = Math.random().toString(36).substr(2, 9);
    const newTour: Tour = { id: newId, name, artist, managerId: currentUser.id, crewIds: [], storageUsed: 0, storageLimit: 5368709120, budget: 1000000 };
    
    // Use functional update to ensure we have latest state
    setTours(prev => [...prev, newTour]);
    
    const updatedUser = { 
        ...currentUser, 
        assignedTourIds: [...(currentUser.assignedTourIds || []), newTour.id] 
    };
    
    // Update global users list
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    
    // Update session
    setCurrentUser(updatedUser);
    setCurrentTour(newTour);
    
    // Explicitly log this action to system notes to ensure visibility in audit
    logSystemAction(`Tour Created: ${name} by ${currentUser.name}`, newId);
  };

  const updateTour = (tourId: string, updates: Partial<Tour>) => {
      setTours(prev => prev.map(t => t.id === tourId ? { ...t, ...updates } : t));
      if (currentTour?.id === tourId) setCurrentTour(prev => prev ? ({ ...prev, ...updates }) : null);
  };

  const addTourDate = (date: TourDate) => {
    setTourDates(prev => [...prev, date]);
    setSelectedDateId(date.id); 
    logSystemAction(`Added Date - ${date.city}`, date.tourId);
  };
  const updateTourDate = (dateId: string, updates: Partial<TourDate>) => setTourDates(prev => prev.map(d => d.id === dateId ? { ...d, ...updates } : d));
  const deleteTourDate = (dateId: string) => setTourDates(prev => prev.filter(d => d.id !== dateId));
  const addHotel = (hotel: Hotel) => setHotels(prev => [...prev, hotel]);
  const updateHotel = (hotelId: string, updates: Partial<Hotel>) => setHotels(prev => prev.map(h => h.id === hotelId ? { ...h, ...updates } : h));
  const deleteHotel = (hotelId: string) => setHotels(prev => prev.filter(h => h.id !== hotelId));
  const addTravelItem = (item: TravelItem) => setTravelItems(prev => [...prev, item]);
  const updateTravelItem = (itemId: string, updates: Partial<TravelItem>) => setTravelItems(prev => prev.map(t => t.id === itemId ? { ...t, ...updates } : t));
  const deleteTravelItem = (itemId: string) => setTravelItems(prev => prev.filter(t => t.id !== itemId));
  const addNote = (note: Note) => setNotes(prev => [note, ...prev]);
  const updateNote = (noteId: string, updates: Partial<Note>) => setNotes(prev => prev.map(n => n.id === noteId ? { ...n, ...updates } : n));
  const deleteNote = (noteId: string) => setNotes(prev => prev.filter(n => n.id !== noteId));
  const addMasterSong = (song: Song) => setMasterSongs(prev => [...prev, song]);
  const saveSetlist = (setlist: Setlist) => {
      setSetlists(prev => {
          const exists = prev.findIndex(s => s.tourId === setlist.tourId && s.dateId === setlist.dateId);
          if (exists >= 0) { const u = [...prev]; u[exists] = setlist; return u; }
          return [...prev, setlist];
      });
  };

  // --- GUEST LIST CRUD ---
  const addGuestRequest = (request: GuestRequest) => {
      setGuestRequests(prev => [...prev, request]);
      setNotification({ type: 'success', message: 'Guest added to list' });
  };

  const updateGuestRequestStatus = (id: string, status: 'Pending' | 'Approved' | 'Denied') => {
      setGuestRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const deleteGuestRequest = (id: string) => {
      setGuestRequests(prev => prev.filter(r => r.id !== id));
      setNotification({ type: 'info', message: 'Guest removed' });
  };

  // --- FINANCE CRUD ---
  const addFinanceItem = (item: FinanceItem) => {
      setFinanceItems(prev => [item, ...prev]);
      setNotification({ type: 'success', message: 'Transaction added' });
  };

  const deleteFinanceItem = (id: string) => {
      setFinanceItems(prev => prev.filter(i => i.id !== id));
      setNotification({ type: 'info', message: 'Transaction removed' });
  };

  // --- TEMPLATE CRUD ---
  const addAdvanceTemplate = (tpl: AdvanceTemplate) => {
      setAdvanceTemplates(prev => [...prev, tpl]);
      setNotification({ type: 'success', message: 'Template saved' });
  };

  const updateAdvanceTemplate = (id: string, tpl: Partial<AdvanceTemplate>) => {
      setAdvanceTemplates(prev => prev.map(t => t.id === id ? { ...t, ...tpl } : t));
      setNotification({ type: 'success', message: 'Template updated' });
  };

  const deleteAdvanceTemplate = (id: string) => {
      setAdvanceTemplates(prev => prev.filter(t => t.id !== id));
      setNotification({ type: 'info', message: 'Template deleted' });
  };

  const selectTour = (tourId: string) => {
    if (!tourId) { setCurrentTour(null); setSelectedDateId(null); return; }
    const tour = tours.find(t => t.id === tourId);
    if (tour) {
        setCurrentTour(tour);
        const tourSpecificDates = tourDates.filter(d => d.tourId === tourId);
        setSelectedDateId(tourSpecificDates.length > 0 ? tourSpecificDates[0].id : null);
    }
  };

  const addCrewToTour = (email: string) => {
    if (!currentTour || !currentUser) return { success: false, message: 'No active session' };
    const userToAdd = users.find(u => u.email === email);
    if (!userToAdd) return { success: false, message: 'User not found.' };
    const updatedTour = { ...currentTour, crewIds: [...currentTour.crewIds, userToAdd.id] };
    setTours(tours.map(t => t.id === currentTour.id ? updatedTour : t));
    setCurrentTour(updatedTour);
    return { success: true, message: 'Added.' };
  };

  const getAllSystemStats = () => ({ totalUsers: users.length, totalTours: tours.length, pendingUsers: users.filter(u => u.status === 'PENDING').length });
  const resetToDefaults = () => { localStorage.clear(); window.location.reload(); };

  const exportDatabase = () => {
      const data = {
          users, tours, tourDates, hotels, travelItems, notes, masterSongs, setlists, guestRequests, emailLogs, loginLogs, financeItems, securityLogs, advanceTemplates
      };
      return JSON.stringify(data, null, 2);
  };

  return (
    <AppContext.Provider value={{ 
        currentUser, currentTour, users, tours, tourDates, hotels, travelItems, notes, masterSongs, setlists, selectedDateId, emailLogs, loginLogs, financeItems, emailSystemStatus, notification,
        guestRequests, securityLogs, isScanning, advanceTemplates,
        login, logout, register, createUser, resetPassword, updateUserRole, updateUserStatus, updateUserProfile, addUserDocument, removeUserDocument, approveUser, rejectUser, deleteUser, impersonateUser, createTour, updateTour, selectTour, addCrewToTour, 
        addTourDate, updateTourDate, deleteTourDate, addHotel, updateHotel, deleteHotel, addTravelItem, updateTravelItem, deleteTravelItem,
        addNote, updateNote, deleteNote, addMasterSong, saveSetlist, setSelectedDateId, getAllSystemStats, resetToDefaults, exportDatabase,
        addGuestRequest, updateGuestRequestStatus, deleteGuestRequest,
        addFinanceItem, deleteFinanceItem,
        addAdvanceTemplate, updateAdvanceTemplate, deleteAdvanceTemplate,
        sendTestEmail, setEmailSystemStatus, clearNotification,
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
