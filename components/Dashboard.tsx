
import React, { useEffect, useState, useRef } from 'react';
import { generateFastSummary } from '../services/geminiService';
import { Activity, Calendar, Users, PoundSterling, ArrowRight, Plus, MapPin, Building, Hash, MessageSquare, Paperclip, FileText, X, Mail, Phone, Lock, Eye, Trash2, Clock, List, Save, TrendingUp, Ticket, CheckSquare } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TourDate, Note, UserRole, View } from '../types';

interface DashboardProps {
    onNavigate?: (view: View) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { currentTour, updateTour, currentUser, tourDates, addTourDate, setSelectedDateId, notes, addNote, deleteNote, guestRequests, financeItems } = useApp();
  const [summary, setSummary] = useState<string>("Generating daily briefing...");
  
  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SCHEDULE' | 'SALES'>('OVERVIEW');

  // Quick Add Logistics State
  const [newDate, setNewDate] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newVenue, setNewVenue] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newConfirmation, setNewConfirmation] = useState('');

  // Budget Edit State
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(0);

  // Notes Form State
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<'Email'|'Call'|'Meeting'|'General'>('General');
  const [noteFiles, setNoteFiles] = useState<string[]>([]);
  const [noteVisibility, setNoteVisibility] = useState<'Public'|'StaffOnly'>('Public');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter Data for Current Tour
  const currentTourDates = tourDates.filter(d => d.tourId === currentTour?.id).sort((a,b) => a.date.localeCompare(b.date));
  
  // --- REAL-TIME CALCULATIONS ---
  
  // 1. Ticket Sales
  const totalCapacity = currentTourDates.reduce((acc, d) => acc + (d.capacity || 0), 0);
  const totalSold = currentTourDates.reduce((acc, d) => acc + (d.ticketsSold || 0), 0);
  const salesPercent = totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0;
  const totalGross = currentTourDates.reduce((acc, d) => acc + (d.grossRevenue || 0), 0);

  // 2. Guest List (Aggregate)
  const tourGuests = guestRequests.filter(req => req.tourId === currentTour?.id);
  const totalGuestCount = tourGuests.reduce((acc, req) => acc + req.quantity, 0);
  const approvedGuestCount = tourGuests.filter(req => req.status === 'Approved').reduce((acc, req) => acc + req.quantity, 0);

  // 3. Financials
  const totalExpenses = financeItems.filter(i => i.tourId === currentTour?.id && i.type === 'EXPENSE').reduce((acc, i) => acc + i.amount, 0);
  const budget = currentTour?.budget || 0;
  const budgetUsedPercent = budget > 0 ? Math.round((totalExpenses / budget) * 100) : 0;

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
        setTempBudget(currentTour.budget);
        const prompt = `Generate a concise, high-energy executive summary for tour manager of '${currentTour.name}'. Status: ${salesPercent}% sold out. Keep it under 50 words.`;
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
            capacity: 0,
            schedule: []
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

  const handleUpdateBudget = () => {
      if (currentTour) {
          updateTour(currentTour.id, { budget: tempBudget });
          setIsEditingBudget(false);
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

  const navigateToDaySheet = (dateId: string) => {
      setSelectedDateId(dateId);
      if (onNavigate) onNavigate(View.SCHEDULE);
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
    { label: "Ticket Sales", value: `${salesPercent}%`, sub: `${totalSold.toLocaleString()} / ${totalCapacity.toLocaleString()}`, icon: Ticket, color: "text-green-400" },
    { label: "Upcoming Shows", value: currentTourDates.length.toString(), sub: "Active Routing", icon: Calendar, color: "text-blue-400" },
    { label: "Total Guest List", value: totalGuestCount.toString(), sub: `${approvedGuestCount} Approved`, icon: Users, color: "text-purple-400" },
    { label: "Budget Used", value: `${budgetUsedPercent}%`, sub: `£${totalExpenses.toLocaleString()} Spent`, icon: PoundSterling, color: "text-maestro-gold" },
  ];

  return (
    <div className="h-full flex flex-col xl:flex-row overflow-hidden">
      
      {/* LEFT CONTENT AREA (Stats, Summary, Schedule) */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col space-y-8">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
                <p className="text-slate-400 text-lg">Welcome back. Managing <span className="text-white font-bold">{currentTour?.name}</span></p>
            </div>
            
            {/* Dashboard Navigation Tabs */}
            <div className="flex bg-maestro-800 p-1 rounded-lg border border-maestro-700">
                <button 
                    onClick={() => setActiveTab('OVERVIEW')} 
                    className={`px-4 py-2 rounded-md font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'OVERVIEW' ? 'bg-maestro-700 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    <Activity className="w-4 h-4" /> Overview
                </button>
                <button 
                    onClick={() => setActiveTab('SALES')} 
                    className={`px-4 py-2 rounded-md font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'SALES' ? 'bg-maestro-700 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    <TrendingUp className="w-4 h-4" /> Sales
                </button>
                <button 
                    onClick={() => setActiveTab('SCHEDULE')} 
                    className={`px-4 py-2 rounded-md font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'SCHEDULE' ? 'bg-maestro-700 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    <Clock className="w-4 h-4" /> Schedule
                </button>
            </div>
          </header>

          {activeTab === 'OVERVIEW' ? (
              <>
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

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-shrink-0">
                    {stats.map((stat, idx) => (
                    <div key={idx} className="bg-maestro-800 p-6 rounded-xl border border-maestro-700 hover:border-maestro-accent transition-colors">
                        <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-lg bg-opacity-10 bg-white ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        </div>
                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">{stat.label}</div>
                        <div className="text-xs text-slate-400">{stat.sub}</div>
                    </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-6">
                    {/* Budget Management */}
                    <div className="xl:col-span-1 bg-maestro-800 p-8 rounded-xl border border-maestro-700 h-fit">
                        <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg">
                            <PoundSterling className="w-5 h-5 text-maestro-gold" /> Budget Controller
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm text-slate-400 mb-2">
                                <span>Total Budget</span>
                                {isEditingBudget ? (
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsEditingBudget(false)} className="text-red-400 hover:text-white"><X className="w-4 h-4"/></button>
                                        <button onClick={handleUpdateBudget} className="text-green-400 hover:text-white"><Save className="w-4 h-4"/></button>
                                    </div>
                                ) : (
                                    canEdit && <button onClick={() => setIsEditingBudget(true)} className="text-maestro-accent hover:text-white"><Activity className="w-4 h-4"/></button>
                                )}
                            </div>
                            
                            {isEditingBudget ? (
                                <input 
                                    type="number" 
                                    value={tempBudget} 
                                    onChange={(e) => setTempBudget(parseFloat(e.target.value))}
                                    className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-white text-2xl font-bold mb-4 outline-none focus:border-maestro-gold"
                                />
                            ) : (
                                <div className="text-3xl font-bold text-white mb-4">£{budget.toLocaleString()}</div>
                            )}

                            <div className="w-full bg-maestro-900 h-3 rounded-full overflow-hidden border border-maestro-700">
                                <div className={`h-full ${budgetUsedPercent > 90 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${budgetUsedPercent}%` }}></div>
                            </div>
                            <div className="flex justify-between text-xs font-bold uppercase text-slate-500">
                                <span>Spent: £{totalExpenses.toLocaleString()}</span>
                                <span>Rem: £{(budget - totalExpenses).toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-4 italic">
                                This budget reflects across all financial reporting. Update here to adjust the tour's total cap.
                            </p>
                        </div>
                    </div>

                    {/* Upcoming Logistics List */}
                    <div className="xl:col-span-2 bg-maestro-800 p-8 rounded-xl border border-maestro-700 h-fit">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-white text-lg">Upcoming Schedule</h3>
                            <button onClick={() => setActiveTab('SCHEDULE')} className="text-maestro-accent text-sm font-bold hover:underline">View All</button>
                        </div>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {currentTourDates.length === 0 ? (
                                <div className="text-slate-500 text-sm italic py-8 text-center bg-maestro-900/50 rounded-lg">No dates added yet. Use the Schedule tab to start routing.</div>
                            ) : (
                                currentTourDates.slice(0, 5).map(date => (
                                    <div 
                                        key={date.id} 
                                        onClick={() => navigateToDaySheet(date.id)}
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
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-slate-500 uppercase font-bold mb-1">Status</div>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${date.status === 'Confirmed' ? 'bg-green-900 text-green-400' : 'bg-yellow-900 text-yellow-400'}`}>{date.status}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
              </>
          ) : activeTab === 'SALES' ? (
              // SALES TAB
              <div className="bg-maestro-800 p-8 rounded-xl border border-maestro-700 min-h-[500px] animate-fadeIn">
                  <div className="flex justify-between items-center mb-6">
                      <div>
                          <h3 className="font-bold text-white text-2xl flex items-center gap-2"><TrendingUp className="w-6 h-6 text-green-400" /> Ticket Sales Breakdown</h3>
                          <p className="text-slate-400 text-sm mt-1">Total Gross Revenue: <span className="text-white font-bold">£{totalGross.toLocaleString()}</span></p>
                      </div>
                      <div className="text-right">
                          <div className="text-3xl font-bold text-white">{salesPercent}%</div>
                          <div className="text-xs text-slate-500 uppercase font-bold">Tour Sold</div>
                      </div>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-maestro-700">
                      <table className="w-full text-left">
                          <thead className="bg-maestro-900 text-slate-400 text-xs uppercase">
                              <tr>
                                  <th className="p-4 font-bold">Date</th>
                                  <th className="p-4 font-bold">City / Venue</th>
                                  <th className="p-4 font-bold text-right">Sold</th>
                                  <th className="p-4 font-bold text-right">Capacity</th>
                                  <th className="p-4 font-bold text-right">%</th>
                                  <th className="p-4 font-bold text-right">Gross</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-maestro-700 bg-maestro-800/50 text-sm text-slate-200">
                              {currentTourDates.map(date => {
                                  const sold = date.ticketsSold || 0;
                                  const cap = date.capacity || 0;
                                  const pct = cap > 0 ? Math.round((sold/cap)*100) : 0;
                                  
                                  return (
                                      <tr key={date.id} className="hover:bg-maestro-700 transition-colors">
                                          <td className="p-4 font-mono text-white">{date.date}</td>
                                          <td className="p-4">
                                              <div className="font-bold text-white">{date.city}</div>
                                              <div className="text-xs text-slate-400">{date.venue}</div>
                                          </td>
                                          <td className="p-4 text-right font-mono">{sold.toLocaleString()}</td>
                                          <td className="p-4 text-right font-mono">{cap.toLocaleString()}</td>
                                          <td className="p-4 text-right">
                                              <span className={`px-2 py-1 rounded text-xs font-bold ${pct >= 90 ? 'bg-green-900 text-green-400' : pct >= 70 ? 'bg-blue-900 text-blue-400' : 'bg-red-900 text-red-400'}`}>
                                                  {pct}%
                                              </span>
                                          </td>
                                          <td className="p-4 text-right font-mono text-white">£{(date.grossRevenue || 0).toLocaleString()}</td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>
              </div>
          ) : (
              // SCHEDULE TAB
              <div className="bg-maestro-800 p-8 rounded-xl border border-maestro-700 min-h-[500px] animate-fadeIn">
                  <div className="flex justify-between items-center mb-6">
                      <div>
                          <h3 className="font-bold text-white text-2xl flex items-center gap-2"><List className="w-6 h-6 text-maestro-accent" /> Master Tour Schedule</h3>
                          <p className="text-slate-400 text-sm mt-1">Select a date to manage the day sheet timeline, set times, and apply templates.</p>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => setActiveTab('OVERVIEW')} className="text-slate-400 hover:text-white px-4 py-2 text-sm">Back to Overview</button>
                      </div>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-maestro-700">
                      <table className="w-full text-left">
                          <thead className="bg-maestro-900 text-slate-400 text-xs uppercase">
                              <tr>
                                  <th className="p-4 font-bold">Date</th>
                                  <th className="p-4 font-bold">City</th>
                                  <th className="p-4 font-bold">Venue</th>
                                  <th className="p-4 font-bold">Schedule Items</th>
                                  <th className="p-4 text-right">Action</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-maestro-700 bg-maestro-800/50 text-sm text-slate-200">
                              {currentTourDates.map(date => {
                                  const itemCount = date.schedule ? date.schedule.length : 0;
                                  return (
                                      <tr key={date.id} onClick={() => navigateToDaySheet(date.id)} className="hover:bg-maestro-700 cursor-pointer transition-colors group">
                                          <td className="p-4 font-mono text-white">{date.date}</td>
                                          <td className="p-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-500" /> {date.city}</td>
                                          <td className="p-4">{date.venue}</td>
                                          <td className="p-4">
                                              {itemCount > 0 ? (
                                                  <span className="bg-maestro-900 px-2 py-1 rounded text-xs border border-maestro-700">{itemCount} items</span>
                                              ) : (
                                                  <span className="text-slate-500 text-xs italic">Empty</span>
                                              )}
                                          </td>
                                          <td className="p-4 text-right">
                                              <button className="bg-maestro-accent hover:bg-violet-600 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 ml-auto">
                                                  <CheckSquare className="w-3 h-3" /> View Day Sheet
                                              </button>
                                          </td>
                                      </tr>
                                  );
                              })}
                              {currentTourDates.length === 0 && (
                                  <tr>
                                      <td colSpan={5} className="p-8 text-center text-slate-500">No dates found.</td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}
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
