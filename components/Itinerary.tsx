
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

  const [travelForm, setTravelForm] = useState<TravelItem>({
    id: '', tourId: '', type: 'Flight', carrier: '', number: '', 
    departureDate: '', departureTime: '', departureLocation: '', 
    arrivalDate: '', arrivalTime: '', arrivalLocation: '', notes: '', confirmationNumber: ''
  });

  const handleHotelAutoFill = async () => {
    if(!hotelForm.name) return;
    setIsAutoFilling(true);
    try {
        const prompt = `Perform lookup for: "${hotelForm.name}". 
        1. Find official address and primary phone. 
        2. Identify the General Manager's name if possible (or say "Front Desk").
        3. Extract any confirmation code (e.g., #123) from the name string itself.
        
        Return JSON format: 
        {"address": "...", "phone": "...", "gm": "...", "conf": "..."}`;
        
        const result = await askSearch(prompt);
        const data = JSON.parse(result.text.match(/\{.*\}/s)?.[0] || '{}');
        
        setHotelForm(prev => ({
            ...prev,
            address: data.address || prev.address,
            phone: data.phone || prev.phone,
            contactName: data.gm || prev.contactName,
            confirmationNumber: data.conf || prev.confirmationNumber
        }));
    } catch (e) {
        alert("Auto-fill failed. Please enter details manually.");
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
      setHotelForm({ id: '', tourId: '', name: '', address: '', phone: '', contactName: '', notes: '', checkIn: '', checkOut: '' });
      setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white">Logistics</h1>
            <p className="text-slate-400">Accommodations & Master Manifest</p>
        </div>
        <div className="flex gap-4">
            <div className="bg-maestro-800 p-1 rounded-lg border border-maestro-700 flex">
                <button onClick={() => setActiveTab('HOTELS')} className={`px-4 py-2 rounded-md text-sm font-bold ${activeTab === 'HOTELS' ? 'bg-maestro-700 text-white' : 'text-slate-400'}`}>Hotels</button>
                <button onClick={() => setActiveTab('TRAVEL')} className={`px-4 py-2 rounded-md text-sm font-bold ${activeTab === 'TRAVEL' ? 'bg-maestro-700 text-white' : 'text-slate-400'}`}>Travel</button>
            </div>
            {canEdit && (
                <button onClick={openAddHotel} className="bg-maestro-accent hover:bg-violet-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Add Entry
                </button>
            )}
        </div>
      </header>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-maestro-800 border border-maestro-accent/50 p-6 rounded-xl shadow-2xl w-full max-w-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-white text-xl flex items-center gap-2">
                        <HotelIcon className="text-maestro-accent" /> {editingHotelId ? 'Edit Hotel' : 'New Hotel Entry'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X /></button>
                </div>
                <form onSubmit={saveHotel} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Hotel Name / Search</label>
                        <div className="flex gap-2 mt-1">
                            <input type="text" required value={hotelForm.name} onChange={e => setHotelForm({...hotelForm, name: e.target.value})} placeholder="e.g. Hilton London Conf# 123" className="flex-1 bg-maestro-900 border border-maestro-700 p-3 rounded text-white" />
                            <button type="button" onClick={handleHotelAutoFill} disabled={isAutoFilling} className="bg-maestro-700 px-4 rounded text-white flex items-center gap-2 font-bold text-xs">
                                {isAutoFilling ? <Loader2 className="animate-spin" /> : <Wand2 className="text-maestro-gold" />}
                                Auto-Fill
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-slate-400 uppercase">Check-In</label><input type="date" value={hotelForm.checkIn} onChange={e => setHotelForm({...hotelForm, checkIn: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 p-3 rounded text-white" /></div>
                        <div><label className="text-xs font-bold text-slate-400 uppercase">Check-Out</label><input type="date" value={hotelForm.checkOut} onChange={e => setHotelForm({...hotelForm, checkOut: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 p-3 rounded text-white" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-slate-400 uppercase">GM / Contact</label><input type="text" value={hotelForm.contactName} onChange={e => setHotelForm({...hotelForm, contactName: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 p-3 rounded text-white" /></div>
                        <div><label className="text-xs font-bold text-slate-400 uppercase">Phone</label><input type="text" value={hotelForm.phone} onChange={e => setHotelForm({...hotelForm, phone: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 p-3 rounded text-white" /></div>
                    </div>
                    <div><label className="text-xs font-bold text-slate-400 uppercase">Full Address</label><input type="text" value={hotelForm.address} onChange={e => setHotelForm({...hotelForm, address: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 p-3 rounded text-white" /></div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 text-slate-400 font-bold">Cancel</button>
                        <button type="submit" className="bg-green-600 px-6 py-2 rounded font-bold text-white flex items-center gap-2"><Save className="w-4 h-4" /> Save Record</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {activeTab === 'HOTELS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {currentHotels.map(h => (
                <div key={h.id} className="bg-maestro-800 p-6 rounded-xl border border-maestro-700 relative group">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-white">{h.name}</h3>
                            {h.confirmationNumber && <span className="text-xs text-maestro-gold font-mono uppercase">Conf: {h.confirmationNumber}</span>}
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setHotelForm(h); setEditingHotelId(h.id); setIsModalOpen(true); }} className="text-slate-400 hover:text-white"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => deleteHotel(h.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                    <div className="space-y-2 text-sm text-slate-300">
                        <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-slate-500" /> {h.address}</div>
                        <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-500" /> {h.phone}</div>
                        <div className="flex items-center gap-2"><User className="w-4 h-4 text-slate-500" /> GM: {h.contactName}</div>
                        <div className="mt-4 pt-4 border-t border-maestro-700 flex justify-between text-[10px] font-bold uppercase text-slate-500">
                            <span>Check In: {h.checkIn}</span>
                            <span>Check Out: {h.checkOut}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};
