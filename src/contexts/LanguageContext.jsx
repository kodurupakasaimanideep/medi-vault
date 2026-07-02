import { createContext, useContext, useState, useEffect } from 'react';

// ── Translation dictionary ────────────────────────────────────────────────────
export const TRANSLATIONS = {
  en: {
    // Nav / Sidebar
    dashboard: 'Dashboard',
    medicalSlips: 'Medical Slips',
    tabletsInfo: 'Tablets Info',
    dietPlan: 'Diet Plan',
    tabletAlarm: 'Tablet Alarm',
    drinkingWater: 'Drinking Water',
    yoga: 'Yoga',
    dietTimetable: 'Diet Timetable',
    calendarView: 'Health Calendar',
    consultation: 'Doctor Consultation',
    settings: 'Settings',
    temperature: 'Temperature Alert',
    logout: 'Logout',

    // Dashboard
    welcomeBack: 'Welcome back',
    healthOverview: 'Health Overview',
    todayActivity: "Today's Activity",
    streak: 'Streak',
    waterIntake: 'Water Intake',
    caloriesBurned: 'Calories Burned',
    yogaSession: 'Yoga Session',
    viewAll: 'View All',
    addRecord: 'Add Record',

    // Settings
    settingsTitle: 'Settings',
    loginCredentials: 'Login Credentials',
    websiteMail: 'Website & Mail',
    general: 'General',
    languages: 'Languages',
    timeManagement: 'Time Management',
    changePassword: 'Change Password',
    aboutMediVault: 'About MediVault',
    darkMode: 'Dark Mode',
    notifications: 'Notifications',
    locationAccess: 'Location Access',
    currentLanguage: 'Current Language',
    languageDesc: 'Select your preferred language for the MediVault interface.',

    // Language names
    langEnglish: 'English',
    langTelugu: 'Telugu',
    langHindi: 'Hindi',
    langEuropean: 'European (Español)',

    // Medical Slips
    newRecord: 'New Record',
    searchPatients: 'Search patients, conditions...',
    allSlips: 'All',
    important: 'Important',
    patientName: 'Patient Name',
    hospitalName: 'Hospital Name',
    condition: 'Condition / Reason',
    noRecordsFound: 'No Records Found',
    uploadSlip: 'Upload Slip',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    delete: 'Delete',
    preview: 'Preview',
    download: 'Download',
    edit: 'Edit',

    // Yoga
    beginSession: 'Begin Session',
    completed: 'Completed',
    locked: 'Locked',
    level: 'Level',
    duration: 'Duration',
    skip: 'Skip',
    close: 'Close',
    great: 'Great Work!',
    nextExercise: 'Next Exercise',

    // Water
    addWater: 'Add Water',
    dailyGoal: 'Daily Goal',
    consumed: 'Consumed',
    remaining: 'Remaining',
    glassAdded: 'Glass Added!',

    // Diet
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snacks: 'Snacks',
    calories: 'Calories',
    protein: 'Protein',
    carbs: 'Carbs',
    fats: 'Fats',

    // Calendar
    healthCalendar: 'Health Calendar',
    totalScore: 'Total Score',
    currentStreak: 'Current Streak',
    monthlyAnalysis: 'Monthly Analysis',
    perfectDays: 'Perfect Days',
    waterGoalsMet: 'Water Goals Met',
    yogaSessions: 'Yoga Sessions',
    dietTracked: 'Diet Tracked',
    overallAdherence: 'Overall adherence',
    excellent: 'Excellent!',
    goodProgress: 'Good progress!',
    keepGoing: 'Keep going!',

    // Consultation
    doctorConsultation: 'Doctor Consultation',
    doctorLogin: 'Doctor Login',
    userLogin: 'User / Patient Login',
    authenticate: 'Authenticate Doctor',
    loginAsPatient: 'Login as Patient',
    doctorUsername: 'Doctor Username',
    password: 'Password',
    demoCredentials: 'Demo credentials',
    endSession: 'End Session',
    overview: 'Overview',
    chat: 'Chat',
    activityOverview: 'Activity Overview',

    // Common
    back: 'Back',
    save: 'Save',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    confirm: 'Confirm',
    search: 'Search',
    filter: 'Filter',
    today: 'Today',
    week: 'Week',
    month: 'Month',
    year: 'Year',
    minutes: 'Minutes',
    hours: 'Hours',
    days: 'Days',
  },

  te: {
    // Nav / Sidebar
    dashboard: 'డాష్‌బోర్డ్',
    medicalSlips: 'వైద్య స్లిప్‌లు',
    tabletsInfo: 'మాత్రల సమాచారం',
    dietPlan: 'ఆహార ప్రణాళిక',
    tabletAlarm: 'మాత్ర అలారం',
    drinkingWater: 'మంచినీరు',
    yoga: 'యోగా',
    dietTimetable: 'ఆహార సమయపట్టిక',
    calendarView: 'ఆరోగ్య క్యాలెండర్',
    consultation: 'డాక్టర్ సంప్రదింపు',
    settings: 'సెట్టింగ్‌లు',
    temperature: 'ఉష్ణోగ్రత హెచ్చరిక',
    logout: 'లాగ్‌అవుట్',

    // Dashboard
    welcomeBack: 'స్వాగతం',
    healthOverview: 'ఆరోగ్య అవలోకనం',
    todayActivity: 'నేటి కార్యకలాపాలు',
    streak: 'స్ట్రీక్',
    waterIntake: 'నీటి వినియోగం',
    caloriesBurned: 'కాలరీలు వెచ్చించారు',
    yogaSession: 'యోగా సెషన్',
    viewAll: 'అన్నీ చూడండి',
    addRecord: 'రికార్డు జోడించు',

    // Settings
    settingsTitle: 'సెట్టింగ్‌లు',
    loginCredentials: 'లాగిన్ వివరాలు',
    websiteMail: 'వెబ్‌సైట్ & మెయిల్',
    general: 'సాధారణ',
    languages: 'భాషలు',
    timeManagement: 'సమయ నిర్వహణ',
    changePassword: 'పాస్‌వర్డ్ మార్చు',
    aboutMediVault: 'MediVault గురించి',
    darkMode: 'డార్క్ మోడ్',
    notifications: 'నోటిఫికేషన్‌లు',
    locationAccess: 'లొకేషన్ యాక్సెస్',
    currentLanguage: 'ప్రస్తుత భాష',
    languageDesc: 'MediVault ఇంటర్‌ఫేస్ కోసం మీకు ఇష్టమైన భాషను ఎంచుకోండి.',

    langEnglish: 'ఇంగ్లీష్',
    langTelugu: 'తెలుగు',
    langHindi: 'హిందీ',
    langEuropean: 'యూరోపియన్ (ఎస్పానోల్)',

    // Medical Slips
    newRecord: 'కొత్త రికార్డు',
    searchPatients: 'రోగులను, పరిస్థితులను వెతకండి...',
    allSlips: 'అన్నీ',
    important: 'ముఖ్యమైనవి',
    patientName: 'రోగి పేరు',
    hospitalName: 'ఆసుపత్రి పేరు',
    condition: 'పరిస్థితి / కారణం',
    noRecordsFound: 'రికార్డులు కనుగొనబడలేదు',
    uploadSlip: 'స్లిప్ అప్‌లోడ్ చేయండి',
    saveChanges: 'మార్పులు సేవ్ చేయండి',
    cancel: 'రద్దు చేయండి',
    delete: 'తొలగించు',
    preview: 'ప్రివ్యూ',
    download: 'డౌన్‌లోడ్',
    edit: 'సవరించు',

    // Yoga
    beginSession: 'సెషన్ ప్రారంభించు',
    completed: 'పూర్తయింది',
    locked: 'లాక్ చేయబడింది',
    level: 'స్థాయి',
    duration: 'వ్యవధి',
    skip: 'దాటవేయి',
    close: 'మూసివేయి',
    great: 'అద్భుతంగా చేశారు!',
    nextExercise: 'తదుపరి వ్యాయామం',

    // Water
    addWater: 'నీరు జోడించు',
    dailyGoal: 'రోజువారీ లక్ష్యం',
    consumed: 'తీసుకున్నారు',
    remaining: 'మిగిలింది',
    glassAdded: 'గ్లాసు జోడించబడింది!',

    // Diet
    breakfast: 'అల్పాహారం',
    lunch: 'మధ్యాహ్న భోజనం',
    dinner: 'రాత్రి భోజనం',
    snacks: 'స్నాక్స్',
    calories: 'కాలరీలు',
    protein: 'ప్రొటీన్',
    carbs: 'కార్బోహైడ్రేట్లు',
    fats: 'కొవ్వులు',

    // Calendar
    healthCalendar: 'ఆరోగ్య క్యాలెండర్',
    totalScore: 'మొత్తం స్కోరు',
    currentStreak: 'ప్రస్తుత స్ట్రీక్',
    monthlyAnalysis: 'నెలవారీ విశ్లేషణ',
    perfectDays: 'పర్‌ఫెక్ట్ రోజులు',
    waterGoalsMet: 'నీటి లక్ష్యాలు సాధించారు',
    yogaSessions: 'యోగా సెషన్‌లు',
    dietTracked: 'ఆహారం ట్రాక్ చేశారు',
    overallAdherence: 'మొత్తం పాటింపు',
    excellent: 'అద్భుతం!',
    goodProgress: 'మంచి పురోగతి!',
    keepGoing: 'కొనసాగండి!',

    // Consultation
    doctorConsultation: 'డాక్టర్ సంప్రదింపు',
    doctorLogin: 'డాక్టర్ లాగిన్',
    userLogin: 'యూజర్ / రోగి లాగిన్',
    authenticate: 'డాక్టర్‌ను ప్రమాణీకరించు',
    loginAsPatient: 'రోగిగా లాగిన్ అవ్వండి',
    doctorUsername: 'డాక్టర్ యూజర్‌నేమ్',
    password: 'పాస్‌వర్డ్',
    demoCredentials: 'డెమో వివరాలు',
    endSession: 'సెషన్ ముగించు',
    overview: 'అవలోకనం',
    chat: 'చాట్',
    activityOverview: 'కార్యకలాప అవలోకనం',

    // Common
    back: 'వెనుకకు',
    save: 'సేవ్ చేయి',
    loading: 'లోడ్ అవుతోంది...',
    success: 'విజయం',
    error: 'లోపం',
    confirm: 'నిర్ధారించు',
    search: 'వెతకు',
    filter: 'వడపోత',
    today: 'నేడు',
    week: 'వారం',
    month: 'నెల',
    year: 'సంవత్సరం',
    minutes: 'నిమిషాలు',
    hours: 'గంటలు',
    days: 'రోజులు',
  },

  hi: {
    // Nav / Sidebar
    dashboard: 'डैशबोर्ड',
    medicalSlips: 'मेडिकल स्लिप्स',
    tabletsInfo: 'टेबलेट जानकारी',
    dietPlan: 'आहार योजना',
    tabletAlarm: 'टेबलेट अलार्म',
    drinkingWater: 'पीने का पानी',
    yoga: 'योग',
    dietTimetable: 'आहार समय सारणी',
    calendarView: 'स्वास्थ्य कैलेंडर',
    consultation: 'डॉक्टर परामर्श',
    settings: 'सेटिंग्स',
    temperature: 'तापमान अलर्ट',
    logout: 'लॉगआउट',

    // Dashboard
    welcomeBack: 'वापस स्वागत है',
    healthOverview: 'स्वास्थ्य अवलोकन',
    todayActivity: 'आज की गतिविधि',
    streak: 'स्ट्रीक',
    waterIntake: 'पानी का सेवन',
    caloriesBurned: 'कैलोरी जलाई',
    yogaSession: 'योग सत्र',
    viewAll: 'सब देखें',
    addRecord: 'रिकॉर्ड जोड़ें',

    // Settings
    settingsTitle: 'सेटिंग्स',
    loginCredentials: 'लॉगिन क्रेडेंशियल',
    websiteMail: 'वेबसाइट और मेल',
    general: 'सामान्य',
    languages: 'भाषाएँ',
    timeManagement: 'समय प्रबंधन',
    changePassword: 'पासवर्ड बदलें',
    aboutMediVault: 'MediVault के बारे में',
    darkMode: 'डार्क मोड',
    notifications: 'सूचनाएं',
    locationAccess: 'स्थान पहुंच',
    currentLanguage: 'वर्तमान भाषा',
    languageDesc: 'MediVault इंटरफ़ेस के लिए अपनी पसंदीदा भाषा चुनें।',

    langEnglish: 'अंग्रेजी',
    langTelugu: 'तेलुगु',
    langHindi: 'हिंदी',
    langEuropean: 'यूरोपीय (एस्पेनोल)',

    // Medical Slips
    newRecord: 'नया रिकॉर्ड',
    searchPatients: 'मरीजों, स्थितियों को खोजें...',
    allSlips: 'सभी',
    important: 'महत्वपूर्ण',
    patientName: 'मरीज का नाम',
    hospitalName: 'अस्पताल का नाम',
    condition: 'स्थिति / कारण',
    noRecordsFound: 'कोई रिकॉर्ड नहीं मिला',
    uploadSlip: 'स्लिप अपलोड करें',
    saveChanges: 'परिवर्तन सहेजें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    preview: 'पूर्वावलोकन',
    download: 'डाउनलोड',
    edit: 'संपादित करें',

    // Yoga
    beginSession: 'सत्र शुरू करें',
    completed: 'पूर्ण',
    locked: 'लॉक्ड',
    level: 'स्तर',
    duration: 'अवधि',
    skip: 'छोड़ें',
    close: 'बंद करें',
    great: 'बेहतरीन काम!',
    nextExercise: 'अगला व्यायाम',

    // Water
    addWater: 'पानी जोड़ें',
    dailyGoal: 'दैनिक लक्ष्य',
    consumed: 'सेवन किया',
    remaining: 'शेष',
    glassAdded: 'गिलास जोड़ा!',

    // Diet
    breakfast: 'नाश्ता',
    lunch: 'दोपहर का खाना',
    dinner: 'रात का खाना',
    snacks: 'स्नैक्स',
    calories: 'कैलोरी',
    protein: 'प्रोटीन',
    carbs: 'कार्बोहाइड्रेट',
    fats: 'वसा',

    // Calendar
    healthCalendar: 'स्वास्थ्य कैलेंडर',
    totalScore: 'कुल स्कोर',
    currentStreak: 'वर्तमान स्ट्रीक',
    monthlyAnalysis: 'मासिक विश्लेषण',
    perfectDays: 'परफेक्ट दिन',
    waterGoalsMet: 'पानी के लक्ष्य पूरे हुए',
    yogaSessions: 'योग सत्र',
    dietTracked: 'आहार ट्रैक किया',
    overallAdherence: 'समग्र अनुपालन',
    excellent: 'उत्कृष्ट!',
    goodProgress: 'अच्छी प्रगति!',
    keepGoing: 'जारी रखें!',

    // Consultation
    doctorConsultation: 'डॉक्टर परामर्श',
    doctorLogin: 'डॉक्टर लॉगिन',
    userLogin: 'यूज़र / मरीज लॉगिन',
    authenticate: 'डॉक्टर को प्रमाणित करें',
    loginAsPatient: 'मरीज के रूप में लॉगिन करें',
    doctorUsername: 'डॉक्टर यूज़रनेम',
    password: 'पासवर्ड',
    demoCredentials: 'डेमो क्रेडेंशियल',
    endSession: 'सत्र समाप्त करें',
    overview: 'अवलोकन',
    chat: 'चैट',
    activityOverview: 'गतिविधि अवलोकन',

    // Common
    back: 'वापस',
    save: 'सहेजें',
    loading: 'लोड हो रहा है...',
    success: 'सफलता',
    error: 'त्रुटि',
    confirm: 'पुष्टि करें',
    search: 'खोजें',
    filter: 'फ़िल्टर',
    today: 'आज',
    week: 'सप्ताह',
    month: 'महीना',
    year: 'साल',
    minutes: 'मिनट',
    hours: 'घंटे',
    days: 'दिन',
  },

  eu: {
    // Nav / Sidebar (Spanish)
    dashboard: 'Panel de Control',
    medicalSlips: 'Informes Médicos',
    tabletsInfo: 'Info de Medicamentos',
    dietPlan: 'Plan de Dieta',
    tabletAlarm: 'Alarma de Medicamentos',
    drinkingWater: 'Agua Potable',
    yoga: 'Yoga',
    dietTimetable: 'Horario de Dieta',
    calendarView: 'Calendario de Salud',
    consultation: 'Consulta Médica',
    settings: 'Configuración',
    temperature: 'Alerta de Temperatura',
    logout: 'Cerrar Sesión',

    // Dashboard
    welcomeBack: 'Bienvenido de vuelta',
    healthOverview: 'Resumen de Salud',
    todayActivity: 'Actividad de Hoy',
    streak: 'Racha',
    waterIntake: 'Consumo de Agua',
    caloriesBurned: 'Calorías Quemadas',
    yogaSession: 'Sesión de Yoga',
    viewAll: 'Ver Todo',
    addRecord: 'Añadir Registro',

    // Settings
    settingsTitle: 'Configuración',
    loginCredentials: 'Credenciales de Acceso',
    websiteMail: 'Web y Correo',
    general: 'General',
    languages: 'Idiomas',
    timeManagement: 'Gestión del Tiempo',
    changePassword: 'Cambiar Contraseña',
    aboutMediVault: 'Acerca de MediVault',
    darkMode: 'Modo Oscuro',
    notifications: 'Notificaciones',
    locationAccess: 'Acceso a Ubicación',
    currentLanguage: 'Idioma Actual',
    languageDesc: 'Selecciona tu idioma preferido para la interfaz de MediVault.',

    langEnglish: 'Inglés',
    langTelugu: 'Telugu',
    langHindi: 'Hindi',
    langEuropean: 'Europeo (Español)',

    // Medical Slips
    newRecord: 'Nuevo Registro',
    searchPatients: 'Buscar pacientes, condiciones...',
    allSlips: 'Todos',
    important: 'Importantes',
    patientName: 'Nombre del Paciente',
    hospitalName: 'Nombre del Hospital',
    condition: 'Condición / Motivo',
    noRecordsFound: 'No se Encontraron Registros',
    uploadSlip: 'Subir Informe',
    saveChanges: 'Guardar Cambios',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    preview: 'Vista Previa',
    download: 'Descargar',
    edit: 'Editar',

    // Yoga
    beginSession: 'Iniciar Sesión',
    completed: 'Completado',
    locked: 'Bloqueado',
    level: 'Nivel',
    duration: 'Duración',
    skip: 'Omitir',
    close: 'Cerrar',
    great: '¡Excelente trabajo!',
    nextExercise: 'Siguiente Ejercicio',

    // Water
    addWater: 'Añadir Agua',
    dailyGoal: 'Meta Diaria',
    consumed: 'Consumido',
    remaining: 'Restante',
    glassAdded: '¡Vaso Añadido!',

    // Diet
    breakfast: 'Desayuno',
    lunch: 'Almuerzo',
    dinner: 'Cena',
    snacks: 'Meriendas',
    calories: 'Calorías',
    protein: 'Proteína',
    carbs: 'Carbohidratos',
    fats: 'Grasas',

    // Calendar
    healthCalendar: 'Calendario de Salud',
    totalScore: 'Puntuación Total',
    currentStreak: 'Racha Actual',
    monthlyAnalysis: 'Análisis Mensual',
    perfectDays: 'Días Perfectos',
    waterGoalsMet: 'Metas de Agua Cumplidas',
    yogaSessions: 'Sesiones de Yoga',
    dietTracked: 'Dieta Registrada',
    overallAdherence: 'Cumplimiento general',
    excellent: '¡Excelente!',
    goodProgress: '¡Buen progreso!',
    keepGoing: '¡Sigue adelante!',

    // Consultation
    doctorConsultation: 'Consulta Médica',
    doctorLogin: 'Acceso Médico',
    userLogin: 'Acceso Paciente',
    authenticate: 'Autenticar Médico',
    loginAsPatient: 'Acceder como Paciente',
    doctorUsername: 'Usuario Médico',
    password: 'Contraseña',
    demoCredentials: 'Credenciales de demostración',
    endSession: 'Finalizar Sesión',
    overview: 'Resumen',
    chat: 'Chat',
    activityOverview: 'Resumen de Actividad',

    // Common
    back: 'Volver',
    save: 'Guardar',
    loading: 'Cargando...',
    success: 'Éxito',
    error: 'Error',
    confirm: 'Confirmar',
    search: 'Buscar',
    filter: 'Filtrar',
    today: 'Hoy',
    week: 'Semana',
    month: 'Mes',
    year: 'Año',
    minutes: 'Minutos',
    hours: 'Horas',
    days: 'Días',
  },
};

// ── Context ───────────────────────────────────────────────────────────────────
const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('mv_language') || 'en');

  // Apply lang attribute to html element so browser knows the language
  useEffect(() => {
    const htmlLangMap = { en: 'en', te: 'te', hi: 'hi', eu: 'es' };
    document.documentElement.lang = htmlLangMap[lang] || 'en';
    document.documentElement.setAttribute('data-lang', lang);
  }, [lang]);

  const changeLanguage = (code) => {
    setLang(code);
    localStorage.setItem('mv_language', code);
    const htmlLangMap = { en: 'en', te: 'te', hi: 'hi', eu: 'es' };
    document.documentElement.lang = htmlLangMap[code] || 'en';
    document.documentElement.setAttribute('data-lang', code);
  };

  // t(key) — returns translation or falls back to English
  const t = (key) => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS['en']?.[key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
