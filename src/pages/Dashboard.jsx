import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import SectionAbout from '../components/SectionAbout';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Search, Bell, Settings, User, Edit3, MoreVertical, Heart,
  Activity, 
  ChevronRight, Calendar, Pill, Droplets, Utensils, Dumbbell,
  FileText, Brain, Clock, X, TrendingUp, Flame, Star, Moon
} from 'lucide-react';
import { getIdealSleepRange } from '../utils/sleepHelper';
import { getStreak, recordDailyActivity, getRecentStreakDays } from '../utils/streakHelper';

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [patientData, setPatientData] = useState(null);
  const [yogaStreaks, setYogaStreaks] = useState(0);
  const [lifestyleStats, setLifestyleStats] = useState({
    water: { pct: 0, text: '0L / 2.5L' },
    diet: { pct: 0, text: '0 / 2000 kcal' },
    exercise: { pct: 0, text: '0/10 sessions' },
    sleep: { pct: 0, text: '0.0h / 8.0h' }
  });

  const { lang } = useLanguage();

  // Live Weather state with offline cache
  const [liveWeather, setLiveWeather] = useState(() => {
    try {
      const cached = localStorage.getItem('medivault_last_weather');
      if (cached) return JSON.parse(cached);
    } catch {}
    return { temp: 24, code: 2, symbol: '⛅', text: 'Partly Cloudy' };
  });

  const [isSleepActive, setIsSleepActive] = useState(() => {
    return localStorage.getItem('medivault_sleep_active') === 'true';
  });

  useEffect(() => {
    const handleSleepChange = () => {
      setIsSleepActive(localStorage.getItem('medivault_sleep_active') === 'true');
    };
    window.addEventListener('medivault_sleep_changed', handleSleepChange);
    return () => {
      window.removeEventListener('medivault_sleep_changed', handleSleepChange);
    };
  }, []);

  const handleToggleSleep = () => {
    window.dispatchEvent(new CustomEvent('medivault_toggle_sleep'));
  };

  const getWeeklySleepData = () => {
    const sleepStore = (() => {
      try {
        return JSON.parse(localStorage.getItem('medivault_sleep_store') || '{}');
      } catch {
        return {};
      }
    })();

    const days = [
      { label: lang === 'te' ? 'సోమ' : lang === 'hi' ? 'सोम' : lang === 'eu' ? 'Lun' : 'Mon' },
      { label: lang === 'te' ? 'మంగళ' : lang === 'hi' ? 'मंगल' : lang === 'eu' ? 'Mar' : 'Tue' },
      { label: lang === 'te' ? 'బుధ' : lang === 'hi' ? 'बुध' : lang === 'eu' ? 'Mié' : 'Wed' },
      { label: lang === 'te' ? 'గురు' : lang === 'hi' ? 'गुरु' : lang === 'eu' ? 'Jue' : 'Thu' },
      { label: lang === 'te' ? 'శుక్ర' : lang === 'hi' ? 'शुक्र' : lang === 'eu' ? 'Vie' : 'Fri' },
      { label: lang === 'te' ? 'శని' : lang === 'hi' ? 'शनि' : lang === 'eu' ? 'Sáb' : 'Sat' },
      { label: lang === 'te' ? 'ఆది' : lang === 'hi' ? 'रवि' : lang === 'eu' ? 'Dom' : 'Sun' }
    ];

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);

    return days.map((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const dateString = date.toLocaleDateString('en-CA');
      
      const entry = sleepStore[dateString];
      const val = entry ? Math.min(100, entry.pct || 0) : 0;
      const hours = entry ? entry.hours || 0 : 0;
      
      return {
        day: day.label,
        val: val,
        hours: hours,
        col: '#6366f1'
      };
    });
  };

  useEffect(() => {
    const fetchLiveWeather = async (lat, lon) => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
        );
        if (!response.ok) return;
        const data = await response.json();
        const tempVal = Math.round(data.current.temperature_2m);
        const codeVal = data.current.weather_code;
        
        // Map weather code and temperature to symbols and descriptors
        let details = { symbol: '🌡️', text: 'Clear' };
        if (tempVal >= 35) {
          details = { symbol: '🔥', text: 'Hot / Sunny' };
        } else if (codeVal === 0) {
          details = { symbol: '☀️', text: 'Clear Sky' };
        } else if (codeVal >= 1 && codeVal <= 3) {
          details = { symbol: '⛅', text: 'Partly Cloudy' };
        } else if (codeVal === 45 || codeVal === 48) {
          details = { symbol: '🌫️', text: 'Foggy' };
        } else if ((codeVal >= 51 && codeVal <= 57) || (codeVal >= 80 && codeVal <= 82)) {
          details = { symbol: '🌧️', text: 'Rainy' };
        } else if (codeVal >= 61 && codeVal <= 67) {
          details = { symbol: '🌧️', text: 'Heavy Rain' };
        } else if ((codeVal >= 71 && codeVal <= 77) || (codeVal >= 85 && codeVal <= 86)) {
          details = { symbol: '❄️', text: 'Snowy' };
        } else if (codeVal >= 95) {
          details = { symbol: '⛈️', text: 'Thunderstorm' };
        }

        const newWeather = { temp: tempVal, code: codeVal, ...details };
        setLiveWeather(newWeather);
        localStorage.setItem('medivault_last_weather', JSON.stringify(newWeather));
      } catch (e) {
        console.error('Error fetching live weather for dashboard:', e);
      }
    };

    const fetchIPLocationFallback = async () => {
      try {
        const ipRes = await fetch('https://ipapi.co/json/');
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData.latitude && ipData.longitude) {
            fetchLiveWeather(ipData.latitude, ipData.longitude);
            return true;
          }
        }
      } catch (err) {
        console.warn('IP location fetch failed for dashboard:', err);
      }
      return false;
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchLiveWeather(pos.coords.latitude, pos.coords.longitude);
        },
        async () => {
          const success = await fetchIPLocationFallback();
          if (!success) fetchLiveWeather(17.385, 78.4867); // Hyderabad fallback
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      fetchIPLocationFallback().then(success => {
        if (!success) fetchLiveWeather(17.385, 78.4867);
      });
    }
  }, []);

  const localT = {
    en: {
      patient: 'Patient',
      patientId: 'Patient ID',
      cardiology: 'Cardiology',
      lastCheckup: 'Last Checkup',
      active: 'ACTIVE',
      editProfile: 'Edit Profile',
      startSleep: 'Start Sleep Mode',
      sleepActive: 'Tracking Sleep... 💤',
      weeklySleepTrend: 'Weekly Sleep Trend (Ideal vs Actual)',
      lifestyleInsights: 'Lifestyle Insights',
      waterIntake: 'Water Intake',
      dietScore: 'Diet Score',
      exercise: 'Exercise',
      yogaStreaks: 'Yoga Streaks',
      sleepTracker: 'Sleep Tracker',
      daysStreak: 'Day Streak',
      weeklyPerformance: 'Weekly Performance',
      clinicalNotes: 'Clinical Notes',
      quickAccess: 'Quick Access',
      addClinicalNote: 'Add Clinical Note',
      doctorAuthor: 'Doctor / Author',
      notes: 'Notes',
      cancel: 'Cancel',
      saveNote: 'Save Note',
      writeNotesPl: 'Write hospital-related clinical notes here...',
      climate: 'Partly Cloudy, 24°C ⛅',
      daysFire: 'Days 🔥',
      sessions: 'sessions',
      kcal: 'kcal',
      
      // Page names for quick actions
      medicalSlips: 'Medical Slips',
      tabletsInfo: 'Tablets Info',
      dietPlan: 'Diet Plan',
      tabletAlarm: 'Tablet Alarm',
      drinkingWater: 'Drinking Water',
      yoga: 'Yoga',
      dietTimetable: 'Diet Timetable',
      diseasesExercise: 'Diseases Exercise',
      calendarView: 'Health Calendar',

      quotes: [
        "Your health is your greatest wealth. Keep it up!",
        "Every day is a new opportunity to feel better.",
        "Small steps every day lead to big health changes.",
        "Take care of your body, it's the only place you have to live.",
        "Healing takes time. Be patient with yourself.",
        "Rest when you're weary. Refresh and renew.",
        "Stay positive. Your body hears what your mind says."
      ],

      aboutWhat: "The Dashboard is the central control panel of MediVault — your personal health command center. It gives you a real-time overview of your entire health status including patient details, lifestyle stats (water, diet, exercise), yoga streak, weekly performance chart, and quick access to all health sections.",
      aboutHow: [
        'Your patient info banner shows your name, age, gender, and last checkup date — click Edit Profile to update it.',
        'Check the Lifestyle Insights card to see your water intake, diet score, and exercise progress for today.',
        'The Weekly Performance bar chart shows your daily health activity from Monday to Sunday.',
        'Review Clinical Notes to see past doctor observations — click + to add a new note.',
        'Use the Quick Access grid to instantly navigate to any health section like Yoga, Diet, or Tablet Reminder.',
        'The live clock at the top shows the current time with morning/afternoon/night color themes.',
        'Daily motivational quotes rotate automatically to keep you inspired each day.',
      ],
      aboutWhy: [
        'Acts as your daily health dashboard — giving you a full picture of your health at a glance.',
        'The lifestyle stats help you stay on track with water, diet and exercise goals every day.',
        'Clinical notes help maintain a personal health journal with doctor observations.',
        'The yoga streak motivates daily practice and builds long-term healthy habits.',
        'Quick access ensures you never miss taking medications, doing yoga, or logging meals.',
        'Centralizes all health data so you do not need to jump between separate apps.',
      ]
    },
    te: {
      patient: 'రోగి',
      patientId: 'రోగి ఐడి',
      cardiology: 'కార్డియాలజీ',
      lastCheckup: 'చివరి తనిఖీ',
      active: 'యాక్టివ్',
      editProfile: 'ప్రొఫైల్ సవరించు',
      startSleep: 'నిద్ర మోడ్ ప్రారంభించండి',
      sleepActive: 'నిద్ర ట్రాక్ అవుతోంది... 💤',
      weeklySleepTrend: 'వారపు నిద్ర ట్రెండ్ (ఆదర్శం vs వాస్తవం)',
      lifestyleInsights: 'జీవనశైలి అవగాహన',
      waterIntake: 'నీటి వినియోగం',
      dietScore: 'ఆహార స్కోరు',
      exercise: 'వ్యాయామం',
      yogaStreaks: 'యోగా స్ట్రీక్స్',
      sleepTracker: 'నిద్ర ట్రాకర్',
      daysStreak: 'రోజుల స్ట్రీక్',
      weeklyPerformance: 'వారపు పనితీరు',
      clinicalNotes: 'క్లినికల్ నోట్స్',
      quickAccess: 'త్వరిత ప్రవేశం',
      addClinicalNote: 'క్లినికల్ నోట్ జోడించండి',
      doctorAuthor: 'డాక్టర్ / రచయిత',
      notes: 'నోట్స్',
      cancel: 'రద్దు చేయి',
      saveNote: 'నోట్ సేవ్ చేయి',
      writeNotesPl: 'ఆసుపత్రికి సంబంధించిన క్లినికల్ నోట్స్ ఇక్కడ రాయండి...',
      climate: 'పాక్షికంగా మేఘావృతం, 24°C ⛅',
      daysFire: 'రోజులు 🔥',
      sessions: 'సెషన్లు',
      kcal: 'కిలోక్యాలరీలు',

      medicalSlips: 'వైద్య స్లిప్‌లు',
      tabletsInfo: 'మాత్రల సమాచారం',
      dietPlan: 'ఆహార ప్రణాళిక',
      tabletAlarm: 'మాత్ర అలారం',
      drinkingWater: 'మంచినీరు',
      yoga: 'యోగా',
      dietTimetable: 'ఆహార సమయపట్టిక',
      diseasesExercise: 'వ్యాధుల వ్యాయామాలు',
      calendarView: 'ఆరోగ్య క్యాలెండర్',

      quotes: [
        "మీ ఆరోగ్యమే మీ మహాభాగ్యం. కొనసాగించండి!",
        "ప్రతి రోజు మంచి అనుభూతిని పొందడానికి ఒక కొత్త అవకాశం.",
        "ప్రతిరోజూ చిన్న అడుగులు పెద్ద ఆరోగ్య మార్పులకు దారితీస్తాయి.",
        "మీ శరీరాన్ని జాగ్రత్తగా చూసుకోండి, మీరు నివసించవలసిన ఏకైక ప్రదేశం ఇదే.",
        "నయం కావడానికి సమయం పడుతుంది. మీపై ఓపికగా ఉండండి.",
        "అలసిపోయినప్పుడు విశ్రాంతి తీసుకోండి. ఉల్లాసంగా ఉండండి.",
        "సానుకూలంగా ఉండండి. మీ మనస్సు చెప్పేది మీ శరీరం వింటుంది."
      ],

      aboutWhat: "డాష్‌బోర్డ్ అనేది MediVault యొక్క కేంద్ర నియంత్రణ ప్యానెల్ — మీ వ్యక్తిగత ఆరోగ్య కమాండ్ సెంటర్. ఇది మీ పేరు, వయస్సు, రోజువారీ నీరు, ఆహారం, యోగా మరియు ఇతర విభాగాలకు త్వరిత ప్రాప్యతను అందిస్తుంది.",
      aboutHow: [
        'మీ ప్రొఫైల్ వివరాలను సవరించడానికి \"ప్రొఫైల్ సవరించు\" క్లిక్ చేయండి.',
        'ఈరోజు మీ నీరు, ఆహారం మరియు వ్యాయామ పురోగతిని చూడటానికి జీవనశైలి అవగాహన కార్డును తనిఖీ చేయండి.',
        'వారపు పనితీరు చార్ట్ సోమవారం నుండి ఆదివారం వరకు మీ రోజువారీ కార్యకలాపాలను చూపిస్తుంది.',
        'వైద్యుల గమనికలను చూడటానికి క్లినికల్ నోట్స్ తనిఖీ చేయండి — కొత్తది జోడించడానికి + నొక్కండి.',
        'యోగా, డైట్ లేదా టాబ్లెట్ రిమైండర్ వంటి విభాగాలకు వెళ్ళడానికి త్వరిత ప్రవేశ గ్రిడ్‌ను ఉపయోగించండి.',
        'పైన ఉన్న లైవ్ గడియారం ఉదయం/మధ్యాహ్నం/రాత్రి థీమ్‌లను ప్రదర్శిస్తుంది.',
        'రోజువారీ కోట్స్ మిమ్మల్ని ప్రతిరోజూ ప్రేరేపిస్తాయి.',
      ],
      aboutWhy: [
        'మీ రోజువారీ ఆరోగ్యాన్ని ఒకే చోట సులభంగా అవలోకనం చేసుకోవడానికి సహాయపడుతుంది.',
        'జీవనశైలి గణాంకాలు నీటి వినియోగం, ఆహారం మరియు వ్యాయామ లక్ష్యాలను సాధించడంలో సహాయపడతాయి.',
        'క్లినికల్ గమనికలు వైద్యుల నివేదికలను సురక్షితంగా ఉంచుతాయి.',
        'యోగా స్ట్రీక్ ఆరోగ్యకరమైన అలవాట్లను పెంపొందిస్తుంది.',
        'త్వరిత ప్రవేశం సమయాన్ని ఆదా చేస్తుంది మరియు పనులను సులభతరం చేస్తుంది.',
        'అన్ని రకాల డేటాను ఒకే చోట చేర్చి ప్రైవసీని కాపాడుతుంది.',
      ]
    },
    hi: {
      patient: 'मरीज',
      patientId: 'मरीज आईडी',
      cardiology: 'हृदय रोग विज्ञान',
      lastCheckup: 'अंतिम जांच',
      active: 'सक्रिय',
      editProfile: 'प्रोफ़ाइल संपादित करें',
      startSleep: 'स्लीप मोड शुरू करें',
      sleepActive: 'नींद ट्रैक हो रही है... 💤',
      weeklySleepTrend: 'साप्ताहिक नींद का रुझान (आदर्श बनाम वास्तविक)',
      lifestyleInsights: 'जीवन शैली अंतर्दृष्टि',
      waterIntake: 'पानी का सेवन',
      dietScore: 'आहार स्कोर',
      exercise: 'व्यायाम',
      yogaStreaks: 'योग स्ट्रीक्स',
      sleepTracker: 'स्लीप ट्रैकर',
      daysStreak: 'दिन की स्ट्रीक',
      weeklyPerformance: 'साप्ताहिक प्रदर्शन',
      clinicalNotes: 'नैदानिक नोट्स',
      quickAccess: 'त्वरित पहुंच',
      addClinicalNote: 'क्लिनिकल नोट जोड़ें',
      doctorAuthor: 'डॉक्टर / लेखक',
      notes: 'नोट्स',
      cancel: 'रद्द करें',
      saveNote: 'नोट सहेजें',
      writeNotesPl: 'अस्पताल से संबंधित नैदानिक नोट्स यहां लिखें...',
      climate: 'आंशिक रूप से बादल छाए हैं, 24°C ⛅',
      daysFire: 'दिन 🔥',
      sessions: 'सत्र',
      kcal: 'कैलोरी',

      medicalSlips: 'मेडिकल स्लिप्स',
      tabletsInfo: 'टेबलेट जानकारी',
      dietPlan: 'आहार योजना',
      tabletAlarm: 'टेबलेट अलार्म',
      drinkingWater: 'पीने का पानी',
      yoga: 'योग',
      dietTimetable: 'आहार समय सारणी',
      diseasesExercise: 'रोग और व्यायाम',
      calendarView: 'स्वास्थ्य कैलेंडर',

      quotes: [
        "आपका स्वास्थ्य ही आपकी सबसे बड़ी संपत्ति है। इसे बनाए रखें!",
        "हर दिन बेहतर महसूस करने का एक नया अवसर है।",
        "हर दिन छोटे कदम बड़े स्वास्थ्य परिवर्तनों की ओर ले जाते हैं।",
        "अपने शरीर की देखभाल करें, यही एकमात्र जगह है जहां आपको रहना है।",
        "ठीक होने में समय लगता है। खुद के प्रति धैर्य रखें।",
        "थक जाने पर आराम करें। तरोताजा और नवीनीकृत हों।",
        "सकारात्मक रहें। आपका शरीर वही सुनता है जो आपका दिमाग कहता है।"
      ],

      aboutWhat: "डैशबोर्ड MediVault का केंद्रीय नियंत्रण कक्ष है — आपका व्यक्तिगत स्वास्थ्य कमान केंद्र। यह आपको मरीज के विवरण, जीवनशैली आंकड़े और सभी स्वास्थ्य अनुभागों तक त्वरित पहुंच प्रदान करता है।",
      aboutHow: [
        'मरीज बैनर में नाम, उम्र और जांच तिथि देखें — अपडेट करने के लिए प्रोफ़ाइल संपादित करें पर क्लिक करें।',
        'पानी के सेवन, आहार स्कोर और व्यायाम की प्रगति देखने के लिए जीवनशैली कार्ड देखें।',
        'साप्ताहिक प्रदर्शन चार्ट सोमवार से रविवार तक की दैनिक गतिविधियों को प्रदर्शित करता है।',
        'डॉक्टर के नोट्स देखने के लिए क्लिनिकल नोट्स देखें — नया नोट जोड़ने के लिए + पर क्लिक करें।',
        'किसी भी अनुभाग (योग, आहार, टेबलेट रिमाइंडर) पर जाने के लिए त्वरित पहुंच ग्रिड का उपयोग करें।',
        'शीर्ष पर लाइव घड़ी सुबह/दोपहर/रात के रंगों के साथ समय दर्शाती है।',
        'दैनिक प्रेरक उद्धरण आपको हर दिन प्रेरित रखेंगे।',
      ],
      aboutWhy: [
        'आपके पूरे स्वास्थ्य की स्थिति को एक नज़र में स्पष्ट रूप से दिखाता है।',
        'दैनिक पानी, आहार और व्यायाम के लक्ष्यों को पूरा करने में मदद करता है।',
        'चिकित्सीय परामर्शों का इतिहास एक ही स्थान पर सहेज कर रखता है।',
        'योग स्ट्रीक स्वास्थ्य के प्रति निरंतरता और अनुशासन बढ़ाती है।',
        'त्वरित पहुंच से समय की बचत होती है और नेविगेशन आसान होता है।',
        'सभी प्रकार के स्वास्थ्य डेटा को सुरक्षित और स्थानीय रखता है।',
      ]
    },
    eu: {
      patient: 'Paciente',
      patientId: 'ID Paciente',
      cardiology: 'Cardiología',
      lastCheckup: 'Último Chequeo',
      active: 'ACTIVO',
      editProfile: 'Editar Perfil',
      startSleep: 'Iniciar Modo Sueño',
      sleepActive: 'Registrando Sueño... 💤',
      weeklySleepTrend: 'Tendencia Semanal de Sueño (Ideal vs Real)',
      lifestyleInsights: 'Hábitos Saludables',
      waterIntake: 'Consumo de Agua',
      dietScore: 'Puntuación de Dieta',
      exercise: 'Ejercicio',
      yogaStreaks: 'Rachas de Yoga',
      sleepTracker: 'Registro de Sueño',
      daysStreak: 'Racha de Días',
      weeklyPerformance: 'Rendimiento Semanal',
      clinicalNotes: 'Notas Clínicas',
      quickAccess: 'Acceso Rápido',
      addClinicalNote: 'Añadir Nota Clínica',
      doctorAuthor: 'Médico / Autor',
      notes: 'Notas',
      cancel: 'Cancelar',
      saveNote: 'Guardar Nota',
      writeNotesPl: 'Escriba las notas clínicas del hospital aquí...',
      climate: 'Parcialmente Nublado, 24°C ⛅',
      daysFire: 'Días 🔥',
      sessions: 'sesiones',
      kcal: 'kcal',

      medicalSlips: 'Informes Médicos',
      tabletsInfo: 'Info de Medicamentos',
      dietPlan: 'Plan de Dieta',
      tabletAlarm: 'Alarma de Medicamentos',
      drinkingWater: 'Agua Potable',
      yoga: 'Yoga',
      dietTimetable: 'Horario de Dieta',
      diseasesExercise: 'Condiciones y Ejercicios',
      calendarView: 'Calendario de Salud',

      quotes: [
        "Tu salud es tu mayor riqueza. ¡Sigue así!",
        "Cada día es una nueva oportunidad para sentirte mejor.",
        "Pequeños pasos cada día conducen a grandes cambios de salud.",
        "Cuida tu cuerpo, es el único lugar que tienes para vivir.",
        "La curación lleva tiempo. Sé paciente contigo mismo.",
        "Descansa cuando estés cansado. Refréscate y renuévate.",
        "Mantente positivo. Tu cuerpo escucha lo que dice tu mente."
      ],

      aboutWhat: "El Panel de Control es la central de mando de MediVault: su centro de control de salud personal. Le da un resumen en tiempo real de su estado físico, hábitos y notas médicas.",
      aboutHow: [
        'Vea su nombre, edad y fecha de chequeo en el banner principal; haga clic en Editar Perfil para actualizarlo.',
        'Revise la tarjeta de Hábitos Saludables para ver su progreso de agua, dieta y ejercicio de hoy.',
        'El gráfico de barras muestra su nivel de cumplimiento diario de lunes a domingo.',
        'Revise las Notas Clínicas y haga clic en + para añadir observaciones médicas adicionales.',
        'Utilice la cuadrícula de Acceso Rápido para navegar al instante a secciones como Yoga, Medicación o Dieta.',
        'El reloj en vivo en la parte superior cambia de color según sea mañana, tarde o noche.',
        'Las frases motivacionales diarias rotan automáticamente para inspirarle.',
      ],
      aboutWhy: [
        'Funciona como su cuadro de mando de salud diario, proporcionando una visión holística instantánea.',
        'Las métricas de hábitos le ayudan a mantenerse enfocado en sus metas de agua, dieta y ejercicio.',
        'Las notas clínicas permiten documentar recomendaciones médicas de forma organizada.',
        'La racha de yoga estimula la disciplina diaria y fomenta hábitos positivos.',
        'El acceso rápido agiliza la navegación sin perderse entre múltiples menús.',
        'Mantiene todos sus datos de salud centralizados y seguros en un solo dispositivo.',
      ]
    }
  };

  const ct = (key) => localT[lang]?.[key] || localT['en']?.[key];

  // Notes state
  const [clinicalNotes, setClinicalNotes] = useState(() => {
    const saved = localStorage.getItem(`medivault_notes_${user?.id || 'guest'}`);
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, date: 'Apr 10', note: 'Patient reports mild chest tightness post-exercise. ECG normal.', doctor: 'Dr. Sterling' },
      { id: 2, date: 'Apr 8', note: 'Blood pressure elevated. Adjusted lisinopril dosage to 10mg.', doctor: 'Dr. Sterling' },
      { id: 3, date: 'Apr 5', note: 'Advised patient to increase water intake and reduce salt.', doctor: 'Dr. Sterling' },
    ];
  });
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [newDoctorName, setNewDoctorName] = useState('Dr. Sterling');

  useEffect(() => {
    localStorage.setItem(`medivault_notes_${user?.id || 'guest'}`, JSON.stringify(clinicalNotes));
  }, [clinicalNotes, user]);

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const now = new Date();
    const newNote = {
      id: Date.now(),
      date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      note: newNoteText,
      doctor: newDoctorName || 'Dr. Unknown'
    };
    setClinicalNotes([newNote, ...clinicalNotes]);
    setNewNoteText('');
    setShowNoteModal(false);
  };

  useEffect(() => {
    if (user?.id || user?.uid) {
      const currentStreak = getStreak(user);
      setYogaStreaks(currentStreak.count);
      recordDailyActivity(user, 'daily_visit');
    }
  }, [user?.id, user?.uid]);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (user?.id) {
      const data = localStorage.getItem(`medivault_patient_info_${user.id}`);
      if (data) setPatientData(JSON.parse(data));
    }
  }, [user]);

  // ── Load personal details from the post-login modal ────────────────────
  const [personalDetails, setPersonalDetails] = useState(null);
  useEffect(() => {
    if (!user?.id) return;
    const refresh = () => {
      const raw = localStorage.getItem(`medivault_personal_details_${user.id}`);
      if (raw) setPersonalDetails(JSON.parse(raw));
      const piRaw = localStorage.getItem(`medivault_patient_info_${user.id}`);
      if (piRaw) setPatientData(JSON.parse(piRaw));
    };
    refresh();
    window.addEventListener('mv_profile_updated', refresh);
    return () => window.removeEventListener('mv_profile_updated', refresh);
  }, [user]);

  // Load lifestyle insight stats from local storage periodically
  useEffect(() => {
    const fetchStats = () => {
      // Water
      let waterPct = 0;
      let waterText = '0L / 2.5L';
      try {
        const wStore = JSON.parse(localStorage.getItem(user?.id ? `medivault_water_${user.id}` : 'medivault_water') || '{}');
        const today = new Date().toLocaleDateString('en-CA');
        const totalDrank = wStore[today]?.total || 0;
        const target = wStore.target || 2500;
        waterPct = Math.min(100, Math.round((totalDrank / target) * 100));
        waterText = `${(totalDrank / 1000).toFixed(1)}L / ${(target / 1000).toFixed(1)}L`;
      } catch {}

      // Diet
      let dietPct = 0;
      let dietText = `0 / 2000 ${lang === 'eu' ? 'kcal' : lang === 'hi' ? 'कैलोरी' : lang === 'te' ? 'కిలోక్యాలరీలు' : 'kcal'}`;
      try {
         const savedCals = parseInt(localStorage.getItem(user?.id ? `mv_saved_calories_${user.id}` : 'mv_saved_calories') || '0', 10);
         const targetCals = 2000;
         dietPct = Math.min(100, Math.round((savedCals / targetCals) * 100));
         dietText = `${savedCals} / ${targetCals} ${lang === 'eu' ? 'kcal' : lang === 'hi' ? 'कैलोरी' : lang === 'te' ? 'కిలోక్యాలరీలు' : 'kcal'}`;
      } catch {}

      // Exercise (Yoga Videos completed)
      let exPct = 0;
      let exText = `0 / 10 ${lang === 'te' ? 'సెషన్లు' : lang === 'hi' ? 'सत्र' : lang === 'eu' ? 'sesiones' : 'sessions'}`;
      try {
         // Check and reset Level 1 and Level 2 if daily reset date is different
         const today = new Date().toLocaleDateString('en-CA');
         const lastReset = localStorage.getItem(user?.id ? `yoga_last_reset_date_${user.id}` : 'yoga_last_reset_date');
         let completedVideos = JSON.parse(localStorage.getItem(user?.id ? `yoga_completed_videos_${user.id}` : 'yoga_completed_videos') || '{}');
         if (!lastReset) {
           localStorage.setItem(user?.id ? `yoga_last_reset_date_${user.id}` : 'yoga_last_reset_date', today);
         } else if (lastReset !== today) {
           let changed = false;
           Object.keys(completedVideos).forEach(key => {
             if (key.startsWith('l1') || key.startsWith('l2')) {
               delete completedVideos[key];
               changed = true;
             }
           });
           if (changed) {
             localStorage.setItem(user?.id ? `yoga_completed_videos_${user.id}` : 'yoga_completed_videos', JSON.stringify(completedVideos));
           }
           localStorage.setItem(user?.id ? `yoga_last_reset_date_${user.id}` : 'yoga_last_reset_date', today);
           localStorage.removeItem(user?.id ? `yoga_l1_completion_time_${user.id}` : 'yoga_l1_completion_time');
           localStorage.removeItem(user?.id ? `yoga_l2_completion_time_${user.id}` : 'yoga_l2_completion_time');
         }
         const completedCount = Object.keys(completedVideos).length;
         const targetSessions = 10;
         exPct = Math.min(100, Math.round((completedCount / targetSessions) * 100));
         exText = `${completedCount}/${targetSessions} ${lang === 'te' ? 'సెషన్లు' : lang === 'hi' ? 'सत्र' : lang === 'eu' ? 'sesiones' : 'sessions'}`;
      } catch {}

      // Sleep Tracker calculation
      let sleepPct = 0;
      let sleepText = '0.0h / 8.0h';
      try {
        const pdRaw = localStorage.getItem(`medivault_personal_details_${user?.id}`);
        const pd = pdRaw ? JSON.parse(pdRaw) : null;
        const age = parseInt(pd?.age || '32', 10);
        
        const sleepRange = getIdealSleepRange(age);
        const idealAvg = sleepRange.avg;

        const todayKey = new Date().toLocaleDateString('en-CA');
        const sleepStore = JSON.parse(localStorage.getItem('medivault_sleep_store') || '{}');
        const todaySleep = sleepStore[todayKey] || { hours: 0, pct: 0 };

        sleepPct = todaySleep.pct || 0;
        sleepText = `${todaySleep.hours.toFixed(1)}h / ${idealAvg}h`;
      } catch (err) {
        console.error('Error fetching sleep stats:', err);
      }

      setLifestyleStats({
        water: { pct: waterPct || 0, text: waterText },
        diet: { pct: dietPct || 0, text: dietText },
        exercise: { pct: exPct || 0, text: exText },
        sleep: { pct: sleepPct || 0, text: sleepText }
      });

      // Live update per-user streaks
      const streakInfo = getStreak(user);
      setYogaStreaks(streakInfo.count);
    };
    
    fetchStats();
    window.addEventListener('medivault_sleep_logged', fetchStats);
    window.addEventListener('medivault_water_logged', fetchStats);
    window.addEventListener('medivault_water_updated', fetchStats);
    window.addEventListener('medivault_streak_updated', fetchStats);
    const interval = setInterval(fetchStats, 2000); // Check every 2s for cross-tab updates
    return () => {
      window.removeEventListener('medivault_sleep_logged', fetchStats);
      window.removeEventListener('medivault_water_logged', fetchStats);
      window.removeEventListener('medivault_water_updated', fetchStats);
      window.removeEventListener('medivault_streak_updated', fetchStats);
      clearInterval(interval);
    };
  }, [lang, user?.id, user?.uid]);

  const quickActions = [
    { label: ct('medicalSlips'), path: '/medical-slips', icon: FileText, color: '#ef4444' },
    { label: ct('tabletsInfo'), path: '/tablets-info', icon: Pill, color: '#8b5cf6' },
    { label: ct('dietPlan'), path: '/diet-plan', icon: Utensils, color: '#f59e0b' },
    { label: ct('tabletAlarm'), path: '/tablet-alarm', icon: Bell, color: '#0ea5e9' },
    { label: ct('drinkingWater'), path: '/drinking-water', icon: Droplets, color: '#06b6d4' },
    { label: ct('yoga'), path: '/yoga', icon: Brain, color: '#ec4899' },
    { label: ct('dietTimetable'), path: '/diet-timetable', icon: Clock, color: '#14b8a6' },
    { label: ct('calendarView'), path: '/calendar-view', icon: Calendar, color: '#6366f1' },
  ];

  // Build display name: prefer PatientInfo fullName, then personal details, then username
  const patientName = patientData?.fullName ||
    (personalDetails ? `${personalDetails.firstName} ${personalDetails.lastName}` : null) ||
    (user?.username
      ? user.username.charAt(0).toUpperCase() + user.username.slice(1)
      : ct('patient'));

  // Build first / last name chips from personal details
  const pdFirstName = personalDetails?.firstName || '';
  const pdLastName  = personalDetails?.lastName  || '';
  const pdDob       = personalDetails?.dob       || '';
  const pdGender    = personalDetails?.gender    || '';
  const showPersonalStrip = !!(pdFirstName || pdLastName || pdDob || pdGender);

  // Salutation: prefer patientData sex, fall back to personalDetails gender
  const sex = patientData?.sex || personalDetails?.gender || '';
  const salutation = sex === 'Female' ? (lang === 'eu' ? 'Sra.' : lang === 'hi' ? 'श्रीमती' : 'Ms.') : sex === 'Male' ? (lang === 'eu' ? 'Sr.' : lang === 'hi' ? 'श्री' : 'Mr.') : '';

  const patientAgeRaw = patientData?.age
    ? parseInt(patientData.age)
    : (personalDetails?.age ? parseInt(personalDetails.age) : 32);
  const patientAge = lang === 'te' ? `${patientAgeRaw} సంవత్సరాలు` : lang === 'hi' ? `${patientAgeRaw} वर्ष` : lang === 'eu' ? `${patientAgeRaw} Años` : `${patientAgeRaw} Years Old`;
  const lastCheckup = patientData?.lastCheckupDate ? new Date(patientData.lastCheckupDate).toLocaleDateString() : (lang === 'te' ? '2 రోజుల క్రితం' : lang === 'hi' ? '2 दिन पहले' : lang === 'eu' ? 'Hace 2 días' : '2 Days ago');

  const getAvatarUrl = () => {
    const isFemale = sex === 'Female';
    if (patientAgeRaw < 12) {
      return isFemale ? '/avatars/child_girl.png' : '/avatars/child_boy.png';
    } else if (patientAgeRaw < 18) {
      return isFemale ? '/avatars/teen_girl.png' : '/avatars/teen_boy.png';
    } else {
      return isFemale ? '/avatars/adult_woman.png' : '/avatars/adult_man.png';
    }
  };

  const hour = currentTime.getHours();
  let timeColor = '';
  let timeIcon = '';
  if (hour < 12) {
    timeColor = 'linear-gradient(135deg, #fcd34d, #f59e0b)'; // morning
    timeIcon = '🌅';
  } else if (hour < 18) {
    timeColor = 'linear-gradient(135deg, #38bdf8, #0284c7)'; // afternoon
    timeIcon = '☀️';
  } else {
    timeColor = 'linear-gradient(135deg, #4c1d95, #1e1b4b)'; // night
    timeIcon = '🌙';
  }

  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const climateText = ct('climate');

  const localQuotes = ct('quotes');
  const dailyQuote = localQuotes[new Date().getDay() % localQuotes.length];

  const getWeeklyPerformanceData = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0: Sun, 1: Mon, ... 6: Sat
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + distanceToMonday);

    const labels = [
      { en: 'Mon', te: 'సోమ', hi: 'సోమ', eu: 'Lun', col: '#0ea5e9' },
      { en: 'Tue', te: 'మంగళ', hi: 'मंगल', eu: 'Mar', col: '#10b981' },
      { en: 'Wed', te: 'బుధ', hi: 'బుధ', eu: 'Mié', col: '#f59e0b' },
      { en: 'Thu', te: 'గురు', hi: 'गुरु', eu: 'Jue', col: '#8b5cf6' },
      { en: 'Fri', te: 'శుక్ర', hi: 'శుక్ర', eu: 'Vie', col: '#ec4899' },
      { en: 'Sat', te: 'శని', hi: 'శని', eu: 'Sáb', col: '#ef4444' },
      { en: 'Sun', te: 'ఆది', hi: 'రవి', eu: 'Dom', col: '#06b6d4' }
    ];

    const waterKey = user?.id ? `medivault_water_${user.id}` : 'medivault_water';
    const waterStore = JSON.parse(localStorage.getItem(waterKey) || '{}');
    const defaultTarget = waterStore.target || 2500;

    return labels.map((labelInfo, i) => {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      const entry = waterStore[dateKey] || waterStore.history?.[dateKey] || {};
      const waterDrank = entry.total || 0;
      const target = entry.target || defaultTarget;
      const val = target > 0 ? Math.min(100, Math.round((waterDrank / target) * 100)) : 0;

      return {
        day: lang === 'te' ? labelInfo.te : lang === 'hi' ? labelInfo.hi : lang === 'eu' ? labelInfo.eu : labelInfo.en,
        val,
        col: labelInfo.col
      };
    });
  };

  return (
    <div className="dash-main">
      {/* Top Header with Timing and Climate */}
      <div className="dash-top-timing" style={{ 
        background: timeColor, 
        padding: '1rem 2rem', 
        color: 'white', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '2px', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            {timeIcon} {timeString}
          </span>
          <span style={{ fontSize: '0.9rem', fontWeight: '500', opacity: 0.9, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{liveWeather.text}, {liveWeather.temp}°C</span>
            <span style={{ fontSize: '1.15rem', display: 'inline-flex', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>{liveWeather.symbol}</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Bell size={20} style={{ cursor: 'pointer' }} />
          <Settings size={20} style={{ cursor: 'pointer' }} onClick={() => navigate('/settings')} />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="dash-content">
        {/* Patient Header Banner */}
        <div className="dash-patient-banner">
          <div className="dash-patient-banner-inner">
            <div className="dash-patient-avatar-wrap">
              <div className="dash-patient-avatar-large" style={{ overflow: 'hidden', padding: 0 }}>
                <img src={getAvatarUrl()} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="dash-patient-status-dot" />
            </div>
            <div className="dash-patient-details">
              <div className="dash-patient-header-row">
                <h2 className="dash-patient-full-name">
                  {salutation && <span style={{ fontSize:'1rem', fontWeight:'600', opacity:0.85, marginRight:'4px' }}>{salutation}</span>}
                  {patientName}
                </h2>
                <span className="dash-patient-id-badge">{ct('patientId')}: #MV-{String(user?.id || 1).padStart(4, '0')}</span>
              </div>
              <div className="dash-patient-meta">
                <span className="dash-meta-chip">
                  <Calendar size={12} /> {patientAge}
                </span>
                {sex && (
                  <span className="dash-meta-chip" style={{
                    background: sex === 'Female' ? 'rgba(236,72,153,0.15)' : sex === 'Male' ? 'rgba(59,130,246,0.15)' : 'rgba(148,163,184,0.15)',
                    color: sex === 'Female' ? '#ec4899' : sex === 'Male' ? '#3b82f6' : '#94a3b8',
                    border: `1px solid ${sex === 'Female' ? 'rgba(236,72,153,0.3)' : sex === 'Male' ? 'rgba(59,130,246,0.3)' : 'rgba(148,163,184,0.3)'}`
                  }}>
                    {sex === 'Female' ? '♀ Female' : sex === 'Male' ? '♂ Male' : '⚧ ' + sex}
                  </span>
                )}
                <span className="dash-meta-chip">
                  <Heart size={12} /> {ct('cardiology')}
                </span>
                <span className="dash-meta-chip">
                  <Activity size={12} /> {ct('lastCheckup')}: {lastCheckup}
                </span>
                <span className="dash-active-badge">{ct('active')}</span>
              </div>

              {/* Personal Details Strip from modal — shown when personal details are saved */}
              {showPersonalStrip && (
                <div className="dash-personal-info-strip">
                  {pdFirstName && (
                    <div className="dash-personal-chip">
                      <span>👤</span>
                      <span>First Name: <strong>{pdFirstName}</strong></span>
                    </div>
                  )}
                  {pdFirstName && pdLastName && <div className="dash-personal-chip"><span className="dot" /></div>}
                  {pdLastName && (
                    <div className="dash-personal-chip">
                      <span>Last Name: <strong>{pdLastName}</strong></span>
                    </div>
                  )}
                  {pdDob && (
                    <>
                      <div className="dash-personal-chip"><span className="dot" /></div>
                      <div className="dash-personal-chip">
                        <span>🎂</span>
                        <span>DOB: <strong>{new Date(pdDob).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}</strong></span>
                      </div>
                    </>
                  )}
                  {pdGender && (
                    <>
                      <div className="dash-personal-chip"><span className="dot" /></div>
                      <div className="dash-personal-chip">
                        <span>{pdGender === 'Male' ? '♂' : pdGender === 'Female' ? '♀' : '⚧'}</span>
                        <span>Gender: <strong>{pdGender}</strong></span>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: '3px solid #10b981', display: 'inline-block' }}>
                <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontStyle: 'italic' }}>"{dailyQuote}"</span>
              </div>
            </div>
            <div className="dash-patient-actions">
              <button 
                className={`dash-sleep-btn ${isSleepActive ? 'active' : ''}`}
                onClick={handleToggleSleep}
                title={isSleepActive ? "Wake Up & Log Sleep" : "Start Tracking Sleep"}
              >
                <Moon size={14} fill={isSleepActive ? "#ffffff" : "none"} />
                <span>{isSleepActive ? ct('sleepActive') : ct('startSleep')}</span>
              </button>
              <div className="dash-edit-profile-row">
                <button className="dash-edit-btn" onClick={() => navigate('/patient-info')}>
                  <Edit3 size={14} /> {ct('editProfile')}
                </button>
                <button className="dash-more-btn"><MoreVertical size={16} /></button>
              </div>
            </div>
          </div>
          {/* Decorative gradient orb */}
          <div className="dash-banner-orb" />
        </div>


        {/* Bottom Row: Lifestyle Insights + AI Insights + Clinical Notes */}
        <div className="dash-bottom-row">
          {/* Lifestyle Insights */}
          <div className="dash-card" style={{ background: 'linear-gradient(145deg, var(--surface), rgba(14, 165, 233, 0.05))', borderTop: '4px solid #0ea5e9' }}>
            <div className="dash-card-header">
              <span className="dash-card-title">{ct('lifestyleInsights')}</span>
            </div>
            <div className="dash-lifestyle-list">
              {[
                { icon: <Droplets size={16} />, label: ct('waterIntake'), val: lifestyleStats.water.text, color: '#06b6d4', pct: lifestyleStats.water.pct },
                { icon: <Utensils size={16} />, label: ct('dietScore'), val: lifestyleStats.diet.text, color: '#10b981', pct: lifestyleStats.diet.pct },
                { icon: <Dumbbell size={16} />, label: ct('exercise'), val: lifestyleStats.exercise.text, color: '#8b5cf6', pct: lifestyleStats.exercise.pct },
                { icon: <Brain size={16} />, label: ct('yogaStreaks'), val: `${yogaStreaks} ${ct('daysFire')}`, color: '#ec4899', pct: Math.min((yogaStreaks/30)*100, 100) },
                { icon: <Moon size={16} />, label: ct('sleepTracker') || 'Sleep Tracker', val: lifestyleStats.sleep.text, color: '#6366f1', pct: lifestyleStats.sleep.pct, isSleep: true },
              ].map((item, i) => (
                <div key={i} className="dash-lifestyle-item" style={{ background: 'var(--bg-color)', padding: '10px', borderRadius: '10px', marginBottom: '8px', borderLeft: `3px solid ${item.color}` }}>
                  <div className="dash-lifestyle-icon" style={{ color: item.color, background: `${item.color}1a` }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="dash-lifestyle-row">
                      <span className="dash-lifestyle-label">{item.label}</span>
                      <span className="dash-lifestyle-val" style={{ fontWeight: '600' }}>{item.val}</span>
                    </div>
                    <div className="dash-lifestyle-bar">
                      <div className="dash-lifestyle-bar-fill" style={{ width: `${item.pct}%`, background: `linear-gradient(90deg, ${item.color}88, ${item.color})`, boxShadow: `0 0 8px ${item.color}88` }} />
                    </div>
                    {item.isSleep && (
                      <div className="sleep-weekly-graph-container" style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {ct('weeklySleepTrend')}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px', alignItems: 'flex-end', height: '65px', padding: '4px 0' }}>
                          {getWeeklySleepData().map((s, idx) => (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '2px' }}>
                              <span style={{ fontSize: '0.55rem', color: s.col, fontWeight: '800' }}>{s.hours > 0 ? `${s.hours.toFixed(1)}h` : '0h'}</span>
                              <div style={{ width: '100%', height: '40px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ width: '100%', height: `${s.val}%`, background: `linear-gradient(180deg, ${s.col}, ${s.col}66)`, borderRadius: '2px 2px 0 0', transition: 'height 0.6s ease', boxShadow: `0 0 6px ${s.col}44` }} />
                              </div>
                              <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: '600' }}>{s.day}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overall Performance */}
          <div className="dash-card dash-card--performance" style={{ display: 'flex', flexDirection: 'column', background: 'linear-gradient(145deg, var(--surface), rgba(236, 72, 153, 0.05))', borderTop: '4px solid #ec4899' }}>
            <div className="dash-card-header" style={{ justifyContent: 'center', marginBottom: 0 }}>
              <span className="dash-card-title">{ct('weeklyPerformance')}</span>
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: '1rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Flame size={28} style={{ color: '#f97316', filter: 'drop-shadow(0 0 8px rgba(249,115,22,0.5))' }} />
                <div style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--text-main)', lineHeight: '1' }}>{yogaStreaks}</div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px', fontWeight: 'bold' }}>{ct('daysStreak')} 🔥</div>
              {/* Streak dots */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '8px' }}>
                {getRecentStreakDays(user, 7).map((d, i) => (
                  <div key={i} title={`${d.dayName}: ${d.isCompleted ? 'Completed 🔥' : 'No Activity'}`} style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: d.isCompleted ? 'linear-gradient(135deg, #f97316, #ef4444)' : 'var(--border)',
                    boxShadow: d.isCompleted ? '0 0 6px rgba(249,115,22,0.6)' : 'none',
                    border: d.isToday ? '1px solid #f97316' : 'none'
                  }} />
                ))}
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '6px' }}>
              {getWeeklyPerformanceData().map((item, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '4px' }}>
                  <span style={{ fontSize: '0.6rem', color: item.col, fontWeight: '800' }}>{item.val}%</span>
                  <div style={{ width: '100%', height: '80px', background: 'var(--bg-color)', borderRadius: '6px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ width: '100%', height: `${item.val}%`, background: `linear-gradient(180deg, ${item.col}, ${item.col}66)`, borderRadius: '4px 4px 0 0', transition: 'height 0.6s ease', boxShadow: `0 0 8px ${item.col}55` }} />
                  </div>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>{item.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Notes */}
          <div className="dash-card" style={{ background: 'linear-gradient(145deg, var(--surface), rgba(16, 185, 129, 0.05))', borderTop: '4px solid #10b981' }}>
            <div className="dash-card-header">
              <span className="dash-card-title">{ct('clinicalNotes')}</span>
              <button className="dash-add-note-btn" onClick={() => setShowNoteModal(true)}>
                <span>+</span>
              </button>
            </div>
            <div className="dash-notes-list">
              {clinicalNotes.map((n) => (
                <div key={n.id} className="dash-note-item" style={{ borderLeft: '3px solid #10b981', background: 'var(--bg-color)', padding: '12px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                  <div className="dash-note-date" style={{ color: '#10b981' }}>{n.date}</div>
                  <div className="dash-note-text">{n.note}</div>
                  <div className="dash-note-doctor">— {n.doctor}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Access Grid */}
        <div className="dash-quick-section">
          <h3 className="dash-section-title">{ct('quickAccess')}</h3>
          <div className="dash-quick-grid">
            {quickActions.map(({ label, path, icon: Icon, color }) => (
              <Link key={path} to={path} className="dash-quick-card">
                <div className="dash-quick-icon" style={{ background: `${color}22`, color }}>
                  <Icon size={20} />
                </div>
                <span className="dash-quick-label">{label}</span>
                <ChevronRight size={14} className="dash-quick-arrow" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Clinical Note Modal */}
      {showNoteModal && (
        <div className="dash-modal-overlay" onClick={() => setShowNoteModal(false)}>
          <div className="dash-modal" onClick={e => e.stopPropagation()}>
            <div className="dash-modal-header">
              <h3><FileText size={18} /> {ct('addClinicalNote')}</h3>
              <button className="dash-modal-close" onClick={() => setShowNoteModal(false)}><X size={20} /></button>
            </div>
            <div className="dash-modal-body">
              <label className="dash-modal-label">{ct('doctorAuthor')}</label>
              <input
                type="text"
                className="dash-modal-input"
                placeholder="Dr. Sterling"
                value={newDoctorName}
                onChange={e => setNewDoctorName(e.target.value)}
                style={{ marginBottom: '16px' }}
              />
              <label className="dash-modal-label">{ct('notes')}</label>
              <textarea
                className="dash-modal-textarea"
                placeholder={ct('writeNotesPl')}
                value={newNoteText}
                onChange={e => setNewNoteText(e.target.value)}
                autoFocus
              />
            </div>
            <div className="dash-modal-footer">
              <button className="dash-btn-cancel" onClick={() => setShowNoteModal(false)}>{ct('cancel')}</button>
              <button className="dash-btn-save" onClick={handleAddNote}>{ct('saveNote')}</button>
            </div>
          </div>
        </div>
      )}
      <SectionAbout
        title={lang === 'te' ? 'డాష్‌బోర్డ్' : lang === 'hi' ? 'डैशबोर्ड' : lang === 'eu' ? 'Panel de Control' : 'Dashboard'}
        icon="📊"
        color="#0ea5e9"
        gradient="linear-gradient(135deg, #0ea5e9, #6366f1)"
        what={ct('aboutWhat')}
        howToUse={ct('aboutHow')}
        importance={ct('aboutWhy')}
        style={{ position: 'absolute', bottom: '2rem', right: '2rem', top: 'auto' }}
      />

    </div>
  );
}
