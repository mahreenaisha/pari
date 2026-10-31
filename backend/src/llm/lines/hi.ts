/** Hindi: Roman Hinglish on screen, Devanagari for speech. */
import { type LineBook, phoneForDisplay, phoneForSpeech, r } from "./book.js";

export const hi: LineBook = {
  entryReadback: (e, needsReview) => {
    const care = needsReview
      ? { text: "Ek baar dhyaan se suniye. ", speech: "एक बार ध्यान से सुनिए। " }
      : { text: "", speech: "" };
    if (e.paidRupees === 0) {
      return {
        text: `${care.text}${e.customerName}, ₹${r(e.pendingRupees)} udhaar. Save karoon?`,
        speech: `${care.speech}${e.customerName}, ${r(e.pendingRupees)} रुपये उधार। सेव करूँ?`,
      };
    }
    if (e.pendingRupees === 0) {
      return {
        text: `${care.text}${e.customerName}, ₹${r(e.totalRupees)} ka saamaan, poora ₹${r(e.paidRupees)} mil gaya. Save karoon?`,
        speech: `${care.speech}${e.customerName}, ${r(e.totalRupees)} रुपये का सामान, पूरे ${r(e.paidRupees)} मिल गए। सेव करूँ?`,
      };
    }
    return {
      text: `${care.text}${e.customerName}, total ₹${r(e.totalRupees)}, ₹${r(e.paidRupees)} mile, ₹${r(e.pendingRupees)} baaki. Save karoon?`,
      speech: `${care.speech}${e.customerName}, कुल ${r(e.totalRupees)}, ${r(e.paidRupees)} मिले, ${r(e.pendingRupees)} बाकी। सेव करूँ?`,
    };
  },

  savedAskCollect: (pendingRupees) => ({
    text: `Save ho gaya. ₹${r(pendingRupees)} ka payment link bhejun?`,
    speech: `सेव हो गया। ${r(pendingRupees)} रुपये का पेमेंट लिंक भेजूँ?`,
  }),

  savedClosed: () => ({
    text: "Save ho gaya. Poora payment mil gaya, khaata band.",
    speech: "सेव हो गया। पूरा पेमेंट मिल गया, खाता बंद।",
  }),

  entryRejected: () => ({
    text: "Theek hai, entry cancel. Dobara boliye.",
    speech: "ठीक है, एंट्री कैंसिल। दोबारा बोलिए।",
  }),

  entryCorrected: (e, needsReview) => {
    const base = hi.entryReadback(e, needsReview);
    return { text: `Theek kiya. ${base.text}`, speech: `ठीक किया। ${base.speech}` };
  },

  askPhone: (customerName) => ({
    text: `${customerName} ka mobile number bataiye.`,
    speech: `${customerName} का मोबाइल नंबर बताइए।`,
  }),

  phoneReadback: (phone) => ({
    text: `${phoneForDisplay(phone)}. Sahi hai?`,
    speech: `${phoneForSpeech(phone)}। सही है?`,
  }),

  phoneInvalid: () => ({
    text: "Yeh number sahi nahi laga. 10 digit ka mobile number boliye.",
    speech: "यह नंबर सही नहीं लगा। दस अंकों का मोबाइल नंबर बोलिए।",
  }),

  phoneRetry: () => ({ text: "Theek hai, number dobara boliye.", speech: "ठीक है, नंबर दोबारा बोलिए।" }),

  linkSent: (customerName, amountRupees) => ({
    text: `Link bhej diya. ${customerName} ko ₹${r(amountRupees)} ka link SMS ho gaya.`,
    speech: `लिंक भेज दिया। ${customerName} को ${r(amountRupees)} रुपये का लिंक SMS हो गया।`,
  }),

  collectDeclined: () => ({
    text: "Theek hai, link nahi bheja. Entry khuli hai.",
    speech: "ठीक है, लिंक नहीं भेजा। एंट्री खुली है।",
  }),

  linkPaid: (customerName, amountRupees, pendingRupees) =>
    pendingRupees === 0
      ? {
          text: `${customerName} ne ₹${r(amountRupees)} de diye. Khaata band.`,
          speech: `${customerName} ने ${r(amountRupees)} रुपये दे दिए। खाता बंद।`,
        }
      : {
          text: `${customerName} ne ₹${r(amountRupees)} diye. Ab ₹${r(pendingRupees)} baaki.`,
          speech: `${customerName} ने ${r(amountRupees)} रुपये दिए। अब ${r(pendingRupees)} बाकी।`,
        },

  qrAsk: (amountRupees, customerName, pendingRupees) => {
    const over = amountRupees > pendingRupees;
    return {
      text: `₹${r(amountRupees)} aaya, ${customerName} ka?${over ? ` (Baaki sirf ₹${r(pendingRupees)} tha.)` : ""}`,
      speech: `${r(amountRupees)} रुपये आए, ${customerName} के?${over ? ` बाकी सिर्फ़ ${r(pendingRupees)} था।` : ""}`,
    };
  },

  qrNoCandidate: (amountRupees) => ({
    text: `₹${r(amountRupees)} ka QR payment aaya. Kisi khuli entry se match nahi hua.`,
    speech: `${r(amountRupees)} रुपये का QR पेमेंट आया। किसी खुली एंट्री से मैच नहीं हुआ।`,
  }),

  qrMatched: (customerName, pendingRupees) =>
    pendingRupees === 0
      ? {
          text: `Theek hai, ${customerName} ke khaate mein jod diya. Khaata band.`,
          speech: `ठीक है, ${customerName} के खाते में जोड़ दिया। खाता बंद।`,
        }
      : {
          text: `Theek hai, ${customerName} ke khaate mein jod diya. Ab ₹${r(pendingRupees)} baaki.`,
          speech: `ठीक है, ${customerName} के खाते में जोड़ दिया। अब ${r(pendingRupees)} बाकी।`,
        },

  paymentUnmatched: (amountRupees) => ({
    text: `₹${r(amountRupees)} ka payment aaya, par uski entry pehle hi band hai. Alag rakh diya.`,
    speech: `${r(amountRupees)} रुपये का पेमेंट आया, पर उसकी एंट्री पहले ही बंद है। अलग रख दिया।`,
  }),

  linkFailed: () => ({
    text: "Paytm se link nahi ban paaya. Thodi der baad phir koshish kijiye.",
    speech: "पेटीएम से लिंक नहीं बन पाया। थोड़ी देर बाद फिर कोशिश कीजिए।",
  }),

  qrLeftUnmatched: () => ({
    text: "Theek hai, yeh payment alag rakh diya.",
    speech: "ठीक है, यह पेमेंट अलग रख दिया।",
  }),

  notUnderstoodYesNo: () => ({
    text: "Maaf kijiye, samajh nahi aaya. Haan ya nahi boliye.",
    speech: "माफ़ कीजिए, समझ नहीं आया। हाँ या नहीं बोलिए।",
  }),

  notAnEntry: () => ({
    text: "Maaf kijiye, samajh nahi aaya. Aise boliye: Gupta ji ne 350 ka samaan liya, 200 diye, 150 baaki.",
    speech: "माफ़ कीजिए, समझ नहीं आया। ऐसे बोलिए: गुप्ता जी ने 350 का सामान लिया, 200 दिए, 150 बाकी।",
  }),

  amountsUnclear: () => ({
    text: "Amount saaf sunaai nahi diya. Ek baar phir boliye.",
    speech: "अमाउंट साफ़ सुनाई नहीं दिया। एक बार फिर बोलिए।",
  }),
};
