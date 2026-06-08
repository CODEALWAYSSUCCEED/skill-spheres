import { useState } from 'react';
import { Bot, Send, X, MessageSquare } from 'lucide-react';

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: 'Hi! I\'m your Skill Sphere learning assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages(prev => [
      ...prev,
      { role: 'user', text: input },
      { role: 'assistant', text: 'Thanks for your question! This feature is coming soon. In the meantime, explore your skill milestones and resources.' },
    ]);
    setInput('');
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-amber-400 hover:bg-amber-500 text-blue-900 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110"
        aria-label="Open learning assistant"
      >
        {open ? <X className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 bg-blue-950 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ height: '400px' }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10" style={{ background: 'rgba(15,36,96,0.95)' }}>
            <Bot className="w-4 h-4 text-amber-400" />
            <span className="text-white font-bold text-sm">Skill Sphere Assistant</span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-amber-400 text-blue-900 font-semibold'
                    : 'bg-white/10 text-blue-100'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-3 border-t border-white/10">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-white/10 border border-white/15 rounded-lg px-3 py-1.5 text-white text-xs placeholder-blue-300/40 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
            />
            <button type="submit" disabled={!input.trim()} className="p-1.5 bg-amber-400 hover:bg-amber-500 text-blue-900 rounded-lg disabled:opacity-40 transition">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
