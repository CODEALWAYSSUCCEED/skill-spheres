import { useState } from 'react';
import { SkillSearch } from './SkillSearch';
import { Bot, ChevronDown, ChevronUp } from 'lucide-react';

interface VirtualMentorSelectorProps {
  skillId: string;
  skillName: string;
}

export default function VirtualMentorSelector({ skillId, skillName }: VirtualMentorSelectorProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-amber-300" />
          <span className="text-sm font-bold text-white">Virtual Mentor</span>
          <span className="text-xs text-blue-300/50 hidden sm:inline">AI-powered learning companion</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-blue-400/60" /> : <ChevronDown className="w-4 h-4 text-blue-400/60" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/10 pt-3">
          <p className="text-blue-200/60 text-xs mb-3 leading-relaxed">
            Your virtual mentor for <strong className="text-amber-300/80">{skillName}</strong> provides personalized guidance, milestone walkthroughs, and learning resources tailored to your progress.
          </p>
          <div className="bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2 text-xs text-amber-200/70">
            Virtual mentor feature coming soon. Check back as you progress through milestones.
          </div>
        </div>
      )}
    </div>
  );
}
