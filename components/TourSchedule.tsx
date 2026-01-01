
import React, { useState } from 'react';
import { TourDate, UserRole, VenueDocument, View, ScheduleItem } from '../types';
import { generateText, askSearch, findVenueDocuments } from '../services/geminiService';
import { useApp } from '../contexts/AppContext';
import { Calendar, MapPin, Building, Mail, Loader2, Check, Plus, X, Save, Hash, Send, Phone, User, Trash2, Edit2, Wand2, FileText, Download, Briefcase, Search, CheckSquare, Square, Clock, ExternalLink, List, Ticket, TrendingUp } from 'lucide-react';

interface TourScheduleProps {
    onNavigate?: (view: View) => void;
}

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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'CONTACTS' | 'TECH' | 'SCHEDULE'>('GENERAL');
    
    const [isAutoFilling, setIsAutoFilling] = useState(false);
    const [dateForm, setDateForm] = useState<Partial<TourDate>>({
        date: '', city: '', venue: '', capacity: 0, status: 'Confirmed', 
        venueContactName: '', venueContactPhone: '', venueContactEmail: '', venuePhone: ''
    });

    const currentTourDates = tourDates.filter(d => d.tourId === currentTour?.id).sort((a,b) => a.date.localeCompare(b.date));
    const canEdit = currentUser?.role !== UserRole.CREW;

    const handleVenueAutoFill = async () => {
        if (!dateForm.venue) return;
        setIsAutoFilling(true);
        try {
            const result = await askSearch(`Find official contact info for ${dateForm.venue} in ${dateForm.city}. Format: "Address|Phone|Capacity".`);
            const text = result.text || "";
            const parts = text.split('|');
            if (parts.length >= 2) {
                setDateForm(prev => ({
                    ...prev,
                    address: parts[0].trim(),
                    venuePhone: parts[1].trim(),
                    capacity: parts[2] ? parseInt(parts[2].replace(/\D/g, '')) : prev.capacity
                }));
            }
        } catch (e) {
            console.error(e);
        } finally { setIsAutoFilling(false); }
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
        setDateForm({ date: '', city: '', venue: '', status: 'Confirmed', capacity: 0 });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div><h1 className="text-3xl font-bold text-white">Tour Schedule</h1><p className="text-slate-400">Master Routing & Venue Contacts</p></div>
                {canEdit && <button onClick={openAddModal} className="bg-maestro-accent hover:bg-violet-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"><Plus className="w-4 h-4" /> Add Date</button>}
            </header>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-maestro-800 border border-maestro-accent/50 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-maestro-700 flex justify-between items-center">
                            <h3 className="font-bold text-white flex items-center gap-2 text-xl"><Calendar className="w-6 h-6 text-maestro-accent" /> {editingId ? 'Edit' : 'Add'} Tour Date</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex border-b border-maestro-700 bg-maestro-800">
                            <button onClick={() => setActiveTab('GENERAL')} className={`px-6 py-3 text-sm font-bold ${activeTab === 'GENERAL' ? 'text-white border-b-2 border-maestro-accent' : 'text-slate-400'}`}>General</button>
                            <button onClick={() => setActiveTab('CONTACTS')} className={`px-6 py-3 text-sm font-bold ${activeTab === 'CONTACTS' ? 'text-white border-b-2 border-maestro-accent' : 'text-slate-400'}`}>Venue Contacts</button>
                        </div>
                        <form onSubmit={handleSaveDate} className="flex-1 overflow-y-auto p-6 space-y-6">
                            {activeTab === 'GENERAL' ? (
                                <div className="grid grid-cols-2 gap-6">
                                    <div><label className="text-xs font-bold text-slate-400 uppercase">Date</label><input required type="date" value={dateForm.date} onChange={e => setDateForm({...dateForm, date: e.target.value})} className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-3 text-white" /></div>
                                    <div><label className="text-xs font-bold text-slate-400 uppercase">Venue</label><div className="flex gap-2"><input required type="text" value={dateForm.venue} onChange={e => setDateForm({...dateForm, venue: e.target.value})} className="flex-1 mt-1 bg-maestro-900 border border-maestro-700 rounded p-3 text-white" /><button type="button" onClick={handleVenueAutoFill} className="bg-maestro-700 p-3 rounded mt-1"><Wand2 className="w-4 h-4 text-maestro-gold" /></button></div></div>
                                    <div><label className="text-xs font-bold text-slate-400 uppercase">City</label><input required type="text" value={dateForm.city} onChange={e => setDateForm({...dateForm, city: e.target.value})} className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-3 text-white" /></div>
                                    <div><label className="text-xs font-bold text-slate-400 uppercase">Capacity</label><input type="number" value={dateForm.capacity} onChange={e => setDateForm({...dateForm, capacity: parseInt(e.target.value) || 0})} className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-3 text-white" /></div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-6">
                                    <div><label className="text-xs font-bold text-slate-400 uppercase">Venue Main Phone</label><input type="text" value={dateForm.venuePhone || ''} onChange={e => setDateForm({...dateForm, venuePhone: e.target.value})} className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-3 text-white" /></div>
                                    <div><label className="text-xs font-bold text-slate-400 uppercase">Primary Contact Name</label><input type="text" value={dateForm.venueContactName || ''} onChange={e => setDateForm({...dateForm, venueContactName: e.target.value})} className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-3 text-white" /></div>
                                    <div><label className="text-xs font-bold text-slate-400 uppercase">Contact Email</label><input type="email" value={dateForm.venueContactEmail || ''} onChange={e => setDateForm({...dateForm, venueContactEmail: e.target.value})} className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-3 text-white" /></div>
                                    <div><label className="text-xs font-bold text-slate-400 uppercase">Contact Phone (Direct)</label><input type="text" value={dateForm.venueContactPhone || ''} onChange={e => setDateForm({...dateForm, venueContactPhone: e.target.value})} className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-3 text-white" /></div>
                                </div>
                            )}
                            <div className="flex justify-end gap-3 pt-6 border-t border-maestro-700">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 font-bold">Cancel</button>
                                <button type="submit" className="bg-green-600 px-6 py-2 rounded font-bold text-white">Save Date</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-maestro-800 rounded-xl border border-maestro-700 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-maestro-900 text-slate-400 text-xs uppercase font-bold">
                        <tr><th className="p-4">Date</th><th className="p-4">Venue & City</th><th className="p-4">Contacts</th><th className="p-4">Status</th><th className="p-4"></th></tr>
                    </thead>
                    <tbody className="divide-y divide-maestro-700">
                        {currentTourDates.map(d => (
                            <tr key={d.id} className="hover:bg-maestro-700/30 transition-colors cursor-pointer" onClick={() => { setSelectedDateId(d.id); if(onNavigate) onNavigate(View.SCHEDULE); }}>
                                <td className="p-4 font-mono text-white text-sm">{d.date}</td>
                                <td className="p-4"><div className="font-bold text-white">{d.venue}</div><div className="text-xs text-slate-500">{d.city}</div></td>
                                <td className="p-4"><div className="text-xs text-slate-300 font-medium flex items-center gap-1"><User className="w-3 h-3"/> {d.venueContactName || 'No Contact'}</div><div className="text-xs text-slate-500 mt-1">{d.venuePhone || d.venueContactPhone || '-'}</div></td>
                                <td className="p-4"><span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-green-900/50 text-green-400 border border-green-500/20">{d.status}</span></td>
                                <td className="p-4 text-right">
                                    <button onClick={(e) => { e.stopPropagation(); setEditingId(d.id); setDateForm(d); setIsModalOpen(true); }} className="p-2 text-slate-500 hover:text-white"><Edit2 className="w-4 h-4"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
