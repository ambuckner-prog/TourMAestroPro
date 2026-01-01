import React, { useState } from 'react';
import { TourDate, UserRole, VenueDocument, View } from '../types';
import { askSearch, findVenueDocuments } from '../services/geminiService';
import { useApp } from '../contexts/AppContext';
import { Calendar, MapPin, Building, Loader2, Plus, X, Phone, User, Edit2, Wand2, FileText, Globe, Search } from 'lucide-react';

interface TourScheduleProps {
    onNavigate?: (view: View) => void;
}

export const TourSchedule: React.FC<TourScheduleProps> = ({ onNavigate }) => {
    const { tourDates, setSelectedDateId, currentTour, addTourDate, updateTourDate, currentUser } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'CONTACTS' | 'TECH'>('GENERAL');
    
    const [isAutoFilling, setIsAutoFilling] = useState(false);
    const [dateForm, setDateForm] = useState<Partial<TourDate>>({
        date: '', city: '', venue: '', capacity: 0, status: 'Confirmed', 
        venueContactName: '', venueContactPhone: '', venueContactEmail: '', venuePhone: '',
        documents: []
    });

    const currentTourDates = tourDates.filter(d => d.tourId === currentTour?.id).sort((a,b) => a.date.localeCompare(b.date));
    const canEdit = currentUser?.role !== UserRole.CREW;

    const handleVenueAutoFill = async () => {
        if (!dateForm.venue || !dateForm.city) {
            alert("Please enter Venue and City first for AI lookup.");
            return;
        }
        setIsAutoFilling(true);
        try {
            // 1. Search for contact and capacity info
            const result = await askSearch(`Find official contact info for ${dateForm.venue} in ${dateForm.city}. 
            Format exactly as: "Address | Main Phone | Capacity | PM Name | PM Email". 
            If not found, use N/A.`);
            
            const text = result.text || "";
            const parts = text.split('|').map(p => p.trim());
            
            // 2. Search for tech documents
            const docs = await findVenueDocuments(dateForm.venue, dateForm.city);

            setDateForm(prev => ({
                ...prev,
                address: parts[0] !== 'N/A' ? parts[0] : prev.address,
                venuePhone: parts[1] !== 'N/A' ? parts[1] : prev.venuePhone,
                capacity: parts[2] ? parseInt(parts[2].replace(/\D/g, '')) || prev.capacity : prev.capacity,
                venueContactName: parts[3] !== 'N/A' ? parts[3] : prev.venueContactName,
                venueContactEmail: parts[4] !== 'N/A' ? parts[4] : prev.venueContactEmail,
                documents: docs
            }));
        } catch (e) {
            console.error("Autofill failed:", e);
        } finally {
            setIsAutoFilling(false);
        }
    };

    const handleSaveDate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentTour || !dateForm.date) return;
        if (editingId) updateTourDate(editingId, dateForm);
        else addTourDate({ ...dateForm, id: Math.random().toString(36).substr(2, 9), tourId: currentTour.id } as TourDate);
        setIsModalOpen(false);
    };

    const openAddModal = () => {
        setEditingId(null);
        setActiveTab('GENERAL');
        setDateForm({ 
            date: '', city: '', venue: '', status: 'Confirmed', capacity: 0, 
            venueContactName: '', venueContactPhone: '', venueContactEmail: '', venuePhone: '',
            documents: []
        });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 h-full overflow-y-auto p-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Tour Schedule</h1>
                    <p className="text-slate-400">Master Routing & AI Venue Intelligence</p>
                </div>
                {canEdit && <button onClick={openAddModal} className="bg-maestro-accent hover:bg-violet-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"><Plus className="w-4 h-4" /> Add Date</button>}
            </header>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-maestro-800 border border-maestro-accent/50 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-maestro-700 flex justify-between items-center">
                            <h3 className="font-bold text-white flex items-center gap-2 text-xl">
                                <Calendar className="w-6 h-6 text-maestro-accent" /> 
                                {editingId ? 'Edit Date' : 'Add New Date'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        
                        <div className="flex border-b border-maestro-700 bg-maestro-800">
                            <button onClick={() => setActiveTab('GENERAL')} className={`px-6 py-3 text-sm font-bold ${activeTab === 'GENERAL' ? 'text-white border-b-2 border-maestro-accent bg-white/5' : 'text-slate-400'}`}>General Info</button>
                            <button onClick={() => setActiveTab('CONTACTS')} className={`px-6 py-3 text-sm font-bold ${activeTab === 'CONTACTS' ? 'text-white border-b-2 border-maestro-accent bg-white/5' : 'text-slate-400'}`}>Venue Contacts</button>
                            <button onClick={() => setActiveTab('TECH')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 ${activeTab === 'TECH' ? 'text-white border-b-2 border-maestro-accent bg-white/5' : 'text-slate-400'}`}>
                                <Search className="w-4 h-4" /> Tech & Docs
                            </button>
                        </div>

                        <form onSubmit={handleSaveDate} className="flex-1 overflow-y-auto p-6 space-y-6">
                            {activeTab === 'GENERAL' && (
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Venue Name</label>
                                        <div className="flex gap-2 mt-1">
                                            <input required type="text" value={dateForm.venue} onChange={e => setDateForm({...dateForm, venue: e.target.value})} className="flex-1 bg-maestro-900 border border-maestro-700 rounded p-3 text-white outline-none focus:border-maestro-accent" placeholder="e.g. Royal Albert Hall" />
                                            <button type="button" onClick={handleVenueAutoFill} disabled={isAutoFilling} className="bg-maestro-700 hover:bg-maestro-600 px-4 rounded-lg text-white flex items-center gap-2 font-bold text-xs transition-colors">
                                                {isAutoFilling ? <Loader2 className="animate-spin w-4 h-4" /> : <Wand2 className="w-4 h-4 text-maestro-gold" />}
                                                AI Autofill
                                            </button>
                                        </div>
                                    </div>
                                    <div><label className="text-xs font-bold text-slate-400 uppercase">City</label><input required type="text" value={dateForm.city} onChange={e => setDateForm({...dateForm, city: e.target.value})} className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-3 text-white" placeholder="e.g. London" /></div>
                                    <div><label className="text-xs font-bold text-slate-400 uppercase">Show Date</label><input required type="date" value={dateForm.date} onChange={e => setDateForm({...dateForm, date: e.target.value})} className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-3 text-white" /></div>
                                    <div><label className="text-xs font-bold text-slate-400 uppercase">Capacity</label><input type="number" value={dateForm.capacity} onChange={e => setDateForm({...dateForm, capacity: parseInt(e.target.value) || 0})} className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-3 text-white" /></div>
                                    <div className="col-span-2"><label className="text-xs font-bold text-slate-400 uppercase">Full Address</label><input type="text" value={dateForm.address || ''} onChange={e => setDateForm({...dateForm, address: e.target.value})} className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-3 text-white" /></div>
                                </div>
                            )}

                            {activeTab === 'CONTACTS' && (
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2 md:col-span-1"><label className="text-xs font-bold text-slate-400 uppercase">Venue Main Phone</label><input type="text" value={dateForm.venuePhone || ''} onChange={e => setDateForm({...dateForm, venuePhone: e.target.value})} className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-3 text-white" /></div>
                                    <div className="col-span-2 md:col-span-1"><label className="text-xs font-bold text-slate-400 uppercase">Production Manager Name</label><input type="text" value={dateForm.venueContactName || ''} onChange={e => setDateForm({...dateForm, venueContactName: e.target.value})} className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-3 text-white" /></div>
                                    <div><label className="text-xs font-bold text-slate-400 uppercase">Direct Email</label><input type="email" value={dateForm.venueContactEmail || ''} onChange={e => setDateForm({...dateForm, venueContactEmail: e.target.value})} className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-3 text-white" /></div>
                                    <div><label className="text-xs font-bold text-slate-400 uppercase">Direct Phone</label><input type="text" value={dateForm.venueContactPhone || ''} onChange={e => setDateForm({...dateForm, venueContactPhone: e.target.value})} className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-3 text-white" /></div>
                                </div>
                            )}

                            {activeTab === 'TECH' && (
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-maestro-gold uppercase tracking-widest">AI Scraped Documents</h4>
                                    {dateForm.documents && dateForm.documents.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {dateForm.documents.map((doc, idx) => (
                                                <div key={idx} className="bg-maestro-900 border border-maestro-700 p-4 rounded-lg flex items-center justify-between group">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="w-5 h-5 text-slate-500" />
                                                        <div>
                                                            <div className="text-sm font-bold text-white truncate w-48">{doc.title}</div>
                                                            <div className="text-[10px] uppercase font-bold text-slate-500">{doc.type}</div>
                                                        </div>
                                                    </div>
                                                    <a href={doc.url} target="_blank" rel="noreferrer" className="text-xs text-maestro-accent hover:underline flex items-center gap-1">
                                                        <Globe className="w-3 h-3" /> View
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-10 text-center border-2 border-dashed border-maestro-700 rounded-xl text-slate-500 italic">
                                            No technical documents found yet. Try AI Autofill in the General tab.
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-6 border-t border-maestro-700">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 text-slate-400 font-bold">Cancel</button>
                                <button type="submit" className="bg-green-600 hover:bg-green-500 px-6 py-2 rounded font-bold text-white shadow-lg">Save Record</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-maestro-800 rounded-xl border border-maestro-700 overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                    <thead className="bg-maestro-900 text-slate-400 text-xs uppercase font-bold tracking-widest">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Venue & City</th>
                            <th className="p-4">PM Contact</th>
                            <th className="p-4">Tech Pack</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-maestro-700 text-slate-300">
                        {currentTourDates.map(d => (
                            <tr key={d.id} className="hover:bg-maestro-700/30 transition-colors cursor-pointer group" onClick={() => { setSelectedDateId(d.id); if(onNavigate) onNavigate(View.SCHEDULE); }}>
                                <td className="p-4 font-mono text-white text-sm">{d.date}</td>
                                <td className="p-4">
                                    <div className="font-bold text-white">{d.venue}</div>
                                    <div className="text-xs text-slate-500">{d.city}</div>
                                </td>
                                <td className="p-4">
                                    <div className="text-xs text-slate-300 font-bold">{d.venueContactName || 'No PM Listed'}</div>
                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{d.venueContactEmail || d.venuePhone || '-'}</div>
                                </td>
                                <td className="p-4">
                                    {d.documents && d.documents.length > 0 ? (
                                        <span className="flex items-center gap-1 text-[10px] bg-maestro-accent/10 text-maestro-accent px-2 py-0.5 rounded border border-maestro-accent/20 font-bold uppercase">
                                            <FileText className="w-3 h-3" /> Ready
                                        </span>
                                    ) : <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Pending</span>}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); setEditingId(d.id); setDateForm(d); setIsModalOpen(true); }} className="p-2 bg-maestro-900 rounded text-slate-400 hover:text-white border border-maestro-700"><Edit2 className="w-4 h-4"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {currentTourDates.length === 0 && (
                            <tr><td colSpan={5} className="p-20 text-center text-slate-500 italic">No tour dates registered.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};