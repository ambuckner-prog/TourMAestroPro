
import React, { useState } from 'react';
import { Clock, MapPin, Phone, Building, MoreHorizontal, ChevronRight, Sun, Cloud, Info, AlertCircle, Edit2, Save, X, Plus } from 'lucide-react';
import { generateText } from '../services/geminiService';
import { useApp } from '../contexts/AppContext';
import { TourDate, Hotel } from '../types';

export const DaySheet: React.FC = () => {
    const { tourDates, selectedDateId, updateTourDate, hotels, addHotel, currentTour } = useApp();
    const selectedDate = tourDates.find(d => d.id === selectedDateId);

    // Editing States
    const [editSection, setEditSection] = useState<'venue' | 'contacts' | 'accommodation' | null>(null);
    
    // Form States
    const [venueForm, setVenueForm] = useState<Partial<TourDate>>({});
    const [contactForm, setContactForm] = useState<Partial<TourDate>>({});
    const [newHotelForm, setNewHotelForm] = useState<Partial<Hotel>>({ name: '', address: '', phone: '' });

    // Dummy Schedule Data (would come from DB in real app)
    const scheduleItems = [
        { time: '08:00 AM', title: 'Load In', type: 'production' },
        { time: '12:00 PM', endTime: '3:00 PM', title: 'Travel to Venue', type: 'travel' },
        { time: '03:00 PM', endTime: '4:30 PM', title: 'Sound Check', type: 'soundcheck' },
        { time: '06:00 PM', title: 'Doors', type: 'doors' },
        { time: '08:15 PM', endTime: '11:00 PM', title: 'Show Time', type: 'show', highlight: true },
        { time: '11:00 PM', title: 'Curfew', type: 'production' },
    ];

    if (!selectedDate) {
        return (
            <div className="flex flex-col h-full bg-maestro-900 items-center justify-center text-slate-400 p-6">
                <CalendarIcon className="w-16 h-16 mb-4 opacity-20" />
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

    const generateNotes = async () => {
        alert("AI Assistant: Generating daily briefing based on venue specs...");
    };

    // --- HANDLERS ---
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
        setContactForm({ venueContactName: selectedDate.venueContactName, venueContactPhone: selectedDate.venueContactPhone });
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

    return (
        <div className="flex flex-col h-full bg-maestro-900 text-slate-200">
            {/* Header Area */}
            <div className="h-20 border-b border-maestro-700 p-4 flex justify-between items-center bg-gradient-to-r from-maestro-900 to-maestro-800">
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
                    <div className="h-10 bg-maestro-800 border-b border-maestro-700 flex items-center justify-between px-3">
                        <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                            <Clock className="w-3 h-3" /> Schedule
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex-1 overflow-y-auto bg-maestro-900/50 p-2 space-y-1">
                        {scheduleItems.map((item, idx) => (
                            <div key={idx} className={`relative flex gap-3 p-3 rounded border ${item.highlight ? 'bg-red-900/20 border-red-900/50' : 'bg-maestro-800 border-maestro-700 hover:border-slate-600'} transition-colors group`}>
                                <div className={`w-1 rounded-full ${item.type === 'show' ? 'bg-red-500' : item.type === 'travel' ? 'bg-blue-500' : 'bg-slate-500'}`}></div>
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                                        <span>{item.time}</span>
                                        {item.endTime && <span>- {item.endTime}</span>}
                                    </div>
                                    <div className={`font-semibold ${item.highlight ? 'text-white' : 'text-slate-200'}`}>
                                        {item.title}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COLUMN 2: NOTES & MAP */}
                <div className="w-1/3 border-r border-maestro-700 flex flex-col min-w-[300px]">
                    {/* Notes Section */}
                    <div className="flex-1 border-b border-maestro-700 flex flex-col">
                        <div className="h-10 bg-maestro-800 border-b border-maestro-700 flex items-center justify-between px-3">
                            <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                <Info className="w-3 h-3" /> Notes
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <div className="bg-maestro-800/50 p-3 rounded border border-maestro-700">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Day Notes</h4>
                                <ul className="text-sm text-slate-300 space-y-2 list-disc pl-4">
                                    <li>Laminates for guest list section must be carried at ALL TIMES!</li>
                                    <li>Capacity: {selectedDate.capacity ? selectedDate.capacity.toLocaleString() : 'TBD'}</li>
                                    <li>For any questions message TM.</li>
                                </ul>
                            </div>
                            
                            <div className="bg-maestro-800/50 p-3 rounded border border-maestro-700">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Production Notes</h4>
                                <p className="text-sm text-slate-300">Pyrotechnics permit pending city approval.</p>
                            </div>

                            <button onClick={generateNotes} className="w-full py-2 text-xs text-maestro-accent border border-dashed border-maestro-700 hover:border-maestro-accent rounded transition-colors">
                                + Add AI Generated Note
                            </button>
                        </div>
                    </div>

                    {/* Local Time & Weather Mini-Widget */}
                    <div className="h-48 bg-black relative flex flex-col justify-end p-4 border-t border-maestro-700">
                        {/* Simulated Map Background */}
                        <div className="absolute inset-0 opacity-40 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/-86.778,36.160,13,0/600x300?access_token=pk.eyJ1IjoiZGVtbyIsImEiOiJja2VuaHpwM3Iwbm5mMnR0bjN5emV5eG05In0.k5jM9rX6g-2g4w5z1y1z1g')] bg-cover bg-center grayscale"></div>
                        <div className="relative z-10">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-1">{selectedDate.city} Local Time</div>
                            <div className="text-3xl font-bold text-white flex items-center gap-3">
                                8:00 PM <span className="text-sm font-normal text-slate-400"></span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-300 mt-1">
                                <Sun className="w-4 h-4 text-yellow-500" /> 75°F Clear
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMN 3: DETAILS (VENUES/HOTELS) */}
                <div className="w-1/3 flex flex-col min-w-[300px] bg-maestro-800/20">
                    <div className="h-10 bg-maestro-800 border-b border-maestro-700 flex items-center justify-between px-3">
                         <span className="text-xs font-bold text-slate-400 uppercase">Day Visibility</span>
                    </div>
                    
                    {/* Venue Section */}
                    <div className="border-b border-maestro-700">
                        <div className="h-8 bg-maestro-800/50 flex items-center justify-between px-3 cursor-pointer hover:bg-maestro-800">
                             <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                <Building className="w-3 h-3" /> Venue Info
                            </span>
                            {editSection === 'venue' ? (
                                <div className="flex gap-2">
                                    <button onClick={saveVenue}><Save className="w-3 h-3 text-green-400" /></button>
                                    <button onClick={() => setEditSection(null)}><X className="w-3 h-3 text-red-400" /></button>
                                </div>
                            ) : (
                                <button onClick={startEditingVenue}><Edit2 className="w-3 h-3 text-slate-500 hover:text-white" /></button>
                            )}
                        </div>
                        <div className="p-4 space-y-3">
                            {editSection === 'venue' ? (
                                <div className="space-y-2">
                                    <input type="text" value={venueForm.venue || ''} onChange={e => setVenueForm({...venueForm, venue: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-1 text-xs text-white" placeholder="Venue Name" />
                                    <input type="text" value={venueForm.city || ''} onChange={e => setVenueForm({...venueForm, city: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-1 text-xs text-white" placeholder="City" />
                                    <input type="text" value={venueForm.address || ''} onChange={e => setVenueForm({...venueForm, address: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-1 text-xs text-white" placeholder="Address" />
                                    <input type="text" value={venueForm.venuePhone || ''} onChange={e => setVenueForm({...venueForm, venuePhone: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-1 text-xs text-white" placeholder="Main Phone" />
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">{selectedDate.venue}</h3>
                                        <p className="text-xs text-slate-400">{selectedDate.city}</p>
                                        <p className="text-[10px] text-slate-500 mt-1">{selectedDate.address || 'No address listed'}</p>
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        <span className="font-bold">Main:</span> {selectedDate.venuePhone || 'N/A'}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                     {/* Hotels Section */}
                     <div className="border-b border-maestro-700 flex-1">
                        <div className="h-8 bg-maestro-800/50 flex items-center justify-between px-3 cursor-pointer hover:bg-maestro-800">
                             <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                <Building className="w-3 h-3" /> Accommodations
                            </span>
                            {editSection === 'accommodation' ? (
                                <button onClick={() => setEditSection(null)}><X className="w-3 h-3 text-red-400" /></button>
                            ) : (
                                <button onClick={() => setEditSection('accommodation')}><Plus className="w-3 h-3 text-slate-500 hover:text-white" /></button>
                            )}
                        </div>
                        <div className="p-4 space-y-4 max-h-60 overflow-y-auto">
                           {editSection === 'accommodation' && (
                               <form onSubmit={handleAddHotel} className="mb-4 bg-maestro-900 p-2 rounded border border-maestro-700 space-y-2">
                                   <input type="text" required value={newHotelForm.name} onChange={e => setNewHotelForm({...newHotelForm, name: e.target.value})} placeholder="Hotel Name" className="w-full bg-maestro-800 border border-maestro-600 rounded p-1 text-xs text-white" />
                                   <input type="text" value={newHotelForm.address} onChange={e => setNewHotelForm({...newHotelForm, address: e.target.value})} placeholder="Address" className="w-full bg-maestro-800 border border-maestro-600 rounded p-1 text-xs text-white" />
                                   <input type="text" value={newHotelForm.phone} onChange={e => setNewHotelForm({...newHotelForm, phone: e.target.value})} placeholder="Phone" className="w-full bg-maestro-800 border border-maestro-600 rounded p-1 text-xs text-white" />
                                   <button type="submit" className="w-full bg-green-600 text-white text-xs py-1 rounded">Add Hotel</button>
                               </form>
                           )}
                           
                           {dateHotels.length > 0 ? dateHotels.map(h => (
                               <div key={h.id} className="border-l-2 border-blue-500 pl-3">
                                   <div className="font-bold text-white text-sm">{h.name}</div>
                                   <div className="text-xs text-slate-400">{h.address}</div>
                                   <div className="text-[10px] text-slate-500 mt-1">{h.phone}</div>
                               </div>
                           )) : (
                               <div className="text-sm text-slate-500 italic">No hotel assigned to this date yet.</div>
                           )}
                        </div>
                    </div>

                    <div className="border-b border-maestro-700">
                        <div className="h-8 bg-maestro-800/50 flex items-center justify-between px-3 cursor-pointer hover:bg-maestro-800">
                             <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                <Phone className="w-3 h-3" /> Key Contacts
                            </span>
                            {editSection === 'contacts' ? (
                                <div className="flex gap-2">
                                    <button onClick={saveContacts}><Save className="w-3 h-3 text-green-400" /></button>
                                    <button onClick={() => setEditSection(null)}><X className="w-3 h-3 text-red-400" /></button>
                                </div>
                            ) : (
                                <button onClick={startEditingContacts}><Edit2 className="w-3 h-3 text-slate-500 hover:text-white" /></button>
                            )}
                        </div>
                        <div className="p-4 space-y-2">
                             {editSection === 'contacts' ? (
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase text-slate-500 font-bold">Venue Rep</label>
                                    <input type="text" value={contactForm.venueContactName || ''} onChange={e => setContactForm({...contactForm, venueContactName: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-1 text-xs text-white" placeholder="Contact Name" />
                                    <label className="text-[10px] uppercase text-slate-500 font-bold">Direct Line</label>
                                    <input type="text" value={contactForm.venueContactPhone || ''} onChange={e => setContactForm({...contactForm, venueContactPhone: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-1 text-xs text-white" placeholder="Phone Number" />
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between text-xs border-b border-maestro-700/50 pb-2">
                                        <span className="text-slate-400">Venue Rep:</span>
                                        <span className="text-white font-bold">{selectedDate.venueContactName || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs pt-1">
                                        <span className="text-slate-400">Direct:</span>
                                        <span className="text-slate-300 font-mono">{selectedDate.venueContactPhone || 'N/A'}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CalendarIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
);
