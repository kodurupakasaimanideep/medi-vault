import React, { useState, useEffect, useRef } from 'react';
import { Bell, Mic, MicOff, Music, Music2, Plus, Trash2, Edit2, Play, Square, Pill, Clock } from 'lucide-react';
import Swal from 'sweetalert2';
import { ALARM_SOUNDS } from '../components/AlarmManager';
import { syncTabletAlarmsToSW, requestNotificationPermission } from '../services/swManager';
import { syncRemindersToFirestore } from '../services/notificationManager';
import { scheduleNativeTabletAlarms, requestNativePermissions, isNativeApp } from '../services/nativeNotificationService';
import SectionAbout from '../components/SectionAbout';

import { useLanguage } from '../contexts/LanguageContext';

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#8b5cf6');
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '139, 92, 246';
};

export default function TabletAlarm({ user }) {
  const [alarms, setAlarms] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAlarm, setNewAlarm] = useState({ id: null, tablet: '', time: '', music: 'Gentle Chime', color: '#8b5cf6', active: true });
  const [notifPermission, setNotifPermission] = useState(Notification.permission || 'default');
  
  // Audio Recorder State
  const [isRecording, setIsRecording] = useState(false);
  const [voices, setVoices] = useState([]); // Array of { id, name, url }
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const chunks = useRef([]);
  
  // Volume State
  const [volume, setVolume] = useState(1);

  const { lang } = useLanguage();

  const localT = {
    en: {
      title: "Tablet Reminder",
      subtitle: "Never miss a dose. We'll alert your PC and mobile!",
      setAlarm: "Set New Alarm",
      notifTitle: "Enable Notifications for Background Alarms",
      notifDesc: "You must allow notifications so reminders work even when this website is closed.",
      allowNotif: "Allow Notifications",
      notifActive: "Background alarms active — You'll receive notifications even when this website is closed!",
      reminders: "Your Reminders",
      noAlarms: "No alarms set. Add one to get started!",
      soundLabel: "Sound",
      volTitle: "Alarm Volume Setting",
      volDesc: "Adjust the loudness of the tablet reminder pop-up.",
      editAlarm: "Edit Alarm",
      tabletName: "Tablet Name",
      tabletNamePl: "e.g. Paracetamol, Vitamin C...",
      timeLabel: "Time",
      soundSelLabel: "Notification Sound",
      colorLabel: "Alarm Color",
      saveReminder: "Save Reminder",
      cancel: "Cancel",
      customizeSound: "Customize Notification Sound",
      customizeDesc: "Record your own human voice to play as the alarm notification. E.g. \"Hey, it's time to take your Vitamin D!\". The notification will ring for a full minute to ensure you don't miss it.",
      recordVoice: "Record New Voice",
      stopRecord: "Stop Recording",
      noRecorded: "No recorded voices yet",
      humanVoiceGroup: "Custom Human Voices",
      testSound: "Test Sound",

      // SweetAlerts
      confirmDeleteTitle: "Are you sure?",
      confirmDeleteText: "You won't be able to revert this!",
      confirmDeleteBtn: "Yes, delete it!",
      deletedTitle: "Deleted!",
      deletedText: "Your alarm has been deleted.",
      savedTitle: "Alarm Saved!",
      savedText: "Reminder set for ",
      voiceDeleteTitle: "Delete this voice?",
      voiceDeleteText: "Alarms using this voice will fallback to default siren.",
      recNameTitle: "Name your recording",
      recLabel: "Give this voice a name (e.g. Mom, Dad, Doc)",
      recPl: "Enter voice name...",
      recValError: "You need to write something!",
      voiceSavedTitle: "Voice Saved!",
      voiceSavedText: "is saved! Please choose this voice when you create or edit an alarm.",
      micErrorTitle: "Microphone Error",
      micErrorText: "Could not access the microphone.",

      aboutWhat: "Tablet Reminder is an intelligent medicine alarm system that notifies you exactly when to take each tablet. It supports multiple daily alarms with different medicine names, custom alarm sounds (7 peaceful tones), personalized human voice recordings, alarm color coding, and background notifications that fire even when MediVault is closed.",
      aboutHow: [
        'Click "Set New Alarm" at the top to open the alarm creation form.',
        'Enter the tablet name (e.g., Paracetamol, Vitamin D, Blood Pressure Pill).',
        'Set the exact time you need to take the medicine using the time picker.',
        'Choose an alarm sound from 7 peaceful options: Gentle Chime, Morning Bells, Harp, etc.',
        'Click the small play buttons (▶) to preview each sound before selecting.',
        'Pick an alarm color to visually distinguish different medicines at a glance.',
        'Click "Save Reminder" to activate the alarm.',
        'Use the toggle switch on each alarm card to enable or disable it without deleting.',
        'Click the test button on an alarm card to preview the alarm sound anytime.',
        'Press edit to change tablet name, time, or sound of an existing alarm.',
        'Press delete to permanently remove an alarm you no longer need.',
        'Use the volume slider to set how loud the alarm notification plays.',
        'Click "Record New Voice" to record your own custom voice alarm (e.g., mom or doctor voice).',
        'Stop recording and name your voice — it will appear in the sound selector for any alarm.',
        'Allow browser notifications when prompted to receive background alarms even when the tab is closed.',
      ],
      aboutWhy: [
        'Missing a medicine dose can have serious health consequences for chronic conditions.',
        'Multiple configurable alarms support complex regimens with different medicines at different times.',
        'Background notifications ensure you receive reminders even if MediVault is not open.',
        'Custom human voice recordings make reminders personal and harder to ignore.',
        'Color-coded alarms make it instantly clear which medicine is due at a glance.',
        'Volume control ensures the alarm is audible even in noisy environments.',
        'Patients with hypertension, diabetes, or epilepsy absolutely must not miss daily medication.',
        'Helps elderly patients or those with memory issues remember complex medication schedules.',
        'Caretakers can set up alarms on behalf of patients who may not use apps themselves.',
        'Reduces medicine wastage by ensuring medicines are taken at the correct time consistently.',
      ]
    },
    te: {
      title: "మాత్ర అలారం",
      subtitle: "ఒక్క డోసు కూడా మిస్ కావద్దు. మొబైల్ & పిసి లలో హెచ్చరిస్తాము!",
      setAlarm: "కొత్త అలారం సెట్ చేయి",
      notifTitle: "బ్యాక్‌గ్రౌండ్ అలారాల కోసం నోటిఫికేషన్‌లను ప్రారంభించండి",
      notifDesc: "ఈ వెబ్‌సైట్ మూసివేసినప్పటికీ అలారం పనిచేయడానికి నోటిఫికేషన్‌లను అనుమతించాలి.",
      allowNotif: "నోటిఫికేషన్‌లను అనుమతించు",
      notifActive: "బ్యాక్‌గ్రౌండ్ అలారాలు యాక్టివ్‌గా ఉన్నాయి — వెబ్‌సైట్ మూసివేసినా నోటిఫికేషన్‌లు వస్తాయి!",
      reminders: "మీ రిమైండర్‌లు",
      noAlarms: "అలారాలు ఏవీ సెట్ చేయలేదు. ప్రారంభించడానికి ఒకటి జోడించండి!",
      soundLabel: "ధ్వని",
      volTitle: "అలారం వాల్యూమ్ సెట్టింగ్",
      volDesc: "రిమైండర్ పాప్-అప్ యొక్క ధ్వని తీవ్రతను సర్దుబాటు చేయండి.",
      editAlarm: "అలారం సవరించు",
      tabletName: "మాత్ర పేరు",
      tabletNamePl: "ఉదా. పారాసిటమాల్, విటమిన్ సి...",
      timeLabel: "సమయం",
      soundSelLabel: "నోటిఫికేషన్ ధ్వని",
      colorLabel: "అలారం రంగు",
      saveReminder: "రిమైండర్ సేవ్ చేయి",
      cancel: "రద్దు చేయి",
      customizeSound: "నోటిఫికేషన్ ధ్వనిని అనుకూలీకరించు",
      customizeDesc: "అలారంగా ప్లే చేయడానికి మీ స్వంత మానవ స్వరాన్ని రికార్డ్ చేయండి. ఉదా. \"విటమిన్ డి వేసుకునే సమయం అయింది!\".",
      recordVoice: "కొత్త వాయిస్ రికార్డ్ చేయి",
      stopRecord: "రికార్డింగ్ ఆపు",
      noRecorded: "ఇంకా రికార్డ్ చేసిన వాయిస్‌లు లేవు",
      humanVoiceGroup: "కస్టమ్ మానవ స్వరాలు",
      testSound: "ధ్వనిని పరీక్షించు",

      // SweetAlerts
      confirmDeleteTitle: "మీరు ఖచ్చితంగా తొలగించాలనుకుంటున్నారా?",
      confirmDeleteText: "ఈ చర్యను తిరిగి మార్చడం సాధ్యం కాదు!",
      confirmDeleteBtn: "అవును, తొలగించు!",
      deletedTitle: "తొలగించబడింది!",
      deletedText: "మీ అలారం తొలగించబడింది.",
      savedTitle: "అలారం సేవ్ చేయబడింది!",
      savedText: "రిమైండర్ సమయం: ",
      voiceDeleteTitle: "ఈ వాయిస్‌ని తొలగించాలా?",
      voiceDeleteText: "ఈ వాయిస్‌ని ఉపయోగిస్తున్న అలారాలు డిఫాల్ట్ సైరన్‌కి మారుతాయి.",
      recNameTitle: "మీ రికార్డింగ్‌కి పేరు పెట్టండి",
      recLabel: "ఈ వాయిస్‌కి పేరు పెట్టండి (ఉదా. అమ్మ, నాన్న, డాక్టర్)",
      recPl: "వాయిస్ పేరు నమోదు చేయండి...",
      recValError: "మీరు ఏదైనా రాయాలి!",
      voiceSavedTitle: "వాయిస్ సేవ్ చేయబడింది!",
      voiceSavedText: "సేవ్ చేయబడింది! అలారం సృష్టించేటప్పుడు లేదా సవరించేటప్పుడు దీనిని ఎంచుకోండి.",
      micErrorTitle: "మైక్రోఫోన్ లోపం",
      micErrorText: "మైక్రోఫోన్‌ని యాక్సెస్ చేయడం సాధ్యం కాలేదు.",

      aboutWhat: "మాత్ర అలారం అనేది ఒక తెలివైన ఔషధ అలారం వ్యవస్థ, ఇది ఏ మాత్ర ఎప్పుడు వేసుకోవాలో సమయానికి మీకు తెలియజేస్తుంది. వెబ్‌సైట్ మూసివేసినప్పటికీ బ్యాక్‌గ్రౌండ్‌లో నోటిఫికేషన్‌లు వస్తాయి.",
      aboutHow: [
        'అలారం క్రియేషన్ ఫారమ్‌ను తెరవడానికి పైన ఉన్న \"కొత్త అలారం సెట్ చేయి\" బటన్‌ను క్లిక్ చేయండి.',
        'మాత్ర పేరును నమోదు చేయండి (ఉదా., పారాసిటమాల్, విటమిన్ డి).',
        'టైమ్ పిక్కర్ ఉపయోగించి మాత్ర వేసుకోవాల్సిన ఖచ్చితమైన సమయాన్ని సెట్ చేయండి.',
        '7 రకాల ప్రశాంతమైన అలారం శబ్దాల నుండి నచ్చిన దానిని ఎంచుకోండి.',
        'ఎంచుకునే ముందు శబ్దాన్ని వినడానికి చిన్న ప్లే (▶) బటన్‌లను క్లిక్ చేయండి.',
        'మందులను సులభంగా గుర్తించడానికి అలారం రంగును ఎంచుకోండి.',
        'అలారంను సక్రియం చేయడానికి \"రిమైండర్ సేవ్ చేయి\" క్లిక్ చేయండి.',
        'అలారంను తొలగించకుండా తాత్కాలికంగా ఆపడానికి లేదా ఆన్ చేయడానికి టోగుల్ స్విచ్ ఉపయోగించండి.',
        'అలారం శబ్దాన్ని పరీక్షించడానికి ▶ టెస్ట్ బటన్‌ను నొక్కండి.',
        'ఉన్న అలారం సవరించడానికి ఎడిట్ బటన్ ఉపయోగించండి.',
        'శాశ్వతంగా తొలగించడానికి డిలీట్ ఉపయోగించండి.',
        'స్లైడర్ ఉపయోగించి అలారం సౌండ్ తీవ్రతను సర్దుబాటు చేయండి.',
        'మీ స్వంత వాయిస్ (ఉదా. అమ్మ వాయిస్ లేదా డాక్టర్ వాయిస్) అలారంగా సెట్ చేయడానికి \"కొత్త వాయిస్ రికార్డ్ చేయి\" బటన్‌ను క్లిక్ చేయండి.',
      ],
      aboutWhy: [
        'దీర్ఘకాలిక సమస్యల కోసం మాత్రలు వేసుకోవడం మర్చిపోవడం ఆరోగ్యానికి హానికరం.',
        'వివిధ సమయాల్లో వివిధ మందుల కోసం బహుళ అలారాలను సెట్ చేసుకోవచ్చు.',
        'వెబ్‌సైట్ మూసివేసినా బ్యాక్‌గ్రౌండ్ అలారాలు నోటిఫికేషన్‌ల ద్వారా మిమ్మల్ని హెచ్చరిస్తాయి.',
        'స్వంత మానవ వాయిస్ అలారాలు అలారంను మరింత ఆకర్షణీయంగా మరియు నిర్లక్ష్యం చేయలేనిదిగా మారుస్తాయి.',
        'రంగుల అలారాల ద్వారా ఏ మందు వేసుకోవాలో సులభంగా అర్థమవుతుంది.',
        'వాల్యూమ్ నియంత్రణ నిశ్శబ్ద లేదా శబ్దం ఉన్న వాతావరణానికి అనుగుణంగా మార్చుకోవడానికి సహాయపడుతుంది.',
      ]
    },
    hi: {
      title: "टेबलेट अलार्म",
      subtitle: "कोई भी खुराक न छोड़ें. हम आपके पीसी और मोबाइल पर अलर्ट भेजेंगे!",
      setAlarm: "नया अलार्म सेट करें",
      notifTitle: "पृष्ठभूमि अलार्म के लिए सूचनाएं चालू करें",
      notifDesc: "वेबसाइट बंद होने पर भी अलार्म चालू रखने के लिए आपको सूचनाओं की अनुमति देनी होगी।",
      allowNotif: "सूचनाओं की अनुमति दें",
      notifActive: "पृष्ठभूमि अलार्म सक्रिय हैं — वेबसाइट बंद होने पर भी सूचनाएं मिलेंगी!",
      reminders: "आपके अनुस्मारक",
      noAlarms: "कोई अलार्म सेट नहीं है। शुरू करने के लिए एक जोड़ें!",
      soundLabel: "ध्वनि",
      volTitle: "अलार्म वॉल्यूम सेटिंग",
      volDesc: "रिमाइंडर पॉप-अप की ध्वनि की तीव्रता को समायोजित करें।",
      editAlarm: "अलार्म संपादित करें",
      tabletName: "टेबलेट का नाम",
      tabletNamePl: "जैसे. पैरासिटामोल, विटामिन सी...",
      timeLabel: "समय",
      soundSelLabel: "अधिसूचना ध्वनि",
      colorLabel: "अलार्म का रंग",
      saveReminder: "रिमाइंडर सहेजें",
      cancel: "रद्द करें",
      customizeSound: "अधिसूचना ध्वनि कस्टमाइज़ करें",
      customizeDesc: "अलार्म के रूप में बजने के लिए अपनी खुद की मानव आवाज रिकॉर्ड करें। जैसे \"विटामिन डी लेने का समय हो गया है!\".",
      recordVoice: "नई आवाज रिकॉर्ड करें",
      stopRecord: "रिकॉर्डिंग रोकें",
      noRecorded: "अभी तक कोई रिकॉर्ड की गई आवाज नहीं है",
      humanVoiceGroup: "कस्टम मानव आवाजें",
      testSound: "ध्वनि का परीक्षण करें",

      // SweetAlerts
      confirmDeleteTitle: "क्या आप वाकई हटाना चाहते हैं?",
      confirmDeleteText: "आप इस क्रिया को पूर्ववत नहीं कर पाएंगे!",
      confirmDeleteBtn: "हाँ, इसे हटाएँ!",
      deletedTitle: "हटाया गया!",
      deletedText: "आपका अलार्म हटा दिया गया है।",
      savedTitle: "अलार्म सहेजा गया!",
      savedText: "अनुस्मारक समय: ",
      voiceDeleteTitle: "क्या इस आवाज को हटाना चाहते हैं?",
      voiceDeleteText: "इस आवाज का उपयोग करने वाले अलार्म डिफ़ॉल्ट सायरन पर रीसेट हो जाएंगे।",
      recNameTitle: "अपनी रिकॉर्डिंग को नाम दें",
      recLabel: "इस आवाज को एक नाम दें (जैसे माँ, पिताजी, डॉक्टर)",
      recPl: "आवाज का नाम दर्ज करें...",
      recValError: "आपको कुछ लिखना होगा!",
      voiceSavedTitle: "आवाज सहेजी गई!",
      voiceSavedText: "सहेज ली गई है! अलार्म बनाते या संपादित करते समय इसे चुनें।",
      micErrorTitle: "माइक्रोफोन त्रुटि",
      micErrorText: "माइक्रोफ़ोन तक नहीं पहुंचा जा सका।",

      aboutWhat: "टेबलेट अलार्म एक बुद्धिमान दवा अलार्म प्रणाली है जो आपको बताती है कि प्रत्येक टेबलेट कब लेनी है। यह पृष्ठभूमि सूचनाओं का समर्थन करता है ताकि वेबसाइट बंद होने पर भी अलार्म काम करे।",
      aboutHow: [
        'अलार्म निर्माण फॉर्म खोलने के लिए शीर्ष पर \"नया अलार्म सेट करें\" बटन पर क्लिक करें।',
        'दवा का नाम दर्ज करें (जैसे, पैरासिटामोल, विटामिन डी)।',
        'समय पिकर का उपयोग करके दवा लेने का सही समय सेट करें।',
        '7 प्रकार की शांत अलार्म ध्वनियों में से अपनी पसंद की ध्वनि चुनें।',
        'चुनने से पहले ध्वनि सुनने के लिए छोटे प्ले (▶) बटन पर क्लिक करें।',
        'दवाओं को आसानी से पहचानने के लिए अलार्म का रंग चुनें।',
        'अलार्म सक्रिय करने के लिए \"रिमाइंडर सहेजें\" पर क्लिक करें।',
        'बिना हटाए अलार्म को कुछ समय के लिए रोकने या चालू करने के लिए टॉगल स्विच का उपयोग करें।',
        'अलार्म की ध्वनि का परीक्षण करने के लिए ▶ बटन पर क्लिक करें।',
        'मौजूदा अलार्म को संपादित करने के लिए एडिट बटन का उपयोग करें।',
        'स्थायी रूप से हटाने के लिए डिलीट का उपयोग करें।',
        'स्लाइडर का उपयोग करके अलार्म ध्वनि की तीव्रता को समायोजित करें।',
        'अपनी खुद की आवाज (जैसे माँ या डॉक्टर की आवाज) अलार्म के रूप में सेट करने के लिए \"नई आवाज रिकॉर्ड करें\" पर क्लिक करें।',
      ],
      aboutWhy: [
        'पुरानी बीमारियों के लिए दवाएं समय पर न लेना स्वास्थ्य के लिए बेहद हानिकारक है।',
        'विभिन्न समयों पर विभिन्न दवाओं के लिए कई अलार्म सेट किए जा सकते हैं।',
        'वेबसाइट बंद होने पर भी पृष्ठभूमि अलार्म सूचनाओं के माध्यम से आपको सचेत करते हैं।',
        'अपनी आवाज के अलार्म अनुस्मारक को अधिक प्रभावी और व्यक्तिगत बनाते हैं।',
        'रंगीन अलार्म से आसानी से समझ आता है कि कौन सी दवा लेनी है।',
        'वॉल्यूम नियंत्रण से शांत या शोरगुल वाले वातावरण के अनुसार वॉल्यूम बदला जा सकता है।',
      ]
    },
    eu: {
      title: "Alarma de Medicamentos",
      subtitle: "No se salte ninguna dosis. ¡Le avisaremos en su PC y móvil!",
      setAlarm: "Programar Alarma",
      notifTitle: "Activar Notificaciones de Fondo",
      notifDesc: "Debe permitir las notificaciones para que los avisos funcionen incluso con la web cerrada.",
      allowNotif: "Permitir Notificaciones",
      notifActive: "Alarmas en segundo plano activadas — ¡Recibirá avisos incluso con la web cerrada!",
      reminders: "Sus Alarmas",
      noAlarms: "No hay alarmas programadas. ¡Añada una para empezar!",
      soundLabel: "Sonido",
      volTitle: "Volumen de Alarma",
      volDesc: "Ajuste el volumen del recordatorio emergente de medicamentos.",
      editAlarm: "Editar Alarma",
      tabletName: "Nombre de Medicina",
      tabletNamePl: "ej. Paracetamol, Vitamina C...",
      timeLabel: "Hora",
      soundSelLabel: "Sonido de Alerta",
      colorLabel: "Color de Alarma",
      saveReminder: "Guardar Recordatorio",
      cancel: "Cancelar",
      customizeSound: "Personalizar Sonido de Alerta",
      customizeDesc: "Grabe su propia voz humana para reproducirla como alerta de alarma. Ej. \"¡Es hora de tomar tu vitamina D!\". La alerta sonará durante un minuto.",
      recordVoice: "Grabar Nueva Voz",
      stopRecord: "Detener Grabación",
      noRecorded: "No hay voces grabadas",
      humanVoiceGroup: "Voces Humanas Personalizadas",
      testSound: "Probar Sonido",

      // SweetAlerts
      confirmDeleteTitle: "¿Está seguro?",
      confirmDeleteText: "¡No podrá revertir esta acción!",
      confirmDeleteBtn: "Sí, ¡eliminar!",
      deletedTitle: "¡Eliminado!",
      deletedText: "Su alarma ha sido eliminada.",
      savedTitle: "¡Alarma Guardada!",
      savedText: "Recordatorio programado para ",
      voiceDeleteTitle: "¿Eliminar esta voz?",
      voiceDeleteText: "Las alarmas asociadas a esta voz volverán al sonido predeterminado.",
      recNameTitle: "Nombre su grabación",
      recLabel: "Póngale nombre a esta voz (ej. Mamá, Papá, Médico)",
      recPl: "Ingrese el nombre de la voz...",
      recValError: "¡Debe escribir algo!",
      voiceSavedTitle: "¡Voz Guardada!",
      voiceSavedText: "se ha guardado. Elíjala al crear o editar una alarma.",
      micErrorTitle: "Error de Micrófono",
      micErrorText: "No se pudo acceder al micrófono.",

      aboutWhat: "Alarma de Medicamentos es un sistema inteligente de alerta de medicamentos que le notifica exactamente cuándo debe tomar cada pastilla. Admite alertas en segundo plano para que suene incluso con MediVault cerrado.",
      aboutHow: [
        'Haga clic en \"Programar Alarma\" en la parte superior para abrir el formulario.',
        'Ingrese el nombre de la medicina (ej., Paracetamol, Vitamina D).',
        'Establezca la hora exacta con el selector de hora.',
        'Elija un tono de alarma entre 7 opciones pacíficas: Gentle Chime, Morning Bells, etc.',
        'Haga clic en los botones de reproducción (▶) para probar cada sonido.',
        'Seleccione un color de alarma para diferenciar visualmente los medicamentos.',
        'Haga clic en \"Guardar Recordatorio\" para activar la alarma.',
        'Use el interruptor de encendido de cada tarjeta de alarma para pausarla sin eliminarla.',
        'Pulse el botón de prueba ▶ para escuchar la alarma en cualquier momento.',
        'Presione editar para cambiar el nombre de la medicina, la hora o el sonido de una alarma existente.',
        'Presione eliminar para borrar una alarma que ya no necesite.',
        'Ajuste el control de volumen para configurar el nivel de sonido.',
        'Haga clic en \"Grabar Nueva Voz\" para grabar una alerta de voz personalizada (ej., la voz de su madre o su médico).',
      ],
      aboutWhy: [
        'Olvidar una dosis de medicamentos puede tener consecuencias graves para la salud en condiciones crónicas.',
        'Permite configurar múltiples alarmas para tratamientos complejos con distintas medicinas en diferentes horarios.',
        'Las notificaciones en segundo plano garantizan que reciba el aviso aunque no tenga MediVault abierto.',
        'Las alertas con voces de familiares o médicos son personales y difíciles de ignorar.',
        'El código de colores ayuda a saber instantáneamente qué pastilla toca tomar en cada momento.',
        'El control de volumen asegura que la alerta sea audible en entornos silenciosos o ruidosos.',
      ]
    }
  };

  const ct = (key) => localT[lang]?.[key] || localT['en']?.[key];

  useEffect(() => {
    const uid = user?.id || user?.uid || 'guest';
    const userAlarmKey = `medivault_alarms_${uid}`;
    
    // Load alarms from local storage (user-scoped first, then fallback to general)
    const saved = localStorage.getItem(userAlarmKey) || localStorage.getItem('medivault_alarms');
    let initialAlarms;
    if (saved) {
      initialAlarms = JSON.parse(saved);
      setAlarms(initialAlarms);
    } else {
      initialAlarms = [
        { id: Date.now(), tablet: 'Paracetamol', time: '08:00', music: 'Gentle Chime', color: '#8b5cf6', active: true }
      ];
      setAlarms(initialAlarms);
      localStorage.setItem(userAlarmKey, JSON.stringify(initialAlarms));
      localStorage.setItem('medivault_alarms', JSON.stringify(initialAlarms));
    }
    // Sync to SW immediately so background notifications are ready on web
    syncTabletAlarmsToSW(initialAlarms, uid);
    // Sync to Native Android Local Notifications if running as app
    if (isNativeApp()) {
      scheduleNativeTabletAlarms(initialAlarms, uid);
      requestNativePermissions().then(perm => {
        if (perm) setNotifPermission(perm);
      });
    } else {
      // Ensure notification permission is granted on web
      requestNotificationPermission().then(perm => {
        if (perm) setNotifPermission(perm);
      });
    }
    // Sync to Firestore for closed-app notifications
    if (user?.uid) {
      syncRemindersToFirestore(user.uid, 'tablet', initialAlarms);
    }


    // Load custom voices
    const savedVoices = localStorage.getItem(`medivault_human_voices_${uid}`) || localStorage.getItem('medivault_human_voices');
    let loadedVoices = [];
    if (savedVoices) {
      loadedVoices = JSON.parse(savedVoices);
      setVoices(loadedVoices);
    }

    // --- Legacy Audio Migration Block ---
    const legacyAudio = localStorage.getItem('medivault_custom_alarm');
    if (legacyAudio) {
      const legacyId = 'voice_legacy_1';
      // If not already migrated
      if (!loadedVoices.find(v => v.id === legacyId)) {
        const newVoice = { id: legacyId, name: 'My Old Recording', url: legacyAudio };
        const updatedVoices = [newVoice, ...loadedVoices];
        setVoices(updatedVoices);
        localStorage.setItem(`medivault_human_voices_${uid}`, JSON.stringify(updatedVoices));
        localStorage.setItem('medivault_human_voices', JSON.stringify(updatedVoices));
        
        // Ensure any old alarms pointing to 'Human Voice' are properly redirected
        let currentAlarms = JSON.parse(localStorage.getItem(userAlarmKey) || '[]');
        let needsMigration = false;
        const migratedAlarms = currentAlarms.map(a => {
          if (a.music === 'Human Voice' || a.music === 'Custom Vocals') {
             needsMigration = true;
             return { ...a, music: legacyId };
          }
          return a;
        });
        if (needsMigration) {
           setAlarms(migratedAlarms);
           localStorage.setItem(userAlarmKey, JSON.stringify(migratedAlarms));
           localStorage.setItem('medivault_alarms', JSON.stringify(migratedAlarms));
        }
      }
      localStorage.removeItem('medivault_custom_alarm');
    }

    // Load volume
    const savedVolume = localStorage.getItem('medivault_alarm_volume');
    if (savedVolume) {
      setVolume(parseFloat(savedVolume));
    }
  }, [user?.id, user?.uid]);

  const saveAlarms = (updated) => {
    const uid = user?.id || user?.uid || 'guest';
    setAlarms(updated);
    localStorage.setItem(`medivault_alarms_${uid}`, JSON.stringify(updated));
    localStorage.setItem('medivault_alarms', JSON.stringify(updated));
    // Push updated alarms to service worker for web background notifications
    syncTabletAlarmsToSW(updated, uid);
    // Schedule native Android alarms when running in Capacitor app
    if (isNativeApp()) {
      scheduleNativeTabletAlarms(updated, uid);
    }
    // Sync to Firestore for closed-app notifications
    if (user?.uid) {
      syncRemindersToFirestore(user.uid, 'tablet', updated);
    }
  };


  // ── Preview a sound using the same Peaceful synthesis
  const playPreviewSound = (soundType, vol = 1.0) => {
    try {
      const globalVol = parseFloat(localStorage.getItem('mv_global_volume') ?? 1.0);
      const finalVol = vol * globalVol;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;

      // Peaceful preview tone (short, 1.2s)
      const freqMap = {
        'Gentle Chime':    [523.25, 659.25, 783.99],
        'Morning Bells':   [261.63, 329.63, 392.00],
        'Soft Harp':       [329.63, 415.30, 523.25],
        'Meditation Bowl': [220, 330, 440],
        'Ocean Lullaby':   [196, 261.63, 392.00],
        'Wind Chimes':     [659.25, 783.99, 880.00],
        'Dreamscape':      [130.81, 261.63, 392.00],
      };
      const freqs = freqMap[soundType] || [523.25];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.001, now + i * 0.25);
        gain.gain.linearRampToValueAtTime(finalVol * 0.3, now + i * 0.25 + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.25 + 1.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.25);
        osc.stop(now + i * 0.25 + 1.2);
      });
    } catch (e) { console.error(e); }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    localStorage.setItem('medivault_alarm_volume', val.toString());
    playPreviewSound('Gentle Chime', val);
  };

  const handleToggle = (id) => {
    const updated = alarms.map(a => a.id === id ? { ...a, active: !a.active } : a);
    saveAlarms(updated);
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: ct('confirmDeleteTitle'),
      text: ct('confirmDeleteText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EE5A24',
      cancelButtonColor: '#64748b',
      confirmButtonText: ct('confirmDeleteBtn')
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = alarms.filter(a => a.id !== id);
        saveAlarms(updated);
        Swal.fire(ct('deletedTitle'), ct('deletedText'), 'success');
      }
    });
  };

  const handleEdit = (alarm) => {
    setNewAlarm(alarm);
    setShowAddForm(true);
  };

  const handleSaveAlarm = (e) => {
    e.preventDefault();
    if (!newAlarm.tablet || !newAlarm.time) return;

    let updated;
    if (newAlarm.id) {
      // Edit
      updated = alarms.map(a => a.id === newAlarm.id ? newAlarm : a);
    } else {
      // Add
      updated = [...alarms, { ...newAlarm, id: Date.now() }];
    }
    
    saveAlarms(updated);
    setShowAddForm(false);
    setNewAlarm({ id: null, tablet: '', time: '', music: 'Gentle Chime', color: '#8b5cf6', active: true });
    
    Swal.fire({
      icon: 'success',
      title: ct('savedTitle'),
      text: `${ct('savedText')} ${newAlarm.time}`,
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => chunks.current.push(e.data);
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunks.current, { type: mimeType });
        chunks.current = [];
        
        // Convert blob to base64 to save in localStorage
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64data = reader.result;
          
          const { value: voiceName } = await Swal.fire({
            title: ct('recNameTitle'),
            input: 'text',
            inputLabel: ct('recLabel'),
            inputPlaceholder: ct('recPl'),
            showCancelButton: true,
            inputValidator: (value) => {
              if (!value) return ct('recValError');
            }
          });

          if (voiceName) {
            const newVoiceId = `voice_${Date.now()}`;
            const newVoice = {
              id: newVoiceId,
              name: voiceName,
              url: base64data
            };
            
            setVoices(prev => {
              const updated = [...prev, newVoice];
              localStorage.setItem('medivault_human_voices', JSON.stringify(updated));
              return updated;
            });
            
            // Automatically select the new voice in the 'Add Form' if it's open
            setNewAlarm(prev => ({...prev, music: newVoiceId}));
            
            Swal.fire({
              icon: 'success',
              title: ct('voiceSavedTitle'),
              text: `"${voiceName}" ${ct('voiceSavedText')}`,
              timer: 3500,
              showConfirmButton: false
            });
          }
        };
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      Swal.fire(ct('micErrorTitle'), ct('micErrorText'), 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const deleteVoice = (id) => {
    Swal.fire({
      title: ct('voiceDeleteTitle'),
      text: ct('voiceDeleteText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: ct('confirmDeleteBtn')
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = voices.filter(v => v.id !== id);
        setVoices(updated);
        localStorage.setItem('medivault_human_voices', JSON.stringify(updated));
      }
    });
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem' }}>
      {/* Header section with gradient and glassy modern look */}
      <div style={{
        background: 'linear-gradient(135deg, #EE5A24, #f97316)',
        borderRadius: '1rem',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 10px 25px -5px rgba(238, 90, 36, 0.4)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'white',
        position: 'relative'
      }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Bell size={36} className="animate-pulse" /> {ct('title')}
          </h1>
          <p style={{ marginTop: '0.5rem', opacity: 0.9 }}>{ct('subtitle')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1rem' }}>
          <SectionAbout
            title={ct('title')}
            icon="⏰"
            color="#db2777"
            gradient="linear-gradient(135deg, #db2777, #ec4899)"
            what={ct('aboutWhat')}
            howToUse={ct('aboutHow')}
            importance={ct('aboutWhy')}
            style={{ position: 'absolute', top: '0.6rem', right: '1.25rem', background: 'rgba(255, 255, 255, 0.18)', border: '1px solid rgba(255, 255, 255, 0.25)' }}
          />
          <button 
            onClick={() => {
              setNewAlarm({ id: null, tablet: '', time: '', music: 'Gentle Chime', color: '#3b82f6', active: true });
              setShowAddForm(!showAddForm);
            }}
            disabled={showAddForm}
            style={{
              background: 'white', color: '#EE5A24', border: 'none',
              padding: '0.75rem 1.5rem', borderRadius: '2rem',
              fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem',
              cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              opacity: showAddForm ? 0.5 : 1
            }}
          >
            <Plus size={18}/> {ct('setAlarm')}
          </button>
        </div>
      </div>

      {/* Background Notification Status Banner */}
      {notifPermission !== 'granted' && (
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          border: '1px solid #f59e0b',
          borderRadius: '0.75rem',
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <div>
              <strong style={{ color: '#92400e', display: 'block' }}>{ct('notifTitle')}</strong>
              <span style={{ color: '#78350f', fontSize: '0.85rem' }}>{ct('notifDesc')}</span>
            </div>
          </div>
          <button
            onClick={async () => {
              if (isNativeApp()) {
                const perm = await requestNativePermissions();
                setNotifPermission(perm);
              } else {
                const perm = await requestNotificationPermission();
                setNotifPermission(perm);
              }
            }}
            style={{
              background: '#f59e0b', color: 'white', border: 'none',
              padding: '0.6rem 1.2rem', borderRadius: '0.5rem',
              fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap'
            }}
          >
            {ct('allowNotif')}
          </button>

        </div>
      )}
      {notifPermission === 'granted' && (
        <div style={{
          background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
          border: '1px solid #10b981',
          borderRadius: '0.75rem',
          padding: '0.75rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span style={{ fontSize: '1.3rem' }}>✅</span>
          <span style={{ color: '#065f46', fontWeight: '600' }}>
            {ct('notifActive')}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2" style={{ gap: '2rem', alignItems: 'start' }}>
        
        {/* Active Alarms List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.5rem' }}>{ct('reminders')}</h2>
          {alarms.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Clock size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>{ct('noAlarms')}</p>
            </div>
          ) : (
            alarms.map(alarm => (
              <div key={alarm.id} className="card" style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderLeft: `6px solid ${alarm.active ? (alarm.color || '#3b82f6') : '#cbd5e1'}`,
                background: alarm.active ? `rgba(${hexToRgb(alarm.color || '#3b82f6')}, 0.14)` : 'var(--surface)',
                border: alarm.active ? `1.5px solid rgba(${hexToRgb(alarm.color || '#3b82f6')}, 0.35)` : '1px solid var(--border)',
                boxShadow: alarm.active ? `0 10px 20px rgba(${hexToRgb(alarm.color || '#3b82f6')}, 0.08)` : 'none',
                transition: 'all 0.3s ease',
                opacity: alarm.active ? 1 : 0.7
              }}>
                <div>
                  <h2 style={{ fontSize: '2.2rem', fontWeight: '800', color: alarm.active ? 'var(--text-main)' : 'var(--text-muted)' }}>{alarm.time}</h2>
                  <p style={{ fontSize: '1.1rem', color: alarm.active ? (alarm.color || '#3b82f6') : 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '600' }}>
                    <Pill size={16} /> {alarm.tablet}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {alarm.music.startsWith('voice_') ? <Mic size={14} /> : <Music size={14} />} 
                    {ct('soundLabel')}: {alarm.music.startsWith('voice_') ? (voices.find(v => v.id === alarm.music)?.name || 'Human Voice') : alarm.music}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                  <div 
                    onClick={() => handleToggle(alarm.id)}
                    style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px', background: alarm.active ? (alarm.color || '#3b82f6') : '#e2e8f0', borderRadius: '24px', cursor: 'pointer', transition: 'background 0.3s' }}>
                    <div style={{ position: 'absolute', top: '2px', left: alarm.active ? '24px' : '2px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: 'all 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}></div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => {
                        const event = new CustomEvent('medivault_test_alarm', { detail: alarm });
                        window.dispatchEvent(event);
                    }} style={{ background: '#ecfdf5', border: '1px solid #d1fae5', cursor: 'pointer', color: '#10b981', padding: '0.5rem', borderRadius: '0.5rem', transition: 'all 0.2s' }} title={ct('testSound')}><Play size={16}/></button>
                    <button onClick={() => handleEdit(alarm)} style={{ background: 'var(--bg-color)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-main)', padding: '0.5rem', borderRadius: '0.5rem', transition: 'all 0.2s' }}><Edit2 size={16}/></button>
                    <button onClick={() => handleDelete(alarm.id)} style={{ background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer', color: '#ef4444', padding: '0.5rem', borderRadius: '0.5rem', transition: 'all 0.2s' }}><Trash2 size={16}/></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Dynamic Right Side: Add Form, Record Audio, Volume */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Volume Control Card */}
          <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
             <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
               <Bell size={20} style={{ marginRight: '0.5rem', color: '#EE5A24' }}/> {ct('volTitle')}
             </h3>
             <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>{ct('volDesc')}</p>
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>0%</span>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1" 
                  step="0.1" 
                  value={volume}
                  onChange={handleVolumeChange}
                  style={{ flex: 1, accentColor: '#EE5A24', cursor: 'grab' }}
                />
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#EE5A24' }}>{Math.round(volume * 100)}%</span>
             </div>
          </div>
          
          {/* Add / Edit Form */}
          {showAddForm && (
            <form onSubmit={handleSaveAlarm} className="card animate-fade-in" style={{ borderTop: '4px solid #EE5A24' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                {newAlarm.id ? <Edit2 size={20} color="#EE5A24" /> : <Plus size={20} color="#EE5A24" />}
                {newAlarm.id ? ct('editAlarm') : ct('setAlarm')}
              </h3>
              
              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label className="label">{ct('tabletName')}</label>
                <input 
                  type="text" 
                  required
                  placeholder={ct('tabletNamePl')}
                  className="input-field" 
                  value={newAlarm.tablet}
                  onChange={e => setNewAlarm({...newAlarm, tablet: e.target.value})}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label className="label">{ct('timeLabel')}</label>
                <input 
                  type="time" 
                  required
                  className="input-field" 
                  style={{ fontSize: '1.2rem' }}
                  value={newAlarm.time}
                  onChange={e => setNewAlarm({...newAlarm, time: e.target.value})}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Music2 size={16} color="#8b5cf6" /> {ct('soundSelLabel')}
                </label>
                <select 
                  className="input-field"
                  value={newAlarm.music}
                  onChange={e => {
                    const val = e.target.value;
                    setNewAlarm({...newAlarm, music: val});
                    if (!val.startsWith('voice_')) {
                      playPreviewSound(val, volume);
                    } else {
                      const v = voices.find(x => x.id === val);
                      if (v?.url) {
                        const a = new Audio(v.url);
                        a.volume = parseFloat(localStorage.getItem('mv_global_volume') ?? 1.0) * volume;
                        a.play().catch(() => {});
                      }
                    }
                  }}
                  style={{ background: 'var(--surface)', fontSize: '1rem' }}
                >
                  {ALARM_SOUNDS.map(s => (
                    <option key={s.value} value={s.value}>{s.label} — {s.desc}</option>
                  ))}
                  <optgroup label={`🎤 ${ct('humanVoiceGroup')}`}>
                    {voices.map(v => (
                      <option key={v.id} value={v.id}>Human: {v.name}</option>
                    ))}
                    {voices.length === 0 && <option disabled>{ct('noRecorded')}</option>}
                  </optgroup>
                </select>
                {/* Preview strip */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                  {ALARM_SOUNDS.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => playPreviewSound(s.value, volume)}
                      style={{
                        padding: '0.3rem 0.7rem',
                        borderRadius: '50px',
                        border: `1px solid ${newAlarm.music === s.value ? '#8b5cf6' : 'var(--border)'}`,
                        background: newAlarm.music === s.value ? 'rgba(139,92,246,0.12)' : 'transparent',
                        color: newAlarm.music === s.value ? '#8b5cf6' : 'var(--text-muted)',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {s.label.split(' ')[0]} ▶
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="label">{ct('colorLabel')}</label>
                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                  {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'].map(c => (
                    <div 
                      key={c}
                      onClick={() => setNewAlarm({...newAlarm, color: c})}
                      style={{ 
                        width: '32px', height: '32px', borderRadius: '50%', background: c, cursor: 'pointer',
                        border: newAlarm.color === c ? `3px solid var(--surface)` : 'none',
                        boxShadow: newAlarm.color === c ? `0 0 0 2px ${c}` : 'none',
                        transform: newAlarm.color === c ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.2s'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: newAlarm.color || '#3b82f6', border: 'none' }}>
                  {ct('saveReminder')}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-outline" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  {ct('cancel')}
                </button>
              </div>
            </form>
          )}

          {/* Voice Recorder Options */}
          <div className="card glass-panel" style={{ 
            background: 'var(--surface)', 
            border: '1px solid var(--border)',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.05, color: '#EE5A24' }}>
              <Mic size={150} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1 }}><Mic size={24} style={{ marginRight: '0.5rem', color: '#EE5A24' }}/> {ct('customizeSound')}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem', position: 'relative', zIndex: 1 }}>
              {ct('customizeDesc')}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                {!isRecording ? (
                  <button onClick={startRecording} className="btn" style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5' }}>
                    <Mic size={18} /> {ct('recordVoice')}
                  </button>
                ) : (
                  <button onClick={stopRecording} className="btn" style={{ background: '#ef4444', color: 'white', animation: 'pulse 1.5s infinite' }}>
                    <Square size={18} /> {ct('stopRecord')}
                  </button>
                )}
              </div>

              {voices.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                  {voices.map(voice => (
                    <div key={voice.id} style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'var(--bg-color)', padding: '0.75rem 1rem', borderRadius: '1rem', border: '1px solid var(--border)' 
                    }}>
                      <div style={{ overflow: 'hidden' }}>
                        <p style={{ fontWeight: 'bold', fontSize: '0.9rem', margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{voice.name}</p>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ct('humanVoiceGroup')}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button 
                          onClick={() => {
                            const a = new Audio(voice.url);
                            a.volume = parseFloat(localStorage.getItem('mv_global_volume') ?? 1.0);
                            a.play().catch(()=>{});
                          }} 
                          style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                          <Play size={12} />
                        </button>
                        <button 
                          onClick={() => deleteVoice(voice.id)} 
                          style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* SectionAbout moved inside header banner */}
    </div>
  );
}
