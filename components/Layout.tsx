
import React, { useState, useRef } from 'react';
import { View, UserRole, Note } from '../types';
import { useApp } from '../contexts/AppContext';
import { 
  LayoutDashboard, Map, Calendar, CheckSquare, Send, Users, 
  Music2, DollarSign, Paperclip, Globe, Video, Mic2, Menu, X, 
  CalendarDays, ChevronDown, PlusCircle, LogOut, ArrowRight, Mic, 
  Settings, Check
} from 'lucide-react';

interface LayoutProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, setCurrentView, children }) => {
  const { currentUser, currentTour, tours, logout, selectTour, createTour } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isTourDropdownOpen, setIsTourDropdownOpen] = React.useState(false);
  
  // Creation Form State
  const [newTourName, setNewTourName] = useState('');
  const [newArtistName, setNewArtistName] = useState('');

  // Filter Nav Items based on Role if needed
  const navItems = [
    { id: View.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: View.EVENTS, label: 'Events', icon: Calendar },
    { id: View.HOTELS, label: 'Hotels', icon: CalendarDays },
    { id: View.TRAVEL, label: 'Travel', icon: Map },
    { id: View.SCHEDULE, label: 'Day Sheet', icon: CheckSquare }, 
    { id: View.TASKS, label: 'Tasks', icon: CheckSquare },
    { id: View.ADVANCE, label: 'Advance', icon: Send },
    { id: View.GUEST_LIST, label: 'Guest List', icon: Users },
    { id: View.SETLIST, label: 'Set List', icon: Music2 },
    { id: View.ACCOUNTING, label: 'Accounting', icon: DollarSign },
    { id: View.ATTACHMENTS, label: 'Attachments', icon: Paperclip },
  ];

  const aiTools = [
    { id: View.VENUE_INTEL, label: 'Venue Intel', icon: Globe },
    { id: View.CREATIVE_STUDIO, label: 'Creative Studio', icon: Video },
    { id: View.ROAD_MANAGER, label: 'Road Manager', icon: Mic2 },
  ];

  const handleCreateTour = (e: React.FormEvent) => {
    e.preventDefault();
    if(newTourName && newArtistName) {
        createTour(newTourName, newArtistName);
        // Reset and close dropdown explicitly if open
        setNewTourName('');
        setNewArtistName('');
        setIsTourDropdownOpen(false);
        // Force view to Settings (Back Office) to configure the new tour immediately
        setCurrentView(View.SETTINGS); 
    }
  };

  // Filter available tours for the dropdown
  const availableTours = tours.filter(t => 
      currentUser?.role === UserRole.MASTER_ADMIN || 
      currentUser?.role === UserRole.SUPPORT_STAFF ||
      currentUser?.assignedTourIds.includes(t.id)
  );

  return (
    <div className="flex h-screen bg-maestro-900 text-slate-100 overflow-hidden font-sans">
      
      {/* --- LEFT SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-60 border-r border-maestro-700 bg-maestro-900 flex-shrink-0 z-20">
        
        {/* App Brand / Tour Selector */}
        <div className="h-16 flex items-center px-4 border-b border-maestro-700 bg-maestro-800 relative select-none">
          <div 
             className="flex items-center gap-2 cursor-pointer w-full hover:bg-white/5 p-1 rounded transition-colors"
             onClick={() => setIsTourDropdownOpen(!isTourDropdownOpen)}
          >
             <div className="bg-red-600 text-white p-1 rounded font-bold text-xs">TM</div>
             <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-xs truncate uppercase tracking-wider">
                    {currentTour ? currentTour.name : 'Select Tour'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                    {currentTour ? currentTour.artist : 'No Tour Active'}
                </div>
             </div>
             <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isTourDropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* Tour Dropdown */}
          {isTourDropdownOpen && (
              <div className="absolute top-16 left-0 w-64 bg-maestro-800 border-r border-b border-maestro-700 shadow-2xl z-50 animate-fadeIn">
                  <div className="p-2 space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                      {availableTours.length > 0 ? availableTours.map(t => (
                        <button 
                            key={t.id}
                            onClick={() => { selectTour(t.id); setIsTourDropdownOpen(false); setCurrentView(View.DASHBOARD); }}
                            className={`w-full text-left px-3 py-2 text-sm rounded flex items-center justify-between ${currentTour?.id === t.id ? 'bg-maestro-700 text-white' : 'text-slate-400 hover:text-white hover:bg-maestro-700'}`}
                        >
                            <span className="truncate">{t.name}</span>
                            {currentTour?.id === t.id && <Check className="w-3 h-3 text-maestro-accent" />}
                        </button>
                      )) : (
                        <div className="px-3 py-2 text-xs text-slate-500 italic">No tours available.</div>
                      )}
                      
                      <div className="border-t border-maestro-700 my-1"></div>
                      
                      {currentUser?.role !== UserRole.CREW && (
                        <button 
                            onClick={() => { selectTour(''); setIsTourDropdownOpen(false); }}
                            className="w-full text-left px-3 py-2 text-sm rounded text-maestro-accent hover:bg-maestro-700 hover:text-white flex items-center gap-2 font-bold"
                        >
                            <PlusCircle className="w-4 h-4" /> Create New Tour
                        </button>
                      )}
                  </div>
              </div>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 custom-scrollbar">
            {navItems.map((item) => (
                <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-2 text-sm font-medium transition-colors border-l-4 ${
                    currentView === item.id 
                    ? 'border-red-500 bg-white/5 text-white' 
                    : 'border-transparent text-slate-400 hover:text-slate-100 hover:bg-white/5'
                }`}
                >
                <item.icon className="w-4 h-4 opacity-70" />
                <span>{item.label}</span>
                </button>
            ))}
             {/* Super Admin Link */}
             {currentUser?.role === UserRole.MASTER_ADMIN && (
                <button
                    onClick={() => setCurrentView(View.SUPER_ADMIN)}
                    className={`w-full flex items-center space-x-3 px-4 py-2 text-sm font-medium transition-colors border-l-4 mt-2 ${
                        currentView === View.SUPER_ADMIN 
                        ? 'border-red-500 bg-red-900/20 text-red-400' 
                        : 'border-transparent text-red-500 hover:bg-white/5'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    <span>Master Admin</span>
                </button>
            )}
            
            <div className="my-2 border-t border-maestro-700 mx-4"></div>
            
            {/* Team Management */}
            <button
                onClick={() => setCurrentView(View.TEAM_MGMT)}
                className={`w-full flex items-center space-x-3 px-4 py-2 text-sm font-medium transition-colors border-l-4 ${
                    currentView === View.TEAM_MGMT
                    ? 'border-red-500 bg-white/5 text-white' 
                    : 'border-transparent text-slate-400 hover:text-slate-100 hover:bg-white/5'
                }`}
            >
                <Users className="w-4 h-4 opacity-70" />
                <span>Team & Crew</span>
            </button>
            
            {/* Back Office / Settings */}
            <button
                onClick={() => setCurrentView(View.SETTINGS)}
                className={`w-full flex items-center space-x-3 px-4 py-2 text-sm font-medium transition-colors border-l-4 ${
                    currentView === View.SETTINGS
                    ? 'border-maestro-gold bg-maestro-gold/10 text-maestro-gold' 
                    : 'border-transparent text-slate-400 hover:text-slate-100 hover:bg-white/5'
                }`}
            >
                <Settings className="w-4 h-4" />
                <span>Back Office</span>
            </button>

            <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase mt-2">AI Tools</div>
            
            {aiTools.map((item) => (
                <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-2 text-sm font-medium transition-colors border-l-4 ${
                    currentView === item.id 
                    ? 'border-maestro-accent bg-maestro-accent/10 text-maestro-accent' 
                    : 'border-transparent text-slate-400 hover:text-slate-100 hover:bg-white/5'
                }`}
                >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
                </button>
            ))}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-maestro-700 bg-maestro-800">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold">
                    {currentUser?.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{currentUser?.name}</div>
                    <div className="text-[10px] text-slate-400 truncate uppercase">{currentUser?.role.replace('_', ' ')}</div>
                </div>
                <button onClick={logout} className="text-slate-500 hover:text-red-400">
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        </div>
      </aside>

      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-maestro-900 border-b border-maestro-700 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
           <span className="font-bold text-white">Tour Maestro</span>
        </div>
        <div className="flex gap-4">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
             {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-maestro-900 pt-20 p-6 space-y-2 overflow-y-auto">
           {[...navItems, ...aiTools].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id);
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-white/10"
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
          <button onClick={() => { setCurrentView(View.SETTINGS); setIsMobileMenuOpen(false); }} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-maestro-gold hover:bg-white/10">
            <Settings className="w-5 h-5" /> <span>Back Office</span>
          </button>
          <button onClick={logout} className="w-full text-red-400 mt-4 p-4 border border-red-900 rounded bg-red-900/20">Logout</button>
        </div>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 overflow-hidden flex flex-col relative pt-14 md:pt-0">
        
        {/* Content Wrapper */}
        {currentTour || currentView === View.SUPER_ADMIN ? children : (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-10 text-center bg-maestro-900">
                <div className="max-w-md w-full bg-maestro-800 p-8 rounded-2xl border border-maestro-700 shadow-2xl">
                    <div className="w-16 h-16 bg-maestro-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-maestro-700">
                        <Mic className="w-8 h-8 text-maestro-accent" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Create Your Tour</h2>
                    <p className="text-slate-400 mb-6">Let's get this show on the road. Set up your first tour to access the dashboard.</p>
                    
                    <form onSubmit={handleCreateTour} className="space-y-4 text-left">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Tour Name</label>
                            <input 
                                required
                                type="text" 
                                value={newTourName}
                                onChange={(e) => setNewTourName(e.target.value)}
                                placeholder="e.g. World Domination 2030"
                                className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 text-white mt-1 focus:ring-1 focus:ring-maestro-accent outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Artist / Band</label>
                            <input 
                                required
                                type="text" 
                                value={newArtistName}
                                onChange={(e) => setNewArtistName(e.target.value)}
                                placeholder="e.g. The Rockstars"
                                className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 text-white mt-1 focus:ring-1 focus:ring-maestro-accent outline-none"
                            />
                        </div>
                        <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-transform hover:scale-105">
                            Save New Tour <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>
                </div>
             </div>
        )}
      </main>

    </div>
  );
};
