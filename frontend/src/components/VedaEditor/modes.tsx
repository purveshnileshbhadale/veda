import {
  BookOpen, Globe, Library, Lightbulb, PenLine, ScrollText, Sparkles,
  Search, Quote, FileText, Check, AlignLeft, Languages, ListChecks
} from 'lucide-react';
import type { ModeConfig } from './types';

export const modes: ModeConfig[] = [
  {
    id: 'research', label: 'Research',
    icon: <BookOpen className="h-3.5 w-3.5" />,
    desc: 'Write & improve papers',
    placeholder: 'Ask about your research paper...',
    color: 'from-indigo-500 to-cyan-400',
    btnColor: 'border-indigo-500/10 hover:border-indigo-500/30',
    accent: 'shadow-indigo-500/15',
    suggestions: [
      { text: 'Help me outline a research paper about climate change adaptation', sub: 'Outline generation' },
      { text: 'Find recent papers on transformer architectures in NLP', sub: 'arXiv paper search' },
      { text: 'Improve my abstract for clarity and impact', sub: 'Writing polish' },
      { text: 'Suggest citations for my methodology section', sub: 'Citation help' },
    ],
  },
  {
    id: 'mun', label: 'MUN',
    icon: <Globe className="h-3.5 w-3.5" />,
    desc: 'Model UN preparation',
    placeholder: 'Ask about MUN position papers, speeches...',
    color: 'from-emerald-500 to-teal-400',
    btnColor: 'border-emerald-500/10 hover:border-emerald-500/30',
    accent: 'shadow-emerald-500/15',
    suggestions: [
      { text: 'Write a position paper for France on AI regulation', sub: 'Position paper' },
      { text: 'Draft a resolution on climate financing', sub: 'Resolution drafting' },
      { text: 'Write a 1-minute opening speech for India on cybersecurity', sub: 'Opening speech' },
      { text: 'Write a speech for the UN Secretary-General on global peace', sub: 'Official speech' },
      { text: 'Draft a working paper on quantum technology governance', sub: 'Working paper' },
      { text: 'Conduct deep research on Arctic geopolitics', sub: 'Deep research' },
      { text: 'Analyze stance of US, China, Russia on Taiwan', sub: 'Stance analysis' },
      { text: 'Summarize China stance on South China Sea', sub: 'Country research' },
    ],
  },
  {
    id: 'literature', label: 'Lit Review',
    icon: <Library className="h-3.5 w-3.5" />,
    desc: 'Find & synthesize papers',
    placeholder: 'Search papers, synthesize findings...',
    color: 'from-violet-500 to-purple-400',
    btnColor: 'border-violet-500/10 hover:border-violet-500/30',
    accent: 'shadow-violet-500/15',
    suggestions: [
      { text: 'Summarize recent advances in quantum machine learning', sub: 'Literature synthesis' },
      { text: 'Find research gaps in federated learning for healthcare', sub: 'Gap analysis' },
      { text: 'Compare transformer vs CNN in medical imaging', sub: 'Paper comparison' },
      { text: 'Generate BibTeX on reinforcement learning', sub: 'Citation export' },
    ],
  },
  {
    id: 'brainstorm', label: 'Ideas',
    icon: <Lightbulb className="h-3.5 w-3.5" />,
    desc: 'Generate & refine ideas',
    placeholder: 'Brainstorm research ideas...',
    color: 'from-amber-500 to-orange-400',
    btnColor: 'border-amber-500/10 hover:border-amber-500/30',
    accent: 'shadow-amber-500/15',
    suggestions: [
      { text: 'What are some novel research questions in computational biology?', sub: 'Idea generation' },
      { text: 'How can blockchain apply to academic publishing?', sub: 'Cross-disciplinary' },
      { text: 'Combine GANs with RL for drug discovery', sub: 'Provocative question' },
      { text: 'Suggest methodologies for studying social media polarization', sub: 'Methodology design' },
    ],
  },
  {
    id: 'editor', label: 'Editor',
    icon: <PenLine className="h-3.5 w-3.5" />,
    desc: 'Polish academic writing',
    placeholder: 'Paste text to edit or polish...',
    color: 'from-rose-500 to-pink-400',
    btnColor: 'border-rose-500/10 hover:border-rose-500/30',
    accent: 'shadow-rose-500/15',
    suggestions: [
      { text: 'Improve the clarity of this paragraph about statistical methods', sub: 'Clarity polish' },
      { text: 'Make this abstract more concise and impactful', sub: 'Conciseness' },
      { text: 'Check this methodology section for logical gaps', sub: 'Argument check' },
      { text: 'Format these citations in APA style', sub: 'Citation formatting' },
    ],
  },
  {
    id: 'review', label: 'Review',
    icon: <ScrollText className="h-3.5 w-3.5" />,
    desc: 'Peer review simulator',
    placeholder: 'Paste a draft to get peer review...',
    color: 'from-cyan-500 to-blue-400',
    btnColor: 'border-cyan-500/10 hover:border-cyan-500/30',
    accent: 'shadow-cyan-500/15',
    suggestions: [
      { text: 'Review this introduction for clarity and positioning', sub: 'Introduction review' },
      { text: 'Critique my methodology — are there validity threats?', sub: 'Methods critique' },
      { text: 'Assess the contribution and novelty of this work', sub: 'Contribution assessment' },
      { text: 'Give me a full peer review of this discussion section', sub: 'Full review' },
    ],
  },
  {
    id: 'experiment', label: 'Lab',
    icon: <Sparkles className="h-3.5 w-3.5" />,
    desc: 'Design experiments & simulations',
    placeholder: 'Design experiments, simulate outcomes...',
    color: 'from-pink-500 to-rose-400',
    btnColor: 'border-pink-500/10 hover:border-pink-500/30',
    accent: 'shadow-pink-500/15',
    suggestions: [
      { text: 'Design a controlled experiment to test a new drug efficacy', sub: 'Experimental design' },
      { text: 'Simulate outcomes for a clinical trial with n=500', sub: 'Outcome simulation' },
      { text: 'What variables to control in an observational study?', sub: 'Variable identification' },
      { text: 'Run Monte Carlo simulation for portfolio risk analysis', sub: 'Monte Carlo simulation' },
    ],
  },
];

export const quickTools: Record<string, { icon: React.ReactNode; label: string; prompt: string }[]> = {
  research: [
    { icon: <BookOpen className="h-3 w-3" />, label: 'Outline', prompt: 'Help me outline a research paper on' },
    { icon: <FileText className="h-3 w-3" />, label: 'Abstract', prompt: 'Write an abstract for a paper about' },
    { icon: <Search className="h-3 w-3" />, label: 'Find Papers', prompt: 'Find recent papers about' },
    { icon: <Quote className="h-3 w-3" />, label: 'Cite', prompt: 'Generate citations in APA format for the topic:' },
  ],
  mun: [
    { icon: <Globe className="h-3 w-3" />, label: 'Position Paper', prompt: 'Write a position paper for ' },
    { icon: <PenLine className="h-3 w-3" />, label: 'Speech', prompt: 'Write a 1-minute opening speech for the delegate of ' },
    { icon: <Search className="h-3 w-3" />, label: 'Deep Research', prompt: 'Conduct deep research on ' },
    { icon: <ListChecks className="h-3 w-3" />, label: 'Stance', prompt: 'Analyze the stance of all major powers on ' },
  ],
  editor: [
    { icon: <PenLine className="h-3 w-3" />, label: 'Improve', prompt: 'Improve the clarity of this text:\n\n' },
    { icon: <Languages className="h-3 w-3" />, label: 'Paraphrase', prompt: 'Paraphrase this to be more concise:\n\n' },
    { icon: <Check className="h-3 w-3" />, label: 'Proofread', prompt: 'Proofread this for grammar and style:\n\n' },
    { icon: <AlignLeft className="h-3 w-3" />, label: 'Condense', prompt: 'Condense this to half the length:\n\n' },
  ],
};
