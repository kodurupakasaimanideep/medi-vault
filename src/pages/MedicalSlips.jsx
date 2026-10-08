import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Plus, Search, Trash2, Edit3, X, Save, Image as ImageIcon, Download, ChevronLeft, Eye, Calendar, Clock, User, File as FileIcon, Activity, Stethoscope, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { initDB, addSlip, updateSlip, deleteSlip, getAllSlips } from '../utils/db';
import SectionAbout from '../components/SectionAbout';
import { useLanguage } from '../contexts/LanguageContext';

const FILE_SIZE_LIMIT = 200 * 1024 * 1024; // 200 MB

const MOCK_SLIPS = [
  {
    id: "mock1",
    patientName: "James Anderson",
    patientAge: "45",
    hospitalName: "City General Hospital",
    date: "2024-04-10",
    time: "10:30",
    fileName: "Chest_XRay_Report.pdf",
    fileType: "PDF",
    fileSize: 4500000,
    isMock: true,
    condition: "Routine Checkup"
  },
  {
    id: "mock2",
    patientName: "Sarah Jenkins",
    patientAge: "32",
    hospitalName: "Metro Care Clinic",
    date: "2024-04-09",
    time: "14:45",
    fileName: "Blood_Test_Summary.png",
    fileType: "Image",
    fileSize: 1250000,
    isMock: true,
    condition: "Anemia Follow-up"
  },
  {
    id: "mock3",
    patientName: "Michael Chang",
    patientAge: "58",
    hospitalName: "Heartwood Medical Center",
    date: "2024-04-05",
    time: "09:15",
    fileName: "ECG_Scan_Results.pdf",
    fileType: "PDF",
    fileSize: 2100000,
    isMock: true,
    condition: "Cardiac Monitoring"
  }
];

export default function MedicalSlips({ user }) {
  const navigate = useNavigate();
  const [userDb, setUserDb] = useState(null);
  const [slips, setSlips] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSlip, setCurrentSlip] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'important'
  const [starredIds, setStarredIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mv_starred_slips') || '[]'); } catch { return []; }
  });

  const { lang } = useLanguage();

  const localT = {
    en: {
      dashboard: "Dashboard",
      title: "Medical Slips",
      searchPl: "Search patients, conditions...",
      newRecord: "New Record",
      allCat: "📁 All",
      importantCat: "⭐ Important",
      years: "Years",
      sample: "SAMPLE",
      noRecords: "No Records Found",
      noRecordsDesc: "Your medical slips archive is empty. Begin securely tracking patient scans, reports, and imaging data.",
      addRecord: "Add Medical Record",
      alertSample: "This is a sample document for James Anderson.\nPlease upload a real document to use the Instant Preview feature.",
      alertCorrupt: "File data is corrupt or missing.",
      alertLimit: "File size exceeds the 200MB limit.",
      alertAllowed: "Only PDF or Image formats are allowed.",
      alertRequired: "Please fill in all required fields and upload a file.",
      alertDbNotReady: "Database not ready. Please try again.",
      alertMockEdit: "You cannot edit sample mock data. Please upload real records.",
      confirmDelete: "Are you sure you want to delete this medical slip?",
      alertMockDownload: "Cannot download mocked demo files.",

      // Modal
      updateScan: "Update Medical Scan",
      newPatientDoc: "New Patient Document",
      patientName: "Patient Name *",
      patientNamePl: "Ex. Jane Smith",
      age: "Age *",
      agePl: "Years",
      hospitalName: "Hospital Name",
      hospitalNamePl: "Ex. City General Hospital",
      reason: "Reason / Condition",
      reasonPl: "Ex. MRI Scan Follow up",
      date: "Date *",
      time: "Time *",
      docFile: "Document File *",
      docFileReplace: "Document File (Select to Replace)",
      uploadOrDrag: "Click to upload or drag and drop",
      maxSize: "SVG, PNG, JPG or PDF (MAX. 200MB)",
      selectedSize: "Selected Size:",
      cancel: "Cancel",
      uploadSlip: "Upload Slip",
      saveChanges: "Save Changes",

      // Preview
      downloadFile: "Download File",
      closePreview: "Close Preview",

      // SectionAbout
      aboutWhat: "Medical Slips is your secure digital vault for all medical documents — prescriptions, lab reports, blood test results, X-rays, ECG scans, MRI scans, discharge summaries and more. It stores, organizes and lets you instantly preview or download every health record anytime, anywhere without carrying physical files.",
      aboutHow: [
        'Click the "New Record" button (top-right) to start uploading a medical document.',
        'Fill in the patient name and age in the form that opens.',
        'Enter the hospital name where the test or consultation took place.',
        'Type the reason or medical condition for the record (e.g., Blood Test, ECG Follow-up).',
        'Select the date and exact time of the medical visit or test.',
        'Click the upload zone to browse and select a PDF or image file (up to 200MB).',
        'Press "Upload Slip" to securely save the record to your personal database.',
        'Click the eye icon on any card to preview the document instantly in-browser.',
        'Use the download icon to save a local copy of the file to your device.',
        'Press edit icon to update any detail of an existing slip (name, date, condition, etc.).',
        'Press delete icon to permanently remove an outdated or incorrect record.',
        'Click the star icon to mark critical records as "Important" for quick access.',
        'Use the "Important" tab filter to see only your starred priority records.',
        'Use the search bar to find any record by patient name, hospital, or condition instantly.',
        'Switch between "All Records" and "Important" category tabs at the top to filter view.',
      ],
      aboutWhy: [
        'Keeps your entire medical history organized in one secure, searchable place.',
        'Eliminates the risk of losing physical reports — all documents are backed up digitally.',
        'Speeds up emergency treatment — doctors can instantly access your medical history.',
        'Allows multiple healthcare providers and specialists to review the same records.',
        'Helps track the progression of chronic conditions over time through historic records.',
        'Avoids duplicate medical tests by providing proof of prior investigations.',
        'Enables quick second opinions without needing to redo tests at new hospitals.',
        'Stores X-rays, MRI scans, and ECG images that are typically lost over time.',
        'Helps insurance claim processes by maintaining organized, timestamped proof.',
        'Supports continuity of care — essential when switching doctors or hospitals.',
        'Safeguards records of surgeries, procedures, and hospitalization history.',
        'Protects you from medical errors by giving doctors full visibility of your history.',
      ]
    },
    te: {
      dashboard: "డాష్‌బోర్డ్",
      title: "వైద్య స్లిప్‌లు",
      searchPl: "రోగులను, పరిస్థితులను వెతకండి...",
      newRecord: "కొత్త రికార్డు",
      allCat: "📁 అన్నీ",
      importantCat: "⭐ ముఖ్యమైనవి",
      years: "సంవత్సరాలు",
      sample: "నమూనా",
      noRecords: "రికార్డులు కనుగొనబడలేదు",
      noRecordsDesc: "మీ వైద్య స్లిప్‌ల ఆర్కైవ్ ఖాళీగా ఉంది. రోగి స్కాన్‌లు, రిపోర్ట్‌లు మరియు ఇమేజింగ్ డేటాను సురక్షితంగా ట్రాక్ చేయడం ప్రారంభించండి.",
      addRecord: "వైద్య రికార్డును జోడించు",
      alertSample: "ఇది నమూనా పత్రం.\nదయచేసి తక్షణ ప్రివ్యూ సౌకర్యాన్ని ఉపయోగించడానికి నిజమైన పత్రాన్ని అప్‌లోడ్ చేయండి.",
      alertCorrupt: "ఫైల్ డేటా దెబ్బతింది లేదా లేదు.",
      alertLimit: "ఫైల్ పరిమాణం 200MB పరిమితిని మించిపోయింది.",
      alertAllowed: "PDF లేదా ఇమేజ్ ఫార్మాట్‌లు మాత్రమే అనుమతించబడతాయి.",
      alertRequired: "దయచేసి అన్ని అవసరమైన ఫీల్డ్‌లను పూరించండి మరియు ఫైల్‌ను అప్‌లోడ్ చేయండి.",
      alertDbNotReady: "ఆరోగ్య నిల్వ సిద్ధంగా లేదు. దయచేసి మళ్లీ ప్రయత్నించండి.",
      alertMockEdit: "మీరు నమూనా డేటాను సవరించలేరు. దయచేసి నిజమైన రికార్డులను అప్‌లోడ్ చేయండి.",
      confirmDelete: "మీరు ఖచ్చితంగా ఈ వైద్య స్లిప్‌ను తొలగించాలనుకుంటున్నారా?",
      alertMockDownload: "నమూనా డెమో ఫైల్‌లను డౌన్‌లోడ్ చేయడం సాధ్యం కాదు.",

      // Modal
      updateScan: "వైద్య స్కాన్‌ను నవీకరించండి",
      newPatientDoc: "కొత్త రోగి పత్రం",
      patientName: "రోగి పేరు *",
      patientNamePl: "ఉదా. జానకి రామ్",
      age: "వయస్సు *",
      agePl: "సంవత్సరాలు",
      hospitalName: "ఆసుపత్రి పేరు",
      hospitalNamePl: "ఉదా. సిటీ జనరల్ హాస్పిటల్",
      reason: "కారణం / పరిస్థితి",
      reasonPl: "ఉదా. MRI స్కాన్ తదుపరి పరిశీలన",
      date: "తేదీ *",
      time: "సమయం *",
      docFile: "పత్రం ఫైల్ *",
      docFileReplace: "పత్రం ఫైల్ (భర్తీ చేయడానికి ఎంచుకోండి)",
      uploadOrDrag: "అప్‌లోడ్ చేయడానికి క్లిక్ చేయండి లేదా ఇక్కడకు లాగండి",
      maxSize: "SVG, PNG, JPG లేదా PDF (గరిష్టంగా 200MB)",
      selectedSize: "ఎంచుకున్న పరిమాణం:",
      cancel: "రద్దు చేయి",
      uploadSlip: "స్లిప్ అప్‌లోడ్ చేయి",
      saveChanges: "మార్పులను సేవ్ చేయి",

      // Preview
      downloadFile: "ఫైల్ డౌన్‌లోడ్ చేయి",
      closePreview: "ప్రివ్యూ మూసివేయి",

      // SectionAbout
      aboutWhat: "వైద్య స్లిప్‌ల విభాగం అనేది మీ అన్ని వైద్య పత్రాలు — ప్రిస్క్రిప్షన్‌లు, ల్యాబ్ రిపోర్ట్‌లు, రక్త పరీక్ష ఫలితాలు, ఎక్స్-రేలు, ఇసిజి స్కాన్‌లు, ఎమ్‌ఆర్‌ఐ స్కాన్‌లు మరియు డిశ్చార్జ్ సమ్మరీలను సురక్షితంగా దాచుకునే మీ డిజిటల్ లాకర్.",
      aboutHow: [
        'కొత్త వైద్య పత్రాన్ని అప్‌లోడ్ చేయడానికి \"కొత్త రికార్డు\" బటన్‌ను క్లిక్ చేయండి.',
        'తెరుచుకునే ఫారమ్‌లో రోగి పేరు మరియు వయస్సును పూరించండి.',
        'పరీక్ష లేదా సంప్రదింపులు జరిగిన ఆసుపత్రి పేరును నమోదు చేయండి.',
        'రికార్డు యొక్క కారణం లేదా వైద్య పరిస్థితిని నమోదు చేయండి (ఉదా., రక్త పరీక్ష, ఇసిజి ఫాలో-అప్).',
        'వైద్య సందర్శన లేదా పరీక్ష యొక్క తేదీ మరియు ఖచ్చితమైన సమయాన్ని ఎంచుకోండి.',
        'ఫైల్‌ను (గరిష్టంగా 200MB) బ్రౌజ్ చేయడానికి మరియు ఎంచుకోవడానికి అప్‌లోడ్ ప్రాంతాన్ని క్లిక్ చేయండి.',
        'రికార్డును మీ వ్యక్తిగత డేటాబేస్‌కు సురక్షితంగా సేవ్ చేయడానికి \"స్లిప్ అప్‌లోడ్ చేయి\" బటన్‌ను నొక్కండి.',
        'కార్డుపై ఉన్న కంటి చిహ్నాన్ని క్లిక్ చేయడం ద్వారా బ్రౌజర్‌లో పత్రాన్ని తక్షణమే చూడవచ్చు.',
        'డౌన్‌లోడ్ చిహ్నాన్ని ఉపయోగించి మీ డివైస్‌కు ఫైల్ సేవ్ చేసుకోండి.',
        'వివరాలను సవరించడానికి ఎడిట్ చిహ్నాన్ని నొక్కండి.',
        'రికార్డును శాశ్వతంగా తొలగించడానికి డిలీట్ చిహ్నాన్ని నొక్కండి.',
        'ముఖ్యమైన రికార్డులను గుర్తించడానికి స్టార్ చిహ్నాన్ని క్లిక్ చేయండి.',
        'స్టార్ చేసిన ప్రాధాన్యత రికార్డులను మాత్రమే చూడటానికి \"ముఖ్యమైనవి\" ట్యాబ్‌ను ఉపయోగించండి.',
        'రోగి పేరు, ఆసుపత్రి లేదా పరిస్థితి ద్వారా శోధన పట్టీ సహాయంతో వెతకండి.',
      ],
      aboutWhy: [
        'మీ పూర్తి వైద్య చరిత్రను ఒకే సురక్షితమైన ప్రదేశంలో ఉంచుతుంది.',
        'భౌతిక కాగితాలను కోల్పోయే ప్రమాదాన్ని తొలగిస్తుంది.',
        'అత్యవసర చికిత్సను వేగవంతం చేయడానికి వైద్యులకు సహాయపడుతుంది.',
        'వివిధ వైద్యులు మరియు నిపుణులు రికార్డులను సులభంగా పరిశీలించడానికి అనుమతిస్తుంది.',
        'చారిత్రక రికార్డుల ద్వారా దీర్ఘకాలిక పరిస్థితుల పురోగతిని ట్రాక్ చేయడానికి సహాయపడుతుంది.',
        'మునుపటి పరిశోధనల ఆధారాలను చూపడం ద్వారా నూతన వైద్య పరీక్షల పునరావృతాన్ని నివారిస్తుంది.',
        'పరీక్షలను మళ్లీ చేయాల్సిన అవసరం లేకుండా రెండవ అభిప్రायాలను సులభతరం చేస్తుంది.',
        'సాధారణంగా పోగొట్టుకునే ఎక్స్-రేలు, ఎమ్‌ఆర్‌ఐ స్కాన్‌లు మరియు ఇసిజి చిత్రాలను భద్రపరుస్తుంది.',
        'ఇన్సూరెన్స్ క్లెయిమ్ ప్రక్రియలను సులభతరం చేస్తుంది.',
        'వైద్యులు లేదా ఆసుపత్రులను మార్చేటప్పుడు సంరక్షణ నిరంతరాయంగా అందేలా చేస్తుంది.',
        'శస్త్రచికిత్సలు, విధానాలు మరియు ఆసుపత్రి చేరికల చరిత్రను సురక్షితంగా ఉంచుతుంది.',
        'డాక్టర్లకు మీ చరిత్రపై పూర్తి స్పష్టత ఇవ్వడం ద్వారా వైద్య పొరపాట్ల నుండి మిమ్మల్ని రక్షిస్తుంది.',
      ]
    },
    hi: {
      dashboard: "डैशबोर्ड",
      title: "मेडिकल स्लिप्स",
      searchPl: "मरीजों, स्थितियों को खोजें...",
      newRecord: "नया रिकॉर्ड",
      allCat: "📁 सभी",
      importantCat: "⭐ महत्वपूर्ण",
      years: "वर्ष",
      sample: "नमूना",
      noRecords: "कोई रिकॉर्ड नहीं मिला",
      noRecordsDesc: "आपका मेडिकल स्लिप्स संग्रह खाली है। मरीज के स्कैन, रिपोर्ट और इमेजिंग डेटा को सुरक्षित रूप से ट्रैक करना शुरू करें।",
      addRecord: "चिकित्सा रिकॉर्ड जोड़ें",
      alertSample: "यह एक नमूना दस्तावेज़ है।\nकृपया त्वरित पूर्वावलोकन सुविधा का उपयोग करने के लिए एक वास्तविक दस्तावेज़ अपलोड करें।",
      alertCorrupt: "फ़ाइल डेटा दूषित है या गायब है।",
      alertLimit: "फ़ाइल का आकार 200MB की सीमा से अधिक है।",
      alertAllowed: "केवल PDF या इमेज फॉर्मेट की अनुमति है।",
      alertRequired: "कृपया सभी आवश्यक फ़ील्ड भरें और एक फ़ाइल अपलोड करें।",
      alertDbNotReady: "डेटाबेस तैयार नहीं है। कृपया पुनः प्रयास करें।",
      alertMockEdit: "आप नमूना डेटा को संपादित नहीं कर सकते। कृपया वास्तविक रिकॉर्ड अपलोड करें।",
      confirmDelete: "क्या आप वाकई इस मेडिकल स्लिप को हटाना चाहते हैं?",
      alertMockDownload: "नमूना डेमो फ़ाइलों को डाउनलोड नहीं किया जा सकता।",

      // Modal
      updateScan: "चिकित्सा स्कैन अपडेट करें",
      newPatientDoc: "नया मरीज दस्तावेज़",
      patientName: "मरीज का नाम *",
      patientNamePl: "जैसे. जेनी स्मिथ",
      age: "आयु *",
      agePl: "वर्ष",
      hospitalName: "अस्पताल का नाम",
      hospitalNamePl: "जैसे. सिटी जनरल अस्पताल",
      reason: "कारण / स्थिति",
      reasonPl: "जैसे. एमआरआई स्कैन अनुवर्ती",
      date: "दिनांक *",
      time: "समय *",
      docFile: "दस्तावेज़ फ़ाइल *",
      docFileReplace: "दस्तावेज़ फ़ाइल (बदलने के लिए चुनें)",
      uploadOrDrag: "अपलोड करने के लिए क्लिक करें या खींचें",
      maxSize: "SVG, PNG, JPG या PDF (अधिकतम 200MB)",
      selectedSize: "चयनित आकार:",
      cancel: "रद्द करें",
      uploadSlip: "स्लिप अपलोड करें",
      saveChanges: "परिवर्तन सहेजें",

      // Preview
      downloadFile: "फ़ाइल डाउनलोड करें",
      closePreview: "पूर्वावलोकन बंद करें",

      // SectionAbout
      aboutWhat: "मेडिकल स्लिप्स आपके सभी चिकित्सा दस्तावेजों — नुस्खे, लैब रिपोर्ट, रक्त परीक्षण परिणाम, एक्स-रे, ईसीजी स्कैन, एमआरआई स्कैन और डिस्चार्ज सारांश के लिए आपका सुरक्षित डिजिटल लॉकर है।",
      aboutHow: [
        'चिकित्सा दस्तावेज़ अपलोड करने के लिए \"नया रिकॉर्ड\" बटन पर क्लिक करें।',
        'खुलने वाले फॉर्म में मरीज का नाम और उम्र भरें।',
        'उस अस्पताल का नाम दर्ज करें जहां परीक्षण या परामर्श हुआ था।',
        'रिकॉर्ड का कारण या चिकित्सा स्थिति दर्ज करें (जैसे, रक्त परीक्षण, ईसीजी अनुवर्ती)।',
        'चिकित्सा यात्रा या परीक्षण की तारीख और सटीक समय चुनें।',
        'फ़ाइल (अधिकतम 200MB) को ब्राउज़ करने और चुनने के लिए अपलोड क्षेत्र पर क्लिक करें।',
        'रिकॉर्ड को अपने व्यक्तिगत डेटाबेस में सुरक्षित रूप से सहेजने के लिए \"स्लिप अपलोड करें\" दबाएं।',
        'ब्राउज़र में दस्तावेज़ को तुरंत देखने के लिए किसी भी कार्ड पर आंख के आइकन पर क्लिक करें।',
        'अपने डिवाइस पर फ़ाइल की एक प्रति सहेजने के लिए डाउनलोड आइकन का उपयोग करें।',
        'विवरण अपडेट करने के लिए संपादन (एडिट) आइकन दबाएं।',
        'रिकॉर्ड को स्थायी रूप से हटाने के लिए हटाना (डिलीट) आइकन दबाएं।',
        'महत्वपूर्ण रिकॉर्ड को चिह्नित करने के लिए स्टार आइकन पर क्लिक करें।',
        'केवल स्टार किए गए प्राथमिकता रिकॉर्ड देखने के लिए \"महत्वपूर्ण\" टैब का उपयोग करें।',
        'मरीज के नाम, अस्पताल या स्थिति के आधार पर किसी भी रिकॉर्ड को तुरंत खोजने के लिए खोज पट्टी का उपयोग करें।',
      ],
      aboutWhy: [
        'आपके पूरे चिकित्सा इतिहास को एक सुरक्षित, खोजने योग्य स्थान पर रखता है।',
        'भौतिक कागजात खोने के जोखिम को समाप्त करता है — सभी दस्तावेज़ डिजिटल रूप से सुरक्षित रहते हैं।',
        'आपातकालीन उपचार को तेज करता है — डॉक्टर आपके चिकित्सा इतिहास तक तुरंत पहुंच सकते हैं।',
        'विभिन्न डॉक्टरों और विशेषज्ञों को एक ही रिकॉर्ड की आसानी से समीक्षा करने की अनुमति देता है।',
        'ऐतिहासिक रिकॉर्ड के माध्यम से समय के साथ पुरानी स्थितियों की प्रगति को ट्रैक करने में मदद करता है।',
        'पिछले परीक्षणों के प्रमाण दिखाकर बार-बार की चिकित्सा जांचों से बचाता है।',
        'नए अस्पतालों में जांच को दोबारा किए बिना दूसरी राय को आसान बनाता है।',
        'आमतौर पर खो जाने वाले एक्स-रे, एमआरआई स्कैन और ईसीजी छवियों को सुरक्षित रखता है।',
        'टाइमस्टैम्प किए गए साक्ष्य रखकर बीमा दावों की प्रक्रियाओं को सरल बनाता है।',
        'डॉक्टर या अस्पताल बदलते समय देखभाल की निरंतरता सुनिश्चित करता है।',
        'सर्जरी, प्रक्रियाओं और अस्पताल में भर्ती होने के इतिहास को सुरक्षित रखता है।',
        'चिकित्सकों को आपके इतिहास पर पूर्ण स्पष्टता देकर चिकित्सा त्रुटियों से बचाता है।',
      ]
    },
    eu: {
      dashboard: "Panel de Control",
      title: "Informes Médicos",
      searchPl: "Buscar pacientes, condiciones...",
      newRecord: "Nuevo Registro",
      allCat: "📁 Todos",
      importantCat: "⭐ Importantes",
      years: "Años",
      sample: "MUESTRA",
      noRecords: "No se Encontraron Registros",
      noRecordsDesc: "Su archivo de informes médicos está vacío. Comience a realizar un seguimiento seguro de sus escaneos, informes e imágenes.",
      addRecord: "Añadir Informe Médico",
      alertSample: "Este es un documento de muestra.\nSuba un documento real para utilizar la vista previa instantánea.",
      alertCorrupt: "Los datos del archivo están dañados o faltan.",
      alertLimit: "El tamaño del archivo supera el límite de 200MB.",
      alertAllowed: "Solo se permiten formatos PDF o de Imagen.",
      alertRequired: "Por favor, complete todos los campos obligatorios y suba un archivo.",
      alertDbNotReady: "La base de datos no está lista. Por favor, inténtelo de nuevo.",
      alertMockEdit: "No puede editar datos de muestra. Suba registros reales.",
      confirmDelete: "¿Está seguro de que desea eliminar este informe médico?",
      alertMockDownload: "No se pueden descargar archivos de demostración simulados.",

      // Modal
      updateScan: "Actualizar Escaneo Médico",
      newPatientDoc: "Nuevo Documento de Paciente",
      patientName: "Nombre del Paciente *",
      patientNamePl: "ej. Jane Smith",
      age: "Edad *",
      agePl: "Años",
      hospitalName: "Nombre del Hospital",
      hospitalNamePl: "ej. Hospital General de la Ciudad",
      reason: "Motivo / Condición",
      reasonPl: "ej. Control de Resonancia Magnética",
      date: "Fecha *",
      time: "Hora *",
      docFile: "Archivo del Documento *",
      docFileReplace: "Archivo del Documento (Seleccionar para Reemplazar)",
      uploadOrDrag: "Haga clic para subir o arrastrar y soltar",
      maxSize: "SVG, PNG, JPG o PDF (MÁX. 200MB)",
      selectedSize: "Tamaño Seleccionado:",
      cancel: "Cancelar",
      uploadSlip: "Subir Informe",
      saveChanges: "Guardar Cambios",

      // Preview
      downloadFile: "Descargar Archivo",
      closePreview: "Cerrar Vista Previa",

      // SectionAbout
      aboutWhat: "Informes Médicos es su caja fuerte digital segura para todos sus documentos médicos: recetas, informes de laboratorio, resultados de análisis de sangre, radiografías, ecografías, resonancias magnéticas, resúmenes de alta y más.",
      aboutHow: [
        'Haga clic en el botón \"Nuevo Registro\" (arriba a la derecha) para comenzar a subir un documento.',
        'Complete el nombre del paciente y la edad en el formulario que se abre.',
        'Ingrese el nombre del hospital donde tuvo lugar la consulta o el análisis.',
        'Escriba el motivo o la condición médica del informe (ej., Análisis de sangre, Control de ECG).',
        'Seleccione la fecha y la hora exacta de la visita médica.',
        'Haga clic en la zona de carga para buscar y seleccionar un archivo PDF o imagen (hasta 200 MB).',
        'Presione \"Subir Informe\" para guardar el registro de forma segura en su base de datos.',
        'Haga clic en el icono del ojo en cualquier tarjeta para ver una vista previa instantánea.',
        'Utilice el icono de descarga para guardar una copia local del archivo en su dispositivo.',
        'Presione el icono de edición para actualizar cualquier detalle de un informe existente.',
        'Presione el icono de la papelera para eliminar permanentemente un registro obsoleto o incorrecto.',
        'Haga clic en el icono de la estrella para marcar informes críticos como \"Importante\".',
        'Utilice la pestaña \"Importantes\" para ver solo sus registros prioritarios.',
        'Use la barra de búsqueda para encontrar cualquier informe por nombre del paciente, hospital o condición.',
      ],
      aboutWhy: [
        'Mantiene todo su historial médico organizado en un solo lugar seguro y fácil de buscar.',
        'Elimina el riesgo de perder informes físicos: todos los documentos están respaldados digitalmente.',
        'Agiliza el tratamiento de emergencia: los médicos pueden acceder al instante a sus antecedentes.',
        'Permite a múltiples profesionales de la salud revisar los mismos informes con facilidad.',
        'Ayuda a seguir la progresión de enfermedades crónicas a lo largo del tiempo.',
        'Evita la duplicación de pruebas médicas al proporcionar pruebas de estudios anteriores.',
        'Facilita segundas opiniones sin necesidad de repetir estudios en nuevos hospitales.',
        'Conserva radiografías, resonancias y ECG que normalmente se acaban perdiendo.',
        'Facilita los trámites de reclamaciones de seguros al mantener pruebas fechadas y ordenadas.',
        'Garantiza la continuidad de la atención médica al cambiar de médico u hospital.',
        'Salvaguarda los registros de cirugías, procedimientos e ingresos hospitalarios previos.',
        'Le protege de errores médicos al proporcionar una visibilidad total de sus antecedentes.',
      ]
    }
  };

  const ct = (key) => localT[lang]?.[key] || localT['en']?.[key];

  const toggleStar = (id) => {
    setStarredIds(prev => {
      const updated = prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id];
      localStorage.setItem('mv_starred_slips', JSON.stringify(updated));
      return updated;
    });
  };
  
  const [formData, setFormData] = useState({
    patientName: '',
    patientAge: '',
    hospitalName: '',
    condition: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    file: null,
    fileName: '',
    fileType: '',
    fileSize: 0
  });

  const [errorText, setErrorText] = useState('');
  const fileInputRef = useRef(null);

  // Open user-scoped database on mount / user change
  useEffect(() => {
    if (!user?.uid) return;
    initDB(user.uid).then(db => {
      setUserDb(db);
    }).catch(err => console.error('[MedicalSlips] DB init error:', err));
  }, [user?.uid]);

  useEffect(() => {
    if (userDb) loadSlips();
  }, [userDb]);

  const loadSlips = async () => {
    if (!userDb) return;
    try {
      const data = await getAllSlips(userDb);
      if (data.length === 0) {
        setSlips(MOCK_SLIPS);
      } else {
        data.sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`));
        setSlips(data);
      }
    } catch (err) {
      console.error('Failed to load slips', err);
      setSlips(MOCK_SLIPS);
    }
  };

  const openAddModal = () => {
    setFormData({
      patientName: '',
      patientAge: '',
      hospitalName: '',
      condition: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      file: null,
      fileName: '',
      fileType: '',
      fileSize: 0
    });
    setErrorText('');
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (slip) => {
    setFormData({
      patientName: slip.patientName || '',
      patientAge: slip.patientAge || '',
      hospitalName: slip.hospitalName || '',
      condition: slip.condition || '',
      date: slip.date,
      time: slip.time,
      file: slip.file,
      fileName: slip.fileName,
      fileType: slip.fileType,
      fileSize: slip.fileSize
    });
    setCurrentSlip(slip);
    setErrorText('');
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closePreview = () => {
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
    }
    setPreviewBlobUrl('');
    setIsPreviewOpen(false);
  };

  const handlePreview = (slip) => {
    if (slip.isMock) {
      alert(ct('alertSample'));
      return;
    }
    if (slip.file instanceof Blob || slip.file instanceof File) {
      const url = URL.createObjectURL(slip.file);
      setPreviewBlobUrl(url);
      setCurrentSlip(slip);
      setIsPreviewOpen(true);
    } else {
      alert(ct('alertCorrupt'));
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > FILE_SIZE_LIMIT) {
        setErrorText(ct('alertLimit'));
        return;
      }
      
      const type = selectedFile.type;
      if (!type.includes('pdf') && !type.includes('image')) {
        setErrorText(ct('alertAllowed'));
        return;
      }

      setErrorText('');
      setFormData(prev => ({
        ...prev,
        file: selectedFile,
        fileName: selectedFile.name,
        fileType: type.includes('pdf') ? 'PDF' : 'Image',
        fileSize: selectedFile.size
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientName || !formData.patientAge || !formData.date || !formData.time || (!formData.file && !isEditing)) {
      setErrorText(ct('alertRequired'));
      return;
    }

    if (!userDb) { setErrorText(ct('alertDbNotReady')); return; }
    try {
      if (isEditing) {
        if (currentSlip.isMock) {
          alert(ct('alertMockEdit'));
          setIsModalOpen(false);
          return;
        }
        await updateSlip(userDb, { id: currentSlip.id, ...formData });
      } else {
        await addSlip(userDb, { id: Date.now().toString(), ...formData });
      }
      await loadSlips();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Save failed', err);
      setErrorText(ct('alertDbNotReady'));
    }
  };

  const handleDelete = async (id, isMock) => {
    if (isMock) {
       setSlips(slips.filter(s => s.id !== id));
       return;
    }
    if (window.confirm(ct('confirmDelete'))) {
      if (!userDb) return;
      try {
        await deleteSlip(userDb, id);
        await loadSlips();
      } catch (err) {
        console.error('Delete failed', err);
      }
    }
  };

  const handleDownload = (slip, e) => {
    e.stopPropagation();
    if (slip.isMock) {
       alert(ct('alertMockDownload'));
       return;
    }
    if (slip.file instanceof Blob || slip.file instanceof File) {
      const url = URL.createObjectURL(slip.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = slip.fileName || `medical_slip_${slip.patientName}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert(ct('alertCorrupt'));
    }
  };

  const filteredSlips = slips.filter(slip => {
    const matchesSearch = 
      slip.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      slip.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (slip.hospitalName && slip.hospitalName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (slip.condition && slip.condition.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = activeCategory === 'all' || starredIds.includes(slip.id);
    return matchesSearch && matchesCategory;
  });

  // 8 distinct light pastel colour themes — cycle by card index
  const CARD_THEMES = [
    { // Indigo
      gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
      bg: 'linear-gradient(145deg, #eef2ff, #e0e7ff)',
      border: '#a5b4fc',
      accent: '#4f46e5',
      iconBg: 'rgba(99,102,241,0.12)',
      iconColor: '#4f46e5',
      badge: '#4f46e5',
    },
    { // Rose
      gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)',
      bg: 'linear-gradient(145deg, #fff1f2, #ffe4e6)',
      border: '#fda4af',
      accent: '#f43f5e',
      iconBg: 'rgba(244,63,94,0.10)',
      iconColor: '#e11d48',
      badge: '#be123c',
    },
    { // Teal
      gradient: 'linear-gradient(135deg, #14b8a6, #0d9488)',
      bg: 'linear-gradient(145deg, #f0fdfa, #ccfbf1)',
      border: '#5eead4',
      accent: '#0d9488',
      iconBg: 'rgba(20,184,166,0.10)',
      iconColor: '#0d9488',
      badge: '#0f766e',
    },
    { // Amber
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      bg: 'linear-gradient(145deg, #fffbeb, #fef3c7)',
      border: '#fcd34d',
      accent: '#d97706',
      iconBg: 'rgba(245,158,11,0.10)',
      iconColor: '#b45309',
      badge: '#92400e',
    },
    { // Sky
      gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
      bg: 'linear-gradient(145deg, #f0f9ff, #e0f2fe)',
      border: '#7dd3fc',
      accent: '#0ea5e9',
      iconBg: 'rgba(14,165,233,0.10)',
      iconColor: '#0284c7',
      badge: '#0369a1',
    },
    { // Purple
      gradient: 'linear-gradient(135deg, #a855f7, #9333ea)',
      bg: 'linear-gradient(145deg, #faf5ff, #f3e8ff)',
      border: '#d8b4fe',
      accent: '#a855f7',
      iconBg: 'rgba(168,85,247,0.10)',
      iconColor: '#7e22ce',
      badge: '#7e22ce',
    },
    { // Emerald
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      bg: 'linear-gradient(145deg, #ecfdf5, #d1fae5)',
      border: '#6ee7b7',
      accent: '#059669',
      iconBg: 'rgba(16,185,129,0.10)',
      iconColor: '#047857',
      badge: '#065f46',
    },
    { // Orange
      gradient: 'linear-gradient(135deg, #f97316, #ea580c)',
      bg: 'linear-gradient(145deg, #fff7ed, #ffedd5)',
      border: '#fdba74',
      accent: '#ea580c',
      iconBg: 'rgba(249,115,22,0.10)',
      iconColor: '#c2410c',
      badge: '#9a3412',
    },
  ];

  const getSlipTheme = (slip, index = 0) => {
    if (starredIds.includes(slip.id)) {
      // Starred = warm golden accent on top of normal color
      const base = CARD_THEMES[index % CARD_THEMES.length];
      return { ...base, border: '#fcd34d', gradient: 'linear-gradient(135deg, #f59e0b, #f97316)' };
    }
    return CARD_THEMES[index % CARD_THEMES.length];
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Header section with back button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem', background: 'var(--surface)', padding: '1.5rem 2rem', borderRadius: '1.25rem', boxShadow: '0 10px 30px rgba(79, 70, 229, 0.08)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ 
              background: 'var(--surface)', color: '#4f46e5', border: '1px solid var(--border)', 
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', 
              borderRadius: '0.75rem', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s',
              boxShadow: '0 2px 5px rgba(79, 70, 229, 0.05)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 12px rgba(79, 70, 229, 0.1)'; e.currentTarget.style.background = 'var(--bg-color)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 5px rgba(79, 70, 229, 0.05)'; e.currentTarget.style.background = 'var(--surface)'; }}
          >
            <ChevronLeft size={18} /> {ct('dashboard')}
          </button>
          <div style={{ width: '2px', height: '30px', background: '#c7d2fe' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)', padding: '0.5rem', borderRadius: '0.75rem', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)' }}>
               <FileText size={24} />
            </div>
            <h1 style={{ fontSize: '2.2rem', background: 'linear-gradient(135deg, #3730a3 0%, #0891b2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
              {ct('title')}
            </h1>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-color)', padding: '4px', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
            {[{ id: 'all', label: `${ct('allCat')} (${slips.length})` }, { id: 'important', label: `${ct('importantCat')} (${starredIds.length})` }].map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                style={{ padding: '0.4rem 0.9rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', transition: 'all 0.2s',
                  background: activeCategory === cat.id ? 'linear-gradient(135deg, #4f46e5, #06b6d4)' : 'transparent',
                  color: activeCategory === cat.id ? 'white' : 'var(--text-muted)' }}>{cat.label}</button>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#4f46e5' }} />
            <input 
              type="text" 
              placeholder={ct('searchPl')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.8rem 1rem 0.8rem 2.8rem',
                borderRadius: '0.75rem',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-main)',
                width: '280px',
                fontSize: '0.95rem',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.15)'; e.currentTarget.style.outline = 'none'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; }}
            />
          </div>
          <button 
            onClick={openAddModal}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', 
              borderRadius: '0.75rem', background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)', 
              color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem',
              boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.4)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(79, 70, 229, 0.3)'; }}
          >
            <Plus size={20}/> {ct('newRecord')}
          </button>
        </div>
      </div>

      {/* Slips Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
        {filteredSlips.map((slip, idx) => {
          const theme = getSlipTheme(slip, idx);
          const isStarred = starredIds.includes(slip.id);
          return (
          <div key={slip.id} className="card animate-fade-in" style={{ 
            display: 'flex', flexDirection: 'column', gap: '1rem', 
            border: `1.5px solid ${theme.border}`,
            borderRadius: '1.25rem', 
            padding: '1.5rem', background: theme.bg,
            boxShadow: `0 4px 6px rgba(0,0,0,0.02), 0 10px 20px -4px ${theme.accent}18`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative', overflow: 'hidden'
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = `0 20px 40px -8px ${theme.accent}30`; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 6px rgba(0,0,0,0.02), 0 10px 20px -4px ${theme.accent}18`; }}
          >
            {slip.isMock && (
              <div style={{ position: 'absolute', top: '15px', right: '-30px', background: '#e2e8f0', color: '#475569', fontSize: '0.7rem', fontWeight: 'bold', padding: '4px 30px', transform: 'rotate(45deg)', letterSpacing: '1px' }}>
                {ct('sample')}
              </div>
            )}
            {isStarred && (
              <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'linear-gradient(135deg, #f59e0b, #f97316)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(245,158,11,0.4)', zIndex: 2 }}>
                <Star size={13} fill="white" color="white" />
              </div>
            )}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: theme.gradient }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div 
                onClick={() => handlePreview(slip)}
                style={{ 
                  padding: '1.2rem',
                  background: theme.iconBg,
                  borderRadius: '1rem',
                  color: theme.iconColor,
                  cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5)'
                }}
                title="Click to Preview"
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {slip.fileType === 'PDF' ? <FileText size={40} /> : <ImageIcon size={40} />}
              </div>
              
              <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(255,255,255,0.85)', padding: '0.3rem', borderRadius: '0.75rem', border: `1px solid ${theme.border}55`, backdropFilter: 'blur(4px)' }}>
                <button onClick={() => handlePreview(slip)} style={{ background: 'transparent', border: 'none', color: theme.accent, cursor: 'pointer', padding: '0.4rem', borderRadius: '0.5rem', transition: 'background 0.2s' }} title="Preview File">
                  <Eye size={18} />
                </button>
                <button onClick={(e) => handleDownload(slip, e)} style={{ background: 'transparent', border: 'none', color: '#06b6d4', cursor: 'pointer', padding: '0.4rem', borderRadius: '0.5rem', transition: 'background 0.2s' }} title="Download File">
                  <Download size={18} />
                </button>
                <button onClick={() => openEditModal(slip)} style={{ background: 'transparent', border: 'none', color: '#f59e0b', cursor: 'pointer', padding: '0.4rem', borderRadius: '0.5rem', transition: 'background 0.2s' }} title="Edit Info">
                  <Edit3 size={18} />
                </button>
                <button onClick={() => handleDelete(slip.id, slip.isMock)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem', borderRadius: '0.5rem', transition: 'background 0.2s' }} title="Delete File">
                  <Trash2 size={18} />
                </button>
                <button onClick={() => toggleStar(slip.id)} style={{ background: isStarred ? '#fef3c7' : 'transparent', border: 'none', color: isStarred ? '#f59e0b' : '#94a3b8', cursor: 'pointer', padding: '0.4rem', borderRadius: '0.5rem', transition: 'all 0.2s' }} title={isStarred ? 'Remove from Important' : 'Mark as Important'}>
                  <Star size={18} fill={isStarred ? '#f59e0b' : 'none'} />
                </button>
              </div>
            </div>
             
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>{slip.patientName}</h3>
                {slip.patientAge && <span style={{ background: theme.iconBg, color: theme.accent, fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontWeight: 'bold', border: `1px solid ${theme.border}` }}>{slip.patientAge} {ct('years')}</span>}
              </div>

              {slip.condition && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0891b2', background: '#ecfeff', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.8rem', border: '1px solid #cffafe', width: 'fit-content' }}>
                  <Activity size={14} /> {slip.condition}
                </div>
              )}

              {slip.hospitalName && (
                <p style={{ color: theme.accent, margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🏥 {slip.hospitalName}
                </p>
              )}

              <p style={{ color: '#64748b', margin: '0 0 1rem 0', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '6px' }} title={slip.fileName}>
                <FileIcon size={16} style={{ color: '#94a3b8' }}/> {slip.fileName}
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.65)', borderRadius: '0.75rem', border: `1px solid ${theme.border}55`, backdropFilter: 'blur(4px)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}><Calendar size={14} color={theme.accent}/> {slip.date}</span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}><Clock size={14} color={theme.accent}/> {slip.time}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: theme.iconColor, background: theme.iconBg, padding: '3px 10px', borderRadius: '20px', border: `1px solid ${theme.border}` }}>{slip.fileType}</span>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '500' }}>{(slip.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              </div>
            </div>
          </div>
          );
        })}

        {filteredSlips.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem 2rem', background: '#ffffff', borderRadius: '1.5rem', border: '2px dashed #c7d2fe', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '80px', height: '80px', background: '#e0e7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <Stethoscope size={40} style={{ color: '#4f46e5' }} />
            </div>
            <h3 style={{ color: '#3730a3', fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>{ct('noRecords')}</h3>
            <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '400px', margin: '0 auto 2rem auto' }}>{ct('noRecordsDesc')}</p>
            <button 
              onClick={openAddModal}
              style={{ padding: '1rem 2.5rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.05rem', boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)', transition: 'all 0.2s' }}
              onMouseOver={e=>e.currentTarget.style.transform='translateY(-2px)'}
              onMouseOut={e=>e.currentTarget.style.transform='translateY(0)'}
            >
              {ct('addRecord')}
            </button>
          </div>
        )}
      </div>

      {/* Modern Medical Modal Overlay */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem', animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'var(--surface)', borderRadius: '1.5rem', padding: '0',
            width: '100%', maxWidth: '650px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh',
            border: '1px solid #e2e8f0'
          }} className="animate-scale-in">
            
            {/* Modal Header */}
            <div style={{ padding: '1.5rem 2rem', background: 'var(--bg-color)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#3730a3', display: 'flex', alignItems: 'center', gap: '0.8rem', fontWeight: 'bold' }}>
                <div style={{ padding: '0.5rem', background: 'white', borderRadius: '0.5rem', color: '#4f46e5', boxShadow: '0 2px 5px rgba(79, 70, 229, 0.1)' }}>
                  {isEditing ? <Edit3 size={24} /> : <Upload size={24} />}
                </div>
                {isEditing ? ct('updateScan') : ct('newPatientDoc')}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fecaca'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '2rem', overflowY: 'auto' }}>
              {errorText && (
                <div style={{ background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.95rem', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <X size={18} /> {errorText}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Patient Info Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.6rem', color: '#1e293b', fontWeight: '700', fontSize: '0.95rem' }}>{ct('patientName')}</label>
                    <div style={{ position: 'relative' }}>
                      <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#4f46e5' }}/>
                      <input 
                        type="text" required value={formData.patientName} onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                        placeholder={ct('patientNamePl')}
                        style={{ width: '100%', padding: '0.9rem 1rem 0.9rem 2.8rem', borderRadius: '0.75rem', border: '2px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '1rem', transition: 'all 0.2s', fontWeight: '500' }}
                        onFocus={(e) => { e.target.style.borderColor = '#4f46e5'; e.target.style.background = '#ffffff'; e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)'; e.target.style.outline = 'none'; }} 
                        onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg-color)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.6rem', color: '#1e293b', fontWeight: '700', fontSize: '0.95rem' }}>{ct('age')}</label>
                    <input 
                      type="number" required min="0" max="150" value={formData.patientAge} onChange={(e) => setFormData({...formData, patientAge: e.target.value})}
                      placeholder={ct('agePl')}
                      style={{ width: '100%', padding: '0.9rem 1rem', borderRadius: '0.75rem', border: '2px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '1rem', transition: 'all 0.2s', fontWeight: '500' }}
                      onFocus={(e) => { e.target.style.borderColor = '#4f46e5'; e.target.style.background = '#ffffff'; e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)'; e.target.style.outline = 'none'; }} 
                      onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg-color)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.6rem', color: '#1e293b', fontWeight: '700', fontSize: '0.95rem' }}>{ct('hospitalName')}</label>
                    <input 
                      type="text" value={formData.hospitalName} onChange={(e) => setFormData({...formData, hospitalName: e.target.value})}
                      placeholder={ct('hospitalNamePl')}
                      style={{ width: '100%', padding: '0.9rem 1rem', borderRadius: '0.75rem', border: '2px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '1rem', transition: 'all 0.2s', fontWeight: '500' }}
                      onFocus={(e) => { e.target.style.borderColor = '#4f46e5'; e.target.style.background = '#ffffff'; e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)'; e.target.style.outline = 'none'; }} 
                      onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg-color)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div>
                     <label style={{ display: 'block', marginBottom: '0.6rem', color: '#1e293b', fontWeight: '700', fontSize: '0.95rem' }}>{ct('reason')}</label>
                     <div style={{ position: 'relative' }}>
                        <Activity size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#4f46e5' }}/>
                        <input 
                          type="text" value={formData.condition} onChange={(e) => setFormData({...formData, condition: e.target.value})}
                          placeholder={ct('reasonPl')}
                          style={{ width: '100%', padding: '0.9rem 1rem 0.9rem 2.8rem', borderRadius: '0.75rem', border: '2px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '1rem', transition: 'all 0.2s', fontWeight: '500' }}
                          onFocus={(e) => { e.target.style.borderColor = '#4f46e5'; e.target.style.background = '#ffffff'; e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)'; e.target.style.outline = 'none'; }} 
                          onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg-color)'; e.target.style.boxShadow = 'none'; }}
                        />
                     </div>
                  </div>
                </div>

                {/* Date & Time Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.6rem', color: '#1e293b', fontWeight: '700', fontSize: '0.95rem' }}>{ct('date')}</label>
                    <input 
                      type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})}
                      style={{ width: '100%', padding: '0.9rem 1rem', borderRadius: '0.75rem', border: '2px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '1rem', transition: 'all 0.2s', fontFamily: 'inherit', fontWeight: '500' }}
                      onFocus={(e) => { e.target.style.borderColor = '#4f46e5'; e.target.style.background = '#ffffff'; e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)'; e.target.style.outline = 'none'; }} 
                      onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg-color)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.6rem', color: '#1e293b', fontWeight: '700', fontSize: '0.95rem' }}>{ct('time')}</label>
                    <input 
                      type="time" required value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})}
                      style={{ width: '100%', padding: '0.9rem 1rem', borderRadius: '0.75rem', border: '2px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '1rem', transition: 'all 0.2s', fontFamily: 'inherit', fontWeight: '500' }}
                      onFocus={(e) => { e.target.style.borderColor = '#4f46e5'; e.target.style.background = '#ffffff'; e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)'; e.target.style.outline = 'none'; }} 
                      onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg-color)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>

                {/* File Upload Zone */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.6rem', color: '#1e293b', fontWeight: '700', fontSize: '0.95rem' }}>
                    {isEditing ? ct('docFileReplace') : ct('docFile')}
                  </label>
                  <div 
                    style={{ 
                      border: '2px dashed #4f46e5', borderRadius: '1rem', 
                      padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer',
                      background: '#e0e7ff', position: 'relative',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                      transition: 'all 0.3s'
                    }} 
                    onClick={() => fileInputRef.current.click()}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#c7d2fe'; e.currentTarget.style.borderColor = '#4338ca'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = '#e0e7ff'; e.currentTarget.style.borderColor = '#4f46e5'; }}
                  >
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '50%', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.1)' }}>
                       {formData.fileName ? (formData.fileType === 'PDF' ? <FileText size={32} color="#f43f5e"/> : <ImageIcon size={32} color="#0ea5e9"/>) : <Upload size={32} color="#4f46e5" />}
                    </div>
                    
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#4f46e5', fontSize: '1.1rem', fontWeight: 'bold' }}>
                        {formData.fileName ? formData.fileName : ct('uploadOrDrag')}
                      </h4>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                        {ct('maxSize')}
                      </p>
                    </div>

                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,.pdf"
                      style={{ display: 'none' }}
                    />
                  </div>
                  {formData.fileSize > 0 && (
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.8rem', textAlign: 'right', fontWeight: '600' }}>
                      {ct('selectedSize')} <span style={{ color: '#4f46e5' }}>{(formData.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                  )}
                </div>

                {/* Modal Footer Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    style={{ padding: '0.8rem 1.8rem', borderRadius: '0.75rem', background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'all 0.2s' }}
                    onMouseOver={e=>{e.target.style.background='var(--border)';}} 
                    onMouseOut={e=>{e.target.style.background='var(--bg-color)';}}
                  >
                    {ct('cancel')}
                  </button>
                  <button 
                    type="submit" 
                    style={{ padding: '0.8rem 2rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)', transition: 'transform 0.2s' }}
                    onMouseOver={e=>e.currentTarget.style.transform='translateY(-2px)'} onMouseOut={e=>e.currentTarget.style.transform='translateY(0)'}
                  >
                    <Save size={20} /> {isEditing ? ct('saveChanges') : ct('uploadSlip')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {isPreviewOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '2rem', animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ width: '100%', height: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem 1rem 0 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'white' }}>
                <div style={{ background: currentSlip.fileType === 'PDF' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(14, 165, 233, 0.2)', padding: '0.5rem', borderRadius: '0.5rem', color: currentSlip.fileType === 'PDF' ? '#fb7185' : '#7dd3fc' }}>
                   {currentSlip.fileType === 'PDF' ? <FileText size={20} /> : <ImageIcon size={20} />}
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '500' }}>{currentSlip.patientName} <span style={{ color: '#94a3b8', margin: '0 8px' }}>/</span> {currentSlip.fileName}</h3>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={(e) => handleDownload(currentSlip, e)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', transition: 'all 0.2s' }}
                  onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.2)'} onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}
                >
                  <Download size={18}/> {ct('downloadFile')}
                </button>
                <button 
                  onClick={closePreview}
                  style={{ background: '#ef4444', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)', transition: 'all 0.2s' }}
                  onMouseOver={e=>e.currentTarget.style.background='#dc2626'} onMouseOut={e=>e.currentTarget.style.background='#ef4444'}
                >
                  <X size={18}/> {ct('closePreview')}
                </button>
              </div>
            </div>
            
            {/* Viewer Content */}
            <div style={{ flex: 1, background: '#ffffff', borderRadius: '0 0 1rem 1rem', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: currentSlip.fileType === 'Image' ? '2rem' : '0' }}>
              {currentSlip.fileType === 'PDF' ? (
                <iframe src={previewBlobUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF Preview" />
              ) : (
                <img src={previewBlobUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              )}
            </div>
          </div>
        </div>
      )}

      <SectionAbout
        title={ct('title')}
        icon="📋"
        color="#4f46e5"
        gradient="linear-gradient(135deg, #4f46e5, #06b6d4)"
        what={ct('aboutWhat')}
        howToUse={ct('aboutHow')}
        importance={ct('aboutWhy')}
      />

    </div>
  );
}
