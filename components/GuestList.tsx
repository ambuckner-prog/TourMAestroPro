
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { GuestRequest } from '../types';
import { generateText } from '../services/geminiService';
import { Users, CheckCircle, XCircle, MessageSquare, Loader2, ArrowLeft, Plus, Trash2, Calendar, MapPin, Search, Filter } from 'lucide-react';

export const GuestList: React.FC = () => {
    const { guestRequests, tourDates, currentTour, addGuestRequest, updateGuestRequestStatus, deleteGuestRequest, currentUser, selectedDateId, setSelectedDateId } = useApp();
    
    // View State: 'LIST' (All Dates) or 'DETAIL' (Specific Date)
    // Now derived primarily from whether a global date is selected
    const viewMode = selectedDateId ? 'DETAIL' : 'LIST';
    
    // Processing State
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // New Guest Form State
    const [isAdding, setIsAdding] = useState(false);
    const [newGuest, setNewGuest] = useState({ name: '', affiliation: '', quantity: 1, notes: '' });

    // Filter dates for current tour
    const currentDates = tourDates.filter(d => d.tourId === currentTour?.id).sort((a, b) => a.date.localeCompare(b.date));

    // Filter requests for selected date
    const selectedDateRequests = guestRequests.filter(req => req.dateId === selectedDateId);
    
    // Calculate Stats for Landing Page
    const getStats = (dateId: string) => {
        const reqs = guestRequests.filter(r => r.dateId === dateId);
        const total = reqs.reduce((acc, r) => acc + r.quantity, 0);
        const approved = reqs.filter(r => r.status === 'Approved').reduce((acc, r) => acc + r.quantity, 0);
        return { total, approved, count: reqs.length };
    };

    const handleDateClick = (dateId: string) => {
        setSelectedDateId(dateId);
    };

    const handleBack = () => {
        setSelectedDateId(null);
        setSearchTerm('');
    };

    const handleAddGuest = (e: React.FormEvent) => {
        e.preventDefault();
        if(!selectedDateId || !currentTour) return;

        const request: GuestRequest = {
            id: Math.random().toString(36).substr(2, 9),
            tourId: currentTour.id,
            dateId: selectedDateId,
            name: newGuest.name,
            affiliation: newGuest.affiliation,
            quantity: newGuest.quantity,
            status: 'Pending',
            notes: newGuest.notes
        };

        addGuestRequest(request);
        setNewGuest({ name: '', affiliation: '', quantity: 1, notes: '' });
        setIsAdding(false);
    };

    const handleUpdateStatus = async (id: string, newStatus: 'Approved' | 'Denied' | 'Pending') => {
        setProcessingId(id);
        // Simulate API delay
        await new Promise(r => setTimeout(r, 400));
        updateGuestRequestStatus(id, newStatus);
        setProcessingId(null);
    };

    const handleDelete = (id: string) => {
        if(window.confirm("Permanently delete this guest request?")) {
            deleteGuestRequest(id);
        }
    };

    const handleEmailDraft = async (req: GuestRequest) => {
        alert(`Simulated: Gemini drafting email to ${req.name} regarding ${req.status} request.`);
    };

    // --- LANDING PAGE VIEW (Select Date) ---
    if (viewMode === 'LIST') {
        return (
            <div className="space-y-6 h-full flex flex-col">
                <header>
                    <h1 className="text-3xl font-bold text-white">Guest List Management</h1>
                    <p className="text-slate-400">Select a show to manage allocations.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-6">
                    {currentDates.length === 0 ? (
                        <div className="col-span-full text-center py-20 text-slate-500 border-2 border-dashed border-maestro-700 rounded-xl">
                            No dates found for this tour. Add dates in the Dashboard or Schedule view.
                        </div>
                    ) : (
                        currentDates.map(date => {
                            const stats = getStats(date.id);
                            return (
                                <div 
                                    key={date.id} 
                                    onClick={() => handleDateClick(date.id)}
                                    className="bg-maestro-800 rounded-xl border border-maestro-700 p-6 hover:border-maestro-accent hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="bg-maestro-900 rounded-lg p-3 text-center border border-maestro-700 group-hover:border-maestro-accent/50 transition-colors">
                                                <div className="text-xs text-slate-500 font-bold uppercase">{date.date.split('-')[1]}/{date.date.split('-')[2]}</div>
                                                <div className="text-xl font-bold text-white">{date.date.split('-')[0]}</div>
                                            </div>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${date.status === 'Confirmed' ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                                                {date.status}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-lg text-white mb-1 truncate">{date.city}</h3>
                                        <div className="text-sm text-slate-400 flex items-center gap-2 mb-4">
                                            <MapPin className="w-3 h-3" /> {date.venue}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-maestro-900/50 rounded-lg p-3 border border-maestro-700">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-xs text-slate-500 font-bold uppercase">Allocated</span>
                                            <span className="text-white font-bold text-lg">{stats.total} <span className="text-xs text-slate-500 font-normal">/ 50</span></span>
                                        </div>
                                        <div className="w-full bg-maestro-800 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-maestro-accent h-full" style={{ width: `${Math.min((stats.total / 50) * 100, 100)}%` }}></div>
                                        </div>
                                        <div className="mt-2 text-[10px] text-slate-400 flex justify-between">
                                            <span>{stats.count} Requests</span>
                                            <span className="text-green-400">{stats.approved} Approved</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    }

    // --- DETAIL VIEW (Specific List) ---
    const activeDate = currentDates.find(d => d.id === selectedDateId);
    
    // Filter Logic: Name OR Affiliation
    const filteredRequests = selectedDateRequests.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.affiliation.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 h-full flex flex-col">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shrink-0">
                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <button onClick={handleBack} className="bg-maestro-800 p-2 rounded-full border border-maestro-700 hover:bg-maestro-700 text-slate-400 hover:text-white transition-colors shrink-0">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2 truncate">
                            {activeDate?.city} <span className="text-slate-500 font-light hidden sm:inline">|</span> <span className="text-lg text-slate-400 font-normal hidden sm:inline">{activeDate?.venue}</span>
                        </h1>
                        <p className="text-slate-400 flex items-center gap-2 text-sm">
                            <Calendar className="w-3 h-3" /> {activeDate?.date}
                        </p>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    {/* Date Switcher Filter */}
                    <div className="bg-maestro-800 px-3 py-2 rounded-lg border border-maestro-700 text-sm flex items-center gap-2 relative">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <select 
                            value={selectedDateId || ''} 
                            onChange={(e) => setSelectedDateId(e.target.value)}
                            className="bg-transparent text-white outline-none appearance-none pr-6 w-full sm:w-auto cursor-pointer font-medium"
                        >
                            {currentDates.map(d => (
                                <option key={d.id} value={d.id} className="bg-maestro-800 text-white">
                                    {d.date} - {d.city}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Search Bar */}
                    <div className="bg-maestro-800 px-4 py-2 rounded-lg border border-maestro-700 text-sm flex items-center gap-3 flex-1 sm:flex-none">
                        <Search className="w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Search name or affiliation..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent text-white outline-none w-full sm:w-48 placeholder-slate-600"
                        />
                    </div>

                    <button 
                        onClick={() => setIsAdding(true)}
                        className="bg-maestro-accent hover:bg-violet-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-lg shrink-0"
                    >
                        <Plus className="w-4 h-4" /> Add Name
                    </button>
                </div>
            </header>

            {/* ADD FORM */}
            {isAdding && (
                <div className="bg-maestro-800 border border-maestro-accent/50 p-4 rounded-xl animate-fadeIn shrink-0">
                    <form onSubmit={handleAddGuest} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Name</label>
                            <input 
                                autoFocus
                                required
                                type="text" 
                                placeholder="Full Name"
                                value={newGuest.name}
                                onChange={e => setNewGuest({...newGuest, name: e.target.value})}
                                className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-white text-sm outline-none focus:border-maestro-accent"
                            />
                        </div>
                        <div className="w-full md:w-48 space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Affiliation</label>
                            <input 
                                type="text" 
                                placeholder="Label, Family, etc."
                                value={newGuest.affiliation}
                                onChange={e => setNewGuest({...newGuest, affiliation: e.target.value})}
                                className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-white text-sm outline-none focus:border-maestro-accent"
                            />
                        </div>
                        <div className="w-full md:w-24 space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Qty</label>
                            <input 
                                type="number" 
                                min="1"
                                value={newGuest.quantity}
                                onChange={e => setNewGuest({...newGuest, quantity: parseInt(e.target.value)})}
                                className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-white text-sm outline-none focus:border-maestro-accent"
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-bold">Cancel</button>
                            <button type="submit" className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded text-sm font-bold">Save</button>
                        </div>
                    </form>
                </div>
            )}

            {/* LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4">
                {filteredRequests.map((req) => (
                    <div key={req.id} className="bg-maestro-800 p-5 rounded-xl border border-maestro-700 relative overflow-hidden group animate-fadeIn">
                        {/* Status Indicator Bar */}
                        <div className={`absolute top-0 left-0 w-1 h-full ${
                            req.status === 'Approved' ? 'bg-green-500' :
                            req.status === 'Denied' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        
                        {/* Delete Button (Visible to all users) */}
                        <button 
                            onClick={() => handleDelete(req.id)}
                            className="absolute top-2 right-2 p-1.5 text-slate-600 hover:text-red-500 hover:bg-maestro-900 rounded opacity-0 group-hover:opacity-100 transition-all z-10"
                            title="Delete Request"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="flex justify-between items-start mb-2 pl-3 pr-6">
                            <div>
                                <h3 className="font-bold text-white text-lg truncate pr-2">{req.name}</h3>
                                <p className="text-sm text-slate-400">{req.affiliation}</p>
                            </div>
                            <span className="bg-maestro-900 text-white font-mono px-3 py-1 rounded text-lg font-bold border border-maestro-700 shrink-0">
                                +{req.quantity}
                            </span>
                        </div>

                        {req.notes && (
                            <div className="pl-3 mb-4 text-xs text-slate-500 italic truncate">
                                "{req.notes}"
                            </div>
                        )}

                        <div className="flex items-center justify-between mt-4 pl-3 border-t border-maestro-700 pt-3">
                            <div className="flex gap-2">
                                {req.status === 'Pending' ? (
                                    <>
                                        <button 
                                            onClick={() => handleUpdateStatus(req.id, 'Approved')}
                                            disabled={!!processingId}
                                            className="p-2 bg-green-500/10 text-green-400 rounded hover:bg-green-500 hover:text-white transition-colors border border-green-500/20"
                                            title="Approve"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleUpdateStatus(req.id, 'Denied')}
                                            disabled={!!processingId}
                                            className="p-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500 hover:text-white transition-colors border border-red-500/20"
                                            title="Deny"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                                            req.status === 'Approved' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                                        }`}>
                                            {req.status}
                                        </span>
                                        {/* Allow reverting status */}
                                        <button onClick={() => handleUpdateStatus(req.id, 'Pending')} className="text-[10px] text-slate-500 hover:text-white underline">Undo</button>
                                    </div>
                                )}
                            </div>
                            
                            <button onClick={() => handleEmailDraft(req)} className="text-slate-500 hover:text-maestro-accent" title="Draft Email">
                                <MessageSquare className="w-4 h-4" />
                            </button>
                        </div>
                        
                        {processingId === req.id && (
                            <div className="absolute inset-0 bg-maestro-900/80 flex items-center justify-center z-20">
                                <Loader2 className="w-6 h-6 animate-spin text-white" />
                            </div>
                        )}
                    </div>
                ))}
                
                {/* Empty State for Detail View */}
                {filteredRequests.length === 0 && (
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-maestro-700 rounded-xl text-slate-500">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>{searchTerm ? 'No guests found matching your search.' : 'No guests on the list yet.'}</p>
                        {!searchTerm && <button onClick={() => setIsAdding(true)} className="text-maestro-accent font-bold hover:underline mt-2">Add the first guest</button>}
                    </div>
                )}
            </div>
        </div>
    );
};
