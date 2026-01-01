
import React, { useState } from 'react';
import { askSearch, parseTravelDetails } from '../services/geminiService';
import { useApp } from '../contexts/AppContext';
import { Hotel, TravelItem, UserRole } from '../types';
import { MapPin, Plus, Save, Phone, User, Calendar, Hotel as HotelIcon, Loader2, Wand2, Hash, Plane, Train, Bus, Car, ArrowRight, X, Edit2, Trash2 } from 'lucide-react';

export const Itinerary: React.FC = () => {
  const { hotels, addHotel, updateHotel, deleteHotel, travelItems, addTravelItem, updateTravelItem, deleteTravelItem, currentTour, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'HOTELS' | 'TRAVEL'>('HOTELS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  const [editingHotelId, setEditingHotelId] = useState<string | null>(null);
  const [editingTravelId, setEditingTravelId] = useState<string | null>(null);

  const canEdit = currentUser?.role !== UserRole.CREW;

  const currentHotels = hotels
    .filter(h => h.tourId === currentTour?.id)
    .sort((a, b) => (a.checkIn || '9999').localeCompare(b.checkIn || '9999'));
    
  const currentTravel = travelItems.filter(t => t.tourId === currentTour?.id);

  const [hotelForm, setHotelForm] = useState<Hotel>({
      id: '', tourId: '', name: '', address: '', phone: '', contactName: '', notes: '', date: '', checkIn: '', checkOut: '', confirmationNumber: ''
  });

  const handleHotelAutoFill = async () => {
    if(!hotelForm.name) return;
    setIsAutoFilling(true);
    try {
        const prompt = `Perform lookup for hotel: "${hotelForm.name}". 
        1. Find official corporate address and primary front desk phone. 
        2. Identify the General Manager's name (if not found, use "Front Desk Manager").
        3. Scan the input string "${hotelForm.name}" for any confirmation codes (e.g., #123, REF:XYZ).
        
        Return STRICT JSON format: 
        {"address": "...", "phone": "...", "gm": "...", "conf": "..."}`;
        
        const result = await askSearch(prompt);
        // Robust JSON extraction
        const jsonMatch = result.text.match(/\{.*\}/s);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        
        setHotelForm(prev => ({
            ...prev,
            address: data.address || prev.address,
            phone: data.phone || prev.phone,
            contactName: data.gm || prev.contactName,
            confirmationNumber: data.conf || prev.confirmationNumber
        }));
    } catch (e) {
        console.error("AI Auto-fill failed", e);
    } finally {
        setIsAutoFilling(false);
    }
  };

  const saveHotel = (e: React.FormEvent) => {
      e.preventDefault();
      if(!currentTour) return;
      if (editingHotelId) updateHotel(editingHotelId, hotelForm);
      else addHotel({ ...hotelForm, id: Math.random().toString(36).substr(2, 9), tourId: currentTour.id });
      setIsModalOpen(false);
  };

  const openAddHotel = () => {
      setEditingHotelId(null);
      setHotelForm({ id: '', tourId: '', name: '', address: '', phone: '', contactName: '', notes: '', checkIn: '', checkOut: '', confirmationNumber: '' });
      setIsModalOpen(true);
  };

  const openEditHotel = (h: Hotel) => {
      setEditingHotelId(h.id);
      setHotelForm(h);
      setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto p-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white">Logistics</h1>
            <p className="text-slate-400">Accommodations & Travel Manifest</p>
        </div>
        <div className="flex gap-4">
            <div className="bg-maestro-800 p-1 rounded-lg border border-maestro-700 flex">
                <button onClick={() => setActiveTab('HOTELS')} className={`px-4 py-2 rounded-md text-sm font-bold ${activeTab === 'HOTELS' ? 'bg-maestro-700 text-white' : 'text-slate-400'}`}>Hotels</button>
                <button onClick={() => setActiveTab('TRAVEL')} className={`px-4 py-2 rounded-md text-sm font-bold ${activeTab === 'TRAVEL' ? 'bg-maestro-700 text-white' : 'text-slate-400'}`}>Travel</button>
            </div>
            {canEdit && (
                <button onClick={openAddHotel} className="bg-maestro-accent hover:bg-violet-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all">
                    <Plus className="w-5 h-5" /> Add Hotel
                </button>
            )}
        </div>
      </header>

      {/* HOTEL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-maestro-800 border border-maestro-accent/50 p-6 rounded-xl shadow-2xl w-full max-w-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-white text-xl flex items-center gap-2">
                        <HotelIcon className="text-maestro-accent" /> {editingHotelId ? 'Edit Hotel Record' : 'New Hotel Entry'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X /></button>
                </div>
                <form onSubmit={saveHotel} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Hotel Name / Search</label>
                        <div className="flex gap-2 mt-1">
                            <input type="text" required value={hotelForm.name} onChange={e => setHotelForm({...hotelForm, name: e.target.value})} placeholder="e.g. Hilton London #99211" className="flex-1 bg-maestro-900 border border-maestro-700 p-3 rounded text-white outline-none focus:border-maestro-accent" />
                            <button type="button" onClick={handleHotelAutoFill} disabled={isAutoFilling} className="bg-maestro-700 px-4 rounded-lg text-white flex items-center gap-2 font-bold text-xs hover:bg-maestro-600 transition-colors">
                                {isAutoFilling ? <Loader2 className="animate-spin w-4 h-4" /> : <Wand2 className="w-4 h-4 text-maestro-gold" />}
                                Auto-Fill
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-slate-400 uppercase">Check-In</label><input type="date" value={hotelForm.checkIn} onChange={e => setHotelForm({...hotelForm, checkIn: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 p-3 rounded text-white outline-none" /></div>
                        <div><label className="text-xs font-bold text-slate-400 uppercase">Check-Out</label><input type="date" value={hotelForm.checkOut} onChange={e => setHotelForm({...hotelForm, checkOut: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 p-3 rounded text-white outline-none" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1"><label className="text-xs font-bold text-slate-400 uppercase">GM / Contact</label><input type="text" value={hotelForm.contactName} onChange={e => setHotelForm({...hotelForm, contactName: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 p-3 rounded text-white text-sm outline-none" /></div>
                        <div className="col-span-1"><label className="text-xs font-bold text-slate-400 uppercase">Phone</label><input type="text" value={hotelForm.phone} onChange={e => setHotelForm({...hotelForm, phone: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 p-3 rounded text-white text-sm outline-none" /></div>
                        <div className="col-span-1"><label className="text-xs font-bold text-slate-400 uppercase">Confirmation #</label><input type="text" value={hotelForm.confirmationNumber || ''} onChange={e => setHotelForm({...hotelForm, confirmationNumber: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 p-3 rounded text-white font-mono text-sm outline-none" /></div>
                    </div>
                    <div><label className="text-xs font-bold text-slate-400 uppercase">Full Address</label><input type="text" value={hotelForm.address} onChange={e => setHotelForm({...hotelForm, address: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 p-3 rounded text-white outline-none" /></div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 text-slate-400 font-bold hover:text-white">Cancel</button>
                        <button type="submit" className="bg-green-600 px-8 py-3 rounded-lg font-bold text-white flex items-center gap-2 shadow-lg hover:bg-green-500 transition-colors"><Save className="w-4 h-4" /> Save Record</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {activeTab === 'HOTELS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {currentHotels.map(h => (
                <div key={h.id} className="bg-maestro-800 p-6 rounded-xl border border-maestro-700 relative group hover:border-maestro-accent transition-all shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-white">{h.name}</h3>
                            {h.confirmationNumber && <span className="text-xs text-maestro-gold font-mono uppercase bg-maestro-900 px-2 py-1 rounded border border-maestro-700 flex items-center gap-1 mt-1 w-fit"><Hash className="w-3 h-3" /> {h.confirmationNumber}</span>}
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditHotel(h)} className="p-2 bg-maestro-900 rounded-lg text-slate-400 hover:text-white border border-maestro-700"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => { if(window.confirm('Delete hotel record?')) deleteHotel(h.id); }} className="p-2 bg-maestro-900 rounded-lg text-slate-400 hover:text-red-500 border border-maestro-700"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                    <div className="space-y-3 text-sm text-slate-300">
                        <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-slate-500 mt-1 shrink-0" /> {h.address}</div>
                        <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-slate-500 shrink-0" /> {h.phone}</div>
                        <div className="flex items-center gap-3"><User className="w-4 h-4 text-slate-500 shrink-0" /> <span className="text-slate-400">GM:</span> <span className="text-white font-bold">{h.contactName}</span></div>
                        <div className="mt-4 pt-4 border-t border-maestro-700 flex justify-between text-[10px] font-bold uppercase text-slate-500 tracking-widest">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> In: {h.checkIn}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Out: {h.checkOut}</span>
                        </div>
                    </div>
                </div>
            ))}
            {currentHotels.length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-maestro-700 rounded-2xl text-slate-500">
                    <HotelIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">No hotel records found for this tour.</p>
                    {canEdit && <button onClick={openAddHotel} className="text-maestro-accent font-bold hover:underline mt-2">Add the first hotel</button>}
                </div>
            )}
        </div>
      )}
    </div>
  );
};
