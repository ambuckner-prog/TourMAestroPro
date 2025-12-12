
import React, { useState } from 'react';
import { View } from '../types';
import { Shield, Zap, Users, ArrowRight, CheckCircle, Mail, MessageSquare } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: View) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`New Inquiry from ${form.name}`);
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}`);
    window.location.href = `mailto:info@worldtourmaster.com?subject=${subject}&body=${body}`;
  };

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-maestro-900 text-white font-sans overflow-y-auto">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto w-full relative z-20">
        <div className="flex items-center gap-2">
             <div className="bg-red-600 text-white p-1 rounded font-bold text-xl">TM</div>
             <span className="font-bold text-2xl tracking-tight uppercase">Tour Maestro Pro</span>
        </div>
        <div className="flex gap-4">
             <button onClick={() => onNavigate(View.LOGIN)} className="text-slate-300 hover:text-white font-medium">Log In</button>
             <button onClick={() => onNavigate(View.REGISTER)} className="bg-maestro-accent hover:bg-violet-600 px-5 py-2 rounded-full font-bold transition-transform hover:scale-105">
                Sign Up
             </button>
        </div>
      </nav>

      {/* Hero Section with Video Background */}
      <div className="relative">
        <div className="absolute inset-0 z-0 overflow-hidden h-[800px]">
            <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-full object-cover opacity-50 scale-105"
            >
                <source src="https://videos.pexels.com/video-files/2022395/2022395-hd_1920_1080_30fps.mp4" type="video/mp4" />
                {/* Fallback image if video fails to load */}
                <img 
                    src="https://images.unsplash.com/photo-1470229722913-7ea549c1c591?ixlib=rb-4.0.3&auto=format&fit=crop&w=2670&q=80" 
                    alt="Live Concert Stage" 
                    className="w-full h-full object-cover"
                />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-maestro-900/60 via-maestro-900/80 to-maestro-900"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center pt-32 pb-32 px-6">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-white drop-shadow-2xl">
                The Operating System for <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Live Touring.</span>
            </h1>
            <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
                Connect your artist, crew, and management in one centralized hub. 
                From logistics and day sheets to finance and AI-powered venue intelligence.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button onClick={() => onNavigate(View.REGISTER)} className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-red-900/50">
                    Start Free Trial <ArrowRight className="w-5 h-5" />
                </button>
                <button onClick={() => onNavigate(View.LOGIN)} className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white px-8 py-4 rounded-lg font-bold text-lg">
                    View Live Demo
                </button>
            </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-maestro-800 py-24 border-y border-maestro-700 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">Built for every role on the road</h2>
                <p className="text-slate-400">Granular permissions ensure your team sees exactly what they need.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="space-y-4">
                    <div className="bg-maestro-900 w-12 h-12 rounded-lg flex items-center justify-center border border-maestro-700">
                        <Users className="text-maestro-accent" />
                    </div>
                    <h3 className="text-xl font-bold">Tour Managers</h3>
                    <p className="text-slate-400 leading-relaxed">
                        Full control over itineraries, guest lists, and financials. Generate day sheets instantly and broadcast updates to mobile devices.
                    </p>
                </div>
                <div className="space-y-4">
                    <div className="bg-maestro-900 w-12 h-12 rounded-lg flex items-center justify-center border border-maestro-700">
                        <Shield className="text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold">Crew & Staff</h3>
                    <p className="text-slate-400 leading-relaxed">
                        Read-only access to schedules, hotel info, and travel details. Privacy controls ensure they only see their specific department data.
                    </p>
                </div>
                <div className="space-y-4">
                    <div className="bg-maestro-900 w-12 h-12 rounded-lg flex items-center justify-center border border-maestro-700">
                        <Zap className="text-maestro-gold" />
                    </div>
                    <h3 className="text-xl font-bold">AI Intelligence</h3>
                    <p className="text-slate-400 leading-relaxed">
                        Powered by Gemini. Ask questions about venue specs, generate local maps, and audit production budgets automatically.
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* Pricing / CTA */}
      <div className="max-w-4xl mx-auto py-24 px-6 text-center relative z-10">
        <h2 className="text-3xl font-bold mb-8">Ready to organize your chaos?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="bg-maestro-800 p-8 rounded-2xl border border-maestro-700">
                <h3 className="text-xl font-bold mb-2">Professional</h3>
                <div className="text-3xl font-bold mb-6">$49<span className="text-sm font-normal text-slate-400">/mo per user</span></div>
                <ul className="space-y-3 mb-8 text-slate-300">
                    <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> Unlimited Tours</li>
                    <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> Mobile App Access</li>
                    <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> Basic Reporting</li>
                </ul>
                <button onClick={() => onNavigate(View.REGISTER)} className="w-full bg-maestro-700 hover:bg-maestro-600 py-3 rounded-lg font-bold">Get Started</button>
            </div>
            <div className="bg-gradient-to-br from-maestro-800 to-indigo-900 p-8 rounded-2xl border border-maestro-accent relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-maestro-accent text-xs font-bold px-2 py-1 rounded uppercase">Best Value</div>
                <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                <div className="text-3xl font-bold mb-6">$89<span className="text-sm font-normal text-slate-300">/mo per user</span></div>
                <ul className="space-y-3 mb-8 text-slate-100">
                    <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-maestro-gold" /> AI Creative Studio</li>
                    <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-maestro-gold" /> Multi-Tour Dashboard</li>
                    <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-maestro-gold" /> Dedicated Support</li>
                </ul>
                <button onClick={scrollToContact} className="w-full bg-white text-maestro-900 hover:bg-slate-200 py-3 rounded-lg font-bold">Contact Sales</button>
            </div>
        </div>
      </div>

      {/* Contact Section */}
      <div id="contact" className="py-24 bg-maestro-900 relative z-10 border-t border-maestro-800">
        <div className="max-w-4xl mx-auto px-6">
            <div className="bg-maestro-800 rounded-2xl p-8 border border-maestro-700 shadow-2xl">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
                    <p className="text-slate-400">Questions about enterprise plans? We're here to help.</p>
                </div>
                <form onSubmit={handleContact} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-2">Name</label>
                            <input 
                                required
                                type="text" 
                                className="w-full bg-maestro-900 border border-maestro-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-maestro-accent outline-none"
                                value={form.name}
                                onChange={e => setForm({...form, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-2">Email</label>
                            <input 
                                required
                                type="email" 
                                className="w-full bg-maestro-900 border border-maestro-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-maestro-accent outline-none"
                                value={form.email}
                                onChange={e => setForm({...form, email: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-2">Message</label>
                        <textarea 
                            required
                            rows={4}
                            className="w-full bg-maestro-900 border border-maestro-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-maestro-accent outline-none"
                            value={form.message}
                            onChange={e => setForm({...form, message: e.target.value})}
                        ></textarea>
                    </div>
                    <button type="submit" className="w-full bg-white text-maestro-900 hover:bg-slate-200 font-bold py-4 rounded-lg transition-colors flex justify-center items-center gap-2">
                        <Mail className="w-5 h-5" /> Send Message
                    </button>
                    <p className="text-center text-xs text-slate-500 mt-4">
                        Emails are sent directly to info@worldtourmaster.com
                    </p>
                </form>
            </div>
        </div>
      </div>
      
      <footer className="bg-maestro-950 py-12 text-center text-slate-500 text-sm relative z-10">
        <p>&copy; 2030 Tour Maestro Pro. All rights reserved.</p>
      </footer>
    </div>
  );
};
