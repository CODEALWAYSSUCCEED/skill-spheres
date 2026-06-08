import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, ChevronDown } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm the 317 Solutions assistant. Ask me anything about our programs, subjects, or how to get started!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      const data = await res.json();
      const reply = data.reply || "Sorry, I couldn't process that. Please call us at xxx-xxx-xxxx.";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      if (!open) setUnread(true);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "Something went wrong. Please call us at xxx-xxx-xxxx for assistance." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickSend = async (text: string) => {
    if (loading) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || "Please call us at xxx-xxx-xxxx." }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Something went wrong. Please call us at xxx-xxx-xxxx." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Tooltip when closed */}
        {!open && (
          <div className="bg-blue-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg border border-amber-400/30 animate-bounce-once whitespace-nowrap">
            Ask us anything!
          </div>
        )}
        <button
          onClick={() => setOpen(o => !o)}
          className="relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
          aria-label="Toggle chat"
        >
          {open ? (
            <ChevronDown className="w-6 h-6 text-blue-900" />
          ) : (
            <MessageCircle className="w-6 h-6 text-blue-900" />
          )}
          {unread && !open && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
          )}
        </button>
      </div>

      {/* Chat window */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl shadow-2xl border border-white/10 overflow-hidden transition-all duration-300 origin-bottom-right ${
          open ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'
        }`}
        style={{ height: '480px', background: 'linear-gradient(160deg, #1e3a8a 0%, #1e40af 100%)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 flex-shrink-0" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <Bot className="w-5 h-5 text-blue-900" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight">317 Solutions Assistant</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              <span className="text-green-300 text-xs">Online</span>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors text-blue-200 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  <Bot className="w-3.5 h-3.5 text-blue-900" />
                </div>
              )}
              <div
                className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-amber-400 text-blue-900 font-medium rounded-br-sm'
                    : 'bg-white/10 text-blue-100 rounded-bl-sm border border-white/5'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2 justify-start">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                <Bot className="w-3.5 h-3.5 text-blue-900" />
              </div>
              <div className="bg-white/10 border border-white/5 px-4 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
            {['What subjects do you offer?', 'How do I get started?', 'Contact info'].map(prompt => (
              <button
                key={prompt}
                onClick={() => quickSend(prompt)}
                className="text-xs px-2.5 py-1 rounded-full border border-amber-400/40 text-amber-300 hover:bg-amber-400/10 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-3 py-3 border-t border-white/10 flex-shrink-0" style={{ background: 'rgba(0,0,0,0.15)' }}>
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 border border-white/10 focus-within:border-amber-400/50 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-white placeholder-blue-300/50 text-sm outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-110 active:scale-95 flex-shrink-0"
              style={{ background: input.trim() && !loading ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.1)' }}
            >
              <Send className="w-3.5 h-3.5 text-blue-900" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
