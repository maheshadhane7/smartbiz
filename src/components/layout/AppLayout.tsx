'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AICopilotDrawer } from '../ai/AICopilotDrawer';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [copilotOpen, setCopilotOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-black text-white antialiased">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onToggleCopilot={() => setCopilotOpen(prev => !prev)} />

        <main className="flex-1 overflow-y-auto bg-black p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>

      {/* AI Copilot Drawer */}
      <AICopilotDrawer isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </div>
  );
}
