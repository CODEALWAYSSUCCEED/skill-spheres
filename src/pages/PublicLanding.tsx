import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Menu, X, Phone, GraduationCap, Users, Brain, Trophy,
  Globe, Target, Calculator, Code2, CheckCircle, ArrowRight,
  BookOpen, Clock, Star, ChevronDown, Calendar, Send, MapPin, Mail
} from 'lucide-react';
import { PiLogo } from '../components/Layout';
import ChatBot from '../components/ChatBot';

type PublicLandingProps = {
  onGetStarted: () => void;
  onGoToBlog?: () => void;
  onMemberLogin?: () => void;
};

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  cover_image_url: string;
  read_time_minutes: number;
  created_at: string;
  featured: boolean;
};

const services = [
  { icon: Users, title: 'Classroom Tutoring', subtitle: '1-on-1 or Small Groups', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/25' },
  { icon: Brain, title: 'Skill Enrichment', subtitle: 'Next Generation Programs', color: 'text-blue-300', bg: 'bg-blue-400/10 border-blue-400/25' },
  { icon: BookOpen, title: 'School Tutoring', subtitle: 'Elementary, Middle & High School', color: 'text-green-300', bg: 'bg-green-400/10 border-green-400/25' },
  { icon: Trophy, title: 'SAT / ACT / AP Coaching', subtitle: 'Test Preparation & Strategy', color: 'text-orange-300', bg: 'bg-orange-400/10 border-orange-400/25' },
  { icon: Globe, title: 'Student Meet-ups & Bootcamps', subtitle: 'Collaborative Learning Groups', color: 'text-cyan-300', bg: 'bg-cyan-400/10 border-cyan-400/25' },
  { icon: Target, title: 'Executive Coaching', subtitle: 'Leadership Development', color: 'text-rose-300', bg: 'bg-rose-400/10 border-rose-400/25' },
];

const mathTopics = ['Arithmetic / Geometry', 'Algebra / Trigonometry', 'Pre-Calculus / Calculus', 'AP-Calculus / AP Statistics', 'Discrete Mathematics', 'Linear Algebra'];
const csTopics = ['Coding Skills', 'Data Science', 'Machine Learning', 'Cloud Computing'];
const aiTopics = ['Generative AI', 'Prompt Engineering', 'AI Systems Design', 'Responsible AI'];
const techTopics = ['Cybersecurity', 'Cloud Architecture', 'DevOps', 'Systems Thinking'];

const whyUs = [
  'Research & innovation-driven curriculum built for real-world skill development',
  'AI & Technology research-backed curriculum',
  'Flexible scheduling: evenings and weekends',
  'School, college & professional learners welcome',
  'Community-driven, peer-supported learning',
];

const categoryColors: Record<string, string> = {
  'Mathematics': 'bg-amber-400/20 text-amber-300 border-amber-400/30',
  'Computer Science': 'bg-blue-400/20 text-blue-300 border-blue-400/30',
  'AI & Technology': 'bg-green-400/20 text-green-300 border-green-400/30',
  'Test Prep': 'bg-orange-400/20 text-orange-300 border-orange-400/30',
  'Community': 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30',
};

const contactServices = [
  '1-on-1 Classroom Tutoring', 'Small Group Tutoring',
  'SAT / ACT Coaching', 'AP Exam Coaching',
  'Skill Enrichment Program', 'Executive Coaching',
  'Student Meet-up Groups', 'Bootcamp', 'Other',
];

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const navLinks = [
  { label: 'Home', anchor: 'home' },
  { label: 'Services', anchor: 'services' },
  { label: 'About', anchor: 'about' },
  { label: 'Blog', anchor: 'blog' },
  { label: 'Contact', anchor: 'contact' },
];


export function PublicLanding({ onGetStarted, onGoToBlog, onMemberLogin }: PublicLandingProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', service_interest: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState('');

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, category, cover_image_url, read_time_minutes, created_at, featured')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => { if (data) setRecentPosts(data); });
  }, []);

  const handleNav = (anchor: string) => {
    setMobileOpen(false);
    scrollToSection(anchor);
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setContactForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError('');
    setContactLoading(true);
    try {
      const { error } = await supabase.from('contact_inquiries').insert({
        name: contactForm.name,
        email: contactForm.email,
        phone: contactForm.phone,
        message: contactForm.message,
        service_interest: contactForm.service_interest,
        subject: `Inquiry from ${contactForm.name}`,
        status: 'new',
      });
      if (error) throw error;

      // Send email notification (fire and forget, don't block on failure)
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          phone: contactForm.phone,
          subject: `Inquiry from ${contactForm.name}`,
          message: contactForm.message,
          service_interest: contactForm.service_interest,
        }),
      }).catch(() => {});

      setContactSubmitted(true);
    } catch (err: any) {
      setContactError(err.message || 'Something went wrong. Please call us directly.');
    } finally {
      setContactLoading(false);
    }
  };

  const faqs = [
    { q: 'Who is 317 Solutions for?', a: 'We serve school and college students looking to build CS and Math skills, as well as professionals seeking executive coaching and AI literacy. Evenings and weekends make it accessible for everyone.' },
    { q: 'What drives 317 Solutions\' curriculum?', a: 'Our curriculum is grounded in ongoing research and innovation, continuously evolving to reflect the latest advances in AI, technology, and STEM, ensuring learners build skills that are relevant, practical, and future-ready.' },
    { q: 'How do I get started?', a: 'Call us at xxx-xxx-xxxx or click "Get Started Today" to create an account. Sessions are available evenings and weekends, 1-on-1 or in small groups.' },
    { q: 'What subjects do you cover?', a: 'We cover Mathematics (Arithmetic through Linear Algebra, AP courses), Computer Science (Coding, Data Science, Machine Learning), Artificial Intelligence (Generative AI, Prompt Engineering, AI Systems), and Technology & Engineering (Cybersecurity, Cloud, DevOps).' },
    { q: 'What is the learning platform?', a: 'Our interactive learning platform lets enrolled students and mentors track skill progression, complete capstone projects, access curated resources, and collaborate in problem studios.' },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/8 shadow-none" style={{ background: 'rgba(15, 36, 96, 0.92)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[60px]">
            <button onClick={() => handleNav('home')} className="flex items-center gap-3 hover:opacity-85 transition-opacity">
              <PiLogo size="md" />
              <div className="leading-none">
                <span className="text-base font-extrabold text-white block" style={{ letterSpacing: '-0.02em' }}>317 Solutions</span>
                <span className="hidden sm:block text-amber-400/60" style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Stop Knowing, Start Learning</span>
              </div>
            </button>

            <nav className="hidden md:flex items-center gap-0" aria-label="Main navigation">
              {navLinks.map(({ label, anchor }) => (
                <button
                  key={label}
                  onClick={() => handleNav(anchor)}
                  className="relative px-4 py-2 text-[0.8125rem] font-semibold text-white/60 hover:text-white transition-colors group"
                  style={{ letterSpacing: '-0.01em' }}
                >
                  {label}
                  <span className="absolute bottom-0 left-4 right-4 h-px bg-amber-400 opacity-0 group-hover:opacity-40 transition-opacity" />
                </button>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-2">
              <a href="tel:xxxxxxxxxx" className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200 text-sm font-semibold transition-colors">
                <Phone className="w-3.5 h-3.5" /> xxx-xxx-xxxx
              </a>
              <button
                onClick={() => scrollToSection('contact')}
                className="bg-amber-400 hover:bg-amber-500 text-blue-900 font-black px-4 py-2 rounded-lg text-sm transition-all shadow-lg shadow-amber-400/20 hover:scale-105 flex items-center gap-1.5"
              >
                Get Started
              </button>
            </div>

            <button
              className="md:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-white/8 mobile-menu-enter" style={{ background: 'rgba(10, 25, 75, 0.98)' }}>
            <div className="px-4 py-4 space-y-0.5">
              {navLinks.map(({ label, anchor }) => (
                <button key={label} onClick={() => handleNav(anchor)}
                  className="w-full text-left px-3 py-2.5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/6 rounded-lg block"
                  style={{ letterSpacing: '-0.01em' }}>
                  {label}
                </button>
              ))}
              <div className="border-t border-white/10 pt-3 mt-3 space-y-2">
                <a href="tel:xxxxxxxxxx" className="flex items-center gap-2 px-3 py-2 text-amber-300 font-semibold text-sm">
                  <Phone className="w-4 h-4" /> xxx-xxx-xxxx
                </a>
<button onClick={() => { scrollToSection('contact'); setMobileOpen(false); }}
                  className="w-full bg-amber-400 text-blue-900 font-black py-2.5 rounded-lg text-sm flex items-center justify-center gap-2">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* HOME */}
      <section id="home" className="relative pt-4 sm:pt-8 pb-10 sm:pb-20 px-4 overflow-hidden scroll-mt-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,_rgba(245,158,11,0.07),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,_rgba(59,130,246,0.15),_transparent_50%)]" />
        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/30 rounded-full px-3 sm:px-4 py-1.5 mb-4 sm:mb-6">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                <span className="text-amber-300 text-xs sm:text-sm font-semibold">Community Learning Platform</span>
              </div>
              <h1 className="text-white mb-4 sm:mb-5" style={{ fontSize: 'clamp(1.75rem, 8vw, 4.25rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                Stop Knowing,{' '}
                <span className="text-amber-400">Start Learning</span>
              </h1>
              <p className="text-sm sm:text-lg text-blue-100/90 mb-3 sm:mb-4 leading-relaxed">
                A community platform dedicated to advancing education in{' '}
                <strong className="text-amber-300 font-semibold">AI, Technology, Engineering, CS & Mathematics</strong>.
              </p>
              <p className="text-xs sm:text-sm text-blue-300/70 mb-6 sm:mb-8 leading-relaxed">
                Evenings & weekends. 1-on-1 and small groups. All skill levels welcome.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:mb-10">
                <button onClick={() => scrollToSection('contact')}
                  className="bg-amber-400 hover:bg-amber-500 text-blue-900 font-black px-6 py-3 rounded-xl shadow-xl shadow-amber-400/25 transition-all duration-200 text-sm flex items-center justify-center gap-2 btn-press">
                  Get Started Today <ArrowRight className="w-4 h-4" />
                </button>
                <a href="tel:xxxxxxxxxx"
                  className="flex items-center justify-center gap-2 border-2 border-white/25 text-white font-bold px-6 py-3 rounded-xl hover:border-white/50 hover:bg-white/5 transition-all duration-200 text-sm">
                  <Phone className="w-4 h-4 text-amber-400" /> Call xxx-xxx-xxxx
                </a>
              </div>
              <div className="flex flex-wrap gap-3 sm:gap-5">
                {[
                  { icon: Clock, label: 'Evenings & Weekends' },
                  { icon: Users, label: '1-on-1 & Small Groups' },
                  { icon: Trophy, label: 'SAT/ACT/AP Coaching' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-blue-100/90 text-xs sm:text-sm">
                    <Icon className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 lg:mt-0">
              <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/15 group">
                <img
                  src="/images/files_5932042-2026-06-22T21-14-27-387Z-image.png"
                  alt="317 Solutions: Skill Development in AI, Technology, Engineering, CS and Mathematics"
                  className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
              <div className="flex items-center justify-between bg-blue-950/80 backdrop-blur-sm border border-amber-400/30 rounded-2xl px-4 py-3 mt-3">
                <span className="text-amber-300 text-xs font-bold">Call Now</span>
                <a href="tel:xxxxxxxxxx" className="text-white font-black text-sm hover:text-amber-300 transition-colors">xxx-xxx-xxxx</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="py-12 sm:py-20 px-4 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-400/15 border border-blue-400/25 rounded-full px-4 py-1.5 mb-4">
              <GraduationCap className="w-3.5 h-3.5 text-blue-300" />
              <span className="text-blue-300 text-xs font-semibold tracking-wide">What We Offer</span>
            </div>
            <h2 className="text-white mb-3" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>Our Services</h2>
            <p className="text-blue-100/90 max-w-2xl mx-auto leading-relaxed">
              Skill Development Programs in AI, Technology, Engineering, Computer Science & Mathematics for Students of All Levels
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map(({ icon: Icon, title, subtitle, color, bg }) => (
              <button
                key={title}
                onClick={() => handleNav('contact')}
                className={`group rounded-2xl p-6 border ${bg} backdrop-blur-sm card-hover btn-press text-left`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="text-white font-black text-base mb-1 group-hover:text-amber-300 transition-colors">{title}</h3>
                <p className="text-blue-200/90 text-sm leading-relaxed">{subtitle}</p>
                <p className="text-amber-400/60 text-xs mt-3 font-medium group-hover:text-amber-400 transition-colors">Learn more</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SUBJECTS */}
      <section className="py-12 sm:py-20 px-4 bg-blue-950/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/25 rounded-full px-4 py-1.5 mb-5">
                <Calculator className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-amber-300 text-xs font-semibold tracking-wide">Subject Areas</span>
              </div>
              <h2 className="text-white font-extrabold mb-4">What We Teach</h2>
              <p className="text-blue-100/90 mb-8 leading-relaxed">
                Comprehensive curriculum spanning AI, Technology, Engineering, Computer Science & Mathematics for all skill levels.
              </p>
              <div className="space-y-3">
                <div className="bg-blue-900/50 rounded-2xl p-5 border border-amber-400/20">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 bg-amber-400/20 rounded-lg flex items-center justify-center">
                      <Calculator className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-amber-300 font-black text-sm">Mathematics</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mathTopics.map(t => <span key={t} className="text-xs bg-amber-400/10 border border-amber-400/20 text-amber-200/90 px-2.5 py-1 rounded-full">{t}</span>)}
                  </div>
                </div>
                <div className="bg-blue-900/50 rounded-2xl p-5 border border-blue-400/20">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 bg-blue-400/20 rounded-lg flex items-center justify-center">
                      <Code2 className="w-4 h-4 text-blue-300" />
                    </div>
                    <span className="text-blue-300 font-black text-sm">Computer Science</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {csTopics.map(t => <span key={t} className="text-xs bg-blue-400/10 border border-blue-400/20 text-blue-200/90 px-2.5 py-1 rounded-full">{t}</span>)}
                  </div>
                </div>
                <div className="bg-blue-900/50 rounded-2xl p-5 border border-green-400/20">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 bg-green-400/20 rounded-lg flex items-center justify-center">
                      <Brain className="w-4 h-4 text-green-300" />
                    </div>
                    <span className="text-green-300 font-black text-sm">Artificial Intelligence</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {aiTopics.map(t => <span key={t} className="text-xs bg-green-400/10 border border-green-400/20 text-green-200/90 px-2.5 py-1 rounded-full">{t}</span>)}
                  </div>
                </div>
                <div className="bg-blue-900/50 rounded-2xl p-5 border border-cyan-400/20">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 bg-cyan-400/20 rounded-lg flex items-center justify-center">
                      <Globe className="w-4 h-4 text-cyan-300" />
                    </div>
                    <span className="text-cyan-300 font-black text-sm">Technology & Engineering</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {techTopics.map(t => <span key={t} className="text-xs bg-cyan-400/10 border border-cyan-400/20 text-cyan-200/90 px-2.5 py-1 rounded-full">{t}</span>)}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-800/60 to-blue-900/60 rounded-2xl p-5 sm:p-7 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-5">
                <Star className="w-5 h-5 text-amber-400" />
                <h3 className="text-xl font-black text-white">Why 317 Solutions?</h3>
              </div>
              <div className="space-y-3 mb-6">
                {whyUs.map(item => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-blue-100/90 text-sm leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 bg-amber-400/10 border border-amber-400/25 rounded-xl px-4 py-2.5 mb-2">
                <div className="w-6 h-6 bg-amber-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Brain className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div>
                  <p className="text-amber-300 font-black text-xs">100% Research-Driven</p>
                  <p className="text-amber-200/60 text-xs leading-tight">Curriculum grounded in ongoing AI & STEM research</p>
                </div>
              </div>
              <div className="border-t border-white/10 pt-5 space-y-2.5">
                <button onClick={() => scrollToSection('contact')}
                  className="w-full bg-amber-400 hover:bg-amber-500 text-blue-900 font-black py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 hover:scale-[1.02]">
                  Get Started Today
                </button>
                <a href="tel:xxxxxxxxxx"
                  className="w-full flex items-center justify-center gap-2 border border-white/20 text-white/80 hover:text-white hover:border-white/40 font-semibold py-3 rounded-xl text-sm transition-all">
                  <Phone className="w-4 h-4 text-amber-400" /> Call xxx-xxx-xxxx
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-12 sm:py-20 px-4 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-400/15 border border-green-400/25 rounded-full px-4 py-1.5 mb-4">
              <GraduationCap className="w-3.5 h-3.5 text-green-300" />
              <span className="text-green-300 text-xs font-semibold tracking-wide">Our Teaching Philosophy</span>
            </div>
            <h2 className="text-white font-extrabold mb-4">Teaching That Actually Works</h2>
            <p className="text-blue-100/90 max-w-2xl mx-auto leading-relaxed">
              At 317 Solutions, we believe learning happens through doing, not just memorizing. Every session is guided by expert mentors who meet you at your level and push you forward.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { icon: Users, title: 'Expert-Led Sessions', body: '1-on-1 tutoring and structured group classes led by knowledgeable mentors. Both formats are designed so every learner gets the attention and pacing they need to progress.', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
              { icon: Target, title: 'Goal-Oriented Learning', body: 'We start by understanding what you need: a grade, a test, a career shift. Then we build a focused plan to get you there with no filler and no wasted time.', color: 'text-blue-300', bg: 'bg-blue-400/10 border-blue-400/20' },
              { icon: Brain, title: 'Research-Backed Curriculum', body: 'Our curriculum is continuously refined through ongoing research in AI, STEM, and learning science so every lesson reflects what actually prepares learners for the real world.', color: 'text-green-300', bg: 'bg-green-400/10 border-green-400/20' },
            ].map(({ icon: Icon, title, body, color, bg }) => (
              <div key={title} className={`rounded-2xl p-6 border ${bg} backdrop-blur-sm`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="text-white font-black text-base mb-2">{title}</h3>
                <p className="text-blue-200/90 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <button onClick={() => scrollToSection('contact')}
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-blue-900 font-black px-8 py-3.5 rounded-xl shadow-xl shadow-amber-400/20 transition-all hover:scale-105 text-sm">
              Get Started Today <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* BLOG */}
      <section id="blog" className="py-12 sm:py-20 px-4 bg-blue-950/30 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/25 rounded-full px-4 py-1.5 mb-4">
                <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-amber-300 text-xs font-semibold tracking-wide">Latest Insights</span>
              </div>
              <h2 className="text-white font-extrabold">From Our Blog</h2>
              <p className="text-blue-200/90 mt-2 text-sm">Insights on AI, Technology, Engineering, CS & Mathematics from our team.</p>
            </div>
            <button
              onClick={onGoToBlog}
              className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold text-sm transition-colors border border-amber-400/30 hover:border-amber-400/60 px-4 py-2 rounded-xl"
            >
              View All Posts <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {recentPosts.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-2xl border border-white/8 h-72 animate-pulse" style={{ background: 'rgba(15,36,96,0.5)' }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {recentPosts.map(post => {
                const catColor = categoryColors[post.category] || 'bg-white/10 text-blue-200 border-white/20';
                return (
                  <button
                    key={post.id}
                    onClick={onGoToBlog}
                    className="group text-left rounded-2xl border border-white/8 overflow-hidden hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col"
                    style={{ background: 'linear-gradient(160deg, rgba(15,36,96,0.85), rgba(10,25,75,0.9))' }}
                  >
                    <div className="relative h-40 overflow-hidden flex-shrink-0">
                      {post.cover_image_url ? (
                        <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full bg-blue-900/50 flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-white/15" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <span className={`absolute top-2.5 left-2.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${catColor} backdrop-blur-sm`}>{post.category}</span>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="text-sm font-black text-white mb-2 group-hover:text-amber-300 transition-colors leading-snug line-clamp-2 flex-1">{post.title}</h3>
                      <p className="text-blue-200/55 text-xs line-clamp-2 mb-3 leading-relaxed">{post.excerpt}</p>
                      <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-white/8">
                        <div className="flex items-center gap-3 text-xs text-blue-300/40">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.read_time_minutes} min</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-400/50 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="text-center mt-8">
            <button
              onClick={onGoToBlog}
              className="inline-flex items-center gap-2 border border-white/20 text-white/80 hover:text-amber-300 hover:border-amber-400/40 font-semibold px-6 py-2.5 rounded-xl text-sm transition-all"
            >
              Read All Articles <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-400/15 border border-blue-400/25 rounded-full px-4 py-1.5 mb-4">
              <ChevronDown className="w-3.5 h-3.5 text-blue-300" />
              <span className="text-blue-300 text-xs font-semibold tracking-wide">Common Questions</span>
            </div>
            <h2 className="text-white font-extrabold mb-3">Frequently Asked Questions</h2>
            <p className="text-blue-200/70 text-sm">Everything you need to know about 317 Solutions.</p>
          </div>
          <div className="space-y-2.5">
            {faqs.map(({ q, a }, i) => (
              <div
                key={i}
                className="rounded-2xl border transition-all duration-200 overflow-hidden"
                style={{
                  background: openFaq === i ? 'rgba(15,36,96,0.7)' : 'rgba(15,36,96,0.4)',
                  borderColor: openFaq === i ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'
                }}
              >
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left gap-3"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-white font-bold text-sm leading-snug">{q}</span>
                  <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180 text-amber-400' : 'text-blue-300/50'}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-blue-100/80 text-sm leading-relaxed border-t border-white/8 pt-3">{a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-12 sm:py-20 px-4 bg-blue-950/30 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-rose-400/15 border border-rose-400/25 rounded-full px-4 py-1.5 mb-4">
              <Mail className="w-3.5 h-3.5 text-rose-300" />
              <span className="text-rose-300 text-xs font-semibold tracking-wide">Get In Touch</span>
            </div>
            <h2 className="text-white font-extrabold mb-3">Contact Us</h2>
            <p className="text-blue-200/80 max-w-xl mx-auto text-sm leading-relaxed">Ready to start? Schedule a session, ask a question, or just say hello. We respond within 24 hours.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {contactSubmitted ? (
                <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-400/30 rounded-2xl p-8 text-center h-full flex flex-col items-center justify-center">
                  <div className="w-14 h-14 bg-green-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-7 h-7 text-green-400" />
                  </div>
                  <h2 className="text-xl font-black text-white mb-2">Message Sent!</h2>
                  <p className="text-blue-100/90 text-sm mb-4 leading-relaxed max-w-sm">
                    Thank you for reaching out. We'll get back to you within 24 hours. For faster response, call us directly.
                  </p>
                  <a href="tel:xxxxxxxxxx" className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-blue-900 font-black px-6 py-2.5 rounded-xl text-sm transition-all">
                    <Phone className="w-4 h-4" /> Call xxx-xxx-xxxx
                  </a>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="bg-blue-900/40 border border-white/10 rounded-2xl p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-blue-200 mb-1.5 uppercase tracking-wide">Name *</label>
                      <input type="text" name="name" required value={contactForm.name} onChange={handleContactChange} placeholder="Your full name"
                        className="form-input" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-blue-200 mb-1.5 uppercase tracking-wide">Email *</label>
                      <input type="email" name="email" required value={contactForm.email} onChange={handleContactChange} placeholder="you@example.com"
                        className="form-input" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-blue-200 mb-1.5 uppercase tracking-wide">Phone (optional)</label>
                      <input type="tel" name="phone" value={contactForm.phone} onChange={handleContactChange} placeholder="Your phone number"
                        className="form-input" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-blue-200 mb-1.5 uppercase tracking-wide">Service Interest</label>
                      <select name="service_interest" value={contactForm.service_interest} onChange={handleContactChange}
                        className="form-input">
                        <option value="">Select a service...</option>
                        {contactServices.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-blue-200 mb-1.5 uppercase tracking-wide">Message *</label>
                    <textarea name="message" required rows={4} value={contactForm.message} onChange={handleContactChange}
                      placeholder="Tell us about your learning goals or questions..."
                      className="form-input resize-none" />
                  </div>
                  {contactError && (
                    <div className="bg-red-500/15 border border-red-400/30 text-red-200 px-4 py-3 rounded-xl text-sm">{contactError}</div>
                  )}
                  <button type="submit" disabled={contactLoading}
                    className="w-full bg-amber-400 hover:bg-amber-500 text-blue-900 font-black py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    <Send className="w-4 h-4" />
                    {contactLoading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-blue-900/40 border border-white/10 rounded-2xl p-5">
                <h3 className="text-white font-black text-sm mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <a href="mailto:info@317solutions.ai" className="flex items-start gap-3 group">
                    <div className="w-8 h-8 bg-amber-400/15 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-300/60 font-medium">Email</p>
                      <p className="text-white font-bold text-sm group-hover:text-amber-300 transition-colors">info@317solutions.ai</p>
                    </div>
                  </a>
                  <a href="tel:xxxxxxxxxx" className="flex items-start gap-3 group">
                    <div className="w-8 h-8 bg-amber-400/15 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-300/60 font-medium">Phone</p>
                      <p className="text-white font-bold text-sm group-hover:text-amber-300 transition-colors">xxx-xxx-xxxx</p>
                    </div>
                  </a>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-400/15 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-blue-300" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-300/60 font-medium">Availability</p>
                      <p className="text-white font-bold text-sm">Evenings & Weekends</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-400/15 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-green-300" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-300/60 font-medium">Location</p>
                      <p className="text-white font-bold text-sm">Massachusetts, USA</p>
                      <p className="text-blue-300/50 text-xs">In-person & Online</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-400/10 to-blue-800/30 border border-amber-400/20 rounded-2xl p-5">
                <h3 className="text-white font-black text-sm mb-2">Research & Innovation</h3>
                <p className="text-blue-200/90 text-xs leading-relaxed mb-3">Our curriculum is continuously refined through research and innovation to drive real skill development and lifelong learning.</p>
                <button onClick={() => scrollToSection('contact')} className="w-full bg-amber-400 hover:bg-amber-500 text-blue-900 font-black py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5">
                  Get Started Today
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 sm:py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-blue-800/80 to-blue-900/80 rounded-3xl border border-amber-400/25 p-6 sm:p-10 shadow-2xl">
            <PiLogo size="lg" />
            <h2 className="text-white font-extrabold mt-5 mb-3">Ready to Start Learning?</h2>
            <p className="text-blue-100/90 mb-8 leading-relaxed max-w-xl mx-auto">
              Join our community of learners and mentors. Evenings and weekends, 1-on-1 or small groups. We meet you where you are.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={() => scrollToSection('contact')}
                className="bg-amber-400 hover:bg-amber-500 text-blue-900 font-black px-7 py-3.5 rounded-xl shadow-xl transition-all hover:scale-105 text-sm flex items-center gap-2">
                Get Started Today
              </button>
              <button onClick={() => handleNav('contact')}
                className="flex items-center gap-2 border-2 border-white/25 text-white font-bold px-7 py-3.5 rounded-xl hover:border-amber-400/50 hover:text-amber-300 transition-all text-sm">
                <Phone className="w-4 h-4" /> Get In Touch
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-blue-950/60 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <PiLogo size="sm" />
                <div>
                  <p className="text-white font-black text-sm">317 Solutions</p>
                  <p className="text-amber-400/70 text-xs">Stop Knowing, Start Learning</p>
                </div>
              </div>
              <p className="text-blue-300/60 text-xs leading-relaxed">Community platform advancing AI, Technology, Engineering, CS & Mathematics education for all.</p>
            </div>
            <div>
              <p className="text-white font-bold text-sm mb-3">Navigation</p>
              <div className="space-y-1.5">
                {navLinks.map(({ label, anchor }) => (
                  <button key={label} onClick={() => handleNav(anchor)} className="block text-blue-300/60 hover:text-amber-400 text-xs transition-colors">{label}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white font-bold text-sm mb-3">Services</p>
              <div className="space-y-1 text-xs text-blue-300/60">
                {['Classroom Tutoring', 'SAT/ACT/AP Coaching', 'Skill Enrichment', 'Executive Coaching', 'Bootcamps'].map(s => <p key={s}>{s}</p>)}
              </div>
            </div>
            <div>
              <p className="text-white font-bold text-sm mb-3">Contact</p>
              <div className="space-y-1.5 text-xs text-blue-300/60">
                <a href="tel:xxxxxxxxxx" className="flex items-center gap-2 hover:text-amber-400 transition-colors font-semibold">
                  <Phone className="w-3 h-3" /> xxx-xxx-xxxx
                </a>
                <p>Evenings & Weekends</p>
                <p>Massachusetts, USA</p>
                <button onClick={onMemberLogin ?? onGetStarted} className="text-blue-300/50 hover:text-blue-200 font-medium transition-colors text-left mt-2">
                  Member Login
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-5 text-center">
            <p className="text-blue-300/40 text-xs">
              &copy; {new Date().getFullYear()} 317 Solutions. Driven by Research, Innovation &amp; Continuous Learning.
            </p>
          </div>
        </div>
      </footer>
      <ChatBot />
    </div>
  );
}