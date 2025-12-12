
import React, { useState } from 'react';
import { TourDate, UserRole } from '../types';
import { generateText } from '../services/geminiService';
import { useApp } from '../contexts/AppContext';
import { Calendar, MapPin, Building, Mail, Loader2, Check, Plus, X, Save, Hash, Send, Phone, User, Trash2, Edit2 } from 'lucide-react';

export const TourSchedule: React.FC = () => {
    const { tourDates, setSelectedDateId, currentTour, addTourDate, updateTourDate, deleteTourDate, currentUser } = useApp();
    const [selectedDate, setSelectedDate] = useState<TourDate | null>(null);
    const [aiDraft, setAiDraft] = useState<string>('');
    const [isDrafting, setIsDrafting] = useState(false);

    // Edit/Add Mode
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [dateForm, setDateForm] = useState<Partial<TourDate>>({
        date: '', city: '', venue: '', capacity: 0, status: 'Confirmed', address: '', confirmationNumber: '',
        venueContactName: '', venueContactPhone: ''
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

    const handleSendEmail = () => {
        if (!selectedDate || !aiDraft) return;
        const subject = encodeURIComponent(`Production Advance: ${selectedDate.venue} - ${selectedDate.date}`);
        const body = encodeURIComponent(aiDraft);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    const handleRowClick = (id: string) => {
        setSelectedDateId(id);
        alert("Date selected. Navigate to 'Day Sheet' to view full overview.");
    };

    // --- CRUD Handlers ---
    const openAddModal = () => {
        setEditingId(null);
        setDateForm({
            date: '', city: '', venue: '', capacity: 0, status: 'Confirmed', 
            address: '', confirmationNumber: '', venueContactName: '', venueContactPhone: '' 
        });
        setIsModalOpen(true);
    };

    const openEditModal = (e: React.MouseEvent, date: TourDate) => {
        e.stopPropagation();
        setEditingId(date.id);
        setDateForm({ ...date });
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
            // Update
            updateTourDate(editingId, dateForm);
        } else {
            // Create
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
                venueContactPhone: dateForm.venueContactPhone
            });
        }
        setIsModalOpen(false);
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
                    <div className="bg-maestro-800 border border-maestro-accent/50 p-6 rounded-xl shadow-2xl w-full max-w-4xl relative overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6 border-b border-maestro-700 pb-4">
                            <h3 className="font-bold text-white flex items-center gap-2 text-xl">
                                <Calendar className="w-6 h-6 text-maestro-accent" /> {editingId ? 'Edit Tour Date' : 'New Tour Date'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSaveDate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
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
                                <input 
                                    required
                                    type="text" 
                                    placeholder="United Center"
                                    value={dateForm.venue}
                                    onChange={(e) => setDateForm({...dateForm, venue: e.target.value})}
                                    className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-3 text-white outline-none focus:border-maestro-accent"
                                />
                            </div>
                            <div className="lg:col-span-3">
                                <label className="text-xs font-bold text-slate-400 uppercase">Address</label>
                                <input 
                                    type="text" 
                                    placeholder="123 Arena Blvd"
                                    value={dateForm.address || ''}
                                    onChange={(e) => setDateForm({...dateForm, address: e.target.value})}
                                    className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-3 text-white outline-none focus:border-maestro-accent"
                                />
                            </div>
                            
                            {/* Contact Fields */}
                            <div className="lg:col-span-3">
                                 <label className="text-xs font-bold text-slate-400 uppercase">Venue Contact</label>
                                 <div className="relative mt-1">
                                     <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                                     <input 
                                         type="text" 
                                         placeholder="Name (e.g. John Doe)"
                                         value={dateForm.venueContactName || ''}
                                         onChange={(e) => setDateForm({...dateForm, venueContactName: e.target.value})}
                                         className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 pl-10 text-white outline-none focus:border-maestro-accent"
                                     />
                                 </div>
                            </div>
                            <div className="lg:col-span-3">
                                 <label className="text-xs font-bold text-slate-400 uppercase">Contact Phone</label>
                                 <div className="relative mt-1">
                                     <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                                     <input 
                                         type="text" 
                                         placeholder="+1..."
                                         value={dateForm.venueContactPhone || ''}
                                         onChange={(e) => setDateForm({...dateForm, venueContactPhone: e.target.value})}
                                         className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 pl-10 text-white outline-none focus:border-maestro-accent"
                                     />
                                 </div>
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
                            
                            <div className="lg:col-span-6 flex justify-end gap-3 mt-4 pt-4 border-t border-maestro-700">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white px-4 py-2 text-sm font-bold">Cancel</button>
                                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold flex items-center gap-2"><Save className="w-4 h-4" /> {editingId ? 'Update' : 'Save'} Date</button>
                            </div>
                        </form>
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
                                            {d.venueContactPhone && (
                                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Phone className="w-3 h-3" /> {d.venueContactPhone}
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
