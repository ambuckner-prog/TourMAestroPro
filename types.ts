
export enum View {
  // Public/Auth
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  
  // App Core
  DASHBOARD = 'DASHBOARD',
  EVENTS = 'EVENTS',
  HOTELS = 'HOTELS',
  TRAVEL = 'TRAVEL',
  SCHEDULE = 'SCHEDULE',
  TASKS = 'TASKS',
  ADVANCE = 'ADVANCE',
  GUEST_LIST = 'GUEST_LIST',
  SETLIST = 'SETLIST',
  ACCOUNTING = 'ACCOUNTING',
  ATTACHMENTS = 'ATTACHMENTS',
  SETTINGS = 'SETTINGS', // Back Office
  
  // Management
  TEAM_MGMT = 'TEAM_MGMT',
  SUPER_ADMIN = 'SUPER_ADMIN',
  TOUR_SELECTION = 'TOUR_SELECTION',

  // AI Tools
  VENUE_INTEL = 'VENUE_INTEL', 
  CREATIVE_STUDIO = 'CREATIVE_STUDIO',
  ROAD_MANAGER = 'ROAD_MANAGER', 
}

export enum UserRole {
  MASTER_ADMIN = 'MASTER_ADMIN', // Site owner, sees everything
  SUPPORT_STAFF = 'SUPPORT_STAFF', // Can help accounts
  TOUR_MANAGER = 'TOUR_MANAGER', // Admin of their own tour
  CREW = 'CREW', // Read only / Limited access
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string; // In real app, never store plain text
  assignedTourIds: string[];
  phone?: string;
  jobTitle?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED'; // New field for approval workflow
}

export interface Tour {
  id: string;
  name: string;
  artist: string;
  managerId: string; // The creator
  crewIds: string[]; // Assigned staff
  storageUsed: number; // in bytes
  storageLimit: number; // in bytes (5GB default)
}

export interface Hotel {
  id: string;
  tourId: string;
  name: string;
  address: string;
  phone: string;
  contactName: string;
  notes: string;
  date?: string; // Primary reference date
  checkIn: string;
  checkOut: string;
  confirmationNumber?: string;
}

export interface TravelItem {
  id: string;
  tourId: string;
  type: 'Flight' | 'Bus' | 'Train' | 'Ground';
  carrier: string;
  number: string;
  departureDate: string;
  departureTime: string;
  departureLocation: string;
  arrivalDate: string;
  arrivalTime: string;
  arrivalLocation: string;
  notes?: string;
  confirmationNumber?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  audioData?: string; 
  isLoadingAudio?: boolean;
}

export interface TourDate {
  id: string;
  tourId: string;
  city: string;
  venue: string;
  date: string;
  status: 'Confirmed' | 'Pending' | 'Hold';
  capacity: number;
  address?: string;
  confirmationNumber?: string;
  venueContactName?: string;
  venueContactPhone?: string;
  venuePhone?: string; // Main venue number
}

export interface GuestRequest {
  id: string;
  name: string;
  affiliation: string;
  quantity: number;
  status: 'Pending' | 'Approved' | 'Denied';
  showId: string;
}

export interface Song {
  id: string;
  title: string;
  duration: string;
  bpm: number;
  key: string;
}

export interface Setlist {
  id: string;
  tourId: string;
  dateId?: string; // If undefined/null, it is the tour's default/master setlist
  songs: Song[];
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  currency?: string;
}

export interface Note {
  id: string;
  tourId: string;
  content: string;
  type: 'Email' | 'Call' | 'Meeting' | 'General';
  authorName: string;
  date: string; // ISO String
  attachments: string[]; // File names
  visibility?: 'Public' | 'StaffOnly'; 
}

export interface GroundingChunk {
  web?: { uri?: string; title?: string };
  maps?: { 
    googleMapsUri?: string;
    uri?: string; 
    title?: string;
    placeAnswerSources?: { reviewSnippets?: { content?: string }[] }[]; 
  };
}

export interface VeoGenerationState {
  isGenerating: boolean;
  progressMessage: string;
  videoUri?: string;
}

export type AspectRatio = "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | "16:9" | "21:9";
export type ImageSize = "1K" | "2K" | "4K";
