import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Phone } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; text: string };

const presetQuestions = [
  {
    label: 'What subjects do you offer?',
    answer: 'We cover Mathematics (Arithmetic through Linear Algebra, AP courses), Computer Science (Coding, Data Science, ML), Artificial Intelligence (Generative AI, Prompt Engineering), and Technology & Engineering (Cybersecurity, Cloud, DevOps). All levels welcome!',
  },
  {
    label: 'How do I get started?',
    answer: "Getting started is easy! Fill out our contact form or call us at xxx-xxx-xxxx. We offer evenings and weekends, 1-on-1 and small group sessions. We'll match you with the right program based on your goals.",
  },
  {
    label: 'Contact info',
    answer: 'Reach us at info@317solutions.ai or call xxx-xxx-xxxx. Available evenings & weekends. Located in Massachusetts — both in-person and online sessions available.',
  },
];

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: "Hi! I'm the 317 Solutions assistant. Ask me anything about our programs, subjects, or how to get started!" },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const preset = presetQuestions.find(q => q.label === text);
    const answer = preset
      ? preset.answer
      : 'Great question! For more details, call us at xxx-xxx-xxxx or fill out the contact form. We\'d love to help you get started!';
    setMessages(prev => [
      ...prev,
      { role: 'user', text },
      { role: 'assistant', text: answer },
    ]);
    setInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const showPresets = messages.length <= 1;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {!open && hovered && (
          <div className="bg-blue-900/95 text-white text-sm font-semibold px-3 py-1.5 rounded-full shadow-lg border border-white/15 whitespace-nowrap">
            Ask us anything!
          </div>
        )}
        <button
          onClick={() => setOpen(!open)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="w-14 h-14 bg-amber-400 hover:bg-amber-500 text-blue-900 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          aria-label="Open 317 Solutions assistant"
        >
          {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-white/15"
          style={{ height: showPresets ? '480px' : '420px', background: 'rgba(10,25,75,0.98)' }}
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10" style={{ background: 'rgba(15,36,96,0.98)' }}>
            <div className="w-9 h-9 bg-amber-400 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-blue-900" />
            </div>
            <div>
              <p className="text-white font-black text-sm leading-none">317 Solutions Assistant</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-green-400 text-xs font-medium">Online</span>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto text-white/40 hover:text-white/80 transition-colors p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-amber-400 text-blue-900 font-semibold'
                    : 'bg-white/10 text-blue-100'
                }`}>
                  {msg.text}
                  {msg.role === 'assistant' && msg.text.includes('xxx-xxx-xxxx') && (
                    <a href="tel:xxxxxxxxxx" className="flex items-center gap-1 mt-2 text-amber-300 font-bold hover:text-amber-200 transition-colors">
                      <Phone className="w-3 h-3" /> xxx-xxx-xxxx
                    </a>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {showPresets && (
            <div className="px-4 pb-2 flex flex-col gap-1.5">
              {presetQuestions.map(q => (
                <button
                  key={q.label}
                  onClick={() => sendMessage(q.label)}
                  className="text-left text-xs px-3 py-2 rounded-lg border border-white/12 text-blue-200 hover:bg-white/10 hover:text-white transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  {q.label}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-3 border-t border-white/10">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-white/10 border border-white/15 rounded-lg px-3 py-1.5 text-white text-xs placeholder-blue-300/40 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 bg-amber-400 hover:bg-amber-500 text-blue-900 rounded-lg disabled:opacity-40 transition flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
