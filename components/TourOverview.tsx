
import React from 'react';
import { useApp } from '../contexts/AppContext';
import { Tour, View, UserRole } from '../types';
import { Calendar, Users, HardDrive, ArrowRight, Mic, Plus } from 'lucide-react';

interface TourOverviewProps {
    onNavigate: (view: View) => void;
}

export const TourOverview: React.FC<TourOverviewProps> = ({ onNavigate }) => {
    const { tours, currentUser, selectTour, createTour, tourDates } = useApp();
    const [newTourName, setNewTourName] = React.useState('');
    const [newArtistName, setNewArtistName] = React.useState('');
    const [isCreating, setIsCreating] = React.useState(false);

    // Filter available tours for this user with strict safety checks
    const availableTours = tours.filter(t => 
        currentUser?.role === UserRole.MASTER_ADMIN || 
        currentUser?.role === UserRole.SUPPORT_STAFF ||
        (currentUser?.assignedTourIds && currentUser.assignedTourIds.includes(t.id))
    );

    const handleEnterTour = (tourId: string) => {
        selectTour(tourId);
        onNavigate(View.DASHBOARD);
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if(newTourName && newArtistName) {
            createTour(newTourName, newArtistName);
            setIsCreating(false);
            setNewTourName('');
            setNewArtistName('');
        }
    };

    return (
        <div className="p-8 h-full overflow-y-auto bg-maestro-900">
            <header className="mb-10">
                <h1 className="text-4xl font-bold text-white mb-2">Tour Overview</h1>
                <p className="text-slate-400 text-lg">Select an active tour or launch a new production.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                
                {/* Create New Card */}
                {currentUser?.role !== UserRole.CREW && (
                    <div className="bg-maestro-800/50 border-2 border-dashed border-maestro-700 rounded-2xl p-6 flex flex-col justify-center items-center text-center hover:border-maestro-accent transition-colors group min-h-[250px]">
                        {!isCreating ? (
                            <button onClick={() => setIsCreating(true)} className="w-full h-full flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-maestro-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Plus className="w-8 h-8 text-maestro-accent" />
                                </div>
                                <h3 className="font-bold text-white text-xl">New Tour</h3>
                                <p className="text-slate-500 text-sm mt-2">Launch a new production workspace</p>
                            </button>
                        ) : (
                            <form onSubmit={handleCreate} className="w-full space-y-3">
                                <input 
                                    autoFocus
                                    type="text" 
                                    placeholder="Tour Name"
                                    value={newTourName}
                                    onChange={e => setNewTourName(e.target.value)}
                                    className="w-full bg-maestro-900 border border-maestro-700 p-2 rounded text-white outline-none focus:border-maestro-accent"
                                />
                                <input 
                                    type="text" 
                                    placeholder="Artist"
                                    value={newArtistName}
                                    onChange={e => setNewArtistName(e.target.value)}
                                    className="w-full bg-maestro-900 border border-maestro-700 p-2 rounded text-white outline-none focus:border-maestro-accent"
                                />
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setIsCreating(false)} className="flex-1 bg-maestro-700 text-white py-2 rounded text-sm">Cancel</button>
                                    <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded text-sm font-bold">Create</button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* Tour Cards */}
                {availableTours.map(tour => {
                    const crewCount = tour.crewIds.length + 1;
                    const dates = tourDates.filter(d => d.tourId === tour.id);
                    const usage = tour.storageLimit > 0 ? Math.round((tour.storageUsed / tour.storageLimit) * 100) : 0;
                    
                    return (
                        <div key={tour.id} onClick={() => handleEnterTour(tour.id)} className="bg-maestro-800 rounded-2xl border border-maestro-700 p-6 hover:border-maestro-accent hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between min-h-[250px] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-maestro-accent/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                            
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <Mic className="w-5 h-5 text-maestro-gold" />
                                    <span className="text-xs font-bold text-maestro-gold uppercase tracking-wider">Active Production</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-1 truncate" title={tour.name}>{tour.name}</h3>
                                <p className="text-slate-400 font-medium">{tour.artist}</p>
                            </div>

                            <div className="space-y-3 mt-6">
                                <div className="flex justify-between items-center text-sm text-slate-300">
                                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-500" /> {dates.length} Dates</div>
                                    <div className="flex items-center gap-2"><Users className="w-4 h-4 text-slate-500" /> {crewCount} Staff</div>
                                </div>
                                <div className="w-full bg-maestro-900 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-blue-500 h-full" style={{ width: `${usage}%` }}></div>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold">
                                    <span>Storage</span>
                                    <span>{usage}% Used</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-maestro-700 flex justify-end">
                                <span className="text-maestro-accent font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                                    Enter Dashboard <ArrowRight className="w-4 h-4" />
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
