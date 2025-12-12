
import React, { useState } from 'react';
import { View, UserRole } from '../types';
import { useApp } from '../contexts/AppContext';
import { Lock, Mail, User, ArrowRight, ShieldCheck, HelpCircle, AlertCircle, Phone, Briefcase, CheckCircle } from 'lucide-react';

interface AuthProps {
  view: View.LOGIN | View.REGISTER;
  onNavigate: (view: View) => void;
}

export const Auth: React.FC<AuthProps> = ({ view, onNavigate }) => {
  const { login, register } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.TOUR_MANAGER);
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (view === View.LOGIN) {
      const result = login(email, password);
      if (!result.success) {
          setError(result.message || 'Login failed');
      }
    } else {
      if(password.length < 6) {
          setError("Password must be at least 6 characters.");
          return;
      }
      register(name, email, role, password, phone, jobTitle);
      setIsRegistrationComplete(true);
    }
  };

  // Quick Login Helpers for Demo
  const quickLogin = (r: UserRole, mail: string) => {
      // Updated demo password for Master Admin
      const pwd = r === UserRole.MASTER_ADMIN ? 'master admin' : 'password123';
      const result = login(mail, pwd);
      if(!result.success) setError(result.message || 'Quick login failed');
  };

  if (view === View.REGISTER && isRegistrationComplete) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-maestro-900 bg-[url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center">
            <div className="absolute inset-0 bg-maestro-900/90 backdrop-blur-sm"></div>
            <div className="relative z-10 bg-maestro-800 p-8 rounded-2xl shadow-2xl border border-maestro-700 w-full max-w-md text-center">
                <div className="bg-green-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Registration Received!</h2>
                <p className="text-slate-300 mb-6">
                    Thank you for signing up, <span className="font-bold text-white">{name}</span>. 
                </p>
                <div className="bg-maestro-900 p-4 rounded-lg border border-maestro-700 text-sm text-slate-400 mb-6">
                    <p className="mb-2">We have sent a confirmation email to <span className="text-maestro-accent">{email}</span>.</p>
                    <p>Your account is currently <strong>Pending Approval</strong>. You will receive a welcome email once our Master Admin approves your access.</p>
                </div>
                <button onClick={() => onNavigate(View.LOGIN)} className="w-full bg-maestro-accent hover:bg-violet-600 text-white font-bold py-3 rounded-lg transition-colors">
                    Back to Login
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-maestro-900 bg-[url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center">
      <div className="absolute inset-0 bg-maestro-900/90 backdrop-blur-sm"></div>
      
      <div className="relative z-10 bg-maestro-800 p-8 rounded-2xl shadow-2xl border border-maestro-700 w-full max-w-md my-8">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">{view === View.LOGIN ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="text-slate-400">Tour Maestro Pro Management Suite</p>
        </div>

        {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded flex items-center gap-2 text-red-200 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> <span className="flex-1">{error}</span>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            {view === View.REGISTER && (
                <>
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="Full Name"
                            value={name}
                            required
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-maestro-900 border border-maestro-700 text-white pl-10 p-3 rounded-lg focus:ring-1 focus:ring-maestro-accent outline-none"
                        />
                    </div>
                     <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                            <input 
                                type="text" 
                                placeholder="Job Title"
                                value={jobTitle}
                                required
                                onChange={(e) => setJobTitle(e.target.value)}
                                className="w-full bg-maestro-900 border border-maestro-700 text-white pl-10 p-3 rounded-lg focus:ring-1 focus:ring-maestro-accent outline-none text-sm"
                            />
                        </div>
                         <div className="relative">
                            <Phone className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                            <input 
                                type="text" 
                                placeholder="Phone"
                                value={phone}
                                required
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-maestro-900 border border-maestro-700 text-white pl-10 p-3 rounded-lg focus:ring-1 focus:ring-maestro-accent outline-none text-sm"
                            />
                        </div>
                    </div>
                </>
            )}
            <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                <input 
                    type="email" 
                    placeholder="Email Address"
                    value={email}
                    required
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-maestro-900 border border-maestro-700 text-white pl-10 p-3 rounded-lg focus:ring-1 focus:ring-maestro-accent outline-none"
                />
            </div>
            <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                <input 
                    type="password" 
                    placeholder="Password"
                    value={password}
                    required
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-maestro-900 border border-maestro-700 text-white pl-10 p-3 rounded-lg focus:ring-1 focus:ring-maestro-accent outline-none"
                />
            </div>

            {view === View.REGISTER && (
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">I am a...</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setRole(UserRole.TOUR_MANAGER)} className={`p-2 rounded border text-sm ${role === UserRole.TOUR_MANAGER ? 'bg-maestro-accent border-maestro-accent text-white' : 'border-maestro-700 text-slate-400'}`}>Tour Manager</button>
                        <button type="button" onClick={() => setRole(UserRole.CREW)} className={`p-2 rounded border text-sm ${role === UserRole.CREW ? 'bg-maestro-accent border-maestro-accent text-white' : 'border-maestro-700 text-slate-400'}`}>Crew Member</button>
                    </div>
                 </div>
            )}

            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2">
                {view === View.LOGIN ? 'Log In' : 'Submit Registration'} <ArrowRight className="w-4 h-4" />
            </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
            {view === View.LOGIN ? (
                <p>Don't have an account? <button onClick={() => onNavigate(View.REGISTER)} className="text-maestro-accent hover:underline">Sign up</button></p>
            ) : (
                <p>Already have an account? <button onClick={() => onNavigate(View.LOGIN)} className="text-maestro-accent hover:underline">Log in</button></p>
            )}
        </div>

        {/* Support Link */}
        <div className="mt-4 text-center">
            <a href="mailto:info@worldtourmaster.com" className="text-xs text-slate-500 hover:text-white flex items-center justify-center gap-1">
                <HelpCircle className="w-3 h-3" /> Need help? Email info@worldtourmaster.com
            </a>
        </div>

        {/* DEMO SHORTCUTS */}
        {view === View.LOGIN && (
            <div className="mt-6 pt-6 border-t border-maestro-700">
                <p className="text-xs text-center text-slate-500 mb-4 uppercase font-bold">Demo Access (Approved Accounts)</p>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => quickLogin(UserRole.MASTER_ADMIN, 'ambuckner@gmail.com')} className="text-xs bg-slate-700 hover:bg-slate-600 text-white p-2 rounded flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Master Admin
                    </button>
                    <button onClick={() => quickLogin(UserRole.TOUR_MANAGER, 'manager@band.com')} className="text-xs bg-slate-700 hover:bg-slate-600 text-white p-2 rounded flex items-center justify-center gap-1">
                        <User className="w-3 h-3" /> Manager
                    </button>
                    <button onClick={() => quickLogin(UserRole.CREW, 'crew@band.com')} className="text-xs bg-slate-700 hover:bg-slate-600 text-white p-2 rounded flex items-center justify-center gap-1">
                        <User className="w-3 h-3 opacity-50" /> Crew
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
