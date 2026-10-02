import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Activity, Flame, Droplets, Dumbbell, Utensils, Trophy, Target, TrendingUp } from 'lucide-react';
import SectionAbout from '../components/SectionAbout';
import { useLanguage } from '../contexts/LanguageContext';

// ── Read real activity data from localStorage ────────────────────────────────
function readLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function buildActivityMap(user) {
  const map = {}; // { 'YYYY-MM-DD': { water, yoga, diet } }

  // WATER
  const waterData = readLS('medivault_water', {});
  const waterTarget = waterData.target || 2500;
  Object.entries(waterData).forEach(([k, v]) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(k)) {
      if (!map[k]) map[k] = {};
      map[k].water = (v.total || 0) >= waterTarget;
      map[k].waterMl = v.total || 0;
    }
  });
  if (waterData.history) {
    Object.entries(waterData.history).forEach(([k, v]) => {
      if (!map[k]) map[k] = {};
      map[k].water = (v.total || 0) >= (v.target || waterTarget);
      map[k].waterMl = v.total || 0;
    });
  }

  // YOGA — Level 1 completion = yoga done that day
  const yogaLastDate = localStorage.getItem(user?.id ? `yoga_last_streak_date_${user.id}` : 'yoga_last_streak_date');
  if (yogaLastDate) {
    const d = new Date(yogaLastDate);
    const key = d.toLocaleDateString('en-CA');
    if (!map[key]) map[key] = {};
    map[key].yoga = true;
  }
  // Also check yoga_activity_log if it exists
  const yogaLog = readLS(user?.id ? `yoga_activity_log_${user.id}` : 'yoga_activity_log', {});
  Object.entries(yogaLog).forEach(([k, v]) => {
    if (!map[k]) map[k] = {};
    map[k].yoga = !!v;
  });

  // DIET — if diet timetable entries logged that day
  const dietLog = readLS('medivault_diet_log', {});
  Object.entries(dietLog).forEach(([k, v]) => {
    if (!map[k]) map[k] = {};
    map[k].diet = !!v && (v.tracked || v.calories > 0);
  });
  // Fallback: if saved calories > 0, assume today
  const savedCal = parseFloat(localStorage.getItem('mv_saved_calories') || '0');
  if (savedCal > 0) {
    const today = new Date().toLocaleDateString('en-CA');
    if (!map[today]) map[today] = {};
    map[today].diet = true;
  }

  return { map, waterTarget };
}

function getDayScore(entry) {
  if (!entry) return 0;
  return (entry.water ? 1 : 0) + (entry.yoga ? 1 : 0) + (entry.diet ? 1 : 0);
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CalendarView({ user }) {
  const { lang } = useLanguage();

  const localMonths = {
    en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    te: ['జనవరి', 'ఫిబ్రవరి', 'మార్చి', 'ఏప్రిల్', 'మే', 'జూన్', 'జూలై', 'ఆగస్టు', 'సెప్టెంబర్', 'అక్టోబర్', 'నవంబర్', 'డిసెంబర్'],
    hi: ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'],
    eu: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  };

  const localWeekdays = {
    en: ['SUN','MON','TUE','WED','THU','FRI','SAT'],
    te: ['ఆది', 'సోమ', 'మంగళ', 'బుధ', 'గురు', 'శుక్ర', 'శని'],
    hi: ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
    eu: ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
  };

  const localT = {
    en: {
      title: "Health Calendar",
      subtitle: "Your daily yoga, water & diet streaks — all in one place",
      curStreak: "Current Streak",
      totScore: "Total Score",
      yogaStreak: "Yoga Streak",
      legendPerfect: "2-3 activities",
      legendPartial: "1 activity",
      legendMissed: "Missed",
      legendToday: "Today",
      scoreText: "Score",
      pts: "points",
      noDataFuture: "No data for future dates.",
      waterIntake: "Water Intake",
      yogaEx: "Yoga / Exercise",
      dietPlan: "Diet Plan",
      goalMet: "Goal met ✓",
      notTracked: "Not tracked",
      sessionDone: "Session completed ✓",
      noSession: "No session",
      dietTracked: "Diet tracked ✓",
      notLogged: "Not logged",
      monthlyAnalysis: "Monthly Analysis",
      waterGoals: "Water Goals Met",
      yogaSessions: "Yoga Sessions",
      dietTrackedLbl: "Diet Tracked",
      perfectDays: "Perfect Days (all 3)",
      adherence: "Overall adherence",
      perfect: "perfect days",
      excellent: "Excellent!",
      good: "Good progress!",
      keepGoing: "Keep going!",
      breakdown: "Total Score Breakdown",
      yogaPts: "Yoga points",
      waterPts: "Water points",
      dietPts: "Diet points",
      grandTotal: "Grand Total",
      aboutWhat: "The Health Calendar is a high-fidelity wellness tracker that consolidates your daily physical activities, hydration targets, and dietary discipline into a single visual dashboard. By aggregating real-time logs from your Drinking Water logs, Yoga routines, and Diet Timetables, it dynamically grades each day, plots color-coded indicator tiles, and measures monthly compliance rates to help you visualize your holistic healthcare journey.",
      aboutHow: [
        'Navigate to the Health Calendar section from the main sidebar of the dashboard.',
        'Review the top header card showing your Current Streak, Total Score, and Yoga Streak counters.',
        'Browse the main calendar interface displaying the current month\'s date grid.',
        'Use the left and right chevron buttons next to the month name to view past or future months.',
        'Analyze the color of each calendar day tile: green represents goal met (2+ activities completed), yellow represents partial (1 activity), red is missed, and indigo highlights today.',
        'Hover over any completed day tile to trigger a subtle micro-animation revealing your daily status.',
        'Click on any calendar day to load its specific details inside the "Selected Day Detail" sidebar panel.',
        'Inspect the status of each of the 3 key pillars (Water, Yoga, Diet) on your selected day to check what was done.',
        'Scroll down to the "Monthly Analysis" card to view progress bars for Water, Yoga, Diet, and perfect days.',
        'Inspect the "Total Score Breakdown" card to see points compiled for each individual wellness habit.',
        'Use the dynamic "Overall Adherence" feedback to see your performance medal and rating for the month.',
        'Work to complete at least 2 habits daily (e.g. Water and Yoga) to sustain and grow your active health streak.',
      ],
      aboutWhy: [
        'Provides a single consolidated, unified view of all your multi-dimensional wellness logs.',
        'Visualizing health streaks triggers positive psychological reinforcement, building consistent habits.',
        'Color-coded tiles (green, yellow, red) help you immediately identify and address weeks with low compliance.',
        'Detailed score breakdowns highlight which specific habits require more dedication.',
        'Dynamic monthly progress bars show numerical compliance ratios, making your milestones measurable.',
        'Helps identify correlations between hydration, physical exercise, and dietary patterns.',
        'Selected day details offer granular retroactive inspections of previous daily records.',
        'Maintains history locally, ensuring high speed, offline compatibility, and supreme data privacy.',
        'Helps you prepare well-structured performance logs to share during regular checkups with your doctor.',
        'Overall adherence grading motivates users to cross thresholds and achieve "Excellent" health status.',
      ]
    },
    te: {
      title: "ఆరోగ్య క్యాలెండర్",
      subtitle: "మీ రోజువారీ యోగా, నీరు & ఆహార పట్టికల స్ట్రీక్స్ — అన్నీ ఒకే చోట",
      curStreak: "ప్రస్తుత స్ట్రీక్",
      totScore: "మొత్తం స్కోరు",
      yogaStreak: "యోగా స్ట్రీక్",
      legendPerfect: "2-3 కార్యకలాపాలు",
      legendPartial: "1 కార్యకలాపం",
      legendMissed: "మిస్ అయినవి",
      legendToday: "నేడు",
      scoreText: "స్కోరు",
      pts: "పాయింట్లు",
      noDataFuture: "భవిష్యత్తు తేదీల సమాచారం లేదు.",
      waterIntake: "నీటి వినియోగం",
      yogaEx: "యోగా / వ్యాయామం",
      dietPlan: "ఆహార ప్రణాళిక",
      goalMet: "లక్ష్యం చేరారు ✓",
      notTracked: "ట్రాక్ చేయలేదు",
      sessionDone: "సెషన్ పూర్తయింది ✓",
      noSession: "సెషన్ లేదు",
      dietTracked: "ఆహారం ట్రాక్ చేసారు ✓",
      notLogged: "నమోదు చేయలేదు",
      monthlyAnalysis: "నెలవారీ విశ్లేషణ",
      waterGoals: "నీటి లక్ష్యాలు చేరారు",
      yogaSessions: "యోగా సెషన్స్",
      dietTrackedLbl: "ఆహారం ట్రాక్ చేసారు",
      perfectDays: "పర్ఫెక్ట్ రోజులు (అన్నీ 3)",
      adherence: "మొత్తం పాటింపు",
      perfect: "పర్ఫెక్ట్ రోజులు",
      excellent: "అద్భుతం!",
      good: "మంచి పురోగతి!",
      keepGoing: "కొనసాగించండి!",
      breakdown: "మొత్తం స్కోరు విభజన",
      yogaPts: "యోగా పాయింట్లు",
      waterPts: "నీటి పాయింట్లు",
      dietPts: "ఆహార పాయింట్లు",
      grandTotal: "గ్రాండ్ టోటల్",
      aboutWhat: "ఆరోగ్య క్యాలెండర్ అనేది ఒక ఉన్నత స్థాయి వెల్నెస్ ట్రాకర్, ఇది మీ రోజువారీ శారీరక శ్రమ, హైడ్రేషన్ మరియు డైట్ క్రమశిక్షణను ఒకే చోట చూపిస్తుంది.",
      aboutHow: [
        'డాష్‌బోర్డ్ సైడ్‌బార్ నుండి ఆరోగ్య క్యాలెండర్ విభాగానికి వెళ్ళండి.',
        'టాప్ కార్డ్ లో మీ ప్రస్తుత స్ట్రీక్, మొత్తం స్కోరు మరియు యోగా స్ట్రీక్ కౌంటర్లను చూడండి.',
        'ప్రస్తుత నెల తేదీల గ్రిడ్‌ను ప్రదర్శించే క్యాలెండర్‌ను చూడండి.',
        'నెల మార్చడానికి పేరు పక్కన ఉన్న ఎడమ మరియు కుడి బాణం బటన్లను ఉపయోగించండి.',
        'క్యాలెండర్ బాక్సుల రంగులను గమనించండి: ఆకుపచ్చ లక్ష్యం నెరवेరినట్లు, పసుపు పాక్షికంగా చేసినట్లు, ఎరుపు మిస్ అయినట్లు సూచిస్తుంది.',
        'రోజు వివరాలను చూడటానికి ఆ రోజు బాక్సుపై క్లిక్ చేయండి.',
        'కుడి ప్యానెల్‌లో ఆ రోజు నీరు, యోగా, డైట్ ఎలా పాటించారో తనిఖీ చేయండి.',
        'నెలవారీ విశ్లేషణ కార్డులో నెలవారీ పురోగతి బార్లను చూడండి.',
        'స్కోరు విభజన కార్డులో ఏ అలవాటు వల్ల ఎన్ని పాయింట్లు వచ్చాయో గమనించండి.',
        'మీ పనితీరుకు లభించే మెడల్ మరియు రేటింగ్ సమాచారాన్ని చూడండి.',
        'రోజుకు కనీసం 2 అలవాట్లను పూర్తి చేయడం ద్వారా మీ స్ట్రీక్ ను కొనసాగించండి.',
      ],
      aboutWhy: [
        'అన్ని రకాల ఆరోగ్య లాగ్‌లను ఒకే చోట క్రమబద్ధంగా చూపిస్తుంది.',
        'స్ట్రీక్స్ చూడటం వల్ల ప్రతిరోजూ ఆరోగ్యంగా ఉండాలనే ఉత్సాహం కలుగుతుంది.',
        'రంగుల సంకేతాల ద్వారా ఏ వారంలో తక్కువ పాటించారో సులభంగా తెలుసుకోవచ్చు.',
        'స్కోరు విభజన ఏ అలవాటుపై ఎక్కువ శ్రద్ధ పెట్టాलो తెలియజేస్తుంది.',
        'నెలవారీ పురోగతి శాతాలు మీ పురోగతిని కొలవడానికి సహాయపడతాయి.',
        'నీటి వినియోగం, వ్యాయామం మరియు డైట్ మధ్య సమతుల్యతను సాధించవచ్చు.',
        'డేటా అంతా లోకల్‌గా భద్రపరచబడుతుంది కాబట్టి అత్యంత సురక్షితమైనది.',
        'మీ వైద్యునితో పంచుకోవడానికి అనుకూలమైన ఆరోగ్య రికార్డులను సిద్ధం చేస్తుంది.',
        'పర్ఫెక్ట్ రోజులను సాధించేలా రోగులను ప్రోత్సహిస్తుంది.',
        'ఆరోగ్యకరమైన జీవనశైలి అలవాట్లను శాశ్వతంగా పెంపొందిస్తుంది.',
      ]
    },
    hi: {
      title: "स्वास्थ्य कैलेंडर",
      subtitle: "आपकी दैनिक योग, पानी और आहार की लकीरें — सब एक ही स्थान पर",
      curStreak: "वर्तमान स्ट्रीक",
      totScore: "कुल स्कोर",
      yogaStreak: "योग स्ट्रीक",
      legendPerfect: "2-3 गतिविधियां",
      legendPartial: "1 गतिविधि",
      legendMissed: "छूट गया",
      legendToday: "आज",
      scoreText: "स्कोर",
      pts: "अंक",
      noDataFuture: "भविष्य की तिथियों के लिए कोई डेटा नहीं है।",
      waterIntake: "पानी का सेवन",
      yogaEx: "योग / व्यायाम",
      dietPlan: "आहार योजना",
      goalMet: "लक्ष्य पूरा हुआ ✓",
      notTracked: "ट्रैक नहीं किया",
      sessionDone: "सत्र पूरा हुआ ✓",
      noSession: "कोई सत्र नहीं",
      dietTracked: "आहार ट्रैक किया ✓",
      notLogged: "लॉग नहीं किया",
      monthlyAnalysis: "मासिक विश्लेषण",
      waterGoals: "पानी के लक्ष्य पूरे",
      yogaSessions: "योग सत्र",
      dietTrackedLbl: "आहार ट्रैक किया",
      perfectDays: "परफेक्ट दिन (तीनों)",
      adherence: "समग्र अनुपालन",
      perfect: "परफेक्ट दिन",
      excellent: "उत्कृष्ट!",
      good: "अच्छी प्रगति!",
      keepGoing: "जारी रखें!",
      breakdown: "कुल स्कोर का विवरण",
      yogaPts: "योग अंक",
      waterPts: "पानी के अंक",
      dietPts: "आहार अंक",
      grandTotal: "कुल योग",
      aboutWhat: "स्वास्थ्य कैलेंडर एक उच्च-गुणवत्ता वाला वेलनेस ट्रैकर है जो आपके दैनिक शारीरिक व्यायाम, पानी के सेवन और आहार के नियमों को एक दृश्य डैशबोर्ड में जोड़ता है।",
      aboutHow: [
        'डैशबोर्ड साइडबार से स्वास्थ्य कैलेंडर अनुभाग पर जाएँ।',
        'अपनी वर्तमान स्ट्रीक, कुल स्कोर और योग स्ट्रीक देखने के लिए शीर्ष कार्ड की समीक्षा करें।',
        'मुख्य कैलेंडर इंटरफ़ेस पर वर्तमान महीने के तारीखों के ग्रिड को देखें।',
        'पिछले या अगले महीनों को देखने के लिए महीने के नाम के बगल वाले तीरों का उपयोग करें।',
        'कैलेंडर बॉक्स के रंगों को समझें: हरा लक्ष्य पूरा होने को, पीला आंशिक को और लाल छूटे हुए दिन को दर्शाता है।',
        'दैनिक विवरण लोड करने के लिए कैलेंडर के किसी भी दिन पर क्लिक करें।',
        'चयनित दिन के विवरण पैनल में पानी, योग और आहार के स्तर की जाँच करें।',
        'महीने की प्रगति को मापने के लिए "मासिक विश्लेषण" कार्ड पर स्क्रॉल करें।',
        'दैनिक आदतों से मिले अंकों को देखने के लिए "कुल स्कोर का विवरण" देखें।',
        'महीने के प्रदर्शन के आधार पर मिले ग्रेड और सुझावों की समीक्षा करें।',
        'अपनी स्ट्रीक बनाए रखने के लिए रोजाना कम से कम 2 आदतों को पूरा करने का प्रयास करें।',
      ],
      aboutWhy: [
        'यह आपके सभी महत्वपूर्ण स्वास्थ्य रिकॉर्ड को एक ही स्थान पर प्रस्तुत करता है।',
        'अपनी स्ट्रीक को देखना दैनिक रूप से स्वस्थ रहने की प्रेरणा देता है।',
        'रंग-कोडिंग से कम अनुपालन वाले हफ्तों की पहचान करना आसान हो जाता है।',
        'अंकों का विवरण दिखाता है कि किस आदत पर अधिक ध्यान देने की आवश्यकता है।',
        'मासिक प्रगति चार्ट आपकी प्रगति को मापने में मदद करता है।',
        'पानी, व्यायाम और आहार के बीच सही तालमेल बनाने में मदद करता है।',
        'सभी डेटा को स्थानीय रूप से सुरक्षित रखता है, जिससे पूर्ण गोपनीयता बनी रहती है।',
        'डॉक्टर के साथ साझा करने के लिए एक सटीक स्वास्थ्य रिकॉर्ड तैयार करता है।',
        'उपयोगकर्ताओं को आदर्श जीवनशैली अपनाने के लिए प्रोत्साहित करता है।',
        'लंबे समय तक स्वस्थ रहने की आदतों को मजबूत करता है।',
      ]
    },
    eu: {
      title: "Calendario de",
      titleSpan: "Salud",
      subtitle: "Tus rachas diarias de yoga, agua y dieta — todo en un solo lugar",
      curStreak: "Racha Actual",
      totScore: "Puntuación Total",
      yogaStreak: "Racha de Yoga",
      legendPerfect: "2-3 actividades",
      legendPartial: "1 actividad",
      legendMissed: "Perdido",
      legendToday: "Hoy",
      scoreText: "Puntuación",
      pts: "puntos",
      noDataFuture: "No hay datos para fechas futuras.",
      waterIntake: "Consumo de Agua",
      yogaEx: "Yoga / Ejercicio",
      dietPlan: "Plan de Dieta",
      goalMet: "Meta cumplida ✓",
      notTracked: "No registrado",
      sessionDone: "Sesión completada ✓",
      noSession: "Sin sesión",
      dietTracked: "Dieta registrada ✓",
      notLogged: "No registrado",
      monthlyAnalysis: "Análisis Mensual",
      waterGoals: "Metas de Agua Met",
      yogaSessions: "Sesiones de Yoga",
      dietTrackedLbl: "Dieta Registrada",
      perfectDays: "Días Perfectos (todos 3)",
      adherence: "Adherencia general",
      perfect: "días perfectos",
      excellent: "¡Excelente!",
      good: "¡Buen progreso!",
      keepGoing: "¡Sigue adelante!",
      breakdown: "Desglose de Puntuación",
      yogaPts: "Puntos de Yoga",
      waterPts: "Puntos de Agua",
      dietPts: "Puntos de Dieta",
      grandTotal: "Gran Total",
      aboutWhat: "El Calendario de Salud es un rastreador de bienestar que consolida tu ejercicio, hidratación y dieta en un solo panel.",
      aboutHow: [
        'Navega a la sección de Calendario de Salud desde la barra lateral.',
        'Revisa los contadores de tu Racha Actual, Puntuación y Racha de Yoga en la parte superior.',
        'Explora la cuadrícula de fechas del mes actual en el calendario.',
        'Usa las flechas izquierda y derecha para navegar entre los meses.',
        'Identifica el estado por los colores: verde (bueno), amarillo (parcial) y rojo (perdido).',
        'Haz clic en cualquier día para cargar los detalles en el panel derecho.',
        'Inspecciona el estado del Agua, Yoga y Dieta para ese día en particular.',
        'Revisa los gráficos de cumplimiento en el panel de Análisis Mensual.',
        'Observa los puntos acumulados por cada hábito en el panel de Desglose.',
        'Monitorea tu nivel de cumplimiento general del mes.',
        'Completa al menos 2 hábitos diarios para no romper tu racha activa.',
      ],
      aboutWhy: [
        'Ofrece una vista unificada de todos tus registros diarios de salud.',
        'Visualizar las rachas es un excelente estímulo para ser constante.',
        'Ayuda a detectar fácilmente los días o semanas con menor actividad.',
        'Muestra con precisión qué hábitos requieren mayor atención.',
        'Hace medible tu progreso mensual con estadísticas claras.',
        'Promueve un equilibrio saludable entre ejercicio, dieta y agua.',
        'Almacena todo localmente garantizando la máxima seguridad y privacidad.',
        'Prepara registros confiables que puedes compartir con tu médico.',
        'Fomenta el autocuidado diario para una vida más saludable.',
        'Establece hábitos positivos y sostenibles a largo plazo.',
      ]
    }
  };

  const ct = (key) => localT[lang]?.[key] || localT['en']?.[key];

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activityMap, setActivityMap] = useState({});
  const [waterTarget, setWaterTarget] = useState(2500);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const { map, waterTarget: wt } = buildActivityMap(user);
    setActivityMap(map);
    setWaterTarget(wt);
  }, [user]);

  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const dateKey = (y, m, d) => {
    const mo = String(m + 1).padStart(2, '0');
    const da = String(d).padStart(2, '0');
    return `${y}-${mo}-${da}`;
  };

  const computeCurrentStreak = () => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toLocaleDateString('en-CA');
      const entry = activityMap[key];
      if (entry && getDayScore(entry) >= 2) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  };

  const computeMonthlyStats = () => {
    const total = daysInMonth(year, month);
    const today = new Date();
    const pastDays = year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth())
      ? total
      : (year === today.getFullYear() && month === today.getMonth())
        ? today.getDate()
        : 0;

    let waterDone = 0, yogaDone = 0, dietDone = 0, allDone = 0;
    for (let d = 1; d <= pastDays; d++) {
      const key = dateKey(year, month, d);
      const e = activityMap[key];
      if (e?.water) waterDone++;
      if (e?.yoga)  yogaDone++;
      if (e?.diet)  dietDone++;
      if (getDayScore(e) === 3) allDone++;
    }
    return { total, pastDays, waterDone, yogaDone, dietDone, allDone };
  };

  const computeTotalScore = () => {
    let score = 0;
    Object.values(activityMap).forEach(e => { score += getDayScore(e); });
    return score;
  };

  const currentStreak = computeCurrentStreak();
  const monthStats = computeMonthlyStats();
  const totalScore = computeTotalScore();
  const yogaStreakLS = parseInt(localStorage.getItem(user?.id ? `yoga_day_streaks_${user.id}` : 'yoga_day_streaks') || '0', 10);

  const getDayStatus = (d) => {
    const key = dateKey(year, month, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateObj = new Date(year, month, d);
    if (dateObj > today) return 'future';
    if (dateObj.getTime() === today.getTime()) return 'today';
    const entry = activityMap[key];
    const score = getDayScore(entry);
    if (score >= 2) return 'streak';
    if (score === 1) return 'partial';
    return 'missed';
  };

  const renderDays = () => {
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const dayElements = [];

    for (let i = 0; i < startDay; i++) {
      dayElements.push(<div key={`empty-${i}`} className="cal-day-empty" />);
    }

    for (let d = 1; d <= totalDays; d++) {
      const status = getDayStatus(d);
      const key = dateKey(year, month, d);
      const entry = activityMap[key] || {};
      const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;

      let bg = '#f8fafc', border = '1.5px solid #e2e8f0', color = '#64748b', shadow = 'none', emoji = '';
      if (status === 'today') {
        bg = 'linear-gradient(135deg, #4f46e5, #7c3aed)';
        color = 'white'; border = 'none';
        shadow = '0 6px 20px rgba(79,70,229,0.35)';
        emoji = '⭐';
      } else if (status === 'streak') {
        bg = 'linear-gradient(135deg, #f0fdf4, #dcfce7)';
        color = '#166534'; border = '1.5px solid #86efac';
        shadow = '0 2px 8px rgba(16,185,129,0.15)';
        emoji = '🔥';
      } else if (status === 'partial') {
        bg = 'linear-gradient(135deg, #fefce8, #fef9c3)';
        color = '#713f12'; border = '1.5px solid #fde047';
        emoji = '⚡';
      } else if (status === 'missed') {
        bg = 'linear-gradient(135deg, #fef2f2, #fee2e2)';
        color = '#991b1b'; border = '1.5px dashed #fca5a5';
        emoji = '💔';
      } else {
        bg = '#f8fafc'; color = '#cbd5e1'; border = '1.5px solid transparent';
      }

      if (isSelected && status !== 'today') {
        border = '2px solid #4f46e5';
        shadow = '0 0 0 3px rgba(79,102,241,0.15)';
      }

      dayElements.push(
        <div key={d}
          onClick={() => setSelectedDate(new Date(year, month, d))}
          style={{
            background: bg, border, borderRadius: '14px', color,
            fontWeight: '800', fontSize: '0.95rem',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: '3px', position: 'relative',
            transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            cursor: status === 'future' ? 'default' : 'pointer',
            boxShadow: shadow, minHeight: '72px',
            opacity: status === 'future' ? 0.4 : 1
          }}
          onMouseOver={e => { if (status !== 'future') e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)'; }}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
        >
          <span style={{ fontSize: '0.9rem' }}>{d}</span>
          {emoji && <span style={{ fontSize: '0.75rem', lineHeight: 1 }}>{emoji}</span>}
          {status === 'streak' && (
            <div style={{ display: 'flex', gap: '2px' }}>
              {entry.water && <span style={{ fontSize: '0.55rem' }}>💧</span>}
              {entry.yoga  && <span style={{ fontSize: '0.55rem' }}>🧘</span>}
              {entry.diet  && <span style={{ fontSize: '0.55rem' }}>🥗</span>}
            </div>
          )}
        </div>
      );
    }
    return dayElements;
  };

  const selKey = dateKey(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  const selEntry = activityMap[selKey] || {};
  const selStatus = getDayStatus(selectedDate.getDate());

  const pct = n => monthStats.pastDays > 0 ? Math.round((n / monthStats.pastDays) * 100) : 0;

  return (
    <div style={{ padding: '1.5rem 2rem 4rem', background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)', minHeight: '100vh' }}>

      {/* ── Total Score Banner ──────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #0ea5e9 100%)',
        borderRadius: '24px', padding: '2rem 2.5rem', marginBottom: '1.5rem',
        color: 'white', boxShadow: '0 20px 50px -10px rgba(79,70,229,0.4)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <CalendarIcon size={32} />
            <h1 style={{ fontSize: '2rem', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>{ct('title')}</h1>
          </div>
          <p style={{ opacity: 0.85, margin: 0, fontSize: '0.95rem' }}>
            {ct('subtitle')}
          </p>
        </div>

        {/* Stat chips */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '1rem 1.5rem', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: '2rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Flame size={24} color="#fbbf24" /> {currentStreak}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '1px' }}>{ct('curStreak')}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '1rem 1.5rem', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: '2rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Trophy size={24} color="#fbbf24" /> {totalScore}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '1px' }}>{ct('totScore')}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '1rem 1.5rem', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: '2rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>🧘 {yogaStreakLS}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '1px' }}>{ct('yogaStreak')}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── Calendar Card ───────────────────────────────────────────── */}
        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e8ecf5', boxShadow: '0 8px 32px rgba(79,70,229,0.06)', overflow: 'hidden' }}>
          {/* Month nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9' }}>
            <button onClick={prevMonth} style={{ background: 'rgba(79,70,229,0.08)', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer', color: '#4f46e5', transition: 'all 0.2s', display: 'flex' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(79,70,229,0.15)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(79,70,229,0.08)'}
            ><ChevronLeft size={22} /></button>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>
              {(localMonths[lang] || localMonths['en'])[month]} <span style={{ color: '#94a3b8', fontWeight: '600' }}>{year}</span>
            </h2>
            <button onClick={nextMonth} style={{ background: 'rgba(79,70,229,0.08)', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer', color: '#4f46e5', transition: 'all 0.2s', display: 'flex' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(79,70,229,0.15)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(79,70,229,0.08)'}
            ><ChevronRight size={22} /></button>
          </div>

          <div style={{ padding: '1.5rem 2rem 2rem' }}>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {(localWeekdays[lang] || localWeekdays['en']).map(d => (
                <div key={d} style={{ textAlign: 'center', fontWeight: '800', color: '#94a3b8', fontSize: '0.72rem', letterSpacing: '0.5px' }}>{d}</div>
              ))}
            </div>

            {/* Day grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
              {renderDays()}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', padding: '1rem', background: '#f8fafc', borderRadius: '14px' }}>
              {[['🔥', ct('legendPerfect')], ['⚡', ct('legendPartial')], ['💔', ct('legendMissed')], ['⭐', ct('legendToday')]].map(([sym, lbl]) => (
                <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>
                  <span>{sym}</span>{lbl}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Panel ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Selected Day Detail */}
          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8ecf5', boxShadow: '0 6px 24px rgba(79,70,229,0.06)', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e1b4b', margin: '0 0 0.25rem 0' }}>
              {selectedDate.toLocaleDateString(lang === 'eu' ? 'es-ES' : lang, { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <p style={{ margin: '0 0 1rem 0', color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600' }}>
              {ct('scoreText')}: {getDayScore(selEntry)}/3 {ct('pts')}
            </p>

            {selStatus === 'future' ? (
              <div style={{ textAlign: 'center', color: '#cbd5e1', padding: '1rem 0' }}>
                <CalendarIcon size={36} style={{ opacity: 0.3, margin: '0 auto 0.5rem', display: 'block' }} />
                <p style={{ margin: 0, fontSize: '0.85rem' }}>{ct('noDataFuture')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { icon: <Droplets size={18} color="white" />, label: ct('waterIntake'), bg: '#0ea5e9', done: selEntry.water, detail: selEntry.waterMl ? `${(selEntry.waterMl/1000).toFixed(1)}L / ${(waterTarget/1000).toFixed(1)}L` : selEntry.water ? ct('goalMet') : ct('notTracked') },
                  { icon: <Dumbbell size={18} color="white" />, label: ct('yogaEx'), bg: '#8b5cf6', done: selEntry.yoga, detail: selEntry.yoga ? ct('sessionDone') : ct('noSession') },
                  { icon: <Utensils size={18} color="white" />, label: ct('dietPlan'), bg: '#f59e0b', done: selEntry.diet, detail: selEntry.diet ? ct('dietTracked') : ct('notLogged') }
                ].map(({ icon, label, bg, done, detail }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem', background: done ? 'rgba(16,185,129,0.05)' : '#fafafa', borderRadius: '12px', border: `1px solid ${done ? 'rgba(16,185,129,0.2)' : '#f1f5f9'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ background: bg, padding: '8px', borderRadius: '10px', display: 'flex' }}>{icon}</div>
                      <div>
                        <div style={{ fontWeight: '700', color: '#334155', fontSize: '0.88rem' }}>{label}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{detail}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '1.2rem' }}>{done ? '✅' : '❌'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly Analysis */}
          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8ecf5', boxShadow: '0 6px 24px rgba(79,70,229,0.06)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <TrendingUp size={20} color="#4f46e5" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#1e1b4b' }}>{ct('monthlyAnalysis')} — {(localMonths[lang] || localMonths['en'])[month]}</h3>
            </div>

            {[
              { label: ct('waterGoals'), value: monthStats.waterDone, color: '#0ea5e9', icon: '💧' },
              { label: ct('yogaSessions'), value: monthStats.yogaDone, color: '#8b5cf6', icon: '🧘' },
              { label: ct('dietTrackedLbl'), value: monthStats.dietDone, color: '#f59e0b', icon: '🥗' },
              { label: ct('perfectDays'), value: monthStats.allDone, color: '#10b981', icon: '🏆' },
            ].map(({ label, value, color, icon }) => (
              <div key={label} style={{ marginBottom: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>
                  <span>{icon} {label}</span>
                  <span style={{ color }}>{value}/{monthStats.pastDays} days ({pct(value)}%)</span>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct(value)}%`, height: '100%', background: color, borderRadius: '8px', transition: 'width 0.8s ease' }} />
                </div>
              </div>
            ))}

            <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'linear-gradient(135deg, rgba(79,70,229,0.08), rgba(124,58,237,0.05))', borderRadius: '12px', border: '1px solid rgba(79,70,229,0.12)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#4f46e5' }}>
                {ct('adherence')}: <strong>{pct(monthStats.allDone)}%</strong> {ct('perfect')} — {monthStats.allDone >= 20 ? `🏅 ${ct('excellent')}` : monthStats.allDone >= 10 ? `👍 ${ct('good')}` : `💪 ${ct('keepGoing')}`}
              </span>
            </div>
          </div>

          {/* Score breakdown */}
          <div style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: '20px', padding: '1.25rem 1.5rem', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Trophy size={18} />
              <span style={{ fontWeight: '800', fontSize: '0.95rem' }}>{ct('breakdown')}</span>
            </div>
            {[
              { label: ct('yogaPts'), icon: '🧘', val: Object.values(activityMap).filter(e=>e?.yoga).length },
              { label: ct('waterPts'), icon: '💧', val: Object.values(activityMap).filter(e=>e?.water).length },
              { label: ct('dietPts'), icon: '🥗', val: Object.values(activityMap).filter(e=>e?.diet).length },
            ].map(({label, icon, val}) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85rem', fontWeight: '600' }}>
                <span style={{ opacity: 0.85 }}>{icon} {label}</span>
                <span style={{ fontWeight: '900' }}>{val} pts</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0 0', fontSize: '1rem', fontWeight: '900' }}>
              <span>{ct('grandTotal')}</span>
              <span>{totalScore} pts</span>
            </div>
          </div>
        </div>
      </div>

      <SectionAbout
        title={ct('title')}
        icon="📅"
        color="#4f46e5"
        gradient="linear-gradient(135deg, #7c3aed, #4f46e5)"
        what={ct('aboutWhat')}
        howToUse={ct('aboutHow')}
        importance={ct('aboutWhy')}
        style={{ position: 'absolute', bottom: '2rem', right: '2rem', top: 'auto' }}
      />
    </div>
  );
}
