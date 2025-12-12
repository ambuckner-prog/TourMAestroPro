
import React, { useState } from 'react';
import { View, UserRole } from '../types';
import { useApp } from '../contexts/AppContext';
import { Lock, Mail, User, ArrowRight, ShieldCheck, HelpCircle, AlertCircle, Phone, Briefcase, CheckCircle, KeyRound, ChevronLeft } from 'lucide-react';

interface AuthProps {
  view: View.LOGIN | View.REGISTER;
  onNavigate: (view: View) => void;
}

export const Auth: React.FC<AuthProps> = ({ view, onNavigate }) => {
  const { login, register, resetPassword } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.TOUR_MANAGER);
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(false);

  // Password Reset State
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetSent, setIsResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (view === View.LOGIN) {
      const result = await login(email, password);
      if (!result.success) {
          setError(result.message || 'Login failed');
      }
    } else {
      if(password.length < 6) {
          setError("Password must be at least 6 characters.");
          return;
      }
      const result = await register(name, email, role, password, phone, jobTitle);
      if (result.success) {
          setIsRegistrationComplete(true);
      } else {
          setError(result.message || "Registration failed. Please try again.");
      }
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!resetEmail) {
          setError("Please enter your email address.");
          return;
      }
      
      // Use the context function to trigger the "email"
      await resetPassword(resetEmail);
      
      setIsResetSent(true);
      setError(null);
  };

  // Pre-fill form for demo purposes
  const prefillDemo = (r: UserRole, mail: string) => {
      let pwd = 'password123'; // Default
      
      setEmail(mail);
      setPassword(pwd);
      setError(null); // Clear errors
  };

  // --- RENDER: REGISTRATION SUCCESS ---
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

  // --- RENDER: PASSWORD RESET ---
  if (view === View.LOGIN && isResetMode) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-maestro-900 bg-[url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center">
            <div className="absolute inset-0 bg-maestro-900/90 backdrop-blur-sm"></div>
            <div className="relative z-10 bg-maestro-800 p-8 rounded-2xl shadow-2xl border border-maestro-700 w-full max-w-md my-8">
                <button onClick={() => { setIsResetMode(false); setIsResetSent(false); setError(null); }} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm mb-4">
                    <ChevronLeft className="w-4 h-4" /> Back to Login
                </button>
                
                <div className="text-center mb-6">
                    <div className="bg-maestro-accent/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <KeyRound className="w-6 h-6 text-maestro-accent" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Reset Password</h2>
                    <p className="text-slate-400 text-sm mt-2">Enter your email and we'll send you a link to reset your password.</p>
                </div>

                {isResetSent ? (
                    <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg text-center animate-fadeIn">
                        <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                        <h3 className="text-white font-bold mb-1">Link Sent!</h3>
                        <p className="text-sm text-slate-300">
                            We have sent a password reset link to <span className="text-white font-bold">{resetEmail}</span>.
                        </p>
                        <p className="text-xs text-slate-500 mt-4">
                            Please check your inbox (and spam folder) and click the link to create a new password.
                        </p>
                        
                        {/* Simulation Output Box */}
                        <div className="mt-6 p-4 bg-maestro-900 rounded border border-maestro-700 text-left relative overflow-hidden">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-2 border-b border-maestro-700 pb-1 flex justify-between">
                                <span>Simulated Email Preview</span>
                                <span>[System Log]</span>
                            </div>
                            <div className="text-xs font-mono text-slate-300 space-y-1">
                                <div><span className="text-slate-500">To:</span> <span className="text-maestro-accent">{resetEmail}</span></div>
                                <div><span className="text-slate-500">Subject:</span> Password Reset Request</div>
                                <div className="pt-2 text-slate-400">
                                    Hello {resetEmail.split('@')[0]},<br/>
                                    We received a request to reset your password.<br/>
                                    <span className="text-blue-400 underline decoration-dotted">https://app.tourmaestro.com/reset-token=...</span>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => { setIsResetMode(false); setIsResetSent(false); }} className="mt-6 w-full bg-maestro-700 hover:bg-maestro-600 text-white py-2 rounded text-sm font-bold">
                            Return to Login
                        </button>
                    </div>
                ) : (
                    <>
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                            <input 
                                type="email" 
                                placeholder="Enter your email address"
                                value={resetEmail}
                                required
                                onChange={(e) => setResetEmail(e.target.value)}
                                className="w-full bg-maestro-900 border border-maestro-700 text-white pl-10 p-3 rounded-lg focus:ring-1 focus:ring-maestro-accent outline-none"
                            />
                        </div>
                        {error && (
                            <div className="p-3 bg-red-900/50 border border-red-500/50 rounded flex items-center gap-2 text-red-200 text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" /> <span className="flex-1">{error}</span>
                            </div>
                        )}
                        <button type="submit" className="w-full bg-maestro-accent hover:bg-violet-600 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2">
                            Send Reset Link
                        </button>
                    </form>
                    
                    {/* Quick Fill for Testing */}
                    <div className="mt-6 pt-4 border-t border-maestro-700 text-center">
                         <p className="text-xs text-slate-500 mb-2 uppercase font-bold">Quick Fill (Test)</p>
                         <button 
                             type="button" 
                             onClick={() => setResetEmail('ambuckner@gmail.com')}
                             className="text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white px-3 py-2 rounded transition-colors flex items-center justify-center gap-2 mx-auto"
                         >
                             <ShieldCheck className="w-3 h-3 text-maestro-gold" /> Master Admin (ambuckner@gmail.com)
                         </button>
                     </div>
                    </>
                )}
            </div>
        </div>
    );
  }

  // --- RENDER: LOGIN / REGISTER FORM ---
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
            <div>
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
                {view === View.LOGIN && (
                    <div className="text-right mt-2">
                        <button type="button" onClick={() => { setIsResetMode(true); setResetEmail(email); setError(null); }} className="text-xs text-maestro-accent hover:text-white transition-colors">
                            Forgot Password?
                        </button>
                    </div>
                )}
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
                <p className="text-xs text-center text-slate-500 mb-4 uppercase font-bold">Quick Fill (Demo Access)</p>
                <div className="grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => prefillDemo(UserRole.MASTER_ADMIN, 'ambuckner@gmail.com')} className="text-xs bg-red-900/30 border border-red-900/50 hover:bg-red-900/50 text-red-200 p-2 rounded flex items-center justify-center gap-1 transition-colors">
                        <ShieldCheck className="w-3 h-3" /> Master
                    </button>
                    <button type="button" onClick={() => prefillDemo(UserRole.TOUR_MANAGER, 'manager@band.com')} className="text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white p-2 rounded flex items-center justify-center gap-1 transition-colors">
                        <User className="w-3 h-3" /> Manager
                    </button>
                    <button type="button" onClick={() => prefillDemo(UserRole.CREW, 'crew@band.com')} className="text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white p-2 rounded flex items-center justify-center gap-1 transition-colors">
                        <User className="w-3 h-3 opacity-50" /> Crew
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
