
import React, { useState } from 'react';
import { askSearch, parseTravelDetails } from '../services/geminiService';
import { useApp } from '../contexts/AppContext';
import { Hotel, TravelItem, UserRole } from '../types';
import { MapPin, Plus, Save, Phone, User, Calendar, Hotel as HotelIcon, Loader2, Wand2, Hash, Plane, Train, Bus, Car, ArrowRight, ClipboardCopy, FileText, X, Edit2, Trash2 } from 'lucide-react';

export const Itinerary: React.FC = () => {
  const { hotels, addHotel, updateHotel, deleteHotel, travelItems, addTravelItem, updateTravelItem, deleteTravelItem, currentTour, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'HOTELS' | 'TRAVEL'>('HOTELS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  // Edit Tracking
  const [editingHotelId, setEditingHotelId] = useState<string | null>(null);
  const [editingTravelId, setEditingTravelId] = useState<string | null>(null);

  // Permission Check
  const canEdit = currentUser?.role !== UserRole.CREW;

  // Filter Data
  const currentHotels = hotels
    .filter(h => h.tourId === currentTour?.id)
    .sort((a, b) => {
        const dateA = a.date || a.checkIn || '';
        const dateB = b.date || b.checkIn || '';
        return dateA.localeCompare(dateB);
    });
    
  const currentTravel = travelItems.filter(t => t.tourId === currentTour?.id);

  // --- HOTEL STATE ---
  const [hotelForm, setHotelForm] = useState<Hotel>({
      id: '', tourId: '', name: '', address: '', phone: '', contactName: '', notes: '', date: '', checkIn: '', checkOut: '', confirmationNumber: ''
  });

  // --- TRAVEL STATE ---
  const [travelForm, setTravelForm] = useState<TravelItem>({
    id: '', tourId: '', type: 'Flight', carrier: '', number: '', 
    departureDate: '', departureTime: '', departureLocation: '', 
    arrivalDate: '', arrivalTime: '', arrivalLocation: '', notes: '', confirmationNumber: ''
  });
  const [pasteBuffer, setPasteBuffer] = useState(''); // For AI parsing

  // --- ACTIONS: OPEN MODALS ---
  const openAddHotel = () => {
      setEditingHotelId(null);
      setHotelForm({ id: '', tourId: '', name: '', address: '', phone: '', contactName: '', notes: '', date: '', checkIn: '', checkOut: '', confirmationNumber: '' });
      setIsModalOpen(true);
  };

  const openEditHotel = (h: Hotel) => {
      setEditingHotelId(h.id);
      setHotelForm({ ...h });
      setIsModalOpen(true);
  };

  const openAddTravel = () => {
      setEditingTravelId(null);
      setTravelForm({ id: '', tourId: '', type: 'Flight', carrier: '', number: '', departureDate: '', departureTime: '', departureLocation: '', arrivalDate: '', arrivalTime: '', arrivalLocation: '', notes: '', confirmationNumber: '' });
      setIsModalOpen(true);
  };

  const openEditTravel = (t: TravelItem) => {
      setEditingTravelId(t.id);
      setTravelForm({ ...t });
      setIsModalOpen(true);
  };

  // --- HANDLERS: HOTEL ---
  const handleHotelAutoFill = async () => {
    if(!hotelForm.name) return;
    setIsAutoFilling(true);
    try {
        const prompt = `Task: Find hotel details and extract booking info.
        Input String: "${hotelForm.name}"
        
        Instructions:
        1. Search for the official address and main phone number for this hotel using Google Search.
        2. Find the General Manager's name if available publicly, otherwise use "Front Desk".
        3. EXTRACT CONFIRMATION NUMBER: Check the "Input String" above for a booking confirmation code (e.g., "#12345", "Conf: ABC", "Ref: 999", or alphanumeric codes like "HK882"). Extract ONLY the code. Do not search the web for this code. If no code is in the Input String, return "N/A".

        Return the result strictly in this format:
        Address: [Full Address]
        Phone: [Phone Number]
        Contact: [General Manager Name or "Front Desk"]
        Confirmation: [Extracted Code or "N/A"]`;
        
        const result = await askSearch(prompt);
        const text = result.text || "";

        const addressMatch = text.match(/Address:\s*(.*)/i);
        const phoneMatch = text.match(/Phone:\s*(.*)/i);
        const contactMatch = text.match(/Contact:\s*(.*)/i);
        const confMatch = text.match(/Confirmation:\s*(.*)/i);
        
        setHotelForm(prev => ({
            ...prev,
            address: addressMatch ? addressMatch[1].trim() : prev.address,
            phone: phoneMatch ? phoneMatch[1].trim() : prev.phone,
            contactName: contactMatch && !contactMatch[1].includes("N/A") ? contactMatch[1].trim() : prev.contactName,
            confirmationNumber: confMatch && !confMatch[1].includes("N/A") ? confMatch[1].trim() : prev.confirmationNumber,
        }));
    } catch (e) {
        console.error(e);
        alert("Auto-fill failed. Please try again.");
    } finally {
        setIsAutoFilling(false);
    }
  };

  const saveHotel = (e: React.FormEvent) => {
      e.preventDefault();
      if(hotelForm.name && hotelForm.address && currentTour) {
          if (editingHotelId) {
              updateHotel(editingHotelId, hotelForm);
          } else {
              addHotel({ ...hotelForm, id: Math.random().toString(36).substr(2, 9), tourId: currentTour.id });
          }
          setIsModalOpen(false);
      }
  };

  const handleDeleteHotel = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(window.confirm("Delete this hotel?")) deleteHotel(id);
  };

  // --- HANDLERS: TRAVEL ---
  const handleTravelParse = async () => {
      if(!pasteBuffer) return;
      setIsAutoFilling(true);
      try {
          const jsonString = await parseTravelDetails(pasteBuffer);
          if (jsonString) {
              const parsed = JSON.parse(jsonString);
              setTravelForm(prev => ({
                  ...prev,
                  ...parsed,
                  type: parsed.type || 'Flight',
              }));
          }
      } catch (e) {
          console.error("Parse failed", e);
          alert("Could not automatically parse details. Please enter manually.");
      } finally {
          setIsAutoFilling(false);
      }
  };

  const saveTravel = (e: React.FormEvent) => {
      e.preventDefault();
      if(travelForm.carrier && currentTour) {
          if (editingTravelId) {
              updateTravelItem(editingTravelId, travelForm);
          } else {
              addTravelItem({ ...travelForm, id: Math.random().toString(36).substr(2, 9), tourId: currentTour.id });
          }
          setIsModalOpen(false);
          setPasteBuffer('');
      }
  };

  const handleDeleteTravel = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(window.confirm("Delete this travel item?")) deleteTravelItem(id);
  };

  const getTravelIcon = (type: string) => {
      switch(type) {
          case 'Flight': return Plane;
          case 'Train': return Train;
          case 'Bus': return Bus;
          default: return Car;
      }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white">Logistics</h1>
            <p className="text-slate-400">Accommodations & Travel Manifest</p>
        </div>
        <div className="flex gap-4">
            <div className="bg-maestro-800 p-1 rounded-lg border border-maestro-700 flex">
                <button onClick={() => setActiveTab('HOTELS')} className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'HOTELS' ? 'bg-maestro-700 text-white' : 'text-slate-400 hover:text-white'}`}>Hotels</button>
                <button onClick={() => setActiveTab('TRAVEL')} className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'TRAVEL' ? 'bg-maestro-700 text-white' : 'text-slate-400 hover:text-white'}`}>Travel</button>
            </div>
            {canEdit && (
                <button 
                    onClick={() => activeTab === 'HOTELS' ? openAddHotel() : openAddTravel()} 
                    className="bg-maestro-accent hover:bg-violet-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-5 h-5" /> Add {activeTab === 'HOTELS' ? 'Hotel' : 'Item'}
                </button>
            )}
        </div>
      </header>

      {/* --- HOTEL TAB --- */}
      {activeTab === 'HOTELS' && (
        <>
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-maestro-800 border border-maestro-accent/50 p-6 rounded-xl shadow-2xl w-full max-w-4xl relative overflow-y-auto max-h-[90vh]">
                        <div className="flex items-center justify-between mb-6 border-b border-maestro-700 pb-4">
                            <h3 className="font-bold text-white flex items-center gap-2 text-xl">
                                <HotelIcon className="w-6 h-6 text-maestro-accent" /> {editingHotelId ? 'Edit Hotel' : 'New Hotel Entry'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Hotel Name</label>
                                    <div className="flex gap-2 mt-1">
                                        <input 
                                            autoFocus
                                            type="text" 
                                            placeholder="e.g. The Ritz-Carlton Tokyo (Conf: #99382)"
                                            value={hotelForm.name}
                                            onChange={(e) => setHotelForm({...hotelForm, name: e.target.value})}
                                            className="flex-1 bg-maestro-900 border border-maestro-700 p-3 rounded text-white focus:ring-1 focus:ring-maestro-accent outline-none"
                                        />
                                        <button 
                                            type="button"
                                            onClick={handleHotelAutoFill}
                                            disabled={isAutoFilling || !hotelForm.name}
                                            className="bg-maestro-700 hover:bg-maestro-600 text-white p-3 rounded flex items-center gap-2 disabled:opacity-50"
                                            title="Auto-Complete details from Search"
                                        >
                                            {isAutoFilling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5 text-maestro-gold" />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1">Tip: Include confirmation code in name (e.g. #1234) for auto-extraction.</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Dates (Ref / Check-in / Check-out)</label>
                                    <div className="grid grid-cols-3 gap-2 mt-1">
                                        <input type="date" value={hotelForm.date} onChange={(e) => setHotelForm({...hotelForm, date: e.target.value})} className="bg-maestro-900 border border-maestro-700 p-3 rounded text-white text-sm outline-none" />
                                        <input type="date" value={hotelForm.checkIn} onChange={(e) => setHotelForm({...hotelForm, checkIn: e.target.value})} className="bg-maestro-900 border border-maestro-700 p-3 rounded text-white text-sm outline-none" />
                                        <input type="date" value={hotelForm.checkOut} onChange={(e) => setHotelForm({...hotelForm, checkOut: e.target.value})} className="bg-maestro-900 border border-maestro-700 p-3 rounded text-white text-sm outline-none" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Address</label>
                                    <div className="relative mt-1">
                                        <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                                        <input type="text" placeholder="Full Address" value={hotelForm.address} onChange={(e) => setHotelForm({...hotelForm, address: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 p-3 pl-10 rounded text-white focus:ring-1 focus:ring-maestro-accent outline-none" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Phone</label>
                                        <div className="relative mt-1">
                                            <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                                            <input type="text" placeholder="+1 ..." value={hotelForm.phone} onChange={(e) => setHotelForm({...hotelForm, phone: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 p-3 pl-10 rounded text-white focus:ring-1 focus:ring-maestro-accent outline-none text-xs" />
                                        </div>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Contact</label>
                                        <div className="relative mt-1">
                                            <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                                            <input type="text" placeholder="Manager Name" value={hotelForm.contactName} onChange={(e) => setHotelForm({...hotelForm, contactName: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 p-3 pl-10 rounded text-white focus:ring-1 focus:ring-maestro-accent outline-none text-xs" />
                                        </div>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Conf #</label>
                                        <div className="relative mt-1">
                                            <Hash className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                                            <input type="text" placeholder="#12345" value={hotelForm.confirmationNumber || ''} onChange={(e) => setHotelForm({...hotelForm, confirmationNumber: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 p-3 pl-10 rounded text-white focus:ring-1 focus:ring-maestro-accent outline-none text-xs" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end mt-6 pt-4 border-t border-maestro-700 gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white px-4 py-2 text-sm font-bold">Cancel</button>
                            <button onClick={saveHotel} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold flex items-center gap-2"><Save className="w-4 h-4" /> Save Hotel</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {currentHotels.length === 0 && !isModalOpen && (
                     <div className="col-span-full py-16 text-center border-2 border-dashed border-maestro-700 rounded-xl">
                        <HotelIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-400">No hotels added for this tour</h3>
                        <p className="text-slate-500 mb-6">Start adding accommodation details.</p>
                        {canEdit && <button onClick={openAddHotel} className="text-maestro-accent font-bold hover:underline">Add Hotel</button>}
                    </div>
                )}
                {currentHotels.map(hotel => (
                    <div 
                        key={hotel.id} 
                        onClick={() => canEdit && openEditHotel(hotel)}
                        className={`bg-maestro-800 p-6 rounded-xl border border-maestro-700 hover:border-maestro-500 transition-colors group relative ${canEdit ? 'cursor-pointer hover:bg-maestro-700/50' : ''}`}
                    >
                        {canEdit && (
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); openEditHotel(hotel); }} className="p-1.5 bg-maestro-900 rounded text-slate-400 hover:text-white"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={(e) => handleDeleteHotel(e, hotel.id)} className="p-1.5 bg-maestro-900 rounded text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        )}
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white group-hover:text-maestro-accent transition-colors">{hotel.name}</h3>
                                {hotel.confirmationNumber && <span className="text-xs text-maestro-gold font-mono flex items-center gap-1 mt-1"><Hash className="w-3 h-3" /> Conf: {hotel.confirmationNumber}</span>}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                {hotel.date && <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{hotel.date}</span>}
                                {(hotel.checkIn || hotel.checkOut) && <span className="text-xs bg-maestro-900 text-slate-300 px-2 py-1 rounded border border-maestro-700 flex items-center gap-1"><Calendar className="w-3 h-3" /> {hotel.checkIn} {hotel.checkOut ? ` - ${hotel.checkOut}` : ''}</span>}
                            </div>
                        </div>
                        <div className="space-y-3 text-sm text-slate-300">
                            <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" /><span>{hotel.address}</span></div>
                            <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-slate-500 flex-shrink-0" /><span>{hotel.phone}</span></div>
                            <div className="flex items-center gap-3"><User className="w-4 h-4 text-slate-500 flex-shrink-0" /><span>{hotel.contactName || 'N/A'}</span></div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-maestro-700 flex gap-3">
                            <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name + ' ' + hotel.address)}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 text-center bg-maestro-700 hover:bg-maestro-600 py-2 rounded text-sm text-white font-medium transition-colors"
                            >
                                Open in Maps
                            </a>
                            <button 
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 text-center border border-maestro-600 hover:bg-maestro-700 py-2 rounded text-sm text-slate-300 hover:text-white transition-colors"
                            >
                                View Confirmation
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </>
      )}

      {/* --- TRAVEL TAB --- */}
      {activeTab === 'TRAVEL' && (
        <>
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-maestro-800 border border-maestro-accent/50 p-6 rounded-xl shadow-2xl w-full max-w-4xl relative overflow-y-auto max-h-[90vh]">
                        <div className="flex items-center justify-between mb-4 border-b border-maestro-700 pb-4">
                            <h3 className="font-bold text-white flex items-center gap-2 text-xl"><Plane className="w-6 h-6 text-maestro-accent" /> {editingTravelId ? 'Edit Travel Item' : 'New Travel Item'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* MAGIC PARSER */}
                            <div className="space-y-4 border-r border-maestro-700 pr-6">
                                <div>
                                    <label className="text-xs font-bold text-maestro-gold uppercase flex items-center gap-2 mb-2"><Wand2 className="w-3 h-3" /> Magic Parse</label>
                                    <textarea 
                                        value={pasteBuffer}
                                        onChange={(e) => setPasteBuffer(e.target.value)}
                                        placeholder="Paste itinerary text here (e.g. 'United Flight UA543 from SFO to JFK on Oct 20 dep 8am')"
                                        className="w-full h-32 bg-maestro-900 border border-maestro-700 rounded p-3 text-slate-300 text-sm focus:ring-1 focus:ring-maestro-accent outline-none"
                                    />
                                    <button 
                                        onClick={handleTravelParse}
                                        disabled={!pasteBuffer || isAutoFilling}
                                        className="mt-2 w-full bg-maestro-700 hover:bg-maestro-600 text-white py-2 rounded text-sm font-bold flex justify-center items-center gap-2"
                                    >
                                        {isAutoFilling ? <Loader2 className="animate-spin w-4 h-4" /> : 'Auto-Fill Details'}
                                    </button>
                                </div>
                                <div className="bg-maestro-900/50 p-3 rounded border border-maestro-700 text-xs text-slate-500">
                                    AI will attempt to extract Carrier, Number, Times, and Locations from raw text.
                                </div>
                            </div>

                            {/* MANUAL FIELDS */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase">Type</label>
                                        <select value={travelForm.type} onChange={(e) => setTravelForm({...travelForm, type: e.target.value as any})} className="w-full mt-1 bg-maestro-900 border border-maestro-700 p-2 rounded text-white text-sm">
                                            <option>Flight</option><option>Bus</option><option>Train</option><option>Ground</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase">Carrier & No.</label>
                                        <div className="flex gap-2 mt-1">
                                            <input type="text" placeholder="Delta" value={travelForm.carrier} onChange={(e) => setTravelForm({...travelForm, carrier: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 p-2 rounded text-white text-sm" />
                                            <input type="text" placeholder="DL123" value={travelForm.number} onChange={(e) => setTravelForm({...travelForm, number: e.target.value})} className="w-24 bg-maestro-900 border border-maestro-700 p-2 rounded text-white text-sm" />
                                        </div>
                                    </div>
                                </div>

                                {/* Departure */}
                                <div className="p-3 bg-maestro-900/50 rounded border border-maestro-700">
                                    <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Departure</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <input type="date" value={travelForm.departureDate} onChange={(e) => setTravelForm({...travelForm, departureDate: e.target.value})} className="bg-maestro-800 border border-maestro-700 p-2 rounded text-white text-xs" />
                                        <input type="time" value={travelForm.departureTime} onChange={(e) => setTravelForm({...travelForm, departureTime: e.target.value})} className="bg-maestro-800 border border-maestro-700 p-2 rounded text-white text-xs" />
                                        <input type="text" placeholder="City/Airport" value={travelForm.departureLocation} onChange={(e) => setTravelForm({...travelForm, departureLocation: e.target.value})} className="bg-maestro-800 border border-maestro-700 p-2 rounded text-white text-xs" />
                                    </div>
                                </div>

                                {/* Arrival */}
                                <div className="p-3 bg-maestro-900/50 rounded border border-maestro-700">
                                    <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Arrival</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <input type="date" value={travelForm.arrivalDate} onChange={(e) => setTravelForm({...travelForm, arrivalDate: e.target.value})} className="bg-maestro-800 border border-maestro-700 p-2 rounded text-white text-xs" />
                                        <input type="time" value={travelForm.arrivalTime} onChange={(e) => setTravelForm({...travelForm, arrivalTime: e.target.value})} className="bg-maestro-800 border border-maestro-700 p-2 rounded text-white text-xs" />
                                        <input type="text" placeholder="City/Airport" value={travelForm.arrivalLocation} onChange={(e) => setTravelForm({...travelForm, arrivalLocation: e.target.value})} className="bg-maestro-800 border border-maestro-700 p-2 rounded text-white text-xs" />
                                    </div>
                                </div>

                                {/* Confirmation & Notes */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase">Conf # / PNR</label>
                                        <input 
                                            type="text" 
                                            placeholder="XYZ123" 
                                            value={travelForm.confirmationNumber || ''} 
                                            onChange={(e) => setTravelForm({...travelForm, confirmationNumber: e.target.value})} 
                                            className="w-full mt-1 bg-maestro-900 border border-maestro-700 p-2 rounded text-white text-sm" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase">Notes</label>
                                        <input 
                                            type="text" 
                                            placeholder="Seat 12A, Terminal 4..." 
                                            value={travelForm.notes || ''} 
                                            onChange={(e) => setTravelForm({...travelForm, notes: e.target.value})} 
                                            className="w-full mt-1 bg-maestro-900 border border-maestro-700 p-2 rounded text-white text-sm" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end mt-6 pt-4 border-t border-maestro-700 gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white px-4 py-2 text-sm font-bold">Cancel</button>
                            <button onClick={saveTravel} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold flex items-center gap-2"><Save className="w-4 h-4" /> Save Item</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {currentTravel.length === 0 && !isModalOpen && (
                     <div className="py-16 text-center border-2 border-dashed border-maestro-700 rounded-xl">
                        <Plane className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-400">No travel items yet for this tour</h3>
                        <p className="text-slate-500 mb-6">Add flights, trains, or ground transport.</p>
                        {canEdit && <button onClick={openAddTravel} className="text-maestro-accent font-bold hover:underline">Add Travel</button>}
                    </div>
                )}
                
                {currentTravel.map(item => {
                    const Icon = getTravelIcon(item.type);
                    return (
                        <div 
                            key={item.id} 
                            onClick={() => canEdit && openEditTravel(item)}
                            className={`bg-maestro-800 p-4 rounded-xl border border-maestro-700 hover:border-maestro-500 transition-colors flex flex-col md:flex-row items-center gap-6 group relative ${canEdit ? 'cursor-pointer hover:bg-maestro-700/50' : ''}`}
                        >
                             {canEdit && (
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); openEditTravel(item); }} className="p-1.5 bg-maestro-900 rounded text-slate-400 hover:text-white"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={(e) => handleDeleteTravel(e, item.id)} className="p-1.5 bg-maestro-900 rounded text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                </div>
                             )}
                            {/* Icon & Carrier */}
                            <div className="flex items-center gap-4 min-w-[200px]">
                                <div className="w-12 h-12 rounded-full bg-maestro-900 border border-maestro-700 flex items-center justify-center text-slate-300">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="font-bold text-white text-lg">{item.carrier}</div>
                                    <div className="text-sm text-maestro-accent font-mono">{item.number}</div>
                                    {item.confirmationNumber && (
                                        <div className="text-xs text-slate-400 font-mono mt-1">Ref: {item.confirmationNumber}</div>
                                    )}
                                </div>
                            </div>

                            {/* Route */}
                            <div className="flex-1 flex items-center gap-4 w-full">
                                <div className="flex-1 text-right">
                                    <div className="text-2xl font-bold text-white">{item.departureLocation}</div>
                                    <div className="text-xs text-slate-400">{item.departureTime}</div>
                                    <div className="text-[10px] text-slate-500">{item.departureDate}</div>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold">{item.type}</div>
                                    <ArrowRight className="w-5 h-5 text-slate-600" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="text-2xl font-bold text-white">{item.arrivalLocation}</div>
                                    <div className="text-xs text-slate-400">{item.arrivalTime}</div>
                                    <div className="text-[10px] text-slate-500">{item.arrivalDate}</div>
                                </div>
                            </div>
                            
                            {/* Notes Display */}
                            {item.notes && (
                                <div className="md:w-32 text-xs text-slate-400 italic border-l border-maestro-700 pl-4 hidden xl:block">
                                    "{item.notes}"
                                </div>
                            )}

                            {/* Actions */}
                            <div className="w-full md:w-auto flex md:flex-col gap-2">
                                <button onClick={(e) => e.stopPropagation()} className="flex-1 border border-maestro-700 hover:bg-maestro-700 text-slate-300 text-xs py-2 px-3 rounded">Ticket</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
      )}
    </div>
  );
};
