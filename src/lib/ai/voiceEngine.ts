import { CallDisposition, CallLanguage, CallMessage, CallRecord } from '../types';
import { formatINR } from '../utils';

export interface VoicePromptConfig {
  businessName: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  language: CallLanguage;
}

export const VOICE_SCRIPTS: Record<CallLanguage, {
  initialGreeting: (cfg: VoicePromptConfig) => string;
  onPaymentYes: (cfg: VoicePromptConfig) => string;
  onPaymentPromise: (cfg: VoicePromptConfig, dateStr?: string) => string;
  onAlreadyPaid: (cfg: VoicePromptConfig) => string;
  onDispute: (cfg: VoicePromptConfig) => string;
  onUnknown: (cfg: VoicePromptConfig) => string;
}> = {
  en: {
    initialGreeting: (cfg) =>
      `Hello ${cfg.customerName}, this is an automated payment assistance call from ${cfg.businessName}. Your invoice ${cfg.invoiceNumber} has an outstanding balance of ${formatINR(cfg.amount)}. Would you like to receive an instant UPI payment link to settle this now?`,
    onPaymentYes: (cfg) =>
      `Thank you! I have just sent an instant secure payment link to your registered mobile number via WhatsApp and SMS. Please complete the payment to keep your credit limit active. Have a great day!`,
    onPaymentPromise: (cfg, dateStr) =>
      `Understood. We have noted your commitment to pay by ${dateStr || 'tomorrow'}. A reminder notification will be sent then. Thank you for your cooperation!`,
    onAlreadyPaid: (cfg) =>
      `Thank you for letting us know. We will verify your transaction with our accounts department and update your ledger within 2 hours.`,
    onDispute: (cfg) =>
      `We apologize for the inconvenience. A priority dispute ticket has been logged, and our accounts manager will review invoice ${cfg.invoiceNumber} and call you shortly.`,
    onUnknown: (cfg) =>
      `I didn't quite catch that. You can reply with "Yes, send link", "Will pay tomorrow", or "Already paid".`,
  },
  hi: {
    initialGreeting: (cfg) =>
      `नमस्ते ${cfg.customerName} जी, यह ${cfg.businessName} से एक स्वचालित भुगतान सहायता कॉल है। आपके बिल नंबर ${cfg.invoiceNumber} पर ${formatINR(cfg.amount)} की बकाया राशि है। क्या आप इसे अभी चुकाने के लिए तुरंत यूपीआई भुगतान लिंक प्राप्त करना चाहेंगे?`,
    onPaymentYes: (cfg) =>
      `धन्यवाद! मैंने आपके पंजीकृत मोबाइल नंबर पर व्हाट्सएप और एसएमएस के माध्यम से सुरक्षित भुगतान लिंक भेज दिया है। कृपया भुगतान पूरा करें। आपका दिन शुभ हो!`,
    onPaymentPromise: (cfg, dateStr) =>
      `समझ गया। हमने ${dateStr || 'कल'} तक भुगतान करने का आपका आश्वासन नोट कर लिया है। तब आपको एक अनुस्मारक भेजा जाएगा। धन्यवाद!`,
    onAlreadyPaid: (cfg) =>
      `सूचित करने के लिए धन्यवाद। हम अपने लेखा विभाग से जांच करेंगे और 2 घंटे के भीतर आपका खाता अपडेट कर देंगे।`,
    onDispute: (cfg) =>
      `असुविधा के लिए क्षमा करें। हमने आपके बिल ${cfg.invoiceNumber} के संबंध में एक शिकायत दर्ज कर ली है और हमारे प्रबंधक जल्द ही आपसे संपर्क करेंगे।`,
    onUnknown: (cfg) =>
      `माफ़ कीजिये, मैं समझ नहीं पाया। आप "हाँ, लिंक भेजें", "कल दूंगा", या "पहले ही दे दिया है" कह सकते हैं।`,
  },
  mr: {
    initialGreeting: (cfg) =>
      `नमस्कार ${cfg.customerName} जी, हा ${cfg.businessName} कडून पेमेंट असिस्टन्स कॉल आहे. आपल्या बिल क्रमांक ${cfg.invoiceNumber} वर ${formatINR(cfg.amount)} रक्कम बाकी आहे. आपण त्वरित यूपीआय पेमेंट लिंकवर पेमेंट करू इच्छिता का?`,
    onPaymentYes: (cfg) =>
      `धन्यवाद! आम्ही आपल्या नोंदणीकृत मोबाईल नंबरवर व्हॉट्सॲप आणि एसएमएस द्वारे त्वरित पेमेंट लिंक पाठवली आहे. कृपया पेमेंट पूर्ण करा. धन्यवाद!`,
    onPaymentPromise: (cfg, dateStr) =>
      `ठीक आहे. आम्ही ${dateStr || 'उद्यापर्यंत'} पेमेंट करण्याचे आपले वचन नोंदवले आहे. आपल्याला योग्य वेळी रिमाइंडर पाठवला जाईल. धन्यवाद!`,
    onAlreadyPaid: (cfg) =>
      `माहिती दिल्याबद्दल धन्यवाद. आमचे अकाउंट्स विभाग आपल्या व्यवहाराची पडताळणी करेल आणि २ तासांत लेजर अपडेट करेल.`,
    onDispute: (cfg) =>
      `झालेल्या गैरसोयीबद्दल क्षमस्व. आपल्या बिल ${cfg.invoiceNumber} संदर्भातील तक्रार नोंदवली आहे, आमचे मॅनेजर लवकरच आपल्याशी संपर्क साधतील.`,
    onUnknown: (cfg) =>
      `क्षमस्व, मला समजले नाही. आपण "हो, लिंक पाठवा", "उद्या देतो", किंवा "आधीच दिले आहे" असे सांगू शकता.`,
  }
};

/**
 * Parses user speech/text response to determine customer intent
 */
export function analyzeCustomerIntent(
  text: string,
  lang: CallLanguage = 'en'
): {
  intent: 'PAYMENT_YES' | 'PAYMENT_PROMISE' | 'ALREADY_PAID' | 'DISPUTE' | 'UNKNOWN';
  disposition: CallDisposition;
  sentiment: CallMessage['sentiment'];
  replyKey: keyof typeof VOICE_SCRIPTS['en'];
} {
  const lower = text.toLowerCase();

  // 1. Payment Yes / Send Link
  if (
    lower.includes('yes') || lower.includes('send link') || lower.includes('link') ||
    lower.includes('haan') || lower.includes('ha') || lower.includes('pay now') ||
    lower.includes('ho') || lower.includes('pathva') || lower.includes('bhej do') ||
    lower.includes('karta hu') || lower.includes('kar to') || lower.includes('sure') ||
    lower.includes('okay') || lower.includes('send') || lower.includes('upi')
  ) {
    return {
      intent: 'PAYMENT_YES',
      disposition: 'REQUESTED_PAYMENT_LINK',
      sentiment: 'positive',
      replyKey: 'onPaymentYes',
    };
  }

  // 2. Promise to Pay / Tomorrow / Later
  if (
    lower.includes('tomorrow') || lower.includes('kal') || lower.includes('udya') ||
    lower.includes('later') || lower.includes('next week') || lower.includes('somwar') ||
    lower.includes('monday') || lower.includes('shaam') || lower.includes('evening') ||
    lower.includes('promise') || lower.includes('dunga') || lower.includes('deto')
  ) {
    return {
      intent: 'PAYMENT_PROMISE',
      disposition: 'PAYMENT_PROMISED',
      sentiment: 'neutral',
      replyKey: 'onPaymentPromise',
    };
  }

  // 3. Already Paid
  if (
    lower.includes('already paid') || lower.includes('paid') || lower.includes('pehle hi') ||
    lower.includes('de diya') || lower.includes('dila') || lower.includes('aadhi ch') ||
    lower.includes('completed') || lower.includes('transfer done') || lower.includes('gpay done')
  ) {
    return {
      intent: 'ALREADY_PAID',
      disposition: 'ALREADY_PAID',
      sentiment: 'positive',
      replyKey: 'onAlreadyPaid',
    };
  }

  // 4. Dispute / Wrong bill
  if (
    lower.includes('wrong') || lower.includes('galat') || lower.includes('chuk') ||
    lower.includes('dispute') || lower.includes('not mine') || lower.includes('complaint') ||
    lower.includes('return kiya') || lower.includes('rejected') || lower.includes('overcharge')
  ) {
    return {
      intent: 'DISPUTE',
      disposition: 'DISPUTE_RAISED',
      sentiment: 'urgent',
      replyKey: 'onDispute',
    };
  }

  return {
    intent: 'UNKNOWN',
    disposition: 'CALLBACK_REQUESTED',
    sentiment: 'neutral',
    replyKey: 'onUnknown',
  };
}

/**
 * Speaks text out loud using browser Web Speech API (with fallback)
 */
export function speakText(
  text: string,
  language: CallLanguage = 'en',
  onEnd?: () => void
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) setTimeout(onEnd, 2500);
    return false;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose appropriate voice
    const voices = window.speechSynthesis.getVoices();
    if (language === 'hi') {
      utterance.lang = 'hi-IN';
      const hiVoice = voices.find(v => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi'));
      if (hiVoice) utterance.voice = hiVoice;
    } else if (language === 'mr') {
      utterance.lang = 'mr-IN';
      const mrVoice = voices.find(v => v.lang.includes('mr') || v.name.toLowerCase().includes('marathi'));
      if (mrVoice) utterance.voice = mrVoice;
    } else {
      utterance.lang = 'en-IN';
      const enVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.name.toLowerCase().includes('india'));
      if (enVoice) utterance.voice = enVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error('Speech synthesis error:', err);
    if (onEnd) setTimeout(onEnd, 2500);
    return false;
  }
}
