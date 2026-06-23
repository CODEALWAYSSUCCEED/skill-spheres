import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Home, User, Users, MessageSquare, LogOut, Menu, X, BookOpen,
  Newspaper, Phone
} from 'lucide-react';

type LayoutProps = {
  children: React.ReactNode;
  currentPage: 'home' | 'profile' | 'studios' | 'groups' | 'blog' | 'contact';
  onNavigate: (page: 'home' | 'profile' | 'studios' | 'groups' | 'blog' | 'contact') => void;
  onGoPublic?: () => void;
  onGoToBlog?: () => void;
  onGoToContact?: () => void;
};

function PiLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim =
    size === 'sm' ? 32 :
    size === 'lg' ? 80 :
    44;

  return (
    <svg
      viewBox="0 0 120 110"
      width={dim}
      height={Math.round(dim * 110 / 120)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
      aria-label="317 Solutions"
    >
      <defs>
        <radialGradient id="piRG" cx="38%" cy="22%" r="70%">
          <stop offset="0%" stopColor="#fffbe0" />
          <stop offset="15%" stopColor="#f5d86a" />
          <stop offset="45%" stopColor="#d4920c" />
          <stop offset="80%" stopColor="#a06800" />
          <stop offset="100%" stopColor="#6b4200" />
        </radialGradient>
        <filter id="piSh" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="1" dy="3" stdDeviation="3" floodColor="#00000055" />
        </filter>
      </defs>
      <rect x="6" y="12" width="108" height="14" rx="7" fill="url(#piRG)" filter="url(#piSh)" />
      <path
        d="M28 26 L28 78 C28 84 22 88 16 88 C12 88 9 86 9 86"
        stroke="url(#piRG)"
        strokeWidth="14"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#piSh)"
      />
      <path
        d="M80 26 L80 78 C80 84 86 88 92 88 C96 88 99 86 99 86"
        stroke="url(#piRG)"
        strokeWidth="14"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#piSh)"
      />
    </svg>
  );
}

export { PiLogo };

export function Layout({ children, currentPage, onNavigate, onGoToBlog, onGoToContact }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const appLinks = [
    { label: 'Curriculum', page: 'home' as const, icon: BookOpen },
    { label: 'Studios', page: 'studios' as const, icon: Users },
    { label: 'Groups', page: 'groups' as const, icon: MessageSquare },
    { label: 'Profile', page: 'profile' as const, icon: User },
    { label: 'Blog', page: 'blog' as const, icon: Newspaper },
    { label: 'Contact', page: 'contact' as const, icon: Phone },
  ];

  const primaryLinks = appLinks.slice(0, 4);
  const secondaryLinks = appLinks.slice(4);

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/8" style={{ background: 'rgba(15, 36, 96, 0.92)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[60px]">

            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <PiLogo size="md" />
              <div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-[0.85rem] font-extrabold text-white" style={{ letterSpacing: '-0.02em' }}>
                    317 Solutions
                  </span>
                </div>
                <span className="text-[0.6rem] font-semibold text-white/30 hidden sm:block" style={{ letterSpacing: '0.04em' }}>
                  COMMUNITY LEARNING PLATFORM
                </span>
              </div>
            </div>

            {/* Secondary nav (Blog / Contact) */}
            <nav className="hidden lg:flex items-center gap-0" aria-label="Secondary navigation">
              {secondaryLinks.map(({ label, page }) => (
                <button
                  key={page}
                  onClick={() => { if (page === 'blog') onGoToBlog?.(); else if (page === 'contact') onGoToContact?.(); }}
                  className={`px-4 py-2 text-[0.8125rem] font-semibold transition-colors relative group ${
                    currentPage === page ? 'text-amber-400' : 'text-white/50 hover:text-white'
                  }`}
                  style={{ letterSpacing: '-0.01em' }}
                >
                  {label}
                  <span className={`absolute bottom-0 left-4 right-4 h-px bg-amber-400 transition-opacity ${
                    currentPage === page ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
                  }`} />
                </button>
              ))}
            </nav>

            {/* App links + sign out */}
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {primaryLinks.map(({ label, page, icon: Icon }) => (
                  <button
                    key={page}
                    onClick={() => onNavigate(page)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[0.75rem] font-bold transition-all ${
                      currentPage === page
                        ? 'bg-amber-400 text-blue-900 shadow-sm'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/8'
                    }`}
                    style={{ letterSpacing: '-0.01em' }}
                    aria-current={currentPage === page ? 'page' : undefined}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-semibold text-white/40 hover:text-white/70 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Sign Out</span>
              </button>
            </div>

            {/* Mobile toggle */}
            <button
              className="md:hidden p-2 text-white/60 hover:text-white transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/8 mobile-menu-enter" style={{ background: 'rgba(10, 25, 75, 0.98)' }}>
            <div className="px-4 py-4 space-y-0.5">
              <p className="text-label text-amber-400/40 px-3 pb-2 pt-1">317 Solutions</p>
              {appLinks.map(({ label, page, icon: Icon }) => (
                <button
                  key={page}
                  onClick={() => { onNavigate(page); setMobileOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg transition-all text-left ${
                    currentPage === page
                      ? 'bg-amber-400/15 text-amber-300'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/6'
                  }`}
                  style={{ letterSpacing: '-0.01em' }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}

              <div className="border-t border-white/8 pt-2 mt-1">
                <button
                  onClick={() => { signOut(); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/40 hover:text-white/70 rounded-lg transition-all text-left"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* User bar */}
      {profile && (
        <div style={{ background: 'rgba(5, 15, 55, 0.35)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-900 font-black" style={{ fontSize: '0.6rem' }}>
                {profile.full_name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-white/70 text-xs font-semibold" style={{ letterSpacing: '-0.01em' }}>{profile.full_name}</span>
            <span className="text-label text-amber-400/50 capitalize" style={{ fontSize: '0.6rem', letterSpacing: '0.08em' }}>{profile.role}</span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-white/8" style={{ background: 'rgba(5, 15, 55, 0.6)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <PiLogo size="sm" />
                <div>
                  <p className="text-white font-extrabold text-sm" style={{ letterSpacing: '-0.02em' }}>317 Solutions</p>
                  <p className="text-amber-400/50 text-label" style={{ fontSize: '0.6rem' }}>Stop Knowing, Start Learning</p>
                </div>
              </div>
              <p className="text-white/35 text-xs leading-relaxed" style={{ letterSpacing: '-0.01em' }}>
                A community platform advancing AI, Technology, Engineering, Computer Science &amp; Mathematics education.
              </p>
            </div>
            <div>
              <p className="text-label text-white/35 mb-4" style={{ fontSize: '0.6rem' }}>NAVIGATE</p>
              <div className="space-y-2">
                {primaryLinks.map(({ label, page, icon: Icon }) => (
                  <button
                    key={page}
                    onClick={() => onNavigate(page)}
                    className="flex items-center gap-2 text-white/40 hover:text-amber-400 text-xs font-medium transition-colors"
                    style={{ letterSpacing: '-0.01em' }}
                  >
                    <Icon className="w-3 h-3" /> {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-label text-white/35 mb-4" style={{ fontSize: '0.6rem' }}>CONTACT</p>
              <div className="space-y-2 text-xs text-white/40">
                <a href="tel:xxxxxxxxxx" className="flex items-center gap-2 hover:text-amber-400 transition-colors font-semibold">
                  <Phone className="w-3 h-3" /> xxx-xxx-xxxx
                </a>
                <p>Evenings &amp; Weekends</p>
                <p>1-on-1 &amp; Small Groups</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/8 pt-6 text-center">
            <p className="text-white/25 text-xs" style={{ letterSpacing: '-0.01em' }}>
              &copy; {new Date().getFullYear()} 317 Solutions. Powered by Community Learning.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
