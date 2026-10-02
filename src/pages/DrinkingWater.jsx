import { useState, useEffect, useRef, useCallback } from 'react';
import { Droplets, Plus, Bell, BellOff, Target, Clock, Calculator, History, BarChart2, X, Check, Volume2, Trash2, ChevronDown, ChevronUp, Flame } from 'lucide-react';
import './DrinkingWater.css';
import { syncWaterRemindersToSW, requestNotificationPermission, registerSoundCallback } from '../services/swManager';
import { syncRemindersToFirestore } from '../services/notificationManager';
import SectionAbout from '../components/SectionAbout';
import { useLanguage } from '../contexts/LanguageContext';
import { recordDailyActivity } from '../utils/streakHelper';

const JUICE_TRANSLATIONS = {
  en: {
    Pomegranate: 'Pomegranate',
    Orange: 'Orange',
    Apple: 'Apple',
    Grape: 'Grape',
    Watermelon: 'Watermelon',
    Pineapple: 'Pineapple',
    Guava: 'Guava',
    Mango: 'Mango',
    'Lemon/Lime': 'Lemon/Lime',
    'Coconut water': 'Coconut water',
    Beetroot: 'Beetroot',
    Cranberry: 'Cranberry',
    Tomato: 'Tomato',
    Grapefruit: 'Grapefruit',
    Papaya: 'Papaya',
    Pear: 'Pear',
    Kiwi: 'Kiwi',
    Muskmelon: 'Muskmelon',
    Apricot: 'Apricot',
    'Fig (Anjeer)': 'Fig (Anjeer)',
    Prune: 'Prune',
    'Passion fruit': 'Passion fruit',
    Amla: 'Amla',
    Carrot: 'Carrot',
    Lychee: 'Lychee',
    'Mixed fruit': 'Mixed fruit',
    Sugarcane: 'Sugarcane',
    Peach: 'Peach',
    Cherry: 'Cherry',
    Strawberry: 'Strawberry',
    electrolytes: 'Electrolytes',
    uses: 'Uses',
    kcal: 'kcal',
    protein: 'Protein',
    benefits: 'Benefits',
    addToday: '+ 250ml Today',
    addedToWater: 'Added to water logs!',
    highPotassiumStar: 'High potassium ⭐',
    highPotassiumVitCStar: 'High potassium, Vit C ⭐',
    lowPotassium: 'Low potassium',
    moderatePotassium: 'Moderate potassium',
    highPotassiumMgStar: 'High potassium, Mg ⭐',
    veryHighElectrolytesStar: 'Very high electrolytes ⭐⭐⭐',
    veryHighVitCStar: 'Very high Vit C ⭐',
    veryHighPotassiumStar: 'Very high potassium ⭐⭐',
    electrolytesStar: 'Electrolytes ⭐',
    varies: 'Varies',
    potassium: 'Potassium',
    heartHealth: 'Heart health, antioxidant',
    heartHealthOnly: 'Heart health',
    immunityHydration: 'Immunity, hydration',
    immunity: 'Immunity',
    digestionHydration: 'Digestion, hydration',
    energyBoost: 'Energy boost',
    coolingHydration: 'Cooling, hydration',
    digestion: 'Digestion',
    detoxHydration: 'Detox, hydration',
    bestRehydration: 'Best rehydration',
    bpControl: 'BP control',
    utiSupport: 'UTI support',
    metabolism: 'Metabolism',
    energy: 'Energy',
    hydration: 'Hydration',
    eyeHealth: 'Eye health',
    constipation: 'Constipation',
    quickEnergy: 'Quick energy',
    skin: 'Skin',
    antiInflammatory: 'Anti-inflammatory',
  },
  te: {
    Pomegranate: 'దానిమ్మ',
    Orange: 'నారింజ',
    Apple: 'యాపిల్',
    Grape: 'ద్రాక్ష',
    Watermelon: 'పుచ్చకాయ',
    Pineapple: 'అనాస పండు',
    Guava: 'జామకాయ',
    Mango: 'మామిడి',
    'Lemon/Lime': 'నిమ్మకాయ',
    'Coconut water': 'కొబ్బరి నీళ్లు',
    Beetroot: 'బీట్‌రూట్',
    Cranberry: 'క్రాన్‌బెర్రీ',
    Tomato: 'టమోటా',
    Grapefruit: 'పంపర పనస',
    Papaya: 'బొప్పాయి',
    Pear: 'బేరిపండు',
    Kiwi: 'కివి',
    Muskmelon: 'కర్బూజా',
    Apricot: 'ఆప్రికాట్',
    'Fig (Anjeer)': 'అంజూరపు పండు',
    Prune: 'ఎండు ద్రాక్ష',
    'Passion fruit': 'ప్యాషన్ ఫ్రూట్',
    Amla: 'ఉసిరికాయ',
    Carrot: 'క్యారెట్',
    Lychee: 'లిచీ',
    'Mixed fruit': 'మిశ్రమ పండ్లు',
    Sugarcane: 'చెరకు రసం',
    Peach: 'పీచ్',
    Cherry: 'చెర్రీ',
    Strawberry: 'స్ట్రాబెర్రీ',
    electrolytes: 'ఎలక్ట్రోలైట్లు',
    uses: 'ఉపయోగాలు',
    kcal: 'కిలో క్యాలరీలు',
    protein: 'ప్రోటీన్',
    benefits: 'ప్రయోజనాలు',
    addToday: '+ 250మిలీ ఈరోజు',
    addedToWater: 'నీటి లాగ్‌లకు జోడించబడింది!',
    highPotassiumStar: 'ఎక్కువ పొటాషియం ⭐',
    highPotassiumVitCStar: 'ఎక్కువ పొటాషియం, విటమిన్ సి ⭐',
    lowPotassium: 'తక్కువ పొటాషియం',
    moderatePotassium: 'మధ్యస్థ పొటాషియం',
    highPotassiumMgStar: 'ఎక్కువ పొటాషియం, మెగ్నీషియం ⭐',
    veryHighElectrolytesStar: 'చాలా ఎక్కువ ఎలక్ట్రోలైట్లు ⭐⭐⭐',
    veryHighVitCStar: 'చాలా ఎక్కువ విటమిన్ సి ⭐',
    veryHighPotassiumStar: 'చాలా ఎక్కువ పొటాషియం ⭐⭐',
    electrolytesStar: 'ఎలక్ట్రోలైట్లు ⭐',
    varies: 'మారుతూ ఉంటుంది',
    potassium: 'పొటాషియం',
    heartHealth: 'గుండె ఆరోగ్యం, యాంటీఆక్సిడెంట్',
    heartHealthOnly: 'గుండె ఆరోగ్యం',
    immunityHydration: 'రోగనిరోధక శక్తి, హైడ్రేషన్',
    immunity: 'రోగనిరోధక శక్తి',
    digestionHydration: 'జీర్ణక్రియ, హైడ్రేషన్',
    energyBoost: 'శక్తి బూస్ట్',
    coolingHydration: 'చల్లదనం, హైడ్రేషన్',
    digestion: 'జీర్ణక్రియ',
    detoxHydration: 'టాక్సిన్ తొలగింపు, హైడ్రేషన్',
    bestRehydration: 'ఉత్తమ రీహైడ్రేషన్',
    bpControl: 'బీపీ నియంత్రణ',
    utiSupport: 'యుటిఐ మద్దతు',
    metabolism: 'జీవక్రియ',
    energy: 'శక్తి',
    hydration: 'హైడ్రేషన్',
    eyeHealth: 'కంటి ఆరోగ్యం',
    constipation: 'మలబద్ధకం',
    quickEnergy: 'శీఘ్ర శక్తి',
    skin: 'చర్మం',
    antiInflammatory: 'యాంటీ ఇన్ఫ్లమేటరీ',
  },
  hi: {
    Pomegranate: 'अनार',
    Orange: 'संतरा',
    Apple: 'सेब',
    Grape: 'अंगूर',
    Watermelon: 'तरबूज',
    Pineapple: 'अनानास',
    Guava: 'अमरूद',
    Mango: 'आम',
    'Lemon/Lime': 'नींबू',
    'Coconut water': 'नारियल पानी',
    Beetroot: 'चुकंदर',
    Cranberry: 'क्रैनबेरी',
    Tomato: 'टमाटर',
    Grapefruit: 'चकूतरा',
    Papaya: 'पपीता',
    Pear: 'नाशपाती',
    Kiwi: 'कीवी',
    Muskmelon: 'खरबूजा',
    Apricot: 'खुबानी',
    'Fig (Anjeer)': 'अंजीर',
    Prune: 'सूखा आलूबुखारा',
    'Passion fruit': 'कृष्णा फल',
    Amla: 'आंवला',
    Carrot: 'गाजर',
    Lychee: 'लीची',
    'Mixed fruit': 'मिश्रित फल',
    Sugarcane: 'गन्ने का रस',
    Peach: 'आड़ू',
    Cherry: 'चेरी',
    Strawberry: 'स्ट्रॉबेरी',
    electrolytes: 'इलेक्ट्रोलाइट्स',
    uses: 'उपयोग',
    kcal: 'किलो कैलोरी',
    protein: 'प्रोटीन',
    benefits: 'लाभ',
    addToday: '+ 250 मिली आज',
    addedToWater: 'पानी के लॉग में जोड़ा गया!',
    highPotassiumStar: 'उच्च पोटैशियम ⭐',
    highPotassiumVitCStar: 'उच्च पोटैशियम, विटामिन सी ⭐',
    lowPotassium: 'कम पोटैशियम',
    moderatePotassium: 'मध्यम पोटैशियम',
    highPotassiumMgStar: 'उच्च पोटैशियम, मैग्नीशियम ⭐',
    veryHighElectrolytesStar: 'बहुत उच्च इलेक्ट्रोलाइट्स ⭐⭐⭐',
    veryHighVitCStar: 'बहुत उच्च विटामिन सी ⭐',
    veryHighPotassiumStar: 'बहुत उच्च पोटैशियम ⭐⭐',
    electrolytesStar: 'इलेक्ट्रोलाइट्स ⭐',
    varies: 'भिन्न होता है',
    potassium: 'पोटैशियम',
    heartHealth: 'हृदय स्वास्थ्य, एंटीऑक्सीडेंट',
    heartHealthOnly: 'हृदय स्वास्थ्य',
    immunityHydration: 'प्रतिरक्षा, जलयोजन',
    immunity: 'प्रतिरक्षा',
    digestionHydration: 'पाचन, जलयोजन',
    energyBoost: 'ऊर्जा बूस्ट',
    coolingHydration: 'शीतलन, जलयोजन',
    digestion: 'पाचन',
    detoxHydration: 'डिटॉक्स, जलयोजन',
    bestRehydration: 'सर्वश्रेष्ठ जलयोजन',
    bpControl: 'बीपी नियंत्रण',
    utiSupport: 'यूटीआई सहायता',
    metabolism: 'चयापचय',
    energy: 'ऊर्जा',
    hydration: 'जलयोजन',
    eyeHealth: 'आंखों का स्वास्थ्य',
    constipation: 'कब्ज',
    quickEnergy: 'त्वरित ऊर्जा',
    skin: 'त्वचा',
    antiInflammatory: 'विरोधी भड़काऊ',
  },
  eu: {
    Pomegranate: 'Granada',
    Orange: 'Naranja',
    Apple: 'Manzana',
    Grape: 'Uva',
    Watermelon: 'Sandía',
    Pineapple: 'Piña',
    Guava: 'Guayaba',
    Mango: 'Mango',
    'Lemon/Lime': 'Limón/Lima',
    'Coconut water': 'Agua de coco',
    Beetroot: 'Remolacha',
    Cranberry: 'Arándano',
    Tomato: 'Tomate',
    Grapefruit: 'Pomelo',
    Papaya: 'Papaya',
    Pear: 'Pera',
    Kiwi: 'Kiwi',
    Muskmelon: 'Melón',
    Apricot: 'Albaricoque',
    'Fig (Anjeer)': 'Higo',
    Prune: 'Ciruela pasa',
    'Passion fruit': 'Maracuyá',
    Amla: 'Amla',
    Carrot: 'Zanahoria',
    Lychee: 'Lichi',
    'Mixed fruit': 'Fruta mixta',
    Sugarcane: 'Zumo de caña',
    Peach: 'Melocotón',
    Cherry: 'Cereza',
    Strawberry: 'Fresa',
    electrolytes: 'Electrolitos',
    uses: 'Usos',
    kcal: 'kcal',
    protein: 'Proteína',
    benefits: 'Beneficios',
    addToday: '+ 250ml Hoy',
    addedToWater: '¡Añadido a los registros!',
    highPotassiumStar: 'Alto potasio ⭐',
    highPotassiumVitCStar: 'Alto potasio, Vit C ⭐',
    lowPotassium: 'Bajo potasio',
    moderatePotassium: 'Potasio moderado',
    highPotassiumMgStar: 'Alto potasio, Mg ⭐',
    veryHighElectrolytesStar: 'Electrolitos muy altos ⭐⭐⭐',
    veryHighVitCStar: 'Vit C muy alta ⭐',
    veryHighPotassiumStar: 'Potasio muy alto ⭐⭐',
    electrolytesStar: 'Electrolitos ⭐',
    varies: 'Varía',
    potassium: 'Potasio',
    heartHealth: 'Salud del corazón, antioxidante',
    heartHealthOnly: 'Salud del corazón',
    immunityHydration: 'Inmunidad, hidratación',
    immunity: 'Inmunidad',
    digestionHydration: 'Digestión, hidratación',
    energyBoost: 'Aumento de energía',
    coolingHydration: 'Enfriamiento, hidratación',
    digestion: 'Digestión',
    detoxHydration: 'Desintoxicación, hidratación',
    bestRehydration: 'Mejor rehidratación',
    bpControl: 'Control de la presión arterial',
    utiSupport: 'Soporte para ITU',
    metabolism: 'Metabolismo',
    energy: 'Energía',
    hydration: 'Hidratación',
    eyeHealth: 'Salud ocular',
    constipation: 'Estreñimiento',
    quickEnergy: 'Energía rápida',
    skin: 'Piel',
    antiInflammatory: 'Antiinflamatorio',
  }
};

const DRINKING_WATER_T = {
  en: {
    active: 'Active',
    drinkingWater: 'Drinking Water',
    subtitle: 'Stay hydrated · Track your daily intake',
    remindersOn: 'Reminders ON',
    remindersOff: 'Reminders OFF',
    remToggleOnTitle: 'Reminders ON — Click to disable',
    remToggleOffTitle: 'Enable Reminders',
    addTarget: 'Add Target',
    tabToday: 'Today',
    tabReminders: 'Reminders',
    tabHistory: 'History',
    tabCalculator: 'Hydration Calculator',
    tabJuices: 'Fruit Juices',
    drankToday: 'Drank Today',
    remaining: 'Remaining',
    dailyTarget: 'Daily Target',
    editBtn: '✏ Edit',
    dayStreak: 'Day Streak',
    decreaseTitle: 'Decrease by 50ml',
    increaseTitle: 'Increase by 50ml',
    save: 'Save',
    cancel: 'Cancel',
    ml: 'ml',
    liters: 'L',
    dailyGoalAchieved: '🎉 Daily Goal Achieved!',
    nextReminder: 'Next reminder:',
    custom: 'Custom',
    logCustomAmount: 'Log Custom Amount',
    todayLogTitle: "Today's Intake Log",
    entries: 'entries',
    noWaterLogged: 'No water logged yet today.',
    tapQuickAdd: 'Tap a quick-add button to get started!',
    removeEntry: 'Remove entry',
    water: 'Water',
    hydrationReminders: 'Hydration Reminders',
    remindersDesc: 'Receive instant alerts on your desktop/mobile to keep drinking water. Turn the main switch ON in the header to activate.',
    currentSchedule: 'Current Schedule',
    noReminders: 'No reminders set.',
    addOneBelow: 'Add one below to get started!',
    remindersInactiveAlert: 'Reminders are currently OFF. Set reminders will not fire.',
    remindersActiveAlert: 'Reminders are active.',
    addReminderTime: 'Add Reminder Time',
    testNotifBtn: 'Test Notification & Sound',
    soundVolume: 'Sound Volume',
    deleteReminder: 'Delete reminder',
    hydrationHistory: 'Hydration History',
    historyDesc: 'Analyze your water intake patterns over the past 14 days. Green checks indicate days you met your target.',
    daysTargetMet: 'Days Target Met',
    totalFluidDrank: 'Total Fluid Drank',
    dailyAverage: 'Daily Average',
    fourteenDayHistory: '14-Day History Log',
    smartCalculator: 'Smart Hydration Calculator',
    calcDesc: 'Enter your body weight to get your personalized daily water intake and best fruit juice recommendations for electrolytes.',
    bodyWeight: 'Your Body Weight',
    calcNow: 'Calculate Now',
    waterIntakeGoal: '1. Water Intake Goal',
    perDay: 'per day',
    basedOn: 'Based on',
    basedOnDesc: 'body weight × 35 ml/kg (standard hydration recommendation).',
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    setAsDailyTarget: 'Set as My Daily Target',
    recommendedJuices: '🍹 2. Recommended Juices for Electrolytes',
    recommendedJuicesDesc: 'For a {weight}kg body weight, these juices provide the best hydration and electrolyte balance.',
    add250ml: 'Add 250ml',
    quickReference: 'Quick Reference',
    weightKg: 'Weight (kg)',
    dailyWaterL: 'Daily Water (L)',
    dailyWaterMl: 'Daily Water (ml)',
    compJuiceGuide: '🌊 Comprehensive Fruit Juice Guide',
    compJuiceGuideDesc: 'Discover the nutritional value and hydrating benefits of various fruit juices. Add them to your daily intake log.',
    sNo: 'S.No',
    fruitJuice: 'Fruit Juice',
    energyKcal: 'Energy (Kcal)',
    proteinG: 'Protein (g)',
    electroApprox: 'Electrolytes (Approx)',
    topUses: 'Top Uses / Benefits',
    action: 'Action',
    setWaterTarget: 'Set Daily Water Target',
    targetAmount: 'Target Amount (ml)',
    setTarget: 'Set Target',
    logWater: 'Log Water',
    addWaterReminder: 'Add Water Reminder',
    selectTime: 'Select Time',
    reminderTip: 'Tip: Add reminders every 40 minutes between your wake-up and bedtime.',
    quickSchedule: 'Quick 40-min Schedule (6AM–10PM)',
    aboutWhat: 'Drinking Water is a complete hydration management system that tracks your daily water intake in real time, shows your progress with a visual water bottle, provides smart hydration reminders, logs drink history for 30 days, calculates your personalized daily water target based on body weight, and includes a comprehensive fruit juice guide with nutritional data.',
    aboutHow: [
      'Click the quick-add buttons (+150ml, +200ml, +250ml, +350ml, +500ml) to log water after drinking.',
      'Click "+Custom" to log any specific amount of water or juice in milliliters.',
      'Watch the animated water bottle fill up as you log your intake throughout the day.',
      'Click "Edit" on the Daily Target stat to directly adjust your water goal in-line.',
      'Or click "Add Target" in the header and choose from preset values (1.5L, 2L, 2.5L, 3L).',
      'Switch to the "Reminders" tab to add custom notification times for water drinking.',
      'Toggle the Reminders ON/OFF switch to enable or disable all water reminders.',
      'Click "Add Time" to set specific times for reminders (e.g., every 40 minutes).',
      'Test if notifications work by pressing the "Test Notification & Sound" button.',
      'Switch to "History" tab to see a bar chart of your water intake over the past 14 days.',
      'Open the "Hydration Calculator" tab and enter your body weight to get personalized targets.',
      'Click "Set as My Daily Target" from the calculator results to apply it automatically.',
      'Visit the "Fruit Juices" tab to browse 20+ juices with calories, electrolytes, and benefits.',
      'Click "+ 250ml Today" on any juice to count that juice toward your daily water intake.'
    ],
    aboutWhy: [
      'Water is essential for every biological function — digestion, circulation, and temperature regulation.',
      'Dehydration by even 2% can reduce mental performance, focus, and physical energy.',
      'Proper hydration is critical for patients with kidney disease, UTIs, or diabetes.',
      'The daily streak feature motivates consistent hydration habits over time.',
      'Personalized targets based on body weight are more accurate than the generic 8-glass rule.',
      'Timed reminders are proven to increase daily water intake in people who forget to drink.',
      'The fruit juice guide helps you choose hydrating beverages with the best electrolyte content.',
      'Visual progress (bottle animation) provides instant feedback and motivation to drink more.',
      'Logging all intake including juices gives a more complete picture of total fluid intake.',
      'Historical charts help you identify days when hydration consistently falls short.',
      'Background reminders ensure you receive alerts even when MediVault is in the background.',
      'Adequate hydration prevents headaches, fatigue, constipation, and skin dryness.'
    ]
  },
  te: {
    active: 'యాక్టివ్',
    drinkingWater: 'త్రాగునీరు',
    subtitle: 'హైడ్రేటెడ్‌గా ఉండండి · మీ రోజువారీ వినియోగాన్ని ట్రాక్ చేయండి',
    remindersOn: 'రిమైండర్‌లు ఆన్',
    remindersOff: 'రిమైండర్‌లు ఆఫ్',
    remToggleOnTitle: 'రిమైండర్‌లు ఆన్ — నిలిపివేయడానికి క్లిక్ చేయండి',
    remToggleOffTitle: 'రిమైండర్‌లను ప్రారంభించండి',
    addTarget: 'లక్ష్యాన్ని జోడించు',
    tabToday: 'ఈరోజు',
    tabReminders: 'రిమైండర్‌లు',
    tabHistory: 'చరిత్ర',
    tabCalculator: 'హైడ్రేషన్ క్యాలిక్యులేటర్',
    tabJuices: 'పండ్ల రసాలు',
    drankToday: 'ఈరోజు త్రాగినవి',
    remaining: 'మిగిలి ఉన్నవి',
    dailyTarget: 'రోజువారీ లక్ష్యం',
    editBtn: '✏ సవరించు',
    dayStreak: 'రోజుల స్ట్రీక్',
    decreaseTitle: '50మిలీ తగ్గించండి',
    increaseTitle: '50మిలీ పెంచండి',
    save: 'సేవ్ చేయి',
    cancel: 'రద్దు చేయి',
    ml: 'మిలీ',
    liters: 'లీటర్లు',
    dailyGoalAchieved: '🎉 రోజువారీ లక్ష్యం సాధించబడింది!',
    nextReminder: 'తదుపరి రిమైండర్:',
    custom: 'అనుకూల',
    logCustomAmount: 'అనుకూల పరిమాణాన్ని నమోదు చేయండి',
    todayLogTitle: 'ఈరోజు వినియోగ లాగ్',
    entries: 'నమోదులు',
    noWaterLogged: 'ఈరోజు ఇంకా నీటి లాగ్ ఏదీ లేదు.',
    tapQuickAdd: 'ప్రారంభించడానికి త్వరిత-జోడింపు బటన్‌ను నొక్కండి!',
    removeEntry: 'నమోదును తొలగించండి',
    water: 'నీరు',
    hydrationReminders: 'హైడ్రేషన్ రిమైండర్‌లు',
    remindersDesc: 'నీరు త్రాగడానికి మీ డెస్క్‌టాప్/మొబైల్‌లో తక్షణ హెచ్చరికలను స్వీకరించండి. సక్రియం చేయడానికి హెడర్‌లోని ప్రధాన స్విచ్‌ను ఆన్ చేయండి.',
    currentSchedule: 'ప్రస్తుత షెడ్యూల్',
    noReminders: 'రిమైండర్‌లు ఏవీ సెట్ చేయలేదు.',
    addOneBelow: 'ప్రారంభించడానికి దిగువన ఒకదాన్ని జోడించండి!',
    remindersInactiveAlert: 'రిమైండర్‌లు ప్రస్తుతం ఆఫ్‌లో ఉన్నాయి. సెట్ చేసిన రిమైండర్‌లు పని చేయవు.',
    remindersActiveAlert: 'రిమైండర్‌లు సక్రియంగా ఉన్నాయి.',
    addReminderTime: 'రిమైండర్ సమయాన్ని జోడించు',
    testNotifBtn: 'నోటిఫికేషన్ & సౌండ్‌ని పరీక్షించండి',
    soundVolume: 'ధ్వని పరిమాణం',
    deleteReminder: 'రిమైండర్‌ను తొలగించండి',
    hydrationHistory: 'హైడ్రేషన్ చరిత్ర',
    historyDesc: 'గత 14 రోజులలో మీ నీటి వినియోగ నమూనాలను విశ్లేషించండి. ఆకుపచ్చ టిక్‌లు మీ లక్ష్యాన్ని చేరుకున్న రోజులను సూచిస్తాయి.',
    daysTargetMet: 'లక్ష్యం చేరిన రోజులు',
    totalFluidDrank: 'మొత్తం త్రాగిన ద్రవం',
    dailyAverage: 'రోజువారీ సగటు',
    fourteenDayHistory: '14-రోజుల చరిత్ర లాగ్',
    smartCalculator: 'స్మార్ట్ హైడ్రేషన్ క్యాలిక్యులేటర్',
    calcDesc: 'మీ శరీర బరువు ఆధారంగా మీ వ్యక్తిగతీకరించిన రోజువారీ నీటి వినియోగం మరియు ఎలక్ట్రోలైట్ల కోసం ఉత్తమమైన పండ్ల రసాల సిఫార్సులను పొందండి.',
    bodyWeight: 'మీ శరీర బరువు',
    calcNow: 'ఇప్పుడే లెక్కించండి',
    waterIntakeGoal: '1. నీటి వినియోగ లక్ష్యం',
    perDay: 'రోజుకు',
    basedOn: 'ఆధారంగా',
    basedOnDesc: 'శరీర బరువు × 35 మిలీ/కేజీ (ప్రామాణిక హైడ్రేషన్ సిఫార్సు).',
    morning: 'ఉదయం',
    afternoon: 'మధ్యాహ్నం',
    evening: 'సాయంత్రం',
    setAsDailyTarget: 'నా రోజువారీ లక్ష్యంగా సెట్ చేయి',
    recommendedJuices: '🍹 2. ఎలక్ట్రోలైట్ల కోసం సిఫార్సు చేయబడిన రసాలు',
    recommendedJuicesDesc: '{weight}కేజీ శరీర బరువుకు, ఈ రసాలు ఉత్తమ హైడ్రేషన్ మరియు ఎలక్ట్రోలైట్ సమతుల్యతను అందిస్తాయి.',
    add250ml: '250మిలీ జోడించు',
    quickReference: 'త్వరిత సూచన',
    weightKg: 'బరువు (కేజీ)',
    dailyWaterL: 'రోజువారీ నీరు (లీటర్లు)',
    dailyWaterMl: 'రోజువారీ నీరు (మిలీ)',
    compJuiceGuide: '🌊 సమగ్ర పండ్ల రసం గైడ్',
    compJuiceGuideDesc: 'వివిధ పండ్ల రసాల పోషక విలువలు మరియు హైడ్రేటింగ్ ప్రయోజనాలను కనుగొనండి. వాటిని మీ రోజువారీ వినియోగ లాగ్‌కు జోడించండి.',
    sNo: 'క్రమ సంఖ్య',
    fruitJuice: 'పండ్ల రసం',
    energyKcal: 'శక్తి (కిలో క్యాలరీలు)',
    proteinG: 'ప్రోటీన్ (గ్రా)',
    electroApprox: 'ఎలక్ట్రోలైట్లు (సుమారు)',
    topUses: 'ప్రధాన ఉపయోగాలు / ప్రయోజనాలు',
    action: 'చర్య',
    setWaterTarget: 'రోజువారీ నీటి లక్ష్యాన్ని సెట్ చేయండి',
    targetAmount: 'లక్ష్య పరిమాణం (మిలీ)',
    setTarget: 'లక్ష్యాన్ని సెట్ చేయి',
    logWater: 'నీటిని నమోదు చేయి',
    addWaterReminder: 'నీటి రిమైండర్‌ను జోడించు',
    selectTime: 'సమయాన్ని ఎంచుకోండి',
    reminderTip: 'చిట్కా: మీరు మేల్కొనే సమయం మరియు పడుకునే సమయం మధ్య ప్రతి 40 నిమిషాలకు రిమైండర్‌లను జోడించండి.',
    quickSchedule: 'త్వరిత 40-నిమిషాల షెడ్యూల్ (ఉదయం 6 - రాత్రి 10)',
    aboutWhat: 'త్రాగునీరు అనేది ఒక సమగ్ర హైడ్రేషన్ నిర్వహణ వ్యవస్థ, ఇది మీ రోజువారీ నీటి వినియోగాన్ని నిజ సమయంలో ట్రాక్ చేస్తుంది, దృశ్య నీటి సీసాతో మీ పురోగతిని చూపుతుంది, స్మార్ట్ హైడ్రేషన్ రిమైండర్‌లను అందిస్తుంది, 30 రోజుల పాటు పానీయాల చరిత్రను నమోదు చేస్తుంది, శరీర బరువు ఆధారంగా మీ వ్యక్తిగతీకరించిన రోజువారీ నీటి లక్ష్యాన్ని లెక్కిస్తుంది మరియు పోషక వివరాలతో కూడిన సమగ్ర పండ్ల రసం గైడ్‌ను కలిగి ఉంటుంది.',
    aboutHow: [
      'త్రాగిన తర్వాత నీటిని నమోదు చేయడానికి త్వరిత-జోడింపు బటన్‌లను (+150మిలీ, +200మిలీ, +250మిలీ, +350మిలీ, +500మిలీ) క్లిక్ చేయండి.',
      'మిల్లీలీటర్లలో ఏదైనా నిర్దిష్ట నీరు లేదా రసం పరిమాణాన్ని నమోదు చేయడానికి "+కస్టమ్" క్లిక్ చేయండి.',
      'మీరు రోజు పొడవునా మీ వినియోగాన్ని నమోదు చేస్తున్నప్పుడు యానిమేటెడ్ నీటి సీసా నిండడాన్ని గమనించండి.',
      'మీ నీటి లక్ష్యాన్ని నేరుగా సవరించడానికి రోజువారీ లక్ష్యం గణాంకంపై "సవరించు" క్లిక్ చేయండి.',
      'లేదా హెడర్‌లోని "లక్ష్యాన్ని జోడించు" క్లిక్ చేసి, ముందుగా సెట్ చేసిన విలువల (1.5లీ, 2లీ, 2.5లీ, 3లీ) నుండి ఎంచుకోండి.',
      'నీరు త్రాగే అనుకూల రిమైండర్ సమయాలను జోడించడానికి "రిమైండర్‌లు" ట్యాబ్‌కు మారండి.',
      'అన్ని నీటి రిమైండర్‌లను ప్రారంభించడానికి లేదా నిలిపివేయడానికి రిమైండర్‌ల ఆన్/ఆఫ్ స్విచ్‌ను టోగుల్ చేయండి.',
      'రిమైండర్‌ల కోసం నిర్దిష్ట సమయాలను సెట్ చేయడానికి "సమయాన్ని జోడించు" క్లిక్ చేయండి (ఉదా. ప్రతి 40 నిమిషాలకు).',
      '"నోటిఫికేషన్ & సౌండ్‌ని పరీక్షించండి" బటన్‌ను నొక్కడం ద్వారా నోటిఫికేషన్‌లు పని చేస్తున్నాయో లేదో పరీక్షించండి.',
      'గత 14 రోజులలో మీ నీటి వినియోగం యొక్క బార్ చార్ట్‌ను చూడటానికి "చరిత్ర" ట్యాబ్‌కు మారండి.',
      'వ్యక్తిగతీకరించిన లక్ష్యాలను పొందడానికి "హైడ్రేషన్ క్యాలిక్యులేటర్" ట్యాబ్‌ను తెరిచి మీ శరీర బరువును నమోదు చేయండి.',
      'క్యాలిక్యులేటర్ ఫలితాల నుండి దాన్ని స్వయంచాలకంగా వర్తింపజేయడానికి "నా రోజువారీ లక్ష్యంగా సెట్ చేయి" క్లిక్ చేయండి.',
      'క్యాలరీలు, ఎలక్ట్రోలైట్లు మరియు ప్రయోజనాలతో కూడిన 20+ రసాలను బ్రౌజ్ చేయడానికి "పండ్ల రసాలు" ట్యాబ్‌ను సందర్శించండి.',
      'ఆ రసాన్ని మీ రోజువారీ నీటి వినియోగంలో లెక్కించడానికి ఏదైనా రసంపై "+ 250మిలీ ఈరోజు" క్లిక్ చేయండి.'
    ],
    aboutWhy: [
      'జీర్ణక్రియ, రక్త ప్రసరణ మరియు ఉష్ణోగ్రత నియంత్రణ వంటి ప్రతి జీవక్రియకు నీరు చాలా అవసరం.',
      'కేవలం 2% డీహైడ్రేషన్ కూడా ఆందోళన కలిగించేలా మానసిక పనితీరు, ఏకాగ్రత మరియు శారీరక శక్తిని తగ్గిస్తుంది.',
      'కిడ్నీ వ్యాధి, యూరినరీ ఇన్ఫెక్షన్ లేదా మధుమేహం ఉన్న రోగులకు సరైన హైడ్రేషన్ చాలా ముఖ్యం.',
      'రోజువారీ స్ట్రీక్ ఫీచర్ కాలక్రమేణా స్థిరమైన హైడ్రేషన్ అలవాట్లను ప్రోత్సహిస్తుంది.',
      'సాధారణ 8-గ్లాసుల నియమం కంటే శరీర బరువు ఆధారంగా వ్యక్తిగతీకరించిన లక్ష్యాలు మరింత ఖచ్చితమైనవి.',
      'నీరు త్రాగడం మర్చిపోయే వారిలో సమయానుకూల రిమైండర్‌లు రోజువారీ నీటి వినియోగాన్ని పెంచుతాయని నిరూపించబడింది.',
      'పండ్ల రసం గైడ్ ఉత్తమ ఎలక్ట్రోలైట్ కంటెంట్‌తో హైడ్రేటింగ్ పానీయాలను ఎంచుకోవడానికి మీకు సహాయపడుతుంది.',
      'దృశ్య పురోగతి (సీసా యానిమేషన్) తక్షణ ఫీడ్‌బ్యాక్ మరియు మరింత త్రాగడానికి ప్రేరణను అందిస్తుంది.',
      'రసాలతో సహా అన్ని వినియోగాలను నమోదు చేయడం వల్ల మొత్తం ద్రవ వినియోగం యొక్క పూర్తి చిత్రం లభిస్తుంది.',
      'చరిత్ర చార్ట్‌లు హైడ్రేషన్ స్థిరంగా తక్కువగా ఉన్న రోజులను గుర్తించడంలో మీకు సహాయపడతాయి.',
      'మెడివాల్ట్ బ్యాక్‌గ్రౌండ్‌లో ఉన్నప్పుడు కూడా మీరు హెచ్చరికలను స్వీకరించేలా బ్యాక్‌గ్రౌండ్ రిమైండర్‌లు నిర్ధారిస్తాయి.',
      'తగినంత హైడ్రేషన్ తలనొప్పి, అలసట, మలబద్ధకం మరియు చర్మం పొడిబారడాన్ని నివారిస్తుంది.'
    ]
  },
  hi: {
    active: 'सक्रिय',
    drinkingWater: 'पीने का पानी',
    subtitle: 'हाइड्रेटेड रहें · अपने दैनिक सेवन को ट्रैक करें',
    remindersOn: 'रिमाइंडर चालू',
    remindersOff: 'रिमाइंडर बंद',
    remToggleOnTitle: 'रिमाइंडर चालू हैं — अक्षम करने के लिए क्लिक करें',
    remToggleOffTitle: 'रिमाइंडर सक्षम करें',
    addTarget: 'लक्ष्य जोड़ें',
    tabToday: 'आज',
    tabReminders: 'रिमाइंडर',
    tabHistory: 'इतिहास',
    tabCalculator: 'जलयोजन कैलकुलेटर',
    tabJuices: 'फलों के रस',
    drankToday: 'आज पिया गया',
    remaining: 'शेष',
    dailyTarget: 'दैनिक लक्ष्य',
    editBtn: '✏ संपादित करें',
    dayStreak: 'दैनिक सिलसिला',
    decreaseTitle: '50ml कम करें',
    increaseTitle: '50ml बढ़ाएं',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    ml: 'ml',
    liters: 'L',
    dailyGoalAchieved: '🎉 दैनिक लक्ष्य प्राप्त हुआ!',
    nextReminder: 'अगला रिमाइंडर:',
    custom: 'कस्टम',
    logCustomAmount: 'कस्टम मात्रा दर्ज करें',
    todayLogTitle: 'आज का सेवन लॉग',
    entries: 'प्रविष्टियां',
    noWaterLogged: 'आज अभी तक कोई पानी नहीं लॉग किया गया।',
    tapQuickAdd: 'शुरू करने के लिए एक त्वरित-जोड़ बटन दबाएं!',
    removeEntry: 'प्रविष्टि हटाएं',
    water: 'पानी',
    hydrationReminders: 'जलयोजन रिमाइंडर',
    remindersDesc: 'पानी पीने के लिए अपने डेस्कटॉप/मोबाइल पर त्वरित अलर्ट प्राप्त करें। सक्रिय करने के लिए हेडर में मुख्य स्विच चालू करें।',
    currentSchedule: 'वर्तमान समय-सारणी',
    noReminders: 'कोई रिमाइंडर सेट नहीं है।',
    addOneBelow: 'शुरू करने के लिए नीचे एक जोड़ें!',
    remindersInactiveAlert: 'रिमाइंडर वर्तमान में बंद हैं। सेट किए गए रिमाइंडर काम नहीं करेंगे।',
    remindersActiveAlert: 'रिमाइंडर सक्रिय हैं।',
    addReminderTime: 'रिमाइंडर समय जोड़ें',
    testNotifBtn: 'अधिसूचना और ध्वनि का परीक्षण करें',
    soundVolume: 'ध्वनि की मात्रा',
    deleteReminder: 'रिमाइंडर हटाएं',
    hydrationHistory: 'जलयोजन इतिहास',
    historyDesc: 'पिछले 14 दिनों में अपने पानी के सेवन के पैटर्न का विश्लेषण करें। हरे रंग के टिक उन दिनों को दर्शाते हैं जब आपने अपना लक्ष्य पूरा किया था।',
    daysTargetMet: 'लक्ष्य पूरा होने के दिन',
    totalFluidDrank: 'कुल पिया गया तरल',
    dailyAverage: 'दैनिक औसत',
    fourteenDayHistory: '14-दिवसीय इतिहास लॉग',
    smartCalculator: 'स्मार्ट जलयोजन कैलकुलेटर',
    calcDesc: 'अपने शरीर के वजन के आधार पर अपने व्यक्तिगत दैनिक पानी के सेवन और इलेक्ट्रोलाइट्स के लिए सर्वोत्तम फलों के रस की सिफारिशें प्राप्त करें।',
    bodyWeight: 'आपका शरीर का वजन',
    calcNow: 'अभी गणना करें',
    waterIntakeGoal: '1. पानी के सेवन का लक्ष्य',
    perDay: 'प्रति दिन',
    basedOn: 'आधारित',
    basedOnDesc: 'शरीर का वजन × 35 मिली/किलोग्राम (मानक जलयोजन सिफारिश)।',
    morning: 'सुबह',
    afternoon: 'दोपहर',
    evening: 'शाम',
    setAsDailyTarget: 'दैनिक लक्ष्य के रूप में सेट करें',
    recommendedJuices: '🍹 2. इलेक्ट्रोलाइट्स के लिए अनुशंसित जूस',
    recommendedJuicesDesc: '{weight}किग्रा शरीर के वजन के लिए, ये जूस सर्वोत्तम जलयोजन और इलेक्ट्रोलाइट संतुलन प्रदान करते हैं।',
    add250ml: '250ml जोड़ें',
    quickReference: 'त्वरित संदर्भ',
    weightKg: 'वजन (किग्रा)',
    dailyWaterL: 'दैनिक पानी (लीटर)',
    dailyWaterMl: 'दैनिक पानी (मिली)',
    compJuiceGuide: '🌊 व्यापक फलों का रस गाइड',
    compJuiceGuideDesc: 'विभिन्न फलों के रसों के पोषण मूल्य और जलयोजन लाभों की खोज करें। उन्हें अपने दैनिक सेवन लॉग में जोड़ें।',
    sNo: 'क्र.सं.',
    fruitJuice: 'फलों का रस',
    energyKcal: 'ऊर्जा (किलो कैलोरी)',
    proteinG: 'प्रोटीन (ग्राम)',
    electroApprox: 'इलेक्ट्रोलाइट्स (लगभग)',
    topUses: 'मुख्य उपयोग / लाभ',
    action: 'कार्रवाई',
    setWaterTarget: 'दैनिक पानी का लक्ष्य सेट करें',
    targetAmount: 'लक्ष्य मात्रा (मिली)',
    setTarget: 'लक्ष्य सेट करें',
    logWater: 'पानी लॉग करें',
    addWaterReminder: 'पानी का रिमाइंडर जोड़ें',
    selectTime: 'समय चुनें',
    reminderTip: 'सुझाव: अपने जागने और सोने के समय के बीच हर 40 मिनट में रिमाइंडर जोड़ें।',
    quickSchedule: 'त्वरित 40-मिनट शेड्यूल (सुबह 6 से रात 10 बजे)',
    aboutWhat: 'पीने का पानी एक संपूर्ण जलयोजन प्रबंधन प्रणाली है जो वास्तविक समय में आपके दैनिक पानी के सेवन को ट्रैक करती है, एक दृश्य पानी की बोतल के साथ आपकी प्रगति को दिखाती है, स्मार्ट जलयोजन रिमाइंडर प्रदान करती है, 30 दिनों के लिए पेय इतिहास को लॉग करती है, शरीर के वजन के आधार पर आपके व्यक्तिगत दैनिक पानी के लक्ष्य की गणना करती है, और पोषण संबंधी डेटा के साथ एक व्यापक फल रस गाइड शामिल करती है।',
    aboutHow: [
      'पीने के बाद पानी लॉग करने के लिए त्वरित-जोड़ बटन (+150ml, +200ml, +250ml, +350ml, +500ml) पर क्लिक करें।',
      'मिलीलीटर में पानी या जूस की किसी विशिष्ट मात्रा को लॉग करने के लिए "+कस्टम" पर क्लिक करें।',
      'जैसे ही आप दिन भर में अपना सेवन लॉग करते हैं, एनिमेटेड पानी की बोतल को भरते हुए देखें।',
      'दैनिक लक्ष्य आंकड़े पर "संपादित करें" पर क्लिक करके सीधे अपने पानी के लक्ष्य को समायोजित करें।',
      'या हेडर में "लक्ष्य जोड़ें" पर क्लिक करें और पूर्व निर्धारित मानों (1.5L, 2L, 2.5L, 3L) में से चुनें।',
      'पानी पीने के लिए कस्टम रिमाइंडर समय जोड़ने के लिए "रिमाइंडर" टैब पर जाएं।',
      'सभी पानी के रिमाइंडर चालू या बंद करने के लिए रिमाइंडर ऑन/ऑफ स्विच को टॉगल करें।',
      'रिमाइंडर के लिए विशिष्ट समय सेट करने के लिए "समय जोड़ें" पर क्लिक करें (जैसे, हर 40 मिनट)।',
      '"अधिसूचना और ध्वनि का परीक्षण करें" बटन दबाकर जांचें कि क्या सूचनाएं काम कर रही हैं।',
      'पिछले 14 दिनों के अपने पानी के सेवन का बार चार्ट देखने के लिए "इतिहास" टैब पर जाएं।',
      'व्यक्तिगत लक्ष्य प्राप्त करने के लिए "जलयोजन कैलकुलेटर" टैब खोलें और अपना वजन दर्ज करें।',
      'कैलकुलेटर के परिणामों से इसे स्वचालित रूप से लागू करने के लिए "दैनिक लक्ष्य के रूप में सेट करें" पर क्लिक करें।',
      'कैलोरी, इलेक्ट्रोलाइट्स और लाभों के साथ 20+ जूस देखने के लिए "फलों के रस" टैब पर जाएं।',
      'उस जूस को अपने दैनिक पानी के सेवन में शामिल करने के लिए किसी भी जूस पर "+ 250ml आज" पर क्लिक करें।'
    ],
    aboutWhy: [
      'पानी हर जैविक कार्य के लिए आवश्यक है — पाचन, परिसंचरण और तापमान नियंत्रण।',
      'केवल 2% निर्जलीकरण भी मानसिक प्रदर्शन, ध्यान और शारीरिक ऊर्जा को कम कर सकता है।',
      'गुर्दे की बीमारी, यूटीआई या मधुमेह के रोगियों के लिए उचित जलयोजन महत्वपूर्ण है।',
      'दैनिक सिलसिला सुविधा समय के साथ निरंतर जलयोजन की आदतों को प्रेरित करती है।',
      'सामान्य 8-ग्लास नियम की तुलना में शरीर के वजन पर आधारित व्यक्तिगत लक्ष्य अधिक सटीक होते हैं।',
      'समयबद्ध रिमाइंडर उन लोगों में दैनिक पानी के सेवन को बढ़ाने के लिए सिद्ध हुए हैं जो पानी पीना भूल जाते हैं।',
      'फलों का रस गाइड आपको सर्वोत्तम इलेक्ट्रोलाइट सामग्री वाले पेय पदार्थों को चुनने में मदद करता है।',
      'दृश्य प्रगति (बोतल एनीमेशन) त्वरित प्रतिक्रिया और अधिक पीने की प्रेरणा प्रदान करती है।',
      'जूस सहित सभी सेवन लॉग करने से कुल तरल सेवन की पूरी तस्वीर मिलती है।',
      'ऐतिहासिक चार्ट आपको उन दिनों की पहचान करने में मदद करते हैं जब जलयोजन लगातार कम रहता है।',
      'बैकग्राउंड रिमाइंडर यह सुनिश्चित करते हैं कि मेडिवॉल्ट के बैकग्राउंड में होने पर भी आपको अलर्ट मिलें।',
      'पर्याप्त जलयोजन सिरदर्द, थकान, कब्ज और त्वचा के रूखेपन को रोकता है।'
    ]
  },
  eu: {
    active: 'Activo',
    drinkingWater: 'Agua Potable',
    subtitle: 'Mantente hidratado · Registra tu ingesta diaria',
    remindersOn: 'Recordatorios ACTIVADOS',
    remindersOff: 'Recordatorios DESACTIVADOS',
    remToggleOnTitle: 'Recordatorios ACTIVADOS — Haz clic para desactivar',
    remToggleOffTitle: 'Activar Recordatorios',
    addTarget: 'Añadir Objetivo',
    tabToday: 'Hoy',
    tabReminders: 'Recordatorios',
    tabHistory: 'Historial',
    tabCalculator: 'Calculadora de Hidratación',
    tabJuices: 'Zumos de Frutas',
    drankToday: 'Bebido Hoy',
    remaining: 'Restante',
    dailyTarget: 'Objetivo Diario',
    editBtn: '✏ Editar',
    dayStreak: 'Racha de Días',
    decreaseTitle: 'Disminuir en 50ml',
    increaseTitle: 'Aumentar en 50ml',
    save: 'Guardar',
    cancel: 'Cancelar',
    ml: 'ml',
    liters: 'L',
    dailyGoalAchieved: '🎉 ¡Objetivo Diario Logrado!',
    nextReminder: 'Próximo recordatorio:',
    custom: 'Personalizado',
    logCustomAmount: 'Registrar Cantidad Personalizada',
    todayLogTitle: 'Registro de Ingesta de Hoy',
    entries: 'entradas',
    noWaterLogged: 'Aún no se ha registrado agua hoy.',
    tapQuickAdd: '¡Toca un botón de adición rápida para comenzar!',
    removeEntry: 'Eliminar entrada',
    water: 'Agua',
    hydrationReminders: 'Recordatorios de Hidratación',
    remindersDesc: 'Recibe alertas instantáneas en tu ordenador/móvil para seguir bebiendo agua. Enciende el interruptor principal en el encabezado para activar.',
    currentSchedule: 'Horario Actual',
    noReminders: 'No hay recordatorios establecidos.',
    addOneBelow: '¡Añade uno a continuación para comenzar!',
    remindersInactiveAlert: 'Los recordatorios están actualmente DESACTIVADOS. Los recordatorios establecidos no sonarán.',
    remindersActiveAlert: 'Los recordatorios están activos.',
    addReminderTime: 'Añadir Hora de Recordatorio',
    testNotifBtn: 'Probar Notificación y Sonido',
    soundVolume: 'Volumen del Sonido',
    deleteReminder: 'Eliminar recordatorio',
    hydrationHistory: 'Historial de Hidratación',
    historyDesc: 'Analiza tus patrones de ingesta de agua durante los últimos 14 días. Las marcas verdes indican los días que cumpliste tu objetivo.',
    daysTargetMet: 'Días con Objetivo Cumplido',
    totalFluidDrank: 'Total de Líquido Bebido',
    dailyAverage: 'Promedio Diario',
    fourteenDayHistory: 'Registro Histórico de 14 Días',
    smartCalculator: 'Calculadora de Hidratación Inteligente',
    calcDesc: 'Introduce tu peso corporal para obtener tu ingesta diaria de agua personalizada y las mejores recomendaciones de zumos de frutas para electrolitos.',
    bodyWeight: 'Tu Peso Corporal',
    calcNow: 'Calcular Ahora',
    waterIntakeGoal: '1. Objetivo de Ingesta de Agua',
    perDay: 'al día',
    basedOn: 'Basado en',
    basedOnDesc: 'peso corporal × 35 ml/kg (recomendación estándar de hidratación).',
    morning: 'Mañana',
    afternoon: 'Tarde',
    evening: 'Noche',
    setAsDailyTarget: 'Establecer como mi Objetivo Diario',
    recommendedJuices: '🍹 2. Zumos Recomendados para Electrolitos',
    recommendedJuicesDesc: 'Para un peso corporal de {weight}kg, estos zumos proporcionan la mejor hidratación y equilibrio de electrolitos.',
    add250ml: 'Añadir 250ml',
    quickReference: 'Referencia Rápida',
    weightKg: 'Peso (kg)',
    dailyWaterL: 'Agua Diaria (L)',
    dailyWaterMl: 'Agua Diaria (ml)',
    compJuiceGuide: '🌊 Guía Completa de Zumos de Frutas',
    compJuiceGuideDesc: 'Descubre el valor nutricional y los beneficios hidratantes de varios zumos de frutas. Añádelos a tu registro de ingesta diaria.',
    sNo: 'S.No',
    fruitJuice: 'Zumo de Fruta',
    energyKcal: 'Energía (Kcal)',
    proteinG: 'Proteína (g)',
    electroApprox: 'Electrolitos (Aprox)',
    topUses: 'Principales Usos / Beneficios',
    action: 'Acción',
    setWaterTarget: 'Establecer Objetivo Diario de Agua',
    targetAmount: 'Cantidad Objetivo (ml)',
    setTarget: 'Establecer Objetivo',
    logWater: 'Registrar Agua',
    addWaterReminder: 'Añadir Recordatorio de Agua',
    selectTime: 'Seleccionar Hora',
    reminderTip: 'Consejo: Añade recordatorios cada 40 minutos entre la hora de despertarte y la de acostarte.',
    quickSchedule: 'Horario Rápido de 40 min (6 AM – 10 PM)',
    aboutWhat: 'Agua Potable es un sistema completo de gestión de la hidratación que realiza un seguimiento de tu ingesta diaria de agua en tiempo real, muestra tu progreso con una botella de agua visual, proporciona recordatorios inteligentes de hidratación, registra el historial de bebidas durante 30 días, calcula tu objetivo de agua diario personalizado basado en el peso corporal e incluye una guía completa de zumos de frutas con datos nutricionales.',
    aboutHow: [
      'Haz clic en los botones de adición rápida (+150ml, +200ml, +250ml, +350ml, +500ml) para registrar el agua después de beber.',
      'Haz clic en "+Personalizado" para registrar cualquier cantidad específica de agua o zumo en mililitros.',
      'Observa cómo se llena la botella de agua animada a medida que registras tu ingesta a lo largo del día.',
      'Haz clic en "Editar" en la estadística de Objetivo Diario para ajustar directamente tu meta de agua en línea.',
      'O haz clic en "Añadir Objetivo" en el encabezado y elige entre valores preestablecidos (1.5L, 2L, 2.5L, 3L).',
      'Cambia a la pestaña "Recordatorios" para añadir horas de notificación personalizadas para beber agua.',
      'Activa o desactiva los recordatorios utilizando el interruptor de encendido/apagado del encabezado.',
      'Haz clic en "Añadir Hora" para establecer horas específicas para los recordatorios (p. ej., cada 40 minutos).',
      'Prueba si las notificaciones funcionan presionando el botón "Probar Notificación y Sonido".',
      'Cambia a la pestaña "Historial" para ver un gráfico de barras de tu ingesta de agua durante los últimos 14 días.',
      'Abre la pestaña "Calculadora de Hidratación" e introduce tu peso corporal para obtener objetivos personalizados.',
      'Haz clic en "Establecer como mi Objetivo Diario" desde los resultados de la calculadora para aplicarlo automáticamente.',
      'Visita la pestaña "Zumos de Frutas" para explorar más de 20 zumos con calorías, electrolitos y beneficios.',
      'Haz clic en "+ 250ml Hoy" en cualquier zumo para contabilizarlo dentro de tu ingesta diaria de agua.'
    ],
    aboutWhy: [
      'El agua es esencial para cada función biológica: digestión, circulación y regulación de la temperatura.',
      'La deshidratación incluso en un 2% puede reducir el rendimiento mental, la concentración y la energía física.',
      'La hidratación adecuada es crítica para pacientes con enfermedad renal, infecciones urinarias o diabetes.',
      'La función de racha diaria motiva hábitos de hidratación constantes a lo largo del tiempo.',
      'Los objetivos personalizados basados en el peso corporal son más precisos que la regla genérica de los 8 vasos.',
      'Se ha demostrado que los recordatorios programados aumentan la ingesta diaria de agua en personas que olvidan beber.',
      'La guía de zumos de frutas te ayuda a elegir bebidas hidratantes con el mejor contenido de electrolitos.',
      'El progreso visual (animación de la botella) proporciona retroalimentación instantánea y motivación para beber más.',
      'Registrar toda la ingesta, incluidos los zumos, ofrece una imagen más completa de la ingesta total de líquidos.',
      'Los gráficos históricos te ayudan a identificar los días en que la hidratación es constantemente insuficiente.',
      'Los recordatorios en segundo plano garantizan que recibas alertas incluso cuando MediVault está en segundo plano.',
      'Una hidratación adecuada previene dolores de cabeza, fatiga, estreñimiento y sequedad en la piel.'
    ]
  }
};


/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const TODAY = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
const TIME_NOW = () => {
  const d = new Date();
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};
const LS_KEY = 'medivault_water';

const JUICE_DATA = [
  { no: 1,  name: 'Pomegranate',   imp: true,  kcal: '55-65', protein: 0.4, electrolytes: 'High potassium ⭐',          uses: 'Heart health, antioxidant', color: '#ff4757', img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=80&h=80&fit=crop&q=80' },
  { no: 2,  name: 'Orange',        imp: true,  kcal: '45-50', protein: 0.4, electrolytes: 'High potassium, Vit C ⭐',   uses: 'Immunity, hydration',        color: '#ffa502', img: 'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?w=80&h=80&fit=crop&q=80' },
  { no: 3,  name: 'Apple',         imp: false, kcal: '45-50', protein: 0.1, electrolytes: 'Low potassium',              uses: 'Digestion, hydration',       color: '#ff6b81', img: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=80&h=80&fit=crop&q=80' },
  { no: 4,  name: 'Grape',         imp: false, kcal: '60-70', protein: 0.4, electrolytes: 'Moderate potassium',         uses: 'Energy boost',               color: '#5352ed', img: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=80&h=80&fit=crop&q=80' },
  { no: 5,  name: 'Watermelon',    imp: true,  kcal: '30-35', protein: 0.5, electrolytes: 'High potassium, Mg ⭐',      uses: 'Cooling, hydration',         color: '#ff4757', img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=80&h=80&fit=crop&q=80' },
  { no: 6,  name: 'Pineapple',     imp: false, kcal: '50-55', protein: 0.4, electrolytes: 'Moderate potassium',         uses: 'Digestion',                  color: '#eccc68', img: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=80&h=80&fit=crop&q=80' },
  { no: 7,  name: 'Guava',         imp: true,  kcal: '50-60', protein: 0.5, electrolytes: 'High potassium, Vit C ⭐',   uses: 'Immunity',                   color: '#2ed573', img: 'https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=80&h=80&fit=crop&q=80' },
  { no: 8,  name: 'Mango',         imp: false, kcal: '60-70', protein: 0.4, electrolytes: 'Potassium',                  uses: 'Energy',                     color: '#ffa502', img: 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=80&h=80&fit=crop&q=80' },
  { no: 9,  name: 'Lemon/Lime',    imp: true,  kcal: '20-25', protein: 0.2, electrolytes: 'High potassium, Vit C ⭐',   uses: 'Detox, hydration',           color: '#7bed9f', img: 'https://images.unsplash.com/photo-1590502160462-58b41354f588?w=80&h=80&fit=crop&q=80' },
  { no: 10, name: 'Coconut water', imp: true,  kcal: '19',    protein: 0.1, electrolytes: 'Very high electrolytes ⭐⭐⭐', uses: 'Best rehydration',           color: '#70a1ff', img: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=80&h=80&fit=crop&q=80' },
  { no: 11, name: 'Beetroot',      imp: true,  kcal: '40-45', protein: 0.5, electrolytes: 'High potassium ⭐',          uses: 'BP control',                 color: '#c56cf0', img: 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?w=80&h=80&fit=crop&q=80' },
  { no: 12, name: 'Cranberry',     imp: false, kcal: '45-55', protein: 0.2, electrolytes: 'Low potassium',              uses: 'UTI support',                color: '#ff4757', img: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=80&h=80&fit=crop&q=80' },
  { no: 13, name: 'Tomato',        imp: true,  kcal: '20-25', protein: 0.8, electrolytes: 'High potassium ⭐',          uses: 'Heart health',               color: '#eb4d4b', img: 'https://images.unsplash.com/photo-1546094096-0df4bcaad337?w=80&h=80&fit=crop&q=80' },
  { no: 14, name: 'Grapefruit',    imp: false, kcal: '40-45', protein: 0.4, electrolytes: 'Moderate potassium',         uses: 'Metabolism',                 color: '#ff7f50', img: 'https://images.unsplash.com/photo-1587394904488-a6dd58d50ef4?w=80&h=80&fit=crop&q=80' },
  { no: 15, name: 'Papaya',        imp: false, kcal: '40-45', protein: 0.4, electrolytes: 'Moderate potassium',         uses: 'Digestion',                  color: '#ffa502', img: 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=80&h=80&fit=crop&q=80' },
  { no: 16, name: 'Pear',          imp: false, kcal: '45-50', protein: 0.2, electrolytes: 'Moderate potassium',         uses: 'Hydration',                  color: '#badc58', img: 'https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=80&h=80&fit=crop&q=80' },
  { no: 17, name: 'Kiwi',          imp: true,  kcal: '50-60', protein: 0.5, electrolytes: 'High potassium ⭐',          uses: 'Immunity',                   color: '#6ab04c', img: 'https://images.unsplash.com/photo-1616684000067-36952fde56ec?w=80&h=80&fit=crop&q=80' },
  { no: 18, name: 'Muskmelon',     imp: true,  kcal: '30-35', protein: 0.3, electrolytes: 'High potassium ⭐',          uses: 'Hydration',                  color: '#feca57', img: 'https://images.unsplash.com/photo-1571575173927-e6d90c2ed5b4?w=80&h=80&fit=crop&q=80' },
  { no: 19, name: 'Apricot',       imp: false, kcal: '50-60', protein: 0.5, electrolytes: 'High potassium ⭐',          uses: 'Eye health',                 color: '#ff9f43', img: 'https://images.unsplash.com/photo-1580228989700-03ff79af4c91?w=80&h=80&fit=crop&q=80' },
  { no: 20, name: 'Fig (Anjeer)',  imp: false, kcal: '60-70', protein: 0.5, electrolytes: 'Potassium',                  uses: 'Digestion',                  color: '#8e44ad', img: 'https://images.unsplash.com/photo-1597714026720-8f74c62310ba?w=80&h=80&fit=crop&q=80' },
  { no: 21, name: 'Prune',         imp: false, kcal: '60-70', protein: 0.5, electrolytes: 'Very high potassium ⭐⭐',   uses: 'Constipation',               color: '#3742fa', img: 'https://images.unsplash.com/photo-1566542030429-b8e4e4e9d40a?w=80&h=80&fit=crop&q=80' },
  { no: 22, name: 'Passion fruit', imp: false, kcal: '50-60', protein: 0.5, electrolytes: 'High potassium ⭐',          uses: 'Immunity',                   color: '#9b59b6', img: 'https://images.unsplash.com/photo-1604495772376-9657f0033ebe?w=80&h=80&fit=crop&q=80' },
  { no: 23, name: 'Amla',          imp: true,  kcal: '30-40', protein: 0.5, electrolytes: 'Very high Vit C ⭐',         uses: 'Immunity',                   color: '#2ed573', img: 'https://images.unsplash.com/photo-1515023115689-589c33041d3c?w=80&h=80&fit=crop&q=80' },
  { no: 24, name: 'Carrot',        imp: true,  kcal: '35-40', protein: 0.5, electrolytes: 'High potassium ⭐',          uses: 'Eye health',                 color: '#ff7f50', img: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=80&h=80&fit=crop&q=80' },
  { no: 25, name: 'Lychee',        imp: false, kcal: '60-70', protein: 0.3, electrolytes: 'Potassium',                  uses: 'Energy',                     color: '#ff6b81', img: 'https://images.unsplash.com/photo-1621288378085-1a9f4a28bdc5?w=80&h=80&fit=crop&q=80' },
  { no: 26, name: 'Mixed fruit',   imp: true,  kcal: '50-60', protein: 0.5, electrolytes: 'Varies',                     uses: 'Overall nutrition',          color: '#a4b0be', img: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=80&h=80&fit=crop&q=80' },
  { no: 27, name: 'Sugarcane',     imp: true,  kcal: '60-70', protein: 0.2, electrolytes: 'Electrolytes ⭐',            uses: 'Quick energy',               color: '#dcedc1', img: 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=80&h=80&fit=crop&q=80' },
  { no: 28, name: 'Peach',         imp: false, kcal: '40-50', protein: 0.5, electrolytes: 'Potassium',                  uses: 'Skin',                       color: '#ffc048', img: 'https://images.unsplash.com/photo-1571640274-db0773779e10?w=80&h=80&fit=crop&q=80' },
  { no: 29, name: 'Cherry',        imp: false, kcal: '50-60', protein: 0.5, electrolytes: 'Potassium',                  uses: 'Anti-inflammatory',          color: '#ef5777', img: 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=80&h=80&fit=crop&q=80' },
  { no: 30, name: 'Strawberry',    imp: true,  kcal: '30-35', protein: 0.5, electrolytes: 'Potassium, Vit C ⭐',        uses: 'Heart health',               color: '#ff4d4d', img: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=80&h=80&fit=crop&q=80' },
];

const JUICE_USES = ['Hydration', 'Immunity', 'Energy', 'Digestion', 'Heart health', 'Detox', 'Eye health', 'Metabolism'];


function loadStore(user) {
  const key = user?.id ? `${LS_KEY}_${user.id}` : LS_KEY;
  try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
}
function saveStore(data, user) {
  const key = user?.id ? `${LS_KEY}_${user.id}` : LS_KEY;
  localStorage.setItem(key, JSON.stringify(data));
}

/* water drop SVG fill animation */
function WaterBottle({ percent }) {
  const clamped = Math.min(100, Math.max(0, percent));
  const fillY = 100 - clamped;
  return (
    <svg viewBox="0 0 100 180" className="water-bottle-svg" aria-label={`${clamped}% water level`}>
      <defs>
        <clipPath id="bottle-clip">
          <path d="M30 10 Q30 0 50 0 Q70 0 70 10 L78 35 Q88 45 88 60 L88 155 Q88 175 50 175 Q12 175 12 155 L12 60 Q12 45 22 35 Z" />
        </clipPath>
        <linearGradient id="water-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="bottle-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="100%" stopColor="rgba(14,165,233,0.05)" />
        </linearGradient>
      </defs>
      {/* Bottle body */}
      <path d="M30 10 Q30 0 50 0 Q70 0 70 10 L78 35 Q88 45 88 60 L88 155 Q88 175 50 175 Q12 175 12 155 L12 60 Q12 45 22 35 Z"
        fill="url(#bottle-grad)" stroke="rgba(14,165,233,0.6)" strokeWidth="2" />
      {/* Water fill */}
      <rect x="0" y={`${fillY}%`} width="100" height="100%" fill="url(#water-grad)" clipPath="url(#bottle-clip)" className="water-fill-rect" />
      {/* Wave */}
      <svg x="0" y={`${fillY}%`} width="100" height="20" className="wave-layer" clipPath="url(#bottle-clip)">
        <path d="M0 10 Q25 0 50 10 Q75 20 100 10 L100 20 L0 20 Z" fill="rgba(255,255,255,0.3)" className="wave-path" />
      </svg>
      {/* Shine */}
      <ellipse cx="35" cy="70" rx="6" ry="20" fill="rgba(255,255,255,0.18)" />
      {/* Percent text */}
      <text x="50" y="105" textAnchor="middle" fill="white" fontSize="16" fontWeight="800" paintOrder="stroke" stroke="#0369a1" strokeWidth="1">
        {Math.round(clamped)}%
      </text>
    </svg>
  );
}

/* Mini bar for history */
function MiniBar({ value, max }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="mini-bar-wrap">
      <div className="mini-bar-fill" style={{ height: `${pct}%` }} />
    </div>
  );
}

/* Ripple effect on button click */
function useRipple() {
  const [ripples, setRipples] = useState([]);
  const addRipple = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(r => [...r, { id, x, y }]);
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 600);
  };
  return [ripples, addRipple];
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function DrinkingWater({ user }) {
  const { lang } = useLanguage();
  const dt = (key) => DRINKING_WATER_T[lang]?.[key] || DRINKING_WATER_T['en']?.[key] || key;

  const getJuiceName = (name) => JUICE_TRANSLATIONS[lang]?.[name] || name;
  const getJuiceElectrolytes = (electro) => {
    if (!electro) return '';
    if (electro.includes('Very high electrolytes')) return JUICE_TRANSLATIONS[lang]?.veryHighElectrolytesStar || electro;
    if (electro.includes('Very high Vit C')) return JUICE_TRANSLATIONS[lang]?.veryHighVitCStar || electro;
    if (electro.includes('Very high potassium')) return JUICE_TRANSLATIONS[lang]?.veryHighPotassiumStar || electro;
    if (electro.includes('High potassium, Vit C')) return JUICE_TRANSLATIONS[lang]?.highPotassiumVitCStar || electro;
    if (electro.includes('High potassium, Mg')) return JUICE_TRANSLATIONS[lang]?.highPotassiumMgStar || electro;
    if (electro.includes('High potassium')) return JUICE_TRANSLATIONS[lang]?.highPotassiumStar || electro;
    if (electro.includes('Low potassium')) return JUICE_TRANSLATIONS[lang]?.lowPotassium || electro;
    if (electro.includes('Moderate potassium')) return JUICE_TRANSLATIONS[lang]?.moderatePotassium || electro;
    if (electro.includes('Electrolytes ⭐')) return JUICE_TRANSLATIONS[lang]?.electrolytesStar || electro;
    if (electro.includes('Varies')) return JUICE_TRANSLATIONS[lang]?.varies || electro;
    if (electro.includes('Potassium')) return JUICE_TRANSLATIONS[lang]?.potassium || electro;
    return electro;
  };
  const getJuiceUses = (uses) => {
    if (!uses) return '';
    if (uses.includes('Heart health, antioxidant')) return JUICE_TRANSLATIONS[lang]?.heartHealth || uses;
    if (uses.includes('Heart health')) return JUICE_TRANSLATIONS[lang]?.heartHealthOnly || uses;
    if (uses.includes('Immunity, hydration')) return JUICE_TRANSLATIONS[lang]?.immunityHydration || uses;
    if (uses.includes('Immunity')) return JUICE_TRANSLATIONS[lang]?.immunity || uses;
    if (uses.includes('Digestion, hydration')) return JUICE_TRANSLATIONS[lang]?.digestionHydration || uses;
    if (uses.includes('Energy boost')) return JUICE_TRANSLATIONS[lang]?.energyBoost || uses;
    if (uses.includes('Cooling, hydration')) return JUICE_TRANSLATIONS[lang]?.coolingHydration || uses;
    if (uses.includes('Digestion')) return JUICE_TRANSLATIONS[lang]?.digestion || uses;
    if (uses.includes('Detox, hydration')) return JUICE_TRANSLATIONS[lang]?.detoxHydration || uses;
    if (uses.includes('Best rehydration')) return JUICE_TRANSLATIONS[lang]?.bestRehydration || uses;
    if (uses.includes('BP control')) return JUICE_TRANSLATIONS[lang]?.bpControl || uses;
    if (uses.includes('UTI support')) return JUICE_TRANSLATIONS[lang]?.utiSupport || uses;
    if (uses.includes('Metabolism')) return JUICE_TRANSLATIONS[lang]?.metabolism || uses;
    if (uses.includes('Energy')) return JUICE_TRANSLATIONS[lang]?.energy || uses;
    if (uses.includes('Hydration')) return JUICE_TRANSLATIONS[lang]?.hydration || uses;
    if (uses.includes('Eye health')) return JUICE_TRANSLATIONS[lang]?.eyeHealth || uses;
    if (uses.includes('Constipation')) return JUICE_TRANSLATIONS[lang]?.constipation || uses;
    if (uses.includes('Quick energy')) return JUICE_TRANSLATIONS[lang]?.quickEnergy || uses;
    if (uses.includes('Skin')) return JUICE_TRANSLATIONS[lang]?.skin || uses;
    if (uses.includes('Anti-inflammatory')) return JUICE_TRANSLATIONS[lang]?.antiInflammatory || uses;
    return uses;
  };

  const store = loadStore(user);
  const todayKey = TODAY();

  /* ── STATE ── */
  const [activeTab, setActiveTab] = useState('home'); // home | history | calculator | reminders
  const [target, setTarget] = useState(store.target || 2500); // ml
  const [todayLogs, setTodayLogs] = useState(store[todayKey]?.logs || []);
  const [history, setHistory] = useState(store.history || {});
  const [reminders, setReminders] = useState(store.reminders || []);
  const [remindersOn, setRemindersOn] = useState(store.remindersOn ?? false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showNotifPopup, setShowNotifPopup] = useState(false);
  const [popupMsg, setPopupMsg] = useState('');
  const [notifPermission, setNotifPermission] = useState(Notification.permission);
  const [customAmount, setCustomAmount] = useState(250);
  const [targetInput, setTargetInput] = useState(target);
  const [newReminderTime, setNewReminderTime] = useState('08:00');
  const [expandHistory, setExpandHistory] = useState({});
  const [calcWeight, setCalcWeight] = useState('');
  const [calcResult, setCalcResult] = useState(null);
  const [calcJuiceProtein, setCalcJuiceProtein] = useState('');
  const [calcJuiceGoal, setCalcJuiceGoal] = useState('Hydration');
  const [calcJuiceResults, setCalcJuiceResults] = useState(null);
  const [animateAdd, setAnimateAdd] = useState(false);
  const [editingTarget, setEditingTarget] = useState(false);
  const [inlineTarget, setInlineTarget] = useState(target);
  const [ripples, addRipple] = useRipple();
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  const totalDrank = todayLogs.reduce((s, l) => s + l.amount, 0);
  const percent = (totalDrank / target) * 100;

  // Sync state when user changes
  useEffect(() => {
    if (user?.id) {
      const uStore = loadStore(user);
      setTarget(uStore.target || 2500);
      setTodayLogs(uStore[todayKey]?.logs || []);
      setHistory(uStore.history || {});
      setReminders(uStore.reminders || []);
      setRemindersOn(uStore.remindersOn ?? false);
    }
  }, [user, todayKey]);

  /* ── PERSIST ── */
  useEffect(() => {
    const store = loadStore(user);
    store.target = target;
    store[todayKey] = { logs: todayLogs, total: totalDrank };
    store.history = history;
    store.reminders = reminders;
    store.remindersOn = remindersOn;
    saveStore(store, user);
    window.dispatchEvent(new CustomEvent('medivault_water_updated'));
    // Sync water reminders to service worker for background notifications
    const uid = user?.id || user?.uid || '';
    syncWaterRemindersToSW(reminders, remindersOn, uid);
    // Sync to Firestore for closed-app notifications
    if (user?.uid) {
      syncRemindersToFirestore(user.uid, 'water', reminders, remindersOn);
    }
  }, [target, todayLogs, history, reminders, remindersOn, user?.id, user?.uid]);

  /* ── SYNC HISTORY ── */
  useEffect(() => {
    setHistory(prev => {
      const updated = { ...prev, [todayKey]: { total: totalDrank, target } };
      return updated;
    });
  }, [totalDrank, target]);

  /* ── NOTIFICATION PERMISSION ── */
  async function requestNotifPermission() {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
    return perm;
  }

  /* ── PLAY WATER SOUND (2-second realistic water pour/splash) ── */
  function playWaterSound() {
    try {
      const globalVol = parseFloat(localStorage.getItem('mv_global_volume') ?? 1.0);
      if (globalVol === 0) return;

      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const t = ctx.currentTime;
      const duration = 2.0;

      const masterGain = ctx.createGain();
      masterGain.gain.value = globalVol;
      masterGain.connect(ctx.destination);

      // ── 1. WHITE NOISE SOURCE (base of water pour) ──
      const bufferSize = ctx.sampleRate * duration;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      // ── Band-pass to shape noise into "water rushing" frequency range ──
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(800, t);
      bandpass.frequency.linearRampToValueAtTime(1400, t + 0.3);
      bandpass.frequency.linearRampToValueAtTime(700, t + 1.2);
      bandpass.frequency.linearRampToValueAtTime(400, t + duration);
      bandpass.Q.value = 0.8;

      // ── Low-pass to soften harshness ──
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 2200;

      // ── Main gain envelope: fade in quickly, sustain, fade out ──
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, t);
      noiseGain.gain.linearRampToValueAtTime(0.45, t + 0.12);
      noiseGain.gain.setValueAtTime(0.45, t + 0.9);
      noiseGain.gain.linearRampToValueAtTime(0.2, t + 1.5);
      noiseGain.gain.linearRampToValueAtTime(0, t + duration);

      noiseSource.connect(bandpass);
      bandpass.connect(lowpass);
      lowpass.connect(noiseGain);
      noiseGain.connect(masterGain);
      noiseSource.start(t);
      noiseSource.stop(t + duration);

      // ── 2. WATER DROP PLOPS (3 realistic drips at staggered times) ──
      const dropTimes = [0.05, 0.45, 1.0];
      const dropPitches = [520, 680, 440];
      dropTimes.forEach((dt, idx) => {
        const dropOsc = ctx.createOscillator();
        const dropGain = ctx.createGain();
        const dropFilter = ctx.createBiquadFilter();
        dropFilter.type = 'bandpass';
        dropFilter.frequency.value = dropPitches[idx];
        dropFilter.Q.value = 4;

        dropOsc.type = 'sine';
        dropOsc.frequency.setValueAtTime(dropPitches[idx], t + dt);
        dropOsc.frequency.exponentialRampToValueAtTime(dropPitches[idx] * 0.3, t + dt + 0.25);

        dropGain.gain.setValueAtTime(0, t + dt);
        dropGain.gain.linearRampToValueAtTime(0.55, t + dt + 0.015);
        dropGain.gain.exponentialRampToValueAtTime(0.001, t + dt + 0.28);

        dropOsc.connect(dropFilter);
        dropFilter.connect(dropGain);
        dropGain.connect(masterGain);
        dropOsc.start(t + dt);
        dropOsc.stop(t + dt + 0.3);
      });

      // ── 3. GURGLE / BUBBLE layer (low frequency wobble) ──
      const bubbleOsc = ctx.createOscillator();
      bubbleOsc.type = 'sine';
      bubbleOsc.frequency.setValueAtTime(90, t + 0.1);
      bubbleOsc.frequency.linearRampToValueAtTime(130, t + 0.6);
      bubbleOsc.frequency.linearRampToValueAtTime(70, t + 1.4);
      const bubbleGain = ctx.createGain();
      bubbleGain.gain.setValueAtTime(0, t + 0.1);
      bubbleGain.gain.linearRampToValueAtTime(0.12, t + 0.25);
      bubbleGain.gain.setValueAtTime(0.12, t + 1.2);
      bubbleGain.gain.linearRampToValueAtTime(0, t + duration);
      bubbleOsc.connect(bubbleGain);
      bubbleGain.connect(masterGain);
      bubbleOsc.start(t + 0.1);
      bubbleOsc.stop(t + duration);

    } catch (_) {}
  }

  /* ── FIRE NOTIFICATION ── */
  const fireNotification = useCallback((reminder) => {
    playWaterSound();
    const time = reminder?.time || 'Now';
    const msg = `💧 Time to drink water! (${time}) — Stay hydrated!`;
    setPopupMsg(msg);
    setShowNotifPopup(true);
    setTimeout(() => setShowNotifPopup(false), 8000);

    // Browser notification (shown when tab is open too, as extra reinforcement)
    if (Notification.permission === 'granted') {
      try {
        new Notification('💧 Hydration Reminder — MediVault', {
          body: `It's ${time}! Time to drink water. Stay hydrated! 🌊`,
          icon: '/favicon.svg',
          requireInteraction: false,
          tag: `water-reminder-${reminder?.id || 'test'}`,
        });
      } catch (_) {}
    }
  }, []);

  /* ── REGISTER SW CALLBACK + LISTEN FOR SW-FIRED WATER REMINDERS ── */
  useEffect(() => {
    // Register: when SW fires a water reminder while tab is closed, and user
    // clicks the notification -> tab opens -> fireNotification plays the sound
    registerSoundCallback('playWaterSound', fireNotification);

    // Also listen for the custom window event dispatched by swManager
    const handleSwWater = (e) => fireNotification(e.detail);
    window.addEventListener('medivault_sw_water', handleSwWater);

    return () => {
      window.removeEventListener('medivault_sw_water', handleSwWater);
    };
  }, [fireNotification]);

  /* ── REMINDER CHECKER (when tab IS open) ── */
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!remindersOn || reminders.length === 0) return;

    intervalRef.current = setInterval(() => {
      const now             = new Date();
      const currentTotalMin = now.getHours() * 60 + now.getMinutes();
      const todayStr        = now.toISOString().split('T')[0];

      let needsSave        = false;
      let updatedReminders = [...reminders];

      updatedReminders.forEach((r, idx) => {
        if (!r.enabled) return;
        const [rh, rm] = r.time24.split(':').map(Number);
        const rMin     = rh * 60 + rm;
        const diff     = currentTotalMin - rMin;

        if (diff >= 0 && diff <= 5 && r.lastTriggered !== todayStr) {
          fireNotification(r);
          needsSave = true;
          updatedReminders[idx] = { ...r, lastTriggered: todayStr };
        }
      });

      if (needsSave) setReminders(updatedReminders);
    }, 10000);

    return () => clearInterval(intervalRef.current);
  }, [reminders, remindersOn, fireNotification]);

  /* ── ADD WATER LOG ── */
  function addWater(amount, drinkName = 'Water') {
    let color = null;
    if (drinkName !== 'Water') {
      const juice = JUICE_DATA.find(j => j.name === drinkName);
      if (juice) color = juice.color;
    }
    const entry = { id: Date.now(), amount, drinkName, color, time: TIME_NOW(), ts: Date.now() };
    setTodayLogs(prev => [...prev, entry]);
    setAnimateAdd(true);
    playWaterSound();
    recordDailyActivity(user, 'water');
    setTimeout(() => setAnimateAdd(false), 700);
  }

  /* ── DELETE LOG ── */
  function deleteLog(id) {
    setTodayLogs(prev => prev.filter(l => l.id !== id));
  }

  /* ── ADD REMINDER ── */
  function addReminder() {
    const [h, m] = newReminderTime.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    const display = `${h12}:${String(m).padStart(2, '0')} ${period}`;
    const already = reminders.find(r => r.time24 === newReminderTime);
    if (already) return;
    setReminders(prev => [...prev, { id: Date.now(), time24: newReminderTime, time: display, enabled: true }]);
    setShowReminderModal(false);
  }

  function toggleReminder(id) {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }

  function deleteReminder(id) {
    setReminders(prev => prev.filter(r => r.id !== id));
  }

  /* ── COMBINED CALCULATOR ── */
  function calculateAll() {
    const w = parseFloat(calcWeight);
    if (!w || w <= 0) return;
    
    // 1. Water Calculation
    const ml = Math.round(w * 35); 
    setCalcResult({ ml, liters: (ml / 1000).toFixed(1), weight: w });

    // 2. Juice Calculation (Hydration & Electrolytes focus)
    let matches = JUICE_DATA.filter(j => 
      j.uses.toLowerCase().includes('hydration') || 
      j.electrolytes.includes('High') || 
      j.electrolytes.includes('Very high') ||
      j.imp
    );
    
    // Sort to prioritize highest electrolytes and importance
    matches.sort((a,b) => {
       const aScore = (a.imp ? 2 : 0) + (a.electrolytes.includes('Very high') ? 2 : (a.electrolytes.includes('High') ? 1 : 0));
       const bScore = (b.imp ? 2 : 0) + (b.electrolytes.includes('Very high') ? 2 : (b.electrolytes.includes('High') ? 1 : 0));
       return bScore - aScore;
    });

    // Pick top 3 and randomise slightly among top 6
    const topChoices = matches.slice(0, 6).sort(() => 0.5 - Math.random()).slice(0, 3);
    setCalcJuiceResults({ matches: topChoices });
  }

  /* ── QUICK AMOUNT OPTIONS ── */
  const quickAmounts = [150, 200, 250, 350, 500];

  /* ── HISTORY SORTED ── */
  const historyDays = Object.entries(history)
    .filter(([k]) => k !== todayKey)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 30);

  const maxHistoryTotal = Math.max(...historyDays.map(([, v]) => v.total || 0), target);

  /* ── STREAK CALCULATION ── */
  function calcStreak() {
    let streak = 0;
    const allDays = Object.entries(history).sort(([a], [b]) => b.localeCompare(a));
    for (const [, v] of allDays) {
      if ((v.total || 0) >= (v.target || target)) streak++;
      else break;
    }
    return streak;
  }

  /* ── NEXT REMINDER ── */
  function nextReminder() {
    if (!reminders.length) return null;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const upcoming = reminders
      .filter(r => r.enabled)
      .map(r => {
        const [h, m] = r.time24.split(':').map(Number);
        const totalMin = h * 60 + m;
        return { ...r, diff: totalMin >= nowMin ? totalMin - nowMin : 1440 - nowMin + totalMin };
      })
      .sort((a, b) => a.diff - b.diff);
    return upcoming[0] || null;
  }

  const next = nextReminder();

  /* ─── RENDER ─── */
  return (
    <div className="dw-root">
      {/* ── NOTIFICATION POPUP ── */}
      {showNotifPopup && (
        <div className="dw-popup-notif animate-slide-in">
          <div className="dw-popup-icon">💧</div>
          <div className="dw-popup-msg">{popupMsg}</div>
          <button className="dw-popup-close" onClick={() => setShowNotifPopup(false)}><X size={16} /></button>
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="dw-header">
        <div className="dw-header-left">
          <div className="dw-header-icon">
            <Droplets size={28} />
          </div>
          <div>
            <h1 className="dw-title">{dt('active')} <span>{dt('drinkingWater')}</span></h1>
            <p className="dw-subtitle">{dt('subtitle')}</p>
          </div>
        </div>
        <div className="dw-header-actions">
          <SectionAbout
            title={dt('drinkingWater')}
            icon="💧"
            color="#0ea5e9"
            gradient="linear-gradient(135deg, #0ea5e9, #06b6d4)"
            what={dt('aboutWhat')}
            howToUse={dt('aboutHow')}
            importance={dt('aboutWhy')}
            style={{ position: 'static', margin: 0 }}
          />
          <button
            className={`dw-notif-btn ${remindersOn ? 'active' : ''}`}
            onClick={async () => {
              if (!remindersOn) {
                const perm = await requestNotifPermission();
                if (perm === 'granted' || perm === 'default') setRemindersOn(true);
              } else {
                setRemindersOn(false);
              }
            }}
            title={remindersOn ? dt('remToggleOnTitle') : dt('remToggleOffTitle')}
            id="dw-toggle-reminders"
          >
            {remindersOn ? <Bell size={20} /> : <BellOff size={20} />}
            <span>{remindersOn ? dt('remindersOn') : dt('remindersOff')}</span>
          </button>
          <button className="dw-target-btn" onClick={() => { setTargetInput(target); setShowTargetModal(true); }} id="dw-add-target">
            <Target size={18} /> {dt('addTarget')}
          </button>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="dw-tabs">
        {[
          { id: 'home', icon: <Droplets size={18} />, label: dt('tabToday') },
          { id: 'reminders', icon: <Bell size={18} />, label: dt('tabReminders') },
          { id: 'history', icon: <History size={18} />, label: dt('tabHistory') },
          { id: 'calculator', icon: <Calculator size={18} />, label: dt('tabCalculator') },
          { id: 'juices', icon: <Droplets size={18} style={{ color: '#06b6d4' }}/>, label: dt('tabJuices') },
        ].map(tab => (
          <button
            key={tab.id}
            className={`dw-tab dw-tab-${tab.id} ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            id={`dw-tab-${tab.id}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════ HOME TAB ══════════════ */}
      {activeTab === 'home' && (
        <div className="dw-home">
          {/* Top stats strip */}
          <div className="dw-stats-strip">
            <div className="dw-stat drank-today">
              <span className="dw-stat-num">{(totalDrank / 1000).toFixed(2)}{dt('liters')}</span>
              <span className="dw-stat-label">{dt('drankToday')}</span>
            </div>
            <div className="dw-stat remaining">
              <span className="dw-stat-num">{((target - totalDrank) > 0 ? ((target - totalDrank) / 1000).toFixed(2) : 0)}{dt('liters')}</span>
              <span className="dw-stat-label">{dt('remaining')}</span>
            </div>
            <div className="dw-stat daily-target dw-stat-editable" title="Click ✏ to edit daily limit">
              {editingTarget ? (
                <div className="dw-inline-edit">
                  <button
                    className="dw-inline-btn minus"
                    onClick={() => setInlineTarget(v => Math.max(250, v - 50))}
                    id="dw-target-decrease"
                    title={dt('decreaseTitle')}
                  >−</button>
                  <div className="dw-inline-value-wrap">
                    <input
                      className="dw-inline-input"
                      type="number"
                      value={inlineTarget}
                      min={250} max={6000} step={50}
                      onChange={e => setInlineTarget(Math.max(250, Math.min(6000, Number(e.target.value))))}
                      id="dw-inline-target-input"
                      autoFocus
                    />
                    <span className="dw-inline-unit">{dt('ml')}</span>
                  </div>
                  <button
                    className="dw-inline-btn plus"
                    onClick={() => setInlineTarget(v => Math.min(6000, v + 50))}
                    id="dw-target-increase"
                    title={dt('increaseTitle')}
                  >+</button>
                  <button
                    className="dw-inline-btn confirm"
                    onClick={() => { setTarget(inlineTarget); setEditingTarget(false); }}
                    id="dw-inline-target-confirm"
                    title="Save"
                  ><Check size={14}/></button>
                  <button
                    className="dw-inline-btn cancel"
                    onClick={() => { setInlineTarget(target); setEditingTarget(false); }}
                    title="Cancel"
                  ><X size={14}/></button>
                </div>
              ) : (
                <>
                  <span className="dw-stat-num">{(target / 1000).toFixed(1)}{dt('liters')}</span>
                  <span className="dw-stat-label">{dt('dailyTarget')}</span>
                  <button
                    className="dw-edit-limit-btn"
                    onClick={() => { setInlineTarget(target); setEditingTarget(true); }}
                    id="dw-edit-daily-limit"
                    title={dt('editBtn')}
                  >
                    {dt('editBtn')}
                  </button>
                </>
              )}
            </div>
            <div className="dw-stat streak">
              <Flame size={18} className="streak-icon" />
              <span className="dw-stat-num">{calcStreak()}</span>
              <span className="dw-stat-label">{dt('dayStreak')}</span>
            </div>
          </div>

          <div className="dw-home-grid">
            {/* Bottle */}
            <div className="dw-bottle-card">
              <div className={`dw-bottle-wrap ${animateAdd ? 'pop' : ''}`}>
                <WaterBottle percent={percent} />
              </div>
              <div className="dw-bottle-info">
                <div className="dw-progress-label">
                  <span>{totalDrank} {dt('ml')}</span>
                  <span>/ {target} {dt('ml')}</span>
                </div>
                <div className="dw-progress-bar-wrap">
                  <div className="dw-progress-bar" style={{ width: `${Math.min(100, percent)}%` }} />
                </div>
                {percent >= 100 && (
                  <div className="dw-goal-badge">{dt('dailyGoalAchieved')}</div>
                )}
                {next && (
                  <div className="dw-next-reminder">
                    <Clock size={14} />
                    {dt('nextReminder')} <strong>{next.time}</strong>
                    {next.diff < 60 ? ` (${next.diff} ${dt('ml') === 'ml' ? 'min' : dt('ml') === 'మిలీ' ? 'నిమి' : dt('ml') === 'मिली' ? 'मिन' : 'min'})` : ` (${Math.floor(next.diff / 60)}h ${next.diff % 60}m)`}
                  </div>
                )}
              </div>
              {/* Quick add */}
              <div className="dw-quick-amounts">
                {quickAmounts.map(amt => (
                  <button key={amt} className="dw-quick-btn" onClick={(e) => { addRipple(e); addWater(amt); }} id={`dw-quick-${amt}`}>
                    {ripples.map(r => <span key={r.id} className="ripple" style={{ left: r.x, top: r.y }} />)}
                    +{amt}{dt('ml')}
                  </button>
                ))}
                <button className="dw-quick-btn custom" onClick={() => setShowAddModal(true)} id="dw-custom-add">
                  <Plus size={16} /> {dt('custom')}
                </button>
              </div>
            </div>

            {/* Today's log */}
            <div className="dw-log-card">
              <div className="dw-log-header">
                <h2><Droplets size={20} /> {dt('todayLogTitle')}</h2>
                <span className="dw-log-count">{todayLogs.length} {dt('entries')}</span>
              </div>
              {todayLogs.length === 0 ? (
                <div className="dw-empty-log">
                  <Droplets size={48} className="dw-empty-icon" />
                  <p>{dt('noWaterLogged')}</p>
                  <small>{dt('tapQuickAdd')}</small>
                </div>
              ) : (
                <div className="dw-log-list">
                  {[...todayLogs].reverse().map((log, i) => (
                    <div 
                      key={log.id} 
                      className="dw-log-item" 
                      style={{ 
                        animationDelay: `${i * 0.05}s`,
                        background: log.color ? `${log.color}08` : undefined,
                        borderLeft: log.color ? `4px solid ${log.color}` : '4px solid var(--primary)',
                        paddingLeft: '12px'
                      }}
                    >
                      <div className="dw-log-info">
                        <span className="dw-log-amount" style={{ color: log.color || 'inherit', fontWeight: log.color ? '800' : '700' }}>
                          {log.amount} {dt('ml')} {log.drinkName && log.drinkName !== 'Water' && (
                            <span style={{ fontSize: '0.8rem', opacity: 0.8, marginLeft: '6px', fontWeight: '600' }}>
                              ({getJuiceName(log.drinkName)})
                            </span>
                          )}
                        </span>
                        <span className="dw-log-time">{log.time}</span>
                      </div>
                      <button className="dw-log-delete" onClick={() => deleteLog(log.id)} title={dt('removeEntry')}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ REMINDERS TAB ══════════════ */}
      {activeTab === 'reminders' && (
        <div className="dw-reminders">
          <div className="dw-remind-header">
            <div>
              <h2>💧 {dt('hydrationReminders')}</h2>
              <p>{dt('remindersDesc')}</p>
            </div>
            <button className="dw-target-btn" onClick={() => setShowReminderModal(true)} id="dw-add-reminder">
              <Plus size={18} /> {dt('addReminderTime')}
            </button>
          </div>

          {/* Permission banner */}
          {notifPermission !== 'granted' && (
            <div className="dw-perm-banner">
              <Bell size={20} />
              <span>{lang === 'te' ? 'మీరు నీరు త్రాగాల్సిన సమయంలో డెస్క్‌టాప్ హెచ్చరికలను పొందడానికి బ్రౌజర్ నోటిఫिकేషన్‌లను ప్రారంభించండి!' : lang === 'hi' ? 'पीने का समय होने पर डेस्कटॉप अलर्ट प्राप्त करने के लिए ब्राउज़र सूचनाएं सक्षम करें!' : lang === 'eu' ? '¡Habilite las notificaciones del navegador para recibir alertas de escritorio cuando sea el momento de beber!' : 'Enable browser notifications to get desktop alerts when it is time to drink!'}</span>
              <button onClick={requestNotifPermission} className="dw-perm-btn">{lang === 'te' ? 'ఇప్పుడే ప్రారంభించు' : lang === 'hi' ? 'अभी सक्षम करें' : lang === 'eu' ? 'Habilitar Ahora' : 'Enable Now'}</button>
            </div>
          )}

          {/* Reminders toggle */}
          <div className="dw-remind-toggle-row">
            <div>
              <strong>{lang === 'te' ? 'రిమైండర్ నోటిఫికేషన్లు' : lang === 'hi' ? 'रिमाइंडर सूचनाएं' : lang === 'eu' ? 'Notificaciones de Recordatorio' : 'Reminder Notifications'}</strong>
              <p>{lang === 'te' ? 'బ్రౌజర్ నోటిఫికేషన్ + నీటి సౌండ్ + స్క్రీన్ పైన పాపప్ అవుతుంది' : lang === 'hi' ? 'ब्राउज़र अधिसूचना + पानी की ध्वनि + ऑन-स्क्रीन पॉपअप सक्रिय करता है' : lang === 'eu' ? 'Activa notificación de navegador + sonido de agua + ventana emergente' : 'Fires browser notification + water sound + on-screen popup'}</p>
            </div>
            <div
              className={`dw-toggle ${remindersOn ? 'on' : ''}`}
              onClick={async () => {
                if (!remindersOn) { const p = await requestNotifPermission(); if (p === 'granted') setRemindersOn(true); }
                else setRemindersOn(false);
              }}
              role="switch" aria-checked={remindersOn} id="dw-toggle-switch"
            >
              <div className="dw-toggle-knob" />
            </div>
          </div>

          {/* 40-min hint */}
          <div className="dw-hint-strip">
            <Clock size={16} />
            <span><strong>{lang === 'te' ? 'సిఫార్సు చేయబడింది:' : lang === 'hi' ? 'अनुशंसित:' : lang === 'eu' ? 'Recomendado:' : 'Recommended:'}</strong> {lang === 'te' ? 'గరిష్ట హైడ్రేషన్ కోసం రోజంతా ప్రతి 40 నిమిషాలకు రిమైండర్‌లను సెట్ చేయండి.' : lang === 'hi' ? 'इष्टतम जलयोजन के लिए दिन भर हर 40 मिनट पर रिमाइंडर सेट करें।' : lang === 'eu' ? 'Establece recordatorios cada 40 minutos durante el día para una hidratación óptima.' : 'Set reminders every 40 minutes throughout the day for optimal hydration.'}</span>
          </div>

          {reminders.length === 0 ? (
            <div className="dw-empty-remind">
              <Bell size={52} />
              <p>{lang === 'te' ? 'రిమైండర్‌లు ఏవీ సెట్ చేయలేదు.' : lang === 'hi' ? 'कोई रिमाइंडर सेट नहीं है।' : lang === 'eu' ? 'No hay recordatorios establecidos.' : 'No reminders set yet.'}</p>
              <small>{lang === 'te' ? 'నీరు త్రాగడానికి నోటిఫై పొందడానికి సమయాలను జోడించండి.' : lang === 'hi' ? 'पानी पीने के लिए सूचित होने हेतु समय जोड़ें।' : lang === 'eu' ? 'Añade horas para recibir notificaciones de cuándo beber agua.' : 'Add times to get notified when to drink water.'}</small>
            </div>
          ) : (
            <div className="dw-remind-list">
              {reminders.sort((a, b) => a.time24.localeCompare(b.time24)).map((r, i) => {
                const now = new Date();
                const nowMin = now.getHours() * 60 + now.getMinutes();
                const [rh, rm] = r.time24.split(':').map(Number);
                const rMin = rh * 60 + rm;
                const diff = rMin >= nowMin ? rMin - nowMin : 1440 - nowMin + rMin;
                return (
                  <div key={r.id} className={`dw-remind-item ${r.enabled ? '' : 'disabled'}`} style={{ animationDelay: `${i * 0.07}s` }}>
                    <div className="dw-remind-time-block">
                      <Clock size={18} />
                      <span className="dw-remind-time">{r.time}</span>
                    </div>
                    <div className="dw-remind-meta">
                      {r.enabled ? (
                        <span className="dw-remind-countdown">
                          {diff < 60 ? `${diff} ${lang === 'te' ? 'నిమిషాల్లో' : lang === 'hi' ? 'मिनट में' : lang === 'eu' ? 'min restantes' : 'min away'}` : `${Math.floor(diff / 60)}h ${diff % 60}m ${lang === 'te' ? 'తర్వాత' : lang === 'hi' ? 'में' : lang === 'eu' ? 'restantes' : 'away'}`}
                        </span>
                      ) : <span className="dw-remind-off">{lang === 'te' ? 'ఆపివేయబడింది' : lang === 'hi' ? 'रोका गया' : lang === 'eu' ? 'Pausado' : 'Paused'}</span>}
                    </div>
                    <div className="dw-remind-actions">
                      <div
                        className={`dw-toggle sm ${r.enabled ? 'on' : ''}`}
                        onClick={() => toggleReminder(r.id)}
                        role="switch" aria-checked={r.enabled}
                      >
                        <div className="dw-toggle-knob" />
                      </div>
                      <button className="dw-log-delete" onClick={() => deleteReminder(r.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Test notification button */}
          <button className="dw-test-notif-btn" onClick={() => fireNotification({ time: 'Test' })} id="dw-test-notification">
            <Volume2 size={18} /> {dt('testNotifBtn')}
          </button>
        </div>
      )}

      {/* ══════════════ HISTORY TAB ══════════════ */}
      {activeTab === 'history' && (
        <div className="dw-history">
          <div className="dw-history-header">
            <h2><BarChart2 size={22} /> {lang === 'te' ? 'రోజువారీ చరిత్ర' : lang === 'hi' ? 'दिन-प्रतिदिन का इतिहास' : lang === 'eu' ? 'Historial Día a Día' : 'Day-by-Day History'}</h2>
            <p>{lang === 'te' ? 'గత 30 రోజులలో మీ హైడ్రేషన్ ప్రయాణం' : lang === 'hi' ? 'पिछले 30 दिनों में आपकी जलयोजन यात्रा' : lang === 'eu' ? 'Tu viaje de hidratación en los últimos 30 días' : 'Your hydration journey over the past 30 days'}</p>
          </div>

          {/* Graph */}
          <div className="dw-graph-card">
            <h3 className="dw-graph-title">{lang === 'te' ? 'నీటి వినియోగం — గత 14 రోజులు' : lang === 'hi' ? 'पानी का का सेवन — पिछले 14 दिन' : lang === 'eu' ? 'Ingesta de Agua — Últimos 14 Días' : 'Water Intake — Last 14 Days'}</h3>
            <div className="dw-graph-wrap">
              {(() => {
                const localeMap = { en: 'en-US', te: 'te-IN', hi: 'hi-IN', eu: 'es-ES' };
                const currentLocale = localeMap[lang] || 'en-US';
                const days14 = [];
                for (let i = 13; i >= 0; i--) {
                  const d = new Date(); d.setDate(d.getDate() - i);
                  const k = d.toLocaleDateString('en-CA');
                  const label = d.toLocaleDateString(currentLocale, { month: 'short', day: 'numeric' });
                  const val = history[k]?.total || 0;
                  days14.push({ k, label, val });
                }
                const maxVal = Math.max(...days14.map(d => d.val), target);
                return days14.map((d, i) => {
                  const pct = maxVal > 0 ? (d.val / maxVal) * 100 : 0;
                  const met = d.val >= target;
                  return (
                    <div key={d.k} className="dw-bar-group" style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className="dw-bar-tooltip">{d.val ? `${(d.val/1000).toFixed(2)}${dt('liters')}` : '–'}</div>
                      <div className="dw-bar-outer">
                        <div
                          className={`dw-bar-inner ${met ? 'met' : ''}`}
                          style={{ height: `${pct}%` }}
                        />
                        {target > 0 && (
                          <div className="dw-target-line" style={{ bottom: `${(target / maxVal) * 100}%` }} title={`Target: ${(target/1000).toFixed(1)}${dt('liters')}`} />
                        )}
                      </div>
                      <span className="dw-bar-label">{d.label.split(' ')[1]}<br /><small>{d.label.split(' ')[0]}</small></span>
                    </div>
                  );
                });
              })()}
            </div>
            <div className="dw-graph-legend">
              <span className="leg met" /> {lang === 'te' ? 'లక్ష్యం చేరినవి' : lang === 'hi' ? 'लक्ष्य पूरा किया' : lang === 'eu' ? 'Objetivo cumplido' : 'Met target'}
              <span className="leg" /> {lang === 'te' ? 'లక్ష్యం కంటే తక్కువ' : lang === 'hi' ? 'लक्ष्य से कम' : lang === 'eu' ? 'Bajo el objetivo' : 'Below target'}
              <span className="leg line" /> {lang === 'te' ? 'లక్ష్య రేఖ' : lang === 'hi' ? 'लक्ष्य रेखा' : lang === 'eu' ? 'Línea de objetivo' : 'Target line'}
            </div>
          </div>

          {/* Day list */}
          <div className="dw-hist-list">
            {/* Today */}
            <div className="dw-hist-item today">
              <div className="dw-hist-date">
                <span className="dw-hist-day">{lang === 'te' ? 'ఈరోజు' : lang === 'hi' ? 'आज' : lang === 'eu' ? 'Hoy' : 'Today'}</span>
                <span className="dw-hist-full">{new Date().toLocaleDateString(lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : lang === 'eu' ? 'es-ES' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              </div>
              <MiniBar value={totalDrank} max={target} />
              <div className="dw-hist-total">
                <span className={totalDrank >= target ? 'met' : ''}>{(totalDrank / 1000).toFixed(2)}{dt('liters')}</span>
                <small>/ {(target / 1000).toFixed(1)}{dt('liters')}</small>
              </div>
              {totalDrank >= target && <span className="dw-hist-badge">✓ {lang === 'te' ? 'లక్ష్యం' : lang === 'hi' ? 'लक्ष्य' : lang === 'eu' ? 'Objetivo' : 'Goal'}</span>}
            </div>

            {historyDays.length === 0 ? (
              <div className="dw-empty-log" style={{ marginTop: '2rem' }}>
                <History size={48} className="dw-empty-icon" />
                <p>{lang === 'te' ? 'ఇంకా ఎలాంటి గత చరిత్ర లేదు.' : lang === 'hi' ? 'दिखाने के लिए अभी तक कोई पुराना इतिहास नहीं है।' : lang === 'eu' ? 'Aún no hay historial pasado para mostrar.' : 'No past history to show yet.'}</p>
                <small>{lang === 'te' ? 'రోజువారీ నీటిని లాగ్ చేస్తూ ఉండండి మరియు మీ చరిత్ర ఇక్కడ కనిపిస్తుంది.' : lang === 'hi' ? 'रोजाना पानी लॉग करते रहें और आपका इतिहास यहां दिखाई देगा।' : lang === 'eu' ? 'Sigue registrando agua diariamente y tu historial aparecerá aquí.' : 'Keep logging water daily and your history will appear here.'}</small>
              </div>
            ) : historyDays.map(([key, val]) => {
              const d = new Date(key + 'T00:00:00');
              const dayTotal = val.total || 0;
              const dayTarget = val.target || target;
              const met = dayTotal >= dayTarget;
              return (
                <div key={key} className={`dw-hist-item ${met ? 'met' : ''}`}>
                  <div className="dw-hist-date">
                    <span className="dw-hist-day">{d.toLocaleDateString(lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : lang === 'eu' ? 'es-ES' : 'en-US', { weekday: 'short' })}</span>
                    <span className="dw-hist-full">{d.toLocaleDateString(lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : lang === 'eu' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <MiniBar value={dayTotal} max={maxHistoryTotal} />
                  <div className="dw-hist-total">
                    <span className={met ? 'met' : ''}>{(dayTotal / 1000).toFixed(2)}{dt('liters')}</span>
                    <small>/ {(dayTarget / 1000).toFixed(1)}{dt('liters')}</small>
                  </div>
                  {met && <span className="dw-hist-badge">✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════ CALCULATOR TAB ══════════════ */}
      {activeTab === 'calculator' && (
        <div className="dw-calculator">
          <div className="dw-calc-card">
            <div className="dw-calc-icon">💧</div>
            <h2>{dt('smartCalculator')}</h2>
            <p>{dt('calcDesc')}</p>
            <div className="dw-calc-form">
              <label htmlFor="dw-weight-input">{dt('bodyWeight')}</label>
              <div className="dw-calc-input-row" style={{ maxWidth: '300px' }}>
                <input
                  id="dw-weight-input"
                  type="number"
                  className="dw-calc-input"
                  placeholder="e.g. 70"
                  value={calcWeight}
                  onChange={e => setCalcWeight(e.target.value)}
                  min="10" max="300"
                />
                <span className="dw-calc-unit">kg</span>
              </div>
              <button className="dw-calc-btn" onClick={calculateAll} id="dw-calculate-btn">
                <Calculator size={18} /> {dt('calcNow')}
              </button>
            </div>
            {calcResult && (
              <div className="dw-calc-result animate-pop" style={{ marginTop: '2rem' }}>
                <h3 style={{ color: '#0ea5e9', marginBottom: '1rem', fontSize: '1.2rem', fontWeight: '800' }}>{dt('waterIntakeGoal')}</h3>
                <div className="dw-calc-res-main">
                  <span className="dw-calc-res-liters">{calcResult.liters} {dt('liters')}</span>
                  <span className="dw-calc-res-ml">= {calcResult.ml} {dt('ml')} {dt('perDay')}</span>
                </div>
                <p className="dw-calc-res-note">
                  {dt('basedOn')} <strong>{calcResult.weight} kg</strong> {dt('basedOnDesc')}
                </p>
                <div className="dw-calc-breakdown">
                  <div className="dw-calc-bk-item"><span>{dt('morning')}</span><strong>{Math.round(calcResult.ml * 0.35)} {dt('ml')}</strong></div>
                  <div className="dw-calc-bk-item"><span>{dt('afternoon')}</span><strong>{Math.round(calcResult.ml * 0.35)} {dt('ml')}</strong></div>
                  <div className="dw-calc-bk-item"><span>{dt('evening')}</span><strong>{Math.round(calcResult.ml * 0.30)} {dt('ml')}</strong></div>
                </div>
                <button
                  className="dw-calc-set-btn"
                  onClick={() => { setTarget(calcResult.ml); setActiveTab('home'); }}
                  id="dw-set-as-target"
                >
                  <Check size={18} /> {dt('setAsDailyTarget')}
                </button>
              </div>
            )}
            {calcJuiceResults && (
              <div className="jc-results animate-pop" style={{ marginTop: '2rem', background: 'rgba(6, 182, 212, 0.05)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                <h3 style={{ color: '#0891b2', marginBottom: '1rem', fontSize: '1.2rem', fontWeight: '800', borderBottom: '2px solid rgba(8, 145, 178, 0.2)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🍹</span> {dt('recommendedJuices')}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{dt('recommendedJuicesDesc').replace('{weight}', calcResult.weight)}</p>
                <div className="jc-matches-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  {calcJuiceResults.matches.map((j, idx) => (
                      <div key={idx} className="jc-match-card" style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '12px', borderLeft: `5px solid ${j.color}`, boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                        <div className="jc-match-name" style={{ color: j.color, fontWeight: '800', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{getJuiceName(j.name)} {j.imp && '⭐'}</div>
                        <div className="jc-match-stats" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.5rem' }}>
                          <span>⚡ <strong>{getJuiceElectrolytes(j.electrolytes).replace(/⭐/g,'').trim()}</strong></span>
                          <span>🔥 {j.kcal} {dt('ml') === 'ml' ? 'kcal' : dt('ml') === 'మిలీ' ? 'కిలో క్యాలరీలు' : dt('ml') === 'मिली' ? 'किलो कैलोरी' : 'kcal'}</span>
                        </div>
                        <div className="jc-match-uses" style={{ fontSize: '0.8rem', background: 'rgba(0,0,0,0.03)', padding: '0.4rem', borderRadius: '6px' }}>{lang === 'te' ? 'ఉపయోగాలు: ' : lang === 'hi' ? 'उपयोग: ' : lang === 'eu' ? 'Usos: ' : 'Uses: '}{getJuiceUses(j.uses)}</div>
                        <button className="jc-add-today-btn" 
                          style={{ marginTop: '0.8rem', width: '100%', background: `${j.color}22`, color: j.color, border: `1px solid ${j.color}`, padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                          onClick={() => { addWater(250, j.name); setActiveTab('home'); }}>
                          <Plus size={14} style={{ display: 'inline', marginRight: '4px' }}/> {dt('add250ml')}
                        </button>
                      </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reference table */}
          <div className="dw-ref-table-card">
            <h3>{dt('quickReference')}</h3>
            <table className="dw-ref-table">
              <thead><tr><th>{dt('weightKg')}</th><th>{dt('dailyWaterL')}</th><th>{dt('dailyWaterMl')}</th></tr></thead>
              <tbody>
                {[40, 50, 60, 70, 80, 90, 100].map(w => (
                  <tr key={w} className={calcResult?.weight === w ? 'highlight' : ''}>
                    <td>{w} kg</td>
                    <td>{(w * 35 / 1000).toFixed(1)} {dt('liters')}</td>
                    <td>{w * 35} {dt('ml')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════ FRUIT JUICES TAB ══════════════ */}
      {activeTab === 'juices' && (
        <div className="dw-juices">
          {/* Master Juice Table (Water themed) */}
          <div className="dw-ref-table-card">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0284c7' }}>
              <span style={{ fontSize: '2rem' }}>🌊</span> {dt('compJuiceGuide')}
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{dt('compJuiceGuideDesc')}</p>
            <div className="jc-table-container">
              <table className="jc-table">
                <thead>
                  <tr>
                    <th>{dt('sNo')}</th>
                    <th>{dt('fruitJuice')}</th>
                    <th>{dt('energyKcal')}</th>
                    <th>{dt('proteinG')}</th>
                    <th>{dt('electroApprox')}</th>
                    <th>{dt('topUses')}</th>
                    <th>{dt('action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {JUICE_DATA.map(j => (
                    <tr key={j.no} className="jc-tr" style={{ '--jc-accent': j.color }}>
                      <td className="jc-sno">{j.no}</td>
                      <td className="jc-name">
                        <div className="jc-name-badge" style={{ background: `${j.color}15`, color: j.color, borderColor: `${j.color}40`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img
                            src={j.img}
                            alt={getJuiceName(j.name)}
                            style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', border: `2px solid ${j.color}40`, flexShrink: 0 }}
                            onError={e => { e.currentTarget.style.display='none'; }}
                          />
                          <strong>{getJuiceName(j.name)}</strong>
                          {j.imp && <span className="jc-imp-star" title="Highly Recommended">⭐</span>}
                        </div>
                      </td>
                      <td className="jc-kcal">{j.kcal}</td>
                      <td className="jc-protein">{j.protein}</td>
                      <td className="jc-electro">{getJuiceElectrolytes(j.electrolytes)}</td>
                      <td className="jc-uses">{getJuiceUses(j.uses)}</td>
                      <td>
                        <button className="jc-add-inline-btn" 
                           style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,0.2)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 'bold', fontSize: '0.75rem' }}
                           onClick={() => { addWater(250, j.name); setActiveTab('home'); }}>
                           {dt('addToday')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MODALS ══════════════ */}

      {/* TARGET MODAL */}
      {showTargetModal && (
        <div className="dw-modal-overlay" onClick={() => setShowTargetModal(false)}>
          <div className="dw-modal" onClick={e => e.stopPropagation()}>
            <div className="dw-modal-header">
              <h3><Target size={20} /> {dt('setWaterTarget')}</h3>
              <button onClick={() => setShowTargetModal(false)}><X size={20} /></button>
            </div>
            <div className="dw-modal-body">
              <label className="dw-modal-label">{dt('targetAmount')}</label>
              <input
                type="number"
                className="dw-modal-input"
                value={targetInput}
                onChange={e => setTargetInput(Number(e.target.value))}
                min="500" max="6000" step="50"
                id="dw-target-input"
              />
              <div className="dw-target-presets">
                {[1500, 2000, 2500, 3000, 3500].map(v => (
                  <button key={v} className={`dw-preset-btn ${targetInput === v ? 'active' : ''}`} onClick={() => setTargetInput(v)}>
                    {(v / 1000).toFixed(1)}{dt('liters')}
                  </button>
                ))}
              </div>
            </div>
            <div className="dw-modal-footer">
              <button className="dw-modal-cancel" onClick={() => setShowTargetModal(false)}>{dt('cancel')}</button>
              <button className="dw-modal-confirm" onClick={() => { setTarget(targetInput); setShowTargetModal(false); }} id="dw-confirm-target">
                <Check size={18} /> {dt('setTarget')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD WATER MODAL */}
      {showAddModal && (
        <div className="dw-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="dw-modal" onClick={e => e.stopPropagation()}>
            <div className="dw-modal-header">
              <h3><Droplets size={20} /> {dt('logCustomAmount')}</h3>
              <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <div className="dw-modal-body">
              <label className="dw-modal-label">{dt('targetAmount')}</label>
              <input
                type="number"
                className="dw-modal-input"
                value={customAmount}
                onChange={e => setCustomAmount(Number(e.target.value))}
                min="10" max="2000" step="10"
                id="dw-custom-amount-input"
              />
              <div className="dw-target-presets">
                {[100, 150, 200, 250, 300, 400, 500, 750, 1000].map(v => (
                  <button key={v} className={`dw-preset-btn ${customAmount === v ? 'active' : ''}`} onClick={() => setCustomAmount(v)}>
                    {v}{dt('ml')}
                  </button>
                ))}
              </div>
            </div>
            <div className="dw-modal-footer">
              <button className="dw-modal-cancel" onClick={() => setShowAddModal(false)}>{dt('cancel')}</button>
              <button className="dw-modal-confirm" onClick={() => { addWater(customAmount); setShowAddModal(false); }} id="dw-confirm-add">
                <Plus size={18} /> {dt('logWater')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REMINDER MODAL */}
      {showReminderModal && (
        <div className="dw-modal-overlay" onClick={() => setShowReminderModal(false)}>
          <div className="dw-modal" onClick={e => e.stopPropagation()}>
            <div className="dw-modal-header">
              <h3><Clock size={20} /> {dt('addWaterReminder')}</h3>
              <button onClick={() => setShowReminderModal(false)}><X size={20} /></button>
            </div>
            <div className="dw-modal-body">
              <label className="dw-modal-label">{dt('selectTime')}</label>
              <input
                type="time"
                className="dw-modal-input"
                value={newReminderTime}
                onChange={e => setNewReminderTime(e.target.value)}
                id="dw-reminder-time-input"
              />
              <div className="dw-hint-strip" style={{ marginTop: '1rem' }}>
                <Clock size={14} />
                <span>{lang === 'te' ? 'చిట్కా: మీరు మేల్కొనే సమయం మరియు పడుకునే సమయం మధ్య ప్రతి 40 నిమిషాలకు రిమైండర్‌లను జోడించండి.' : lang === 'hi' ? 'सुझाव: अपने जागने और सोने के समय के बीच हर 40 मिनट में रिमाइंडर जोड़ें।' : lang === 'eu' ? 'Consejo: Añade recordatorios cada 40 minutos entre la hora de despertarte y la de acostarte.' : 'Tip: Add reminders every 40 minutes between your wake-up and bedtime.'}</span>
              </div>
              {/* Quick 40-min schedule suggestion */}
              <div style={{ marginTop: '1rem' }}>
                <p className="dw-modal-label">{dt('quickSchedule')}</p>
                <div className="dw-target-presets" style={{ flexWrap: 'wrap' }}>
                  {Array.from({ length: 25 }, (_, i) => {
                    const totalMin = 6 * 60 + i * 40;
                    if (totalMin > 22 * 60) return null;
                    const h = Math.floor(totalMin / 60), m = totalMin % 60;
                    const val = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
                    return (
                      <button key={val} className={`dw-preset-btn sm ${newReminderTime === val ? 'active' : ''}`}
                        onClick={() => setNewReminderTime(val)}>
                        {val}
                      </button>
                    );
                  }).filter(Boolean)}
                </div>
              </div>
            </div>
            <div className="dw-modal-footer">
              <button className="dw-modal-cancel" onClick={() => setShowReminderModal(false)}>{dt('cancel')}</button>
              <button className="dw-modal-confirm" onClick={addReminder} id="dw-confirm-reminder">
                <Bell size={18} /> {lang === 'te' ? 'రిమైండర్‌ను జోడించు' : lang === 'hi' ? 'रिमाइंडर जोड़ें' : lang === 'eu' ? 'Añadir Recordatorio' : 'Add Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* SectionAbout moved inside the reminders toggle row */}
    </div>
  );
}
