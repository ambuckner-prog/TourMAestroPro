
import React, { useEffect, useState, useRef } from 'react';
import { generateFastSummary } from '../services/geminiService';
import { Activity, Calendar, Users, DollarSign, ArrowRight, Plus, MapPin, Building, Hash, MessageSquare, Paperclip, FileText, X, Mail, Phone, Lock, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TourDate, Note, UserRole } from '../types';

export const Dashboard: React.FC = () => {
  const { currentTour, currentUser, tourDates, addTourDate, setSelectedDateId, notes, addNote, deleteNote } = useApp();
  const [summary, setSummary] = useState<string>("Generating daily briefing...");
  
  // Quick Add Logistics State
  const [newDate, setNewDate] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newVenue, setNewVenue] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newConfirmation, setNewConfirmation] = useState('');

  // Notes Form State
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<'Email'|'Call'|'Meeting'|'General'>('General');
  const [noteFiles, setNoteFiles] = useState<string[]>([]);
  const [noteVisibility, setNoteVisibility] = useState<'Public'|'StaffOnly'>('Public');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter Data for Current Tour
  const currentTourDates = tourDates.filter(d => d.tourId === currentTour?.id);
  
  // Note Filtering: Crew only sees Public notes
  const currentTourNotes = notes
    .filter(n => n.tourId === currentTour?.id)
    .filter(n => {
        if (!n.visibility || n.visibility === 'Public') return true;
        // If StaffOnly, only non-CREW can see it
        return currentUser?.role !== UserRole.CREW;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Check if current user is staff (can see/create private notes)
  const isStaff = currentUser?.role !== UserRole.CREW;
  const canEdit = currentUser?.role !== UserRole.CREW;

  useEffect(() => {
    if(currentTour) {
        const prompt = `Generate a concise, high-energy executive summary for tour manager of '${currentTour.name}'. Status: on track. Keep it under 50 words.`;
        generateFastSummary(prompt).then(setSummary);
    }
  }, [currentTour]);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if(newDate && newCity && newVenue && currentTour) {
        const newItem: TourDate = {
            id: Math.random().toString(36).substr(2, 9),
            tourId: currentTour.id,
            date: newDate,
            city: newCity,
            venue: newVenue,
            address: newAddress,
            confirmationNumber: newConfirmation,
            status: 'Pending',
            capacity: 0
        };
        addTourDate(newItem);
        setNewDate('');
        setNewCity('');
        setNewVenue('');
        setNewAddress('');
        setNewConfirmation('');
        alert("Date Added! Check the Schedule tab.");
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
      e.preventDefault();
      if(!noteContent || !currentTour || !currentUser) return;

      const newNote: Note = {
          id: Math.random().toString(36).substr(2, 9),
          tourId: currentTour.id,
          content: noteContent,
          type: noteType,
          authorName: currentUser.name,
          date: new Date().toISOString(),
          attachments: noteFiles,
          visibility: noteVisibility
      };

      addNote(newNote);
      setNoteContent('');
      setNoteFiles([]);
      setNoteType('General');
      setNoteVisibility('Public'); // Reset to public default
  };
  
  const handleDeleteNote = (id: string) => {
      if(window.confirm("Delete this note?")) deleteNote(id);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const fileNames = Array.from(e.target.files).map(f => f.name);
          setNoteFiles([...noteFiles, ...fileNames]);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatNoteDate = (isoString: string) => {
      const d = new Date(isoString);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getNoteIcon = (type: string) => {
      switch(type) {
          case 'Email': return <Mail className="w-3 h-3 text-blue-400" />;
          case 'Call': return <Phone className="w-3 h-3 text-green-400" />;
          case 'Meeting': return <Users className="w-3 h-3 text-purple-400" />;
          default: return <MessageSquare className="w-3 h-3 text-slate-400" />;
      }
  };

  const stats = [
    { label: "Ticket Sales", value: "94%", icon: Activity, color: "text-green-400" },
    { label: "Upcoming Shows", value: currentTourDates.length.toString(), icon: Calendar, color: "text-blue-400" },
    { label: "Guest List", value: "14/50", icon: Users, color: "text-purple-400" },
    { label: "Budget Used", value: "42%", icon: DollarSign, color: "text-maestro-gold" },
  ];

  return (
    <div className="h-full flex flex-col xl:flex-row overflow-hidden">
      
      {/* LEFT CONTENT AREA (Stats, Summary, Schedule) */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col space-y-8">
          <header>
            <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-slate-400 text-lg">Welcome back. Managing <span className="text-white font-bold">{currentTour?.name}</span></p>
          </header>

          {/* AI Summary Card */}
          <div className="bg-gradient-to-r from-maestro-800 to-maestro-700 p-8 rounded-2xl border border-maestro-700 shadow-xl relative overflow-hidden flex-shrink-0">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Activity className="w-48 h-48 text-white" />
            </div>
            <div className="relative z-10">
                <div className="flex items-center space-x-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <h3 className="text-sm font-semibold text-maestro-gold uppercase tracking-wider">Flash Briefing</h3>
                </div>
                <p className="text-xl text-slate-200 leading-relaxed font-light">
                {summary}
                </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-shrink-0">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-maestro-800 p-6 rounded-xl border border-maestro-700 hover:border-maestro-accent transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-lg bg-opacity-10 bg-white ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium text-slate-500 bg-maestro-900 px-2 py-1 rounded">+2.5%</span>
                </div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-6">
              {/* Quick Add Form */}
              <div className="xl:col-span-1 bg-maestro-800 p-8 rounded-xl border border-maestro-700 h-fit">
                 <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg">
                    <Plus className="w-5 h-5 text-maestro-accent" /> Quick Add Logistics
                 </h3>
                 <form onSubmit={handleQuickAdd} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-400 uppercase font-bold">Date</label>
                            <input type="date" required value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 text-white text-sm focus:ring-1 focus:ring-maestro-accent outline-none" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 uppercase font-bold">City</label>
                            <input type="text" required placeholder="City, State" value={newCity} onChange={e => setNewCity(e.target.value)} className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 text-white text-sm focus:ring-1 focus:ring-maestro-accent outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-bold">Venue</label>
                        <input type="text" required placeholder="Venue Name" value={newVenue} onChange={e => setNewVenue(e.target.value)} className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 text-white text-sm focus:ring-1 focus:ring-maestro-accent outline-none" />
                    </div>
                    
                    {/* NEW FIELDS */}
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-bold">Address</label>
                        <input type="text" placeholder="Full Street Address" value={newAddress} onChange={e => setNewAddress(e.target.value)} className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 text-white text-sm focus:ring-1 focus:ring-maestro-accent outline-none" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-bold">Confirmation #</label>
                        <input type="text" placeholder="Booking Ref / HTML Conf" value={newConfirmation} onChange={e => setNewConfirmation(e.target.value)} className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 text-white text-sm focus:ring-1 focus:ring-maestro-accent outline-none" />
                    </div>

                    <button type="submit" className="w-full bg-white text-maestro-900 hover:bg-slate-200 font-bold py-3 rounded transition-colors text-sm">Add to Schedule</button>
                 </form>
              </div>

              {/* Upcoming Logistics List */}
              <div className="xl:col-span-2 bg-maestro-800 p-8 rounded-xl border border-maestro-700 h-fit">
                  <h3 className="font-bold text-white mb-6 text-lg">Upcoming Schedule</h3>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {currentTourDates.length === 0 ? (
                          <div className="text-slate-500 text-sm italic py-8 text-center bg-maestro-900/50 rounded-lg">No dates added yet. Use the form to start routing.</div>
                      ) : (
                          currentTourDates.slice(0, 8).map(date => (
                            <div 
                                key={date.id} 
                                onClick={() => setSelectedDateId(date.id)}
                                className="flex items-center justify-between p-4 bg-maestro-900 rounded-lg hover:bg-maestro-700 cursor-pointer border border-transparent hover:border-maestro-accent transition-all group"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="text-center bg-maestro-800 p-3 rounded-lg w-16 group-hover:bg-maestro-600 transition-colors">
                                        <div className="text-xs text-slate-500 uppercase font-bold">{date.date.split('-')[1]}/{date.date.split('-')[2]}</div>
                                        <div className="font-bold text-white text-xl">{date.date.split('-')[0].slice(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-white font-bold text-lg flex items-center gap-2">
                                            {date.city}
                                        </div>
                                        <div className="text-sm text-slate-400 flex items-center gap-2">
                                            <Building className="w-4 h-4" /> {date.venue}
                                        </div>
                                        {date.address && (
                                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                                <MapPin className="w-3 h-3" /> {date.address}
                                            </div>
                                        )}
                                        {date.confirmationNumber && (
                                            <div className="text-xs text-maestro-gold flex items-center gap-1 mt-1 font-mono">
                                                <Hash className="w-3 h-3" /> Conf: {date.confirmationNumber}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                            </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      </div>

      {/* RIGHT COLUMN: NOTES SIDEBAR */}
      <div className="w-full xl:w-96 bg-maestro-800 border-l border-maestro-700 flex flex-col h-full z-10 shadow-xl flex-shrink-0">
         <div className="p-4 border-b border-maestro-700 bg-maestro-900 flex justify-between items-center h-16 shrink-0">
             <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-maestro-gold" /> Tour Notes
                </h3>
                <p className="text-[10px] text-slate-400">Logbook & Updates</p>
             </div>
        </div>

        {/* Note Input */}
        <div className="p-4 border-b border-maestro-700 bg-maestro-800 shrink-0">
            <form onSubmit={handleAddNote}>
                <textarea 
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Log a call, email, or note..." 
                    className="w-full bg-maestro-900 border border-maestro-700 rounded-lg p-3 text-sm text-white placeholder-slate-500 resize-none outline-none mb-3 focus:ring-1 focus:ring-maestro-accent"
                    rows={3}
                />
                {noteFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {noteFiles.map((file, i) => (
                            <span key={i} className="text-[10px] bg-maestro-800 px-2 py-1 rounded flex items-center gap-1 text-slate-300 border border-maestro-700">
                                <FileText className="w-3 h-3" /> {file}
                                <button type="button" onClick={() => setNoteFiles(noteFiles.filter((_, idx) => idx !== i))}><X className="w-3 h-3 hover:text-red-400" /></button>
                            </span>
                        ))}
                    </div>
                )}
                <div className="space-y-2">
                    {/* Staff Visibility Toggle */}
                    {isStaff && (
                        <div className="flex items-center gap-2">
                             <label className={`flex items-center gap-1 text-xs cursor-pointer select-none px-2 py-1 rounded border ${noteVisibility === 'StaffOnly' ? 'bg-red-900/30 border-red-500/50 text-red-300' : 'border-transparent text-slate-400'}`}>
                                <input 
                                    type="checkbox" 
                                    className="hidden"
                                    checked={noteVisibility === 'StaffOnly'}
                                    onChange={(e) => setNoteVisibility(e.target.checked ? 'StaffOnly' : 'Public')}
                                />
                                {noteVisibility === 'StaffOnly' ? <Lock className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                Staff Only (Private)
                             </label>
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                            <select 
                                value={noteType} 
                                onChange={(e) => setNoteType(e.target.value as any)}
                                className="bg-maestro-900 text-xs text-slate-300 p-1.5 rounded border border-maestro-700 outline-none"
                            >
                                <option value="General">General</option>
                                <option value="Call">Call</option>
                                <option value="Email">Email</option>
                                <option value="Meeting">Meeting</option>
                            </select>
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-maestro-900 border border-maestro-700 hover:bg-maestro-700 text-slate-300 p-1.5 rounded" title="Attach File">
                                <Paperclip className="w-4 h-4" />
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={handleFileChange}
                                multiple
                            />
                        </div>
                        <button type="submit" className="text-xs bg-maestro-accent hover:bg-violet-600 text-white px-4 py-2 rounded font-bold transition-colors">
                            Post
                        </button>
                    </div>
                </div>
            </form>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto space-y-3 p-4 custom-scrollbar bg-maestro-900/30">
            {currentTourNotes.length === 0 ? (
                <div className="text-center text-slate-500 text-sm mt-10">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No notes available.
                </div>
            ) : (
                currentTourNotes.map(note => (
                    <div key={note.id} className={`bg-maestro-800 p-3 rounded-lg border hover:border-maestro-600 transition-colors shadow-sm relative group ${note.visibility === 'StaffOnly' ? 'border-red-900/50 bg-red-900/10' : 'border-maestro-700'}`}>
                        {note.visibility === 'StaffOnly' && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-bold text-red-400 bg-red-900/30 px-1.5 py-0.5 rounded border border-red-500/20">
                                <Lock className="w-2.5 h-2.5" /> STAFF ONLY
                            </div>
                        )}
                        {canEdit && (
                            <button 
                                onClick={() => handleDeleteNote(note.id)} 
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-maestro-900 rounded text-slate-400 hover:text-red-500 transition-opacity"
                                title="Delete Note"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        )}
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                {getNoteIcon(note.type)}
                                <span className="text-[10px] font-bold text-slate-300 uppercase">{note.type}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono pr-16">
                                {formatNoteDate(note.date)}
                            </div>
                        </div>
                        <p className="text-sm text-slate-200 mb-2 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                        
                        {note.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2 mt-2">
                                {note.attachments.map((file, i) => (
                                    <div key={i} className="flex items-center gap-1 text-[10px] text-maestro-accent bg-maestro-900 px-2 py-1 rounded border border-maestro-700">
                                        <Paperclip className="w-3 h-3" /> {file}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div className="flex items-center justify-end gap-1 mt-1 pt-1">
                            <span className="text-[10px] text-slate-500 uppercase font-bold">By</span>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[8px] text-white">
                                    {note.authorName.charAt(0)}
                                </div>
                                {note.authorName}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};
