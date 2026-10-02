import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Flame, Trophy, Play, CheckCircle, Lock, 
  Upload, X, Dumbbell, Heart, Zap, Star, Crown, Clock
} from 'lucide-react';
import ChatBot from '../components/ChatBot';
import SectionAbout from '../components/SectionAbout';
import { useLanguage } from '../contexts/LanguageContext';
import './Yoga.css';
import omSound from './ribhavagrawal-ancient-spirit-echoes-om-chanting-234045.mp3';

const YOGA_T = {
  en: {
    greatJobMsg: "Great job! You completed today's yoga session. Come back tomorrow for a fresh start!",
    backToDashboard: 'Back to Dashboard',
    dayStreak: 'Day Streak',
    title: 'Yoga, Exercise & Meditation',
    subtitle: 'Pranayama, Meditation & Exercise Hub',
    level: 'Level',
    unlocked: 'Unlocked',
    completedCount: 'completed',
    locked: 'Locked',
    boys: 'Boys',
    girls: 'Girls',
    start: 'Start',
    play: 'Play',
    done: 'Done',
    upload: 'Upload Video',
    removeVideo: 'Remove Video',
    beginSession: 'Begin Session',
    skipPrep: 'Skip Preparation',
    close: 'Close',
    greatWork: 'Great Work!',
    finishedDesc: 'Yoga session completed successfully!',
    nextExercise: 'Next Exercise',
    closePlayer: 'Close Player',
    sequentialLocked: 'Sequential locked! Complete previous video to unlock.',
    streakCelebration: 'Streak Milestone! Keep it up!',
    aboutWhat: 'The Yoga, Exercise & Meditation section is a comprehensive health and fitness center designed to enhance your physical agility, breathing control, muscular endurance, and mental peace. Divided into five levels ranging from foundational Pranayama breathing to high-intensity gym routines and deep meditation practices, it helps users build a sustainable daily wellness routine with step-by-step guidance, progress tracking, and custom video uploads.',
    aboutHow: [
      'Navigate to the Yoga section to see the overview of the 5 available workout levels.',
      'Start with Level 1 (Pranayama) to master deep breathing exercises like Three-Part Breathing or Alternate Nostril Breathing.',
      'Note that Level 1 is sequential; you must complete each breathing session in order to unlock the subsequent one.',
      'Use the Level Navigation Tabs at the top to quickly jump to any level section on the page.',
      'Under Level 3 (Exercises), toggle between the "Boys" and "Girls" tabs to display routines curated for your target goals.',
      'Click the "Start" or "Play" button on any unlocked video card to launch the interactive fullscreen media player.',
      'Wait for the 3-second countdown to prepare your posture and start your session.',
      'Follow along with the looped demonstration GIF while checking the remaining session time and dynamic progress bar.',
      'Enjoy high-quality ambient background OM audio playing automatically during Pranayama breathing to aid focus.',
      'For any video, use the "Upload" button to select and play your own local video files instead of default GIFs.',
      'Complete a video to mark it as done; completing all Level 1 asanas increments your active daily streak!',
      'Interact with YogaBot, your specialized AI yoga tutor, to ask about correct poses, health tips, or breathing techniques.'
    ],
    aboutWhy: [
      'Level 1 Pranayama helps optimize oxygen intake, lower blood pressure, and reduce psychological stress.',
      'Level 2 Advanced Yoga improves posture, joint flexibility, and builds overall core stabilizer strength.',
      'Level 3 Exercises focus on functional movements, building muscle tone, and improving metabolic rate.',
      'Level 4 Gymers routines are tailored to increase resistance power, muscle mass, and cardiorespiratory fitness.',
      'Level 5 Transcendent Meditation cultivates deep self-awareness, emotional balance, and high cognitive focus.'
    ]
  },
  te: {
    greatJobMsg: "అద్భుతమైన పని! మీరు ఈ రోజు యోగా సెషన్‌ను విజయవంతంగా పూర్తి చేసారు. రేపు కొత్త ప్రారంభం కోసం మళ్లీ రండి!",
    backToDashboard: 'డాష్‌బోర్డ్‌కు తిరిగి వెళ్ళు',
    dayStreak: 'రోజుల స్ట్రీక్',
    title: 'యోగా, వ్యాయామం & ధ్యానం',
    subtitle: 'ప్రాణాయామం, ధ్యానం & వ్యాయామ కేంద్రం',
    level: 'స్థాయి',
    unlocked: 'అన్‌లాక్ చేయబడింది',
    completedCount: 'పూర్తయినవి',
    locked: 'లాక్ చేయబడింది',
    boys: 'బాలురు',
    girls: 'బాలికలు',
    start: 'ప్రారంభించు',
    play: 'ప్లే చేయి',
    done: 'పూర్తయింది',
    upload: 'వీడియో అప్‌లోడ్',
    removeVideo: 'వీడియో తొలగించు',
    beginSession: 'సెషన్ ప్రారంభించండి',
    skipPrep: 'తయారీ దాటవేయి',
    close: 'మూసివేయి',
    greatWork: 'అద్భుతమైన పని!',
    finishedDesc: 'యోగా సెషన్ విజయవంతంగా పూర్తయింది!',
    nextExercise: 'తదుపరి వ్యాయామం',
    closePlayer: 'ప్లేయర్ మూసివేయి',
    sequentialLocked: 'క్రమ పద్ధతిలో లాక్ చేయబడింది! అన్‌లాక్ చేయడానికి మునుపటి వీడియోను పూర్తి చేయండి.',
    streakCelebration: 'స్ట్రీక్ మైలురాయి! ఇలాగే కొనసాగించండి!',
    aboutWhat: 'యోగా, వ్యాయామం & ధ్యాన విభాగం అనేది మీ శారీరక చురుకుదనం, శ్వాస నియంత్రణ, కండరాల ఓర్పు మరియు మానసిక ప్రశాంతతను పెంపొందించడానికి రూపొందించబడిన ఒక సమగ్ర ఆరోగ్య మరియు ఫిట్‌నెస్ కేంద్రం. పునాది ప్రాణాయామ శ్వాస నుండి అధిక-తీవ్రత కలిగిన జిమ్ రొటీన్‌లు మరియు లోతైన ధ్యాన పద్ధతుల వరకు ఐదు స్థాయిలుగా విభజించబడింది, ఇది వినియోగదారులకు దశల వారీ మార్గదర్శకత్వం, పురోగతి ట్రాకింగ్ మరియు అనుకూల వీడియో అప్‌లోడ్‌లతో స్థిరమైన రోజువారీ సంక్షేమ దినచర్యను రూపొइंडడంలో సహాయపడుతుంది.',
    aboutHow: [
      'అందుబాటులో ఉన్న 5 వర్కౌట్ స్థాయిల అవలోకనాన్ని చూడటానికి యోగా విభాగానికి నావిగేట్ చేయండి.',
      'త్రీ-పార్ట్ బ్రీతింగ్ లేదా ఆల్టర్నేట్ నాస్ట్రిల్ బ్రీతింగ్ వంటి లోతైన శ్వాస వ్యాయామాలను నేర్చుకోవడానికి లెవెల్ 1 (ప్రాణాయామం)తో ప్రారంభించండి.',
      'గమనిక: లెవెల్ 1 అనేది క్రమ పద్ధతిలో ఉంటుంది; తదుపరిదాన్ని అన్‌లాక్ చేయడానికి మీరు ప్రతి శ్వాస సెషన్‌ను క్రమంగా పూర్తి చేయాలి.',
      'పేజీలోని ఏదైనా占い విభాగానికి త్వరగా వెళ్లడానికి ఎగువన ఉన్న స్థాయి నావిగేషన్ ట్యాబ్‌లను ఉపయోగించండి.',
      'లెవెల్ 3 (వ్యాయామాలు) కింద, మీ నిర్దేశిత లక్ష్యాల కోసం క్యూరేట్ చేయబడిన దినచర్యలను ప్రదర్శించడానికి "బాలురు" మరియు "బాలికలు" ట్యాబ్‌ల మధ్య టోగుల్ చేయండి.',
      'ఇంటరాక్టివ్ పూర్తి స్క్రీన్ మీడియా ప్లేయర్‌ను ప్రారంభించడానికి ఏదైనా అన్‌లాక్ చేయబడిన వీడియో కార్డ్‌పై "ప్రారంభించు" లేదా "ప్లే" బటన్లను క్లిక్ చేయండి.',
      'మీ భంగిమను సిద్ధం చేసుకోవడానికి మరియు మీ సెషన్‌ను ప్రారంభించడానికి 3-సెకన్ల కౌంట్‌డౌన్ కోసం వేచి ఉండండి.',
      'మిగిలి ఉన్న సెషన్ సమయం మరియు డైనమిక్ పురోగతి పట్టీని తనిఖీ చేస్తూనే లూప్ చేయబడిన ప్రదర్శన GIFని అనుసరించండి.',
      'ఏకాగ్రత పెంచుకోవడానికి ప్రాణాయామ శ్వాస సమయంలో స్వయంచాలకంగా ప్లే అయ్యే అధిక-నాణ్యత పరిసర నేపథ్య ఓం ఆడియోను ఆస్వాదించండి.',
      'ఏదైనా వీడియో కోసం, డిఫాల్ట్ GIFలకు బదులుగా మీ స్వంత స్థానిక వీడియో ఫైల్‌లను ప్లే చేయడానికి "అప్‌లోడ్" బటన్‌ను ఉపయోగించండి.',
      'వీడియోను పూర్తయినట్లుగా గుర్తించడానికి దాన్ని పూర్తి చేయండి; అన్ని లెవెల్ 1 ఆసనాలను పూర్తి చేయడం వల్ల మీ క్రియాశీల రోజువారీ స్ట్రీక్ పెరుగుతుంది!',
      'సరైన భంగిమలు, ఆరోగ్య చిట్కాలు లేదా శ్వాస పద్ధతుల గురించి అడగడానికి మీ ప్రత్యేక AI యోగా ట్యూటర్ అయిన యోగాబాట్‌తో ఇంటరాక్ట్ అవ్వండి.'
    ],
    aboutWhy: [
      'లెవెల్ 1 ప్రాణాయామం ఆక్సిజన్ తీసుకోవడం ఆప్టిమైజ్ చేయడానికి, రక్తపోటును తగ్గించడానికి మరియు మానసిక ఒత్తిడిని తగ్గించడానికి సహాయపడుతుంది.',
      'లెవెల్ 2 అధునాతన యోగా భంగిమను, కీళ్ల వశ్యతను మెరుగుపరుస్తుంది మరియు మొత్తం కోర్ స్థిరత్వ బలాన్ని పెంచుతుంది.',
      'లెవెల్ 3 వ్యాయామాలు శారీరక కదలికలు, కండరాల టోన్‌ను నిర్మించడం మరియు జీవక్రియ రేటును మెరుగుపరచడంపై దృష్టి పెడతాయి.',
      'లెవెల్ 4 జిమ్ రొటీన్‌లు ప్రతిఘటన శక్తి, కండర ద్రవ్యరాశి మరియు కార్డియో-రెస్పిరేటరీ ఫిట్‌నెస్‌ను పెంచడానికి రూపొందించబడ్డాయి.',
      'లెవెల్ 5 లోతైన ధ్యానం లోతైన స్వీయ-అవగాహన, మానసిक సమతుల్యత మరియు అధిక అభిజ్ఞా ఏకాగ్రతను పెంపొందిస్తుంది.'
    ]
  },
  hi: {
    greatJobMsg: "शानदार काम! आपने आज का योग सत्र सफलतापूर्वक पूरा कर लिया है। कल नए सिरे से शुरुआत करने के लिए वापस आएं!",
    backToDashboard: 'डैशबोर्ड पर वापस जाएं',
    dayStreak: 'दैनिक सिलसिला',
    title: 'योग, व्यायाम और ध्यान',
    subtitle: 'प्राणायाम, ध्यान और व्यायाम केंद्र',
    level: 'स्तर',
    unlocked: 'अनलॉक किया गया',
    completedCount: 'पूर्ण',
    locked: 'लॉक किया गया',
    boys: 'लड़के',
    girls: 'लड़कियां',
    start: 'शुरू करें',
    play: 'प्ले करें',
    done: 'पूर्ण',
    upload: 'वीडियो अपलोड',
    removeVideo: 'वीडियो हटाएं',
    beginSession: 'सत्र शुरू करें',
    skipPrep: 'तैयारी छोड़ें',
    close: 'बंद करें',
    greatWork: 'उत्कृष्ट कार्य!',
    finishedDesc: 'योग सत्र सफलतापूर्वक पूरा हुआ!',
    nextExercise: 'अगला व्यायाम',
    closePlayer: 'प्लेयर बंद करें',
    sequentialLocked: 'क्रमिक रूप से लॉक है! अनलॉक करने के लिए पिछला वीडियो पूरा करें।',
    streakCelebration: 'सिलसिले का मील का पत्थर! इसे जारी रखें!',
    aboutWhat: 'योग, व्यायाम और ध्यान अनुभाग एक व्यापक स्वास्थ्य और फिटनेस केंद्र है जिसे आपकी शारीरिक चपलता, श्वास नियंत्रण, मांसपेशियों के धीरज और मानसिक शांति को बढ़ाने के लिए डिज़ाइन किया गया है। बुनियादी प्राणायाम श्वास से लेकर उच्च-तीव्रता वाले जिम रूटीन और गहरे ध्यान प्रथाओं तक पांच स्तरों में विभाजित, यह उपयोगकर्ताओं को चरण-दर-चरण मार्गदर्शन, प्रगति ट्रैकिंग और कस्टम वीडियो अपलोड के साथ एक स्थायी दैनिक कल्याण दिनचर्या बनाने में मदद करता है।',
    aboutHow: [
      'उपलब्ध 5 वर्कआउट स्तरों के अवलोकन को देखने के लिए योग अनुभाग पर जाएं।',
      'थ्री-पार्ट ब्रीदिंग या अल्टरनेट नॉस्ट्रिल ब्रीदिंग जैसे गहरे श्वास अभ्यासों में महारत हासिल करने के लिए लेवल 1 (प्राणायाम) से शुरू करें।',
      'ध्यान दें कि लेवल 1 क्रमिक है; आपको बाद वाले को अनलॉक करने के लिए प्रत्येक श्वास सत्र को क्रम से पूरा करना होगा।',
      'पेज पर किसी भी स्तर के अनुभाग पर जल्दी से जाने के लिए शीर्ष पर स्थित स्तर नेविगेशन टैब का उपयोग करें।',
      'लेवल 3 (व्यायाम) के तहत, अपने लक्षित लक्ष्यों के लिए क्यूरेट किए गए रूटीन को प्रदर्शित करने के लिए "लड़के" और "लड़कियां" टैब के बीच टॉगल करें।',
      'इंटरैक्टिव पूर्ण स्क्रीन मीडिया प्लेयर शुरू करने के लिए किसी भी अनलॉक किए गए वीडियो कार्ड पर "शुरू करें" या "प्ले" बटन पर क्लिक करें।',
      'अपनी मुद्रा तैयार करने और अपना सत्र शुरू करने के लिए 3-सेकंड के काउंटडाउन की प्रतीक्षा करें।',
      'शेष सत्र समय और गतिशील प्रगति बार की जाँच करते हुए लूप किए गए प्रदर्शन GIF का अनुसरण करें।',
      'ध्यान केंद्रित करने में सहायता के लिए प्राणायाम श्वास के दौरान स्वचालित रूप से चलने वाले उच्च गुणवत्ता वाले पृष्ठभूमि ओम ऑडियो का आनंद लें।',
      'किसी भी वीडियो के लिए, डिफ़ॉल्ट GIF के बजाय अपने स्वयं के स्थानीय वीडियो फ़ाइलों को चलाने के लिए "अपलोड" बटन का उपयोग करें।',
      'वीडियो को पूरा के रूप में चिह्नित करने के लिए इसे समाप्त करें; सभी लेवल 1 आसनों को पूरा करने से आपका सक्रिय दैनिक सिलसिला बढ़ जाता है!',
      'सही मुद्राओं, स्वास्थ्य सुझावों या श्वास तकनीकों के बारे में पूछने के लिए अपने विशेष एआई योग शिक्षक, योगाबॉट के साथ बातचीत करें।'
    ],
    aboutWhy: [
      'लेवल 1 प्राणायाम ऑक्सीजन के सेवन को अनुकूलित करने, रक्तचाप को कम करने और मानसिक तनाव को कम करने में मदद करता है।',
      'लेवल 2 उन्नत योग मुद्रा, जोड़ों के लचीलेपन में सुधार करता है और समग्र कोर स्थिरता का निर्माण करता है।',
      'लेवल 3 व्यायाम शारीरिक गतिविधियों, मांसपेशियों के टोन के निर्माण और चयापचय दर में सुधार पर ध्यान केंद्रित करते हैं।',
      'लेवल 4 जिम रूटीन प्रतिरोध शक्ति, मांसपेशियों के द्रव्यमान और कार्डियो-श्वसन फिटनेस को बढ़ाने के लिए तैयार किए गए हैं।',
      'लेवल 5 गहरा ध्यान गहरी आत्म-जागरूकता, भावनात्मक संतुलन और उच्च संज्ञानात्मक ध्यान विकसित करता है।'
    ]
  },
  eu: {
    greatJobMsg: "¡Excelente trabajo! Completaste la sesión de yoga de hoy. ¡Vuelve mañana para empezar de nuevo!",
    backToDashboard: 'Volver al Dashboard',
    dayStreak: 'Racha de Días',
    title: 'Yoga, Ejercicio y Meditación',
    subtitle: 'Centro de Pranayama, Meditación y Ejercicio',
    level: 'Nivel',
    unlocked: 'Desbloqueado',
    completedCount: 'completado',
    locked: 'Bloqueado',
    boys: 'Chicos',
    girls: 'Chicas',
    start: 'Comenzar',
    play: 'Reproducir',
    done: 'Hecho',
    upload: 'Subir Vídeo',
    removeVideo: 'Eliminar Vídeo',
    beginSession: 'Comenzar Sesión',
    skipPrep: 'Omitir Preparación',
    close: 'Cerrar',
    greatWork: '¡Excelente Trabajo!',
    finishedDesc: '¡Sesión de yoga completada con éxito!',
    nextExercise: 'Siguiente Ejercicio',
    closePlayer: 'Cerrar Reproductor',
    sequentialLocked: '¡Bloqueo secuencial! Completa el vídeo anterior para desbloquear.',
    streakCelebration: '¡Hito de Racha! ¡Sigue así!',
    aboutWhat: 'La sección de Yoga, Ejercicio y Meditación es un centro integral de salud y acondicionamiento físico diseñado para mejorar su agilidad física, control de la respiración, resistencia muscular y paz mental. Dividido en cinco niveles que van desde la respiración Pranayama fundamental hasta rutinas de gimnasio de alta intensidad y prácticas de meditación profunda, ayuda a los usuarios a construir una rutina de bienestar diaria sostenible con orientación paso a paso, seguimiento del progreso y cargas de vídeo personalizadas.',
    aboutHow: [
      'Navega a la sección de Yoga para ver la descripción general de los 5 niveles de entrenamiento disponibles.',
      'Comienza con el Nivel 1 (Pranayama) para dominar ejercicios de respiración profunda como la respiración en tres partes o la respiración alterna.',
      'Ten en cuenta que el Nivel 1 es secuencial; debes completar cada sesión de respiración en orden para desbloquear la siguiente.',
      'Utiliza las pestañas de navegación de nivel en la parte superior para saltar rápidamente a cualquier sección de nivel en la página.',
      'En el Nivel 3 (Ejercicios), cambia entre las pestañas "Chicos" y "Chicas" para mostrar rutinas seleccionadas para tus objetivos.',
      'Haz clic en el botón "Comenzar" o "Reproducir" en cualquier tarjeta de vídeo desbloqueada para iniciar el reproductor de pantalla completa.',
      'Espera a la cuenta regresiva de 3 segundos para preparar tu postura y comenzar tu sesión.',
      'Sigue la demostración en GIF mientras controlas el tiempo restante de la sesión y la barra de progreso dinámica.',
      'Disfruta de audio OM de fondo de alta calidad que se reproduce automáticamente durante la respiración Pranayama para ayudar al enfoque.',
      'Para cualquier vídeo, utiliza el botón "Subir" para seleccionar y reproducir tus propios archivos de vídeo locales en lugar de los GIF predeterminados.',
      'Completa un vídeo para marcarlo como hecho; ¡completar todas las asanas del Nivel 1 aumenta tu racha activa diaria!',
      'Interactúa con YogaBot, tu tutor de yoga especializado en IA, para preguntar sobre posturas correctas, consejos de salud o técnicas de respiración.'
    ],
    aboutWhy: [
      'El Pranayama de Nivel 1 ayuda a optimizar la ingesta de oxígeno, reducir la presión arterial y disminuir el estrés psicológico.',
      'El Yoga Avanzado de Nivel 2 mejora la postura, la flexibilidad de las articulaciones y fortalece el core estabilizador.',
      'Los Ejercicios de Nivel 3 se centran en movimientos funcionales, el tono muscular y la mejora del ritmo metabólico.',
      'Las rutinas para Gimnastas de Nivel 4 están adaptadas para aumentar la fuerza de resistencia, masa muscular y aptitud cardiorrespiratoria.',
      'La Meditación Profunda de Nivel 5 cultiva el autoconocimiento profundo, el equilibrio emocional y un alto enfoque cognitivo.'
    ]
  }
};

const YOGA_TITLES_T = {
  en: {
    'Level 1: Pranayama (Yoga)': 'Level 1: Pranayama (Yoga)',
    'Level 2: Advanced Yoga': 'Level 2: Advanced Yoga',
    'Level 3: Exercises': 'Level 3: Exercises',
    'Level 4: Gymers': 'Level 4: Gymers',
    'Level 5: Gymers Pro & Meditation': 'Level 5: Gymers Pro & Meditation',
    "Yoga is the journey of the self, through the self, to the self.": "Yoga is the journey of the self, through the self, to the self.",
    "You cannot always control what goes on outside, but you can control what goes on inside.": "You cannot always control what goes on outside, but you can control what goes on inside.",
    "Inhale the future, exhale the past.": "Inhale the future, exhale the past.",
    "Your body is a temple, keep it pure and clean for the soul.": "Your body is a temple, keep it pure and clean for the soul.",
    "Yoga happens beyond the mat, anything you do with attention is yoga.": "Yoga happens beyond the mat, anything you do with attention is yoga.",
    "Peace comes from within. Do not seek it without.": "Peace comes from within. Do not seek it without.",
    'Dirga Pranayama (Three-Part Deep Breathing)': 'Dirga Pranayama (Three-Part Deep Breathing)',
    'Nadi Shodhana (Anulom Vilom / Alternate Nostril Breathing)': 'Nadi Shodhana (Anulom Vilom / Alternate Nostril Breathing)',
    'Kapalbhati Pranayama (Skull Shining Breath)': 'Kapalbhati Pranayama (Skull Shining Breath)',
    'Bhramari Pranayama (Humming Bee Breath)': 'Bhramari Pranayama (Humming Bee Breath)',
    'Surya Namaskar A (Classic Sun Salutation)': 'Surya Namaskar A (Classic Sun Salutation)',
    'Surya Namaskar B (Dynamic Sun Salutation)': 'Surya Namaskar B (Dynamic Sun Salutation)',
    'Virabhadrasana Flow (Warrior Poses I, II & III)': 'Virabhadrasana Flow (Warrior Poses I, II & III)',
    'Vrikshasana & Garudasana (Tree & Eagle Poses)': 'Vrikshasana & Garudasana (Tree & Eagle Poses)',
    'Balasana & Shavasana (Child’s & Corpse Recovery)': 'Balasana & Shavasana (Child’s & Corpse Recovery)',
    'Push-ups Routine': 'Push-ups Routine',
    'Squats & Lunges': 'Squats & Lunges',
    'Core Strengthening': 'Core Strengthening',
    'Upper Body Workout': 'Upper Body Workout',
    'Full Body HIIT': 'Full Body HIIT',
    'Pilates Basics': 'Pilates Basics',
    'Flexibility Training': 'Flexibility Training',
    'Toning Exercises': 'Toning Exercises',
    'Cardio Dance': 'Cardio Dance',
    'Yoga Flow for Women': 'Yoga Flow for Women',
    'Chest & Triceps': 'Chest & Triceps',
    'Back & Biceps': 'Back & Biceps',
    'Shoulders & Traps': 'Shoulders & Traps',
    'Leg Day Power': 'Leg Day Power',
    'Core & Abs': 'Core & Abs',
    'Full Body Compound': 'Full Body Compound',
    'Deadlift Mastery': 'Deadlift Mastery',
    'Bench Press Techniques': 'Bench Press Techniques',
    'Olympic Lifts': 'Olympic Lifts',
    'Recovery & Stretching': 'Recovery & Stretching',
    'Mindfulness Meditation & Breath Focus': 'Mindfulness Meditation & Breath Focus',
    'Deep Spiritual Alignment & Chanting': 'Deep Spiritual Alignment & Chanting',
    'Kundalini Energy Activation': 'Kundalini Energy Activation',
    'Yoga Nidra for Deep Relaxation': 'Yoga Nidra for Deep Relaxation',
    'Transcendent Cosmic Flow': 'Transcendent Cosmic Flow',
  },
  te: {
    'Level 1: Pranayama (Yoga)': 'స్థాయి 1: ప్రాణాయామం (యోగా)',
    'Level 2: Advanced Yoga': 'స్థాయి 2: అధునాతన యోగా',
    'Level 3: Exercises': 'స్థాయి 3: శారీరక వ్యాయామాలు',
    'Level 4: Gymers': 'స్థాయి 4: జిమ్ వర్కౌట్లు',
    'Level 5: Gymers Pro & Meditation': 'స్థాయి 5: జిమ్ ప్రో & ధ్యానం',
    "Yoga is the journey of the self, through the self, to the self.": "యోగా అంటే తన ద్వారా, తన కొరకు, తన వైపుగా ఆత్మ చేసే ప్రయాణం.",
    "You cannot always control what goes on outside, but you can control what goes on inside.": "మీరు బయట జరిగే వాటిని ఎల్లప్పుడూ నియంత్రించలేరు, కానీ లోపల జరిగే వాటిని నియంత్రించగలరు.",
    "Inhale the future, exhale the past.": "భవిష్యత్తును శ్వాసగా తీసుకోండి, గత కాలపు చింతలను శ్వాసతో వదిలేయండి.",
    "Your body is a temple, keep it pure and clean for the soul.": "మీ శరీరం ఒక ఆలయం, ఆత్మ కోసం దాన్ని పవిత్రంగా మరియు శుభ్రంగా ఉంచండి.",
    "Yoga happens beyond the mat, anything you do with attention is yoga.": "యోగా మ్యాట్‌కు మాత్రమే పరిమितం కాదు, మీరు శ్రద్ధతో చేసే ఏదైనా యోగా అవుతుంది.",
    "Peace comes from within. Do not seek it without.": "ప్రశాంతత అనేది లోపల నుండి వస్తుంది. దాన్ని బయట వెతకకండి.",
    'Dirga Pranayama (Three-Part Deep Breathing)': 'దీర్ఘ ప్రాణాయామం (మూడు భాగాల లోతైన శ్వాస)',
    'Nadi Shodhana (Anulom Vilom / Alternate Nostril Breathing)': 'నాడి శోధన (అనులోమ విలోమ / ప్రత్యామ్నాయ నాసికా శ్వాస)',
    'Kapalbhati Pranayama (Skull Shining Breath)': 'కపాలభాతి ప్రాణాయామం (మెదడును ప్రకాశింపజేసే శ్వాస)',
    'Bhramari Pranayama (Humming Bee Breath)': 'భ్రామరి ప్రాణాయామం (తేనెటీగ లాంటి నాద శ్వాస)',
    'Surya Namaskar A (Classic Sun Salutation)': 'సూర్య నమస్కారం A (క్లాసిక్ సూర్య నమస్కారాలు)',
    'Surya Namaskar B (Dynamic Sun Salutation)': 'సూర్య నమస్కారం B (డైనమిక్ సూర్య నమస్కారాలు)',
    'Virabhadrasana Flow (Warrior Poses I, II & III)': 'వీరభద్రాసన ఫ్లో (యోధుల భంగిమలు I, II & III)',
    'Vrikshasana & Garudasana (Tree & Eagle Poses)': 'వృక్షాసనం & గరుడాసనం (చెట్టు & గద్ద భంగిమలు)',
    'Balasana & Shavasana (Child’s & Corpse Recovery)': 'బాలాసనం & శవాసనం (బాల భంగిమ & విశ్రాంతి భంగిమ)',
    'Push-ups Routine': 'పుష్-అప్స్ దినచర్య',
    'Squats & Lunges': 'స్క్వాట్స్ & లంజెస్',
    'Core Strengthening': 'కోర్ కండరాల బలోపేతం',
    'Upper Body Workout': 'శరీర ఎగువ భాగపు వ్యాయామం',
    'Full Body HIIT': 'పూర్తి శరీర హై-ఇంటెన్సిటీ వ్యాయామం (HIIT)',
    'Pilates Basics': 'పిలేట్స్ బేసిక్స్',
    'Flexibility Training': 'శరీర వశ్యత శిక్షణ',
    'Toning Exercises': 'బాడీ టోనింగ్ వ్యాయామాలు',
    'Cardio Dance': 'కార్డియో డాన్స్',
    'Yoga Flow for Women': 'మహిళల ప్రత్యేక యోగా ఫ్లో',
    'Chest & Triceps': 'ఛాతి & ట్రైసెప్స్ వ్యాయామం',
    'Back & Biceps': 'వీపు & బైసెప్స్ వ్యాయామం',
    'Shoulders & Traps': 'భుజాలు & ట్రాప్స్ వ్యాయామం',
    'Leg Day Power': 'కాళ్ల కండరాల పవర్ డే',
    'Core & Abs': 'కోర్ & ఆబ్స్ వ్యాయామం',
    'Full Body Compound': 'పూర్తి శరీర కాంపౌండ్ వ్యాయామాలు',
    'Deadlift Mastery': 'డెడ్‌లిఫ్ట్ మాస్టరీ',
    'Bench Press Techniques': 'బెంచ్ ప్రెస్ పద్ధతులు',
    'Olympic Lifts': 'ఒలింपीక్ వెయిట్‌లిఫ్టింగ్',
    'Recovery & Stretching': 'శరీర పునరుద్ధరణ & స్ట్రెచింగ్',
    'Mindfulness Meditation & Breath Focus': 'మైండ్‌ఫుల్‌నెస్ ధ్యానం & శ్వాస ఏకాగ్రత',
    'Deep Spiritual Alignment & Chanting': 'లోతైన आध्यात्मिक అమరిక & ఓం మంత్రోచ్ఛారణ',
    'Kundalini Energy Activation': 'కుండలిని శక్తి మేల్కొలుపు',
    'Yoga Nidra for Deep Relaxation': 'యోగ నిద్ర (లోతైన శారీరక ప్రశాంతత)',
    'Transcendent Cosmic Flow': 'విశ్వ చైతన్య యోగ ప్రవాహం',
  },
  hi: {
    'Level 1: Pranayama (Yoga)': 'स्तर 1: प्राणायाम (योग)',
    'Level 2: Advanced Yoga': 'स्तर 2: उन्नत योग',
    'Level 3: Exercises': 'स्तर 3: शारीरिक व्यायाम',
    'Level 4: Gymers': 'स्तर 4: जिम वर्कआउट',
    'Level 5: Gymers Pro & Meditation': 'स्तर 5: जिम प्रो और ध्यान',
    "Yoga is the journey of the self, through the self, to the self.": "योग स्वयं की, स्वयं के माध्यम से, स्वयं तक की यात्रा है।",
    "You cannot always control what goes on outside, but you can control what goes on inside.": "आप हमेशा बाहर क्या चल रहा है उसे नियंत्रित नहीं कर सकते, लेकिन आप अंदर क्या चल रहा है उसे नियंत्रित कर सकते हैं।",
    "Inhale the future, exhale the past.": "भविष्य को सांस के रूप में लें, अतीत को सांस के रूप में छोड़ दें।",
    "Your body is a temple, keep it pure and clean for the soul.": "आपका शरीर एक मंदिर है, इसे आत्मा के लिए पवित्र और स्वच्छ रखें।",
    "Yoga happens beyond the mat, anything you do with attention is yoga.": "योग मैट से परे होता है, ध्यान से किया गया कोई भी काम योग है।",
    "Peace comes from within. Do not seek it without.": "शांति भीतर से आती है। इसे बाहर मत ढूंढो।",
    'Dirga Pranayama (Three-Part Deep Breathing)': 'दीर्घ प्राणायाम (तीन भागों वाली गहरी सांस)',
    'Nadi Shodhana (Anulom Vilom / Alternate Nostril Breathing)': 'नाड़ी शोधन (अनुलोम विलोम / वैकल्पिक नासिका श्वास)',
    'Kapalbhati Pranayama (Skull Shining Breath)': 'कपालभाति प्राणायाम (मस्तिष्क को चमकाने वाली सांस)',
    'Bhramari Pranayama (Humming Bee Breath)': 'भ्रामरी प्राणायाम (मधुमक्खी जैसी गुंजन श्वास)',
    'Surya Namaskar A (Classic Sun Salutation)': 'सूर्य नमस्कार A (शास्त्रीय सूर्य नमस्कार)',
    'Surya Namaskar B (Dynamic Sun Salutation)': 'सूर्य नमस्कार B (गतिशील सूर्य नमस्कार)',
    'Virabhadrasana Flow (Warrior Poses I, II & III)': 'वीरभद्रासन फ्लो (योद्धा मुद्राएं I, II और III)',
    'Vrikshasana & Garudasana (Tree & Eagle Poses)': 'वृक्षासन और गरुड़ासन (वृक्ष और गरुड़ मुद्राएं)',
    'Balasana & Shavasana (Child’s & Corpse Recovery)': 'बालासन और शवासन (बाल मुद्रा और विश्राम मुद्रा)',
    'Push-ups Routine': 'पुश-अप्स दिनचर्या',
    'Squats & Lunges': 'स्क्वाट्स और लंग्स',
    'Core Strengthening': 'कोर मांसपेशियों का सुदृढ़ीकरण',
    'Upper Body Workout': 'शरीर के ऊपरी हिस्से का वर्कआउट',
    'Full Body HIIT': 'पूर्ण शरीर हाई-इंटेनसिटी वर्कआउट (HIIT)',
    'Pilates Basics': 'पिलाटेस बेसिक्स',
    'Flexibility Training': 'शरीर का लचीलापन प्रशिक्षण',
    'Toning Exercises': 'बॉडी टोनिंग एक्सरसाइज',
    'Cardio Dance': 'कार्डियो डांस',
    'Yoga Flow for Women': 'महिलाओं के लिए विशेष योग प्रवाह',
    'Chest & Triceps': 'छाती और ट्राइसेप्स वर्कआउट',
    'Back & Biceps': 'पीठ और बाइसेप्स वर्कआउट',
    'Shoulders & Traps': 'कंधे और ट्रैप्स वर्कआउट',
    'Leg Day Power': 'पैरों की ताकत का दिन',
    'Core & Abs': 'कोर और एब्स वर्कआउट',
    'Full Body Compound': 'पूर्ण शरीर कंपाउंड वर्कआउट',
    'Deadlift Mastery': 'डेडलिफ्ट महारत',
    'Bench Press Techniques': 'बेंच प्रेस तकनीक',
    'Olympic Lifts': 'ओलंपिक भारोत्तोलन',
    'Recovery & Stretching': 'शरीर की रिकवरी और स्ट्रेचिंग',
    'Mindfulness Meditation & Breath Focus': 'माइंडफुलनेस ध्यान और श्वास ध्यान',
    'Deep Spiritual Alignment & Chanting': 'गहरी आध्यात्मिक संरेखण और मंत्रोच्चार',
    'Kundalini Energy Activation': 'कुंडलिनी ऊर्जा जागरण',
    'Yoga Nidra for Deep Relaxation': 'योग निद्रा (गहरी शारीरिक शांति)',
    'Transcendent Cosmic Flow': 'ब्रह्मांडीय योग प्रवाह',
  },
  eu: {
    'Level 1: Pranayama (Yoga)': 'Nivel 1: Pranayama (Yoga)',
    'Level 2: Advanced Yoga': 'Nivel 2: Yoga Avanzado',
    'Level 3: Exercises': 'Nivel 3: Ejercicios Físicos',
    'Level 4: Gymers': 'Nivel 4: Entrenamientos de Gimnasio',
    'Level 5: Gymers Pro & Meditation': 'Nivel 5: Gym Pro y Meditación',
    "Yoga is the journey of the self, through the self, to the self.": "El yoga es el viaje del yo, a través del yo, hacia el yo.",
    "You cannot always control what goes on outside, but you can control what goes on inside.": "No siempre puedes controlar lo que pasa afuera, pero puedes controlar lo que pasa adentro.",
    "Inhale the future, exhale the past.": "Inhala el futuro, exhala el pasado.",
    "Your body is a temple, keep it pure and clean for the soul.": "Tu cuerpo es un templo, mantenlo puro y limpio para el alma.",
    "Yoga happens beyond the mat, anything you do with attention is yoga.": "El yoga ocurre más allá de la esterilla, cualquier cosa que hagas con atención es yoga.",
    "Peace comes from within. Do not seek it without.": "La paz viene de dentro. No la busques fuera.",
    'Dirga Pranayama (Three-Part Deep Breathing)': 'Dirga Pranayama (Respiración profunda en tres partes)',
    'Nadi Shodhana (Anulom Vilom / Alternate Nostril Breathing)': 'Nadi Shodhana (Respiración alterna)',
    'Kapalbhati Pranayama (Skull Shining Breath)': 'Kapalbhati Pranayama (Respiración brillante del cráneo)',
    'Bhramari Pranayama (Humming Bee Breath)': 'Bhramari Pranayama (Respiración del zumbido de la abeja)',
    'Surya Namaskar A (Classic Sun Salutation)': 'Surya Namaskar A (Saludo al Sol clásico)',
    'Surya Namaskar B (Dynamic Sun Salutation)': 'Surya Namaskar B (Saludo al Sol dinámico)',
    'Virabhadrasana Flow (Warrior Poses I, II & III)': 'Virabhadrasana Flow (Posturas del Guerrero I, II y III)',
    'Vrikshasana & Garudasana (Tree & Eagle Poses)': 'Vrikshasana y Garudasana (Posturas del Árbol y el Águila)',
    'Balasana & Shavasana (Child’s & Corpse Recovery)': 'Balasana y Shavasana (Posturas del Niño y del Cadáver)',
    'Push-ups Routine': 'Rutina de flexiones',
    'Squats & Lunges': 'Sentadillas y zancadas',
    'Core Strengthening': 'Fortalecimiento del core',
    'Upper Body Workout': 'Entrenamiento de la parte superior del cuerpo',
    'Full Body HIIT': 'HIIT de cuerpo completo',
    'Pilates Basics': 'Pilates básico',
    'Flexibility Training': 'Entrenamiento de flexibilidad',
    'Toning Exercises': 'Ejercicios de tonificación',
    'Cardio Dance': 'Cardio Dance',
    'Yoga Flow for Women': 'Yoga Flow para mujeres',
    'Chest & Triceps': 'Pecho y tríceps',
    'Back & Biceps': 'Espalda y bíceps',
    'Shoulders & Traps': 'Hombros y trapecios',
    'Leg Day Power': 'Fuerza de piernas',
    'Core & Abs': 'Core y abdominales',
    'Full Body Compound': 'Ejercicios compuestos de cuerpo completo',
    'Deadlift Mastery': 'Maestría en peso muerto',
    'Bench Press Techniques': 'Técnicas de press de banca',
    'Olympic Lifts': 'Levantamientos olímpicos',
    'Recovery & Stretching': 'Recuperación y estiramientos',
    'Mindfulness Meditation & Breath Focus': 'Meditación de atención plena y enfoque en la respiración',
    'Deep Spiritual Alignment & Chanting': 'Alineación espiritual profunda y cánticos',
    'Kundalini Energy Activation': 'Activación de la energía Kundalini',
    'Yoga Nidra for Deep Relaxation': 'Yoga Nidra para relajación profunda',
    'Transcendent Cosmic Flow': 'Flujo cósmico trascendente',
  }
};



import gif1 from './L1173459.gif';
import gif2 from './L1174132.gif';
import gif3 from './L1211229.gif';
import gif4 from './L1213300.gif';
import newGif from './three_minute_loop.gif';
import screenRecording from './screen_recording.gif';
import l1b3Gif from './L1B3.gif';
import l1v4Gif from './L14.gif';
import l2v1Gif from './L21.gif';
import l2v2Gif from './L22.gif';
import l2v3Gif from './L25.gif';
import l2v4Gif from './L24.gif';
import l2v5Gif from './l33.gif';
import l3b1Gif from './L3B1.gif';
import l3b2Gif from './L3B2.gif';
import l3b3Gif from './L3B3.gif';
import l3b4Gif from './L3B4.gif';
import l3b5Gif from './L3B5.gif';
import l3g1Gif from './gif_161234.gif';
import l3g2Gif from './gif_161340.gif';
import l3g3Gif from './gif_161441.gif';
import l3g4Gif from './gif_161523.gif';
import l3g5Gif from './gif_161619.gif';

// Gymers Level 4 Custom Assets
import gymGif1 from './gym 1.gif';
import gymGif2 from './gym 1 smooth.gif';
import gym3min1 from './converted_3min.gif';
import gym3min1_dup from './converted_3min (1).gif';
import gym3min2 from './converted_3min_v2.gif';
import gym3min2_dup from './converted_3min_v2 (1).gif';
import gym3min3 from './converted_3min_v3.gif';
import gym3min4 from './converted_3min_v4.gif';
import gym3min5 from './converted_3min_v5.gif';

const motivationSlogans = [
  "Breathe in strength, breathe out stress.",
  "Yoga is the journey of the self, through the self, to the self.",
  "You cannot always control what goes on outside, but you can control what goes on inside.",
  "Inhale the future, exhale the past.",
  "Your body is a temple, keep it pure and clean for the soul.",
  "Yoga happens beyond the mat, anything you do with attention is yoga.",
  "Peace comes from within. Do not seek it without."
];

// Level definitions
const LEVELS = {
  1: {
    title: 'Level 1: Pranayama (Yoga)',
    icon: '🧘',
    color: '#0984e3',
    gradient: 'linear-gradient(135deg, #74b9ff, #0984e3)',
    sequential: true,
    videos: [
      { id: 'l1v1', title: 'Dirga Pranayama (Three-Part Deep Breathing)', duration: 3 * 60, gif: newGif },
      { id: 'l1v2', title: 'Nadi Shodhana (Anulom Vilom / Alternate Nostril Breathing)', duration: 3 * 60, gif: screenRecording },
      { id: 'l1v3', title: 'Kapalbhati Pranayama (Skull Shining Breath)', duration: 3 * 60, gif: l1b3Gif },
      { id: 'l1v4', title: 'Bhramari Pranayama (Humming Bee Breath)', duration: 3 * 60, gif: l1v4Gif },
    ]
  },
  2: {
    title: 'Level 2: Advanced Yoga',
    icon: '🔥',
    color: '#e17055',
    gradient: 'linear-gradient(135deg, #fab1a0, #e17055)',
    sequential: true,
    videos: [
      { id: 'l2v1', title: 'Surya Namaskar A (Classic Sun Salutation)', duration: 3 * 60, gif: l2v1Gif },
      { id: 'l2v2', title: 'Surya Namaskar B (Dynamic Sun Salutation)', duration: 3 * 60, gif: l2v2Gif },
      { id: 'l2v3', title: 'Virabhadrasana Flow (Warrior Poses I, II & III)', duration: 3 * 60, gif: l2v3Gif },
      { id: 'l2v4', title: 'Vrikshasana & Garudasana (Tree & Eagle Poses)', duration: 3 * 60, gif: l2v4Gif },
    ]
  },
  3: {
    title: 'Level 3: Exercises',
    icon: '💪',
    color: '#00b894',
    gradient: 'linear-gradient(135deg, #55efc4, #00b894)',
    sequential: false,
    hasGenderSplit: true,
    boys: [
      { id: 'l3b1', title: 'Push-ups Routine', duration: 3 * 60, gif: l3b1Gif },
      { id: 'l3b2', title: 'Squats & Lunges', duration: 3 * 60, gif: l3b2Gif },
      { id: 'l3b3', title: 'Core Strengthening', duration: 3 * 60, gif: l3b3Gif },
      { id: 'l3b4', title: 'Upper Body Workout', duration: 3 * 60, gif: l3b4Gif },
      { id: 'l3b5', title: 'Full Body HIIT', duration: 3 * 60, gif: l3b5Gif },
    ],
    girls: [
      { id: 'l3g1', title: 'Pilates Basics', duration: 3 * 60, gif: l3g1Gif },
      { id: 'l3g2', title: 'Flexibility Training', duration: 3 * 60, gif: l3g2Gif },
      { id: 'l3g3', title: 'Toning Exercises', duration: 3 * 60, gif: l3g3Gif },
      { id: 'l3g4', title: 'Cardio Dance', duration: 3 * 60, gif: l3g4Gif },
      { id: 'l3g5', title: 'Yoga Flow for Women', duration: 3 * 60, gif: l3g5Gif },
    ]
  },
  4: {
    title: 'Level 4: Gymers',
    icon: '🏋️',
    color: '#6c5ce7',
    gradient: 'linear-gradient(135deg, #a29bfe, #6c5ce7)',
    sequential: false,
    videos: [
      { id: 'l4v1', title: 'Chest & Triceps', duration: 4 * 60, gif: gymGif1 },
      { id: 'l4v2', title: 'Back & Biceps', duration: 4 * 60, gif: gymGif2 },
      { id: 'l4v3', title: 'Shoulders & Traps', duration: 4 * 60, gif: gym3min1 },
      { id: 'l4v4', title: 'Leg Day Power', duration: 4 * 60, gif: gym3min2 },
      { id: 'l4v5', title: 'Core & Abs', duration: 4 * 60, gif: gym3min3 },
      { id: 'l4v6', title: 'Full Body Compound', duration: 4 * 60, gif: gym3min4 },
      { id: 'l4v7', title: 'Deadlift Mastery', duration: 4 * 60, gif: gym3min5 },
      { id: 'l4v8', title: 'Bench Press Techniques', duration: 4 * 60, gif: gym3min1_dup },
      { id: 'l4v9', title: 'Olympic Lifts', duration: 4 * 60, gif: gym3min2_dup },
      { id: 'l4v10', title: 'Recovery & Stretching', duration: 4 * 60, gif: gymGif2 },
    ]
  },
  5: {
    title: 'Level 5: Gymers Pro & Meditation',
    icon: '👑',
    color: '#d63031',
    gradient: 'linear-gradient(135deg, #ff7675, #d63031)',
    sequential: false,
    videos: [
      { id: 'l5v1', title: 'Mindfulness Meditation & Breath Focus', duration: 5 * 60, gif: gif1 },
      { id: 'l5v2', title: 'Deep Spiritual Alignment & Chanting', duration: 5 * 60, gif: gif2 },
      { id: 'l5v3', title: 'Kundalini Energy Activation', duration: 5 * 60, gif: gif3 },
      { id: 'l5v4', title: 'Yoga Nidra for Deep Relaxation', duration: 5 * 60, gif: gif4 },
      { id: 'l5v5', title: 'Transcendent Cosmic Flow', duration: 5 * 60, gif: newGif },
    ]
  }
};

export default function Yoga({ user }) {
  const { lang } = useLanguage();
  const yt = (key) => YOGA_T[lang]?.[key] || YOGA_T['en']?.[key] || key;
  const transTitle = (t) => YOGA_TITLES_T[lang]?.[t] || YOGA_TITLES_T['en']?.[t] || t;

  const navigate = useNavigate();
  const [currentSlogan] = useState(() => motivationSlogans[new Date().getDay() % motivationSlogans.length]);
  const [showStreakModal, setShowStreakModal] = useState(false);

  // Correct Day Streak logic
  const [dayStreaks, setDayStreaks] = useState(() => {
    return parseInt(localStorage.getItem(user?.id ? `yoga_day_streaks_${user.id}` : 'yoga_day_streaks') || '0', 10);
  });
  
  // Track completed videos per level: { "l1v1": true, "l1v2": true, ... }
  const [completedVideos, setCompletedVideos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(user?.id ? `yoga_completed_videos_${user.id}` : 'yoga_completed_videos') || '{}');
    } catch { return {}; }
  });

  // Track uploaded custom videos: { "l1v1": "blob:...", ... }
  const [uploadedVideos, setUploadedVideos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('yoga_uploaded_videos') || '{}');
    } catch { return {}; }
  });

  // Currently playing video
  const [activeVideo, setActiveVideo] = useState(null); // { levelId, videoId }
  const [playState, setPlayState] = useState('idle'); // 'idle' | 'countdown' | 'playing' | 'completed'
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(0);
  const [autoPlayCountdown, setAutoPlayCountdown] = useState(3);

  // Level 3 gender toggle
  const [level3Gender, setLevel3Gender] = useState('boys');

  // Video player ref
  const videoRef = useRef(null);

  // Video upload ref
  const fileInputRef = useRef(null);
  const [uploadTarget, setUploadTarget] = useState(null);

  // GIF restart mechanism - forces GIF to loop continuously
  const [gifRestartKey, setGifRestartKey] = useState(0);
  const gifImgRef = useRef(null);

  // Level 1 and 2 daily streaks and countdown states
  const [l1ResetCountdown, setL1ResetCountdown] = useState('');
  const [l1CompletedToday, setL1CompletedToday] = useState(() => {
    return localStorage.getItem(user?.id ? `yoga_l1_completion_time_${user.id}` : 'yoga_l1_completion_time') !== null;
  });
  const [l2CompletedToday, setL2CompletedToday] = useState(() => {
    return localStorage.getItem(user?.id ? `yoga_l2_completion_time_${user.id}` : 'yoga_l2_completion_time') !== null;
  });

  // ── OM background audio — plays only during Level 1 asanas ──
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const isLevel1Playing = playState === 'playing' && activeVideo?.levelId === 1;
    if (isLevel1Playing) {
      const globalVol = parseFloat(localStorage.getItem('mv_global_volume') ?? 1.0);
      audio.volume = 0.5 * globalVol;
      audio.play().catch(() => {}); // silently handle autoplay policy
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [playState, activeVideo]);
  useEffect(() => {
    const handleVolume = (e) => {
      if (audioRef.current && playState === 'playing' && activeVideo?.levelId === 1) {
        audioRef.current.volume = 0.5 * e.detail;
      }
    };
    window.addEventListener('mv_volume_change', handleVolume);
    return () => window.removeEventListener('mv_volume_change', handleVolume);
  }, [playState, activeVideo]);

  // Save completed videos to localStorage
  useEffect(() => {
    localStorage.setItem(user?.id ? `yoga_completed_videos_${user.id}` : 'yoga_completed_videos', JSON.stringify(completedVideos));
  }, [completedVideos, user]);

  // Save uploaded videos to localStorage
  useEffect(() => {
    localStorage.setItem(user?.id ? `yoga_uploaded_videos_${user.id}` : 'yoga_uploaded_videos', JSON.stringify(uploadedVideos));
  }, [uploadedVideos, user]);

  // Get next video in the current level for autoplay
  const getNextVideo = useCallback((levelId, currentVideoId) => {
    const level = LEVELS[levelId];
    if (!level) return null;
    let videos;
    if (level.hasGenderSplit) {
      videos = level3Gender === 'boys' ? level.boys : level.girls;
    } else {
      videos = level.videos;
    }
    const currentIndex = videos.findIndex(v => v.id === currentVideoId);
    if (currentIndex !== -1 && currentIndex < videos.length - 1) {
      return videos[currentIndex + 1];
    }
    return null;
  }, [level3Gender]);

  // Verify and reset streak if missed on mount, and sync states when user changes
  useEffect(() => {
    if (user?.id) {
      setDayStreaks(parseInt(localStorage.getItem(`yoga_day_streaks_${user.id}`) || '0', 10));
      try {
        setCompletedVideos(JSON.parse(localStorage.getItem(`yoga_completed_videos_${user.id}`) || '{}'));
      } catch {
        setCompletedVideos({});
      }
      setL1CompletedToday(localStorage.getItem(`yoga_l1_completion_time_${user.id}`) !== null);
      setL2CompletedToday(localStorage.getItem(`yoga_l2_completion_time_${user.id}`) !== null);
    }

    const lastStreakDate = localStorage.getItem(user?.id ? `yoga_last_streak_date_${user.id}` : 'yoga_last_streak_date');
    if (lastStreakDate) {
      const today = new Date().toDateString();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      
      // If last completed date is neither today nor yesterday, streak is broken!
      if (lastStreakDate !== today && lastStreakDate !== yesterdayStr) {
        localStorage.setItem(user?.id ? `yoga_day_streaks_${user.id}` : 'yoga_day_streaks', '0');
        localStorage.setItem(user?.id ? `yoga_streaks_${user.id}` : 'yoga_streaks', '0');
        setDayStreaks(0);
      }
    }
  }, [user]);

  const checkIfResetNeeded = useCallback(() => {
    const lastReset = localStorage.getItem('yoga_last_reset_date');
    const today = new Date().toLocaleDateString('en-CA');
    if (!lastReset) {
      localStorage.setItem('yoga_last_reset_date', today);
      return false;
    }
    return lastReset !== today;
  }, []);

  const performYogaReset = useCallback(() => {
    setCompletedVideos(prev => {
      const updated = { ...prev };
      let changed = false;
      Object.keys(updated).forEach(key => {
        if (key.startsWith('l1') || key.startsWith('l2')) {
          delete updated[key];
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem('yoga_completed_videos', JSON.stringify(updated));
      }
      return updated;
    });
    const today = new Date().toLocaleDateString('en-CA');
    localStorage.setItem('yoga_last_reset_date', today);
    localStorage.removeItem('yoga_l1_completion_time');
    localStorage.removeItem('yoga_l2_completion_time');
    setL1CompletedToday(false);
    setL2CompletedToday(false);
  }, []);

  // Check and perform reset on mount
  useEffect(() => {
    if (checkIfResetNeeded()) {
      performYogaReset();
    }
  }, [checkIfResetNeeded, performYogaReset]);

  // Periodic check (every 10 seconds) to handle midnight crossover when tab is open
  useEffect(() => {
    const interval = setInterval(() => {
      if (checkIfResetNeeded()) {
        performYogaReset();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [checkIfResetNeeded, performYogaReset]);

  // Midnight countdown timer and dynamic reset check
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0); // 12:00 AM local time
      const diff = midnight.getTime() - now.getTime();
      
      const lastReset = localStorage.getItem('yoga_last_reset_date');
      const today = now.toLocaleDateString('en-CA');
      
      if (diff <= 0 || (lastReset && lastReset !== today)) {
        performYogaReset();
      } else {
        const hours = Math.floor(diff / (3600 * 1000));
        const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
        const secs = Math.floor((diff % (60 * 1000)) / 1000);
        setL1ResetCountdown(
          `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        );
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [performYogaReset]);

  // Autoplay countdown timer logic when playState is 'completed'
  useEffect(() => {
    let timer;
    if (playState === 'completed' && activeVideo) {
      const nextV = getNextVideo(activeVideo.levelId, activeVideo.videoId);
      if (nextV) {
        timer = setInterval(() => {
          setAutoPlayCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              startVideo(activeVideo.levelId, nextV.id);
              return 3;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [playState, activeVideo, getNextVideo]);

  // Force GIF to restart every few seconds so it animates the full duration
  useEffect(() => {
    let gifTimer;
    if (playState === 'playing' && activeVideo) {
      // Restart the GIF every 4 seconds by changing the key
      // This forces React to remount the <img>, restarting the GIF animation
      gifTimer = setInterval(() => {
        setGifRestartKey(prev => prev + 1);
      }, 4000);
    }
    return () => {
      if (gifTimer) clearInterval(gifTimer);
    };
  }, [playState, activeVideo]);

  // Countdown and timer logic
  useEffect(() => {
    let timer;
    if (playState === 'countdown') {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setPlayState('playing');
            if (activeVideo) {
              const level = LEVELS[activeVideo.levelId];
              const videos = level.hasGenderSplit 
                ? (level3Gender === 'boys' ? level.boys : level.girls) 
                : level.videos;
              const video = videos.find(v => v.id === activeVideo.videoId);
              if (video) setTimeLeft(video.duration);
            }
            return 3;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (playState === 'playing') {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleVideoComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [playState, activeVideo]);

  const handleVideoComplete = () => {
    if (activeVideo) {
      setCompletedVideos(prev => {
        const updated = { ...prev, [activeVideo.videoId]: true };
        
        // Save the activity timestamp in localStorage for the 24 hour reset!
        if (activeVideo.levelId === 1 || activeVideo.levelId === 2) {
          localStorage.setItem(user?.id ? `yoga_last_activity_time_${user.id}` : 'yoga_last_activity_time', Date.now().toString());
        }

        // Check if level 1 is completed
        if (activeVideo.levelId === 1) {
          const level1Videos = LEVELS[1].videos;
          const level1Completed = level1Videos.every(v => updated[v.id]);
          const wasLevel1Completed = level1Videos.every(v => prev[v.id]);
          
          if (level1Completed && !wasLevel1Completed) {
            localStorage.setItem(user?.id ? `yoga_l1_completion_time_${user.id}` : 'yoga_l1_completion_time', Date.now().toString());
            localStorage.setItem(user?.id ? `yoga_level2_unlocked_permanently_${user.id}` : 'yoga_level2_unlocked_permanently', 'true');
            setL1CompletedToday(true);
            updateDayStreak();
            setTimeout(() => setShowStreakModal(true), 500);
          }
        }

        // Check if level 2 is completed
        if (activeVideo.levelId === 2) {
          const level2Videos = LEVELS[2].videos;
          const level2Completed = level2Videos.every(v => updated[v.id]);
          const wasLevel2Completed = level2Videos.every(v => prev[v.id]);
          
          if (level2Completed && !wasLevel2Completed) {
            localStorage.setItem(user?.id ? `yoga_l2_completion_time_${user.id}` : 'yoga_l2_completion_time', Date.now().toString());
            setL2CompletedToday(true);
            updateDayStreak();
            setTimeout(() => setShowStreakModal(true), 500);
          }
        }
        
        return updated;
      });

      const nextV = getNextVideo(activeVideo.levelId, activeVideo.videoId);
      if (nextV) {
        setAutoPlayCountdown(3);
      }
      setPlayState('completed');
    }
  };

  const updateDayStreak = () => {
    const lastStreakDate = localStorage.getItem(user?.id ? `yoga_last_streak_date_${user.id}` : 'yoga_last_streak_date');
    const today = new Date().toDateString();
    
    // Always mark today's activity in the yoga log for the Healthy Calendar
    const todayKey = new Date().toLocaleDateString('en-CA');
    try {
      const yogaLog = JSON.parse(localStorage.getItem(user?.id ? `yoga_activity_log_${user.id}` : 'yoga_activity_log') || '{}');
      yogaLog[todayKey] = true;
      localStorage.setItem(user?.id ? `yoga_activity_log_${user.id}` : 'yoga_activity_log', JSON.stringify(yogaLog));
    } catch (e) {
      console.error(e);
    }

    if (lastStreakDate !== today) {
      let currentStreak = parseInt(localStorage.getItem(user?.id ? `yoga_day_streaks_${user.id}` : 'yoga_day_streaks') || '0', 10);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastStreakDate === yesterday.toDateString()) {
        currentStreak += 1;
      } else {
        currentStreak = 1; // Start new streak
      }
      
      localStorage.setItem(user?.id ? `yoga_day_streaks_${user.id}` : 'yoga_day_streaks', currentStreak.toString());
      localStorage.setItem(user?.id ? `yoga_streaks_${user.id}` : 'yoga_streaks', currentStreak.toString()); // Sync Dashboard key
      localStorage.setItem(user?.id ? `yoga_last_streak_date_${user.id}` : 'yoga_last_streak_date', today);
      setDayStreaks(currentStreak);
    }
  };

  const canPlayVideo = (levelId, videoId) => {
    if (levelId === 2 && localStorage.getItem(user?.id ? `yoga_level2_unlocked_permanently_${user.id}` : 'yoga_level2_unlocked_permanently') !== 'true') {
      return false;
    }
    const level = LEVELS[levelId];
    if (!level.sequential) return true;
    
    const videos = level.videos;
    const videoIndex = videos.findIndex(v => v.id === videoId);
    
    if (videoIndex === 0) return true;
    // Previous video must be completed
    return completedVideos[videos[videoIndex - 1].id] === true;
  };

  const startVideo = (levelId, videoId) => {
    if (!canPlayVideo(levelId, videoId)) return;
    setActiveVideo({ levelId, videoId });
    setCountdown(3);
    setPlayState('countdown');
  };

  const closeVideoPlayer = () => {
    setActiveVideo(null);
    setPlayState('idle');
  };

  const handleUploadClick = (videoId) => {
    setUploadTarget(videoId);
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && uploadTarget) {
      const url = URL.createObjectURL(file);
      setUploadedVideos(prev => {
        const updated = { ...prev, [uploadTarget]: url };
        localStorage.setItem('yoga_uploaded_videos', JSON.stringify(updated));
        return updated;
      });
    }
    setUploadTarget(null);
    e.target.value = '';
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getLevelProgress = (levelId) => {
    const level = LEVELS[levelId];
    let videos;
    if (level.hasGenderSplit) {
      videos = [...level.boys, ...level.girls];
    } else {
      videos = level.videos;
    }
    const completed = videos.filter(v => completedVideos[v.id]).length;
    return Math.round((completed / videos.length) * 100);
  };

  const getVideoData = (levelId, videoId) => {
    const level = LEVELS[levelId];
    let videos;
    if (level.hasGenderSplit) {
      videos = level3Gender === 'boys' ? level.boys : level.girls;
    } else {
      videos = level.videos;
    }
    return videos.find(v => v.id === videoId);
  };

  const renderVideoCard = (video, levelId, index) => {
    const isCompleted = completedVideos[video.id];
    const isLocked = !canPlayVideo(levelId, video.id);
    const isActive = activeVideo?.videoId === video.id;
    const hasUploadedVideo = uploadedVideos[video.id];
    const level = LEVELS[levelId];

    return (
      <div 
        key={video.id} 
        className={`yoga-video-card ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''} ${isActive ? 'active' : ''}`}
        style={{ '--level-color': level.color }}
      >
        <div className="yoga-video-card-number" style={{ background: level.gradient }}>
          {isCompleted ? <CheckCircle size={20} /> : isLocked ? <Lock size={20} /> : (index + 1)}
        </div>

        <div className="yoga-video-card-thumbnail">
          {hasUploadedVideo ? (
            <video src={hasUploadedVideo} muted className="yoga-video-thumb" />
          ) : (
            <img src={video.gif} alt={transTitle(video.title)} className="yoga-video-thumb" />
          )}
          {isLocked && (
            <div className="yoga-video-lock-overlay">
              <Lock size={32} />
              <span>{lang === 'te' ? 'మునుపటి వీడియోను పూర్తి చేయండి' : lang === 'hi' ? 'पहले पिछला वीडियो पूरा करें' : lang === 'eu' ? 'Completa el vídeo anterior primero' : 'Complete previous video first'}</span>
            </div>
          )}
          {!isLocked && !isActive && (
            <div className="yoga-video-play-overlay" onClick={() => startVideo(levelId, video.id)}>
              <div className="yoga-play-circle">
                <Play size={28} fill="white" />
              </div>
            </div>
          )}
        </div>

        <div className="yoga-video-card-info">
          <h4>{transTitle(video.title)}</h4>
          <div className="yoga-video-meta">
            <span className="yoga-video-duration">{video.duration / 60} {lang === 'te' ? 'నిమి' : lang === 'hi' ? 'मिनट' : lang === 'eu' ? 'min' : 'min'}</span>
            {isCompleted && <span className="yoga-video-completed-badge">✓ {lang === 'te' ? 'పూర్తయింది' : lang === 'hi' ? 'पूर्ण' : lang === 'eu' ? 'Completado' : 'Completed'}</span>}
          </div>
        </div>

        <div className="yoga-video-card-actions">
          <button 
            className="yoga-upload-btn"
            onClick={() => handleUploadClick(video.id)}
            title={lang === 'te' ? 'మీ స్వంత వీడియోను అప్‌లోడ్ చేయండి' : lang === 'hi' ? 'अपना खुद का वीडियो अपलोड करें' : lang === 'eu' ? 'Sube tu propio vídeo' : 'Upload your own video'}
          >
            <Upload size={16} /> {lang === 'te' ? 'అప్‌లోడ్' : lang === 'hi' ? 'अपलोड' : lang === 'eu' ? 'Subir' : 'Upload'}
          </button>
          {!isLocked && (
            <button 
              className="yoga-start-btn"
              onClick={() => startVideo(levelId, video.id)}
              style={{ background: level.gradient }}
            >
              <Play size={16} fill="white" /> {isCompleted ? (lang === 'te' ? 'తిరిగి ప్లే' : lang === 'hi' ? 'फिर खेलें' : lang === 'eu' ? 'Repetir' : 'Replay') : yt('start')}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderLevelSection = (levelId) => {
    const level = LEVELS[levelId];
    const progress = getLevelProgress(levelId);

    return (
      <div className="yoga-level-section" key={levelId} id={`yoga-level-${levelId}`}>
        {/* Level Header */}
        <div className="yoga-level-header" style={{ background: level.gradient }}>
          <div className="yoga-level-header-left">
            <span className="yoga-level-icon">{level.icon}</span>
            <div>
              <h2>{transTitle(level.title)}</h2>
              <p className="yoga-level-desc">
                {level.sequential 
                  ? (lang === 'te' ? '🔒 వరుస క్రమం — తదుపరి దాన్ని అన్‌లాక్ చేయడానికి ప్రతి వీడియోను పూర్తి చేయండి' : lang === 'hi' ? '🔒 क्रमिक — अगले को अनलॉक करने के लिए प्रत्येक वीडियो को पूरा करें' : lang === 'eu' ? '🔒 Secuencial — Completa cada vídeo para desbloquear el siguiente' : '🔒 Sequential — Complete each video to unlock the next') 
                  : (lang === 'te' ? '🔓 ఉచిత ప్రవేశం — ఎప్పుడైనా ఏ వీడియోనైనా ఓపెన్ చేయవచ్చు' : lang === 'hi' ? '🔓 मुफ्त पहुंच — कभी भी कोई भी वीडियो खोलें' : lang === 'eu' ? '🔓 Acceso Libre — Abre cualquier vídeo en cualquier momento' : '🔓 Free Access — Open any video anytime')}
              </p>
            </div>
          </div>
          <div className="yoga-level-progress-ring">
            <svg viewBox="0 0 36 36" className="yoga-circular-progress">
              <path
                className="yoga-circle-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="yoga-circle-fill"
                strokeDasharray={`${progress}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="yoga-progress-text">{progress}%</span>
          </div>
        </div>

        {levelId === 1 && l1CompletedToday && (
          <div className="yoga-l1-completed-banner">
            <Flame size={48} className="yoga-l1-completed-icon" color="#fff" fill="#fff" />
            <h3 className="yoga-l1-completed-title">
              {lang === 'te' ? 'నేటి ప్రాణాయామం పూర్తయింది! 🎉' : lang === 'hi' ? 'आज का प्राणायाम पूरा हुआ! 🎉' : lang === 'eu' ? '¡Pranayama de hoy Completado! 🎉' : "Today's Pranayama Completed! 🎉"}
            </h3>
            <p className="yoga-l1-completed-desc">
              {lang === 'te' ? 'మీరు ఈ రోజు సెషన్‌ను విజయవంతంగా పూర్తి చేసారు. మీ రోజువారీ స్ట్రీక్ యాక్టివ్‌గా ఉంది.' : lang === 'hi' ? 'आपने आज का सत्र सफलतापूर्वक पूरा कर लिया है। आपकी दैनिक स्ट्रीक सक्रिय है।' : lang === 'eu' ? 'Has completado con éxito la sesión de hoy. Tu racha diaria está activa.' : "You have successfully completed today's session. Your daily streak is active."}
            </p>
            <div className="yoga-l1-countdown-box">
              {l1ResetCountdown}
            </div>
            <button className="yoga-l1-reset-btn" onClick={performYogaReset}>
              <Zap size={18} fill="#059669" />
              {lang === 'te' ? 'ఇప్పుడే మళ్లీ ప్రారంభించండి (స్టార్ట్ ఫ్రెష్)' : lang === 'hi' ? 'अभी नए सिरे से शुरू करें' : lang === 'eu' ? 'Comenzar de nuevo ahora' : 'Start Fresh Now'}
            </button>
          </div>
        )}

        {/* Gender Toggle for Level 3 */}
        {level.hasGenderSplit && (
          <div className="yoga-gender-toggle">
            <button 
              className={`yoga-gender-btn ${level3Gender === 'boys' ? 'active' : ''}`}
              onClick={() => setLevel3Gender('boys')}
            >
              <Dumbbell size={18} /> {yt('boys')}
            </button>
            <button 
              className={`yoga-gender-btn girls ${level3Gender === 'girls' ? 'active' : ''}`}
              onClick={() => setLevel3Gender('girls')}
            >
              <Heart size={18} /> {yt('girls')}
            </button>
          </div>
        )}

        {/* Video Grid */}
        <div className="yoga-video-grid">
          {level.hasGenderSplit
            ? (level3Gender === 'boys' ? level.boys : level.girls).map((video, idx) => renderVideoCard(video, levelId, idx))
            : level.videos.map((video, idx) => renderVideoCard(video, levelId, idx))
          }
        </div>
      </div>
    );
  };

  // Get active video data for player modal
  const activeVideoData = activeVideo ? getVideoData(activeVideo.levelId, activeVideo.videoId) : null;
  const activeLevel = activeVideo ? LEVELS[activeVideo.levelId] : null;

  return (
    <div className="yoga-page-container">
      {/* Header */}
      <div className="yoga-top-header">
        <button onClick={() => navigate('/dashboard')} className="yoga-back-btn">
          <ChevronLeft size={20} /> {yt('backToDashboard')}
        </button>
        <div className="yoga-header-stats" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <SectionAbout
            title={yt('title')}
            icon="🧘"
            color="#855CF8"
            gradient="linear-gradient(135deg, #a29bfe, #6c5ce7)"
            what={yt('aboutWhat')}
            howToUse={yt('aboutHow')}
            importance={yt('aboutWhy')}
            style={{ position: 'static', margin: 0, padding: '0.4rem 0.8rem' }}
          />
          <div className="yoga-stat-chip flame">
            <Flame size={18} color="#ff6b6b" fill="#ff6b6b" />
            <span>{dayStreaks} {yt('dayStreak')}</span>
          </div>
          <div className="yoga-stat-chip reset-timer">
            <Clock size={18} color="#059669" />
            <span>{lang === 'te' ? 'రీసెట్ అవ్వడానికి' : lang === 'hi' ? 'रीसेट में' : lang === 'eu' ? 'Restablecer en' : 'Reset in'}: {l1ResetCountdown || '00:00:00'}</span>
          </div>
          <div className="yoga-stat-chip trophy">
            <Trophy size={18} color="#feca57" />
            <span>{lang === 'te' ? 'మొత్తం పురోగతి' : lang === 'hi' ? 'कुल प्रगति' : lang === 'eu' ? 'Progreso Total' : 'Total Progress'}</span>
          </div>
        </div>
      </div>

      {/* Motivation Banner */}
      <div className="yoga-motivation-banner">
        <div className="yoga-motivation-glow"></div>
        <p className="yoga-slogan">"{transTitle(currentSlogan)}"</p>
      </div>

      {/* Level Navigation Tabs */}
      <div className="yoga-level-tabs">
        {[1, 2, 3, 4, 5].map(lvl => {
          const isL2Locked = lvl === 2 && localStorage.getItem(user?.id ? `yoga_level2_unlocked_permanently_${user.id}` : 'yoga_level2_unlocked_permanently') !== 'true';
          return (
            <a 
              key={lvl} 
              href={isL2Locked ? '#' : `#yoga-level-${lvl}`}
              onClick={(e) => {
                if (isL2Locked) {
                  e.preventDefault();
                  alert(lang === 'te' ? 'లెవెల్ 2 లాక్ చేయబడింది! దాన్ని అన్‌లాక్ చేయడానికి ముందు లెవెల్ 1 పూర్తి చేయండి.' : lang === 'hi' ? 'लेवल 2 लॉक है! इसे अनलॉक करने के लिए पहले लेवल 1 पूरा करें।' : lang === 'eu' ? '¡El nivel 2 está bloqueado! Completa el nivel 1 primero para desbloquearlo.' : 'Level 2 is locked! Complete Level 1 first to unlock it.');
                }
              }}
              className={`yoga-level-tab ${isL2Locked ? 'tab-locked' : ''}`}
              style={{ '--tab-color': LEVELS[lvl].color, '--tab-gradient': LEVELS[lvl].gradient }}
            >
              <span className="yoga-tab-icon">{isL2Locked ? <Lock size={16} /> : LEVELS[lvl].icon}</span>
              <span className="yoga-tab-label">{yt('level')} {lvl}</span>
              <span className="yoga-tab-progress">{getLevelProgress(lvl)}%</span>
            </a>
          );
        })}
      </div>

      {/* All Levels */}
      <div className="yoga-levels-wrapper">
        {[1, 2, 3, 4, 5].map(lvl => renderLevelSection(lvl))}
      </div>

      {/* Video Player Modal */}
      {activeVideo && activeVideoData && (
        <div className="yoga-player-modal">
          <div className="yoga-player-backdrop" onClick={closeVideoPlayer}></div>
          <div className="yoga-player-content">
            <button className="yoga-player-close" onClick={closeVideoPlayer}>
              <X size={24} />
            </button>
            
            <div className="yoga-player-header" style={{ background: activeLevel?.gradient }}>
              <h3>{transTitle(activeVideoData.title)}</h3>
              <span>{activeVideoData.duration / 60} {lang === 'te' ? 'నిమి' : lang === 'hi' ? 'मिनट' : lang === 'eu' ? 'min' : 'min'}</span>
            </div>

            <div className="yoga-player-video-area">
              {uploadedVideos[activeVideo.videoId] ? (
                <video 
                  ref={videoRef}
                  src={uploadedVideos[activeVideo.videoId]} 
                  className="yoga-player-media"
                  autoPlay={playState === 'playing'}
                  loop
                  muted
                />
              ) : (
                <img 
                  key={`gif-player-${gifRestartKey}`}
                  src={activeVideoData.gif} 
                  alt={transTitle(activeVideoData.title)} 
                  className="yoga-player-media"
                />
              )}

              {playState === 'countdown' && (
                <div className="yoga-player-overlay">
                  <div className="yoga-countdown-num">{countdown}</div>
                  <p>{lang === 'te' ? 'సిద్ధంగా ఉండండి!' : lang === 'hi' ? 'तैयार हो जाओ!' : lang === 'eu' ? '¡Prepárate!' : 'Get Ready!'}</p>
                </div>
              )}
              {playState === 'completed' && (
                <div className="yoga-player-overlay completed">
                  <CheckCircle size={64} color="#00b894" />
                  <h3>{lang === 'te' ? 'వీడియో పూర్తయింది! 🎉' : lang === 'hi' ? 'वीडियो पूर्ण हुआ! 🎉' : lang === 'eu' ? '¡Vídeo Completado! 🎉' : 'Video Completed! 🎉'}</h3>
                  
                  {getNextVideo(activeVideo.levelId, activeVideo.videoId) ? (
                    <div className="yoga-next-exercise-container">
                      <p className="yoga-next-countdown-text">
                        {lang === 'te' ? `తదుపరి వ్యాయామం ${autoPlayCountdown} సెకన్లలో ప్రారంభమవుతుంది...` 
                         : lang === 'hi' ? `अगला व्यायाम ${autoPlayCountdown} सेकंड में शुरू होगा...` 
                         : lang === 'eu' ? `El siguiente ejercicio comenzará en ${autoPlayCountdown} segundos...` 
                         : `Next exercise starts in ${autoPlayCountdown} seconds...`}
                      </p>
                      <div className="yoga-next-actions">
                        <button className="yoga-player-done-btn secondary" onClick={closeVideoPlayer}>
                          {yt('done')}
                        </button>
                        <button 
                          className="yoga-player-done-btn primary" 
                          onClick={() => {
                            const nextV = getNextVideo(activeVideo.levelId, activeVideo.videoId);
                            if (nextV) {
                              startVideo(activeVideo.levelId, nextV.id);
                            }
                          }}
                          style={{ background: activeLevel?.gradient }}
                        >
                          {yt('nextExercise')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className="yoga-player-done-btn" onClick={closeVideoPlayer}>
                      {yt('done')}
                    </button>
                  )}
                </div>
              )}
            </div>

            {playState === 'playing' && (
              <div className="yoga-player-timer">
                <div className="yoga-timer-time">{formatTime(timeLeft)}</div>
                <div className="yoga-timer-bar">
                  <div 
                    className="yoga-timer-fill" 
                    style={{ 
                      width: `${((activeVideoData.duration - timeLeft) / activeVideoData.duration) * 100}%`,
                      background: activeLevel?.gradient 
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="video/*"
        onChange={handleFileUpload}
      />

      {/* OM background audio — Level 1 only */}
      <audio ref={audioRef} src={omSound} loop preload="auto" />

      {/* Streak Celebration Modal */}
      {showStreakModal && (
        <div className="yoga-player-modal streak-modal-overlay">
          <div className="yoga-player-content streak-modal-content">
            <Flame size={80} color="#ff6b6b" fill="#ff6b6b" className="streak-flame-icon" />
            <h2>{lang === 'te' ? 'స్థాయి 1 పూర్తయింది!' : lang === 'hi' ? 'स्तर 1 पूर्ण हुआ!' : lang === 'eu' ? '¡Nivel 1 Completado!' : 'Level 1 Completed!'}</h2>
            <p>{lang === 'te' ? 'అద్భుతమైన పని! మీరు మీ రోజువారీ స్ట్రీక్‌ను అన్‌లాక్ చేసారు.' : lang === 'hi' ? 'शानदार काम! आपने अपना दैनिक सिलसिला अनलॉक कर लिया है।' : lang === 'eu' ? '¡Excelente trabajo! Has desbloqueado tu racha diaria.' : 'Amazing work! You\'ve unlocked your daily streak.'}</p>
            <div className="streak-day-count">
              <span>{dayStreaks}</span> {yt('dayStreak')}
            </div>
            <button className="yoga-start-btn" onClick={() => setShowStreakModal(false)} style={{ background: 'linear-gradient(135deg, #ff6b6b, #ff4757)', marginTop: '20px', width: '100%', padding: '15px', fontSize: '1.1rem' }}>
              {lang === 'te' ? 'ఇలాగే కొనసాగించండి!' : lang === 'hi' ? 'इसे जारी रखें!' : lang === 'eu' ? '¡Sigue así!' : 'Keep it up!'}
            </button>
          </div>
        </div>
      )}

      {/* SectionAbout moved inside top header stats, left of the Day Streak chip */}

      {/* AI ChatBot Assistant */}
      <ChatBot
        systemPrompt={`You are YogaBot, a friendly and expert yoga assistant embedded in MediVault. You specialize EXCLUSIVELY in:
- Yoga asanas (poses): correct form, benefits, contraindications, modifications for beginners/advanced
- Pranayama (breathing exercises): Anulom Vilom, Kapalbhati, Bhramari, Nadi Shodhana, etc.
- Meditation and mindfulness techniques
- Yoga philosophy (the 8 limbs of yoga, chakras, etc.)
- Flexibility, balance, and strength through yoga
- Yoga for specific conditions: back pain, stress, anxiety, diabetes, hypertension, etc.
- Warm-up and cool-down routines
- Level 1 Pranayama, Level 2 Advanced Yoga, exercise levels

Always give accurate, detailed, and practical yoga answers. If asked about diet, water, or non-yoga topics, briefly answer but steer back to yoga. Never give generic responses - always be specific about asanas, breathing patterns, and durations.`}
        welcomeMessage={lang === 'te' ? 'నమస్తే! 🙏 నేను యోగాబాట్ — మీ నిపుణులైన యోగా గైడ్. ఏదైనా ఆసనం, ప్రాణాయామం లేదా యోగా పద్ధతి గురించి నన్ను అడగండి!' : lang === 'hi' ? 'नमस्ते! 🙏 मैं योगाबॉट हूं — आपका विशेषज्ञ योग गाइड। मुझसे किसी भी आसन, प्राणायाम या योग तकनीक के बारे में पूछें!' : lang === 'eu' ? '¡Namasté! 🙏 Soy YogaBot, tu guía experto de yoga. ¡Pregúntame sobre cualquier asana, pranayama o técnica de yoga!' : 'Namaste! 🙏 I\'m YogaBot — your expert yoga guide. Ask me about any asana, pranayama, or yoga technique!'}
        quickPrompts={[
          lang === 'te' ? 'అనులోమ విలోమ ప్రయోజనాలు?' : lang === 'hi' ? 'अनुलोम विलोम के लाभ?' : lang === 'eu' ? '¿Beneficios de Anulom Vilom?' : 'Benefits of Anulom Vilom?',
          lang === 'te' ? 'నడుము నొప్పికి ఉత్తమ ఆసనాలు?' : lang === 'hi' ? 'पीठ दर्द के लिए सर्वोत्तम आसन?' : lang === 'eu' ? '¿Mejores posturas para dolor de espalda?' : 'Best poses for back pain?',
          lang === 'te' ? 'కపాలభాతి ఎలా చేయాలి?' : lang === 'hi' ? 'कपालभाति कैसे करें?' : lang === 'eu' ? '¿Cómo hacer Kapalbhati?' : 'How to do Kapalbhati?',
          lang === 'te' ? 'ఉదయపు యోగా దినచర్య?' : lang === 'hi' ? 'सुबह का योग रूटीन?' : lang === 'eu' ? '¿Rutina de yoga por la mañana?' : 'Morning yoga routine?'
        ]}
        botName={lang === 'te' ? 'యోగాబాట్ 🧘' : lang === 'hi' ? 'योगाबॉट 🧘' : lang === 'eu' ? 'YogaBot 🧘' : 'YogaBot 🧘'}
        accentColor="#667eea"
      />
    </div>
  );
}
