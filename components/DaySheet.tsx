
import React, { useState, useEffect } from 'react';
// Added Loader2 to imports from lucide-react
import { Clock, MapPin, Phone, Building, Sun, Cloud, CloudRain, Save, Plus, Trash2, FileText, User, Briefcase, Loader2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TourDate, Hotel, ScheduleItem, UserRole } from '../types';
import { askSearch } from '../services/geminiService';

export const DaySheet: React.FC = () => {
    const { tourDates, selectedDateId, updateTourDate, hotels, currentTour, currentUser } = useApp();
    const selectedDate = tourDates.find(d => d.id === selectedDateId);

    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [newItem, setNewItem] = useState<Partial<ScheduleItem>>({ title: '', startTime: '12:00', type: 'Production' });
    const [notesBuffer, setNotesBuffer] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [weather, setWeather] = useState<{temp: string, desc: string}>({ temp: '--', desc: '...' });

    const canEdit = currentUser?.role !== UserRole.CREW;

    useEffect(() => {
        if (selectedDate) {
            setSchedule(selectedDate.schedule || []);
            setNotesBuffer(selectedDate.venueNotes || '');
            fetchWeather();
        }
    }, [selectedDateId]);

    const fetchWeather = async () => {
        if (!selectedDate?.city) return;
        try {
            const result = await askSearch(`Weather for ${selectedDate.city} on ${selectedDate.date}. Format: "Temp|Desc".`);
            const parts = result.text.split('|');
            setWeather({ temp: parts[0]?.trim() || '--', desc: parts[1]?.trim() || 'Clear' });
        } catch (e) { console.error(e); }
    };

    const handleSaveNotes = () => {
        if (!selectedDateId) return;
        setIsSavingNotes(true);
        updateTourDate(selectedDateId, { venueNotes: notesBuffer });
        setTimeout(() => setIsSavingNotes(false), 1000);
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if(!selectedDateId) return;
        const item: ScheduleItem = { id: Math.random().toString(36).substr(2, 9), title: newItem.title!, startTime: newItem.startTime!, type: newItem.type as any || 'Other' };
        const updated = [...schedule, item].sort((a, b) => a.startTime.localeCompare(b.startTime));
        setSchedule(updated);
        updateTourDate(selectedDateId, { schedule: updated });
        setIsAddingItem(false);
    };

    if (!selectedDate) return <div className="flex h-full items-center justify-center text-slate-500">Select a date to view Day Sheet.</div>;

    return (
        <div className="flex flex-col h-full bg-maestro-900">
            <div className="p-6 border-b border-maestro-700 bg-maestro-800 flex justify-between items-center shadow-xl">
                <div>
                    <h1 className="text-2xl font-bold text-white">{selectedDate.venue}</h1>
                    <div className="flex items-center gap-2 text-sm text-slate-400"><MapPin className="w-3 h-3" /> {selectedDate.city}</div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold text-white">{selectedDate.date}</div>
                    <div className="text-[10px] font-bold text-maestro-accent uppercase tracking-widest">Show Day</div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-1/3 border-r border-maestro-700 p-4 flex flex-col gap-4 overflow-y-auto bg-maestro-900/50">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Clock className="w-4 h-4" /> Timeline</h3>
                        {canEdit && <button onClick={() => setIsAddingItem(!isAddingItem)} className="text-slate-500 hover:text-white"><Plus className="w-4 h-4" /></button>}
                    </div>
                    {isAddingItem && (
                        <form onSubmit={handleAddItem} className="bg-maestro-800 p-3 rounded-lg border border-maestro-700 space-y-2 mb-4">
                            <input autoFocus required type="text" placeholder="Event Name" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 p-2 rounded text-sm text-white" />
                            <input type="time" value={newItem.startTime} onChange={e => setNewItem({...newItem, startTime: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 p-2 rounded text-sm text-white" />
                            <button type="submit" className="w-full bg-maestro-accent text-white py-1.5 rounded text-xs font-bold">Add Event</button>
                        </form>
                    )}
                    <div className="space-y-2">
                        {schedule.map(item => (
                            <div key={item.id} className="bg-maestro-800 p-3 rounded-lg border border-maestro-700 flex items-center gap-4">
                                <span className="text-xs font-mono text-maestro-gold font-bold">{item.startTime}</span>
                                <div className="w-0.5 h-6 bg-maestro-700"></div>
                                <span className="text-sm font-medium text-white">{item.title}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-2/3 flex flex-col overflow-y-auto p-6 bg-maestro-900">
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="bg-maestro-800 p-4 rounded-xl border border-maestro-700">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><Briefcase className="w-3 h-3" /> Contacts</h4>
                            <div className="space-y-3">
                                <div className="text-sm font-bold text-white">{selectedDate.venueContactName || 'N/A'}</div>
                                <div className="text-xs text-slate-400">{selectedDate.venuePhone || 'No Phone Registered'}</div>
                            </div>
                        </div>
                        <div className="bg-maestro-800 p-4 rounded-xl border border-maestro-700 flex items-center justify-between">
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-1">Local Forecast</h4>
                                <div className="text-xl font-bold text-white">{weather.temp}</div>
                                <div className="text-[10px] text-slate-500 uppercase">{weather.desc}</div>
                            </div>
                            <Sun className="text-maestro-gold w-8 h-8 opacity-50" />
                        </div>
                    </div>

                    <div className="bg-maestro-800 rounded-xl border border-maestro-700 overflow-hidden flex flex-col flex-1 shadow-2xl">
                        <div className="p-3 bg-maestro-900 border-b border-maestro-700 flex justify-between items-center">
                            <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><FileText className="w-4 h-4 text-maestro-accent" /> Production & Venue Notes</h3>
                            <button onClick={handleSaveNotes} disabled={isSavingNotes} className="bg-maestro-accent px-4 py-1.5 rounded text-xs font-bold text-white flex items-center gap-2 hover:bg-violet-600 transition-colors">
                                {isSavingNotes ? <Loader2 className="animate-spin w-3 h-3" /> : <Save className="w-3 h-3" />}
                                {isSavingNotes ? 'Saving...' : 'Save Record'}
                            </button>
                        </div>
                        <textarea 
                            value={notesBuffer}
                            onChange={e => setNotesBuffer(e.target.value)}
                            placeholder="Add specific instructions for this show stop... (Parking, Wifi, Stage dimensions, Shore power)"
                            className="w-full flex-1 bg-maestro-800 p-6 text-slate-200 outline-none resize-none leading-relaxed"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
