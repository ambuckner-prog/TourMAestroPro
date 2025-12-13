
import React, { useState, useEffect } from 'react';
import { Song, Setlist } from '../types';
import { generateText } from '../services/geminiService';
import { Music2, ArrowUp, ArrowDown, Sparkles, Clock, ListMusic, Plus, Save, X, Trash2, Calendar, RefreshCw, Link as LinkIcon } from 'lucide-react';
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
            // 1. Priority: Check if the TourDate object explicitly links to a Setlist ID
            if (activeDate?.setlistId) {
                savedSetlist = setlists.find(s => s.id === activeDate.setlistId);
            }
            
            // 2. Fallback: Search for a setlist that references this dateId
            if (!savedSetlist) {
                savedSetlist = setlists.find(s => s.tourId === currentTour.id && s.dateId === targetDateId);
            }
        }

        if (savedSetlist) {
            setSongs(savedSetlist.songs);
        } else if (scope !== 'MASTER') {
            // If specific date setlist doesn't exist, clone Master setlist as template
            const master = setlists.find(s => s.tourId === currentTour.id && !s.dateId);
            setSongs(master ? [...master.songs] : []);
        } else {
            // Master setlist is empty if not found
            setSongs([]);
        }
    }, [scope, currentTour, setlists, activeDate]); // Added activeDate to dependencies to react to linkage changes

    // UI States
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
    const [selectedLibrarySongId, setSelectedLibrarySongId] = useState<string>('');
    const [isCreatingSong, setIsCreatingSong] = useState(false);
    
    // New Song Form State
    const [newSong, setNewSong] = useState<Song>({ id: '', title: '', duration: '', bpm: 120, key: '' });

    // --- Actions ---

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
            // Generate a unique ID for the setlist instance of this song (so duplicates are allowed in setlist if needed)
            const setlistInstance = { ...songToAdd, id: Math.random().toString(36).substr(2, 9) };
            setSongs([...songs, setlistInstance]);
            setSelectedLibrarySongId(''); // Reset selection
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
        let setIdToUse = Math.random().toString(36).substr(2, 9);

        // Determine ID to use (Update existing vs Create new)
        if (targetDateId && activeDate?.setlistId) {
            // If the active date already has a linked setlist, force update that specific setlist
            setIdToUse = activeDate.setlistId;
        } else {
            // Otherwise try to find one by date reference
            const existingByDate = setlists.find(s => s.tourId === currentTour.id && s.dateId === targetDateId);
            if (existingByDate) setIdToUse = existingByDate.id;
        }

        const newSetlist: Setlist = {
            id: setIdToUse,
            tourId: currentTour.id,
            dateId: targetDateId,
            songs: songs
        };

        // 1. Save the Setlist object
        saveSetlist(newSetlist);

        // 2. IMPORTANT: Update the TourDate object to explicitly link to this setlist ID
        if (targetDateId) {
            updateTourDate(targetDateId, { setlistId: newSetlist.id });
        }

        alert(`Successfully saved ${scope === 'MASTER' ? 'Master Setlist' : `${activeDate?.city} Setlist`} and linked to itinerary.`);
    };

    const handleResetToMaster = () => {
        if (scope === 'MASTER') return;
        if (window.confirm("Replace this show's setlist with the Master Setlist? Current changes to this date will be lost.")) {
            const master = setlists.find(s => s.tourId === currentTour?.id && !s.dateId);
            setSongs(master ? [...master.songs] : []);
        }
    };

    const handleOptimize = async () => {
        setIsOptimizing(true);
        setAiSuggestion(null);

        const prompt = `Given these songs: ${songs.map(s => `${s.title} (${s.bpm} BPM, ${s.key})`).join(', ')}. 
        Suggest an optimized setlist order to create a strong emotional arc, starting high energy, dipping in the middle, and ending with a banger. 
        Return the list as numbered items with a brief reason for the placement.`;

        const result = await generateText(prompt, 'gemini-3-pro-preview');
        setAiSuggestion(result);
        setIsOptimizing(false);
    };

    const totalDuration = songs.reduce((acc, s) => {
        const [m, sec] = s.duration.split(':').map(Number);
        return acc + m * 60 + sec;
    }, 0);
    
    const formatTotal = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        return `${h > 0 ? h + 'h ' : ''}${m}m`;
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        Setlist Manager
                        {scope !== 'MASTER' && (
                            <span className="text-sm bg-maestro-accent px-2 py-1 rounded text-white font-normal uppercase tracking-wider flex items-center gap-1">
                                {activeDate?.city}
                                {activeDate?.setlistId && (
                                    <span title="Linked to Date" className="flex items-center">
                                        <LinkIcon className="w-3 h-3 text-white/70" />
                                    </span>
                                )}
                            </span>
                        )}
                    </h1>
                    <p className="text-slate-400">Total Duration: {formatTotal(totalDuration)} • {songs.length} Songs</p>
                </div>
                
                {/* Context Selector */}
                <div className="flex items-center gap-2 bg-maestro-800 p-2 rounded-lg border border-maestro-700">
                    <Calendar className="w-5 h-5 text-maestro-accent ml-2" />
                    <select 
                        value={scope} 
                        onChange={(e) => handleScopeChange(e.target.value)}
                        className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer pr-4"
                    >
                        <option value="MASTER" className="bg-maestro-800">Master Setlist (Default)</option>
                        {currentDates.map(d => (
                            <option key={d.id} value={d.id} className="bg-maestro-800">
                                {d.date} - {d.city}
                            </option>
                        ))}
                    </select>
                </div>
            </header>

            {/* --- CONTROLS: LIBRARY & CREATE --- */}
            <div className="bg-maestro-800 p-4 rounded-xl border border-maestro-700 flex flex-col md:flex-row gap-4 items-end md:items-center">
                
                {/* Add From Library */}
                <div className="flex-1 w-full space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Add from Master Song Library</label>
                    <div className="flex gap-2">
                        <select 
                            value={selectedLibrarySongId}
                            onChange={(e) => setSelectedLibrarySongId(e.target.value)}
                            className="flex-1 bg-maestro-900 border border-maestro-700 text-white rounded p-2 text-sm outline-none focus:border-maestro-accent"
                        >
                            <option value="">-- Select a Song --</option>
                            {masterSongs.map(s => (
                                <option key={s.id} value={s.id}>{s.title} ({s.bpm} BPM, {s.key})</option>
                            ))}
                        </select>
                        <button 
                            onClick={handleAddFromLibrary}
                            disabled={!selectedLibrarySongId}
                            className="bg-maestro-700 hover:bg-maestro-600 text-white px-4 py-2 rounded font-bold text-sm disabled:opacity-50"
                        >
                            Add
                        </button>
                    </div>
                </div>

                {/* Create New Song Toggle */}
                <div className="flex gap-2">
                    {scope !== 'MASTER' && (
                        <button 
                            onClick={handleResetToMaster}
                            className="bg-maestro-900 border border-maestro-700 hover:border-red-500 text-slate-400 hover:text-red-400 px-3 py-2.5 rounded font-bold text-sm flex items-center justify-center gap-2"
                            title="Reset to Master Template"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    )}
                    <button 
                        onClick={() => setIsCreatingSong(true)}
                        className="bg-maestro-900 border border-maestro-700 hover:border-maestro-accent text-slate-300 px-4 py-2.5 rounded font-bold text-sm flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> New Song
                    </button>
                    <button 
                        onClick={handleSaveSetlist}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Save className="w-4 h-4" /> 
                        {scope === 'MASTER' ? 'Save Master' : `Save for ${activeDate?.city}`}
                    </button>
                </div>
            </div>

            {/* --- CREATE SONG FORM (Modal-ish inline) --- */}
            {isCreatingSong && (
                <div className="bg-maestro-800 border border-maestro-accent/50 p-6 rounded-xl animate-fadeIn shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-white flex items-center gap-2"><Music2 className="w-5 h-5 text-maestro-accent" /> New Master Song</h3>
                        <button onClick={() => setIsCreatingSong(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
                    </div>
                    <form onSubmit={handleCreateSong} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Song Title</label>
                            <input 
                                autoFocus
                                required
                                type="text" 
                                value={newSong.title}
                                onChange={(e) => setNewSong({...newSong, title: e.target.value})}
                                placeholder="e.g. Bohemian Rhapsody"
                                className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-2 text-white focus:ring-1 focus:ring-maestro-accent outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Duration (MM:SS)</label>
                            <input 
                                required
                                type="text" 
                                pattern="[0-9]+:[0-9]{2}"
                                title="Format: MM:SS (e.g. 3:45)"
                                value={newSong.duration}
                                onChange={(e) => setNewSong({...newSong, duration: e.target.value})}
                                placeholder="3:45"
                                className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-2 text-white focus:ring-1 focus:ring-maestro-accent outline-none"
                            />
                        </div>
                         <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Key</label>
                            <input 
                                type="text" 
                                value={newSong.key}
                                onChange={(e) => setNewSong({...newSong, key: e.target.value})}
                                placeholder="C Maj"
                                className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-2 text-white focus:ring-1 focus:ring-maestro-accent outline-none"
                            />
                        </div>
                         <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">BPM</label>
                            <input 
                                type="number" 
                                value={newSong.bpm}
                                onChange={(e) => setNewSong({...newSong, bpm: parseInt(e.target.value) || 0})}
                                className="w-full mt-1 bg-maestro-900 border border-maestro-700 rounded p-2 text-white focus:ring-1 focus:ring-maestro-accent outline-none"
                            />
                        </div>
                        <div className="md:col-span-4 flex justify-end gap-2 mt-2">
                            <button type="button" onClick={() => setIsCreatingSong(false)} className="text-slate-400 hover:text-white px-4 py-2 text-sm font-bold">Cancel</button>
                            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold flex items-center gap-2"><Save className="w-4 h-4" /> Save to Library</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Drag Drop List (Simulated) */}
                <div className="space-y-3">
                    {songs.length === 0 && (
                        <div className="text-center py-10 border-2 border-dashed border-maestro-700 rounded-xl text-slate-500">
                            Setlist is empty. Add songs from the library above.
                        </div>
                    )}
                    {songs.map((song, idx) => (
                        <div 
                            key={song.id} 
                            tabIndex={0}
                            className="bg-maestro-800 p-4 rounded-xl border border-maestro-700 flex items-center gap-4 group hover:border-maestro-accent transition-colors relative focus:outline-none focus:ring-2 focus:ring-maestro-accent"
                        >
                            <div className="text-slate-500 font-mono w-6 text-center">{idx + 1}</div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white">{song.title}</h3>
                                <div className="text-xs text-slate-400 flex gap-3 mt-1">
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {song.duration}</span>
                                    <span className="flex items-center gap-1"><Music2 className="w-3 h-3" /> {song.bpm} BPM</span>
                                    <span className="bg-maestro-900 px-1 rounded border border-maestro-700">{song.key}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                <div className="flex flex-col gap-1 mr-2">
                                    <button onClick={() => moveSong(idx, 'up')} className="hover:text-white p-1" title="Move Up"><ArrowUp className="w-4 h-4" /></button>
                                    <button onClick={() => moveSong(idx, 'down')} className="hover:text-white p-1" title="Move Down"><ArrowDown className="w-4 h-4" /></button>
                                </div>
                                <button onClick={() => removeSong(idx)} className="text-slate-500 hover:text-red-500 p-2" title="Remove from Setlist">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* AI Suggestions */}
                <div className="bg-maestro-800 rounded-xl border border-maestro-700 p-6 h-fit sticky top-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-maestro-gold">
                            <ListMusic className="w-5 h-5" />
                            <h3 className="font-bold">Gemini Flow</h3>
                        </div>
                        <button 
                            onClick={handleOptimize}
                            disabled={isOptimizing || songs.length === 0}
                            className="bg-maestro-700 hover:bg-maestro-600 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
                        >
                            {isOptimizing ? <Sparkles className="animate-spin w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                            AI Optimize
                        </button>
                    </div>
                    {aiSuggestion ? (
                        <div className="prose prose-invert prose-sm max-w-none">
                            <p className="whitespace-pre-wrap">{aiSuggestion}</p>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>Build your list, then click "AI Optimize" to get professional ordering suggestions based on BPM and Key.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
