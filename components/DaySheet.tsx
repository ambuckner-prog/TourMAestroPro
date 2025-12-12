
import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Phone, Building, MoreHorizontal, ChevronRight, Sun, Cloud, Info, AlertCircle, Edit2, Save, X, Plus, Trash2, Copy, CheckSquare, CloudRain, CloudSnow, Wind, FileText, Download, Mail, Check, User, Briefcase, Calendar } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TourDate, Hotel, ScheduleItem, UserRole } from '../types';
import { askSearch } from '../services/geminiService';

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

export const DaySheet: React.FC = () => {
    const { tourDates, selectedDateId, updateTourDate, hotels, addHotel, currentTour, currentUser } = useApp();
    const selectedDate = tourDates.find(d => d.id === selectedDateId);

    // Local Schedule State
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    
    // New Item Form
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [newItem, setNewItem] = useState<Partial<ScheduleItem>>({ title: '', startTime: '12:00', type: 'Production' });

    // Editing States
    const [editSection, setEditSection] = useState<'venue' | 'contacts' | 'accommodation' | null>(null);
    
    // Notes Buffer - Sync with selected date
    const [notesBuffer, setNotesBuffer] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    // Form States (Venue/Hotel)
    const [venueForm, setVenueForm] = useState<Partial<TourDate>>({});
    const [contactForm, setContactForm] = useState<Partial<TourDate>>({});
    const [newHotelForm, setNewHotelForm] = useState<Partial<Hotel>>({ name: '', address: '', phone: '' });

    // Templates State
    const [showTemplates, setShowTemplates] = useState(false);

    // Weather State
    const [weather, setWeather] = useState<{temp: string, desc: string}>({ temp: '--', desc: 'Loading...' });

    // Permission
    const canEdit = currentUser?.role !== UserRole.CREW;

    useEffect(() => {
        if (selectedDate) {
            setSchedule(selectedDate.schedule || []);
            setNotesBuffer(selectedDate.venueNotes || '');
        } else {
            setSchedule([]);
            setNotesBuffer('');
        }

        // Fetch Weather
        if (selectedDate?.city) {
            setWeather({ temp: '--', desc: 'Checking...' });
            
            const fetchWeather = async () => {
                try {
                    // Use Google Search Grounding for live/accurate forecast
                    const prompt = `What is the weather forecast for ${selectedDate.city} on ${selectedDate.date}? 
                    Return the response strictly in this format: "Temperature|Condition". 
                    Example: "72°F|Partly Cloudy".
                    If the date is in the past, provide observed weather. 
                    If the date is far in the future, provide historical average.`;
                    
                    const result = await askSearch(prompt);
                    const text = result.text || "";
                    
                    // Try to extract strict format first
                    const pipeParts = text.match(/(\d+°[FC])\|([^.]+)/);
                    if (pipeParts) {
                         setWeather({ temp: pipeParts[1].trim(), desc: pipeParts[2].trim() });
                    } else {
                        // Fallback parsing if model is chatty
                        const tempMatch = text.match(/(-?\d+°[FC])/);
                        const temp = tempMatch ? tempMatch[0] : '--';
                        
                        // Try to clean up description by removing temp and common phrases
                        let desc = text.replace(temp, '').replace(/The weather.*?is/i, '').replace(/Forecast.*?is/i, '').trim();
                        // Truncate to keep UI clean
                        if(desc.length > 20) desc = desc.split(/[.,]/)[0].substring(0, 15) + '...';
                        if(!desc) desc = "See Report";
                        
                        setWeather({ temp, desc });
                    }
                } catch (e) {
                    console.error("Weather fetch failed", e);
                    setWeather({ temp: '--', desc: 'Offline' });
                }
            };
            
            fetchWeather();
        }
    }, [selectedDateId, selectedDate]); 

    if (!selectedDate) {
        return (
            <div className="flex flex-col h-full bg-maestro-900 items-center justify-center text-slate-400 p-6">
                <div className="mb-4 opacity-20">
                    <Clock className="w-16 h-16" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">No Date Selected</h2>
                <p className="max-w-md text-center">Select a date from the Dashboard or Events tab to view the Day Sheet Overview.</p>
            </div>
        );
    }

    // Filter hotels for this date
    const dateHotels = hotels.filter(h => {
        if (h.tourId !== currentTour?.id) return false;
        if (h.date === selectedDate.date) return true;
        if (h.checkIn && h.checkOut) {
            return selectedDate.date >= h.checkIn && selectedDate.date < h.checkOut;
        }
        return false;
    });

    // --- SCHEDULE ACTIONS ---
    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.title || !newItem.startTime) return;

        const item: ScheduleItem = {
            id: Math.random().toString(36).substr(2, 9),
            title: newItem.title,
            startTime: newItem.startTime,
            endTime: newItem.endTime,
            type: newItem.type as any || 'Other'
        };

        const updatedSchedule = [...schedule, item].sort((a, b) => a.startTime.localeCompare(b.startTime));
        setSchedule(updatedSchedule);
        
        // Save immediately
        updateTourDate(selectedDate.id, { schedule: updatedSchedule });
        
        setNewItem({ title: '', startTime: '12:00', type: 'Production' });
        setIsAddingItem(false);
    };

    const handleDeleteItem = (itemId: string) => {
        if(!canEdit) return;
        const updatedSchedule = schedule.filter(i => i.id !== itemId);
        setSchedule(updatedSchedule);
        updateTourDate(selectedDate.id, { schedule: updatedSchedule });
    };

    const applyTemplate = (templateName: string) => {
        let newItems: ScheduleItem[] = [];
        if (templateName === 'Standard Show') {
            newItems = [
                { id: Math.random().toString(), title: 'Load In', startTime: '09:00', type: 'Production' },
                { id: Math.random().toString(), title: 'Lunch', startTime: '13:00', endTime: '14:00', type: 'Other' },
                { id: Math.random().toString(), title: 'Soundcheck', startTime: '16:00', endTime: '17:30', type: 'Production' },
                { id: Math.random().toString(), title: 'Dinner', startTime: '17:30', endTime: '18:30', type: 'Other' },
                { id: Math.random().toString(), title: 'Doors', startTime: '19:00', type: 'Show' },
                { id: Math.random().toString(), title: 'Show Time', startTime: '20:00', type: 'Show' },
                { id: Math.random().toString(), title: 'Load Out', startTime: '23:00', type: 'Production' },
            ];
        } else if (templateName === 'Travel Day') {
            newItems = [
                { id: Math.random().toString(), title: 'Lobby Call', startTime: '09:00', type: 'Travel' },
                { id: Math.random().toString(), title: 'Depart', startTime: '09:30', type: 'Travel' },
                { id: Math.random().toString(), title: 'Hotel Check-In', startTime: '16:00', type: 'Travel' },
            ];
        }

        const combined = [...schedule, ...newItems].sort((a,b) => a.startTime.localeCompare(b.startTime));
        setSchedule(combined);
        updateTourDate(selectedDate.id, { schedule: combined });
        setShowTemplates(false);
    };

    // --- VENUE ACTIONS ---
    const startEditingVenue = () => {
        setVenueForm({ venue: selectedDate.venue, city: selectedDate.city, address: selectedDate.address, venuePhone: selectedDate.venuePhone });
        setEditSection('venue');
    };

    const saveVenue = () => {
        if(selectedDateId) {
            updateTourDate(selectedDateId, venueForm);
            setEditSection(null);
        }
    };

    const startEditingContacts = () => {
        setContactForm({ 
            venueContactName: selectedDate.venueContactName, 
            venueContactPhone: selectedDate.venueContactPhone, 
            venueContactEmail: selectedDate.venueContactEmail 
        });
        setEditSection('contacts');
    };

    const saveContacts = () => {
        if(selectedDateId) {
            updateTourDate(selectedDateId, contactForm);
            setEditSection(null);
        }
    };

    const handleAddHotel = (e: React.FormEvent) => {
        e.preventDefault();
        if(newHotelForm.name && currentTour) {
            addHotel({
                id: Math.random().toString(36).substr(2, 9),
                tourId: currentTour.id,
                date: selectedDate.date, // Link to this date
                checkIn: selectedDate.date,
                checkOut: selectedDate.date, // Default single day
                name: newHotelForm.name,
                address: newHotelForm.address || '',
                phone: newHotelForm.phone || '',
                contactName: '',
                notes: '',
            });
            setNewHotelForm({ name: '', address: '', phone: '' });
            setEditSection(null);
        }
    };

    const handleSaveNotes = () => {
        if (selectedDateId) {
            setIsSavingNotes(true);
            updateTourDate(selectedDateId, { venueNotes: notesBuffer });
            setTimeout(() => setIsSavingNotes(false), 1500);
        }
    };

    const getWeatherIcon = (desc: string) => {
        const d = desc.toLowerCase();
        if (d.includes('rain') || d.includes('drizzle')) return <CloudRain className="w-5 h-5 text-blue-400" />;
        if (d.includes('snow') || d.includes('blizzard')) return <CloudSnow className="w-5 h-5 text-white" />;
        if (d.includes('cloud') || d.includes('overcast')) return <Cloud className="w-5 h-5 text-slate-400" />;
        if (d.includes('wind') || d.includes('breez')) return <Wind className="w-5 h-5 text-slate-400" />;
        return <Sun className="w-5 h-5 text-yellow-500" />;
    };

    return (
        <div className="flex flex-col h-full bg-maestro-900 text-slate-200">
            {/* Header Area */}
            <div className="h-20 border-b border-maestro-700 p-4 flex justify-between items-center bg-gradient-to-r from-maestro-900 to-maestro-800 flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">{selectedDate.venue}</h1>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <MapPin className="w-3 h-3" />
                        <span>{selectedDate.city}</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold text-white">{selectedDate.date}</div>
                    <div className={`text-sm font-semibold uppercase tracking-wider ${selectedDate.status === 'Confirmed' ? 'text-maestro-accent' : 'text-yellow-500'}`}>
                        {selectedDate.status === 'Confirmed' ? 'Show Day' : selectedDate.status}
                    </div>
                </div>
            </div>

            {/* 3-Column Layout */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* COLUMN 1: SCHEDULE */}
                <div className="w-1/3 border-r border-maestro-700 flex flex-col min-w-[300px]">
                    <div className="h-12 bg-maestro-800 border-b border-maestro-700 flex items-center justify-between px-4 shrink-0">
                        <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Schedule
                        </span>
                        {canEdit && (
                            <div className="flex gap-2">
                                <button onClick={() => setShowTemplates(!showTemplates)} className="text-slate-500 hover:text-white" title="Apply Template">
                                    <Copy className="w-4 h-4" />
                                </button>
                                <button onClick={() => setIsAddingItem(!isAddingItem)} className="text-slate-500 hover:text-white" title="Add Item">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        
                        {/* Template Dropdown */}
                        {showTemplates && (
                            <div className="absolute top-32 left-48 w-48 bg-maestro-800 border border-maestro-700 shadow-xl rounded-lg z-50 animate-fadeIn">
                                <div className="p-2 text-xs font-bold text-slate-500 uppercase border-b border-maestro-700">Apply Template</div>
                                <button onClick={() => applyTemplate('Standard Show')} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-maestro-700">Standard Show Day</button>
                                <button onClick={() => applyTemplate('Travel Day')} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-maestro-700">Travel Day</button>
                            </div>
                        )}
                    </div>

                    {/* Add Item Form */}
                    {isAddingItem && (
                        <div className="p-3 bg-maestro-800 border-b border-maestro-700 animate-fadeIn shrink-0">
                            <form onSubmit={handleAddItem} className="space-y-2">
                                <input 
                                    autoFocus
                                    type="text" 
                                    placeholder="Event Title (e.g. Soundcheck)" 
                                    value={newItem.title} 
                                    onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                                    className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-sm text-white outline-none focus:border-maestro-accent"
                                />
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Start</label>
                                        <select 
                                            value={newItem.startTime} 
                                            onChange={(e) => setNewItem({...newItem, startTime: e.target.value})}
                                            className="w-full bg-maestro-900 border border-maestro-700 rounded p-1 text-xs text-white"
                                        >
                                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">End (Optional)</label>
                                        <select 
                                            value={newItem.endTime || ''} 
                                            onChange={(e) => setNewItem({...newItem, endTime: e.target.value})}
                                            className="w-full bg-maestro-900 border border-maestro-700 rounded p-1 text-xs text-white"
                                        >
                                            <option value="">--</option>
                                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <select 
                                    value={newItem.type} 
                                    onChange={(e) => setNewItem({...newItem, type: e.target.value as any})}
                                    className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-xs text-white"
                                >
                                    <option value="Production">Production</option>
                                    <option value="Show">Show</option>
                                    <option value="Travel">Travel</option>
                                    <option value="Press">Press</option>
                                    <option value="Other">Other</option>
                                </select>
                                <button type="submit" className="w-full bg-maestro-accent hover:bg-violet-600 text-white py-1 rounded text-xs font-bold">Add to Schedule</button>
                            </form>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {schedule.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 text-sm">Schedule is empty</div>
                        ) : (
                            schedule.map((item, idx) => (
                                <div key={idx} className="flex gap-3 p-3 bg-maestro-800/50 hover:bg-maestro-800 rounded border border-maestro-700 items-center group transition-colors">
                                    <div className="text-xs font-mono text-slate-400 w-16 flex-shrink-0 text-right">
                                        {item.startTime}
                                        {item.endTime && <div className="text-[10px] opacity-60">{item.endTime}</div>}
                                    </div>
                                    <div className="w-1 bg-maestro-700 h-8 rounded-full"></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-white text-sm truncate">{item.title}</div>
                                        <div className="text-[10px] text-slate-500 uppercase">{item.type}</div>
                                    </div>
                                    {canEdit && (
                                        <button onClick={() => handleDeleteItem(item.id)} className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* COLUMN 2: VENUE & INFO */}
                <div className="w-1/3 border-r border-maestro-700 flex flex-col min-w-[300px] overflow-y-auto custom-scrollbar">
                    <div className="p-4 space-y-6">
                        {/* Weather Widget */}
                        <div className="bg-gradient-to-br from-blue-900/40 to-maestro-800 p-4 rounded-xl border border-white/10 flex items-center justify-between">
                            <div>
                                <div className="text-3xl font-bold text-white flex items-center gap-2">
                                    {getWeatherIcon(weather.desc)}
                                    {weather.temp}
                                </div>
                                <div className="text-xs text-blue-200 mt-1 uppercase font-bold tracking-wider">{weather.desc}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-slate-400">FORECAST</div>
                                <div className="text-xs text-white">{selectedDate.city}</div>
                            </div>
                        </div>

                        {/* Venue Info */}
                        <div className="bg-maestro-800 rounded-xl border border-maestro-700 overflow-hidden">
                            <div className="p-3 bg-maestro-900 border-b border-maestro-700 flex justify-between items-center">
                                <h3 className="font-bold text-slate-300 text-xs uppercase flex items-center gap-2">
                                    <Building className="w-3 h-3" /> Venue Details
                                </h3>
                                {canEdit && (
                                    editSection === 'venue' ? (
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditSection(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                                            <button onClick={saveVenue} className="text-green-500 hover:text-green-400"><Save className="w-4 h-4" /></button>
                                        </div>
                                    ) : (
                                        <button onClick={startEditingVenue} className="text-slate-500 hover:text-white"><Edit2 className="w-3 h-3" /></button>
                                    )
                                )}
                            </div>
                            
                            {editSection === 'venue' ? (
                                <div className="p-4 space-y-3">
                                    <input type="text" placeholder="Venue Name" value={venueForm.venue} onChange={e => setVenueForm({...venueForm, venue: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-xs text-white outline-none" />
                                    <input type="text" placeholder="Address" value={venueForm.address} onChange={e => setVenueForm({...venueForm, address: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-xs text-white outline-none" />
                                    <input type="text" placeholder="Main Phone" value={venueForm.venuePhone} onChange={e => setVenueForm({...venueForm, venuePhone: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-xs text-white outline-none" />
                                </div>
                            ) : (
                                <div className="p-4 text-sm space-y-2">
                                    <div className="font-bold text-white">{selectedDate.venue}</div>
                                    <div className="text-slate-400 flex items-start gap-2">
                                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        {selectedDate.address || 'No address set'}
                                    </div>
                                    {selectedDate.venuePhone && (
                                        <div className="text-slate-400 flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            {selectedDate.venuePhone}
                                        </div>
                                    )}
                                    <a 
                                        href={`https://maps.google.com/?q=${selectedDate.venue} ${selectedDate.city}`}
                                        target="_blank" rel="noreferrer"
                                        className="text-xs text-maestro-accent hover:underline flex items-center gap-1 mt-2"
                                    >
                                        Open Map <ChevronRight className="w-3 h-3" />
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div className="bg-maestro-800 rounded-xl border border-maestro-700 overflow-hidden flex flex-col h-64">
                            <div className="p-3 bg-maestro-900 border-b border-maestro-700 flex justify-between items-center">
                                <h3 className="font-bold text-slate-300 text-xs uppercase flex items-center gap-2">
                                    <FileText className="w-3 h-3" /> Day Notes
                                </h3>
                                {isSavingNotes && <span className="text-[10px] text-green-400 animate-pulse">Saved</span>}
                            </div>
                            <textarea 
                                value={notesBuffer}
                                onChange={(e) => setNotesBuffer(e.target.value)}
                                onBlur={handleSaveNotes}
                                placeholder="Parking info, wifi codes, runner instructions..."
                                className="flex-1 bg-maestro-800 p-4 text-sm text-slate-300 outline-none resize-none focus:bg-maestro-800/80"
                            />
                        </div>
                    </div>
                </div>

                {/* COLUMN 3: CONTACTS & ACCOMMODATION */}
                <div className="w-1/3 flex flex-col min-w-[300px] overflow-y-auto custom-scrollbar">
                    <div className="p-4 space-y-6">
                        
                        {/* KEY CONTACTS SECTION */}
                        <div className="bg-maestro-800 rounded-xl border border-maestro-700 overflow-hidden">
                            <div className="p-3 bg-maestro-900 border-b border-maestro-700 flex justify-between items-center">
                                <h3 className="font-bold text-slate-300 text-xs uppercase flex items-center gap-2">
                                    <Briefcase className="w-3 h-3 text-maestro-gold" /> Key Contacts
                                </h3>
                                {canEdit && (
                                    editSection === 'contacts' ? (
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditSection(null)} className="p-1 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50" title="Cancel">
                                                <X className="w-4 h-4" />
                                            </button>
                                            <button onClick={saveContacts} className="p-1 bg-green-900/30 text-green-400 rounded hover:bg-green-900/50" title="Save">
                                                <Check className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={startEditingContacts} className="text-slate-500 hover:text-white" title="Edit Contacts">
                                            <Edit2 className="w-3 h-3" />
                                        </button>
                                    )
                                )}
                            </div>

                            {editSection === 'contacts' ? (
                                <div className="p-4 space-y-4 animate-fadeIn">
                                    <div>
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">Venue Contact Name</label>
                                        <div className="relative mt-1">
                                            <User className="absolute left-2 top-2.5 w-3 h-3 text-slate-500" />
                                            <input 
                                                type="text" 
                                                value={contactForm.venueContactName || ''}
                                                onChange={e => setContactForm({...contactForm, venueContactName: e.target.value})}
                                                className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 pl-7 text-xs text-white outline-none focus:border-maestro-accent"
                                                placeholder="e.g. John Doe (PM)"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">Direct Phone</label>
                                        <div className="relative mt-1">
                                            <Phone className="absolute left-2 top-2.5 w-3 h-3 text-slate-500" />
                                            <input 
                                                type="text" 
                                                value={contactForm.venueContactPhone || ''}
                                                onChange={e => setContactForm({...contactForm, venueContactPhone: e.target.value})}
                                                className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 pl-7 text-xs text-white outline-none focus:border-maestro-accent"
                                                placeholder="+1 555..."
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">Email Address</label>
                                        <div className="relative mt-1">
                                            <Mail className="absolute left-2 top-2.5 w-3 h-3 text-slate-500" />
                                            <input 
                                                type="email" 
                                                value={contactForm.venueContactEmail || ''}
                                                onChange={e => setContactForm({...contactForm, venueContactEmail: e.target.value})}
                                                className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 pl-7 text-xs text-white outline-none focus:border-maestro-accent"
                                                placeholder="email@venue.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-maestro-900 p-2 rounded-full text-slate-400">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase">Venue Rep</div>
                                            <div className="text-sm font-bold text-white">{selectedDate.venueContactName || 'N/A'}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="bg-maestro-900 p-2 rounded-full text-slate-400">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase">Direct Phone</div>
                                            <div className="text-sm text-slate-300 font-mono">{selectedDate.venueContactPhone || 'N/A'}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="bg-maestro-900 p-2 rounded-full text-slate-400">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase">Email</div>
                                            <div className="text-sm text-slate-300">{selectedDate.venueContactEmail || 'N/A'}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Accommodation */}
                        <div className="bg-maestro-800 rounded-xl border border-maestro-700 overflow-hidden">
                            <div className="p-3 bg-maestro-900 border-b border-maestro-700 flex justify-between items-center">
                                <h3 className="font-bold text-slate-300 text-xs uppercase flex items-center gap-2">
                                    <Building className="w-3 h-3" /> Accommodation
                                </h3>
                                {canEdit && (
                                    editSection === 'accommodation' ? (
                                        <button onClick={() => setEditSection(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                                    ) : (
                                        <button onClick={() => setEditSection('accommodation')} className="text-slate-500 hover:text-white"><Plus className="w-4 h-4" /></button>
                                    )
                                )}
                            </div>

                            {editSection === 'accommodation' && (
                                <form onSubmit={handleAddHotel} className="p-3 bg-maestro-900/50 border-b border-maestro-700 space-y-2 animate-fadeIn">
                                    <input type="text" placeholder="Hotel Name" required value={newHotelForm.name} onChange={e => setNewHotelForm({...newHotelForm, name: e.target.value})} className="w-full bg-maestro-800 border border-maestro-700 rounded p-2 text-xs text-white outline-none" />
                                    <input type="text" placeholder="Address" value={newHotelForm.address} onChange={e => setNewHotelForm({...newHotelForm, address: e.target.value})} className="w-full bg-maestro-800 border border-maestro-700 rounded p-2 text-xs text-white outline-none" />
                                    <button type="submit" className="w-full bg-maestro-accent text-white py-1 rounded text-xs font-bold">Add Hotel</button>
                                </form>
                            )}

                            <div className="p-4 space-y-4">
                                {dateHotels.length === 0 ? (
                                    <div className="text-center text-slate-500 text-sm italic">No hotels listed.</div>
                                ) : (
                                    dateHotels.map(h => (
                                        <div key={h.id} className="border border-maestro-700 rounded-lg p-3 bg-maestro-900/30">
                                            <div className="font-bold text-white text-sm">{h.name}</div>
                                            <div className="text-xs text-slate-400 mt-1 flex gap-2">
                                                <MapPin className="w-3 h-3" /> {h.address || 'N/A'}
                                            </div>
                                            {h.phone && <div className="text-xs text-slate-400 mt-1 flex gap-2"><Phone className="w-3 h-3" /> {h.phone}</div>}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
