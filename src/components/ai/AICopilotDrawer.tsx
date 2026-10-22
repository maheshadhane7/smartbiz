'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User as UserIcon,
  Table,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { CopilotResponse, processCopilotQuery } from '../../lib/ai/copilotEngine';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  structuredData?: CopilotResponse['structuredData'];
  actions?: CopilotResponse['actions'];
  timestamp: string;
}

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AICopilotDrawer({ isOpen, onClose }: AICopilotDrawerProps) {
  const { invoices, products, customers, expenses, purchases } = useData();

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm_welcome',
      sender: 'ai',
      text: 'Hello! I am your **Prasana Enterprises AI Business Assistant**. I have real-time access to your sales, inventory, CRM, expenses, and GST data.\n\nHow can I help your business grow today?',
      actions: [
        { label: 'Who owes the most money?', href: '#', actionType: 'QUERY' },
        { label: 'Forecast next month sales', href: '#', actionType: 'QUERY' },
        { label: 'Which products are running out?', href: '#', actionType: 'QUERY' },
        { label: 'What is my net profit?', href: '#', actionType: 'QUERY' },
      ],
      timestamp: 'Just now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = processCopilotQuery(query, {
        invoices,
        products,
        customers,
        expenses,
        purchases,
      });

      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: response.answer,
        structuredData: response.structuredData,
        actions: response.actions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-zinc-950 border-l border-zinc-800 shadow-2xl z-50 flex flex-col animate-slide-up">
      {/* Top Header */}
      <div className="p-4 bg-black border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Prasana Enterprises AI</h3>
              <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-300 border border-zinc-700">
                Online
              </span>
            </div>
            <p className="text-xs text-zinc-400">Natural language database copilot</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800/80 flex items-center gap-2 overflow-x-auto text-xs whitespace-nowrap">
        <Lightbulb className="w-3.5 h-3.5 text-white shrink-0" />
        <span className="text-zinc-400 font-medium">Try:</span>
        <button
          onClick={() => handleSend('Who owes the most money?')}
          className="px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 transition"
        >
          Who owes money?
        </button>
        <button
          onClick={() => handleSend('Which products should I reorder?')}
          className="px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 transition"
        >
          Reorder alerts
        </button>
        <button
          onClick={() => handleSend('How much GST do I owe this month?')}
          className="px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 transition"
        >
          GST liability
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}

            <div className={`space-y-3 max-w-[85%] ${msg.sender === 'user' ? 'items-end' : ''}`}>
              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-white text-black font-medium rounded-tr-sm shadow-md'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-sm'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>

                {/* Structured Data Table if returned */}
                {msg.structuredData && msg.structuredData.rows && (
                  <div className="mt-3 pt-3 border-t border-zinc-800 overflow-x-auto">
                    <h5 className="font-bold text-white mb-2 flex items-center gap-1.5">
                      <Table className="w-3.5 h-3.5 text-white" />
                      {msg.structuredData.title}
                    </h5>
                    <table className="w-full text-left text-[11px] border-collapse">
                      {msg.structuredData.columns && (
                        <thead>
                          <tr className="border-b border-zinc-800 text-zinc-400">
                            {msg.structuredData.columns.map((col, idx) => (
                              <th key={idx} className="pb-1.5 pr-2 font-semibold">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                      )}
                      <tbody className="divide-y divide-zinc-800/50">
                        {msg.structuredData.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-zinc-800/40">
                            {Object.values(row).map((val: any, vIdx) => (
                              <td key={vIdx} className="py-1.5 pr-2 text-zinc-300">
                                {val}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Action Buttons */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex flex-wrap gap-1.5">
                    {msg.actions.map((act, aIdx) => (
                      act.actionType === 'QUERY' ? (
                        <button
                          key={aIdx}
                          onClick={() => handleSend(act.label)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-[11px] font-medium transition"
                        >
                          <span>{act.label}</span>
                          <ArrowRight className="w-3 h-3 text-white" />
                        </button>
                      ) : (
                        <Link
                          key={aIdx}
                          href={act.href}
                          onClick={onClose}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-black hover:bg-zinc-200 text-[11px] font-bold transition shadow-sm"
                        >
                          <span>{act.label}</span>
                          <ArrowRight className="w-3 h-3 text-black" />
                        </Link>
                      )
                    ))}
                  </div>
                )}
              </div>

              <span className="text-[10px] text-zinc-500 px-1">{msg.timestamp}</span>
            </div>

            {msg.sender === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center shrink-0 mt-0.5">
                <UserIcon className="w-4 h-4 text-zinc-200" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-700 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white animate-spin" />
              <span>Querying Prasana Enterprises database...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-zinc-800 bg-black">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask anything about sales, debtors, stock, or tax..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-white"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2.5 rounded-xl bg-white hover:bg-zinc-200 disabled:opacity-50 text-black transition shadow-sm font-bold"
          >
            <Send className="w-4 h-4 text-black" />
          </button>
        </form>
      </div>
    </div>
  );
}
