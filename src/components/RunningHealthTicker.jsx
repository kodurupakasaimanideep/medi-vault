import { Sparkles, Activity, Droplets, Pill, Flame, Heart } from 'lucide-react';
import './RunningHealthTicker.css';
import { useLanguage } from '../contexts/LanguageContext';

export default function RunningHealthTicker() {
  const { lang } = useLanguage();

  const messagesByLang = {
    en: [
      { icon: <Droplets size={14} color="#0ea5e9" />, text: "Stay Hydrated: Aim for 2.5L water daily to maintain energy & focus." },
      { icon: <Pill size={14} color="#8b5cf6" />, text: "Medication Alert: Check your tablet schedule & dosage on time." },
      { icon: <Flame size={14} color="#f59e0b" />, text: "Daily Streaks: Complete at least 2 wellness habits to keep your streak alive." },
      { icon: <Activity size={14} color="#10b981" />, text: "Physical Wellness: Take 15 minutes for light yoga or stretching today." },
      { icon: <Heart size={14} color="#ec4899" />, text: "Medi Vault: Your personal health vitals & records are securely synced." }
    ],
    te: [
      { icon: <Droplets size={14} color="#0ea5e9" />, text: "తాగునీరు: రోజూ 2.5 లీటర్ల నీరు త్రాగడం ద్వారా ఆరోగ్యంగా ఉండండి." },
      { icon: <Pill size={14} color="#8b5cf6" />, text: "మాత్రల సమయం: మీ రోజువారీ మందులను సమయానికి తీసుకోండి." },
      { icon: <Flame size={14} color="#f59e0b" />, text: "స్ట్రీక్స్: రోజువారీ అలవాట్లను కొనసాగించి మీ స్కోరును పెంచుకోండి." },
      { icon: <Activity size={14} color="#10b981" />, text: "యోగా సాధన: ప్రతిరోజూ 15 నిమిషాల వ్యాయామం శరీరాన్ని ఉల్లాసంగా ఉంచుతుంది." }
    ],
    hi: [
      { icon: <Droplets size={14} color="#0ea5e9" />, text: "हाइड्रेशन: दिन में कम से कम 2.5L पानी पिएं और स्वस्थ रहें।" },
      { icon: <Pill size={14} color="#8b5cf6" />, text: "दवा सूचना: अपनी दवाओं को सही समय और सही खुराक पर लें।" },
      { icon: <Flame size={14} color="#f59e0b" />, text: "स्वास्थ्य स्ट्रीक: रोज़ाना 2 अच्छी आदतें पूरी करके अपनी स्ट्रीक चालू रखें।" },
      { icon: <Activity size={14} color="#10b981" />, text: "योग एवं व्यायाम: रोज़ाना 15 मिनट योग से शरीर ऊर्जावान रहता है।" }
    ],
    eu: [
      { icon: <Droplets size={14} color="#0ea5e9" />, text: "Hidratación: Bebe 2.5L de agua al día para mantener energía y bienestar." },
      { icon: <Pill size={14} color="#8b5cf6" />, text: "Recordatorio: Toma tus medicamentos y dosis prescritas a tiempo." },
      { icon: <Flame size={14} color="#f59e0b" />, text: "Rachas de Salud: Completa tus hábitos diarios para mantener tu puntuación activa." },
      { icon: <Activity size={14} color="#10b981" />, text: "Actividad Diaria: Dedica 15 minutos al estiramiento o yoga hoy." }
    ]
  };

  const currentMessages = messagesByLang[lang] || messagesByLang['en'];
  // Double the list so it scrolls seamlessly without gap
  const fullList = [...currentMessages, ...currentMessages];

  return (
    <div className="mv-ticker-container" aria-label="Health live running updates">
      <div className="mv-ticker-badge" title="Medi Vault Live Health Updates">
        <Sparkles size={13} />
        <span>LIVE</span>
      </div>
      <div className="mv-ticker-track-wrap">
        <div className="mv-ticker-track">
          {fullList.map((item, idx) => (
            <div key={idx} className="mv-ticker-item">
              {item.icon}
              <span>{item.text}</span>
              <span className="mv-ticker-sep">✦</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
