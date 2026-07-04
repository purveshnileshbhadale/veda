export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

export interface ModeConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  desc: string;
  placeholder: string;
  color: string;
  btnColor: string;
  accent: string;
  suggestions: { text: string; sub: string }[];
}
