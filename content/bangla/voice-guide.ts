/**
 * Jibon Niye Khela (জীবন নিয়ে খেলা) — Dhakaiya Bangla Voice Guide & Slang Bank
 *
 * Single source of truth for the authentic colloquial Dhakaiya dialect
 * used in the game's hybrid Gemini content engine and local fallback banks.
 * Verified and refined by native-speaker review.
 */

export interface SlangEntry {
  term: string;
  transliteration: string;
  meaning: string;
  context: 'address' | 'status' | 'money' | 'action' | 'punchline';
  example: string;
}

export interface DhakaiyaVoiceGuide {
  dialectName: string;
  register: string;
  tone: string;
  canonicalLines: {
    birth: string;
    firstCall: string;
  };
  sampleSentences: Array<{
    category: string;
    text: string;
  }>;
  slangBank: SlangEntry[];
  iconicQuotes: string[];
}

export const DHAKAIYA_VOICE_GUIDE: DhakaiyaVoiceGuide = {
  dialectName: 'Dhakaiya Bangla (ঢাকাইয়া বাংলা)',
  register: 'Informal, cheeky, warm colloquial spoken Dhaka dialect',
  tone: 'Humorous, expressive, sharp-witted, relatable',

  canonicalLines: {
    birth: 'আব্বে হালায়! তুই তো দুনিয়ায় আইসাই পুরা মহল্লায় চান্দি গরম কইরা দিছত! এহন তো তুই সবার কইলজার টুকরা!',
    firstCall: 'আব্বে পিচ্চি! এহন তো তোর মুখ ফুটবো! ক দেহি, কার নাম লইবি পয়লা? আম্মা, আব্বা, নাকি পাড়ার নান্নার বিরিয়ানির নাম?',
  },

  sampleSentences: [
    {
      category: 'পয়দা / জন্ম',
      text: 'আব্বে হালায়! তুই তো দুনিয়ায় আইসাই পুরা মহল্লায় চান্দি গরম কইরা দিছত! এহন তো তুই সবার কইলজার টুকরা!',
    },
    {
      category: 'পয়লা ডাক',
      text: 'আব্বে পিচ্চি! এহন তো তোর মুখ ফুটবো! ক দেহি, কার নাম লইবি পয়লা? আম্মা, আব্বা, নাকি পাড়ার নান্নার বিরিয়ানির নাম?',
    },
    {
      category: 'আড্ডা / খাওয়া',
      text: 'কিরে জিগার! খামোখা চুদুর বুদুর না কইরা চল নাজিরাবাজার যাই! এক্কেরে চান তারা হোটেলে বইসা রগ চাবামু আর কাচ্চি খামু, পুরাই মাখনের লাহান!',
    },
    {
      category: 'পরীক্ষা / পড়াশোনা',
      text: 'মগজে ঘিলু নাই এক ছটাক, কিন্তু ভাব লয় পুরাই জজ ব্যারিস্টার! পরীক্ষায় ডিমাই পাড়সে, লেকিন ফুডানি দেখলে মনে হইবো আইন্সটাইন এর হালাতো ভাই!',
    },
    {
      category: 'ট্যাকা-পয়সা',
      text: 'পকেট পুরাই গড়ের মাঠ, বাতাস খায় আর হাডুডু খেলে! অথচ হালার ব্যাটার শখ নবাবের লাহান।',
    },
    {
      category: 'বিপদ / মাইঙ্কা চিপা',
      text: 'এক্কেরে বাঁশ বাগানের মাইঙ্কা চিপায় পইড়া এহন মরা কান্দন কাইন্দা লাভ আছে? যা বাশ খাওয়ার তো খায়া ফালাইসোস!',
    },
    {
      category: 'স্কুল / ভর্তি',
      text: 'ভাতিজা তো চান্স পাইয়া পুরাই কামাল কইরা দিছে! মহল্লার মাইনষে এহন মাগনা মিষ্টি খাইতে মশার লাহান ভনভন করতাছে।',
    },
    {
      category: 'প্রেম / ছ্যাঁকা',
      text: 'পিরিত করবি কর, লেকিন বাঁশ খাইয়া যখন ছ্যাঁকা খাইবি, তহন কিন্তু আমার সামনে আইসা ফ্যাঁচফ্যাঁচ কইরা ল্যাদাইবি না কইয়া দিলাম!',
    },
    {
      category: 'গাড়ি / রিকশা',
      text: 'আব্বে উস্তাদ! চান্দি কি গরম নাকি? ব্রেক তো পুরাই আলুথালু, এক্কেরে ধাক্কা খাইলে কিন্তু সোজা আজিমপুর গোরস্থান!',
    },
    {
      category: 'বিয়া / উৎসব',
      text: 'আইজকা রাইতে বিয়ার দাওয়াত! এক্কেরে গিয়ার বদলাইয়া কাচ্চি খামু, লগে বোরহানি দিয়া গলা না ভিজাইলে তো হজমই হইবো না!',
    },
    {
      category: 'ফাপড় / ফুটানি',
      text: 'আব্বে হালায়! তুই আমারে চিনস? আমি তো লালবাগের কালা মকসদের হালাতো ভাই! এক্কেরে থাপড়াইয়া তোর দাঁত সোয়ারিঘাট পাঠায়া দিমু!',
    },
    {
      category: 'মারামারি / পাড়া',
      text: 'আমগো মহল্লার পোলাপাইন, কামে নাই কাজে নাই, খালি ফাপড়বাজি আর কাইজ্জা করতে দিলে এক্কেরে অলিম্পিকে মেডেল আনবো!',
    },
    {
      category: 'বাইক / প্রেম',
      text: 'বাপের কামাই করা ট্যাকায় হোন্ডা হাঁকাইয়া ফুডানি নিয়া মাইয়া পটাইতে চাস? আব্বে হালায়, মাইয়া কি এতোই সোজা? নিজের পকেটের ট্যাকায় এক কাপ চা তো খাওয়ায়া দেখা!',
    },
    {
      category: 'পুলিশ / গ্যাঞ্জাম',
      text: 'কিরে মামু, পুলিশ দেখলে এমন উসাইন বোল্টের লাহান দৌড় দিলি ক্যান? ডাল মে কুছ কালা হ্যায় নাকি পুরা ডালটাই কালা?',
    },
    {
      category: 'অসুখ / স্বাস্থ্য',
      text: 'জ্বর আইছে তো কি আসমান ভাইঙ্গা পড়ছে নাকি? আম্মায় কইছে একখান নাপা আর এক বাটি গইল্লা (জাউ) ভাত খাইয়া এক্কেরে মড়ার লাহান শুইয়া থাক!',
    },
    {
      category: 'চাকরি / কাম',
      text: 'কাম তো পাইলি, লেকিন ট্যাকা দিবো কয়ডা? আবার গাধার লাহান খাটায়া মাস শেষে কলা ধরাইয়া দিবো না তো?',
    },
    {
      category: 'ঝগড়া / গ্যাঞ্জাম',
      text: 'আব্বে এইডা কী কস? কোথাকার জল কোথায় গড়ায়, আর পান্তা ভাতে ঘি ছড়ায়! তোর কথার তো আগামাথা সব গুল্লাইত!',
    },
    {
      category: 'বিয়ের নাচ',
      text: 'শালার পুতে বিয়ার মইধ্যে যেই একখান ড্যান্স দিল! এক্কেরে কমিউনিটি সেন্টারের ফ্লোর ফাইট্টা চৌচির, মনে হইলো যেন ভূমিকম্প আইছে!',
    },
    {
      category: 'প্যারা',
      text: 'জিন্দেগিডা পুরাই তেজপাতা বানায়া ফালাইছে! এক গ্যাঞ্জাম শেষ না হইতেই আরেক গ্যাঞ্জাম আইসা সালাম দেয়।',
    },
    {
      category: 'শেষ বয়স / মৃত্যু',
      text: 'এহন এক পা কবরে রাইখা কয়, জীবনে তো বহুত লাফালাফি করলি, বহুত চুদুর বুদুর করলি, তা শান্তিডা কি গুলিস্তানের ফুটপাতে পাইলি?',
    },
    // 💬 EVERYDAY DHAKAIYA SENTENCES
    // — Greetings & Questions —
    {
      category: 'সালাম ও কুশল',
      text: 'কিরে মামা, কেমতে দিনকাল কাডাইতাছস?',
    },
    {
      category: 'সালাম ও কুশল',
      text: 'আলহামদুলিল্লাহ, পুরাই মাখন আছি!',
    },
    {
      category: 'সালাম ও কুশল',
      text: 'কই যাস হালায়?',
    },
    {
      category: 'সালাম ও কুশল',
      text: 'এত দেরি ক্যালা? চান্দের দেশে গেছিলি নি?',
    },
    {
      category: 'সালাম ও কুশল',
      text: 'তুই কোন চিপায় থাহোস?',
    },
    // — Work, Study & Office —
    {
      category: 'পড়াশোনা / অফিস',
      text: 'আইজকা পইড়া পুরা উল্টায়া ফালামু!',
    },
    {
      category: 'পড়াশোনা / অফিস',
      text: 'এহন আর বইয়ের দিকে তাকাইতেই মুন চায় না, প্যারা লাগতাছে।',
    },
    {
      category: 'পড়াশোনা / অফিস',
      text: 'মামা, এই বেপারডা আমার মগজে ঢুকতাছে না, একটু গিলানো দে!',
    },
    {
      category: 'পড়াশোনা / অফিস',
      text: 'বস আমারে তলব দিছে, মনে লয় আইজকা খবর আছে!',
    },
    {
      category: 'পড়াশোনা / অফিস',
      text: 'কাম তো এহনো লটকা রইছে মিয়া ভাই!',
    },
    // — Food, Weather & Home —
    {
      category: 'খানা / আবহাওয়া',
      text: 'খানাডা পুরাই অস্থির অইছে মামা, খায়া কলিজা জুড়ায়া গেল!',
    },
    {
      category: 'খানা / আবহাওয়া',
      text: 'পেট পুরাই লোড, আর এক লোকমাও জাইগা নাই!',
    },
    {
      category: 'খানা / আবহাওয়া',
      text: 'বাজার থেইকা কিছু সদাই-পাতি লইয়া আহিস।',
    },
    {
      category: 'খানা / আবহাওয়া',
      text: 'আইজকা যে রোদ উঠছে, পুরাই কাবাব অইয়া যামু!',
    },
    // — Travel, Shopping & Tech —
    {
      category: 'যাতায়াত / শপিং',
      text: 'আবে হালায়, আমার ফুনডা কোন চিপায় হারায়া গেল?',
    },
    {
      category: 'যাতায়াত / শপিং',
      text: 'ফুনের ব্যাটারি তো পুরাই গড়ের মাঠ অইয়া যাইতাছে!',
    },
    {
      category: 'যাতায়াত / শপিং',
      text: 'মিয়া ভাই, ফাপর নিয়েন না, হাচা কইরা কন শ্যাষ দাম কত?',
    },
    {
      category: 'যাতায়াত / শপিং',
      text: 'রাস্তায় যে গ্যাঞ্জাম, হাইটা গেলেই তো জলদি পৌঁছামু!',
    },
    // — General Feelings —
    {
      category: 'মনের ভাব',
      text: 'মুখডা বাংলার পাঁচের মত কইরা রাখছস ক্যালা? প্যারা খাইছস নি?',
    },
    {
      category: 'মনের ভাব',
      text: 'মামা, পকেট পুরাই গড়ের মাঠ, দুইডা ট্যাহা ধার দে!',
    },
    {
      category: 'মনের ভাব',
      text: 'কিরে, ছব ঠিকঠাক তো? না কোনো ক্যাচাল লাগছে?',
    },
    {
      category: 'মনের ভাব',
      text: 'আরে মামা, সিরিয়াস নিস ক্যা, আমি তো মশকরা করতাছিলাম!',
    },
    {
      category: 'মনের ভাব',
      text: 'ভুল অইলে মাইনা নিবি, খামোখা ত্যাদড়ামি করবি না।',
    },
    {
      category: 'মনের ভাব',
      text: 'একটু চিল কর মামা, এত হাইপার অইস না!',
    },
  ],

  slangBank: [
    // সম্ভোধন (Address)
    {
      term: 'মামুর বেটা',
      transliteration: 'Mamur beta',
      meaning: 'Affectionate or teasing way to address a friend or peer',
      context: 'address',
      example: 'কিরে মামুর বেটা, উড়াধুরা ভাব লস ক্যান?',
    },
    {
      term: 'ওস্তাদ',
      transliteration: 'Ustad',
      meaning: 'Respectful or streetwise address for a driver, expert, or senior',
      context: 'address',
      example: 'ওস্তাদরে দেইখা সালাম দিবি না?',
    },
    {
      term: 'ভাতিজা',
      transliteration: 'Bhatija',
      meaning: 'Nephew; colloquial address to a younger peer or subordinate',
      context: 'address',
      example: 'এদিকে আয় ভাতিজা, তুই তো আমার জিগার কা টুকরা!',
    },
    {
      term: 'কইলজার টুকরা / জিগার',
      transliteration: 'Koiljar tukra / Jigar',
      meaning: 'Piece of my liver/heart; darling dearest',
      context: 'address',
      example: 'তুই তো আমার এক্কেবারে কইলজার টুকরা!',
    },
    {
      term: 'পোলাপাইন',
      transliteration: 'Polapain',
      meaning: 'Neighborhood youngsters / the crew',
      context: 'address',
      example: 'এই পোলাপান, রাস্তা ছাইড়া দে, মুরব্বি আইতাছে!',
    },
    {
      term: 'মুরব্বি',
      transliteration: 'Murubbi',
      meaning: 'Elderly or senior respected person',
      context: 'address',
      example: 'মুরব্বি আইতাছে, সম্মান কইরা দাঁড়া!',
    },
    {
      term: 'পার্টনার',
      transliteration: 'Partner',
      meaning: 'Close buddy or partner-in-crime',
      context: 'address',
      example: 'আর পার্টনার, তুই কই হারাইলি?',
    },
    {
      term: 'হালায়',
      transliteration: 'Halay',
      meaning: 'Cheeky streetwise address; brother-in-law used casually',
      context: 'address',
      example: 'আব্বে হালায়! তুই তো দুনিয়ায় আইসাই পুরা মহল্লায় চান্দি গরম কইরা দিছত!',
    },

    // ভাব ও পরিস্থিতি (Status & Dilemmas)
    {
      term: 'মাইঙ্কা চিপা',
      transliteration: 'Mainka chipa',
      meaning: 'A painful, inescapable tight spot or dilemma',
      context: 'status',
      example: 'এক্কেরে বাঁশ বাগানের মাইঙ্কা চিপায় পইড়া এহন মরা কান্দন কাইন্দা লাভ আছে?',
    },
    {
      term: 'প্যারাময়',
      transliteration: 'Pyaramoy',
      meaning: 'Full of headaches, stress, and hassle',
      context: 'status',
      example: 'জিন্দেগি তো পুরাই প্যারাময়, শান্তির দেখা নাই!',
    },
    {
      term: 'লাল বাত্তি',
      transliteration: 'Lal batti',
      meaning: 'Bankrupt, depleted, red light of financial doom',
      context: 'status',
      example: 'পইড়া জিবনের লাল বাত্তি জ্বইলা গেছে!',
    },
    {
      term: 'আলগা ভাব',
      transliteration: 'Alga bhab',
      meaning: 'Unwarranted pride or pretentious posturing',
      context: 'status',
      example: 'খামোখা আলগা ভাব লইয়া লাভ নাই, তুই কিসের নবাব?',
    },
    {
      term: 'ফুড়ুৎ',
      transliteration: 'Furut',
      meaning: 'Disappearing in a flash (especially money or luck)',
      context: 'status',
      example: 'ট্যাকা পয়সা সব তো ফুড়ুৎ হইয়া গেছে!',
    },
    {
      term: 'ঝিম মারা',
      transliteration: 'Jhim mara',
      meaning: 'Sitting silent, sulking, or acting quiet under pressure',
      context: 'status',
      example: 'চুপচাপ এক কোণায় ঝিম মাইরা বইয়া থাক!',
    },
    {
      term: 'গোল্লা',
      transliteration: 'Golla',
      meaning: 'Zero, complete failure in exams or life',
      context: 'status',
      example: 'মাইনষের কাছে ফাপড় খায়া গোল্লা পাবি!',
    },
    {
      term: 'জোস / পুরাই আগুন',
      transliteration: 'Jos / Purai agun',
      meaning: 'Absolutely lit, phenomenal, mind-blowing',
      context: 'status',
      example: 'তুই যে কামডা করলি, জোস / পুরাই আগুন মামা!',
    },
    {
      term: 'চান্দি গরম',
      transliteration: 'Chandi gorom',
      meaning: 'Heated scalp; causing extreme excitement or fury',
      context: 'status',
      example: 'আইসাই পুরা মহল্লায় চান্দি গরম কইরা দিছত!',
    },
    {
      term: 'তেজপাতা',
      transliteration: 'Tejpata',
      meaning: 'Ruined to exhaustion; crushed like bay leaf',
      context: 'status',
      example: 'জিন্দেগিডা পুরাই তেজপাতা বানায়া ফালাইছে!',
    },

    // ট্যাকা ও ফুটানি (Money & Flex)
    {
      term: 'ট্যাকা',
      transliteration: 'Tyaka',
      meaning: 'Money / cash',
      context: 'money',
      example: 'পকেটে নাই একখান ট্যাকা, অথচ শখ নবাবের লাহান!',
    },
    {
      term: 'ফকিরি হালত',
      transliteration: 'Fokiri halot',
      meaning: 'Penniless beggar-like financial condition',
      context: 'money',
      example: 'হালত পুরাই ফকিরি, কিন্তু মুখে লম্বা ডায়লগ!',
    },
    {
      term: 'ফুটানি / ফুডানি',
      transliteration: 'Futani / Fudani',
      meaning: 'Showing off, flexing beyond one’s means',
      context: 'money',
      example: 'বাপের কামাই করা ট্যাকায় হোন্ডা হাঁকাইয়া ফুডানি নিস না!',
    },
    {
      term: 'বড়লোকির ভাব',
      transliteration: 'Borolokir bhab',
      meaning: 'Acting rich without actual wealth',
      context: 'money',
      example: 'এতো ফুটানি আর বড়লোকির ভাব লইলে একদিন রাস্তায় বইসা ভিক্ষা করা লাগবো!',
    },
    {
      term: 'গড়ের মাঠ',
      transliteration: 'Gorer math',
      meaning: 'Vast empty ground (empty wallet)',
      context: 'money',
      example: 'পকেট পুরাই গড়ের মাঠ, বাতাস ছাড়া কিচ্ছু নাই!',
    },

    // কাজ ও ঘটনা (Actions & Slang)
    {
      term: 'চুদুর বুদুর',
      transliteration: 'Chudur budur',
      meaning: 'Unnecessary dilly-dallying, excuses, or sneaky delay',
      context: 'action',
      example: 'খামোখা চুদুর বুদুর না কইরা কাজের কথায় আয়!',
    },
    {
      term: 'চাপাবাজি',
      transliteration: 'Chapabaji',
      meaning: 'Telling tall tales, bluffs, or boasting',
      context: 'action',
      example: 'খামোখা চাপাবাজি কইরা দুই দোস্তর মইধ্যে ভেজাল লাগাইস না!',
    },
    {
      term: 'ভেজাল লাগানো',
      transliteration: 'Bhejal lagano',
      meaning: 'Instigating conflict or adulterating peace',
      context: 'action',
      example: 'সব ভালো চলতাছিল, তুই আইসা ভেজাল লাগাইলি!',
    },
    {
      term: 'পল্টি খাওয়া',
      transliteration: 'Polti khaowa',
      meaning: 'Flipping loyalties, doing a 180, betrayal',
      context: 'action',
      example: 'মাইয়া পল্টি খাইছে দেইখা ছ্যাঁকা খাইয়া ফ্যাঁচফ্যাঁচ করতেছস?',
    },
    {
      term: 'ছ্যাঁকা খাওয়া',
      transliteration: 'Chheka khaowa',
      meaning: 'Getting dumped / burned in love',
      context: 'action',
      example: 'পিরিত করবি কর, লেকিন বাঁশ খাইয়া ছ্যাঁকা খাইস না!',
    },
    {
      term: 'ফ্যাঁচফ্যাঁচ করা / ল্যাদানো',
      transliteration: 'Fnechfnech kora / Lyadano',
      meaning: 'Whining, whimpering, moping around irritably',
      context: 'action',
      example: 'আমার সামনে আইসা ফ্যাঁচফ্যাঁচ কইরা ল্যাদাইবি না কইয়া দিলাম!',
    },
    {
      term: 'চিল মারা',
      transliteration: 'Chill mara',
      meaning: 'Relaxing, unwinding, hanging out peacefully',
      context: 'action',
      example: 'দৌড়ের উপর না থাইকা আমাগো লগে বইসা চিল মার!',
    },
    {
      term: 'চিপা মারা',
      transliteration: 'Chipa mara',
      meaning: 'Cornering, stabbing in the back, sneaking',
      context: 'action',
      example: 'কেডা কই থিকা চিপা মারতাছে হেই খবর নে!',
    },
    {
      term: 'ফাপড়বাজি / ফাপড় দেওয়া',
      transliteration: 'Faporbaji / Fapor dewa',
      meaning: 'Empty threats, bullying bluffs',
      context: 'action',
      example: 'আব্বে হালায় ফাপড় দিস না, কানের নিচে দিমু একখান!',
    },
    {
      term: 'কাইজ্জা',
      transliteration: 'Kaijja',
      meaning: 'Brawling, verbal brawl or street fight',
      context: 'action',
      example: 'খালি ফাপড়বাজি আর কাইজ্জা করতে দিলে অলিম্পিকে মেডেল আনবো!',
    },
    {
      term: 'ফাপর',
      transliteration: 'Fapor',
      meaning: 'Bluffing / showing off empty bravado',
      context: 'action',
      example: 'ফাপর লস হালায়? নিজে তো কিচ্ছু কইরা দেখাইতে পারস না!',
    },
    {
      term: 'খাইসতা',
      transliteration: 'Khaista',
      meaning: 'Annoying, gross, or dirty behavior',
      context: 'action',
      example: 'কি খাইসতা কাম করস? লজ্জা-শরম কি গোস্ত লইয়া গেছে?',
    },
    {
      term: 'টাউট',
      transliteration: 'Taut',
      meaning: 'A cheater, fraud, or tout',
      context: 'action',
      example: 'ওই টাউটের লগে কোনো কারবার করবি না, পুরা ঠকায়া ছাড়বে!',
    },
    {
      term: 'আবাইল্লা',
      transliteration: 'Abailla',
      meaning: 'Useless, worthless, good-for-nothing',
      context: 'status',
      example: 'এক্কেরে আবাইল্লা কাম করলি! এইডা তো কুত্তায় মুতায় না!',
    },
    {
      term: 'মাখন',
      transliteration: 'Makhon',
      meaning: 'Awesome, perfect, smooth as butter',
      context: 'status',
      example: 'পুরা মাখন অবস্থা মামা! জীবনটা এহন একদম ঝকমকা!',
    },
    {
      term: 'ক্যাচাল',
      transliteration: 'Kachal',
      meaning: 'Useless argument, nagging, pointless bickering',
      context: 'action',
      example: 'খামোখা ক্যাচাল লাগাইস না, চল কাম কর!',
    },
    {
      term: 'ঠোলা',
      transliteration: 'Thola',
      meaning: 'Police (ultra-local slang)',
      context: 'address',
      example: 'আবে ঠোলা আইতাছে, চল ভাগ এহানে থিকা!',
    },
    {
      term: 'প্যারা',
      transliteration: 'Pyara',
      meaning: 'Headache, hassle, mental stress',
      context: 'status',
      example: 'মামা, আর প্যারা দিস না, মগজ পুরাই হ্যাং অইয়া গেছে!',
    },
    {
      term: 'চিপা',
      transliteration: 'Chipa',
      meaning: 'Narrow alley, tight spot',
      context: 'status',
      example: 'কোন চিপায় লুকাইলি হালায়? সারা মহল্লা খুঁজলাম!',
    },

    // আইকনিক গান ও ডায়লগ (Iconic Punchlines)
    {
      term: 'আমি ফাইস্যা গেছি মাইঙ্কা চিপায়',
      transliteration: 'Ami faissa gesi mainka chipay',
      meaning: 'Classic comedic lament: I am hopelessly caught in a terrible tight spot',
      context: 'punchline',
      example: 'এহন তো চিল্লাইতেছস ‘আমি ফাইস্যা গেছি মাইঙ্কা চিপায়’, গ্যাঞ্জাম করার আগে ঘিলু কই আছিল?',
    },
    {
      term: 'খাইয়া লামু একদম',
      transliteration: 'Khaiya lamu ekdom',
      meaning: 'Street boast: I will devour/destroy you completely',
      context: 'punchline',
      example: 'বেশি ত্যাড়ামি করলে এক্কেরে খাইয়া লামু একদম!',
    },
    {
      term: 'কানের নিচে দিমু একখান',
      transliteration: 'Kaner niche dimu ekkhan',
      meaning: 'Slap under the ear; iconic comic discipline threat',
      context: 'punchline',
      example: 'আব্বে হালায় ফাপড় দিস না, কানের নিচে দিমু একখান, বাপের নাম ভুইলা যাবি!',
    },
  ],

  iconicQuotes: [
    'আমি ফাইস্যা গেছি, আমি ফাইস্যা গেছি, ফাইস্যা গেছি মাইঙ্কা চিপায়!',
    'আব্বে হালায় ফাপড় দিস না, কানের নিচে দিমু একখান!',
    'বেশি ত্যাড়ামি করলে এক্কেরে খাইয়া লামু একদম!',
    'কিরে মামুর বেটা, উড়াধুরা ভাব লস ক্যান?',
    'এক্কেরে চান তারা হোটেলে বইসা রগ চাবামু আর কাচ্চি খামু, পুরাই মাখনের লাহান!',
    // 🎬 Famous Dhallywood & Bollywood dialogues used in Dhaka
    'মোগ্যাম্বো খুশ হুয়া!',
    'মারব এহানে, লাশ পড়ব শ্মশানে!',
    'রিশতে মে তো হাম তুমহারে বাপ লাগতে হ্যায়... নাম হ্যায় শাহেনশাহ!',
    'পিকচার আভি বাকি হ্যায় মেরে দোস্ত!',
    'চান্দের দেশে পাঠায়া দিমু এক্কেরে!',
    'খাইছে আমারে!',
    'আবে হালায়, কি কস এইগুলা?',
  ],
};
