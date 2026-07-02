import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot, User, Send, Trash2, RotateCcw, Sparkles,
  PanelLeftOpen, PanelLeftClose, Plus, Clock, Search,
  X, Activity, Stethoscope, Zap, Shield, Brain
} from 'lucide-react';
import SectionAbout from '../components/SectionAbout';
import './MedicalDiseases.css';

/* ══════════════════════════════════════════════════════════════
   SYSTEM PROMPT — MEDI-VAULT BOT
   ══════════════════════════════════════════════════════════════ */
const SYSTEM_PROMPT = `You are MediVault AI, an advanced medical wellness and symptom guidance assistant.

Your goal:
Provide safe, structured, easy-to-understand wellness guidance for common symptoms, health concerns, recovery support, nutrition, fitness, and preventive care.

You support users with:
- Pain management guidance
- Symptom education
- Healthy foods and nutrition
- Safe exercises and stretches
- Lifestyle improvement
- Recovery support
- Preventive health tips
- Sleep improvement
- Stress reduction
- Hydration guidance
- Basic first aid education

You can discuss:
Headache, migraine, one-sided headache, neck pain, back pain, shoulder pain, joint pain, arthritis, swelling, cuts, wounds, fever, cold, cough, stomach pain, acidity, constipation, bloating, fatigue, stress, anxiety, sleep problems, muscle pain, leg pain, knee pain, hand pain, wrist pain, posture issues, dehydration, weakness, immunity, skin irritation, healthy diet planning, diabetes wellness support, blood pressure wellness support, weight management, and general wellness topics.

Response rules:
- Use short sections.
- Use bullet points.
- Use simple language.
- Give practical advice.
- Be calm and supportive.
- Avoid complicated medical terminology.
- Explain suggestions clearly.

Always structure responses like this:

1. Possible common causes
2. Recommended foods & drinks
3. Safe exercises or stretches
4. Home care tips
5. Things to avoid
6. Prevention tips
7. When to see a doctor

Food suggestions:
- Recommend healthy whole foods.
- Mention hydration.
- Suggest anti-inflammatory foods when useful.
- Suggest fruits, vegetables, proteins, and balanced meals.
- Mention foods to avoid if relevant.

Exercise suggestions:
- Recommend beginner-friendly movements.
- Suggest stretching, walking, yoga, mobility exercises, breathing exercises, or posture correction if appropriate.
- Warn users to stop if pain increases.

Safety rules:
- Never diagnose diseases.
- Never claim certainty.
- Never prescribe prescription medication.
- Never recommend unsafe treatments.
- Never replace professional medical advice.

Always recommend immediate medical care for:
- Chest pain
- Difficulty breathing
- Stroke symptoms
- Severe bleeding
- Loss of consciousness
- Seizures
- Serious injuries
- Severe allergic reactions
- Sudden weakness
- High fever lasting several days
- Suicidal thoughts

If symptoms appear severe, urgent, or dangerous:
- Clearly advise the user to seek emergency care.

If users search for diseases:
- Provide educational information only.
- Include symptoms, prevention, healthy habits, supportive foods, and general wellness guidance.
- Never present information as a confirmed diagnosis.

If the user enters a disease or symptom:
- Explain it clearly.
- Provide wellness support.
- Suggest healthy routines.
- Mention when medical consultation is important.

Search behavior:
- Allow users to search symptoms, diseases, foods, exercises, wellness topics, and recovery tips.
- Understand spelling mistakes and simple language.
- Respond intelligently to partial searches.

Examples:
- “head pain”
- “left side headache”
- “knee swelling”
- “pain after gym”
- “foods for weakness”
- “stretch for neck pain”

Always end responses with:
"Note: This information is for educational and wellness support purposes only and is not a medical diagnosis."`;

/* ══════════════════════════════════════════════════════════════
   API CONFIGURATION
   ══════════════════════════════════════════════════════════════ */
const API_KEY = 'AIzaSyDH9YtLEuZRUPYlB5O-6RBbFt-uBHV8iRI';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

/* ══════════════════════════════════════════════════════════════
   QUICK PROMPTS
   ══════════════════════════════════════════════════════════════ */
const QUICK_PROMPTS = [
  { icon: '🤕', label: 'Headache & Migraine', text: 'I have a one-sided headache and migraine. What are the causes and home remedies?' },
  { icon: '🦴', label: 'Joint & Knee Pain', text: 'What are the best exercises and foods for joint pain and knee pain relief?' },
  { icon: '🔙', label: 'Back Pain & Posture', text: 'I have lower back pain from sitting. Give me exercises and posture correction tips.' },
  { icon: '🌡️', label: 'Fever, Cold & Cough', text: 'I have fever, cold and cough. What home remedies, foods and care tips should I follow?' },
  { icon: '🥗', label: 'Anti-inflammatory Diet', text: 'What anti-inflammatory foods should I eat to reduce pain and boost immunity?' },
  { icon: '😰', label: 'Stress & Sleep Issues', text: 'I have stress, anxiety and sleep problems. What natural remedies and lifestyle tips help?' },
  { icon: '🤢', label: 'Stomach & Digestion', text: 'I have stomach pain, bloating and acidity. What foods and home care help?' },
  { icon: '💪', label: 'Fatigue & Low Energy', text: 'I feel tired and have low energy all day. What foods, exercises and habits help?' },
  { icon: '🦵', label: 'Leg & Muscle Pain', text: 'I have leg pain and muscle cramps. What stretches, foods and home remedies help?' },
  { icon: '🌿', label: 'Home Remedies', text: 'What are the best natural home remedies for common pain, cold and inflammation?' },
  { icon: '🩸', label: 'Blood Pressure Tips', text: 'What are wellness tips, foods and exercises to maintain healthy blood pressure?' },
  { icon: '🧘', label: 'Yoga & Stretching', text: 'Give me a beginner yoga and stretching routine for pain relief and flexibility.' },
];

/* ══════════════════════════════════════════════════════════════
   MARKDOWN FORMATTER
   ══════════════════════════════════════════════════════════════ */
function formatMarkdown(text) {
  let t = text;
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  t = t.replace(/^### (.+)$/gm, '<h3 class="mvb-h3">$1</h3>');
  t = t.replace(/^## (.+)$/gm, '<h2 class="mvb-h2">$1</h2>');
  t = t.replace(/^[-•]\s+(.+)/gm, '<li>$1</li>');
  t = t.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  t = t.replace(/^\d+\.\s+(.+)/gm, '<li class="mvb-ol-item">$1</li>');
  t = t.replace(/<\/ul>\s*<ul>/g, '');
  t = t.replace(/\n/g, '<br/>');
  t = t.replace(/<br\/><ul>/g, '<ul>');
  t = t.replace(/<\/ul><br\/>/g, '</ul>');
  t = t.replace(/<br\/><h[23]/g, '<h');
  t = t.replace(/<\/h[23]><br\/>/g, (m) => m.replace('<br/>', ''));
  return t;
}

/* ══════════════════════════════════════════════════════════════
   LOCAL KNOWLEDGE BASE FALLBACK
   ══════════════════════════════════════════════════════════════ */
const LOCAL_KB = [
  {
    keywords: ['joint pain', 'arthritis', 'knee pain', 'hip pain', 'joint'],
    answer: `**🦴 Joint Pain Relief Guide**

**Possible Causes:**
- Arthritis (osteoarthritis or rheumatoid)
- Inflammation from overuse or injury
- Vitamin D or calcium deficiency
- Poor posture or excess weight

**Recommended Exercises:**
1. **Water Walking** — Walk in a pool for 20 min. Water reduces joint stress by 75%.
2. **Seated Leg Raises** — Sit in a chair, extend one leg, hold 5 sec, lower slowly. 10 reps each side.
3. **Gentle Cycling** — Stationary bike for 15–20 min. Low impact, high benefit.
4. **Wall Squats** — Back against wall, slide down to 45°, hold 10 sec. 10 reps.

**Anti-Inflammatory Foods:**
- Turmeric with black pepper (curcumin reduces inflammation)
- Omega-3 rich fish (salmon, sardines)
- Berries, cherries, leafy greens
- Ginger tea twice daily

**Home Remedies:**
- Warm compress for 15 min before exercise
- Cold compress after exercise to reduce swelling
- Turmeric milk before bed
- Epsom salt bath (magnesium absorption through skin)

**Warning Signs:** Seek medical help if joint becomes red, hot, severely swollen, or if pain is unbearable.

*Disclaimer: This is educational guidance only. Consult a doctor for diagnosis and treatment.*`
  },
  {
    keywords: ['back pain', 'spine', 'backache', 'lumbar'],
    answer: `**🏥 Back Pain Relief Guide**

**Recommended Exercises:**
1. **Cat-Cow Stretch** — On hands and knees, arch and round your back. 10 rounds.
2. **Child's Pose** — Kneel, reach arms forward, hold 60 sec.
3. **Pelvic Tilts** — Lie on back, flatten spine to floor. 15 reps.
4. **Bird-Dog** — On all fours, extend opposite arm and leg. Hold 5 sec. 10 reps each.

**Posture Tips:**
- Sit with lumbar support
- Stand every 30 minutes
- Sleep on your side with pillow between knees

**Consult a doctor** if you experience leg numbness, fever, or severe pain.`
  },
  {
    keywords: ['stress', 'anxiety', 'mental', 'mood', 'relaxation'],
    answer: `**🧠 Stress & Mental Wellness Guide**

**Quick Relief Techniques:**
1. **4-7-8 Breathing** — Inhale 4 sec, hold 7 sec, exhale 8 sec. Repeat 4×.
2. **Progressive Muscle Relaxation** — Tense and release each muscle group from toes to head.
3. **5-4-3-2-1 Grounding** — Name 5 things you see, 4 you hear, 3 you can touch, 2 you smell, 1 you taste.

**Daily Habits:**
- 20–30 min walk outdoors daily
- Limit caffeine after 2 PM
- Sleep 7–8 hours consistently
- Practice gratitude journaling
- Limit social media to 30 min/day

**Anti-Stress Foods:**
- Dark chocolate (70%+), magnesium-rich nuts
- Ashwagandha tea, chamomile tea before bed`
  },
  {
    keywords: ['sleep', 'insomnia', 'rest', 'tired', 'fatigue'],
    answer: `**😴 Better Sleep & Recovery Guide**

**Sleep Hygiene Checklist:**
- Go to bed and wake at the same time daily
- Bedroom temperature: 18–21°C (cool and dark)
- No screens 1 hour before bed
- No heavy meals 3 hours before sleep

**Pre-Sleep Routine:**
1. Warm bath or foot soak (10 min)
2. Chamomile or ashwagandha tea
3. Light stretching or yoga nidra (10 min)
4. 4-7-8 breathing for 5 min

**Sleep-Promoting Foods:**
- Warm turmeric milk, cherries (natural melatonin)
- Banana with peanut butter (tryptophan + magnesium)
- Kiwi fruit (serotonin precursor)`
  },
  {
    keywords: ['diet', 'nutrition', 'food', 'eat', 'healthy'],
    answer: `**🥗 Medical Nutrition Guide**

**Anti-Inflammatory Superfoods:**
- 🫐 Berries (blueberries, strawberries)
- 🐟 Fatty fish (salmon, mackerel, sardines)
- 🥦 Broccoli, spinach, kale
- 🫚 Olive oil (use instead of refined oils)
- 🌰 Walnuts and almonds
- 🌶️ Turmeric + ginger (powerful anti-inflammatories)

**Foods to Avoid:**
- Sugar, refined carbs, white flour
- Processed/packaged snacks
- Excess red meat, alcohol, trans fats

**Healing Drinks:**
- Turmeric golden milk
- Ginger-lemon water
- Green tea (EGCG antioxidants)
- Amla juice (vitamin C powerhouse)`
  },
];

function getLocalFallback(text) {
  const lower = text.toLowerCase();
  let best = null, bestScore = 0;
  for (const entry of LOCAL_KB) {
    const score = entry.keywords.filter(kw => lower.includes(kw)).length;
    if (score > bestScore) { bestScore = score; best = entry; }
  }
  if (best && bestScore > 0) return best.answer;
  return `**🤖 MEDI-VAULT BOT**

I'm your AI Medical Wellness Assistant. I can help you with:

- 🦴 **Joint & muscle pain** relief exercises
- 🥗 **Anti-inflammatory nutrition** guidance
- 🧘 **Stretching & yoga** routines
- 😴 **Sleep & recovery** optimization
- 💊 **Home remedies** & wellness tips
- 🧠 **Stress management** techniques
- 🏃 **Exercise plans** for your condition

Just describe your health concern or symptoms and I'll provide personalized guidance! 😊`;
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function MedicalDiseases() {
  /* ── Chat State ── */
  const WELCOME_MSG = `**Welcome to MEDI-VAULT BOT! 🩺**\n\nI'm your AI Health & Wellness Assistant.\n\n**I can help you with:**\n\n• Headache & migraine relief\n• One-sided headache guidance\n• Neck pain & stiffness\n• Back pain & posture correction\n• Joint pain & arthritis support\n• Leg pain, knee pain & muscle cramps\n• Hand pain & wrist discomfort\n• Shoulder pain & recovery exercises\n• Body pain & muscle soreness\n• Swelling & inflammation care\n• Cuts, wounds & basic first aid\n• Fever, cold & cough support\n• Stomach pain & digestion issues\n• Acidity, bloating & constipation\n• Stress, anxiety & sleep problems\n• Fatigue & low energy\n• Weight loss & healthy diet guidance\n• Diabetes-friendly food suggestions\n• Blood pressure wellness tips\n• Immunity boosting foods\n• Skin allergies & irritation care\n• Women's wellness support\n• Elderly care guidance\n• Healthy lifestyle planning\n• Yoga, stretching & mobility exercises\n• Anti-inflammatory foods & nutrition\n• Home remedies & recovery tips\n\n🔍 **Search any symptom, pain, condition, wellness topic, food, exercise, or health concern.**\n\n**Example searches:**\n- "One side headache"\n- "Best foods for arthritis"\n- "Exercises for lower back pain"\n- "Swelling in feet"\n- "Natural remedies for cold"\n- "Foods to reduce inflammation"\n\n**Tell me your symptoms or health concern and I'll provide:**\n✔ Possible causes\n✔ Food suggestions\n✔ Safe exercises\n✔ Home care tips\n✔ Prevention advice\n✔ When to see a doctor\n\n*Note: This assistant provides wellness guidance only and does not replace professional medical care.*`;

  const [sessions, setSessions] = useState([
    { id: 'default', title: 'New Conversation', messages: [
      { role: 'assistant', content: WELCOME_MSG, timestamp: new Date() }
    ]}
  ]);
  const [activeSessionId, setActiveSessionId] = useState('default');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [retryPayload, setRetryPayload] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession?.messages || [];

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /* ── Focus input ── */
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [activeSessionId]);

  /* ── Update messages helper ── */
  const updateMessages = useCallback((sessionId, newMessages) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: newMessages } : s));
  }, []);

  /* ── New Session ── */
  const createNewSession = useCallback(() => {
    const newId = `session-${Date.now()}`;
    const welcome = { role: 'assistant', content: WELCOME_MSG, timestamp: new Date() };
    setSessions(prev => [{ id: newId, title: 'New Conversation', messages: [welcome] }, ...prev]);
    setActiveSessionId(newId);
    setRetryPayload(null);
    setShowQuickPrompts(true);
  }, []);

  /* ── Delete Session ── */
  const deleteSession = useCallback((id, e) => {
    e.stopPropagation();
    setSessions(prev => {
      const remaining = prev.filter(s => s.id !== id);
      if (remaining.length === 0) {
        const def = { id: 'default-' + Date.now(), title: 'New Conversation', messages: [] };
        setActiveSessionId(def.id);
        return [def];
      }
      if (id === activeSessionId) setActiveSessionId(remaining[0].id);
      return remaining;
    });
  }, [activeSessionId]);

  /* ── API Call ── */
  const callAPI = useCallback(async (history) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const contents = history
      .filter(m => !m.isError)
      .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          generationConfig: { temperature: 0.75, topK: 40, topP: 0.95, maxOutputTokens: 2048 }
        }),
        signal: controller.signal
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return reply;
      }

      const lastUser = history.filter(m => m.role === 'user').pop();
      return getLocalFallback(lastUser?.content || '');
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      const lastUser = history.filter(m => m.role === 'user').pop();
      return getLocalFallback(lastUser?.content || '');
    }
  }, []);

  /* ── Send Message ── */
  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isTyping) return;

    const userMsg = { role: 'user', content: trimmed, timestamp: new Date() };
    const sessionId = activeSessionId;
    const currentMsgs = sessions.find(s => s.id === sessionId)?.messages || [];
    const updatedMsgs = [...currentMsgs.filter(m => !m.isError), userMsg];

    // Update title from first user message
    if (currentMsgs.filter(m => m.role === 'user').length === 0) {
      setSessions(prev => prev.map(s => s.id === sessionId ? {
        ...s,
        title: trimmed.length > 40 ? trimmed.slice(0, 40) + '…' : trimmed,
        messages: updatedMsgs
      } : s));
    } else {
      updateMessages(sessionId, updatedMsgs);
    }

    setInput('');
    setIsTyping(true);
    setRetryPayload(null);
    setShowQuickPrompts(false);

    try {
      const reply = await callAPI(updatedMsgs);
      const botMsg = { role: 'assistant', content: reply, timestamp: new Date() };
      updateMessages(sessionId, [...updatedMsgs, botMsg]);
    } catch (err) {
      if (err.name === 'AbortError') return;
      const errMsg = { role: 'assistant', content: 'Sorry, I had trouble connecting. Please try again.', timestamp: new Date(), isError: true };
      updateMessages(sessionId, [...updatedMsgs, errMsg]);
      setRetryPayload(trimmed);
    } finally {
      setIsTyping(false);
      abortRef.current = null;
    }
  }, [input, isTyping, activeSessionId, sessions, callAPI, updateMessages]);

  /* ── Retry ── */
  const retryLast = useCallback(async () => {
    if (!retryPayload || isTyping) return;
    await sendMessage(retryPayload);
    setRetryPayload(null);
  }, [retryPayload, isTyping, sendMessage]);

  /* ── Clear Chat ── */
  const clearChat = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    const welcome = { role: 'assistant', content: WELCOME_MSG, timestamp: new Date() };
    updateMessages(activeSessionId, [welcome]);
    setIsTyping(false);
    setRetryPayload(null);
    setShowQuickPrompts(true);
  }, [activeSessionId, updateMessages]);

  /* ── Key Handler ── */
  const handleKey = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }, [sendMessage]);

  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fmtTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  /* ── RENDER ── */
  return (
    <div className="mvb-page">
      {/* ═══ SIDEBAR ═══ */}
      <aside className={`mvb-sidebar ${sidebarOpen ? '' : 'mvb-sidebar--collapsed'}`}>
        {/* Sidebar Header */}
        <div className="mvb-sidebar-head">
          <div className="mvb-brand">
            <div className="mvb-brand-icon">
              <Stethoscope size={16} />
            </div>
            <span className="mvb-brand-name">MEDI-VAULT</span>
          </div>
          <button className="mvb-icon-btn" onClick={() => setSidebarOpen(false)} title="Collapse sidebar">
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* New Chat */}
        <div className="mvb-sidebar-actions">
          <button className="mvb-new-chat-btn" onClick={createNewSession}>
            <Plus size={16} />
            New Consultation
          </button>
          <div className="mvb-search-wrap">
            <Search size={14} className="mvb-search-icon" />
            <input
              className="mvb-search-input"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Chat History */}
        <div className="mvb-sessions-list">
          <span className="mvb-section-label">Recent Chats</span>
          {filteredSessions.length === 0 && (
            <p className="mvb-no-sessions">No chats found</p>
          )}
          {filteredSessions.map(s => (
            <button
              key={s.id}
              className={`mvb-session-item ${s.id === activeSessionId ? 'active' : ''}`}
              onClick={() => setActiveSessionId(s.id)}
            >
              <Clock size={13} className="mvb-session-icon" />
              <span className="mvb-session-title">{s.title}</span>
              <button className="mvb-session-del" onClick={(e) => deleteSession(s.id, e)}>
                <X size={12} />
              </button>
            </button>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="mvb-sidebar-foot">
          <div className="mvb-powered-by">
            <Zap size={12} />
            Powered by Gemini AI
          </div>
        </div>
      </aside>

      {/* ═══ MAIN CHAT AREA ═══ */}
      <div className="mvb-main">
        {/* Top Header */}
        <header className="mvb-header">
          <div className="mvb-header-left">
            {!sidebarOpen && (
              <button className="mvb-icon-btn" onClick={() => setSidebarOpen(true)} title="Open sidebar">
                <PanelLeftOpen size={18} />
              </button>
            )}
            <div className="mvb-header-brand">
              <div className="mvb-header-icon">
                <Bot size={18} />
              </div>
              <div>
                <div className="mvb-header-title">MEDI-VAULT BOT</div>
                <div className="mvb-header-sub">
                  <span className="mvb-status-dot" />
                  AI Medical Assistant · Online
                </div>
              </div>
            </div>
          </div>
          <div className="mvb-header-right">
            <div className="mvb-model-badge">
              <Sparkles size={12} />
              Gemini 2.0 Flash
            </div>
            <button className="mvb-icon-btn" onClick={clearChat} title="Clear conversation">
              <Trash2 size={16} />
            </button>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="mvb-messages-area">
          {/* Welcome screen */}
          {messages.length <= 1 && showQuickPrompts && (
            <div className="mvb-welcome">
              <div className="mvb-welcome-orb">
                <Brain size={36} />
              </div>
              <h2 className="mvb-welcome-title">MEDI-VAULT BOT 🩺</h2>
              <p className="mvb-welcome-desc">
                Your AI Health &amp; Wellness Assistant — covering headaches, joint pain, back pain, fever, digestion, stress, fatigue, diet, yoga, and 25+ more health topics.
              </p>
              <div className="mvb-quick-grid">
                {QUICK_PROMPTS.map((p, i) => (
                  <button key={i} className="mvb-quick-card" onClick={() => sendMessage(p.text)}>
                    <span className="mvb-quick-icon">{p.icon}</span>
                    <span className="mvb-quick-label">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, idx) => (
            <div key={idx} className={`mvb-msg-row mvb-msg-row--${msg.role} ${msg.isError ? 'mvb-msg-row--error' : ''}`}>
              <div className="mvb-msg-inner">
                <div className={`mvb-msg-avatar mvb-msg-avatar--${msg.role}`}>
                  {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                </div>
                <div className="mvb-msg-body">
                  {msg.role === 'assistant' && (
                    <div className="mvb-msg-sender">MEDI-VAULT BOT</div>
                  )}
                  <div
                    className="mvb-msg-content"
                    dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                  />
                  <div className="mvb-msg-time">{fmtTime(msg.timestamp)}</div>
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="mvb-msg-row mvb-msg-row--assistant">
              <div className="mvb-msg-inner">
                <div className="mvb-msg-avatar mvb-msg-avatar--assistant">
                  <Bot size={16} />
                </div>
                <div className="mvb-msg-body">
                  <div className="mvb-msg-sender">MEDI-VAULT BOT</div>
                  <div className="mvb-typing-indicator">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="mvb-input-area">
          <div className="mvb-input-wrapper">
            {/* Retry bar */}
            {retryPayload && !isTyping && (
              <div className="mvb-retry-bar">
                <button className="mvb-retry-btn" onClick={retryLast}>
                  <RotateCcw size={14} />
                  Retry last message
                </button>
              </div>
            )}

            {/* Input box */}
            <div className="mvb-input-box">
              <div className="mvb-input-left">
                <Activity size={18} className="mvb-input-icon" />
              </div>
              <textarea
                ref={inputRef}
                className="mvb-textarea"
                placeholder="Describe your health concern, symptoms, or ask any wellness question..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={isTyping}
                rows={1}
                id="mvb-message-input"
              />
              <button
                className="mvb-send-btn"
                onClick={() => sendMessage()}
                disabled={!input.trim() || isTyping}
                id="mvb-send-button"
                title="Send message"
              >
                <Send size={18} />
              </button>
            </div>

            <p className="mvb-disclaimer">
              <Shield size={11} />
              MEDI-VAULT BOT provides wellness guidance only. Always consult a qualified doctor for medical diagnosis and treatment.
            </p>
          </div>
        </div>
      </div>

      {/* Section About */}
      <SectionAbout
        title="Diseases Exercise & AI Bot"
        icon="Activity"
        color="#6366f1"
        gradient="linear-gradient(135deg, #6366f1, #8b5cf6)"
        what="The Medical Diseases & AI Bot section combines guided exercise therapy with an advanced AI wellness assistant (MEDI-VAULT BOT). The AI bot provides personalized health guidance, exercise recommendations, dietary advice, home remedies, and wellness tips for various medical conditions."
        howToUse={[
          'Open the MEDI-VAULT BOT chat interface on the right side of the screen.',
          'Describe your health concern, symptoms, or medical condition in the input box.',
          'Click the quick action cards for common health topics to get instant guidance.',
          'The AI will provide detailed exercises, food suggestions, and home remedies.',
          'Start a new consultation by clicking "New Consultation" in the left sidebar.',
          'Your past conversations are saved in the sidebar for easy reference.',
          'Use the search bar to find specific past conversations quickly.',
          'Clear the chat using the trash icon to start fresh.',
          'For serious symptoms, always follow the AI\'s advice to consult a doctor.',
          'Combine AI guidance with regular exercise for best health outcomes.',
        ]}
        importance={[
          'AI-powered guidance provides 24/7 access to wellness and exercise advice.',
          'Personalized recommendations based on your specific symptoms and condition.',
          'Covers exercises, nutrition, home remedies, and mental wellness in one place.',
          'Emergency detection alerts you when symptoms require immediate medical care.',
          'Evidence-based suggestions help reduce pain and improve quality of life.',
          'Saves time by giving structured health guidance without long doctor waits.',
          'The multi-session feature helps you track different health concerns separately.',
          'Powered by Google Gemini AI for accurate and up-to-date health information.',
          'Always maintains safety by recommending professional consultation when needed.',
          'Integrates with your overall MediVault health journey for holistic wellness.',
        ]}
        style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999 }}
      />
    </div>
  );
}
