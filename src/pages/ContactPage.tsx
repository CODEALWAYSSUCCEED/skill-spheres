import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Phone, Mail, Clock, Users, CheckCircle, Send, MapPin, ChevronLeft } from 'lucide-react';

const services = [
  '1-on-1 Classroom Tutoring',
  'Small Group Tutoring',
  'SAT / ACT Coaching',
  'AP Exam Coaching',
  'Skill Enrichment Program',
  'Executive Coaching',
  'Student Meet-up Groups',
  'Bootcamp',
  'Other',
];

export function ContactPage({ onBack }: { onBack?: () => void } = {}) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '', service_interest: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: dbError } = await supabase.from('contact_inquiries').insert({
        name: form.name,
        email: form.email,
        phone: form.phone,
        subject: form.subject,
        message: form.message,
        service_interest: form.service_interest,
        status: 'new',
      });
      if (dbError) throw dbError;

      // Send email notification (fire and forget, don't block on failure)
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          subject: form.subject || `Inquiry from ${form.name}`,
          message: form.message,
          service_interest: form.service_interest,
        }),
      }).catch(() => {});

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try calling us directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-4">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-blue-300/60 hover:text-white text-sm font-semibold mb-6 transition-colors"
          style={{ letterSpacing: '-0.01em' }}
        >
          <ChevronLeft className="w-4 h-4" /> Back to Skill Sphere
        </button>
      )}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Phone className="w-5 h-5 text-amber-400" />
          <h1 className="text-2xl font-black text-white">Contact 317 Solutions</h1>
        </div>
        <p className="text-blue-300/70 text-sm">Reach out to schedule a session or ask any questions. We respond quickly.</p>
        <div className="h-px bg-gradient-to-r from-amber-400/30 via-blue-400/20 to-transparent mt-4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {submitted ? (
            <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-400/30 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 bg-green-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-400" />
              </div>
              <h2 className="text-xl font-black text-white mb-2">Message Sent!</h2>
              <p className="text-blue-200/80 text-sm mb-4 leading-relaxed">
                Thank you for reaching out. We'll get back to you within 24 hours. For faster response, call us directly.
              </p>
              <a
                href="tel:xxxxxxxxxx"
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-blue-900 font-black px-6 py-2.5 rounded-xl text-sm transition-all"
              >
                <Phone className="w-4 h-4" /> Call xxx-xxx-xxxx
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-blue-900/40 border border-white/10 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-black text-white mb-2">Send Us a Message</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-blue-200 mb-1.5 uppercase tracking-wide">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-blue-200 mb-1.5 uppercase tracking-wide">Email *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-blue-200 mb-1.5 uppercase tracking-wide">Phone (optional)</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Your phone number"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-blue-200 mb-1.5 uppercase tracking-wide">Service Interest</label>
                  <select
                    name="service_interest"
                    value={form.service_interest}
                    onChange={handleChange}
                    className="form-input appearance-none"
                  >
                    <option value="" className="bg-blue-900">Select a service...</option>
                    {services.map(s => <option key={s} value={s} className="bg-blue-900">{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-blue-200 mb-1.5 uppercase tracking-wide">Subject *</label>
                <input
                  type="text"
                  name="subject"
                  required
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="What can we help you with?"
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-blue-200 mb-1.5 uppercase tracking-wide">Message *</label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us about your learning goals, schedule preferences, or any questions you have..."
                  className="form-input resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-500/15 border border-red-400/30 text-red-200 px-4 py-3 rounded-xl text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-400 hover:bg-amber-500 text-blue-900 font-black py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Sending...' : 'Send Message'}
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
                  <Users className="w-4 h-4 text-green-300" />
                </div>
                <div>
                  <p className="text-xs text-blue-300/60 font-medium">Format</p>
                  <p className="text-white font-bold text-sm">1-on-1 & Small Groups</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-rose-400/15 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-rose-300" />
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
            <h3 className="text-white font-black text-sm mb-3">Research & Innovation</h3>
            <p className="text-blue-200/70 text-xs leading-relaxed mb-3">
              317 Solutions is driven by research and innovation, continuously advancing our curriculum to foster real skill development and lifelong learning.
            </p>
            <div className="space-y-1.5">
              {['Transparent pricing', 'Community-first approach', 'AI & Technology research-backed curriculum'].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  <span className="text-blue-100/80 text-xs">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-900/40 border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-black text-sm mb-3">Services We Offer</h3>
            <div className="space-y-1">
              {services.slice(0, -1).map(s => (
                <div key={s} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400/60 flex-shrink-0" />
                  <span className="text-blue-200/70 text-xs">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
