import React, { useState, useEffect } from 'react';
// Added missing Calendar import
import { Clock, MapPin, Phone, Building, Sun, Cloud, CloudRain, Save, Plus, FileText, User, Briefcase, Loader2, Check, Thermometer, Calendar } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TourDate, ScheduleItem, UserRole } from '../types';
import { askSearch } from '../services/geminiService';

export const DaySheet: React.FC = () => {
    const { tourDates, selectedDateId, updateTourDate, currentUser } = useApp();
    const selectedDate = tourDates.find(d => d.id === selectedDateId);

    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [newItem, setNewItem] = useState<Partial<ScheduleItem>>({ title: '', startTime: '12:00', type: 'Production' });
    const [notesBuffer, setNotesBuffer] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    const [weather, setWeather] = useState<{temp: string, desc: string}>({ temp: '--', desc: 'Fetching forecast...' });
    const [isWeatherLoading, setIsWeatherLoading] = useState(false);

    const canEdit = currentUser?.role !== UserRole.CREW;

    useEffect(() => {
        if (selectedDate) {
            setSchedule(selectedDate.schedule || []);
            setNotesBuffer(selectedDate.venueNotes || '');
            fetchLiveWeather();
        }
    }, [selectedDateId, selectedDate?.id]);

    const fetchLiveWeather = async () => {
        if (!selectedDate?.city) return;
        setIsWeatherLoading(true);
        try {
            const result = await askSearch(`Find current weather forecast for ${selectedDate.city} on ${selectedDate.date}. 
            Format exactly as: "Temperature | Brief Condition Description". 
            Use Celsius or Fahrenheit based on the city's location.`);
            
            const parts = (result.text || "").split('|');
            if (parts.length >= 2) {
                setWeather({ 
                    temp: parts[0].trim(), 
                    desc: parts[1].trim() 
                });
            } else {
                setWeather({ temp: '--', desc: 'Forecast unavailable' });
            }
        } catch (e) { 
            console.error("Weather fetch failed:", e); 
            setWeather({ temp: '--', desc: 'Service unavailable' });
        } finally {
            setIsWeatherLoading(false);
        }
    };

    const handleSaveNotes = () => {
        if (!selectedDateId) return;
        setIsSavingNotes(true);
        updateTourDate(selectedDateId, { venueNotes: notesBuffer });
        setTimeout(() => {
            setIsSavingNotes(false);
            setJustSaved(true);
            setTimeout(() => setJustSaved(false), 2000);
        }, 800);
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

    if (!selectedDate) return <div className="flex h-full items-center justify-center text-slate-500 font-bold uppercase tracking-widest text-sm bg-maestro-900">Select a date from the dashboard to view Day Sheet.</div>;

    return (
        <div className="flex flex-col h-full bg-maestro-900 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-maestro-700 bg-maestro-800 flex justify-between items-center shadow-xl shrink-0 z-10">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">{selectedDate.venue}</h1>
                    <div className="flex items-center gap-3 text-sm text-slate-400 font-medium mt-1">
                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-maestro-accent" /> {selectedDate.city}</span>
                        <span className="text-slate-700">|</span>
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-500" /> {selectedDate.date}</span>
                    </div>
                </div>
                <div className="flex gap-6 items-center">
                    <div className="text-right border-r border-maestro-700 pr-6">
                        <div className="flex items-center justify-end gap-2 text-white font-bold text-2xl">
                            {isWeatherLoading ? <Loader2 className="w-5 h-5 animate-spin text-maestro-gold" /> : <Thermometer className="w-6 h-6 text-maestro-gold" />}
                            {weather.temp}
                        </div>
                        <div className="text-[10px] font-bold text-maestro-gold uppercase tracking-[0.2em]">{weather.desc}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Advance Status</div>
                        <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border ${selectedDate.advanceStatus === 'CONFIRMED' ? 'bg-green-900/30 border-green-500 text-green-400' : 'bg-maestro-700 border-maestro-600 text-slate-400'}`}>
                            {selectedDate.advanceStatus || 'PENDING'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Timeline Column */}
                <div className="w-80 border-r border-maestro-700 p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar bg-maestro-900/30">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Clock className="w-4 h-4 text-maestro-gold" /> Daily Timeline</h3>
                        {canEdit && <button onClick={() => setIsAddingItem(!isAddingItem)} className="p-1.5 bg-maestro-800 rounded-lg text-slate-400 hover:text-white border border-maestro-700 transition-all"><Plus className="w-4 h-4" /></button>}
                    </div>
                    
                    {isAddingItem && (
                        <form onSubmit={handleAddItem} className="bg-maestro-800 p-5 rounded-xl border border-maestro-accent/50 space-y-4 mb-4 animate-fadeIn shadow-2xl">
                            <input autoFocus required type="text" placeholder="Schedule Event" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 p-3 rounded-lg text-sm text-white outline-none focus:border-maestro-accent" />
                            <input type="time" value={newItem.startTime} onChange={e => setNewItem({...newItem, startTime: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 p-3 rounded-lg text-sm text-white outline-none" />
                            <button type="submit" className="w-full bg-maestro-accent hover:bg-violet-600 text-white py-3 rounded-xl text-xs font-bold shadow-lg transition-all uppercase tracking-[0.2em]">Add to Day Sheet</button>
                        </form>
                    )}

                    <div className="space-y-3">
                        {schedule.length > 0 ? schedule.map(item => (
                            <div key={item.id} className="bg-maestro-800 p-4 rounded-xl border border-maestro-700 flex items-center gap-4 hover:border-maestro-accent/50 transition-all group relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-maestro-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <span className="text-xs font-mono text-maestro-gold font-bold bg-maestro-900 px-2 py-1 rounded border border-maestro-700 shadow-inner">{item.startTime}</span>
                                <span className="text-sm font-bold text-slate-100 flex-1">{item.title}</span>
                            </div>
                        )) : (
                            <div className="text-center py-10 text-slate-600 text-xs italic border border-dashed border-maestro-700 rounded-xl">Timeline empty.</div>
                        )}
                    </div>
                </div>

                {/* Main Content Pane */}
                <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-8 bg-maestro-900 space-y-8">
                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-8">
                        <div className="bg-maestro-800 p-6 rounded-2xl border border-maestro-700 shadow-xl relative overflow-hidden group hover:border-maestro-accent/20 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Briefcase className="w-16 h-16" /></div>
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><User className="w-3 h-3 text-maestro-accent" /> Show Day Contact</h4>
                            <div className="space-y-3">
                                <div className="text-xl font-bold text-white">{selectedDate.venueContactName || 'No PM Assigned'}</div>
                                <div className="text-sm text-slate-400 flex items-center gap-2 font-mono">
                                    <Phone className="w-4 h-4 text-slate-500" /> {selectedDate.venueContactPhone || selectedDate.venuePhone || 'Unlisted'}
                                </div>
                                <div className="text-sm text-slate-400 flex items-center gap-2">
                                    <Building className="w-4 h-4 text-slate-500" /> {selectedDate.address || 'Address missing'}
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-maestro-800 p-6 rounded-2xl border border-maestro-700 shadow-xl flex items-center justify-between relative overflow-hidden group hover:border-maestro-gold/20 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Sun className="w-16 h-16" /></div>
                            <div className="flex-1">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Live Weather Engine</h4>
                                <div className="flex items-center gap-3">
                                    <div className="text-4xl font-bold text-white">{weather.temp}</div>
                                    <div className="bg-maestro-gold/10 text-maestro-gold text-[10px] uppercase font-bold px-3 py-1 rounded-full border border-maestro-gold/20">
                                        {weather.desc}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-4 italic">Grounded by Gemini Live Search</p>
                            </div>
                            {weather.desc.toLowerCase().includes('rain') ? <CloudRain className="w-16 h-16 text-blue-400" /> : <Sun className="w-16 h-16 text-maestro-gold" />}
                        </div>
                    </div>

                    {/* PRODUCTION NOTES AREA */}
                    <div className="bg-maestro-800 rounded-2xl border border-maestro-700 overflow-hidden flex flex-col flex-1 shadow-2xl group transition-all hover:border-maestro-accent/20">
                        <div className="p-4 bg-maestro-900 border-b border-maestro-700 flex justify-between items-center">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <FileText className="w-4 h-4 text-maestro-accent" /> Show Day Production Notes
                            </h3>
                            <button 
                                onClick={handleSaveNotes} 
                                disabled={isSavingNotes} 
                                className={`px-8 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all shadow-lg shadow-black/50 ${justSaved ? 'bg-green-600' : 'bg-maestro-accent hover:bg-violet-600'}`}
                            >
                                {isSavingNotes ? <Loader2 className="animate-spin w-3 h-3" /> : (justSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />)}
                                {isSavingNotes ? 'SYNCING...' : (justSaved ? 'SAVED TO CLOUD' : 'COMMIT NOTES')}
                            </button>
                        </div>
                        <textarea 
                            value={notesBuffer}
                            onChange={e => setNotesBuffer(e.target.value)}
                            placeholder="Parking/Bus power specs, Dressing Room codes, Catering notes, Runner instructions..."
                            className="w-full flex-1 bg-maestro-800 p-8 text-slate-200 outline-none resize-none leading-relaxed text-lg font-sans placeholder:text-slate-700 focus:bg-maestro-900/40 transition-colors"
                        />
                        <div className="p-4 bg-maestro-900 border-t border-maestro-700 text-[10px] text-slate-600 uppercase tracking-widest font-bold text-center">
                            Secure local vault entry • Final sync: {new Date().toLocaleTimeString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};