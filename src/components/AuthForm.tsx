import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserPlus, ArrowLeft, Mail, CheckCircle, KeyRound, ShieldCheck } from 'lucide-react';
import { PiLogo } from './Layout';

type AuthFormProps = {
  onGoPublic?: () => void;
};

type Screen = 'login' | 'signup' | 'forgot' | 'verify' | 'reset-sent';

export function AuthForm({ onGoPublic }: AuthFormProps) {
  const [screen, setScreen] = useState<Screen>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle, sendPasswordReset } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { needsVerification } = await signUp(email, password, fullName, 'learner');
      if (needsVerification) setScreen('verify');
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setScreen('reset-sent');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const cardClass = 'bg-white/8 backdrop-blur-md rounded-2xl border border-white/15 shadow-2xl overflow-hidden';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 25%, #2563eb 50%, #3b82f6 75%, #60a5fa 100%)' }}>
      <header className="px-6 py-4 border-b border-white/10 bg-blue-900/40 flex items-center justify-between">
        <button onClick={onGoPublic} className="flex items-center gap-2.5 hover:opacity-90 transition-opacity" aria-label="317 Solutions Home">
          <PiLogo size="sm" />
          <span className="text-base font-black text-white">317 Solutions</span>
        </button>
        {onGoPublic && (
          <button onClick={onGoPublic} className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to site
          </button>
        )}
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Verification sent */}
          {screen === 'verify' && (
            <div className={cardClass}>
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-amber-400/20 border-2 border-amber-400/40 flex items-center justify-center mx-auto mb-5">
                  <Mail className="w-8 h-8 text-amber-300" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">Check Your Email</h2>
                <p className="text-blue-200/80 text-sm leading-relaxed mb-2">
                  We sent a confirmation link to <span className="text-amber-300 font-semibold">{email}</span>.
                </p>
                <p className="text-blue-200/60 text-sm mb-6">Click the link in the email to activate your account, then come back here to sign in.</p>
                <button
                  onClick={() => setScreen('login')}
                  className="w-full bg-amber-400 hover:bg-amber-500 text-blue-900 font-black py-3 rounded-xl transition text-sm"
                >
                  Go to Sign In
                </button>
                <p className="text-blue-300/50 text-xs mt-4">Didn't receive it? Check your spam folder or try signing up again.</p>
              </div>
            </div>
          )}

          {/* Reset sent */}
          {screen === 'reset-sent' && (
            <div className={cardClass}>
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-400/20 border-2 border-green-400/40 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-8 h-8 text-green-300" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">Reset Email Sent</h2>
                <p className="text-blue-200/80 text-sm leading-relaxed mb-6">
                  A password reset link has been sent to <span className="text-amber-300 font-semibold">{email}</span>. Follow the link to set a new password.
                </p>
                <button
                  onClick={() => setScreen('login')}
                  className="w-full bg-amber-400 hover:bg-amber-500 text-blue-900 font-black py-3 rounded-xl transition text-sm"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* Forgot password */}
          {screen === 'forgot' && (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1.5 bg-amber-400/15 border border-amber-400/30 rounded-full px-3 py-1 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-amber-300 text-xs font-semibold tracking-wide">Password Reset</span>
                </div>
                <h1 className="text-2xl font-black text-white mb-1.5">Forgot Your Password?</h1>
                <p className="text-blue-200/80 text-sm">Enter your email and we'll send you a reset link.</p>
              </div>
              <div className={cardClass}>
                <form onSubmit={handleForgot} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-blue-200 mb-1.5 uppercase tracking-wide">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-white/10 border border-white/15 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all text-sm"
                      placeholder="you@example.com"
                    />
                  </div>
                  {error && (
                    <div className="bg-red-500/15 border border-red-400/30 text-red-200 px-4 py-3 rounded-xl text-sm">{error}</div>
                  )}
                  <button type="submit" disabled={loading} className="w-full bg-amber-400 hover:bg-amber-500 text-blue-900 font-black py-3 rounded-xl transition text-sm disabled:opacity-50">
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                  <button type="button" onClick={() => { setScreen('login'); setError(''); }} className="w-full text-blue-300/60 hover:text-white text-sm transition flex items-center justify-center gap-1.5">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                  </button>
                </form>
              </div>
            </>
          )}

          {/* Login / Signup */}
          {(screen === 'login' || screen === 'signup') && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-1.5 bg-amber-400/15 border border-amber-400/30 rounded-full px-3 py-1 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-amber-300 text-xs font-semibold tracking-wide">317 Solutions Platform</span>
                </div>
                <h1 className="text-2xl font-black text-white mb-1.5">
                  {screen === 'login' ? 'Sign In to 317 Solutions' : 'Create Your Account'}
                </h1>
                <p className="text-blue-200/80 text-sm">
                  {screen === 'login' ? 'Access your learning dashboard' : 'Join the 317 Solutions community'}
                </p>
              </div>

              <div className={cardClass}>
                <div className="flex border-b border-white/10">
                  <button
                    onClick={() => { setScreen('login'); setError(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-all duration-200 ${screen === 'login' ? 'bg-amber-400 text-blue-900' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                  >
                    <LogIn className="w-4 h-4" /> Sign In
                  </button>
                  <button
                    onClick={() => { setScreen('signup'); setError(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-all duration-200 ${screen === 'signup' ? 'bg-amber-400 text-blue-900' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                  >
                    <UserPlus className="w-4 h-4" /> Sign Up
                  </button>
                </div>

                <div className="px-6 pt-6 pb-2">
                  <button
                    type="button"
                    onClick={async () => { setError(''); setLoading(true); try { await signInWithGoogle(); } catch (err: any) { setError(err.message || 'Google sign-in failed'); setLoading(false); } }}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-bold py-2.5 rounded-xl transition-all shadow-sm border border-gray-200 disabled:opacity-50 text-sm"
                  >
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>
                  <div className="flex items-center gap-3 mt-4 mb-1">
                    <div className="flex-1 h-px bg-white/15" />
                    <span className="text-white/35 text-xs font-medium">or</span>
                    <div className="flex-1 h-px bg-white/15" />
                  </div>
                </div>

                <form onSubmit={screen === 'login' ? handleSignIn : handleSignUp} className="px-6 pb-6 space-y-4">
                  {screen === 'signup' && (
                    <div>
                      <label className="block text-xs font-semibold text-blue-200 mb-1.5 uppercase tracking-wide">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-white/10 border border-white/15 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all text-sm"
                        placeholder="Enter your full name"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-blue-200 mb-1.5 uppercase tracking-wide">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-white/10 border border-white/15 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all text-sm"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-blue-200 uppercase tracking-wide">Password</label>
                      {screen === 'login' && (
                        <button
                          type="button"
                          onClick={() => { setScreen('forgot'); setError(''); }}
                          className="text-xs text-amber-300/70 hover:text-amber-300 transition flex items-center gap-1"
                        >
                          <KeyRound className="w-3 h-3" /> Forgot password?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-2.5 bg-white/10 border border-white/15 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all text-sm"
                      placeholder="••••••••"
                    />
                    {screen === 'signup' && (
                      <p className="text-blue-300/50 text-xs mt-1.5">Minimum 6 characters. A verification email will be sent after signup.</p>
                    )}
                  </div>

                  {error && (
                    <div className="bg-red-500/15 border border-red-400/30 text-red-200 px-4 py-3 rounded-xl text-sm">{error}</div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber-400 hover:bg-amber-500 text-blue-900 font-black py-3 rounded-xl transition-all shadow-lg disabled:opacity-50 text-sm tracking-wide"
                  >
                    {loading ? 'Please wait...' : screen === 'login' ? 'Sign In to 317 Solutions' : 'Create Account'}
                  </button>
                </form>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2.5">
                {['1-on-1 & Small Groups', 'SAT/ACT/AP Coaching', 'Evenings & Weekends'].map((item) => (
                  <div key={item} className="bg-white/5 border border-white/8 rounded-xl px-2.5 py-2 text-center">
                    <p className="text-blue-200/60 text-xs font-medium leading-tight">{item}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function ResetPasswordForm() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError('');
    setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const cardClass = 'bg-white/8 backdrop-blur-md rounded-2xl border border-white/15 shadow-2xl overflow-hidden';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 25%, #2563eb 50%, #3b82f6 75%, #60a5fa 100%)' }}>
      <header className="px-6 py-4 border-b border-white/10 bg-blue-900/40 flex items-center">
        <PiLogo size="sm" />
        <span className="text-base font-black text-white ml-2.5">317 Solutions</span>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {done ? (
            <div className={cardClass}>
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-400/20 border-2 border-green-400/40 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-8 h-8 text-green-300" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">Password Updated</h2>
                <p className="text-blue-200/80 text-sm mb-6">Your password has been changed. You are now signed in.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1.5 bg-amber-400/15 border border-amber-400/30 rounded-full px-3 py-1 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-amber-300 text-xs font-semibold tracking-wide">Set New Password</span>
                </div>
                <h1 className="text-2xl font-black text-white mb-1.5">Choose a New Password</h1>
                <p className="text-blue-200/80 text-sm">Enter and confirm your new password below.</p>
              </div>
              <div className={cardClass}>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-blue-200 mb-1.5 uppercase tracking-wide">New Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-2.5 bg-white/10 border border-white/15 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-blue-200 mb-1.5 uppercase tracking-wide">Confirm Password</label>
                    <input
                      type="password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-2.5 bg-white/10 border border-white/15 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                  {error && (
                    <div className="bg-red-500/15 border border-red-400/30 text-red-200 px-4 py-3 rounded-xl text-sm">{error}</div>
                  )}
                  <button type="submit" disabled={loading} className="w-full bg-amber-400 hover:bg-amber-500 text-blue-900 font-black py-3 rounded-xl transition text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
