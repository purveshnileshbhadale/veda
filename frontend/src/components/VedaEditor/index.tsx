'use client';

import { useState } from 'react';
import { PanelLeft } from 'lucide-react';
import { modes, quickTools } from './modes';
import Sidebar from './Sidebar';
import NavigationTabs from './NavigationTabs';
import EditorCanvas from './EditorCanvas';
import QuickTools from './QuickTools';
import InputArea from './InputArea';
import Footer from './Footer';
import type { Conversation } from './types';

interface VedaEditorProps {
  onOpenSettings?: () => void;
}

export default function VedaEditor({ onOpenSettings }: VedaEditorProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('editor');
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const activeConfig = modes.find((m) => m.id === mode) || modes[0];
  const active = conversations.find((c) => c.id === activeId);
  const messages = active?.messages || [];
  const tools = quickTools[mode] || quickTools['editor'];

  const newChat = () => {
    const id = Date.now().toString();
    setConversations((prev) => [...prev, { id, title: 'New chat', messages: [] }]);
    setActiveId(id);
    setInput('');
  };

  const deleteChat = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId('');
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
  };

  const handleToolClick = (prompt: string) => {
    setInput((prev) => (prev ? `${prev}\n${prompt}` : prompt));
  };

  const handleSend = () => {
    if (!input.trim()) return;
    let convId = activeId;
    if (!convId) {
      convId = Date.now().toString();
      setConversations((prev) => [...prev, { id: convId, title: input.slice(0, 40), messages: [] }]);
      setActiveId(convId);
    }
    const userMsg = { role: 'user' as const, content: input.trim() };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId ? { ...c, messages: [...c.messages, userMsg], title: c.title === 'New chat' ? input.slice(0, 40) : c.title } : c
      )
    );
    setInput('');
  };

  return (
    <div className="flex h-screen bg-[#0d0d1a]">
      {/* Desktop Sidebar */}
      <div className={`hidden md:flex flex-col w-64 border-r border-white/[0.03] shrink-0`}>
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNewChat={newChat}
          onSelect={setActiveId}
          onDelete={deleteChat}
          onOpenSettings={() => onOpenSettings?.()}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSidebar(false)} />
          <aside className="relative w-64 border-r border-white/[0.03] bg-[#090912] flex flex-col h-full">
            <Sidebar
              conversations={conversations}
              activeId={activeId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onNewChat={newChat}
              onSelect={setActiveId}
              onDelete={deleteChat}
              onOpenSettings={() => { onOpenSettings?.(); setShowSidebar(false); }}
              isMobile
              onCloseMobile={() => setShowSidebar(false)}
            />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 h-11 border-b border-white/[0.03] shrink-0 bg-[#0d0d1a]">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="text-white/30 hover:text-white/60 transition-colors md:hidden"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-white/20 font-mono hidden md:inline">VEDA</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-white/20 font-mono">{activeConfig.label} Mode</span>
          </div>
        </header>

        {/* Mode Tabs */}
        <NavigationTabs modes={modes} active={mode} onSelect={setMode} />

        {/* Messages / Empty Canvas */}
        {messages.length === 0 ? (
          <EditorCanvas mode={activeConfig} onSuggestionClick={handleSuggestionClick} />
        ) : (
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="mx-auto w-full md:max-w-3xl px-3 md:px-4 py-4 md:py-6 space-y-4 md:space-y-5">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`${
                      msg.role === 'user'
                        ? 'max-w-[85%] md:max-w-[75%] inline-block bg-indigo-500/10 text-white/85 rounded-2xl rounded-br-md px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm leading-relaxed'
                        : 'md:max-w-[85%] w-full text-xs md:text-sm leading-relaxed text-white/70'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Tools */}
        <QuickTools tools={tools} onToolClick={handleToolClick} />

        {/* Input */}
        <InputArea
          value={input}
          onChange={setInput}
          onSend={handleSend}
          placeholder={activeConfig.placeholder}
        />

        {/* Footer */}
        <Footer modeLabel={activeConfig.label} />
      </div>
    </div>
  );
}
