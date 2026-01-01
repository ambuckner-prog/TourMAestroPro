
import React, { useState, useRef, useEffect } from 'react';
import { View, UserRole, Note } from '../types';
import { useApp } from '../contexts/AppContext';
import { 
  LayoutDashboard, Map, Calendar, CheckSquare, Send, Users, 
  Music2, PoundSterling, Paperclip, Globe, Video, Mic2, Menu, X, 
  CalendarDays, ChevronDown, PlusCircle, LogOut, ArrowRight, Mic, 
  Settings, Check, LayoutGrid, ShieldAlert, Bell, Inbox, Cloud, RefreshCw, AlertTriangle
} from 'lucide-react';

interface LayoutProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, setCurrentView, children }) => {
  const { currentUser, currentTour, tours, logout, selectTour, createTour, notification, clearNotification, emailLogs, lastSaveTime, forceSave, storageUsage } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isTourDropdownOpen, setIsTourDropdownOpen] = React.useState(false);
  
  // Creation Form State
  const [newTourName, setNewTourName] = useState('');
  const [newArtistName, setNewArtistName] = useState('');

  // Check strict master admin access for Back Office
  const isMasterAdmin = currentUser?.email === 'ambuckner@gmail.com';

  const navItems = [
    { id: View.OVERVIEW, label: 'Overview', icon: LayoutGrid },
    ...(currentTour ? [
      { id: View.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
      { id: View.EVENTS, label: 'Events', icon: Calendar },
      { id: View.HOTELS, label: 'Hotels', icon: CalendarDays },
      { id: View.TRAVEL, label: 'Travel', icon: Map },
      { id: View.SCHEDULE, label: 'Day Sheet', icon: CheckSquare }, 
      { id: View.TASKS, label: 'Tasks', icon: CheckSquare },
      { id: View.ADVANCE, label: 'Advance', icon: Send },
      { id: View.GUEST_LIST, label: 'Guest List', icon: Users },
      { id: View.SETLIST, label: 'Set List', icon: Music2 },
      { id: View.ACCOUNTING, label: 'Accounting', icon: PoundSterling },
      { id: View.ATTACHMENTS, label: 'Attachments', icon: Paperclip },
    ] : [])
  ];

  const aiTools = currentTour ? [
    { id: View.VENUE_INTEL, label: 'Venue Intel', icon: Globe },
    { id: View.CREATIVE_STUDIO, label: 'Creative Studio', icon: Video },
    { id: View.ROAD_MANAGER, label: 'Road Manager', icon: Mic2 },
  ] : [];

  const handleCreateTour = (e: React.FormEvent) => {
    e.preventDefault();
    if(newTourName && newArtistName) {
        createTour(newTourName, newArtistName);
        setNewTourName('');
        setNewArtistName('');
        setIsTourDropdownOpen(false);
        setCurrentView(View.DASHBOARD); 
    }
  };

  // Robust filtering: User is Master/Support OR Manager OR Assigned
  const availableTours = tours.filter(t => 
      currentUser?.role === UserRole.MASTER_ADMIN || 
      currentUser?.role === UserRole.SUPPORT_STAFF ||
      t.managerId === currentUser?.id ||
      (currentUser?.assignedTourIds && currentUser.assignedTourIds.includes(t.id))
  );

  const getStorageStatusColor = (usage: number) => {
      if (usage > 90) return 'text-red-500';
      if (usage > 70) return 'text-yellow-500';
      return 'text-green-500';
  };

  return (
    <div className="flex h-screen bg-maestro-900 text-slate-100 overflow-hidden font-sans">
      
      {/* --- NOTIFICATION TOAST --- */}
      {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-2xl border flex items-center gap-3 animate-fadeIn transition-all max-w-sm ${
              notification.type === 'success' ? 'bg-green-900/90 border-green-500/50 text-green-100' :
              notification.type === 'error' ? 'bg-red-900/90 border-red-500/50 text-red-100' :
              'bg-blue-900/90 border-blue-500/50 text-blue-100'
          }`}>
              <div className={`p-2 rounded-full ${
                  notification.type === 'success' ? 'bg-green-800' :
                  notification.type === 'error' ? 'bg-red-800' :
                  'bg-blue-800'
              }`}>
                  {notification.type === 'error' ? <AlertTriangle className="w-4 h-4 text-white" /> : <Bell className="w-4 h-4 text-white" />}
              </div>
              <div className="flex-1">
                  <h4 className="font-bold text-sm">{notification.message}</h4>
                  {notification.subtext && <p className="text-xs opacity-80">{notification.subtext}</p>}
              </div>
              <button onClick={clearNotification} className="text-white/50 hover:text-white"><X className="w-4 h-4"/></button>
          </div>
      )}

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
                    {currentTour ? currentTour.name : 'Overview'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                    {currentTour ? currentTour.artist : 'Select Tour'}
                </div>
             </div>
             <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isTourDropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* Tour Dropdown */}
          {isTourDropdownOpen && (
              <div className="absolute top-16 left-0 w-64 bg-maestro-800 border-r border-b border-maestro-700 shadow-2xl z-50 animate-fadeIn">
                  <div className="p-2 space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                      <button 
                          onClick={() => { selectTour(''); setIsTourDropdownOpen(false); setCurrentView(View.OVERVIEW); }}
                          className={`w-full text-left px-3 py-2 text-sm rounded flex items-center justify-between ${!currentTour ? 'bg-maestro-700 text-white' : 'text-slate-400 hover:text-white hover:bg-maestro-700'}`}
                      >
                          <span className="truncate flex items-center gap-2"><LayoutGrid className="w-3 h-3" /> Overview</span>
                          {!currentTour && <Check className="w-3 h-3 text-maestro-accent" />}
                      </button>
                      
                      <div className="border-t border-maestro-700 my-1"></div>

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
            
            {/* Inbox */}
            <button
                onClick={() => setCurrentView(View.INBOX)}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm font-medium transition-colors border-l-4 ${
                    currentView === View.INBOX 
                    ? 'border-blue-500 bg-blue-900/10 text-white' 
                    : 'border-transparent text-slate-400 hover:text-slate-100 hover:bg-white/5'
                }`}
            >
                <div className="flex items-center gap-3">
                    <Inbox className="w-4 h-4 opacity-70" />
                    <span>Inbox</span>
                </div>
                <span className="bg-blue-600 text-white text-[10px] px-1.5 rounded-full font-bold">{emailLogs.length}</span>
            </button>

            {/* Back Office Society - MASTER ONLY */}
             {isMasterAdmin && (
                <>
                    <div className="my-2 border-t border-maestro-700 mx-4"></div>
                    <button
                        onClick={() => setCurrentView(View.SUPER_ADMIN)}
                        className={`w-full flex items-center space-x-3 px-4 py-2 text-sm font-medium transition-colors border-l-4 mt-2 ${
                            currentView === View.SUPER_ADMIN 
                            ? 'border-red-500 bg-red-900/20 text-red-400' 
                            : 'border-transparent text-red-500 hover:bg-white/5'
                        }`}
                    >
                        <ShieldAlert className="w-4 h-4" />
                        <span>Master Dashboard</span>
                    </button>
                </>
            )}
            
            {/* Team Management & Settings (Visible if inside a tour) */}
            {currentTour && (
                <>
                    <div className="my-2 border-t border-maestro-700 mx-4"></div>
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
                </>
            )}

            {aiTools.length > 0 && (
                <>
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
                </>
            )}
        </nav>

        {/* User Profile Footer & Sync Status */}
        <div className="p-4 border-t border-maestro-700 bg-maestro-800">
            <div className="flex items-center gap-3 mb-3">
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
            
            {/* Sync Indicator */}
            <button 
                onClick={forceSave}
                className="w-full flex items-center justify-between text-[10px] bg-maestro-900 p-2 rounded text-slate-400 hover:text-white hover:bg-maestro-700 transition-colors border border-maestro-700 group"
                title="Force Cloud Sync"
            >
                <div className="flex items-center gap-2">
                    <Cloud className={`w-3 h-3 ${getStorageStatusColor(storageUsage)}`} />
                    <span>Last Saved: {lastSaveTime ? lastSaveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}</span>
                </div>
                <RefreshCw className="w-3 h-3 opacity-50 group-hover:rotate-180 transition-transform" />
            </button>
            {storageUsage > 90 && (
                <div className="text-[9px] text-red-400 mt-1 text-center font-bold animate-pulse">
                    Storage Critical ({storageUsage.toFixed(0)}%)
                </div>
            )}
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
           {navItems.map((item) => (
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
          <button onClick={() => setCurrentView(View.INBOX)} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-white/10">
              <Inbox className="w-5 h-5" />
              <span>Inbox ({emailLogs.length})</span>
          </button>
          <button onClick={logout} className="w-full text-red-400 mt-4 p-4 border border-red-900 rounded bg-red-900/20">Logout</button>
        </div>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 overflow-hidden flex flex-col relative pt-14 md:pt-0">
        {children}
      </main>

    </div>
  );
};
