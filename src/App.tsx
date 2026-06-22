import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { AuthForm, ResetPasswordForm } from './components/AuthForm';
import { Home } from './pages/Home';
import { Groups } from './pages/Groups';
import { LearningGroups } from './pages/LearningGroups';
import { Profile } from './pages/Profile';
import { SkillDetail } from './pages/SkillDetail';
import { ContactPage } from './pages/ContactPage';
import { BlogPage } from './pages/BlogPage';
import { PublicLanding } from './pages/PublicLanding';
import ChatBot from './components/ChatBot';

type Page = 'home' | 'profile' | 'studios' | 'groups' | 'blog' | 'contact';

function AppInner() {
  const { user, loading, isPasswordRecovery } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [showPublic, setShowPublic] = useState(true);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [showingContact, setShowingContact] = useState(false);
  const [showingBlog, setShowingBlog] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60 text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  if (isPasswordRecovery) {
    return <ResetPasswordForm />;
  }

  if (!user) {
    if (showingContact) {
      return (
        <div className="min-h-screen py-12 px-4 max-w-4xl mx-auto">
          <ContactPage onBack={() => setShowingContact(false)} />
        </div>
      );
    }
    if (showingBlog) {
      return (
        <div className="min-h-screen py-12 px-4 max-w-5xl mx-auto">
          <BlogPage onBack={() => setShowingBlog(false)} />
        </div>
      );
    }
    if (!showPublic) {
      return <AuthForm onGoPublic={() => setShowPublic(true)} />;
    }
    return (
      <PublicLanding
        onGetStarted={() => setShowPublic(false)}
        onGoToBlog={() => setShowingBlog(true)}
        onMemberLogin={() => setShowPublic(false)}
      />
    );
  }

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    setSelectedSkillId(null);
  };

  const renderContent = () => {
    if (selectedSkillId) {
      return (
        <SkillDetail
          skillId={selectedSkillId}
          onBack={() => setSelectedSkillId(null)}
          onViewResources={(id) => setSelectedSkillId(id)}
        />
      );
    }

    switch (currentPage) {
      case 'home':
        return <Home onSelectSkill={(id) => setSelectedSkillId(id)} />;
      case 'studios':
        return <Groups />;
      case 'groups':
        return <LearningGroups />;
      case 'profile':
        return <Profile />;
      case 'blog':
        return <BlogPage />;
      case 'contact':
        return <ContactPage />;
      default:
        return <Home onSelectSkill={(id) => setSelectedSkillId(id)} />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onGoToBlog={() => setCurrentPage('blog')}
      onGoToContact={() => setCurrentPage('contact')}
    >
      {renderContent()}
      <ChatBot />
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
