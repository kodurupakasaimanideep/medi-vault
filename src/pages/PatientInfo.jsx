import { useState, useEffect } from 'react';
import SectionAbout from '../components/SectionAbout';
import { useLanguage } from '../contexts/LanguageContext';
import {
// Lucide icons:
  User, Calendar, Phone, Mail, Activity, Heart,
  Droplet, FileText, AlertTriangle, ShieldCheck,
  Ruler, Weight, Users, Clock, CheckCircle, Save,
  Siren, Phone as PhoneIcon, Pill, Cross
} from 'lucide-react';
import './PatientInfo.css';

const InputField = ({ label, labelIcon, icon, children, textarea }) => (
  <div className="pi-field">
    <div className="pi-label">
      {labelIcon && <span className="pi-label-icon">{labelIcon}</span>}
      {label}
    </div>
    <div className={`pi-input-wrap${textarea ? ' pi-textarea-wrap' : ''}`}>
      {icon && <span className="pi-input-prefix-icon">{icon}</span>}
      {children}
    </div>
  </div>
);

export default function PatientInfo({ user }) {
  const [isSaving, setIsSaving]     = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [form, setForm] = useState({
    // Personal
    fullName:   '',
    age:        '',
    sex:        '',
    dob:        '',
    username:   user?.username || '',
    phone:      '',
    height:     '',
    weight:     '',
    bloodGroup: '',
    // Medical History
    allergies:         '',
    currentMedications:'',
    pastMedicalHistory:'',
    immunizationStatus:'',
    lastCheckupDate:   '',
    // Emergency (separate, prominent)
    emergencyName:     '',
    emergencyPhone:    '',
    emergencyRelation: '',
    criticalAllergy:   '',
    emergencyNotes:    '',
  });

  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`medivault_patient_info_${user.id}`);
      const personalRaw = localStorage.getItem(`medivault_personal_details_${user.id}`);
      const personal = personalRaw ? JSON.parse(personalRaw) : null;

      if (saved) {
        // Merge: patientInfo takes priority, fill gaps from personalDetails
        const parsed = JSON.parse(saved);
        setForm(prev => ({
          ...prev,
          ...parsed,
          username: user.username || prev.username,
          // Fill empty fields from personal details modal
          fullName: parsed.fullName || personal?.fullName || prev.fullName,
          age:      parsed.age      || personal?.age      || prev.age,
          sex:      parsed.sex      || personal?.gender   || prev.sex,
          dob:      parsed.dob      || personal?.dob      || prev.dob,
        }));
      } else if (personal) {
        // No patientInfo saved yet — pre-fill entirely from personal details modal
        setForm(prev => ({
          ...prev,
          username: user.username || prev.username,
          fullName: personal.fullName || prev.fullName,
          age:      personal.age      || prev.age,
          sex:      personal.gender   || prev.sex,
          dob:      personal.dob      || prev.dob,
        }));
      } else {
        setForm(prev => ({ ...prev, username: user.username || prev.username }));
      }
    }
  }, [user]);

  const handle = e => {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value };
      // Live sidebar avatar preview when sex/gender changes
      if (name === 'sex' && value) {
        window.dispatchEvent(new CustomEvent('mv_avatar_preview', {
          detail: { gender: value, age: next.age || prev.age || '32' }
        }));
      }
      return next;
    });
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem(`medivault_patient_info_${user.id}`, JSON.stringify(form));

      // Sync back to personal details store so dashboard stays up to date
      const personalRaw = localStorage.getItem(`medivault_personal_details_${user.id}`);
      const personal = personalRaw ? JSON.parse(personalRaw) : {};
      const nameParts = form.fullName?.trim().split(' ') || [];
      const updatedPersonal = {
        ...personal,
        firstName: nameParts[0] || '',
        lastName:  nameParts.slice(1).join(' ') || '',
        fullName:  form.fullName || '',
        age:       form.age      || '',
        dob:       form.dob      || '',
        gender:    form.sex      || '',
      };
      localStorage.setItem(`medivault_personal_details_${user.id}`, JSON.stringify(updatedPersonal));

      // Notify sidebar and other components to refresh avatar / name
      window.dispatchEvent(new CustomEvent('mv_profile_updated', { detail: updatedPersonal }));

      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 800);
  };

  const { lang } = useLanguage();

  const localT = {
    en: {
      breadcrumb: "Medivault › Patient Profile",
      title: "Patient Profile",
      subtitle: "Your complete health identity — personal & medical records",
      saving: "Saving...",
      saved: "Profile Saved!",
      save: "Save Changes",
      emergTitle: "Emergency Medical Information",
      emergVisible: "VISIBLE IN EMERGENCIES",
      emergContactName: "Emergency Contact Name",
      emergContactNamePl: "e.g., Jane Doe",
      emergContactPhone: "Emergency Contact Phone",
      emergRelation: "Relationship",
      emergRelationPl: "Select Relation",
      emergAllergy: "Critical Allergy (Life-threatening)",
      emergAllergyPl: "e.g., Penicillin, Peanuts, Latex",
      emergBloodGroup: "Blood Group",
      emergBloodGroupPl: "Select",
      emergNotes: "Emergency Notes / Conditions",
      emergNotesPl: "e.g., Diabetic, Epileptic, On Warfarin...",
      
      relationSpouse: "Spouse",
      relationParent: "Parent",
      relationChild: "Child",
      relationSibling: "Sibling",
      relationFriend: "Friend",
      relationGuardian: "Guardian",
      relationOther: "Other",

      personalTitle: "Personal Details",
      personalSub: "Identity & contact information",
      fullName: "Full Name",
      fullNamePl: "John Michael Doe",
      age: "Age",
      agePl: "e.g. 30",
      sex: "Sex",
      sexPl: "Select",
      sexMale: "Male",
      sexFemale: "Female",
      sexOther: "Other",
      sexPreferNot: "Prefer not to say",
      dob: "Date of Birth",
      username: "Username (System)",
      phone: "Phone Number",
      height: "Height",
      heightPl: "178 cm",
      weight: "Weight",
      weightPl: "68 kg",
      famBlood: "Family Blood Group",
      famBloodPl: "e.g. Father: O+, Mother: A+",

      medicalTitle: "Medical History",
      medicalSub: "Health records & clinical background",
      allergies: "Allergies",
      allergiesPl: "Known allergies (e.g., Peanuts, Penicillin, Latex)…",
      meds: "Current Medications",
      medsPl: "Current prescriptions and dosages…",
      pastHistory: "Past Medical History",
      pastHistoryPl: "Past surgeries, hospitalizations, chronic conditions…",
      immunization: "Immunization Status",
      immunizationPl: "e.g., Up to date — flu shot Oct 2024",
      lastCheckup: "Last Checkup Date",

      aboutWhat: "The Patient Profile section serves as your comprehensive digital medical identity card within MediVault, securely consolidating your personal details, emergency contact info, and complete medical history. It allows you to maintain vital statistics (like blood group, height, and weight) alongside critical medical background (such as allergies, immunization status, and active prescriptions), ensuring all information is instantly accessible and structured for emergency situations.",
      aboutHow: [
        'Open the Patient Profile page from the dashboard sidebar navigation.',
        'Review the Emergency Medical Information box at the very top of the page.',
        'Fill in critical emergency fields, including contact name, phone, relationship, and any severe, life-threatening allergies.',
        'Select your blood group from the dropdown so it is clearly visible in urgent medical circumstances.',
        'Provide any emergency notes or long-term chronic conditions (e.g., Diabetic, Epileptic) in the corresponding field.',
        'Proceed to the Personal Details card on the left to input your full name, age, biological sex, and date of birth.',
        'Verify your system username and input your current active phone number, height, weight, and family blood groups.',
        'Move to the Medical History card on the right to enter known allergies, active prescriptions, and past medical conditions.',
        'Input your current immunization status (e.g., Tetanus or Covid vaccine dates) and your last general physical checkup date.',
        'Click the prominent "Save Changes" button in the upper-right corner of the page to securely commit your profile info.',
        'Watch for the button to transition into a green "Profile Saved!" checkmark, confirming updates are successfully written to local storage.',
        'Update your details regularly, especially your weight, active medications, and contact details, to keep your record current.',
      ],
      aboutWhy: [
        'Consolidates all your personal and clinical records into a single, well-organized dashboard for seamless reference.',
        'Emergency Information box is placed prominently at the top to ensure doctors or caretakers can view it instantly during crises.',
        'Keeping a record of critical allergies prevents drug or food interactions during treatment.',
        'Accurate weight and height logs provide data for correct medication dosage calculations by physicians.',
        'Past surgeries history gives new practitioners instant diagnostic context.',
        'Helps track immunizations so you never miss booster shots.',
        'Includes emergency contacts so your family can be reached immediately.',
        'Uses secure local storage to keep your profile private on your device.',
        'Reduces time spent filling out tedious physical intake paperwork at clinics.',
        'Encourages proactive tracking by prompting you to keep your last general checkup dates updated.',
      ]
    },
    te: {
      breadcrumb: "Medivault › రోగి ప్రొఫైల్",
      title: "రోగి ప్రొఫైల్",
      subtitle: "మీ పూర్తి ఆరోగ్య గుర్తింపు — వ్యక్తిగత & వైద్య రికార్డులు",
      saving: "సేవ్ అవుతోంది...",
      saved: "ప్రొఫైల్ సేవ్ చేయబడింది!",
      save: "మార్పులను సేవ్ చేయి",
      emergTitle: "అత్యవసర వైద్య సమాచారం",
      emergVisible: "అత్యవసర పరిస్థితుల్లో కనిపిస్తుంది",
      emergContactName: "అత్యవసర సంప్రదింపు వ్యక్తి పేరు",
      emergContactNamePl: "ఉదా., జానకి రామ్",
      emergContactPhone: "అత్యవసర సంప్రదింపు ఫోన్",
      emergRelation: "సంబంధం",
      emergRelationPl: "సంబంధాన్ని ఎంచుకోండి",
      emergAllergy: "తీవ్రమైన అలర్జీ (ప్రాణాంతకం)",
      emergAllergyPl: "ఉదా., పెన్సిలిన్, శనగలు",
      emergBloodGroup: "రక్త గ్రూపు",
      emergBloodGroupPl: "ఎంచుకోండి",
      emergNotes: "అత్యవసర గమనికలు / పరిస్థితులు",
      emergNotesPl: "ఉదా., మధుమేహం, ఫిట్స్, వార్ఫరిన్ వాడకం...",

      relationSpouse: "భార్య/భర్త",
      relationParent: "తల్లి/తండ్రి",
      relationChild: "పిల్లలు",
      relationSibling: "తోబుట్టువు",
      relationFriend: "స్నేహితుడు",
      relationGuardian: "సంరక్షకుడు",
      relationOther: "ఇతరాలు",

      personalTitle: "వ్యక్తిగત వివరాలు",
      personalSub: "గుర్తింపు & సంప్రదింపు సమాచారం",
      fullName: "పూర్తి పేరు",
      fullNamePl: "పూర్తి పేరు నమోదు చేయండి",
      age: "వయస్సు",
      agePl: "ఉదా. 30",
      sex: "లింగం",
      sexPl: "ఎంచుకోండి",
      sexMale: "పురుషుడు",
      sexFemale: "స్త్రీ",
      sexOther: "ఇతరాలు",
      sexPreferNot: "చెప్పడానికి ఇష్టపడలేదు",
      dob: "పుట్టిన తేదీ",
      username: "యూజర్‌నేమ్ (సిస్టమ్)",
      phone: "ఫోన్ నంబర్",
      height: "ఎత్తు",
      heightPl: "178 సెం.మీ",
      weight: "బరువు",
      weightPl: "68 కిలోలు",
      famBlood: "కుటుంబ రక్త గ్రూపు",
      famBloodPl: "ఉదా. తండ్రి: O+, తల్లి: A+",

      medicalTitle: "వైద్య చరిత్ర",
      medicalSub: "ఆరోగ్య రికార్డులు & వైద్య నేపథ్యం",
      allergies: "అలర్జీలు",
      allergiesPl: "తెలిసిన అలర్జీలు (ఉదా., శనగలు, పెన్సిలిన్)...",
      meds: "ప్రస్తుత మందులు",
      medsPl: "ప్రస్తుత మందుల వివరాలు మరియు మోతాదు...",
      pastHistory: "గత వైద్య చరిత్ర",
      pastHistoryPl: "గత శస్త్రచికిత్సలు, ఆసుపత్రి చేరికలు, దీర్ఘకాలిక సమస్యలు...",
      immunization: "టీకాల స్థితి",
      immunizationPl: "ఉదా., నవీకరించబడింది — ఫ్లూ షాట్ అక్టోబర్ 2024",
      lastCheckup: "చివరి ఆరోగ్య పరీక్ష తేదీ",

      aboutWhat: "రోగి ప్రొఫైల్ విభాగం అనేది MediVault లో మీ పూర్తి డిజిటల్ వైద్య గుర్తింపు పత్రం. ఇది మీ అత్యవసర వివరాలు, వ్యక్తిగత మరియు వైద్య చరిత్ర సమాచారాన్ని సురక్షితంగా ఒకే చోట భద్రపరుస్తుంది.",
      aboutHow: [
        'సైడ్‌బార్ మెనూ నుండి రోగి ప్రొఫైల్ పేజీని తెరవండి.',
        'అన్నింటికంటే పైన ఉన్న అత్యవసర వైద్య సమాచార పెట్టెను పరిశీలించండి.',
        'అత్యవసర సంప్రదింపు పేరు, ఫోన్ నంబర్ మరియు ప్రాణాంతక అలర్జీలను నమోదు చేయండి.',
        'తక్షణ చికిత్స సమయంలో స్పష్టంగా కనిపించేలా మీ రక్త గ్రూపును ఎంచుకోండి.',
        'దీర్ఘకాలిక వ్యాధుల గురించిన వివరాలను అత్యవసర గమనికల పెట్టెలో నమోదు చేయండి.',
        'ఎడమ వైపున మీ పూర్తి పేరు, వయస్సు, పుట్టిన తేదీ మరియు లింగాన్ని నమోదు చేయండి.',
        'మీ ఫోన్ నంబర్, ఎత్తు మరియు బరువు వివరాలను పూరించండి.',
        'కుడి వైపున వైద్య చరిత్రలో మీ అలర్జీలు, వాడుతున్న మందులు మరియు గత శస్త్రచికిత్సల వివరాలను నమోదు చేయండి.',
        'చివరిగా చేసిన ఆరోగ్య పరీక్ష మరియు టీకాల సమాచారాన్ని నమోదు చేయండి.',
        'పేజీ యొక్క కుడి ఎగువ మూలలో ఉన్న "మార్పులను సేవ్ చేయి" బటన్‌ను క్లిక్ చేయండి.',
        'బటన్ పచ్చటి "ప్రొఫైల్ సేవ్ చేయబడింది!" గా మారే వరకు వేచి ఉండండి.',
        'మీ వివరాలను ఎప్పటికప్పుడు నవీకరిస్తూ ఉండండి.',
      ],
      aboutWhy: [
        'మీ వైద్య సమాచారాన్ని ఒకే చోట సులభంగా చూసుకోవడానికి సహాయపడుతుంది.',
        'అత్యవసర పెట్టె పైన ఉండటం వల్ల డాక్టర్లు లేదా సంరక్షకులు అత్యవసర సమయాల్లో తక్షణమే చూడవచ్చు.',
        'అలర్జీల రికార్డులు ప్రాణాంతక ఔషధ లేదా ఆహార దుష్ప్రభావాలను నివారిస్తాయి.',
        'ఖచ్చితమైన బరువు మరియు ఎత్తు మోతాదుల లెక్కింపుకు సహాయపడతాయి.',
        'గత శస్త్రచికిత్సల రికార్డు నూతన వైద్యులకు త్వరిత వ్యాధి నిర్ధారణకు తోడ్పడుతుంది.',
        'నిర్ణీత గడువులోగా టీకాలు మరియు బూస్టర్ షాట్లు వేసుకోవడానికి సహాయపడుతుంది.',
        'అత్యవసర परिस्थितियों లో కుటుంబ సభ్యులను త్వరగా సంప్రదించడానికి తోడ్పడుతుంది.',
        'మీ డేటా అంతా అత్యంత సురક્ષితంగా మీ డివైస్ లోనే లోకల్‌గా దాచబడుతుంది.',
        'ఆసుపత్రులలో కాగితాల ఫారమ్‌లు నింపే సమయాన్ని ఆదా చేస్తుంది.',
        'చివరి ఆరోగ్య పరీక్ష తేదీని గుర్తుంచుకోవడం ద్వారా క్రమం తప్పకుండా చెకప్ చేసుకునేలా ప్రోత్సహిస్తుంది.',
      ]
    },
    hi: {
      breadcrumb: "Medivault › मरीज प्रोफ़ाइल",
      title: "मरीज प्रोफ़ाइल",
      subtitle: "आपकी संपूर्ण स्वास्थ्य पहचान — व्यक्तिगत और चिकित्सा रिकॉर्ड",
      saving: "सहेज रहा है...",
      saved: "प्रोफ़ाइल सहेजी गई!",
      save: "परिवर्तन सहेजें",
      emergTitle: "आपातकालीन चिकित्सा जानकारी",
      emergVisible: "आपातकाल के समय दृश्यमान",
      emergContactName: "आपातकालीन संपर्क नाम",
      emergContactNamePl: "जैसे, जेन डो",
      emergContactPhone: "आपातकालीन संपर्क फोन",
      emergRelation: "संबंध",
      emergRelationPl: "संबंध चुनें",
      emergAllergy: "गंभीर एलर्जी (जानलेवा)",
      emergAllergyPl: "जैसे, पेनिसिलिन, मूंगफली, लेटेक्स",
      emergBloodGroup: "रक्त समूह",
      emergBloodGroupPl: "चुनें",
      emergNotes: "आपातकालीन नोट्स / स्थितियां",
      emergNotesPl: "जैसे, मधुमेह, मिर्गी, वारफारिन पर...",

      relationSpouse: "पति/पत्नी",
      relationParent: "माता/पिता",
      relationChild: "बच्चा",
      relationSibling: "भाई/बहन",
      relationFriend: "मित्र",
      relationGuardian: "अभिभावक",
      relationOther: "अन्य",

      personalTitle: "व्यक्तिगत विवरण",
      personalSub: "पहचान और संपर्क जानकारी",
      fullName: "पूरा नाम",
      fullNamePl: "जॉन माइकल डो",
      age: "आयु",
      agePl: "जैसे 30",
      sex: "लिंग",
      sexPl: "चुनें",
      sexMale: "पुरुष",
      sexFemale: "महिला",
      sexOther: "अन्य",
      sexPreferNot: "बताना नहीं चाहते",
      dob: "जन्म तिथि",
      username: "यूज़रनेम (सिस्टम)",
      phone: "फ़ोन नंबर",
      height: "ऊंचाई",
      heightPl: "178 सेमी",
      weight: "वजन",
      weightPl: "68 किग्रा",
      famBlood: "पारिवारिक रक्त समूह",
      famBloodPl: "जैसे पिता: O+, माता: A+",

      medicalTitle: "चिकित्सा इतिहास",
      medicalSub: "स्वास्थ्य रिकॉर्ड और नैदानिक पृष्ठभूमि",
      allergies: "एलर्जी",
      allergiesPl: "ज्ञात एलर्जी (जैसे, मूंगफली, पेनिसिलिन, लेटेक्स)…",
      meds: "वर्तमान दवाएं",
      medsPl: "वर्तमान नुस्खे और खुराक…",
      pastHistory: "पिछला चिकित्सा इतिहास",
      pastHistoryPl: "पिछली सर्जरी, अस्पताल में भर्ती, पुरानी स्थितियां…",
      immunization: "टीकाकरण की स्थिति",
      immunizationPl: "जैसे, अद्यतित — फ्लू शॉट अक्टूबर 2024",
      lastCheckup: "अंतिम जांच की तिथि",

      aboutWhat: "मरीज प्रोफ़ाइल अनुभाग MediVault के भीतर आपके डिजिटल चिकित्सा पहचान पत्र के रूप में कार्य करता है, जो व्यक्तिगत विवरण, आपातकालीन संपर्क जानकारी और चिकित्सा इतिहास को एकीकृत करता है.",
      aboutHow: [
        'साइडबार नेविगेशन से मरीज प्रोफ़ाइल पेज खोलें.',
        'सबसे ऊपर आपातकालीन चिकित्सा जानकारी बॉक्स की समीक्षा करें.',
        'आपातकालीन संपर्क नाम, फोन, संबंध और गंभीर एलर्जी दर्ज करें.',
        'त्वरित चिकित्सा संदर्भ के लिए अपना रक्त समूह चुनें.',
        'आपातकालीन नोट्स या पुरानी बीमारियों का विवरण भरें.',
        'बाएं कार्ड में अपना पूरा नाम, आयु, लिंग और जन्म तिथि दर्ज करें.',
        'अपना फोन नंबर, ऊंचाई, वजन और पारिवारिक रक्त समूह दर्ज करें.',
        'दाएं कार्ड में ज्ञात एलर्जी, वर्तमान दवाएं और पिछला चिकित्सा इतिहास दर्ज करें.',
        'अपनी टीकाकरण स्थिति और अंतिम शारीरिक जांच तिथि दर्ज करें.',
        'ऊपरी दाएं कोने में "परिवर्तन सहेजें" बटन पर क्लिक करें.',
        'बटन के हरा होने और "प्रोफ़ाइल सहेजी गई!" दिखने तक प्रतीक्षा करें.',
        'अपने रिकॉर्ड को अद्यतित रखने के लिए समय-समय पर जानकारी अपडेट करें.',
      ],
      aboutWhy: [
        'आपके सभी व्यक्तिगत और नैदानिक रिकॉर्ड को संदर्भ के लिए व्यवस्थित रखता है.',
        'आपातकालीन बॉक्स को सबसे ऊपर रखा गया है ताकि डॉक्टर इसे संकट के समय तुरंत देख सकें.',
        'एलर्जी रिकॉर्ड गंभीर दवा या खाद्य दुष्प्रभावों से सुरक्षा प्रदान करते हैं.',
        'सटीक वजन और ऊंचाई डॉक्टरों को दवाओं की सही खुराक निर्धारित करने में मदद करती है.',
        'पिछली सर्जरी का इतिहास नए डॉक्टरों को तुरंत नैदानिक संदर्भ प्रदान करता है.',
        'टीकाकरण इतिहास यह सुनिश्चित करता है कि आप समय पर बूस्टर खुराक लें.',
        'आपातकालीन संपर्क नंबर संकट के समय परिवार से तुरंत संपर्क सुनिश्चित करते हैं.',
        'डेटा स्थानीय रूप से संग्रहीत होता है, जिससे यह पूरी तरह निजी और सुरक्षित रहता है.',
        'अस्पताल में बार-बार पंजीकरण फॉर्म भरने के समय को बचाता है.',
        'नियमित स्वास्थ्य जांच की तारीखें याद रखकर समय पर स्वास्थ्य परीक्षण को बढ़ावा देता है.',
      ]
    },
    eu: {
      breadcrumb: "Medivault › Perfil del Paciente",
      title: "Perfil del Paciente",
      subtitle: "Su identidad de salud completa — registros personales y médicos",
      saving: "Guardando...",
      saved: "¡Perfil Guardado!",
      save: "Guardar Cambios",
      emergTitle: "Información Médica de Emergencia",
      emergVisible: "VISIBLE EN EMERGENCIAS",
      emergContactName: "Nombre del Contacto de Emergencia",
      emergContactNamePl: "ej., Jane Doe",
      emergContactPhone: "Teléfono del Contacto de Emergencia",
      emergRelation: "Relación",
      emergRelationPl: "Seleccionar Relación",
      emergAllergy: "Alergia Crítica (Riesgo Vital)",
      emergAllergyPl: "ej., Penicilina, Cacahuetes, Látex",
      emergBloodGroup: "Grupo Sanguíneo",
      emergBloodGroupPl: "Seleccionar",
      emergNotes: "Notas / Condiciones de Emergencia",
      emergNotesPl: "ej., Diabético, Epiléptico, Toma Warfarina...",

      relationSpouse: "Cónyuge",
      relationParent: "Padre/Madre",
      relationChild: "Hijo/a",
      relationSibling: "Hermano/a",
      relationFriend: "Amigo/a",
      relationGuardian: "Tutor/a",
      relationOther: "Otro",

      personalTitle: "Datos Personales",
      personalSub: "Información de identidad y contacto",
      fullName: "Nombre Completo",
      fullNamePl: "John Michael Doe",
      age: "Edad",
      agePl: "ej. 30",
      sex: "Sexo",
      sexPl: "Seleccionar",
      sexMale: "Masculino",
      sexFemale: "Femenino",
      sexOther: "Otro",
      sexPreferNot: "Prefiero no decirlo",
      dob: "Fecha de Nacimiento",
      username: "Usuario (Sistema)",
      phone: "Número de Teléfono",
      height: "Altura",
      heightPl: "178 cm",
      weight: "Peso",
      weightPl: "68 kg",
      famBlood: "Grupo Sanguíneo Familiar",
      famBloodPl: "ej. Padre: O+, Madre: A+",

      medicalTitle: "Historial Médico",
      medicalSub: "Registros de salud y antecedentes clínicos",
      allergies: "Alergias",
      allergiesPl: "Alergias conocidas (ej., cacahuetes, penicilina, látex)…",
      meds: "Medicamentos Actuales",
      medsPl: "Prescripciones actuales y dosis…",
      pastHistory: "Historial Médico Pasado",
      pastHistoryPl: "Cirugías previas, hospitalizaciones, enfermedades crónicas…",
      immunization: "Estado de Vacunación",
      immunizationPl: "ej., Al día — vacuna de gripe Oct 2024",
      lastCheckup: "Fecha del Último Chequeo",

      aboutWhat: "La sección Perfil del Paciente sirve como su tarjeta de identidad médica digital en MediVault, consolidando de manera segura sus datos personales, información de contacto de emergencia e historial médico completo.",
      aboutHow: [
        'Abra la página Perfil del Paciente desde el menú de navegación de la barra lateral.',
        'Revise el cuadro de Información Médica de Emergencia en la parte superior.',
        'Complete los campos de emergencia críticos, incluyendo contacto, teléfono y alergias graves.',
        'Seleccione su grupo sanguíneo para que sea visible en circunstancias urgentes.',
        'Indique cualquier nota de emergencia o condiciones crónicas en el campo correspondiente.',
        'Complete los datos de la sección Detalles Personales: nombre, edad, sexo y fecha de nacimiento.',
        'Verifique su usuario del sistema e ingrese su número de teléfono, peso y altura.',
        'Complete en la tarjeta de Historial Médico sus alergias, recetas activas y condiciones pasadas.',
        'Ingrese su estado de vacunación y la fecha de su último chequeo general.',
        'Haga clic en el botón "Guardar Cambios" en la esquina superior derecha.',
        'Espere a que aparezca la confirmación en verde "¡Perfil Guardado!".',
        'Actualice sus datos periódicamente para mantener su registro al día.',
      ],
      aboutWhy: [
        'Consolida todos sus registros personales y clínicos en un único panel de fácil acceso.',
        'El cuadro de Emergencia está en la parte superior para que los médicos puedan verlo de inmediato.',
        'El registro de alergias críticas previene reacciones potencialmente mortales a medicamentos.',
        'El peso y la altura correctos permiten calcular con precisión las dosis de medicamentos.',
        'El historial clínico proporciona un contexto inmediato a nuevos profesionales de la salud.',
        'Ayuda a mantener al día las vacunas y los refuerzos de temporada.',
        'Los contactos de emergencia facilitan la comunicación con la familia en situaciones críticas.',
        'El almacenamiento local garantiza la máxima privacidad de sus datos de salud en su dispositivo.',
        'Reduce el tiempo y la molestia de completar formularios en papel en clínicas y hospitales.',
        'Fomenta el seguimiento proactivo al recordar la fecha de su último chequeo general.',
      ]
    }
  };

  const ct = (key) => localT[lang]?.[key] || localT['en']?.[key];

  return (
    <div className="pi-page">

      {/* ── HEADER ─────────────────────────────── */}
      <div className="pi-header">
        <div className="pi-header-left">
          <span className="pi-breadcrumb">{ct('breadcrumb')}</span>
          <h1 className="pi-title">
            <div className="pi-title-icon-wrap">
              <User size={22} color="white" />
            </div>
            {ct('title')}
          </h1>
          <p className="pi-subtitle">{ct('subtitle')}</p>
        </div>

        <button
          className={`pi-save-btn${savedSuccess ? ' pi-saved' : ''}`}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <><Clock size={17} className="spin" /> {ct('saving')}</>
          ) : savedSuccess ? (
            <><CheckCircle size={17} /> {ct('saved')}</>
          ) : (
            <><Save size={17} /> {ct('save')}</>
          )}
        </button>
      </div>

      {/* ══════════════════════════════════════════
          🚨  EMERGENCY MEDICAL INFORMATION BOX
          ══════════════════════════════════════════ */}
      <div className="pi-emergency-box">

        {/* Top bar */}
        <div className="pi-emergency-top-bar">
          <span className="pi-emergency-top-bar-icon">
            <AlertTriangle size={20} color="white" />
          </span>
          <span className="pi-emergency-top-bar-text">
            🚨 &nbsp; {ct('emergTitle')}
          </span>
          <span className="pi-emergency-top-bar-badge">{ct('emergVisible')}</span>
        </div>

        {/* Fields */}
        <div className="pi-emergency-body">

          {/* Emergency Contact — Name */}
          <div className="pi-emergency-field">
            <div className="pi-emergency-label">
              <Users size={12} style={{ display:'inline', marginRight: 5 }} />
              {ct('emergContactName')}
            </div>
            <div className="pi-emergency-input-wrap">
              <Users size={15} className="pi-emergency-icon" />
              <input
                type="text" name="emergencyName"
                value={form.emergencyName} onChange={handle}
                className="pi-emergency-input"
                placeholder={ct('emergContactNamePl')}
              />
            </div>
          </div>

          {/* Emergency Contact — Phone */}
          <div className="pi-emergency-field">
            <div className="pi-emergency-label">
              <PhoneIcon size={12} style={{ display:'inline', marginRight: 5 }} />
              {ct('emergContactPhone')}
            </div>
            <div className="pi-emergency-input-wrap">
              <PhoneIcon size={15} className="pi-emergency-icon" />
              <input
                type="tel" name="emergencyPhone"
                value={form.emergencyPhone} onChange={handle}
                className="pi-emergency-input"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          {/* Relationship */}
          <div className="pi-emergency-field">
            <div className="pi-emergency-label">
              <Heart size={12} style={{ display:'inline', marginRight: 5 }} />
              {ct('emergRelation')}
            </div>
            <div className="pi-emergency-input-wrap">
              <Heart size={15} className="pi-emergency-icon" />
              <select
                name="emergencyRelation"
                value={form.emergencyRelation} onChange={handle}
                className="pi-emergency-input"
              >
                <option value="">{ct('emergRelationPl')}</option>
                <option value="Spouse">{ct('relationSpouse')}</option>
                <option value="Parent">{ct('relationParent')}</option>
                <option value="Child">{ct('relationChild')}</option>
                <option value="Sibling">{ct('relationSibling')}</option>
                <option value="Friend">{ct('relationFriend')}</option>
                <option value="Guardian">{ct('relationGuardian')}</option>
                <option value="Other">{ct('relationOther')}</option>
              </select>
            </div>
          </div>

          {/* Critical Allergy */}
          <div className="pi-emergency-field">
            <div className="pi-emergency-label">
              <AlertTriangle size={12} style={{ display:'inline', marginRight: 5 }} />
              {ct('emergAllergy')}
            </div>
            <div className="pi-emergency-input-wrap">
              <AlertTriangle size={15} className="pi-emergency-icon" />
              <input
                type="text" name="criticalAllergy"
                value={form.criticalAllergy} onChange={handle}
                className="pi-emergency-input"
                placeholder={ct('emergAllergyPl')}
              />
            </div>
          </div>

          {/* Blood Group */}
          <div className="pi-emergency-field">
            <div className="pi-emergency-label">
              <Droplet size={12} style={{ display:'inline', marginRight: 5 }} />
              {ct('emergBloodGroup')}
            </div>
            <div className="pi-emergency-input-wrap">
              <Droplet size={15} className="pi-emergency-icon" />
              <select
                name="bloodGroup"
                value={form.bloodGroup} onChange={handle}
                className="pi-emergency-input"
              >
                <option value="">{ct('emergBloodGroupPl')}</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Critical Notes */}
          <div className="pi-emergency-field">
            <div className="pi-emergency-label">
              <FileText size={12} style={{ display:'inline', marginRight: 5 }} />
              {ct('emergNotes')}
            </div>
            <div className="pi-emergency-input-wrap">
              <FileText size={15} className="pi-emergency-icon" />
              <input
                type="text" name="emergencyNotes"
                value={form.emergencyNotes} onChange={handle}
                className="pi-emergency-input"
                placeholder={ct('emergNotesPl')}
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── MAIN FORM GRID ─────────────────────── */}
      <div className="pi-main-grid">

        {/* ── PERSONAL DETAILS CARD ──────────────── */}
        <div className="pi-card pi-card--personal">
          <div className="pi-card-header">
            <div className="pi-card-icon-wrap pi-card-icon-wrap--blue">
              <User size={20} />
            </div>
            <div>
              <h2 className="pi-card-title">{ct('personalTitle')}</h2>
              <p className="pi-card-subtitle">{ct('personalSub')}</p>
            </div>
          </div>

          <InputField label={ct('fullName')} icon={<User size={15} />}>
            <input
              type="text" name="fullName" value={form.fullName} onChange={handle}
              className="pi-input" placeholder={ct('fullNamePl')}
            />
          </InputField>

          <div className="pi-row">
            <InputField label={ct('age')} icon={<Calendar size={15} />}>
              <input
                type="number" name="age" value={form.age} onChange={handle}
                className="pi-input" placeholder={ct('agePl')} min="0" max="130"
              />
            </InputField>
            <InputField label={ct('sex')} icon={<Activity size={15} />}>
              <select name="sex" value={form.sex} onChange={handle} className="pi-select">
                <option value="">{ct('sexPl')}</option>
                <option value="Male">{ct('sexMale')}</option>
                <option value="Female">{ct('sexFemale')}</option>
                <option value="Other">{ct('sexOther')}</option>
                <option value="Prefer not to say">{ct('sexPreferNot')}</option>
              </select>
            </InputField>
          </div>

          <InputField label={ct('dob')} icon={<Calendar size={15} />}>
            <input
              type="date" name="dob" value={form.dob} onChange={handle}
              className="pi-input"
            />
          </InputField>

          <InputField label={ct('username')} icon={<Mail size={15} />}>
            <input
              type="text" name="username" value={form.username}
              readOnly className="pi-input"
            />
          </InputField>

          <InputField label={ct('phone')} icon={<Phone size={15} />}>
            <input
              type="tel" name="phone" value={form.phone} onChange={handle}
              className="pi-input" placeholder="+1 (555) 000-0000"
            />
          </InputField>

          <div className="pi-row">
            <InputField label={ct('height')} icon={<Ruler size={15} />}>
              <input
                type="text" name="height" value={form.height} onChange={handle}
                className="pi-input" placeholder={ct('heightPl')}
              />
            </InputField>
            <InputField label={ct('weight')} icon={<Weight size={15} />}>
              <input
                type="text" name="weight" value={form.weight} onChange={handle}
                className="pi-input" placeholder={ct('weightPl')}
              />
            </InputField>
          </div>

          <InputField label={ct('famBlood')} icon={<Droplet size={15} />}>
            <input
              type="text" name="familyBloodGroup" value={form.familyBloodGroup || ''} onChange={handle}
              className="pi-input" placeholder={ct('famBloodPl')}
            />
          </InputField>

        </div>

        {/* ── MEDICAL HISTORY CARD ───────────────── */}
        <div className="pi-card pi-card--medical">
          <div className="pi-card-header">
            <div className="pi-card-icon-wrap pi-card-icon-wrap--red">
              <Heart size={20} />
            </div>
            <div>
              <h2 className="pi-card-title">{ct('medicalTitle')}</h2>
              <p className="pi-card-subtitle">{ct('medicalSub')}</p>
            </div>
          </div>

          <InputField label={ct('allergies')} icon={<AlertTriangle size={15} />} textarea>
            <textarea
              name="allergies" value={form.allergies} onChange={handle}
              className="pi-textarea"
              placeholder={ct('allergiesPl')}
            />
          </InputField>

          <InputField label={ct('meds')} icon={<Pill size={15} />} textarea>
            <textarea
              name="currentMedications" value={form.currentMedications} onChange={handle}
              className="pi-textarea"
              placeholder={ct('medsPl')}
            />
          </InputField>

          <InputField label={ct('pastHistory')} icon={<FileText size={15} />} textarea>
            <textarea
              name="pastMedicalHistory" value={form.pastMedicalHistory} onChange={handle}
              className="pi-textarea"
              placeholder={ct('pastHistoryPl')}
            />
          </InputField>

          <InputField label={ct('immunization')} icon={<ShieldCheck size={15} />}>
            <input
              type="text" name="immunizationStatus" value={form.immunizationStatus} onChange={handle}
              className="pi-input"
              placeholder={ct('immunizationPl')}
            />
          </InputField>

          <InputField label={ct('lastCheckup')} icon={<Calendar size={15} />}>
            <input
              type="date" name="lastCheckupDate" value={form.lastCheckupDate} onChange={handle}
              className="pi-input"
            />
          </InputField>

        </div>
      </div>

      <SectionAbout
        title={ct('title')}
        icon="👤"
        color="#3b82f6"
        gradient="linear-gradient(135deg, #60a5fa, #3b82f6)"
        what={ct('aboutWhat')}
        howToUse={ct('aboutHow')}
        importance={ct('aboutWhy')}
        style={{ position: 'absolute', bottom: '2rem', right: '2rem', top: 'auto' }}
      />
    </div>
  );
}
