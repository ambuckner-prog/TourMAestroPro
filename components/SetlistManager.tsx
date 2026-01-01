import React, { useState, useEffect } from 'react';
import { Song, Setlist } from '../types';
import { generateText } from '../services/geminiService';
// Added missing Loader2 import
import { Music2, ArrowUp, ArrowDown, Sparkles, Clock, ListMusic, Plus, Save, X, Trash2, Calendar, RefreshCw, Link as LinkIcon, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const SetlistManager: React.FC = () => {
    const { masterSongs, addMasterSong, tourDates, currentTour, setlists, saveSetlist, selectedDateId, setSelectedDateId, updateTourDate } = useApp();
    
    // Scope is derived from global selectedDateId. If null, we are editing Master.
    const scope = selectedDateId || 'MASTER';
    const activeDate = tourDates.find(d => d.id === selectedDateId);

    const [songs, setSongs] = useState<Song[]>([]);

    // Filter dates for current tour
    const currentDates = tourDates.filter(d => d.tourId === currentTour?.id).sort((a,b) => a.date.localeCompare(b.date));

    // Initial Load & Scope Change
    useEffect(() => {
        if (!currentTour) return;

        const targetDateId = scope === 'MASTER' ? undefined : scope;
        let savedSetlist: Setlist | undefined;

        if (scope === 'MASTER') {
            savedSetlist = setlists.find(s => s.tourId === currentTour.id && !s.dateId);
        } else {
            // 1. Priority: Check for a setlist that references this dateId
            savedSetlist = setlists.find(s => s.tourId === currentTour.id && s.dateId === targetDateId);
        }

        if (savedSetlist) {
            setSongs(savedSetlist.songs);
        } else if (scope !== 'MASTER') {
            // If specific date setlist doesn't exist, clone Master setlist as template
            const master = setlists.find(s => s.tourId === currentTour.id && !s.dateId);
            setSongs(master ? [...master.songs] : []);
        } else {
            setSongs([]);
        }
    }, [scope, currentTour, setlists, activeDate]);

    // UI States
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
    const [selectedLibrarySongId, setSelectedLibrarySongId] = useState<string>('');
    const [isCreatingSong, setIsCreatingSong] = useState(false);
    
    // New Song Form State
    const [newSong, setNewSong] = useState<Song>({ id: '', title: '', duration: '', bpm: 120, key: '' });

    const handleScopeChange = (newScope: string) => {
        setSelectedDateId(newScope === 'MASTER' ? null : newScope);
    };

    const moveSong = (index: number, direction: 'up' | 'down') => {
        const newSongs = [...songs];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSongs.length) return;
        
        [newSongs[index], newSongs[targetIndex]] = [newSongs[targetIndex], newSongs[index]];
        setSongs(newSongs);
    };

    const removeSong = (index: number) => {
        setSongs(songs.filter((_, i) => i !== index));
    };

    const handleAddFromLibrary = () => {
        const songToAdd = masterSongs.find(s => s.id === selectedLibrarySongId);
        if (songToAdd) {
            const setlistInstance = { ...songToAdd, id: Math.random().toString(36).substr(2, 9) };
            setSongs([...songs, setlistInstance]);
            setSelectedLibrarySongId('');
        }
    };

    const handleCreateSong = (e: React.FormEvent) => {
        e.preventDefault();
        if(newSong.title && newSong.duration) {
            const songToSave = { ...newSong, id: Math.random().toString(36).substr(2, 9) };
            addMasterSong(songToSave);
            setIsCreatingSong(false);
            setNewSong({ id: '', title: '', duration: '', bpm: 120, key: '' });
        }
    };

    const handleSaveSetlist = () => {
        if (!currentTour) return;
        
        const targetDateId = scope === 'MASTER' ? undefined : scope;
        
        // Find if we're overwriting or creating
        const existingSetlist = setlists.find(s => s.tourId === currentTour.id && s.dateId === targetDateId);
        const setIdToUse = existingSetlist ? existingSetlist.id : Math.random().toString(36).substr(2, 9);

        const newSetlist: Setlist = {
            id: setIdToUse,
            tourId: currentTour.id,
            dateId: targetDateId,
            songs: songs
        };

        saveSetlist(newSetlist);

        if (targetDateId) {
            updateTourDate(targetDateId, { setlistId: newSetlist.id });
        }

        alert(`Saved ${scope === 'MASTER' ? 'Master Setlist' : `Show Setlist for ${activeDate?.city}`}.`);
    };

    const handleResetToMaster = () => {
        if (scope === 'MASTER') return;
        if (window.confirm("Overwrite this show's setlist with the Master template?")) {
            const master = setlists.find(s => s.tourId === currentTour?.id && !s.dateId);
            setSongs(master ? [...master.songs] : []);
        }
    };

    const handleOptimize = async () => {
        if (songs.length < 2) return;
        setIsOptimizing(true);
        setAiSuggestion(null);

        const prompt = `Given these songs: ${songs.map(s => `${s.title} (${s.bpm} BPM, ${s.key})`).join(', ')}. 
        Optimize the setlist order for a high-energy performance with a smooth emotional curve. 
        Explain the flow logic briefly.`;

        try {
            const result = await generateText(prompt, 'gemini-3-pro-preview');
            setAiSuggestion(result);
        } catch (e) {
            setAiSuggestion("AI optimization temporarily unavailable.");
        } finally {
            setIsOptimizing(false);
        }
    };

    const totalDurationSec = songs.reduce((acc, s) => {
        const parts = s.duration.split(':').map(Number);
        return acc + (parts[0] * 60) + (parts[1] || 0);
    }, 0);
    
    const formatDuration = (totalSec: number) => {
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-6 h-full overflow-y-auto p-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-white">Setlist Manager</h1>
                        <div className="flex items-center gap-2 bg-maestro-accent/10 border border-maestro-accent/20 px-3 py-1 rounded-full">
                            <Clock className="w-3.5 h-3.5 text-maestro-accent" />
                            <span className="text-xs font-bold text-maestro-accent">{formatDuration(totalDurationSec)} Performance</span>
                        </div>
                    </div>
                    <p className="text-slate-400 mt-1">
                        {scope === 'MASTER' ? 'Managing Global Tour Template' : `Modifying Setlist for ${activeDate?.city} (${activeDate?.date})`}
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                    <div className="bg-maestro-800 p-1 rounded-xl border border-maestro-700 flex items-center gap-2 pr-4">
                        <div className="p-2 bg-maestro-900 rounded-lg"><Calendar className="w-4 h-4 text-maestro-accent" /></div>
                        <select 
                            value={scope} 
                            onChange={(e) => handleScopeChange(e.target.value)}
                            className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer pr-2 min-w-[150px]"
                        >
                            <option value="MASTER">Global Master Template</option>
                            {currentDates.map(d => (
                                <option key={d.id} value={d.id}>{d.date} - {d.city}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={handleSaveSetlist} className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2">
                        <Save className="w-4 h-4" /> Save {scope === 'MASTER' ? 'Master' : 'Show Set'}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Editor */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-maestro-800 p-6 rounded-2xl border border-maestro-700 space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Setlist - {songs.length} Songs</h3>
                            {scope !== 'MASTER' && (
                                <button onClick={handleResetToMaster} className="text-[10px] font-bold text-maestro-gold uppercase tracking-widest flex items-center gap-2 hover:underline">
                                    <RefreshCw className="w-3 h-3" /> Reset to Master
                                </button>
                            )}
                        </div>
                        
                        <div className="space-y-3">
                            {songs.length === 0 ? (
                                <div className="py-20 text-center border-2 border-dashed border-maestro-700 rounded-2xl text-slate-500">
                                    Setlist is currently empty.
                                </div>
                            ) : songs.map((song, idx) => (
                                <div key={song.id} className="bg-maestro-900 border border-maestro-700 p-4 rounded-xl flex items-center gap-4 hover:border-maestro-accent/50 transition-all group">
                                    <div className="w-8 font-mono text-slate-600 font-bold">{idx + 1}</div>
                                    <div className="flex-1">
                                        <div className="font-bold text-white">{song.title}</div>
                                        <div className="flex gap-4 text-[10px] font-bold text-slate-500 uppercase mt-1">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {song.duration}</span>
                                            <span className="flex items-center gap-1"><Music2 className="w-3 h-3" /> {song.bpm} BPM</span>
                                            <span className="text-maestro-accent">{song.key}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => moveSong(idx, 'up')} className="p-2 hover:bg-maestro-800 rounded text-slate-400 hover:text-white"><ArrowUp className="w-4 h-4" /></button>
                                        <button onClick={() => moveSong(idx, 'down')} className="p-2 hover:bg-maestro-800 rounded text-slate-400 hover:text-white"><ArrowDown className="w-4 h-4" /></button>
                                        <button onClick={() => removeSong(idx)} className="p-2 hover:bg-maestro-800 rounded text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Library & AI Panel */}
                <div className="space-y-6">
                    <div className="bg-maestro-800 p-6 rounded-2xl border border-maestro-700">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><ListMusic className="w-5 h-5 text-maestro-accent" /> Song Library</h3>
                        <div className="space-y-4">
                            <select 
                                value={selectedLibrarySongId}
                                onChange={(e) => setSelectedLibrarySongId(e.target.value)}
                                className="w-full bg-maestro-900 border border-maestro-700 rounded-xl p-3 text-white text-sm outline-none"
                            >
                                <option value="">Select from library...</option>
                                {masterSongs.map(s => <option key={s.id} value={s.id}>{s.title} ({s.bpm} BPM)</option>)}
                            </select>
                            <button 
                                onClick={handleAddFromLibrary}
                                disabled={!selectedLibrarySongId}
                                className="w-full bg-maestro-700 hover:bg-maestro-600 text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                            >
                                Add to Active Set
                            </button>
                            <div className="pt-4 border-t border-maestro-700">
                                <button onClick={() => setIsCreatingSong(true)} className="w-full border border-maestro-700 hover:bg-white/5 text-slate-400 py-2 rounded-lg text-xs font-bold">
                                    + Create New Song Entry
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-maestro-800 p-6 rounded-2xl border border-maestro-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-maestro-gold font-bold flex items-center gap-2"><Sparkles className="w-5 h-5" /> Gemini Optimizer</h3>
                            <button 
                                onClick={handleOptimize} 
                                disabled={isOptimizing || songs.length < 2}
                                className="text-xs bg-maestro-gold/10 text-maestro-gold px-3 py-1 rounded-full font-bold border border-maestro-gold/20 hover:bg-maestro-gold/20 transition-all"
                            >
                                Run
                            </button>
                        </div>
                        {isOptimizing ? (
                            <div className="text-center py-10">
                                <Loader2 className="w-10 h-10 animate-spin mx-auto text-maestro-gold mb-2" />
                                <p className="text-xs text-slate-400">Balancing BPM and Energy arcs...</p>
                            </div>
                        ) : aiSuggestion ? (
                            <div className="prose prose-invert prose-xs text-slate-300 whitespace-pre-wrap text-[11px] leading-relaxed">
                                {aiSuggestion}
                            </div>
                        ) : (
                            <p className="text-[11px] text-slate-500 italic text-center py-6">Add songs to your list, then use Gemini to optimize the show arc based on BPM and performance energy.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Song Modal */}
            {isCreatingSong && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-maestro-800 border border-maestro-accent/50 p-8 rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-white text-xl flex items-center gap-2"><Music2 className="text-maestro-accent" /> New Master Song</h3>
                            <button onClick={() => setIsCreatingSong(false)} className="text-slate-400 hover:text-white"><X /></button>
                        </div>
                        <form onSubmit={handleCreateSong} className="space-y-4">
                            <div><label className="text-xs font-bold text-slate-400 uppercase">Title</label><input required type="text" value={newSong.title} onChange={e => setNewSong({...newSong, title: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 p-3 rounded-xl text-white outline-none" placeholder="e.g. Moonlight Sonata" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-slate-400 uppercase">Duration</label><input required type="text" placeholder="MM:SS" value={newSong.duration} onChange={e => setNewSong({...newSong, duration: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 p-3 rounded-xl text-white outline-none" /></div>
                                <div><label className="text-xs font-bold text-slate-400 uppercase">Key</label><input type="text" placeholder="e.g. Am" value={newSong.key} onChange={e => setNewSong({...newSong, key: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 p-3 rounded-xl text-white outline-none" /></div>
                            </div>
                            <div><label className="text-xs font-bold text-slate-400 uppercase">BPM</label><input type="number" value={newSong.bpm} onChange={e => setNewSong({...newSong, bpm: parseInt(e.target.value) || 120})} className="w-full bg-maestro-900 border border-maestro-700 p-3 rounded-xl text-white outline-none" /></div>
                            <button type="submit" className="w-full bg-maestro-accent hover:bg-violet-600 text-white py-4 rounded-xl font-bold mt-4 shadow-lg">Save to Library</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};