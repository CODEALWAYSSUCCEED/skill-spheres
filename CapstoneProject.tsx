import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatBot } from './components/ChatBot';
import { AuthForm, ResetPasswordForm } from './components/AuthForm';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { CategoryView } from './pages/CategoryView';
import { SkillDetail } from './pages/SkillDetail';
import { SkillResourcesPage } from './pages/SkillResourcesPage';
import { Profile } from './pages/Profile';
import { Groups } from './pages/Groups';
import { LearningGroups } from './pages/LearningGroups';
import { BlogPage } from './pages/BlogPage';
import { ContactPage } from './pages/ContactPage';

type ViewState =
  | { type: 'home' }
  | { type: 'category'; category: string; stage: string }
  | { type: 'skill'; skillId: string }
  | { type: 'skillResources'; skillId: string };

function AppContent() {
  const { user, loading, isPasswordRecovery } = useAuth();
  const [currentPage, setCurrentPage] = useState<'home' | 'profile' | 'studios' | 'groups' | 'blog' | 'contact'>('home');
  const [viewState, setViewState] = useState<ViewState>({ type: 'home' });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 25%, #2563eb 50%, #3b82f6 75%, #60a5fa 100%)' }}>
        <div className="flex flex-col items-center gap-3">
          <svg viewBox="0 0 120 110" width="88" height="80" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-pulse drop-shadow-2xl">
            <defs>
              <radialGradient id="piRGLoad" cx="38%" cy="22%" r="70%">
                <stop offset="0%" stopColor="#fffbe0" />
                <stop offset="15%" stopColor="#f5d86a" />
                <stop offset="45%" stopColor="#d4920c" />
                <stop offset="80%" stopColor="#a06800" />
                <stop offset="100%" stopColor="#6b4200" />
              </radialGradient>
              <filter id="piShLoad" x="-20%" y="-20%" width="140%" height="150%">
                <feDropShadow dx="1" dy="3" stdDeviation="3" floodColor="#00000055" />
              </filter>
            </defs>
            <rect x="6" y="12" width="108" height="14" rx="7" fill="url(#piRGLoad)" filter="url(#piShLoad)" />
            <path d="M28 26 L28 78 C28 84 22 88 16 88 C12 88 9 86 9 86" stroke="url(#piRGLoad)" strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#piShLoad)" />
            <path d="M80 26 L80 78 C80 84 86 88 92 88 C96 88 99 86 99 86" stroke="url(#piRGLoad)" strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#piShLoad)" />
          </svg>
          <p className="text-blue-200 font-semibold text-sm">Loading Skill Sphere...</p>
        </div>
      </div>
    );
  }

  if (isPasswordRecovery) {
    return <ResetPasswordForm />;
  }

  if (!user) {
    return <AuthForm onGoPublic={() => {}} />;
  }

  const handleSelectCategory = (category: string, stage: string) => {
    setViewState({ type: 'category', category, stage });
  };

  const handleSelectSkill = (skillId: string) => {
    setViewState({ type: 'skill', skillId });
  };

  const handleViewSkillResources = (skillId: string) => {
    setViewState({ type: 'skillResources', skillId });
  };

  const handleBackToHome = () => {
    setViewState({ type: 'home' });
  };

  const handleBackToSkill = (skillId: string) => {
    setViewState({ type: 'skill', skillId });
  };

  const handleNavigate = (page: 'home' | 'profile' | 'studios' | 'groups' | 'blog' | 'contact') => {
    setCurrentPage(page);
    if (page === 'home' || page === 'profile' || page === 'studios' || page === 'groups') {
      setViewState({ type: 'home' });
    }
  };

  const renderContent = () => {
    if (currentPage === 'profile') return <Profile />;
    if (currentPage === 'studios') return <Groups />;
    if (currentPage === 'groups') return <LearningGroups />;
    if (currentPage === 'blog') return <BlogPage onBack={() => handleNavigate('home')} />;
    if (currentPage === 'contact') return <ContactPage />;

    if (viewState.type === 'skillResources') {
      return <SkillResourcesPage skillId={viewState.skillId} onBack={() => handleBackToSkill(viewState.skillId)} />;
    }
    if (viewState.type === 'skill') {
      return <SkillDetail skillId={viewState.skillId} onBack={handleBackToHome} onViewResources={handleViewSkillResources} />;
    }
    if (viewState.type === 'category') {
      return (
        <CategoryView
          category={viewState.category}
          stage={viewState.stage}
          onBack={handleBackToHome}
          onSelectSkill={handleSelectSkill}
        />
      );
    }
    return <Home onSelectSkill={handleSelectSkill} onSelectCategory={handleSelectCategory} onNavigate={handleNavigate} />;
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onGoPublic={() => {}}
      onGoToBlog={() => handleNavigate('blog')}
      onGoToContact={() => handleNavigate('contact')}
    >
      {renderContent()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <ChatBot />
    </AuthProvider>
  );
}

export default App;
