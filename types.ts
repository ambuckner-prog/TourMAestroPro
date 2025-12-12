
export enum View {
  // Public/Auth
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  
  // App Core
  OVERVIEW = 'OVERVIEW', // New Overview Tab
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
  INBOX = 'INBOX', // New Simulated Inbox
  
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

export type AdvanceStatus = 'NOT_STARTED' | 'INITIAL_SENT' | 'IN_PROGRESS' | 'CONFIRMED';

export interface AdvanceTemplateField {
  id: string;
  label: string; // e.g. "Shore Power"
  defaultValue: string; // e.g. "Do you provide 60A?"
  category: 'Production' | 'Hospitality' | 'Security' | 'Merch' | 'Other';
}

export interface AdvanceTemplate {
  id: string;
  tourId: string; // or 'SYSTEM' for defaults
  name: string; // e.g. "Club Advance", "Festival Advance"
  description?: string;
  fields: AdvanceTemplateField[];
}

export interface UserDocument {
  id: string;
  name: string;
  type: 'Passport' | 'Visa' | 'Contract' | 'ID' | 'Medical' | 'Other';
  url: string;
  expiryDate?: string;
  uploadedAt: string;
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
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
  
  // Crew Profile Extensions
  address?: string;
  cityStateZip?: string;
  country?: string;
  birthDate?: string;
  
  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;

  // Travel & Personal
  passportNumber?: string;
  passportExpiry?: string;
  citizenship?: string;
  frequentFlyer?: string;
  seatingPreference?: 'Window' | 'Aisle';
  dietaryRestrictions?: string;
  shirtSize?: string;
  
  // Documents
  documents?: UserDocument[];
}

export interface Tour {
  id: string;
  name: string;
  artist: string;
  managerId: string; // The creator
  crewIds: string[]; // Assigned staff
  storageUsed: number; // in bytes
  storageLimit: number; // in bytes (5GB default)
  budget: number; // Total financial budget
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

export interface ScheduleItem {
  id: string;
  title: string;
  startTime: string; // HH:mm format
  endTime?: string; // HH:mm format
  type: 'Production' | 'Travel' | 'Show' | 'Press' | 'Other';
  details?: string;
}

export interface VenueDocument {
  id: string;
  title: string;
  url: string;
  type: 'Tech Pack' | 'Plot' | 'Facility Guide' | 'Other';
}

export interface TourDate {
  id: string;
  tourId: string;
  city: string;
  venue: string;
  date: string;
  status: 'Confirmed' | 'Pending' | 'Hold';
  advanceStatus?: AdvanceStatus; // New field
  capacity: number;
  address?: string;
  confirmationNumber?: string;
  
  // Ticket Sales
  ticketsSold?: number;
  grossRevenue?: number;

  // Contacts
  venueContactName?: string;
  venueContactPhone?: string;
  venueContactEmail?: string; // New
  venuePhone?: string; // Main venue number
  
  venueNotes?: string; // Specific instructions/reminders for the venue
  schedule?: ScheduleItem[]; // Daily schedule items
  documents?: VenueDocument[]; // New: Scraped or uploaded docs
  setlistId?: string; // Linked Setlist ID
}

export interface GuestRequest {
  id: string;
  tourId: string;
  dateId: string; // Linked to TourDate.id
  name: string;
  affiliation: string;
  quantity: number;
  status: 'Pending' | 'Approved' | 'Denied';
  notes?: string;
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

export interface FinanceItem {
  id: string;
  tourId: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  paySource: string; // e.g. "Business Amex", "Wire", "Cash"
  description: string;
  date: string;
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

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string; // Stored for debug
  timestamp: string;
  status: 'SENT' | 'FAILED' | 'QUEUED';
}

export interface LoginLog {
  id: string;
  email: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  timestamp: string;
  ip: string; // Simulated
  userAgent: string;
}

export interface SecurityLog {
  id: string;
  timestamp: string;
  scanType: 'AUTOMATED' | 'MANUAL';
  status: 'CLEAN' | 'WARNING' | 'CRITICAL';
  details: string;
  threatsFound: number;
}

export type AspectRatio = "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | "16:9" | "21:9";
export type ImageSize = "1K" | "2K" | "4K";

export type EmailSystemStatus = 'ENABLED' | 'SIMULATION' | 'BLOCKED';
