
import React, { useState } from 'react';
import { TourDate, UserRole, VenueDocument, View, ScheduleItem } from '../types';
import { generateText, askSearch, findVenueDocuments } from '../services/geminiService';
import { useApp } from '../contexts/AppContext';
import { Calendar, MapPin, Building, Mail, Loader2, Check, Plus, X, Save, Hash, Send, Phone, User, Trash2, Edit2, Wand2, FileText, Download, Briefcase, Search, CheckSquare, Square, Clock, ExternalLink, List, Ticket, TrendingUp } from 'lucide-react';

interface TourScheduleProps {
    onNavigate?: (view: View) => void;
}

// Helper for generating 15-min interval time options
const generateTimeOptions = () => {
    const times = [];
    for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 60; j += 15) {
            const h = i.toString().padStart(2, '0');
            const m = j.toString().padStart(2, '0');
            times.push(`${h}:${m}`);
        }
    }
    return times;
};
const TIME_OPTIONS = generateTimeOptions();

export const TourSchedule: React.FC<TourScheduleProps> = ({ onNavigate }) => {
    const { tourDates, setSelectedDateId, currentTour, addTourDate, updateTourDate, deleteTourDate, currentUser } = useApp();
    const [selectedDate, setSelectedDate] = useState<TourDate | null>(null);
    const [aiDraft, setAiDraft] = useState<string>('');
    const [isDrafting, setIsDrafting] = useState(false);

    // Edit/Add Mode
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'CONTACTS' | 'TECH' | 'SCHEDULE'>('GENERAL');
    
    // Auto-Fill State
    const [isAutoFilling, setIsAutoFilling] = useState(false);
    const [isScrapingDocs, setIsScrapingDocs] = useState(false);
    const [foundDocs, setFoundDocs] = useState<VenueDocument[]>([]);
    const [selectedFoundDocs, setSelectedFoundDocs] = useState<string[]>([]); // IDs of selected

    // Date Form State
    const [dateForm, setDateForm] = useState<Partial<TourDate>>({
        date: '', city: '', venue: '', capacity: 0, status: 'Confirmed', 
        address: '', confirmationNumber: '', 
        venueContactName: '', venueContactPhone: '', venueContactEmail: '', venuePhone: '',
        documents: [],
        schedule: [],
        venueNotes: '',
        ticketsSold: 0,
        grossRevenue: 0
    });

    // Temp state for adding schedule items in modal
    const [newScheduleItem, setNewScheduleItem] = useState<Partial<ScheduleItem>>({
        title: '', startTime: '12:00', type: 'Production'
    });

    const currentTourDates = tourDates.filter(d => d.tourId === currentTour?.id);
    const canEdit = currentUser?.role !== UserRole.CREW;

    const handleGenerateEmail = async (date: TourDate) => {
        if (!currentUser) return;
        
        setSelectedDate(date);
        setIsDrafting(true);
        setAiDraft('');
        
        const userSignature = `
        ${currentUser.name}
        ${currentUser.jobTitle || currentUser.role}
        ${currentUser.phone || ''}
        ${currentUser.email}
        `;

        const prompt = `Draft a professional production advance email to the production manager ${date.venueContactName ? `(${date.venueContactName})` : ''} at ${date.venue} in ${date.city} for the show on ${date.date}. 
        Include:
        1. Request for updated tech pack.
        2. Confirmation of load-in time at 8:00 AM.
        3. Mention we have pyrotechnics requiring permit verification.
        4. Sign off with the following details exactly: ${userSignature}
        
        Keep it concise and polite.`;

        const text = await generateText(prompt, 'gemini-3-pro-preview');
        setAiDraft(text);
        setIsDrafting(false);
    };

    const handleVenueAutoFill = async () => {
        if (!dateForm.venue) return;
        setIsAutoFilling(true);
        try {
            const query = dateForm.city 
                ? `${dateForm.venue} in ${dateForm.city}` 
                : dateForm.venue;
            
            const prompt = `Task: Find venue details.
            Search Query: "${query}"
            
            Instructions:
            1. Find the official address and City/State.
            2. Find the main box office or venue phone number.
            3. Find the venue capacity (concert capacity).
            
            Return the result strictly in this format:
            Address: [Full Address]
            City: [City, State]
            Phone: [Phone Number]
            Capacity: [Number only, e.g. 20000]`;
            
            const result = await askSearch(prompt);
            const text = result.text || "";

            const addressMatch = text.match(/Address:\s*(.*)/i);
            const cityMatch = text.match(/City:\s*(.*)/i);
            const phoneMatch = text.match(/Phone:\s*(.*)/i);
            const capMatch = text.match(/Capacity:\s*([\d,]+)/i);

            setDateForm(prev => ({
                ...prev,
                address: addressMatch ? addressMatch[1].trim() : prev.address,
                city: cityMatch ? cityMatch[1].trim() : prev.city,
                venuePhone: phoneMatch ? phoneMatch[1].trim() : prev.venuePhone,
                capacity: capMatch ? parseInt(capMatch[1].replace(/,/g, '')) : prev.capacity
            }));
        } catch (e) {
            console.error(e);
            alert("Auto-fill failed. Please try again.");
        } finally {
            setIsAutoFilling(false);
        }
    };

    const handleScrapeDocs = async () => {
        if (!dateForm.venue || !dateForm.city) {
            alert("Please enter Venue Name and City first.");
            return;
        }
        setIsScrapingDocs(true);
        setFoundDocs([]); // Clear previous
        try {
            const results = await findVenueDocuments(dateForm.venue, dateForm.city);
            if (results.length > 0) {
                setFoundDocs(results);
                // Select all by default
                setSelectedFoundDocs(results.map(d => d.id));
            } else {
                alert("No relevant PDF documents found.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsScrapingDocs(false);
        }
    };

    const toggleFoundDoc = (id: string) => {
        setSelectedFoundDocs(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const confirmDocsSelection = () => {
        const docsToAdd = foundDocs.filter(d => selectedFoundDocs.includes(d.id));
        setDateForm(prev => ({
            ...prev,
            documents: [...(prev.documents || []), ...docsToAdd]
        }));
        setFoundDocs([]);
        setSelectedFoundDocs([]);
    };

    const handleSendEmail = () => {
        if (!selectedDate || !aiDraft) return;
        const subject = encodeURIComponent(`Production Advance: ${selectedDate.venue} - ${selectedDate.date}`);
        const body = encodeURIComponent(aiDraft);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    const handleRowClick = (id: string) => {
        setSelectedDateId(id);
        if(onNavigate) onNavigate(View.SCHEDULE);
    };

    // --- Schedule Item Handlers ---
    const handleAddScheduleItem = () => {
        if(!newScheduleItem.title || !newScheduleItem.startTime) return;
        const item: ScheduleItem = {
            id: Math.random().toString(36).substr(2, 9),
            title: newScheduleItem.title!,
            startTime: newScheduleItem.startTime!,
            endTime: newScheduleItem.endTime,
            type: newScheduleItem.type as any || 'Other'
        };
        setDateForm(prev => ({
            ...prev,
            schedule: [...(prev.schedule || []), item].sort((a,b) => a.startTime.localeCompare(b.startTime))
        }));
        setNewScheduleItem({ title: '', startTime: '12:00', type: 'Production' });
    };

    // --- CRUD Handlers ---
    const openAddModal = () => {
        setEditingId(null);
        setActiveTab('GENERAL');
        setDateForm({
            date: '', city: '', venue: '', capacity: 0, status: 'Confirmed', 
            address: '', confirmationNumber: '', 
            venueContactName: '', venueContactPhone: '', venueContactEmail: '', venuePhone: '',
            documents: [], schedule: [], venueNotes: '',
            ticketsSold: 0, grossRevenue: 0
        });
        setFoundDocs([]);
        setIsModalOpen(true);
    };

    const openEditModal = (e: React.MouseEvent, date: TourDate) => {
        e.stopPropagation();
        setEditingId(date.id);
        setActiveTab('GENERAL');
        setDateForm({ ...date, schedule: date.schedule || [], venueNotes: date.venueNotes || '' });
        setFoundDocs([]);
        setIsModalOpen(true);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this date? This cannot be undone.")) {
            deleteTourDate(id);
        }
    };

    const handleSaveDate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentTour || !dateForm.date || !dateForm.city || !dateForm.venue) return;

        if (editingId) {
            updateTourDate(editingId, dateForm);
        } else {
            addTourDate({
                id: Math.random().toString(36).substr(2, 9),
                tourId: currentTour.id,
                date: dateForm.date!,
                city: dateForm.city!,
                venue: dateForm.venue!,
                status: (dateForm.status as 'Confirmed' | 'Pending' | 'Hold') || 'Confirmed',
                capacity: dateForm.capacity || 0,
                address: dateForm.address,
                confirmationNumber: dateForm.confirmationNumber,
                venueContactName: dateForm.venueContactName,
                venueContactPhone: dateForm.venueContactPhone,
                venueContactEmail: dateForm.venueContactEmail,
                venuePhone: dateForm.venuePhone,
                documents: dateForm.documents || [],
                schedule: dateForm.schedule || [],
                venueNotes: dateForm.venueNotes || '',
                ticketsSold: dateForm.ticketsSold || 0,
                grossRevenue: dateForm.grossRevenue || 0
            });
        }
        setIsModalOpen(false);
    };

    const removeDoc = (idx: number) => {
        setDateForm(prev => ({
            ...prev,
            documents: prev.documents?.filter((_, i) => i !== idx)
        }));
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Tour Schedule</h1>
                    <p className="text-slate-400">Master Tour Dates & Routing</p>
                </div>
                {canEdit && (
                    <button 
                        onClick={openAddModal}
                        className="bg-maestro-accent hover:bg-violet-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Date
                    </button>
                )}
            </header>

            {/* ADD/EDIT DATE MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-maestro-800 border border-maestro-accent/50 p-0 rounded-xl shadow-2xl w-full max-w-4xl relative overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-maestro-700 bg-maestro-900 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-white flex items-center gap-2 text-xl">
                                <Calendar className="w-6 h-6 text-maestro-accent" /> {editingId ? 'Edit Tour Date' : 'New Tour Date'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        
                        {/* Tabs */}
                        <div className="flex border-b border-maestro-700 shrink-0 bg-maestro-800">
                            <button onClick={() => setActiveTab('GENERAL')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 ${activeTab === 'GENERAL' ? 'text-white border-b-2 border-maestro-accent bg-white/5' : 'text-slate-400 hover:text-white'}`}>
                                <Building className="w-4 h-4" /> General Info
                            </button>
                            <button onClick={() => setActiveTab('CONTACTS')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 ${activeTab === 'CONTACTS' ? 'text-white border-b-2 border-maestro-accent bg-white/5' : 'text-slate-400 hover:text-white'}`}>
                                <User className="w-4 h-4" /> Venue Contacts
                            </button>
                            <button onClick={() => setActiveTab('SCHEDULE')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 ${activeTab === 'SCHEDULE' ? 'text-white border-b-2 border-maestro-accent bg-white/5' : 'text-slate-400 hover:text-white'}`}>
                                <Clock className="w-4 h-4" /> Schedule
                            </button>
                            <button onClick={() => setActiveTab('TECH')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 ${activeTab === 'TECH' ? 'text-white border-b-2 border-maestro-accent bg-white/5' : 'text-slate-400 hover:text-white'}`}>
                                <FileText className="w-4 h-4" /> Tech Docs
                            </button>
                        </div>

                        <form onSubmit={handleSaveDate} className="flex-1 overflow-y-auto p-6">
                            
                            {/* === GENERAL TAB === */}
                            {activeTab === 'GENERAL' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                                    <div className="lg:col-span-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Date</label>
                                        <input 
                                            required
                                            type="date" 
                                            value={dateForm.date}
                                            onChange={(e) => setDateForm({...dateForm, date: e.target.value})}
                                            className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-3 text-white outline-none focus:border-maestro-accent"
                                        />
                                    </div>
                                    <div className="lg:col-span-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">City</label>
                                        <input 
                                            required
                                            type="text" 
                                            placeholder="Chicago, IL"
                                            value={dateForm.city}
                                            onChange={(e) => setDateForm({...dateForm, city: e.target.value})}
                                            className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-3 text-white outline-none focus:border-maestro-accent"
                                        />
                                    </div>
                                    <div className="lg:col-span-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Status</label>
                                        <select 
                                            value={dateForm.status}
                                            onChange={(e) => setDateForm({...dateForm, status: e.target.value as any})}
                                            className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-3 text-white outline-none focus:border-maestro-accent"
                                        >
                                            <option value="Confirmed">Confirmed</option>
                                            <option value="Hold">Hold</option>
                                            <option value="Pending">Pending</option>
                                        </select>
                                    </div>

                                     <div className="lg:col-span-3">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Venue</label>
                                        <div className="flex gap-2 mt-1">
                                            <input 
                                                required
                                                type="text" 
                                                placeholder="United Center"
                                                value={dateForm.venue}
                                                onChange={(e) => setDateForm({...dateForm, venue: e.target.value})}
                                                className="flex-1 bg-maestro-900 border border-maestro-700 rounded p-3 text-white outline-none focus:border-maestro-accent"
                                            />
                                            <button 
                                                type="button"
                                                onClick={handleVenueAutoFill}
                                                disabled={isAutoFilling || !dateForm.venue}
                                                className="bg-maestro-700 hover:bg-maestro-600 text-white p-3 rounded flex items-center gap-2 disabled:opacity-50"
                                                title="Auto-Fill Venue Details"
                                            >
                                                {isAutoFilling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5 text-maestro-gold" />}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="lg:col-span-3">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Main Venue Phone</label>
                                        <div className="relative mt-1">
                                            <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                                            <input 
                                                type="text" 
                                                placeholder="Box Office / Main Line"
                                                value={dateForm.venuePhone || ''}
                                                onChange={(e) => setDateForm({...dateForm, venuePhone: e.target.value})}
                                                className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 pl-10 text-white outline-none focus:border-maestro-accent"
                                            />
                                        </div>
                                    </div>

                                    <div className="lg:col-span-6">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Address</label>
                                        <input 
                                            type="text" 
                                            placeholder="123 Arena Blvd, City, State, Zip"
                                            value={dateForm.address || ''}
                                            onChange={(e) => setDateForm({...dateForm, address: e.target.value})}
                                            className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-3 text-white outline-none focus:border-maestro-accent"
                                        />
                                    </div>
                                    
                                    <div className="lg:col-span-3">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Confirmation #</label>
                                        <div className="relative mt-1">
                                            <Hash className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                                            <input 
                                                type="text" 
                                                placeholder="#12345ABC"
                                                value={dateForm.confirmationNumber || ''}
                                                onChange={(e) => setDateForm({...dateForm, confirmationNumber: e.target.value})}
                                                className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 pl-10 text-white outline-none focus:border-maestro-accent"
                                            />
                                        </div>
                                    </div>
                                    <div className="lg:col-span-3">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Capacity</label>
                                        <input 
                                            type="number" 
                                            placeholder="20000"
                                            value={dateForm.capacity || ''}
                                            onChange={(e) => setDateForm({...dateForm, capacity: parseInt(e.target.value) || 0})}
                                            className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-3 text-white outline-none focus:border-maestro-accent"
                                        />
                                    </div>

                                    {/* Ticket Sales Section */}
                                    <div className="lg:col-span-6 border-t border-maestro-700 pt-4 mt-2">
                                        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Ticket className="w-4 h-4 text-maestro-gold" /> Sales Performance</h4>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase">Tickets Sold</label>
                                                <input 
                                                    type="number" 
                                                    placeholder="0"
                                                    value={dateForm.ticketsSold || ''}
                                                    onChange={(e) => setDateForm({...dateForm, ticketsSold: parseInt(e.target.value) || 0})}
                                                    className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-3 text-white outline-none focus:border-maestro-accent"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase">Gross Revenue</label>
                                                <div className="relative mt-1">
                                                    <span className="absolute left-3 top-3.5 text-slate-500 font-bold">£</span>
                                                    <input 
                                                        type="number" 
                                                        placeholder="0.00"
                                                        value={dateForm.grossRevenue || ''}
                                                        onChange={(e) => setDateForm({...dateForm, grossRevenue: parseFloat(e.target.value) || 0})}
                                                        className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 pl-8 text-white outline-none focus:border-maestro-accent"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* === CONTACTS TAB === */}
                            {activeTab === 'CONTACTS' && (
                                <div className="space-y-6">
                                    <div className="bg-maestro-900/50 p-4 rounded-lg border border-maestro-700">
                                        <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                                            <Briefcase className="w-5 h-5 text-maestro-gold" /> Venue Representative / Production Manager
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                             <div>
                                                 <label className="text-xs font-bold text-slate-400 uppercase">Name</label>
                                                 <div className="relative mt-1">
                                                     <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                                                     <input 
                                                         type="text" 
                                                         placeholder="Full Name"
                                                         value={dateForm.venueContactName || ''}
                                                         onChange={(e) => setDateForm({...dateForm, venueContactName: e.target.value})}
                                                         className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 pl-10 text-white outline-none focus:border-maestro-accent"
                                                     />
                                                 </div>
                                            </div>
                                            <div>
                                                 <label className="text-xs font-bold text-slate-400 uppercase">Direct Phone</label>
                                                 <div className="relative mt-1">
                                                     <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                                                     <input 
                                                         type="text" 
                                                         placeholder="Direct Mobile"
                                                         value={dateForm.venueContactPhone || ''}
                                                         onChange={(e) => setDateForm({...dateForm, venueContactPhone: e.target.value})}
                                                         className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 pl-10 text-white outline-none focus:border-maestro-accent"
                                                     />
                                                 </div>
                                            </div>
                                            <div className="md:col-span-2">
                                                 <label className="text-xs font-bold text-slate-400 uppercase">Email Address</label>
                                                 <div className="relative mt-1">
                                                     <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                                                     <input 
                                                         type="email" 
                                                         placeholder="email@venue.com"
                                                         value={dateForm.venueContactEmail || ''}
                                                         onChange={(e) => setDateForm({...dateForm, venueContactEmail: e.target.value})}
                                                         className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 pl-10 text-white outline-none focus:border-maestro-accent"
                                                     />
                                                 </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-maestro-900/50 p-4 rounded-lg border border-maestro-700 opacity-50">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-white flex items-center gap-2">
                                                <User className="w-5 h-5 text-slate-500" /> Box Office Contact
                                            </h4>
                                            <span className="text-xs bg-slate-800 px-2 py-1 rounded">Coming Soon</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* === SCHEDULE TAB === */}
                            {activeTab === 'SCHEDULE' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
                                    {/* Left: Timeline List */}
                                    <div className="flex flex-col h-full bg-maestro-900/50 rounded-lg border border-maestro-700 overflow-hidden">
                                        <div className="p-3 bg-maestro-900 border-b border-maestro-700 font-bold text-slate-400 text-xs uppercase flex justify-between items-center">
                                            <span>Timeline</span>
                                            <span className="text-[10px]">{dateForm.schedule?.length || 0} Items</span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                                            {(!dateForm.schedule || dateForm.schedule.length === 0) && (
                                                <div className="text-center py-10 text-slate-500 text-sm">
                                                    No schedule items yet.
                                                </div>
                                            )}
                                            {dateForm.schedule?.map((item, idx) => (
                                                <div key={idx} className="flex gap-3 p-3 bg-maestro-800 rounded border border-maestro-700 items-center group">
                                                    <div className="text-xs font-mono text-slate-400 w-20 flex-shrink-0">
                                                        {item.startTime}
                                                        {item.endTime && <span className="block text-[10px] opacity-70">- {item.endTime}</span>}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-white text-sm truncate">{item.title}</div>
                                                        <div className="text-[10px] text-slate-500 uppercase">{item.type}</div>
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        onClick={() => {
                                                            setDateForm(prev => ({
                                                                ...prev,
                                                                schedule: prev.schedule?.filter((_, i) => i !== idx)
                                                            }));
                                                        }}
                                                        className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right: Controls */}
                                    <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                                        
                                        {/* Add Item */}
                                        <div className="bg-maestro-900/50 p-4 rounded-lg border border-maestro-700">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Clock className="w-3 h-3" /> Add Event</h4>
                                            <div className="space-y-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="Event Title" 
                                                    value={newScheduleItem.title}
                                                    onChange={e => setNewScheduleItem({...newScheduleItem, title: e.target.value})}
                                                    className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-maestro-accent outline-none"
                                                />
                                                <div className="flex gap-2">
                                                    <select 
                                                        value={newScheduleItem.startTime}
                                                        onChange={e => setNewScheduleItem({...newScheduleItem, startTime: e.target.value})}
                                                        className="flex-1 bg-maestro-900 border border-maestro-700 rounded p-2 text-xs text-white outline-none"
                                                    >
                                                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                    <select 
                                                        value={newScheduleItem.endTime || ''}
                                                        onChange={e => setNewScheduleItem({...newScheduleItem, endTime: e.target.value})}
                                                        className="flex-1 bg-maestro-900 border border-maestro-700 rounded p-2 text-xs text-white outline-none"
                                                    >
                                                        <option value="">End Time (Opt)</option>
                                                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex gap-2">
                                                    <select 
                                                        value={newScheduleItem.type}
                                                        onChange={e => setNewScheduleItem({...newScheduleItem, type: e.target.value as any})}
                                                        className="flex-1 bg-maestro-900 border border-maestro-700 rounded p-2 text-xs text-white outline-none"
                                                    >
                                                        <option value="Production">Production</option>
                                                        <option value="Show">Show</option>
                                                        <option value="Travel">Travel</option>
                                                        <option value="Press">Press</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                    <button 
                                                        type="button"
                                                        onClick={handleAddScheduleItem}
                                                        className="bg-maestro-700 hover:bg-maestro-600 text-white px-4 rounded text-xs font-bold"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        <div className="bg-maestro-900/50 p-4 rounded-lg border border-maestro-700">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><FileText className="w-3 h-3" /> Day Sheet Notes</h4>
                                            <textarea 
                                                value={dateForm.venueNotes || ''}
                                                onChange={e => setDateForm({...dateForm, venueNotes: e.target.value})}
                                                placeholder="Specific instructions for the Day Sheet..."
                                                className="w-full h-24 bg-maestro-900 border border-maestro-700 rounded p-2 text-sm text-white resize-none outline-none focus:border-maestro-accent"
                                            />
                                        </div>

                                        {/* Link to DaySheet */}
                                        {editingId && (
                                            <div className="pt-4 border-t border-maestro-700">
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        if (editingId) {
                                                            setSelectedDateId(editingId);
                                                            if (onNavigate) onNavigate(View.SCHEDULE);
                                                        }
                                                    }}
                                                    className="w-full bg-maestro-accent hover:bg-violet-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg"
                                                >
                                                    <ExternalLink className="w-4 h-4" /> Open Full Day Sheet
                                                </button>
                                                <p className="text-center text-[10px] text-slate-500 mt-2">Save changes before leaving.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* === TECH DOCS TAB === */}
                            {activeTab === 'TECH' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-maestro-900/50 p-4 rounded-lg border border-maestro-700">
                                        <div>
                                            <h4 className="font-bold text-white">Technical Documents</h4>
                                            <p className="text-xs text-slate-400">Production guides, stage plots, and facility specs.</p>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={handleScrapeDocs} 
                                            disabled={isScrapingDocs || !dateForm.venue}
                                            className="bg-maestro-accent hover:bg-violet-600 text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isScrapingDocs ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
                                            Scrape Tech Docs
                                        </button>
                                    </div>

                                    {/* Found Docs Selection UI */}
                                    {foundDocs.length > 0 && (
                                        <div className="bg-maestro-900 border border-maestro-accent/50 p-4 rounded-lg animate-fadeIn">
                                            <div className="flex justify-between items-center mb-3">
                                                <h5 className="font-bold text-maestro-gold text-sm flex items-center gap-2"><CheckSquare className="w-4 h-4" /> Select Documents to Add</h5>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setFoundDocs([])} className="text-xs text-slate-400 hover:text-white px-2 py-1">Cancel</button>
                                                    <button onClick={confirmDocsSelection} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-xs font-bold">Add Selected</button>
                                                </div>
                                            </div>
                                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                {foundDocs.map((doc) => (
                                                    <div 
                                                        key={doc.id} 
                                                        onClick={() => toggleFoundDoc(doc.id)}
                                                        className={`flex items-center gap-3 p-2 rounded cursor-pointer border ${selectedFoundDocs.includes(doc.id) ? 'bg-maestro-800 border-maestro-accent' : 'bg-maestro-900/50 border-maestro-700 hover:bg-maestro-800'}`}
                                                    >
                                                        {selectedFoundDocs.includes(doc.id) ? (
                                                            <CheckSquare className="w-4 h-4 text-maestro-accent flex-shrink-0" />
                                                        ) : (
                                                            <Square className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                                        )}
                                                        <div className="flex-1 overflow-hidden">
                                                            <div className="text-sm text-white truncate">{doc.title}</div>
                                                            <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                                                <span className={`uppercase font-bold ${doc.type === 'Tech Pack' || doc.type === 'Plot' ? 'text-green-400' : 'text-slate-500'}`}>{doc.type}</span>
                                                                <span className="truncate opacity-50">{doc.url}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {dateForm.documents && dateForm.documents.length > 0 ? (
                                        <div className="space-y-2">
                                            {dateForm.documents.map((doc, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-maestro-900 p-3 rounded border border-maestro-700">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className={`w-5 h-5 ${doc.type === 'Plot' ? 'text-maestro-accent' : doc.type === 'Tech Pack' ? 'text-green-400' : 'text-blue-400'}`} />
                                                        <div>
                                                            <div className="text-sm font-bold text-white">{doc.title}</div>
                                                            <div className="text-xs text-slate-500 uppercase">{doc.type}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <a href={doc.url} target="_blank" rel="noreferrer" className="p-2 text-maestro-accent hover:text-white" title="View">
                                                            <Download className="w-4 h-4" />
                                                        </a>
                                                        <button type="button" onClick={() => removeDoc(idx)} className="p-2 text-slate-600 hover:text-red-500">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 border-2 border-dashed border-maestro-700 rounded-lg">
                                            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                                            <p className="text-slate-500">No documents attached.</p>
                                            <p className="text-xs text-slate-600">Use "Scrape Tech Docs" to find files online.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                        </form>
                        
                        {/* Footer Actions */}
                        <div className="p-4 border-t border-maestro-700 bg-maestro-900 flex justify-end gap-3 shrink-0">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white px-4 py-2 text-sm font-bold">Cancel</button>
                            <button onClick={handleSaveDate} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold flex items-center gap-2"><Save className="w-4 h-4" /> {editingId ? 'Update' : 'Save'} Date</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-maestro-800 rounded-xl border border-maestro-700 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-maestro-900 border-b border-maestro-700 text-slate-400 text-sm uppercase">
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold">City</th>
                                <th className="p-4 font-semibold">Venue / Address</th>
                                <th className="p-4 font-semibold">Details</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-maestro-700">
                            {currentTourDates.map((d) => (
                                <tr key={d.id} className="hover:bg-maestro-700/50 transition-colors group cursor-pointer" onClick={() => handleRowClick(d.id)}>
                                    <td className="p-4 text-white font-mono">{d.date}</td>
                                    <td className="p-4 text-slate-300 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-slate-500" />
                                        {d.city}
                                    </td>
                                    <td className="p-4 text-slate-300">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 font-bold text-white">
                                                <Building className="w-4 h-4 text-slate-500" />
                                                {d.venue}
                                            </div>
                                            {d.address && (
                                                <div className="text-xs text-slate-500 ml-6 mt-1">{d.address}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-slate-400 font-mono text-sm">Cap: {d.capacity ? d.capacity.toLocaleString() : '-'}</div>
                                            {(d.ticketsSold || d.grossRevenue) ? (
                                                <div className="text-[10px] text-green-400 font-bold flex gap-2">
                                                    <span>{d.ticketsSold?.toLocaleString() || 0} Sold</span>
                                                    <span>£{(d.grossRevenue || 0).toLocaleString()}</span>
                                                </div>
                                            ) : null}
                                            {d.confirmationNumber && (
                                                <div className="text-xs text-maestro-gold font-mono flex items-center gap-1">
                                                    <Hash className="w-3 h-3" /> {d.confirmationNumber}
                                                </div>
                                            )}
                                            {d.venueContactName && (
                                                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                    <User className="w-3 h-3" /> {d.venueContactName}
                                                </div>
                                            )}
                                            {d.venuePhone && (
                                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Building className="w-3 h-3" /> {d.venuePhone}
                                                </div>
                                            )}
                                            {d.documents && d.documents.length > 0 && (
                                                <div className="text-xs text-blue-400 flex items-center gap-1 mt-1">
                                                    <FileText className="w-3 h-3" /> {d.documents.length} Docs
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                                            d.status === 'Confirmed' ? 'bg-green-900/50 text-green-400 border border-green-500/20' :
                                            d.status === 'Pending' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-500/20' :
                                            'bg-red-900/50 text-red-400 border border-red-500/20'
                                        }`}>
                                            {d.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 items-center">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleGenerateEmail(d); }}
                                                className="text-maestro-accent hover:text-white transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1 text-sm mr-2"
                                                title="AI Advance Draft"
                                            >
                                                <Mail className="w-4 h-4" /> 
                                            </button>
                                            {canEdit && (
                                                <>
                                                    <button onClick={(e) => openEditModal(e, d)} className="text-slate-500 hover:text-white p-1" title="Edit">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={(e) => handleDelete(e, d.id)} className="text-slate-500 hover:text-red-500 p-1" title="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {currentTourDates.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">No dates found for this tour. Add one via the Dashboard.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* AI Action Panel */}
            {selectedDate && (
                <div className="bg-maestro-800 border border-maestro-700 p-6 rounded-xl animate-fadeIn shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-maestro-gold">
                             <Mail className="w-5 h-5" />
                             <h3 className="font-bold">AI Production Advance Draft: {selectedDate.city}</h3>
                        </div>
                        <button onClick={() => setSelectedDate(null)} className="text-slate-500 hover:text-white"><Check className="w-5 h-5" /></button>
                    </div>
                    
                    {isDrafting ? (
                        <div className="py-8 flex justify-center">
                            <div className="flex items-center gap-2 text-maestro-accent">
                                <Loader2 className="animate-spin" />
                                <span>Drafting email with Gemini 3 Pro...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <textarea 
                                value={aiDraft} 
                                readOnly
                                className="w-full h-48 bg-maestro-900 border border-maestro-700 rounded-lg p-4 text-slate-300 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-maestro-accent"
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => navigator.clipboard.writeText(aiDraft)} className="text-sm text-slate-400 hover:text-white transition-colors">Copy to Clipboard</button>
                                <button onClick={handleSendEmail} className="bg-maestro-accent hover:bg-violet-600 text-white px-6 py-2 rounded text-sm font-bold flex items-center gap-2">
                                    <Send className="w-4 h-4" /> Open in Mail Client
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
