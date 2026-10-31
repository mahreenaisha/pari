import type { Language } from "../contracts/index.js";

export type YesNo = "yes" | "no" | "unknown";

interface Words {
  yes: string[];
  no: string[];
}

// Hindi and English count whatever language the merchant picked; the app's buttons send "haan" and "nahi".
const NO = [
  "nahi", "nahin", "nai", "nahi ji", "na", "naa", "mat", "no", "nope", "cancel", "galat", "rehne do", "rahne do",
  "chhodo", "chodo", "mat bhejo", "abhi nahi",
  "wrong", "incorrect", "not right", "not correct", "not now", "do not", "don't", "dont",
  "नहीं", "नही", "ना", "मत", "गलत", "ग़लत", "रहने दो", "छोड़ो", "कैंसिल",
];
const YES = [
  "haan", "haa", "han", "ha", "haanji", "hanji", "haan ji", "ji haan", "ji bilkul", "theek hai", "thik hai", "theek",
  "thik", "sahi hai", "sahi", "ok", "okay", "yes", "yeah", "yep", "bilkul", "kar do", "kardo", "karo", "save karo",
  "save kar do", "bhejo", "bhej do", "bhejdo", "sure", "done", "chalega", "zaroor", "jarur",
  "correct", "right", "alright", "go ahead", "send it", "save it",
  "हाँ", "हां", "हा", "जी हाँ", "जी हां", "हाँ जी", "हां जी", "ठीक", "ठीक है", "सही", "सही है", "बिल्कुल", "भेजो", "भेज दो", "कर दो", "करो",
  "ओके", "चलेगा", "ज़रूर", "जरूर",
];

/**
 * Each language's own words, in its script and common Roman spellings. They only count for merchants who
 * picked that language: the Marathi "ho" (yes) would misfire on the Hindi "ho gaya".
 */
const OWN: Partial<Record<Language, Words>> = {
  "bn-IN": {
    yes: ["হ্যাঁ", "হ্যা", "হাঁ", "হুঁ", "ঠিক", "আচ্ছা", "অবশ্যই", "পাঠাও", "পাঠান", "পাঠিয়ে দাও", "পাঠিয়ে দিন", "করো", "করুন",
      "hyan", "hya", "thik", "accha", "achha", "pathao", "pathiye dao", "koro"],
    no: ["না", "নাহ", "নয়", "ভুল", "বাতিল", "থাক", "দরকার নেই", "bhul", "batil", "thak", "dorkar nei"],
  },
  "ta-IN": {
    yes: ["ஆமா", "ஆமாம்", "ஆம்", "சரி", "சரிங்க", "ஓகே", "அனுப்பு", "அனுப்புங்க", "பண்ணு", "பண்ணுங்க", "கண்டிப்பா",
      "aama", "aamaa", "aamam", "sari", "seri", "saringa", "anuppu", "anuppunga", "pannunga", "kandippa"],
    no: ["இல்லை", "இல்ல", "வேண்டாம்", "வேணாம்", "வேணா", "தப்பு", "தவறு", "சரியில்லை", "அனுப்பாதே", "அனுப்பாதீங்க",
      "illai", "illa", "vendaam", "vendam", "venaam", "venam", "thappu", "tappu"],
  },
  "te-IN": {
    yes: ["అవును", "ఔను", "సరే", "సరి", "ఓకే", "పంపు", "పంపండి", "చేయండి", "చెయ్యండి", "తప్పకుండా", "కరెక్ట్",
      "avunu", "aunu", "sare", "sari", "pampu", "pampandi", "cheyandi", "cheyyandi", "tappakunda", "thappakunda"],
    no: ["కాదు", "వద్దు", "వొద్దు", "లేదు", "తప్పు", "సరికాదు", "పంపొద్దు", "పంపకండి", "చేయొద్దు",
      "kaadu", "kadu", "vaddu", "voddu", "ledu", "tappu", "thappu", "pampoddu"],
  },
  "kn-IN": {
    yes: ["ಹೌದು", "ಹೂಂ", "ಹೂ", "ಸರಿ", "ಓಕೆ", "ಕಳಿಸಿ", "ಕಳುಹಿಸಿ", "ಮಾಡಿ", "ಖಂಡಿತ",
      "haudu", "howdu", "sari", "kalisi", "kaluhisi", "maadi", "khanditha"],
    no: ["ಇಲ್ಲ", "ಬೇಡ", "ಬೇಡಾ", "ಬೇಡಿ", "ತಪ್ಪು", "ಸರಿಯಿಲ್ಲ", "ಕಳಿಸಬೇಡಿ", "ಮಾಡಬೇಡಿ", "illa", "beda", "bedaa", "tappu", "thappu"],
  },
  "ml-IN": {
    yes: ["അതെ", "ശരി", "ഉവ്വ്", "ഓക്കെ", "ഓകെ", "അയയ്ക്കൂ", "അയക്കൂ", "അയച്ചോ", "ചെയ്യൂ", "ചെയ്തോ", "തീർച്ചയായും",
      "athe", "sheri", "shari", "uvvu", "ayakku", "cheyyu"],
    no: ["ഇല്ല", "അല്ല", "വേണ്ട", "തെറ്റ്", "ശരിയല്ല", "അയയ്ക്കണ്ട", "അയക്കണ്ട", "ചെയ്യണ്ട", "illa", "alla", "venda", "vendaa", "thettu"],
  },
  "mr-IN": {
    yes: ["हो", "होय", "बरोबर", "चालेल", "ठीक आहे", "पाठवा", "करा", "नक्की", "हं",
      "ho", "hoy", "barobar", "chalel", "thik aahe", "theek aahe", "pathva", "kara", "nakki"],
    no: ["नाही", "नको", "नाय", "नका", "चूक", "चुकीचं", "चुकीचे", "रद्द", "naahi", "nako", "naay", "naka", "chuk"],
  },
  "gu-IN": {
    yes: ["હા", "હાં", "હાજી", "બરાબર", "ઠીક", "ચાલશે", "મોકલો", "મોકલી દો", "કરો", "કરી દો", "જરૂર",
      "haji", "barabar", "thik che", "thik chhe", "theek che", "chalse", "chalshe", "moklo", "mokli do", "kari do"],
    no: ["ના", "નહીં", "નહિ", "નથી", "ખોટું", "રહેવા દો", "કેન્સલ", "nathi", "khotu", "rehva do"],
  },
  "pa-IN": {
    yes: ["ਹਾਂ", "ਹਾਂਜੀ", "ਜੀ ਹਾਂ", "ਠੀਕ", "ਸਹੀ", "ਭੇਜੋ", "ਭੇਜ ਦਿਓ", "ਕਰ ਦਿਓ", "ਕਰੋ", "ਬਿਲਕੁਲ", "ਜ਼ਰੂਰ", "ਚੱਲੇਗਾ",
      "bhej dio", "kar dio", "theek aa", "thik aa"],
    no: ["ਨਹੀਂ", "ਨਹੀ", "ਨਾ", "ਨਾਂਹ", "ਗਲਤ", "ਗ਼ਲਤ", "ਰਹਿਣ ਦਿਓ", "ਕੈਂਸਲ", "rehan dio", "rehn dio"],
  },
  "od-IN": {
    yes: ["ହଁ", "ଠିକ", "ଠିକ୍", "ଆଚ୍ଛା", "ପଠାନ୍ତୁ", "ପଠାଅ", "କରନ୍ତୁ", "କରିଦିଅ", "ନିଶ୍ଚୟ", "ହଉ",
      "thik achhi", "thik achi", "pathantu", "karantu", "hau"],
    no: ["ନା", "ନାହିଁ", "ନାଇଁ", "ଭୁଲ", "ବାତିଲ", "ଥାଉ", "ଦରକାର ନାହିଁ", "bhul", "thau"],
  },
};

function normalize(text: string): string {
  return ` ${text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u200c\u200d]/g, "")
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

// Phrases go through the same normalization as transcripts, so a nukta letter matches however it was typed.
const prepare = (phrases: string[]) => phrases.map((p) => normalize(p).trim());
const BASE: Words = { yes: prepare(YES), no: prepare(NO) };
const PREPARED = new Map(Object.entries(OWN).map(([language, words]) => [language, { yes: prepare(words.yes), no: prepare(words.no) }]));

const hasPhrase = (haystack: string, phrases: string[]) => phrases.some((p) => haystack.includes(` ${p} `));

/** Negation wins: "theek nahi hai" is a no. */
export function detectYesNo(text: string, language: Language): YesNo {
  const t = normalize(text);
  const own = PREPARED.get(language);
  if (hasPhrase(t, BASE.no) || (own && hasPhrase(t, own.no))) return "no";
  if (hasPhrase(t, BASE.yes) || (own && hasPhrase(t, own.yes))) return "yes";
  return "unknown";
}

/** What's left once the yes and no words are taken out: "haan, lekin 250 diye" leaves "lekin 250 diye". */
export function otherWords(text: string, language: Language): string[] {
  const own = PREPARED.get(language);
  const phrases = [...BASE.no, ...BASE.yes, ...(own ? [...own.no, ...own.yes] : [])].sort((a, b) => b.length - a.length);
  let t = normalize(text);
  for (const p of phrases) {
    while (t.includes(` ${p} `)) t = t.replace(` ${p} `, " ");
  }
  return t.split(" ").filter(Boolean);
}
