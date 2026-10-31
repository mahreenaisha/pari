/** Bengali: Bengali script on screen and for speech, with ₹ spoken as টাকা. */
import { type LineBook, phoneForDisplay, phoneForSpeech, r } from "./book.js";

export const bn: LineBook = {
  entryReadback: (e, needsReview) => {
    const care = needsReview ? "একবার মন দিয়ে শুনুন। " : "";
    if (e.paidRupees === 0) {
      return {
        text: `${care}${e.customerName}, ₹${r(e.pendingRupees)} ধার। save করব?`,
        speech: `${care}${e.customerName}, ${r(e.pendingRupees)} টাকা ধার। save করব?`,
      };
    }
    if (e.pendingRupees === 0) {
      return {
        text: `${care}${e.customerName}, ₹${r(e.totalRupees)}-এর জিনিস, পুরো ₹${r(e.paidRupees)} পাওয়া গেছে। save করব?`,
        speech: `${care}${e.customerName}, ${r(e.totalRupees)} টাকার জিনিস, পুরো ${r(e.paidRupees)} টাকা পাওয়া গেছে। save করব?`,
      };
    }
    return {
      text: `${care}${e.customerName}, মোট ₹${r(e.totalRupees)}, ₹${r(e.paidRupees)} পাওয়া গেছে, ₹${r(e.pendingRupees)} বাকি। save করব?`,
      speech: `${care}${e.customerName}, মোট ${r(e.totalRupees)} টাকা, ${r(e.paidRupees)} পাওয়া গেছে, ${r(e.pendingRupees)} বাকি। save করব?`,
    };
  },

  savedAskCollect: (pendingRupees) => ({
    text: `save হয়ে গেছে। ₹${r(pendingRupees)}-এর payment link পাঠাব?`,
    speech: `save হয়ে গেছে। ${r(pendingRupees)} টাকার payment link পাঠাব?`,
  }),

  savedClosed: () => ({
    text: "save হয়ে গেছে। পুরো টাকা পাওয়া গেছে, খাতা বন্ধ।",
    speech: "save হয়ে গেছে। পুরো টাকা পাওয়া গেছে, খাতা বন্ধ।",
  }),

  entryRejected: () => ({
    text: "ঠিক আছে, entry বাতিল। আবার বলুন।",
    speech: "ঠিক আছে, entry বাতিল। আবার বলুন।",
  }),

  entryCorrected: (e, needsReview) => {
    const base = bn.entryReadback(e, needsReview);
    return { text: `ঠিক করে দিলাম। ${base.text}`, speech: `ঠিক করে দিলাম। ${base.speech}` };
  },

  askPhone: (customerName) => ({
    text: `${customerName}-এর mobile নম্বর বলুন।`,
    speech: `${customerName}-এর mobile নম্বর বলুন।`,
  }),

  phoneReadback: (phone) => ({
    text: `${phoneForDisplay(phone)}। ঠিক আছে?`,
    speech: `${phoneForSpeech(phone)}। ঠিক আছে?`,
  }),

  phoneInvalid: () => ({
    text: "এই নম্বরটা ঠিক মনে হচ্ছে না। 10 সংখ্যার mobile নম্বর বলুন।",
    speech: "এই নম্বরটা ঠিক মনে হচ্ছে না। দশ সংখ্যার mobile নম্বর বলুন।",
  }),

  phoneRetry: () => ({
    text: "ঠিক আছে, নম্বরটা আবার বলুন।",
    speech: "ঠিক আছে, নম্বরটা আবার বলুন।",
  }),

  linkSent: (customerName, amountRupees) => ({
    text: `link পাঠিয়ে দিয়েছি। ${customerName}-কে ₹${r(amountRupees)}-এর link SMS করা হয়েছে।`,
    speech: `link পাঠিয়ে দিয়েছি। ${customerName}-কে ${r(amountRupees)} টাকার link SMS করা হয়েছে।`,
  }),

  collectDeclined: () => ({
    text: "ঠিক আছে, link পাঠালাম না। entry খোলা আছে।",
    speech: "ঠিক আছে, link পাঠালাম না। entry খোলা আছে।",
  }),

  linkPaid: (customerName, amountRupees, pendingRupees) =>
    pendingRupees === 0
      ? {
          text: `${customerName} ₹${r(amountRupees)} দিয়ে দিয়েছেন। খাতা বন্ধ।`,
          speech: `${customerName} ${r(amountRupees)} টাকা দিয়ে দিয়েছেন। খাতা বন্ধ।`,
        }
      : {
          text: `${customerName} ₹${r(amountRupees)} দিয়েছেন। এখন ₹${r(pendingRupees)} বাকি।`,
          speech: `${customerName} ${r(amountRupees)} টাকা দিয়েছেন। এখন ${r(pendingRupees)} টাকা বাকি।`,
        },

  qrAsk: (amountRupees, customerName, pendingRupees) => {
    const over = amountRupees > pendingRupees;
    return {
      text: `₹${r(amountRupees)} এসেছে, ${customerName}-এর?${over ? ` (বাকি ছিল মাত্র ₹${r(pendingRupees)}।)` : ""}`,
      speech: `${r(amountRupees)} টাকা এসেছে, ${customerName}-এর?${over ? ` বাকি ছিল মাত্র ${r(pendingRupees)} টাকা।` : ""}`,
    };
  },

  qrNoCandidate: (amountRupees) => ({
    text: `₹${r(amountRupees)}-এর QR payment এসেছে। কোনো খোলা entry-র সাথে মেলেনি।`,
    speech: `${r(amountRupees)} টাকার QR payment এসেছে। কোনো খোলা entry-র সাথে মেলেনি।`,
  }),

  qrMatched: (customerName, pendingRupees) =>
    pendingRupees === 0
      ? {
          text: `ঠিক আছে, ${customerName}-এর খাতায় যোগ করে দিলাম। খাতা বন্ধ।`,
          speech: `ঠিক আছে, ${customerName}-এর খাতায় যোগ করে দিলাম। খাতা বন্ধ।`,
        }
      : {
          text: `ঠিক আছে, ${customerName}-এর খাতায় যোগ করে দিলাম। এখন ₹${r(pendingRupees)} বাকি।`,
          speech: `ঠিক আছে, ${customerName}-এর খাতায় যোগ করে দিলাম। এখন ${r(pendingRupees)} টাকা বাকি।`,
        },

  paymentUnmatched: (amountRupees) => ({
    text: `₹${r(amountRupees)}-এর payment এসেছে, কিন্তু তার entry আগেই বন্ধ হয়ে গেছে। আলাদা করে রাখলাম।`,
    speech: `${r(amountRupees)} টাকার payment এসেছে, কিন্তু তার entry আগেই বন্ধ হয়ে গেছে। আলাদা করে রাখলাম।`,
  }),

  linkFailed: () => ({
    text: "Paytm থেকে link তৈরি করা গেল না। একটু পরে আবার চেষ্টা করুন।",
    speech: "Paytm থেকে link তৈরি করা গেল না। একটু পরে আবার চেষ্টা করুন।",
  }),

  qrLeftUnmatched: () => ({
    text: "ঠিক আছে, এই payment-টা আলাদা করে রাখলাম।",
    speech: "ঠিক আছে, এই payment-টা আলাদা করে রাখলাম।",
  }),

  notUnderstoodYesNo: () => ({
    text: "দুঃখিত, বুঝতে পারলাম না। হ্যাঁ বা না বলুন।",
    speech: "দুঃখিত, বুঝতে পারলাম না। হ্যাঁ বা না বলুন।",
  }),

  notAnEntry: () => ({
    text: "দুঃখিত, বুঝতে পারলাম না। এভাবে বলুন: ঘোষবাবু 350 টাকার জিনিস নিলেন, 200 দিলেন, 150 বাকি।",
    speech: "দুঃখিত, বুঝতে পারলাম না। এভাবে বলুন: ঘোষবাবু 350 টাকার জিনিস নিলেন, 200 দিলেন, 150 বাকি।",
  }),

  amountsUnclear: () => ({
    text: "টাকার অঙ্ক পরিষ্কার শোনা গেল না। আর একবার বলুন।",
    speech: "টাকার অঙ্ক পরিষ্কার শোনা গেল না। আর একবার বলুন।",
  }),
};
