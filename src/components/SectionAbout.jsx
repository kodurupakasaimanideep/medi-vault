import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Info, BookOpen, Lightbulb, HelpCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import './SectionAbout.css';

/**
 * SectionAbout — floating "ℹ️ About" button + info modal
 *
 * Props:
 *   title       {string}   — Section name displayed in header
 *   icon        {string}   — Emoji icon for the section
 *   color       {string}   — Accent color (hex / css value)
 *   gradient    {string}   — CSS gradient for header background
 *   what        {string}   — What this section is
 *   howToUse    {string[]} — Step-by-step usage guide
 *   importance  {string[]} — Why this section matters
 */
export default function SectionAbout({ title, icon, color, gradient, what = '', howToUse = [], importance = [], style, className }) {
  const [open, setOpen] = useState(false);
  const { lang } = useLanguage();

  const close = useCallback(() => setOpen(false), []);

  const localT = {
    en: {
      about: 'About',
      guide: 'Section Guide & Information',
      what: 'What is this Section?',
      how: 'How to Use',
      why: "Why It's Important",
      closeBtn: 'Got it! Close'
    },
    te: {
      about: 'గురించి',
      guide: 'విభాగం గైడ్ & సమాచారం',
      what: 'ఈ విభాగం ఏమిటి?',
      how: 'ఎలా ఉపయోగించాలి',
      why: 'ఇది ఎందుకు ముఖ్యం',
      closeBtn: 'అర్థమైంది! మూసివేయి'
    },
    hi: {
      about: 'के बारे में',
      guide: 'अनुभाग गाइड और जानकारी',
      what: 'यह अनुभाग क्या है?',
      how: 'कैसे उपयोग करें',
      why: 'यह क्यों महत्वपूर्ण है',
      closeBtn: 'समझ गए! बंद करें'
    },
    eu: {
      about: 'Acerca de',
      guide: 'Guía de la Sección e Información',
      what: '¿Qué es esta sección?',
      how: 'Cómo usar',
      why: 'Por qué es importante',
      closeBtn: '¡Entendido! Cerrar'
    }
  };

  const gt = (key) => localT[lang]?.[key] || localT['en']?.[key];

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, close]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const accentColor  = color   || '#6366f1';
  const headerGrad   = gradient || `linear-gradient(135deg, ${accentColor}cc, ${accentColor})`;

  return (
    <>
      {/* Floating trigger button */}
      <button
        className={`sa-fab ${className || ''}`}
        style={{ '--sa-color': accentColor, ...style }}
        onClick={() => setOpen(true)}
        aria-label={`About ${title}`}
        title={`About ${title}`}
      >
        <Info size={16} />
        <span>{gt('about')}</span>
      </button>

      {/* Backdrop + Modal (using React Portal) */}
      {open && createPortal(
        <div className="sa-overlay" onClick={close} role="dialog" aria-modal="true">
          <div className="sa-modal" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="sa-modal-header" style={{ background: headerGrad }}>
              <div className="sa-header-icon">{icon}</div>
              <div className="sa-header-text">
                <h2 className="sa-header-title">{title}</h2>
                <p className="sa-header-sub">{gt('guide')}</p>
              </div>
              <button className="sa-close-btn" onClick={close} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="sa-modal-body">

              {/* What is this section */}
              <div className="sa-section">
                <div className="sa-section-title" style={{ color: accentColor }}>
                  <BookOpen size={18} />
                  <span>{gt('what')}</span>
                </div>
                <p className="sa-what-text">{what}</p>
              </div>

              {/* How to use */}
              <div className="sa-section">
                <div className="sa-section-title" style={{ color: accentColor }}>
                  <HelpCircle size={18} />
                  <span>{gt('how')}</span>
                </div>
                <ol className="sa-steps-list">
                  {howToUse.map((step, i) => (
                    <li key={i} className="sa-step-item">
                      <span className="sa-step-num" style={{ background: accentColor }}>{i + 1}</span>
                      <span className="sa-step-text">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Importance */}
              <div className="sa-section">
                <div className="sa-section-title" style={{ color: accentColor }}>
                  <Lightbulb size={18} />
                  <span>{gt('why')}</span>
                </div>
                <ul className="sa-importance-list">
                  {importance.map((point, i) => (
                    <li key={i} className="sa-importance-item">
                      <span className="sa-importance-dot" style={{ background: accentColor }} />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Footer */}
            <div className="sa-modal-footer">
              <button className="sa-footer-btn" style={{ background: headerGrad }} onClick={close}>
                {gt('closeBtn')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
