'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  Table,
  TrendingUp,
  ArrowRight,
  Lightbulb,
  CreditCard,
  Package,
  FileSpreadsheet,
  ReceiptIndianRupee,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
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

export default function AICopilotPage() {
  const { invoices, products, customers, expenses, purchases } = useData();

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm_init',
      sender: 'ai',
      text: 'Hello! I am your **Prasana Enterprises Business Copilot**. I have full real-time access to your sales, inventory, CRM debtors, expenses, and GST returns.\n\nAsk me anything in plain English or select a suggestion below:',
      actions: [
        { label: 'Who owes the most money?', href: '#', actionType: 'QUERY' },
        { label: 'Which products are running out of stock?', href: '#', actionType: 'QUERY' },
        { label: 'Forecast next month sales revenue', href: '#', actionType: 'QUERY' },
        { label: 'How much GST do I owe this month?', href: '#', actionType: 'QUERY' },
      ],
      timestamp: 'Just now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    }, 400);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-6.5rem)] max-w-5xl mx-auto bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="p-4 bg-black border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center shadow-lg font-black">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Prasana Enterprises Conversational AI Copilot</h3>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700">
                  REAL-TIME DB CONNECTED
                </span>
              </div>
              <p className="text-xs text-zinc-400">Ask natural business questions without complex SQL or manual reports</p>
            </div>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-5 py-2.5 bg-black/60 border-b border-zinc-800 flex items-center gap-2 overflow-x-auto text-xs whitespace-nowrap">
          <Lightbulb className="w-4 h-4 text-white shrink-0" />
          <span className="text-zinc-400 font-medium">Quick Queries:</span>
          <button
            onClick={() => handleSend('Who owes the most money?')}
            className="px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition"
          >
            💰 Top Debtors List
          </button>
          <button
            onClick={() => handleSend('Which products should I reorder?')}
            className="px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition"
          >
            📦 Urgent Reorder Alerts
          </button>
          <button
            onClick={() => handleSend('Forecast next month sales revenue')}
            className="px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition"
          >
            📈 30-Day Revenue Forecast
          </button>
          <button
            onClick={() => handleSend('What is my net profit and expenses?')}
            className="px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition"
          >
            ⚖️ Net Profit & Margins
          </button>
        </div>

        {/* Messages Scroll Canvas */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-black/40">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div className={`space-y-3 max-w-[85%] ${msg.sender === 'user' ? 'items-end' : ''}`}>
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-white text-black font-medium rounded-tr-sm shadow-md'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Structured Table */}
                  {msg.structuredData && msg.structuredData.rows && (
                    <div className="mt-4 pt-3 border-t border-zinc-800 overflow-x-auto">
                      <h5 className="font-bold text-white mb-2 flex items-center gap-1.5 text-xs">
                        <Table className="w-3.5 h-3.5 text-white" />
                        {msg.structuredData.title}
                      </h5>
                      <table className="w-full text-left text-xs border-collapse">
                        {msg.structuredData.columns && (
                          <thead>
                            <tr className="border-b border-zinc-800 text-zinc-400 font-semibold">
                              {msg.structuredData.columns.map((col, idx) => (
                                <th key={idx} className="pb-2 pr-3">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                        )}
                        <tbody className="divide-y divide-zinc-800/60">
                          {msg.structuredData.rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-zinc-800/40">
                              {Object.values(row).map((val: any, vIdx) => (
                                <td key={vIdx} className="py-2 pr-3 text-zinc-300">
                                  {val}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Action Chips */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-zinc-800 flex flex-wrap gap-2">
                      {msg.actions.map((act, aIdx) => (
                        act.actionType === 'QUERY' ? (
                          <button
                            key={aIdx}
                            onClick={() => handleSend(act.label)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-medium transition"
                          >
                            <span>{act.label}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-white" />
                          </button>
                        ) : (
                          <Link
                            key={aIdx}
                            href={act.href}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition shadow-sm"
                          >
                            <span>{act.label}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-black" />
                          </Link>
                        )
                      ))}
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-zinc-500 px-1">{msg.timestamp}</span>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center shrink-0 mt-0.5">
                  <UserIcon className="w-4 h-4 text-zinc-200" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-700 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-white animate-spin" />
                <span>Analyzing Prasana Enterprises sales, stock, and ledger database...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-black border-t border-zinc-800">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              autoFocus
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything about debtors, revenue, best-selling items, GST liability, or stockout risk..."
              className="flex-1 px-5 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white text-xs sm:text-sm placeholder-zinc-500 focus:outline-none focus:border-white"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-3 rounded-2xl bg-white hover:bg-zinc-200 disabled:opacity-50 text-black transition shadow-sm shrink-0 font-bold"
            >
              <Send className="w-4 h-4 text-black" />
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
