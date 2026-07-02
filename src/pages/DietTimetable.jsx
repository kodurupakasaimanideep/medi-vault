import { useState, useEffect } from 'react';
import { Clock, User, Utensils, Edit3, Trash2, Plus, Save, Coffee, Sun, Moon, Apple } from 'lucide-react';
import SectionAbout from '../components/SectionAbout';
import { useLanguage } from '../contexts/LanguageContext';

const STORAGE_KEY = 'medivault_diet_timetable';

export default function DietTimetable({ user }) {
  const { lang } = useLanguage();

  const localT = {
    en: {
      title: "Diet",
      titleSpan: "Timetable",
      subtitle: "Manage delicious & healthy daily meal schedules.",
      patient: "Patient",
      time: "Time",
      item: "Food Item",
      actions: "Actions",
      breakfast: "Breakfast",
      lunch: "Lunch",
      snacks: "Snacks",
      dinner: "Dinner",
      addSlot: "Add New Schedule Slot",
      updateSlot: "Update Schedule Slot",
      mealTime: "Meal Time",
      foodItems: "Food Items",
      mealCategory: "Meal Category",
      addToSchedule: "Add to Schedule",
      saveChanges: "Save Changes",
      noItems: "No items scheduled for this category.",
      confirmDelete: "Are you sure you want to delete this diet entry?",
      aboutWhat: "The Diet Timetable section is a premium, interactive daily nutritional scheduler designed to help patients organize, log, and track their meals across four categories: Breakfast, Lunch, Snacks, and Dinner. By building a consistent schedule, patients can ensure they meet their daily caloric and micronutrient needs, maintain balanced blood sugar levels, and stick to clinical diet plans advised by nutritionists.",
      aboutHow: [
        'Open the Diet Timetable section from the dashboard sidebar menu.',
        'Review the beautiful floating food icons and your current schedule overview.',
        'To add a new meal slot, find the "Add New Schedule Slot" form panel.',
        'Enter the meal time using the time selector (e.g. 08:00 AM).',
        'Describe the food items clearly in the text input (e.g. "2 Boiled Eggs, Whole Wheat Toast").',
        'Select the appropriate Meal Category (Breakfast, Lunch, Snacks, or Dinner) from the dropdown list.',
        'Click the "Add to Schedule" button to insert your new entry into the respective category list.',
        'To edit an existing meal, click the blue pencil button in that meal\'s table row to load the form.',
        'Make adjustments to the time, food item, or category, and click the blue "Save Changes" button.',
        'To delete a scheduled meal, click the red trash bin button next to it and confirm the action.',
        'Check that all meal lists are ordered automatically by time of consumption for clean scheduling.',
        'Consult your doctor or dietitian to align this timetable with your personal health targets.',
      ],
      aboutWhy: [
        'Fosters consistent eating schedules, which supports stable digestive health and robust metabolism.',
        'Helps patients remember to take food alongside medications, preventing gastric discomfort.',
        'Categorizing meals (Breakfast, Lunch, Snacks, Dinner) ensures complete nutritional coverage across the day.',
        'Facilitates calorie and portion control by listing exactly what needs to be eaten at specific times.',
        'Supports blood glucose management for diabetic patients through regular, planned food intake.',
        'Reduces decision fatigue and grocery wastage by defining daily menus ahead of time.',
        'Includes emergency and system usernames in records to allow dietitians to inspect logged patterns.',
        'Visual time indicators make it easy for caretakers to monitor if patient meals are served on schedule.',
        'Locally saved schedule data guarantees patient privacy while keeping meal logs persistent across sessions.',
        'Cultivates long-term healthy habits that prevent impulse eating of processed foods.',
      ]
    },
    te: {
      title: "ఆహార",
      titleSpan: "సమయపట్టిక",
      subtitle: "రుచికరమైన మరియు ఆరోగ్యకరమైన రోజువారీ భోజన షెడ్యూల్‌లను నిర్వహించండి.",
      patient: "రోగి",
      time: "సమయం",
      item: "ఆహార పదార్థం",
      actions: "చర్యలు",
      breakfast: "అల్పాహారం",
      lunch: "మధ్యాహ్న భోజనం",
      snacks: "స్నాక్స్",
      dinner: "రాత్రి భోజనం",
      addSlot: "కొత్త షెడ్యూల్ స్లాట్‌ను జోడించండి",
      updateSlot: "షెడ్యూల్ స్లాట్‌ను నవీకరించండి",
      mealTime: "భోజన సమయం",
      foodItems: "ఆహార పదార్థాలు",
      mealCategory: "భోజన వర్గం",
      addToSchedule: "షెడ్యూల్‌కు జోడించు",
      saveChanges: "మార్పులను సేవ్ చేయి",
      noItems: "ఈ వర్గం కోసం ఎటువంటి ఆహారాలు షెడ్యూల్ చేయబడలేదు.",
      confirmDelete: "మీరు ఈ ఆహార వివరాలను తొలగించాలనుకుంటున్నారా?",
      aboutWhat: "ఆహార సమయపట్టిక విభాగం అనేది మీ రోజువారీ ఆహారాన్ని నిర్వహించడానికి ఉపయోగపడే ఒక ప్రీమియం షెడ్యూలర్. ఇది అల్పాహారం, మధ్యాహ్న భోజనం, స్నాక్స్ మరియు రాత్రి భోజనాన్ని ట్రాక్ చేయడానికి సహాయపడుతుంది.",
      aboutHow: [
        'డాష్‌బోర్డ్ సైడ్‌బార్ మెనూ నుండి ఆహార సమయపట్టిక విభాగాన్ని తెరవండి.',
        'అందమైన తేలియాడే ఆహార చిహ్నాలు మరియు ప్రస్తుత షెడ్యూల్ అవలోకనాన్ని చూడండి.',
        'కొత్త భోజన స్లాట్‌ను జోడించడానికి, "కొత్త షెడ్యూల్ స్లాట్‌ను జోడించండి" ఫారమ్‌ను కనుగొనండి.',
        'సమయం సెలెక్టర్ ఉపయోగించి భోజన సమయాన్ని నమోదు చేయండి (ఉదా. 08:00 AM).',
        'ఆహార పదార్థాలను స్పష్టంగా వివరించండి (ఉదా. "2 ఉడికించిన గుడ్లు, గోధుమ రొట్టె").',
        'డ్రాప్‌డౌన్ నుండి సరైన భోజన వర్గాన్ని ఎంచుకోండి.',
        'మీ కొత్త నమోదును షెడ్యూల్‌కు జోడించడానికి బటన్‌ను క్利క్ చేయండి.',
        'ఉన్న భోజనాన్ని సవరించడానికి, నీలిరంగు పెన్సిల్ బటన్‌ను క్లిక్ చేయండి.',
        'మార్పులు చేసి, "మార్పులను సేవ్ చేయి" బటన్‌ను క్లిక్ చేయండి.',
        'భోజనాన్ని తొలగించడానికి, ఎరుపు రంగు ట్రాష్ బటన్‌ను క్లిక్ చేయండి.',
        'భోజన సమయాలు స్వయంచాలకంగా సమయాన్ని బట్టి అమర్చబడతాయని గమనించండి.',
        'మీ వ్యక్తిగత ఆరోగ్య లక్ష్యాలకు అనుగుణంగా దీనిని మీ వైద్యుడితో సరిపోల్చుకోండి.',
      ],
      aboutWhy: [
        'క్రమబద్ధమైన భోజన షెడ్యూల్స్ జీర్ణక్రియను మెరుగుపరిచి జీవక్రియను పెంచుతాయి.',
        'మందులతో పాటు ఆహారాన్ని తీసుకోవడం గుర్తుంచుకోవడానికి సహాయపడుతుంది.',
        'నాలుగు వర్గాల భోజనం రోజంతా సంపూర్ణ పోషకాహారాన్ని అందిస్తుంది.',
        'నిర్దిష్ట సమయాల్లో తినడం వల్ల క్యాలరీ నియంత్రణ సులువవుతుంది.',
        'డयाబెటిస్ ఉన్న రోగులలో రక్తంలో చక్కెర స్థాయిలను నియంత్రించడంలో సహాయపడుతుంది.',
        'ముందుగానే ఆహారాన్ని ప్లాन చేయడం వల్ల సమయం ఆదా అవుతుంది.',
        'స్థానికంగా సేవ్ చేయబడిన డేటా మీ సమాచార భద్రతను నిర్ధారిస్తుంది.',
        'కేర్‌టేకర్‌లు రోగికి సరైన సమయానికి ఆహారం అందుతోందో లేదो సులభంగా పర్యవేక్షించవచ్చు.',
        'ఆకస్మిక జంక్ ఫుడ్ తినే అలవాటును తగ్గిస్తుంది.',
        'జీవితకాలం ఆరోగ్యకరమైన అలవాట్లను పెంపొందిస్తుంది.',
      ]
    },
    hi: {
      title: "आहार",
      titleSpan: "समय सारणी",
      subtitle: "स्वादिष्ट और स्वस्थ दैनिक भोजन कार्यक्रम का प्रबंधन करें।",
      patient: "मरीज",
      time: "समय",
      item: "खाद्य सामग्री",
      actions: "कार्रवाई",
      breakfast: "नाश्ता",
      lunch: "दोपहर का भोजन",
      snacks: "स्नैक्स",
      dinner: "रात का भोजन",
      addSlot: "नया शेड्यूल स्लॉट जोड़ें",
      updateSlot: "शेड्यूल स्लॉट अपडेट करें",
      mealTime: "भोजन का समय",
      foodItems: "खाद्य वस्तुएं",
      mealCategory: "भोजन श्रेणी",
      addToSchedule: "शडेयूल में जोड़ें",
      saveChanges: "परिवर्तन सहेजें",
      noItems: "इस श्रेणी के लिए कोई भोजन निर्धारित नहीं है।",
      confirmDelete: "क्या आप वाकई इस आहार प्रविष्टि को हटाना चाहते हैं?",
      aboutWhat: "आहार समय सारणी अनुभाग एक प्रीमियम, इंटरैक्टिव दैनिक पोषण शिड्यूलर है जो रोगियों को नाश्ता, दोपहर का भोजन, स्नैक्स और रात के भोजन को व्यवस्थित करने में मदद करता है।",
      aboutHow: [
        'डैशबोर्ड साइडबार मेनू से आहार समय सारणी अनुभाग खोलें।',
        'सुंदर तैरते हुए खाद्य प्रतीकों और अपनी वर्तमान समय सारणी की समीक्षा करें।',
        'नया भोजन स्लॉट जोड़ने के लिए, "नया शेड्यूल स्लॉट जोड़ें" फॉर्म ढूंढें।',
        'समय चयनकर्ता का उपयोग करके भोजन का समय दर्ज करें (जैसे 08:00 AM)।',
        'टेक्स्ट इनपुट में खाद्य पदार्थों का स्पष्ट रूप से वर्णन करें (जैसे "2 उबले अंडे, ब्रेड")।',
        'ड्रॉपडाउन सूची से उपयुक्त भोजन श्रेणी का चयन करें।',
        'अपनी नई प्रविष्टि को शामिल करने के लिए "शेड्यूल में जोड़ें" बटन पर क्लिक करें।',
        'किसी मौजूदा भोजन को संपादित करने के लिए, नीले पेंसिल बटन पर क्लिक करें।',
        'समय, भोजन या श्रेणी में बदलाव करें और "परिवर्तन सहेजें" बटन पर क्लिक करें।',
        'भोजन को हटाने के लिए, उसके बगल में लाल कचरा पेटी बटन पर क्लिक करें।',
        'जांचें कि सभी भोजन सूचियां समय के अनुसार व्यवस्थित हैं।',
        'अपने डॉक्टर से परामर्श करें ताकि यह समय सारणी आपके स्वास्थ्य लक्ष्यों के अनुरूप हो।',
      ],
      aboutWhy: [
        'नियमित भोजन कार्यक्रम पाचन स्वास्थ्य और मजबूत चयापचय का समर्थन करता है।',
        'मरीजों को दवाओं के साथ भोजन लेना याद रखने में मदद करता है।',
        'भोजन को वर्गीकृत करने से पूरे दिन पूर्ण पोषण कवरेज सुनिश्चित होता है।',
        'नियत समय पर खाने से कैलोरी नियंत्रण में सुविधा होती है।',
        'नियमित भोजन के माध्यम से मधुमेह रोगियों के रक्त शर्करा प्रबंधन का समर्थन करता है।',
        'समय से पहले दैनिक मेनू तय करके निर्णय की थकान को कम करता है।',
        'स्थानीय रूप से सहेजा गया डेटा सुरक्षित और निजी रहता है।',
        'देखभाल करने वालों के लिए यह निगरानी करना आसान बनाता है कि मरीज को समय पर भोजन मिल रहा है।',
        'बाहर के जंक फूड खाने की इच्छा को कम करता है।',
        'दीर्घकालिक स्वस्थ आदतों का निर्माण करता है जो जीवन की गुणवत्ता को बढ़ाती हैं।',
      ]
    },
    eu: {
      title: "Horario de",
      titleSpan: "Dieta",
      subtitle: "Gestione horarios de comidas diarias deliciosas y saludables.",
      patient: "Paciente",
      time: "Hora",
      item: "Alimento",
      actions: "Acciones",
      breakfast: "Desayuno",
      lunch: "Almuerzo",
      snacks: "Merienda",
      dinner: "Cena",
      addSlot: "Añadir Nueva Comida",
      updateSlot: "Actualizar Comida",
      mealTime: "Hora de la Comida",
      foodItems: "Alimentos",
      mealCategory: "Categoría de Comida",
      addToSchedule: "Añadir al Horario",
      saveChanges: "Guardar Cambios",
      noItems: "No hay alimentos programados para esta categoría.",
      confirmDelete: "¿Está seguro de que desea eliminar esta comida?",
      aboutWhat: "La sección de Horario de Dieta es un programador nutricional diario premium e interactivo diseñado para ayudar a los pacientes a organizar y registrar sus comidas.",
      aboutHow: [
        'Abra la sección Horario de Dieta desde el menú lateral del panel.',
        'Revise los hermosos iconos flotantes de alimentos y su horario actual.',
        'Para añadir una nueva comida, busque el formulario "Añadir Nueva Comida".',
        'Ingrese la hora usando el selector de tiempo (ej. 08:00 AM).',
        'Describa los alimentos claramente (ej. "2 huevos cocidos, tostadas").',
        'Seleccione la Categoría de Comida adecuada en el menú desplegable.',
        'Haga clic en "Añadir al Horario" para insertar su nueva comida.',
        'Para editar, haga clic en el botón azul de lápiz en la fila de la comida.',
        'Realice los ajustes y haga clic en "Guardar Cambios".',
        'Para eliminar una comida, haga clic en el botón rojo de papelera.',
        'Las comidas se ordenan automáticamente por la hora de consumo.',
        'Consulte con su dietista para alinear este horario con sus objetivos.',
      ],
      aboutWhy: [
        'Fomenta horarios de comida consistentes para una mejor digestión.',
        'Ayuda a recordar tomar los alimentos junto con los medicamentos.',
        'Categorizar las comidas garantiza una cobertura nutricional completa.',
        'Facilita el control de porciones y calorías al planificar con anticipación.',
        'Apoya el control de la glucosa en sangre para pacientes diabéticos.',
        'Reduce la fatiga de decisión diaria y el desperdicio de alimentos.',
        'Los datos se guardan localmente para garantizar la privacidad.',
        'Permite a los cuidadores monitorear si el paciente come a tiempo.',
        'Cultiva hábitos alimenticios saludables a largo plazo.',
        'Evita comer alimentos procesados por impulso.',
      ]
    }
  };

  const mt = (key) => localT[lang]?.[key] || localT['en']?.[key];

  const [schedule, setSchedule] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', patientName: user?.username || 'Patient', time: '08:00', item: 'Oats & Berries', mealType: 'Breakfast' },
      { id: '2', patientName: user?.username || 'Patient', time: '13:00', item: 'Grilled Chicken Salad', mealType: 'Lunch' },
      { id: '3', patientName: user?.username || 'Patient', time: '20:00', item: 'Salmon & Veggies', mealType: 'Dinner' }
    ];
  });
  
  const [formData, setFormData] = useState({
    time: '',
    item: '',
    mealType: 'Breakfast'
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
  }, [schedule]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.time || !formData.item) return;

    if (isEditing) {
      setSchedule(prev => prev.map(s => s.id === editId ? { ...formData, id: editId } : s));
      setIsEditing(false);
      setEditId(null);
    } else {
      setSchedule(prev => [...prev, { ...formData, id: Date.now().toString() }]);
    }
    
    setFormData({ ...formData, time: '', item: '' });
  };

  const handleEdit = (slot) => {
    setFormData({ time: slot.time, item: slot.item, mealType: slot.mealType });
    setIsEditing(true);
    setEditId(slot.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    if (window.confirm(mt('confirmDelete'))) {
      setSchedule(prev => prev.filter(s => s.id !== id));
    }
  };

  const renderTable = (mealType, icon, gradient, color) => {
    const filtered = schedule.filter(s => s.mealType === mealType).sort((a, b) => a.time.localeCompare(b.time));
    const translatedMealType = 
      mealType === 'Breakfast' ? mt('breakfast') :
      mealType === 'Lunch' ? mt('lunch') :
      mealType === 'Snacks' ? mt('snacks') : mt('dinner');

    return (
      <div style={{ marginBottom: '2.5rem' }} className="animate-fade-in">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: color, fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '800' }}>
          {icon} {translatedMealType}
        </h3>
        
        {/* Colorful Gradient Border Wrapper */}
        <div style={{
          background: gradient, 
          padding: '3px',
          borderRadius: '1.2rem',
          boxShadow: `0 10px 25px ${color}22`
        }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'calc(1.2rem - 3px)', overflow: 'hidden' }}>
            {filtered.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: `${color}0d`, borderBottom: `2px solid ${color}33`, color: color }}>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: '700' }}>{mt('time')}</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: '700' }}>{mt('item')}</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: '700', textAlign: 'right' }}>{mt('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((slot, idx) => (
                    <tr key={slot.id} style={{ borderBottom: idx !== filtered.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#f8fafc'} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-color)', padding: '0.4rem 0.8rem', borderRadius: '0.5rem' }}>
                          <Clock size={16} color={color} /> {slot.time}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--text-main)', fontWeight: '600', fontSize: '1.05rem' }}>{slot.item}</td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <button onClick={() => handleEdit(slot)} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', cursor: 'pointer', color: '#3b82f6', marginRight: '0.8rem', padding: '0.5rem', borderRadius: '0.5rem', transition: 'all 0.2s' }} onMouseOver={e=>{e.currentTarget.style.background='#3b82f6'; e.currentTarget.style.color='#fff'}} onMouseOut={e=>{e.currentTarget.style.background='#eff6ff'; e.currentTarget.style.color='#3b82f6'}} title="Edit">
                          <Edit3 size={18}/>
                        </button>
                        <button onClick={() => handleDelete(slot.id)} style={{ background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer', color: '#ef4444', padding: '0.5rem', borderRadius: '0.5rem', transition: 'all 0.2s' }} onMouseOver={e=>{e.currentTarget.style.background='#ef4444'; e.currentTarget.style.color='#fff'}} onMouseOut={e=>{e.currentTarget.style.background='#fef2f2'; e.currentTarget.style.color='#ef4444'}} title="Delete">
                          <Trash2 size={18}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#cbd5e1' }}>
                <div style={{ background: '#f8fafc', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                   {icon}
                </div>
                <p style={{ fontWeight: '600', color: '#94a3b8' }}>{mt('noItems')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="inner-page animate-fade-in" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif", position: 'relative' }}>

      {/* Dynamic Floating Food/Veggie Background Emojis */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {/* Style block for floating animations */}
        <style>{`
          @keyframes bgFloat1 {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-40px) rotate(15deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
          @keyframes bgFloat2 {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-60px) rotate(-20deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
          @keyframes bgFloat3 {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-30px) rotate(10deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
          .floating-food-bg {
            position: absolute;
            opacity: 0.14;
            filter: grayscale(10%) blur(0.2px);
            pointer-events: none;
            user-select: none;
            transition: transform 0.3s ease;
          }
        `}</style>

        {/* Distributed emojis with varying speed, positions and scaling */}
        <div className="floating-food-bg" style={{ top: '5%', left: '8%', fontSize: '3rem', animation: 'bgFloat1 8s ease-in-out infinite' }}>🥦</div>
        <div className="floating-food-bg" style={{ top: '12%', left: '85%', fontSize: '2.5rem', animation: 'bgFloat2 10s ease-in-out infinite' }}>🍎</div>
        <div className="floating-food-bg" style={{ top: '22%', left: '50%', fontSize: '3.2rem', animation: 'bgFloat3 12s ease-in-out infinite alternate' }}>🥗</div>
        <div className="floating-food-bg" style={{ top: '35%', left: '3%', fontSize: '2.8rem', animation: 'bgFloat2 7s ease-in-out infinite' }}>🍕</div>
        <div className="floating-food-bg" style={{ top: '42%', left: '92%', fontSize: '3rem', animation: 'bgFloat1 11s ease-in-out infinite alternate' }}>🍇</div>
        <div className="floating-food-bg" style={{ top: '55%', left: '15%', fontSize: '2.4rem', animation: 'bgFloat3 9s ease-in-out infinite' }}>🍓</div>
        <div className="floating-food-bg" style={{ top: '65%', left: '82%', fontSize: '3.5rem', animation: 'bgFloat1 13s ease-in-out infinite' }}>🍔</div>
        <div className="floating-food-bg" style={{ top: '78%', left: '40%', fontSize: '2.6rem', animation: 'bgFloat2 8s ease-in-out infinite alternate' }}>🥑</div>
        <div className="floating-food-bg" style={{ top: '88%', left: '9%', fontSize: '3.2rem', animation: 'bgFloat3 10s ease-in-out infinite' }}>🥞</div>
        <div className="floating-food-bg" style={{ top: '92%', left: '76%', fontSize: '2.8rem', animation: 'bgFloat1 12s ease-in-out infinite alternate' }}>🥕</div>
        <div className="floating-food-bg" style={{ top: '48%', left: '46%', fontSize: '2.5rem', animation: 'bgFloat3 14s ease-in-out infinite' }}>🍅</div>
        <div className="floating-food-bg" style={{ top: '70%', left: '5%', fontSize: '3rem', animation: 'bgFloat2 11s ease-in-out infinite alternate' }}>🍟</div>
      </div>

      {/* Header */}
      <div style={{ position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', background: 'linear-gradient(135deg, #ffedd5 0%, #fef3c7 50%, #fcd34d 100%)', padding: '2rem 3rem', borderRadius: '1.5rem', boxShadow: '0 15px 35px rgba(245, 158, 11, 0.15)', border: '2px solid #fde68a' }}>
        
        {/* Floating Food Stickers */}
        <div style={{ position: 'absolute', top: '10%', left: '4%', fontSize: '2.5rem', transform: 'rotate(-15deg)', filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.1))', animation: 'float 4s ease-in-out infinite' }}>🥑</div>
        <div style={{ position: 'absolute', bottom: '15%', left: '25%', fontSize: '3.2rem', transform: 'rotate(20deg)', filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.1))', animation: 'float 5s ease-in-out infinite alternate' }}>🍓</div>
        <div style={{ position: 'absolute', top: '15%', right: '40%', fontSize: '2.2rem', transform: 'rotate(-5deg)', filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.1))', animation: 'float 6s ease-in-out infinite reverse' }}>🥐</div>
        <div style={{ position: 'absolute', bottom: '10%', right: '25%', fontSize: '2.8rem', transform: 'rotate(15deg)', filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.1))', animation: 'float 4.5s ease-in-out infinite' }}>🥗</div>
        <div style={{ position: 'absolute', top: '15%', right: '6%', fontSize: '3.5rem', transform: 'rotate(-10deg)', filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.1))', animation: 'float 3.5s ease-in-out infinite' }}>🍔</div>
        <div style={{ position: 'absolute', bottom: '-5%', right: '12%', fontSize: '2rem', filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.1))', animation: 'float 7s ease-in-out infinite' }}>🥝</div>
        <div style={{ position: 'absolute', top: '-5%', left: '35%', fontSize: '2.2rem', filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.1))', animation: 'float 5.5s ease-in-out infinite alternate' }}>🍳</div>

        <div style={{ position: 'relative', zIndex: 10 }}>
          <h1 style={{ fontSize: '2.8rem', color: '#b45309', fontWeight: '900', margin: 0, textShadow: '2px 2px 4px rgba(251, 191, 36, 0.3)' }}>
            {mt('title')} <span style={{ color: '#ea580c' }}>{mt('titleSpan')}</span> 🍽️
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.8rem' }}>
            <p style={{ color: '#9a3412', margin: 0, fontWeight: '600', fontSize: '1.1rem', background: 'rgba(255, 255, 255, 0.4)', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', display: 'inline-block' }}>{mt('subtitle')}</p>
            <div style={{ background: 'rgba(255, 255, 255, 0.6)', padding: '0.4rem 1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.8)' }}>
              <User size={18} color="#ea580c" />
              <span style={{ fontWeight: '800', color: '#b45309', textTransform: 'capitalize' }}>{user?.username || mt('patient')}</span>
            </div>
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 10, background: 'var(--surface)', padding: '1.2rem', borderRadius: '1.2rem', color: '#ea580c', boxShadow: '0 8px 16px rgba(234, 88, 12, 0.2)' }}>
          <Utensils size={36} />
        </div>
      </div>

      {/* Add / Edit Form */}
      <div style={{ background: 'var(--surface)', padding: '2rem 2.5rem', borderRadius: '1.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', marginBottom: '3rem', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative corner */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: '#f0fdfa', borderRadius: '50%', zIndex: 0 }}></div>
        
        <h2 style={{ fontSize: '1.4rem', color: '#1e293b', marginBottom: '1.5rem', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           {isEditing ? <Edit3 color="#3b82f6"/> : <Plus color="#14b8a6"/>}
           {isEditing ? mt('updateSlot') : mt('addSlot')}
        </h2>

        <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>{mt('mealTime')}</label>
             <div style={{ position: 'relative' }}>
               <Clock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
               <input 
                 type="time" required value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})}
                 style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '0.75rem', border: '2px solid #e2e8f0', background: '#f8fafc', fontWeight: '500', fontSize: '1rem', transition: 'border-color 0.2s', outline: 'none' }}
                 onFocus={e => e.target.style.borderColor = '#14b8a6'} onBlur={e => e.target.style.borderColor = '#e2e8f0'}
               />
             </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>{mt('foodItems')}</label>
             <div style={{ position: 'relative' }}>
               <Utensils size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
               <input 
                 type="text" required value={formData.item} onChange={(e) => setFormData({...formData, item: e.target.value})}
                 placeholder="e.g. 2 Apples, Oats"
                 style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '0.75rem', border: '2px solid #e2e8f0', background: '#f8fafc', fontWeight: '500', fontSize: '1rem', transition: 'border-color 0.2s', outline: 'none' }}
                 onFocus={e => e.target.style.borderColor = '#14b8a6'} onBlur={e => e.target.style.borderColor = '#e2e8f0'}
               />
             </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>{mt('mealCategory')}</label>
            <select 
              value={formData.mealType} onChange={(e) => setFormData({...formData, mealType: e.target.value})}
              style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.75rem', border: '2px solid var(--border)', background: 'var(--bg-color)', fontWeight: '600', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}
              onFocus={e => e.target.style.borderColor = '#14b8a6'} onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            >
              <option value="Breakfast">{mt('breakfast')}</option>
              <option value="Lunch">{mt('lunch')}</option>
              <option value="Snacks">{mt('snacks')}</option>
              <option value="Dinner">{mt('dinner')}</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button 
               type="submit" 
               style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.9rem', borderRadius: '0.75rem', background: isEditing ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'linear-gradient(135deg, #14b8a6, #0d9488)', color: 'white', fontWeight: 'bold', fontSize: '1rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(20, 184, 166, 0.3)', transition: 'transform 0.2s' }}
               onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
               onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {isEditing ? <Save size={20}/> : <Plus size={20}/>}
              {isEditing ? mt('saveChanges') : mt('addToSchedule')}
            </button>
          </div>
        </form>
      </div>

      {/* Categorized Tables */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {renderTable('Breakfast', <Coffee size={24} />, 'linear-gradient(to right, #fbbf24, #f59e0b, #d97706)', '#d97706')}
        {renderTable('Lunch', <Sun size={24} />, 'linear-gradient(to right, #38bdf8, #0ea5e9, #0284c7)', '#0284c7')}
        {renderTable('Snacks', <Apple size={24} />, 'linear-gradient(to right, #f472b6, #db2777, #9d174d)', '#be185d')}
        {renderTable('Dinner', <Moon size={24} />, 'linear-gradient(to right, #818cf8, #6366f1, #4338ca)', '#4f46e5')}
      </div>
      <SectionAbout
        title="Diet Timetable"
        icon="🍽️"
        color="#ea580c"
        gradient="linear-gradient(135deg, #fcd34d, #ea580c)"
        what={mt('aboutWhat')}
        howToUse={mt('aboutHow')}
        importance={mt('aboutWhy')}
      />
    </div>
  );
}
