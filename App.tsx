
import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Itinerary } from './components/Itinerary';
import { VenueIntel } from './components/VenueIntel';
import { CreativeStudio } from './components/CreativeStudio';
import { RoadManager } from './components/RoadManager';
import { TourSchedule } from './components/TourSchedule';
import { GuestList } from './components/GuestList';
import { SetlistManager } from './components/SetlistManager';
import { Finance } from './components/Finance';
import { DaySheet } from './components/DaySheet';
import { LandingPage } from './components/LandingPage';
import { Auth } from './components/Auth';
import { SuperAdmin } from './components/SuperAdmin';
import { TeamManager } from './components/TeamManager';
import { SettingsPage } from './components/Settings';
import { TourOverview } from './components/TourOverview';
import { SimulatedInbox } from './components/SimulatedInbox';
import { AdvancePage } from './components/AdvancePage';
import { View } from './types';

// The Inner Component uses the Context
const AppContent: React.FC = () => {
  const { currentUser } = useApp();
  
  // Load persistent view state or default to LANDING
  const [currentView, setCurrentView] = useState<View>(() => {
      const savedView = localStorage.getItem('tm_currentView');
      return (savedView as View) || View.LANDING;
  });

  // Persist view changes
  useEffect(() => {
      localStorage.setItem('tm_currentView', currentView);
  }, [currentView]);

  // Redirect to Overview on login (only if stuck on auth screens)
  useEffect(() => {
    if (currentUser && (currentView === View.LOGIN || currentView === View.REGISTER || currentView === View.LANDING)) {
        setCurrentView(View.OVERVIEW); 
    } else if (!currentUser && currentView !== View.LOGIN && currentView !== View.REGISTER) {
        setCurrentView(View.LANDING);
    }
  }, [currentUser]);

  // Public Views
  if (!currentUser) {
    if (currentView === View.LOGIN) return <Auth view={View.LOGIN} onNavigate={setCurrentView} />;
    if (currentView === View.REGISTER) return <Auth view={View.REGISTER} onNavigate={setCurrentView} />;
    return <LandingPage onNavigate={setCurrentView} />;
  }

  // Authenticated Views
  const renderView = () => {
    switch (currentView) {
      case View.OVERVIEW:
        return <TourOverview onNavigate={setCurrentView} />;
      case View.SUPER_ADMIN:
        return <SuperAdmin />;
      case View.TEAM_MGMT:
        return <TeamManager />;
      case View.DASHBOARD:
        return <Dashboard onNavigate={setCurrentView} />;
      case View.EVENTS:
        return <TourSchedule onNavigate={setCurrentView} />;
      case View.HOTELS:
      case View.TRAVEL:
        return <Itinerary />;
      case View.SCHEDULE:
        return <DaySheet />;
      case View.TASKS:
        return <Dashboard onNavigate={setCurrentView} />;
      case View.ADVANCE:
        return <AdvancePage />;
      case View.GUEST_LIST:
        return <GuestList />;
      case View.SETLIST:
        return <SetlistManager />;
      case View.ACCOUNTING:
        return <Finance />;
      case View.VENUE_INTEL:
        return <VenueIntel />;
      case View.CREATIVE_STUDIO:
        return <CreativeStudio />;
      case View.ROAD_MANAGER:
        return <RoadManager />;
      case View.SETTINGS:
        return <SettingsPage />;
      case View.INBOX:
        return <SimulatedInbox />;
      default:
        return <TourOverview onNavigate={setCurrentView} />;
    }
  };

  return (
    <Layout currentView={currentView} setCurrentView={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

// Wrap in Provider
function App() {
  return (
    <AppProvider>
        <AppContent />
    </AppProvider>
  );
}

export default App;
