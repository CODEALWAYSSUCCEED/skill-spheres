import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Phone } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; text: string };

const presetQuestions = [
  { label: 'What subjects do you offer?' },
  { label: 'How do I get started?' },
  { label: 'Contact info' },
];

type Intent =
  | 'subjects'
  | 'ai'
  | 'math'
  | 'cs'
  | 'sat'
  | 'pricing'
  | 'schedule'
  | 'online'
  | 'started'
  | 'contact'
  | 'who'
  | 'bootcamp'
  | 'executive'
  | 'unknown';

function detectIntent(text: string): Intent {
  const t = text.toLowerCase();
  if (/what subjects|what do you (teach|cover|offer)|curriculum|program/.test(t)) return 'subjects';
  if (/\bai\b|artificial intelligence|machine learning|generative|prompt|chatgpt|llm|neural/.test(t)) return 'ai';
  if (/\bmath\b|calculus|algebra|geometry|trigon|statistics|discrete|arithmetic|ap calc|sat math/.test(t)) return 'math';
  if (/computer science|coding|programming|python|java|data science|devops|cloud|cybersec/.test(t)) return 'cs';
  if (/\bsat\b|\bact\b|\bap\b|test prep|exam|college board|psat/.test(t)) return 'sat';
  if (/price|cost|fee|how much|payment|charge|affordable|rate/.test(t)) return 'pricing';
  if (/schedule|time|when|evening|weekend|availability|hours|appointment|flexible/.test(t)) return 'schedule';
  if (/online|virtual|remote|zoom|in.person|location/.test(t)) return 'online';
  if (/get started|enroll|sign up|join|register|start/.test(t)) return 'started';
  if (/contact|call|phone|email|reach|number/.test(t)) return 'contact';
  if (/who is|who are|for me|my child|high school|college|adult|parent|professional|student/.test(t)) return 'who';
  if (/bootcamp|intensive|fast.track|workshop/.test(t)) return 'bootcamp';
  if (/executive|leadership|professional|career|corporate/.test(t)) return 'executive';
  return 'unknown';
}

const responses: Record<Intent, string[]> = {
  subjects: [
    'We cover four main areas: Mathematics (from Arithmetic to Linear Algebra and AP courses), Computer Science (Coding, Data Science, Machine Learning), Artificial Intelligence (Generative AI, Prompt Engineering, AI Systems), and Technology and Engineering (Cybersecurity, Cloud, DevOps). All levels are welcome.',
  ],
  ai: [
    'Yes, AI is one of our core focus areas. We offer courses in Generative AI, Prompt Engineering, AI Systems Design, and Machine Learning. These programs are designed for both beginners and students who already have a CS background.',
  ],
  math: [
    'We cover the full Mathematics track: Arithmetic, Algebra, Geometry, Trigonometry, Pre-Calculus, Calculus, AP Calculus, AP Statistics, Discrete Mathematics, and Linear Algebra. Whether you need foundational help or advanced prep, we have sessions for you.',
  ],
  cs: [
    'Our Computer Science programs include Coding Skills, Data Science, Machine Learning, Generative AI, Agentic Frameworks, Cloud Computing, Cybersecurity, and DevOps. We teach using Python, Java, and other in-demand languages.',
  ],
  sat: [
    'We offer dedicated SAT, ACT, and AP coaching. Sessions focus on pattern recognition, time management, and targeted skill practice. Students in our SAT program have averaged significant score improvements. Call us to learn about scheduling.',
  ],
  pricing: [
    'Pricing depends on the session format (1-on-1 vs. small group) and frequency. We do not publish rates publicly since we tailor plans to each student. Please call us at xxx-xxx-xxxx or fill out the contact form and we will follow up with details.',
  ],
  schedule: [
    'We offer flexible scheduling on evenings and weekends to fit around school and work. Sessions are available for 1-on-1 tutoring and small groups. Contact us to find a time that works for you.',
  ],
  online: [
    'We offer both in-person and online sessions. In-person sessions are available in Massachusetts. Online sessions are available to students anywhere. Both formats use the same curriculum and quality of instruction.',
  ],
  started: [
    'Getting started is straightforward. Fill out the contact form on this page or call us at xxx-xxx-xxxx. Tell us your subject, goal, and availability and we will match you with the right session.',
  ],
  contact: [
    'You can reach us by phone at xxx-xxx-xxxx (evenings and weekends), by email at info@317solutions.ai, or by filling out the contact form on this page. We typically respond within 24 hours.',
  ],
  who: [
    '317 Solutions serves middle school, high school, and college students, as well as working professionals. Whether you need help with school subjects, SAT prep, or want to build AI and tech skills for your career, we have programs for you.',
  ],
  bootcamp: [
    'We run intensive bootcamps and student meet-up groups focused on CS, AI, and Mathematics. These are collaborative, fast-paced programs ideal for students who want deep skill development in a short time. Call us to find out when the next cohort starts.',
  ],
  executive: [
    'Our executive coaching programs help professionals build AI literacy, leadership, and technology skills. These are tailored sessions designed around your role, goals, and schedule. Contact us to discuss your needs.',
  ],
  unknown: [
    'That is a good question. For the most accurate answer, please call us at xxx-xxx-xxxx or submit the contact form and our team will get back to you quickly.',
    'I am not sure about that one. Your best bet is to call us at xxx-xxx-xxxx or send a message through the contact form. We are happy to help.',
    'Good question. Please reach out directly at xxx-xxx-xxxx or via our contact form and someone from the 317 Solutions team will assist you.',
  ],
};

let unknownIndex = 0;

function getResponse(intent: Intent, userText: string): string {
  const presetMatch = presetQuestions.find(q => q.label === userText);
  if (presetMatch) {
    const presetMap: Record<string, Intent> = {
      'What subjects do you offer?': 'subjects',
      'How do I get started?': 'started',
      'Contact info': 'contact',
    };
    const mappedIntent = presetMap[presetMatch.label] || intent;
    const pool = responses[mappedIntent];
    return pool[0];
  }
  if (intent === 'unknown') {
    const pool = responses.unknown;
    const answer = pool[unknownIndex % pool.length];
    unknownIndex++;
    return answer;
  }
  const pool = responses[intent];
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: "Hi! I am the 317 Solutions assistant. I can answer questions about our programs, subjects, scheduling, and more." },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const intent = detectIntent(text);
    const answer = getResponse(intent, text);
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
          <div
            className="text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg border border-white/15 whitespace-nowrap"
            style={{ background: 'rgba(15,36,96,0.97)' }}
          >
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
          className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-white/10"
          style={{ height: '480px', background: 'rgba(8,20,65,0.99)' }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8 flex-shrink-0"
            style={{ background: 'rgba(15,36,96,0.99)' }}
          >
            <div className="w-9 h-9 bg-amber-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-400/20">
              <MessageCircle className="w-4 h-4 text-blue-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-sm leading-none">317 Solutions Assistant</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-xs font-medium">Online</span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/30 hover:text-white/80 transition-colors p-1 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Hint bar */}
          <div className="px-4 py-2 border-b border-white/5 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-blue-300/40 text-xs leading-relaxed">
              Ask about pricing, subjects, scheduling, AI coaching, or tutoring.
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-5 h-5 bg-amber-400/20 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5 border border-amber-400/20">
                    <span className="text-amber-400 text-xs font-black">A</span>
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-amber-400 text-blue-900 font-semibold rounded-br-sm'
                      : 'text-blue-100 rounded-bl-sm border border-white/8'
                  }`}
                  style={msg.role === 'assistant' ? { background: 'rgba(255,255,255,0.06)' } : {}}
                >
                  {msg.text}
                  {msg.role === 'assistant' && msg.text.includes('xxx-xxx-xxxx') && (
                    <a
                      href="tel:xxxxxxxxxx"
                      className="flex items-center gap-1 mt-2 pt-2 border-t border-white/10 text-amber-300 font-bold hover:text-amber-200 transition-colors"
                    >
                      <Phone className="w-3 h-3" /> Call xxx-xxx-xxxx
                    </a>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Preset quick replies */}
          {showPresets && (
            <div className="px-4 pb-3 flex flex-col gap-1.5 flex-shrink-0">
              {presetQuestions.map(q => (
                <button
                  key={q.label}
                  onClick={() => sendMessage(q.label)}
                  className="text-left text-xs px-3 py-2 rounded-lg border border-white/10 text-blue-200/80 hover:border-amber-400/30 hover:text-white transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  {q.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 px-3 py-3 border-t border-white/8 flex-shrink-0"
            style={{ background: 'rgba(15,36,96,0.5)' }}
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 rounded-lg px-3 py-2 text-white text-xs placeholder-blue-300/35 focus:outline-none focus:ring-1 focus:ring-amber-400/40 border border-white/10 transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 bg-amber-400 hover:bg-amber-500 text-blue-900 rounded-lg disabled:opacity-35 transition flex-shrink-0 hover:scale-105 active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
