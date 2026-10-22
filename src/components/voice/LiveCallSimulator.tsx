'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneCall,
  PhoneOff,
  Mic,
  Volume2,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Languages,
  X,
  Share2,
} from 'lucide-react';
import { CallDisposition, CallLanguage, CallMessage, CallRecord, Invoice } from '../../lib/types';
import { useData } from '../../context/DataContext';
import { formatINR, generateId, generateUPILink } from '../../lib/utils';
import { analyzeCustomerIntent, speakText, VOICE_SCRIPTS } from '../../lib/ai/voiceEngine';
import { useNotification } from '../../context/NotificationContext';

interface LiveCallSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  targetInvoice: Invoice | null;
  initialLanguage?: CallLanguage;
  onCallCompleted?: (record: CallRecord) => void;
}

export function LiveCallSimulator({
  isOpen,
  onClose,
  targetInvoice,
  initialLanguage = 'en',
  onCallCompleted,
}: LiveCallSimulatorProps) {
  const { business, scheduleCall } = useData();
  const { showToast } = useNotification();

  const [language, setLanguage] = useState<CallLanguage>(initialLanguage);
  const [callState, setCallState] = useState<'IDLE' | 'DIALING' | 'CONNECTED' | 'ENDED'>('IDLE');
  const [duration, setDuration] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<CallMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [disposition, setDisposition] = useState<CallDisposition | null>(null);
  const [paymentLinkSent, setPaymentLinkSent] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (callState === 'CONNECTED') {
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen || !targetInvoice) return null;

  const startCall = () => {
    setCallState('DIALING');
    setMessages([]);
    setDuration(0);
    setDisposition(null);
    setPaymentLinkSent(false);

    // Ringing for 2 seconds then connect
    setTimeout(() => {
      setCallState('CONNECTED');

      // AI speaks initial greeting
      const scriptGen = VOICE_SCRIPTS[language].initialGreeting;
      const greeting = scriptGen({
        businessName: business.name,
        customerName: targetInvoice.customerName,
        invoiceNumber: targetInvoice.invoiceNumber,
        amount: targetInvoice.balanceAmount,
        dueDate: targetInvoice.dueDate,
        language,
      });

      const initialMsg: CallMessage = {
        id: generateId('msg'),
        sender: 'ai',
        text: greeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages([initialMsg]);
      setIsSpeaking(true);
      speakText(greeting, language, () => setIsSpeaking(false));
    }, 2000);
  };

  const handleCustomerResponse = (responseText: string) => {
    if (!responseText.trim() || callState !== 'CONNECTED') return;

    const userMsg: CallMessage = {
      id: generateId('msg'),
      sender: 'customer',
      text: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputText('');

    // Analyze intent & sentiment
    const analysis = analyzeCustomerIntent(responseText, language);
    userMsg.sentiment = analysis.sentiment;
    setDisposition(analysis.disposition);

    // AI Replies
    setTimeout(() => {
      const scriptFn = VOICE_SCRIPTS[language][analysis.replyKey];
      const reply = scriptFn({
        businessName: business.name,
        customerName: targetInvoice.customerName,
        invoiceNumber: targetInvoice.invoiceNumber,
        amount: targetInvoice.balanceAmount,
        dueDate: targetInvoice.dueDate,
        language,
      });

      const aiReplyMsg: CallMessage = {
        id: generateId('msg'),
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiReplyMsg]);
      setIsSpeaking(true);
      speakText(reply, language, () => setIsSpeaking(false));

      // If requested payment link, trigger automated dispatch
      if (analysis.intent === 'PAYMENT_YES' || analysis.disposition === 'REQUESTED_PAYMENT_LINK') {
        setPaymentLinkSent(true);
        showToast({
          title: 'Payment Link Generated',
          message: `Instant UPI link pushed to ${targetInvoice.customerPhone}`,
          type: 'success',
        });
      }
    }, 600);
  };

  const endCall = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setCallState('ENDED');

    const finalDisposition = disposition || 'CALLBACK_REQUESTED';
    const upiLink = generateUPILink({
      upiId: business.bankUpiId,
      payeeName: business.name,
      amount: targetInvoice.balanceAmount,
      invoiceNumber: targetInvoice.invoiceNumber,
    });

    const callRecord: CallRecord = {
      id: generateId('call'),
      customerId: targetInvoice.customerId,
      customerName: targetInvoice.customerName,
      customerPhone: targetInvoice.customerPhone,
      invoiceId: targetInvoice.id,
      invoiceNumber: targetInvoice.invoiceNumber,
      overdueAmount: targetInvoice.balanceAmount,
      overdueDays: 14,
      callDate: new Date().toISOString(),
      durationSeconds: duration,
      language,
      status: 'COMPLETED',
      disposition: finalDisposition,
      summary: `Automated AI Reminder Call completed in ${language.toUpperCase()} (${duration}s). Disposition: ${finalDisposition}.`,
      transcript: messages,
      paymentLinkSent: paymentLinkSent || finalDisposition === 'REQUESTED_PAYMENT_LINK',
      paymentLinkUrl: upiLink,
    };

    scheduleCall(callRecord);
    if (onCallCompleted) onCallCompleted(callRecord);

    showToast({
      title: 'Call Record Saved',
      message: `Disposition logged as "${finalDisposition.replace(/_/g, ' ')}"`,
      type: 'info',
    });
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-2xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-4 bg-black border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center font-bold">
              <PhoneCall className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Prasana Enterprises Voice AI</h3>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700">
                  Natural Speech AI
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                To: <strong className="text-white">{targetInvoice.customerName}</strong> ({targetInvoice.customerPhone})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
              {(['en', 'hi', 'mr'] as const).map(l => (
                <button
                  key={l}
                  disabled={callState === 'CONNECTED'}
                  onClick={() => setLanguage(l)}
                  className={`px-2.5 py-1 rounded-lg font-semibold uppercase tracking-wider transition ${
                    language === l ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {l === 'en' ? 'English' : l === 'hi' ? 'हिंदी' : 'मराठी'}
                </button>
              ))}
            </div>

            <button onClick={onClose} className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Audio Visualizer Banner */}
        <div className="p-5 bg-black/60 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3.5 h-3.5 rounded-full ${
                callState === 'CONNECTED'
                  ? 'bg-emerald-400 animate-ping'
                  : callState === 'DIALING'
                  ? 'bg-amber-400 animate-pulse'
                  : callState === 'ENDED'
                  ? 'bg-zinc-500'
                  : 'bg-zinc-600'
              }`}
            />
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {callState === 'CONNECTED'
                  ? `CALL IN PROGRESS (${formatSeconds(duration)})`
                  : callState === 'DIALING'
                  ? 'DIALING CUSTOMER VIA SIP GATEWAY...'
                  : callState === 'ENDED'
                  ? `CALL DISCONNECTED (${formatSeconds(duration)})`
                  : 'READY TO INITIATE VOICE CALL'}
              </span>
              <p className="text-[11px] text-zinc-400">
                Outstanding: <strong className="text-white">{formatINR(targetInvoice.balanceAmount)}</strong> (Bill: {targetInvoice.invoiceNumber})
              </p>
            </div>
          </div>

          {/* Audio Wave Visualizer Bars */}
          {callState === 'CONNECTED' && (
            <div className="flex items-center gap-1 h-6 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-700">
              <span className="w-1 h-3 bg-white rounded-full audio-bar" />
              <span className="w-1 h-5 bg-white rounded-full audio-bar" />
              <span className="w-1 h-2 bg-white rounded-full audio-bar" />
              <span className="w-1 h-6 bg-white rounded-full audio-bar" />
              <span className="w-1 h-4 bg-white rounded-full audio-bar" />
              <span className="w-1 h-5 bg-white rounded-full audio-bar" />
              <span className="w-1 h-2 bg-white rounded-full audio-bar" />
            </div>
          )}
        </div>

        {/* Live Conversation Transcript Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/40 min-h-[260px]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500 space-y-2">
              <Mic className="w-8 h-8 opacity-40 text-zinc-400" />
              <p className="text-xs">Click "Start AI Voice Call" to simulate real-time conversational debtor collection.</p>
            </div>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'ai' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                    msg.sender === 'ai'
                      ? 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-sm'
                      : 'bg-white text-black font-medium rounded-tr-sm shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] opacity-70 mb-1">
                    <span className="font-bold uppercase tracking-wider">
                      {msg.sender === 'ai' ? 'Prasana Enterprises Voice AI' : `${targetInvoice.customerName} (Customer)`}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <p>{msg.text}</p>
                </div>
              </div>
            ))
          )}
          <div ref={transcriptEndRef} />
        </div>

        {/* Quick Customer Response Simulator Chips */}
        {callState === 'CONNECTED' && (
          <div className="p-3 bg-zinc-950 border-t border-zinc-800 space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              Simulate Customer Reply ({language.toUpperCase()}):
            </span>
            <div className="flex flex-wrap gap-2">
              {language === 'en' && (
                <>
                  <button
                    onClick={() => handleCustomerResponse('Yes please send me the UPI payment link right away.')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200"
                  >
                    👍 "Send UPI link"
                  </button>
                  <button
                    onClick={() => handleCustomerResponse('I will pay tomorrow morning after banking hours.')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200"
                  >
                    ⏰ "Will pay tomorrow"
                  </button>
                  <button
                    onClick={() => handleCustomerResponse('I have already transferred the full amount yesterday via NEFT.')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200"
                  >
                    ✅ "Already paid yesterday"
                  </button>
                  <button
                    onClick={() => handleCustomerResponse('There is a mistake in the invoice quantity, we returned some goods.')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200"
                  >
                    ⚠️ "Dispute invoice quantity"
                  </button>
                </>
              )}

              {language === 'hi' && (
                <>
                  <button
                    onClick={() => handleCustomerResponse('हाँ, मुझे व्हाट्सएप पर तुरंत यूपीआई भुगतान लिंक भेज दीजिए।')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200"
                  >
                    👍 "हाँ, लिंक भेजें"
                  </button>
                  <button
                    onClick={() => handleCustomerResponse('मैं कल दोपहर तक दुकान से पूरा भुगतान ट्रांसफर कर दूंगा।')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200"
                  >
                    ⏰ "कल दोपहर दूंगा"
                  </button>
                  <button
                    onClick={() => handleCustomerResponse('हमने कल शाम को ही पूरा बिल चुका दिया है, चेक कर लीजिए।')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200"
                  >
                    ✅ "पहले ही दे दिया है"
                  </button>
                  <button
                    onClick={() => handleCustomerResponse('बिल में दर गलत लगाई गई है, मैनेजर से बात कराइए।')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200"
                  >
                    ⚠️ "बिल में गलती है"
                  </button>
                </>
              )}

              {language === 'mr' && (
                <>
                  <button
                    onClick={() => handleCustomerResponse('हो, मला व्हॉट्सॲपवर त्वरित पेमेंट लिंक पाठवा, मी लगेच भरतो.')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200"
                  >
                    👍 "हो, लिंक पाठवा"
                  </button>
                  <button
                    onClick={() => handleCustomerResponse('उद्या सकाळी दुकान उघडल्यावर मी पूर्ण रक्कम ट्रान्सफर करतो.')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200"
                  >
                    ⏰ "उद्या सकाळी देतो"
                  </button>
                  <button
                    onClick={() => handleCustomerResponse('आम्ही २ बंडल वायर रिटर्न केली होती, बिल दुरुस्त करा.')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200"
                  >
                    ⚠️ "सामान परत केले होते"
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Bottom Call Control Action Bar */}
        <div className="p-4 bg-black border-t border-zinc-800 flex items-center justify-between">
          {callState === 'IDLE' && (
            <button
              onClick={startCall}
              className="w-full py-3.5 rounded-2xl bg-white hover:bg-zinc-200 text-black font-bold text-sm transition shadow-md flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-4 h-4 text-black" />
              <span>Start AI Voice Call ({language.toUpperCase()})</span>
            </button>
          )}

          {callState === 'DIALING' && (
            <button
              onClick={endCall}
              className="w-full py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition flex items-center justify-center gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Cancel Dialing</span>
            </button>
          )}

          {callState === 'CONNECTED' && (
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCustomerResponse(inputText);
                  }}
                  placeholder="Or type custom customer speech..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-white"
                />
                <button
                  onClick={() => handleCustomerResponse(inputText)}
                  className="p-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold transition"
                >
                  <Send className="w-4 h-4 text-black" />
                </button>
              </div>

              <button
                onClick={endCall}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-lg flex items-center gap-1.5 shrink-0"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Call</span>
              </button>
            </div>
          )}

          {callState === 'ENDED' && (
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-zinc-300">
                <span>Final Call Disposition: </span>
                <strong className="text-white capitalize">{disposition?.replace(/_/g, ' ') || 'Completed'}</strong>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={startCall}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold transition border border-zinc-700"
                >
                  Call Again
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                >
                  Close & View Log
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
