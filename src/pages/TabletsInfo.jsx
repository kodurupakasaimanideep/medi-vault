import { useState, useEffect } from 'react';
import { Pill, Trash2, Edit3, Plus, Search, ChevronLeft, X, Save, Activity, Droplet, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SectionAbout from '../components/SectionAbout';
import { useLanguage } from '../contexts/LanguageContext';
import './TabletsInfo.css';

const DEFAULT_TABLETS = [
  { id: '1', name: 'Paracetamol', disease: 'Headache / Fever', dosage: '500mg', important: false },
  { id: '2', name: 'Ibuprofen', disease: 'Muscle Pain', dosage: '400mg', important: true },
  { id: '3', name: 'Amoxicillin', disease: 'Bacterial Infection', dosage: '250mg', important: false },
  { id: '4', name: 'Loratadine', disease: 'Allergies', dosage: '10mg', important: false }
];

const PASTEL_COLORS = [
  { bg: '#f0fdf4', border: '#bbf7d0', color: '#166534', iconBg: '#dcfce7', iconColor: '#15803d', leftBorder: 'linear-gradient(to bottom, #22c55e, #10b981)' }, // Mint Green
  { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af', iconBg: '#dbeafe', iconColor: '#1d4ed8', leftBorder: 'linear-gradient(to bottom, #3b82f6, #1d4ed8)' }, // Cool Blue
  { bg: '#faf5ff', border: '#e9d5ff', color: '#6b21a8', iconBg: '#f3e8ff', iconColor: '#7e22ce', leftBorder: 'linear-gradient(to bottom, #a855f7, #7e22ce)' }, // Soft Lavender
  { bg: '#fff7ed', border: '#fed7aa', color: '#9a3412', iconBg: '#ffedd5', iconColor: '#c2410c', leftBorder: 'linear-gradient(to bottom, #f97316, #ea580c)' }, // Warm Orange/Peach
  { bg: '#fff1f2', border: '#fecdd3', color: '#9f1239', iconBg: '#ffe4e6', iconColor: '#be123c', leftBorder: 'linear-gradient(to bottom, #f43f5e, #be123c)' }, // Light Rose/Pink
  { bg: '#f0fdfa', border: '#99f6e4', color: '#115e59', iconBg: '#ccfbf1', iconColor: '#0f766e', leftBorder: 'linear-gradient(to bottom, #14b8a6, #0f766e)' }, // Soft Teal
  { bg: '#fdf4ff', border: '#f5d0fe', color: '#86198f', iconBg: '#fae8ff', iconColor: '#a21caf', leftBorder: 'linear-gradient(to bottom, #d946ef, #a21caf)' }, // Fuchsia
  { bg: '#fffbeb', border: '#fef3c7', color: '#92400e', iconBg: '#fef3c7', iconColor: '#b45309', leftBorder: 'linear-gradient(to bottom, #eab308, #ca8a04)' }  // Sweet Amber/Yellow
];

const getTabletStyle = (tabletName, id) => {
  const identifier = tabletName || id || '';
  let sum = 0;
  for (let i = 0; i < identifier.length; i++) {
    sum += identifier.charCodeAt(i);
  }
  return PASTEL_COLORS[sum % PASTEL_COLORS.length];
};

export default function TabletsInfo({ user }) {
  const navigate = useNavigate();
  const [tablets, setTablets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    disease: '',
    dosage: '',
    important: false
  });

  const { lang } = useLanguage();

  const localT = {
    en: {
      dashboard: "Dashboard",
      title: "Tablet Info & Meds",
      searchPl: "Search diseases or pills...",
      addTablet: "Add Tablet",
      allTabs: "All Tablets",
      importantTabs: "Important Tablets",
      dosageLabel: "Req. Dosage:",
      noRecords: "No Records Found",
      noRecordsDesc: "There are no tablet records found for this patient or search term.",
      addNewMedicine: "Add New Medicine",
      confirmDelete: "Are you sure you want to remove this medication log?",
      
      // Modal
      logNew: "Log New Tablet",
      updateMed: "Update Medicine",
      nameLabel: "Tablet Name *",
      namePl: "e.g. Paracetamol",
      diseaseLabel: "Related Disease / Problem *",
      diseasePl: "e.g. Headache / Fever",
      dosageModalLabel: "Related Dosage *",
      dosageModalPl: "e.g. 500mg, 1 Pill",
      markImportant: "Mark as Important",
      cancel: "Cancel",
      updateInfo: "Update Info",
      saveInfo: "Save Info",

      // SectionAbout
      aboutWhat: "Tablets Info & Meds is your personal medicine registry — a complete log of every tablet, capsule, syrup, or supplement you take or have been prescribed. It records the medicine name, related disease/condition, dosage, and lets you mark critical medicines as important for priority tracking.",
      aboutHow: [
        'Click "Add Tablet" button at the top-right to open the medicine entry form.',
        'Enter the tablet/medicine name exactly as prescribed (e.g., Paracetamol 500mg).',
        'Fill in the related disease or condition it is prescribed for (e.g., Fever, Blood Pressure).',
        'Enter the required dosage (e.g., 500mg, 1 Tablet, 5ml syrup).',
        'Check the "Mark as Important" checkbox for critical or daily life-saving medicines.',
        'Click "Save Info" to store the medicine record permanently.',
        'Use the edit icon on any card to update medicine name, dosage or condition.',
        'Use the delete icon to remove discontinued or outdated medicines.',
        'Switch to the "Important Tablets" tab to view only starred priority medicines.',
        'Use the search bar to quickly find any medicine by name or disease.',
        'All data is saved locally and persists across app restarts automatically.',
      ],
      aboutWhy: [
        'Maintains a complete, accurate record of all your current and past medications.',
        'Prevents dangerous drug interactions by giving doctors full visibility of all medicines.',
        'Helps caregivers and family members know exactly what medicines you take daily.',
        'Critical for patients managing multiple conditions with multiple daily medications.',
        'Avoids accidental double-dosing when multiple doctors prescribe similar medicines.',
        'The Important flag helps you identify which medicines must never be missed.',
        'Useful during hospital admissions — doctors need a full medication list immediately.',
        'Supports allergy tracking — if a medicine causes reactions, it is documented here.',
        'Helps pharmacists cross-check prescriptions against your existing medicine list.',
        'Provides a searchable history of all medicines ever taken for trend tracking.',
        'Enables better medication compliance and awareness of your own treatment plan.',
      ]
    },
    te: {
      dashboard: "డాష్‌బోర్డ్",
      title: "మాత్రల సమాచారం",
      searchPl: "మందులు లేదా వ్యాధులను వెతకండి...",
      addTablet: "మాత్ర జోడించు",
      allTabs: "అన్ని మాత్రలు",
      importantTabs: "ముఖ్యమైన మాత్రలు",
      dosageLabel: "మోతాదు:",
      noRecords: "రికార్డులు కనుగొనబడలేదు",
      noRecordsDesc: "ఈ రోగికి లేదా శోధనకు సంబంధించిన ఎటువంటి మాత్ర రికార్డులు కనుగొనబడలేదు.",
      addNewMedicine: "కొత్త మందును జోడించు",
      confirmDelete: "మీరు ఖచ్చితంగా ఈ మందుల రికార్డును తొలగించాలనుకుంటున్నారా?",

      // Modal
      logNew: "కొత్త మాత్ర నమోదు",
      updateMed: "మందు వివరాలు నవీకరించు",
      nameLabel: "మాత్ర పేరు *",
      namePl: "ఉదా. పారాసిటమాల్",
      diseaseLabel: "వ్యాధి / సమస్య *",
      diseasePl: "ఉదా. తలనొప్పి / జ్వరం",
      dosageModalLabel: "మోతాదు *",
      dosageModalPl: "ఉదా. 500mg, 1 మాత్ర",
      markImportant: "ముఖ్యమైనదిగా గుర్తించు",
      cancel: "రద్దు చేయి",
      updateInfo: "వివరాలు నవీకరించు",
      saveInfo: "వివరాలు సేవ్ చేయి",

      // SectionAbout
      aboutWhat: "మాత్రల సమాచారం అనేది మీ వ్యక్తిగత మందుల రిజిస్ట్రీ — మీరు తీసుకునే లేదా మీకు ప్రిస్క్రైబ్ చేసిన ప్రతి మాత్ర, సిరప్ లేదా సప్లిమెంట్ యొక్క పూర్తి రికార్డు.",
      aboutHow: [
        'మందుల ఎంట్రీ ఫారమ్‌ను తెరవడానికి కుడి ఎగువన ఉన్న \"మాత్ర జోడించు\" బటన్‌ను క్లిక్ చేయండి.',
        'ప్రిస్క్రైబ్ చేసిన విధంగా మాత్ర/మందు పేరును నమోదు చేయండి (ఉదా., పారాసిటమాల్ 500mg).',
        'మందు ఏ సమస్య కోసం వాడుతున్నారో రాయండి (ఉదా., జ్వరం, రక్తపోటు).',
        'అవసరమైన మోతాదును నమోదు చేయండి (ఉదా., 500mg, 1 టాబ్లెట్, 5ml సిరప్).',
        'రోజూ తప్పనిసరిగా వాడాల్సిన లేదా ప్రాణరక్షక మందుల కోసం \"ముఖ్యమైనదిగా గుర్తించు\" బాక్సును టిక్ చేయండి.',
        'మందు రికార్డును శాశ్వతంగా భద్రపరచడానికి \"వివరాలు సేవ్ చేయి\" క్లిక్ చేయండి.',
        'మందు పేరు, మోతాదు లేదా పరిస్థితిని నవీకరించడానికి ఎడిట్ చిహ్నాన్ని ఉపయోగించండి.',
        'వాడటం ఆపేసిన లేదా పాతబడిపోయిన మందులను తొలగించడానికి డిలీట్ చిహ్నాన్ని ఉపయోగించండి.',
        'ముఖ్యమైన మందులను మాత్రమే చూడటానికి \"ముఖ్యమైన మాత్రలు\" ట్యాబ్‌కు మారండి.',
        'మందు పేరు లేదా వ్యాధి ద్వారా త్వరగా కనుగొనడానికి శోధన పట్టీని ఉపయోగించండి.',
        'డేటా అంతా లోకల్‌గా భద్రపరచబడుతుంది మరియు ఆటోమేటిక్‌గా సేవ్ అవుతుంది.',
      ],
      aboutWhy: [
        'మీరు ప్రస్తుతం మరియు గతంలో వాడిన అన్ని మందుల యొక్క ఖచ్చితమైన రికార్డును నిర్వహిస్తుంది.',
        'వైద్యులకు అన్ని మందుల వివరాలను చూపడం ద్వారా ప్రమాదకరమైన ఔషధ దుష్ప్రభావాలను నివారిస్తుంది.',
        'కుటుంబ సభ్యులకు లేదా సంరక్షకులకు మీరు రోజువారీగా వాడే మందుల వివరాలు తెలియజేస్తుంది.',
        'ఎక్కువ రకాల మందులు వాడుతున్న దీర్ఘకాలిక రోగులకు అత్యంత ఉపయోగకరం.',
        'వివిధ వైద్యులు ఒకే రకమైన మందులు రాసినప్పుడు ప్రమాదవశాత్తు రెండుసార్లు వేసుకోవడాన్ని నివారిస్తుంది.',
        'ముఖ్యమైన ఫ్లాగ్ మీరు ఏ మందును ఎప్పటికీ మిస్ కాకూడదో గుర్తుచేస్తుంది.',
        'ఆసుపత్రిలో చేరినప్పుడు వైద్యులకు తక్షణ సమాచారం ఇవ్వడానికి తోడ్పడుతుంది.',
        'ఔషధ అలర్జీలను సులభంగా ట్రాక్ చేయడానికి సహాయపడుతుంది.',
        'డేటా సురక్షితంగా మీ ఫోన్/డివైస్ లోనే ఉంటుంది.',
      ]
    },
    hi: {
      dashboard: "डैशबोर्ड",
      title: "टेबलेट जानकारी",
      searchPl: "मछलियां या दवाएं खोजें...",
      addTablet: "मात्रा जोड़ें",
      allTabs: "सभी टेबलेट",
      importantTabs: "महत्वपूर्ण टेबलेट",
      dosageLabel: "खुराक:",
      noRecords: "कोई रिकॉर्ड नहीं मिला",
      noRecordsDesc: "इस मरीज या खोज शब्द के लिए कोई टेबलेट रिकॉर्ड नहीं मिला।",
      addNewMedicine: "नई दवा जोड़ें",
      confirmDelete: "क्या आप वाकई इस दवा के रिकॉर्ड को हटाना चाहते हैं?",

      // Modal
      logNew: "नई टेबलेट लॉग करें",
      updateMed: "दवा अपडेट करें",
      nameLabel: "टेबलेट का नाम *",
      namePl: "जैसे. पैरासिटामोल",
      diseaseLabel: "संबंधित बीमारी / समस्या *",
      diseasePl: "जैसे. सिरदर्द / बुखार",
      dosageModalLabel: "खुराक *",
      dosageModalPl: "जैसे. 500mg, 1 गोली",
      markImportant: "महत्वपूर्ण के रूप में चिह्नित करें",
      cancel: "रद्द करें",
      updateInfo: "जानकारी अपडेट करें",
      saveInfo: "जानकारी सहेजें",

      // SectionAbout
      aboutWhat: "टेबलेट जानकारी और दवाएं आपकी व्यक्तिगत दवा रजिस्ट्री है — आपके द्वारा ली जाने वाली या निर्धारित की गई प्रत्येक टेबलेट, कैप्सूल, सिरप या सप्लीमेंट का एक संपूर्ण लॉग।",
      aboutHow: [
        'दवा प्रविष्टि फॉर्म खोलने के लिए ऊपर दाईं ओर \"मात्रा जोड़ें\" बटन पर क्लिक करें।',
        'निर्धारित की गई टेबलेट/दवा का नाम ठीक वैसे ही दर्ज करें (जैसे, पैरासिटामोल 500mg)।',
        'वह संबंधित बीमारी या समस्या भरें जिसके लिए इसे निर्धारित किया गया है (जैसे, बुखार, रक्तचाप)।',
        'आवश्यक खुराक दर्ज करें (जैसे, 500mg, 1 टेबलेट, 5ml सिरप)।',
        'महत्वपूर्ण या दैनिक जीवन रक्षक दवाओं के लिए \"महत्वपूर्ण के रूप में चिह्नित करें\" बॉक्स को टिक करें।',
        'दवा रिकॉर्ड को स्थायी रूप से सहेजने के लिए \"जानकारी सहेजें\" पर क्लिक करें।',
        'दवा का नाम, खुराक या स्थिति अपडेट करने के लिए संपादन (एडिट) आइकन का उपयोग करें।',
        'बंद या पुरानी दवाओं को हटाने के लिए हटाना (डिलीट) आइकन का उपयोग करें।',
        'केवल तारांकित प्राथमिकता वाली दवाओं को देखने के लिए \"महत्वपूर्ण टेबलेट\" टैब पर जाएं।',
        'नाम या बीमारी द्वारा किसी भी दवा को खोजने के लिए खोज पट्टी का उपयोग करें।',
        'सभी डेटा स्थानीय रूप से सुरक्षित रूप से संग्रहीत होता है।',
      ],
      aboutWhy: [
        'आपकी वर्तमान और पिछली सभी दवाओं का एक संपूर्ण, सटीक रिकॉर्ड रखता है।',
        'दवाओं के आपसी दुष्प्रभावों से बचाता है, जिससे सुरक्षा बढ़ती है।',
        'परिवार के सदस्यों को पता रहता है कि आप रोजाना कौन सी दवाएं लेते हैं।',
        'पुरानी बीमारियों से पीड़ित मरीजों के लिए अत्यधिक उपयोगी।',
        'गलती से एक ही दवा को दोबारा लेने से बचाता है।',
        'महत्वपूर्ण फ्लैग याद दिलाता है कि कौन सी दवा कभी नहीं छूटनी चाहिए।',
        'अस्पताल में भर्ती होने के समय त्वरित संदर्भ के रूप में बेहद उपयोगी।',
        'दवाओं की एलर्जी को ट्रैक करने में मदद करता है।',
        'डेटा आपके डिवाइस पर पूरी तरह सुरक्षित और निजी रहता है।',
      ]
    },
    eu: {
      dashboard: "Panel de Control",
      title: "Info de Medicamentos",
      searchPl: "Buscar medicamentos o síntomas...",
      addTablet: "Añadir Medicina",
      allTabs: "Todos los Medicamentos",
      importantTabs: "Medicación Crítica",
      dosageLabel: "Dosis Req:",
      noRecords: "No se Encontraron Registros",
      noRecordsDesc: "No se encontraron registros de medicamentos para este paciente o término de búsqueda.",
      addNewMedicine: "Añadir Nueva Medicina",
      confirmDelete: "¿Está seguro de que desea eliminar este registro de medicamento?",

      // Modal
      logNew: "Registrar Nueva Medicina",
      updateMed: "Actualizar Medicina",
      nameLabel: "Nombre de Medicina *",
      namePl: "ej. Paracetamol",
      diseaseLabel: "Síntoma / Enfermedad *",
      diseasePl: "ej. Dolor de Cabeza / Fiebre",
      dosageModalLabel: "Dosis Requerida *",
      dosageModalPl: "ej. 500mg, 1 Pastilla",
      markImportant: "Marcar como Crítico",
      cancel: "Cancelar",
      updateInfo: "Actualizar Datos",
      saveInfo: "Guardar Datos",

      // SectionAbout
      aboutWhat: "La sección de Info de Medicamentos es su registro de farmacia personal: un historial completo de todas las pastillas, cápsulas, jarabes o suplementos que toma o le han recetado.",
      aboutHow: [
        'Haga clic en el botón \"Añadir Medicina\" en la esquina superior derecha para abrir el formulario.',
        'Ingrese el nombre del medicamento exactamente como se lo recetaron (ej., Paracetamol 500mg).',
        'Indique la enfermedad o síntoma relacionado (ej., Fiebre, Presión Arterial).',
        'Escriba la dosis requerida (ej., 500mg, 1 pastilla, 5ml de jarabe).',
        'Marque la casilla \"Marcar como Crítico\" para medicamentos indispensables de uso diario.',
        'Haga clic en \"Guardar Datos\" para almacenar el registro permanentemente.',
        'Use el icono de edición para actualizar el nombre de la medicina, dosis o síntomas.',
        'Use el icono de la papelera para eliminar medicaciones suspendidas.',
        'Cambie a la pestaña \"Medicación Crítica\" para ver solo las prioridades.',
        'Utilice la barra de búsqueda para encontrar cualquier medicina por nombre o síntoma.',
        'Toda la información se almacena localmente y persiste de manera segura en su dispositivo.',
      ],
      aboutWhy: [
        'Mantiene un historial completo y exacto de todas sus medicaciones actuales y pasadas.',
        'Previene interacciones medicamentosas peligrosas al proporcionar visibilidad total a sus médicos.',
        'Permite a los cuidadores saber con precisión qué medicinas toma diariamente.',
        'Vital para pacientes que gestionan múltiples tratamientos de forma simultánea.',
        'Evita duplicar tomas de forma accidental.',
        'La etiqueta de Crítico le ayuda a recordar qué medicinas son de importancia vital.',
        'Útil al ingresar a urgencias hospitalarias para informar de forma instantánea de su tratamiento.',
        'Permite registrar alergias y reacciones a medicamentos específicos.',
        'El control local garantiza la máxima privacidad de su tratamiento de salud.',
      ]
    }
  };

  const ct = (key) => localT[lang]?.[key] || localT['en']?.[key];

  const storageKey = `medivault_tablets_${user?.id || 'default'}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setTablets(JSON.parse(saved));
    } else {
      setTablets(DEFAULT_TABLETS);
      localStorage.setItem(storageKey, JSON.stringify(DEFAULT_TABLETS));
    }
  }, [storageKey]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.disease || !formData.dosage) return;

    let updatedList;
    if (isEditing) {
      updatedList = tablets.map(t => t.id === currentId ? { ...formData, id: currentId } : t);
    } else {
      updatedList = [...tablets, { ...formData, id: Date.now().toString() }];
    }
    
    setTablets(updatedList);
    localStorage.setItem(storageKey, JSON.stringify(updatedList));
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm(ct('confirmDelete'))) {
      const updatedList = tablets.filter(t => t.id !== id);
      setTablets(updatedList);
      localStorage.setItem(storageKey, JSON.stringify(updatedList));
    }
  };

  const openAdd = () => {
    setFormData({ name: '', disease: '', dosage: '', important: false });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEdit = (tab) => {
    setFormData({ name: tab.name, disease: tab.disease, dosage: tab.dosage, important: tab.important || false });
    setCurrentId(tab.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const filteredTablets = tablets.filter(t => 
    (activeTab === 'all' || (activeTab === 'important' && t.important)) &&
    (t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.disease.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="ti-container animate-fade-in">
      
      {/* ── Flatter & Responsive Header Card ── */}
      <div className="ti-header-card">
        <div className="ti-header-left">
          <button 
            type="button"
            className="ti-back-btn"
            onClick={() => navigate('/dashboard')}
          >
            <ChevronLeft size={16} /> {ct('dashboard')}
          </button>
          
          <div className="ti-header-divider" />
          
          <div className="ti-title-group">
            <div className="ti-title-icon">
              <Pill size={20} />
            </div>
            <h1 className="ti-title-text">
              {ct('title')}
            </h1>
          </div>
        </div>
        
        <div className="ti-header-controls">
          <div className="ti-search-wrap">
            <Search size={18} className="ti-search-icon" />
            <input 
              type="text" 
              className="ti-search-input"
              placeholder={ct('searchPl')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            type="button"
            className="ti-add-btn"
            onClick={openAdd}
          >
            <Plus size={18} /> {ct('addTablet')}
          </button>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="ti-tabs">
        <button 
          type="button"
          onClick={() => setActiveTab('all')}
          className={`ti-tab-btn ti-tab-btn--all ${activeTab === 'all' ? 'active' : ''}`}
        >
          {ct('allTabs')}
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('important')}
          className={`ti-tab-btn ti-tab-btn--important ${activeTab === 'important' ? 'active' : ''}`}
        >
          <Star size={15} fill={activeTab === 'important' ? "currentColor" : "none"} /> {ct('importantTabs')}
        </button>
      </div>

      {/* ── Flatter Tablets Grid ── */}
      <div className="ti-grid">
        {filteredTablets.map(tab => {
          const cardStyle = getTabletStyle(tab.name, tab.id);
          return (
            <div 
              key={tab.id} 
              className="ti-card animate-fade-in" 
              style={{
                background: cardStyle.bg,
                borderColor: cardStyle.border,
              }}
            >
              {/* Colorful Left Accent Line */}
              <div className="ti-card-left-bar" style={{ background: cardStyle.leftBorder }} />
              
              <div className="ti-card-top">
                <div className="ti-card-icon-wrap" style={{ background: cardStyle.iconBg, color: cardStyle.iconColor }}>
                  <Pill size={22} />
                </div>
                <div className="ti-card-actions">
                  <button 
                    type="button"
                    onClick={() => openEdit(tab)} 
                    className="ti-action-btn ti-action-btn--edit"
                    title="Edit Tablet"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleDelete(tab.id)} 
                    className="ti-action-btn ti-action-btn--del"
                    title="Delete Tablet"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="ti-card-body">
                <div className="ti-card-title-row">
                  <h3 className="ti-card-title" style={{ color: cardStyle.color }}>{tab.name}</h3>
                  {tab.important && <Star size={18} color="#f59e0b" fill="#f59e0b" />}
                </div>
                
                <div 
                  className="ti-card-disease-pill"
                  style={{ background: cardStyle.iconBg, color: cardStyle.color, borderColor: cardStyle.border }}
                >
                  <Activity size={13} /> {tab.disease}
                </div>
                
                <div className="ti-card-dosage-row">
                  <span className="ti-dosage-lbl">
                    <Droplet size={13} color={cardStyle.iconColor} /> {ct('dosageLabel')}
                  </span>
                  <span className="ti-dosage-val" style={{ color: cardStyle.iconColor }}>
                    {tab.dosage}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        
        {filteredTablets.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3.5rem 1.5rem', background: 'var(--surface)', borderRadius: '1rem', border: '1px dashed var(--border)' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--bg-subtle)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <Pill size={32} style={{ color: '#0ea5e9' }} />
            </div>
            <h3 style={{ color: 'var(--text-main)', fontSize: '1.25rem', marginBottom: '0.35rem', fontWeight: 'bold' }}>{ct('noRecords')}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '380px', margin: '0 auto 1.5rem auto' }}>{ct('noRecordsDesc')}</p>
            <button 
              type="button"
              onClick={openAdd}
              className="ti-add-btn"
              style={{ margin: '0 auto' }}
            >
              {ct('addNewMedicine')}
            </button>
          </div>
        )}
      </div>

      {/* ── Flatter Modal Dialog ── */}
      {isModalOpen && (
        <div className="ti-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="ti-modal-content" onClick={e => e.stopPropagation()}>
            <div className="ti-modal-header">
              <h2 className="ti-modal-title">
                {isEditing ? ct('updateMed') : ct('logNew')}
              </h2>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="ti-modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="ti-modal-body">
                <div className="ti-form-group">
                  <label className="ti-form-label">{ct('nameLabel')}</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder={ct('namePl')}
                    className="ti-form-input"
                  />
                </div>

                <div className="ti-form-group">
                  <label className="ti-form-label">{ct('diseaseLabel')}</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.disease} 
                    onChange={(e) => setFormData({...formData, disease: e.target.value})}
                    placeholder={ct('diseasePl')}
                    className="ti-form-input"
                  />
                </div>

                <div className="ti-form-group">
                  <label className="ti-form-label">{ct('dosageModalLabel')}</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.dosage} 
                    onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                    placeholder={ct('dosageModalPl')}
                    className="ti-form-input"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.25rem' }}>
                  <input 
                    type="checkbox" 
                    id="importantCb"
                    checked={formData.important} 
                    onChange={(e) => setFormData({...formData, important: e.target.checked})}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#f59e0b' }}
                  />
                  <label htmlFor="importantCb" style={{ color: 'var(--text-main)', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
                    <Star size={16} color="#f59e0b" fill={formData.important ? "#f59e0b" : "none"} /> {ct('markImportant')}
                  </label>
                </div>
              </div>

              <div className="ti-modal-footer">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="ti-btn-cancel"
                >
                  {ct('cancel')}
                </button>
                <button 
                  type="submit" 
                  className="ti-btn-save"
                >
                  <Save size={16} style={{ display: 'inline', marginRight: '4px' }} />
                  {isEditing ? ct('updateInfo') : ct('saveInfo')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SectionAbout
        title={ct('title')}
        icon="💊"
        color="#0ea5e9"
        gradient="linear-gradient(135deg, #0ea5e9, #4f46e5)"
        what={ct('aboutWhat')}
        howToUse={ct('aboutHow')}
        importance={ct('aboutWhy')}
      />
    </div>
  );
}
