import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

/**
 * Language: English, Hindi (हिन्दी) or Urdu (اردو).
 *
 * The English text is the key: tr('Sign out') gives the Hindi or Urdu words
 * when the dictionary has them, and the English itself when it does not, so a
 * missing translation never shows a blank or a code. The shared pieces (Text,
 * Button, Header, Field, chips, tabs…) translate what they are given, which
 * covers the fixed words of every screen. Sentences with names, dates or
 * numbers in them stay in English.
 */
export type Lang = 'en' | 'hi' | 'ur';
export const LANGUAGES: { value: Lang; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'ur', label: 'اردو' },
];

const KEY = 'medflow.lang';
let lang: Lang = 'en';
const listeners = new Set<() => void>();

const valid = (v: unknown): v is Lang => v === 'en' || v === 'hi' || v === 'ur';

function set(next: Lang, persist: boolean) {
  lang = next;
  listeners.forEach((l) => l());
  if (persist) AsyncStorage.setItem(KEY, next).catch(() => undefined);
}

export const setLang = (next: Lang) => set(next, true);

/** Call once at start-up. */
export async function loadLang(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(KEY);
    if (valid(saved)) set(saved, false);
  } catch {
    // storage unavailable: English
  }
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const useLang = () => useSyncExternalStore(subscribe, () => lang, () => lang);

// [Hindi, Urdu]
const D: Record<string, [string, string]> = {
  // Tabs and navigation
  Home: ['होम', 'ہوم'],
  Visits: ['विज़िट', 'ملاقاتیں'],
  Book: ['बुक करें', 'بک کریں'],
  Doctors: ['डॉक्टर', 'ڈاکٹر'],
  Me: ['मैं', 'میں'],
  Today: ['आज', 'آج'],
  Hours: ['समय', 'اوقات'],
  Patients: ['मरीज़', 'مریض'],
  Overview: ['अवलोकन', 'جائزہ'],
  Users: ['यूज़र', 'صارفین'],
  Activity: ['गतिविधि', 'سرگرمی'],
  // Common actions
  Save: ['सहेजें', 'محفوظ کریں'],
  Cancel: ['रद्द करें', 'منسوخ کریں'],
  Delete: ['हटाएँ', 'حذف کریں'],
  Edit: ['बदलें', 'ترمیم'],
  Open: ['खोलें', 'کھولیں'],
  Done: ['हो गया', 'ہو گیا'],
  Confirm: ['पक्का करें', 'تصدیق کریں'],
  Decline: ['मना करें', 'انکار کریں'],
  Complete: ['पूरा करें', 'مکمل کریں'],
  Remove: ['हटाएँ', 'ہٹائیں'],
  Search: ['खोजें', 'تلاش'],
  'Try again': ['फिर कोशिश करें', 'دوبارہ کوشش کریں'],
  'Load more': ['और दिखाएँ', 'مزید دکھائیں'],
  'Go back': ['वापस जाएँ', 'واپس جائیں'],
  Unlock: ['अनलॉक करें', 'کھولیں'],
  'Turn on': ['चालू करें', 'چالو کریں'],
  Share: ['साझा करें', 'شیئر کریں'],
  'Stop sharing': ['साझा करना बंद करें', 'شیئر بند کریں'],
  Verify: ['सत्यापित करें', 'تصدیق کریں'],
  Photo: ['फ़ोटो', 'تصویر'],
  Camera: ['कैमरा', 'کیمرا'],
  PDF: ['पीडीएफ़', 'پی ڈی ایف'],
  // Account
  'Sign in': ['साइन इन', 'سائن ان'],
  'Sign out': ['साइन आउट', 'سائن آؤٹ'],
  'Create account': ['खाता बनाएँ', 'اکاؤنٹ بنائیں'],
  'Sign up with Google': ['Google से साइन अप करें', 'Google سے سائن اپ کریں'],
  Email: ['ईमेल', 'ای میل'],
  Password: ['पासवर्ड', 'پاس ورڈ'],
  'Full name': ['पूरा नाम', 'پورا نام'],
  Name: ['नाम', 'نام'],
  'Name (optional)': ['नाम (वैकल्पिक)', 'نام (اختیاری)'],
  Phone: ['फ़ोन', 'فون'],
  Appearance: ['रूप', 'ظاہری شکل'],
  'App lock': ['ऐप लॉक', 'ایپ لاک'],
  Language: ['भाषा', 'زبان'],
  Notifications: ['सूचनाएँ', 'اطلاعات'],
  'Mark all as read': ['सब पढ़ा हुआ करें', 'سب پڑھا ہوا کریں'],
  'Turn on notifications': ['सूचनाएँ चालू करें', 'اطلاعات چالو کریں'],
  'Platform admin': ['प्लेटफ़ॉर्म एडमिन', 'پلیٹ فارم ایڈمن'],
  // Patient
  'Book a visit': ['विज़िट बुक करें', 'ملاقات بک کریں'],
  'My visits': ['मेरी विज़िट', 'میری ملاقاتیں'],
  'Everything you have booked': ['जो कुछ भी आपने बुक किया', 'آپ کی بک کی ہوئی ہر چیز'],
  'Next visit': ['अगली विज़िट', 'اگلی ملاقات'],
  Upcoming: ['आने वाली', 'آنے والی'],
  Past: ['पिछली', 'گزشتہ'],
  Reschedule: ['समय बदलें', 'وقت بدلیں'],
  'Rate visit': ['विज़िट को रेट करें', 'ملاقات کو ریٹ کریں'],
  'Rate your visit': ['अपनी विज़िट को रेट करें', 'اپنی ملاقات کو ریٹ کریں'],
  'Send review': ['रिव्यू भेजें', 'جائزہ بھیجیں'],
  'View prescription': ['पर्चा देखें', 'نسخہ دیکھیں'],
  'No prescription yet': ['अभी कोई पर्चा नहीं', 'ابھی کوئی نسخہ نہیں'],
  'Save or share as PDF': ['पीडीएफ़ सहेजें या भेजें', 'پی ڈی ایف محفوظ یا شیئر کریں'],
  'Share as text': ['टेक्स्ट में भेजें', 'ٹیکسٹ میں شیئر کریں'],
  'Join video': ['वीडियो में जुड़ें', 'ویڈیو میں شامل ہوں'],
  'Join video visit': ['वीडियो विज़िट में जुड़ें', 'ویڈیو ملاقات میں شامل ہوں'],
  'Your visit': ['आपकी विज़िट', 'آپ کی ملاقات'],
  'Pick a day': ['दिन चुनें', 'دن چنیں'],
  'Pick a time': ['समय चुनें', 'وقت چنیں'],
  'Who is this visit for?': ['यह विज़िट किसके लिए है?', 'یہ ملاقات کس کے لیے ہے؟'],
  'How would you like to meet?': ['आप कैसे मिलना चाहेंगे?', 'آپ کیسے ملنا چاہیں گے؟'],
  'In person': ['आमने-सामने', 'آمنے سامنے'],
  Video: ['वीडियो', 'ویڈیو'],
  'No upcoming visits': ['कोई आने वाली विज़िट नहीं', 'کوئی آنے والی ملاقات نہیں'],
  'No past visits yet': ['अभी कोई पिछली विज़िट नहीं', 'ابھی کوئی گزشتہ ملاقات نہیں'],
  'Verified specialists, ready to see you': ['सत्यापित विशेषज्ञ, आपसे मिलने को तैयार', 'تصدیق شدہ ماہرین، آپ سے ملنے کو تیار'],
  'Name, specialty or clinic': ['नाम, विशेषता या क्लिनिक', 'نام، مہارت یا کلینک'],
  '♥ Favourites': ['♥ पसंदीदा', '♥ پسندیدہ'],
  'No doctors yet': ['अभी कोई डॉक्टर नहीं', 'ابھی کوئی ڈاکٹر نہیں'],
  'No match': ['कोई मेल नहीं', 'کوئی مطابقت نہیں'],
  'How can we help you today?': ['आज हम आपकी क्या मदद कर सकते हैं?', 'آج ہم آپ کی کیا مدد کر سکتے ہیں؟'],
  'Your account and health details': ['आपका खाता और स्वास्थ्य जानकारी', 'آپ کا اکاؤنٹ اور صحت کی تفصیلات'],
  'Edit health details': ['स्वास्थ्य जानकारी बदलें', 'صحت کی تفصیلات بدلیں'],
  'Health details': ['स्वास्थ्य जानकारी', 'صحت کی تفصیلات'],
  'Family members': ['परिवार के सदस्य', 'خاندان کے افراد'],
  Family: ['परिवार', 'خاندان'],
  'My reports': ['मेरी रिपोर्ट', 'میری رپورٹس'],
  'Add a report': ['रिपोर्ट जोड़ें', 'رپورٹ شامل کریں'],
  'No reports yet': ['अभी कोई रिपोर्ट नहीं', 'ابھی کوئی رپورٹ نہیں'],
  'Add a person': ['व्यक्ति जोड़ें', 'فرد شامل کریں'],
  'No one added yet': ['अभी किसी को नहीं जोड़ा', 'ابھی کسی کو شامل نہیں کیا'],
  'Date of birth': ['जन्म तिथि', 'تاریخ پیدائش'],
  'Date of birth (optional)': ['जन्म तिथि (वैकल्पिक)', 'تاریخ پیدائش (اختیاری)'],
  'Height (cm)': ['ऊँचाई (सेमी)', 'قد (سینٹی میٹر)'],
  'Weight (kg)': ['वज़न (किग्रा)', 'وزن (کلوگرام)'],
  Allergies: ['एलर्जी', 'الرجی'],
  'Long-term conditions': ['पुरानी बीमारियाँ', 'پرانی بیماریاں'],
  'Medicines you take': ['जो दवाइयाँ आप लेते हैं', 'جو دوائیں آپ لیتے ہیں'],
  'Emergency contact': ['आपातकालीन संपर्क', 'ہنگامی رابطہ'],
  'Book a doctor in a few taps — video, phone or in person.': ['कुछ टैप में डॉक्टर बुक करें — वीडियो, फ़ोन या आमने-सामने।', 'چند ٹیپس میں ڈاکٹر بک کریں — ویڈیو، فون یا آمنے سامنے۔'],
  // Doctor
  'Visit notes': ['विज़िट के नोट्स', 'ملاقات کے نوٹس'],
  'Save notes': ['नोट्स सहेजें', 'نوٹس محفوظ کریں'],
  Prescription: ['पर्चा', 'نسخہ'],
  'Save prescription': ['पर्चा सहेजें', 'نسخہ محفوظ کریں'],
  'Update prescription': ['पर्चा अपडेट करें', 'نسخہ اپ ڈیٹ کریں'],
  'Add another medicine': ['एक और दवा जोड़ें', 'ایک اور دوا شامل کریں'],
  Dose: ['मात्रा', 'خوراک'],
  'For how long': ['कितने समय तक', 'کتنی مدت تک'],
  Advice: ['सलाह', 'مشورہ'],
  'Follow-up date (optional)': ['फ़ॉलो-अप की तारीख़ (वैकल्पिक)', 'فالو اپ کی تاریخ (اختیاری)'],
  'Once a day': ['दिन में एक बार', 'دن میں ایک بار'],
  'Twice a day': ['दिन में दो बार', 'دن میں دو بار'],
  '3 times a day': ['दिन में तीन बार', 'دن میں تین بار'],
  'At night': ['रात को', 'رات کو'],
  'When needed': ['ज़रूरत पड़ने पर', 'ضرورت پڑنے پر'],
  'In 1 week': ['1 हफ़्ते में', '1 ہفتے میں'],
  'In 2 weeks': ['2 हफ़्ते में', '2 ہفتوں میں'],
  'In 1 month': ['1 महीने में', '1 مہینے میں'],
  'Mark no-show': ['नहीं आए', 'نہیں آئے'],
  'Weekly hours': ['साप्ताहिक समय', 'ہفتہ وار اوقات'],
  'Edit profile': ['प्रोफ़ाइल बदलें', 'پروفائل میں ترمیم'],
  'Verification documents': ['सत्यापन दस्तावेज़', 'تصدیقی دستاویزات'],
  'Reports shared by the patient': ['मरीज़ द्वारा साझा की गई रिपोर्ट', 'مریض کی شیئر کی ہوئی رپورٹس'],
  'No visits are booked for today.': ['आज कोई विज़िट बुक नहीं है।', 'آج کوئی ملاقات بک نہیں ہے۔'],
  'Get a ping the moment a patient asks for a visit.': ['जैसे ही कोई मरीज़ विज़िट माँगे, तुरंत सूचना पाएँ।', 'جیسے ہی کوئی مریض ملاقات مانگے، فوراً اطلاع پائیں۔'],
  // Admin
  Refunds: ['रिफ़ंड', 'ریفنڈز'],
  Documents: ['दस्तावेज़', 'دستاویزات'],
  'Make doctor': ['डॉक्टर बनाएँ', 'ڈاکٹر بنائیں'],
  'Hide from search': ['खोज से छिपाएँ', 'تلاش سے چھپائیں'],
  'Verify who patients can book': ['तय करें कि मरीज़ किसे बुक कर सकते हैं', 'طے کریں کہ مریض کسے بک کر سکتے ہیں'],
  'Your admin account': ['आपका एडमिन खाता', 'آپ کا ایڈمن اکاؤنٹ'],
  'How MedFlow is doing': ['MedFlow कैसा चल रहा है', 'MedFlow کیسا چل رہا ہے'],
  'Download as a spreadsheet (CSV)': ['स्प्रेडशीट (CSV) के रूप में डाउनलोड करें', 'اسپریڈ شیٹ (CSV) کے طور پر ڈاؤن لوڈ کریں'],
  'MedFlow is locked': ['MedFlow लॉक है', 'MedFlow لاک ہے'],
  Suspended: ['निलंबित', 'معطل'],
  Live: ['लाइव', 'لائیو'],
  Review: ['समीक्षा', 'جائزہ'],
  // Statuses
  Pending: ['लंबित', 'زیر التواء'],
  Confirmed: ['पक्की', 'تصدیق شدہ'],
  Completed: ['पूरी हुई', 'مکمل'],
  Cancelled: ['रद्द', 'منسوخ'],
  'No-show': ['नहीं आए', 'نہیں آئے'],
};

/** The text in the chosen language, or the English itself when there is no translation. */
export function tr(text: string, to: Lang = lang): string {
  if (to === 'en') return text;
  const hit = D[text];
  return hit ? hit[to === 'hi' ? 0 : 1] : text;
}

/** For components: re-render when the language changes, then call the returned function. */
export function useTr(): (text: string) => string {
  const current = useLang();
  return (text: string) => tr(text, current);
}
