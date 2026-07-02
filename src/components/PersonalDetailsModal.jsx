/**
 * PersonalDetailsModal — Post-Login Profile Setup
 *
 * Shown once after the user logs in for the first time (no personal details
 * saved yet).  Collects:
 *   1. First Name   2. Last Name   3. Age   4. Date of Birth   5. Gender
 *
 * Saves to localStorage key:  medivault_personal_details_<userId>
 * The Dashboard and PatientInfo pages read from this key.
 */

import { useState, useEffect } from 'react';
import {
  User, Calendar, ChevronRight, Check, Sparkles, Heart,
  Baby, Users, UserCheck
} from 'lucide-react';

/* ─── Avatar URL helper (mirrors Dashboard.jsx logic) ─────────────────── */
function getAvatarUrl(age, gender) {
  const isFemale = gender === 'Female';
  const ageNum   = parseInt(age, 10);
  if (!ageNum)           return isFemale ? '/avatars/adult_woman.png' : '/avatars/adult_man.png';
  if (ageNum < 12)       return isFemale ? '/avatars/child_girl.png'  : '/avatars/child_boy.png';
  if (ageNum < 18)       return isFemale ? '/avatars/teen_girl.png'   : '/avatars/teen_boy.png';
  return                        isFemale ? '/avatars/adult_woman.png' : '/avatars/adult_man.png';
}

/* ─── Age category label ───────────────────────────────────────────────── */
function getAgeLabel(age) {
  const n = parseInt(age, 10);
  if (!n || n <= 0)  return '';
  if (n < 12)        return '🧒 Child';
  if (n < 18)        return '🧑 Teenager';
  if (n < 60)        return '🧑‍💼 Adult';
  return                    '🧓 Senior';
}

/* ─── Auto-calculate age from DOB ─────────────────────────────────────── */
function calcAge(dob) {
  if (!dob) return '';
  const birthDate = new Date(dob);
  const today     = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age > 0 && age < 130 ? String(age) : '';
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function PersonalDetailsModal({ userId, onComplete }) {
  const [step,      setStep]      = useState(1);   // 1 = name, 2 = details
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [age,       setAge]       = useState('');
  const [dob,       setDob]       = useState('');
  const [gender,    setGender]    = useState('');
  const [error,     setError]     = useState('');
  const [avatarSrc, setAvatarSrc] = useState('/avatars/adult_man.png');
  const [saving,    setSaving]    = useState(false);
  const [done,      setDone]      = useState(false);

  /* Live avatar preview */
  useEffect(() => {
    setAvatarSrc(getAvatarUrl(age, gender));
  }, [age, gender]);

  /* Auto-fill age when DOB changes */
  const handleDobChange = (val) => {
    setDob(val);
    const computed = calcAge(val);
    if (computed) setAge(computed);
  };

  /* ── Step 1 validation & advance ─────────────────────────────── */
  const handleNextStep = () => {
    setError('');
    if (!firstName.trim() || firstName.trim().length < 2) {
      setError('Please enter a valid first name (at least 2 characters).');
      return;
    }
    if (!lastName.trim() || lastName.trim().length < 2) {
      setError('Please enter a valid last name (at least 2 characters).');
      return;
    }
    setStep(2);
  };

  /* ── Final submit ─────────────────────────────────────────────── */
  const handleSubmit = () => {
    setError('');
    if (!age || parseInt(age, 10) <= 0 || parseInt(age, 10) > 130) {
      setError('Please enter a valid age (1–130).');
      return;
    }
    if (!gender) {
      setError('Please select your gender.');
      return;
    }

    setSaving(true);
    setTimeout(() => {
      const details = {
        firstName:  firstName.trim(),
        lastName:   lastName.trim(),
        fullName:   `${firstName.trim()} ${lastName.trim()}`,
        age:        age,
        dob:        dob,
        gender:     gender,
        savedAt:    new Date().toISOString(),
      };
      localStorage.setItem(`medivault_personal_details_${userId}`, JSON.stringify(details));
      // Fire a same-tab event so Sidebar updates immediately
      window.dispatchEvent(new CustomEvent('mv_profile_updated', { detail: details }));
      setSaving(false);
      setDone(true);
      setTimeout(() => onComplete(details), 1400);
    }, 700);
  };

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <div className="pdm-overlay">
      <div className="pdm-backdrop" />

      <div className="pdm-card">

        {/* ── Decorative orbs ──────────────────────────── */}
        <div className="pdm-orb pdm-orb-1" />
        <div className="pdm-orb pdm-orb-2" />

        {/* ── Avatar preview ───────────────────────────── */}
        <div className="pdm-avatar-wrap">
          <div className="pdm-avatar-ring">
            <img
              src={avatarSrc}
              alt="Your Avatar"
              className="pdm-avatar-img"
            />
          </div>
          {age && (
            <span className="pdm-age-badge">{getAgeLabel(age)}</span>
          )}
        </div>

        {/* ── Header ───────────────────────────────────── */}
        <div className="pdm-header">
          <div className="pdm-header-icon">
            <Sparkles size={20} color="white" />
          </div>
          <h2 className="pdm-title">
            {done
              ? 'All Set! 🎉'
              : step === 1
              ? 'Welcome to MediVault!'
              : 'Almost There…'}
          </h2>
          <p className="pdm-subtitle">
            {done
              ? `Welcome, ${firstName}! Taking you to your dashboard…`
              : step === 1
              ? 'Tell us your name to personalise your dashboard experience'
              : 'A few more details to set up your health profile'}
          </p>
        </div>

        {/* ── Step indicator ───────────────────────────── */}
        {!done && (
          <div className="pdm-steps">
            <div className={`pdm-step ${step >= 1 ? 'pdm-step--active' : ''} ${step > 1 ? 'pdm-step--done' : ''}`}>
              {step > 1 ? <Check size={12} /> : '1'}
            </div>
            <div className="pdm-step-line" />
            <div className={`pdm-step ${step >= 2 ? 'pdm-step--active' : ''}`}>2</div>
          </div>
        )}

        {/* ── Done animation ───────────────────────────── */}
        {done && (
          <div className="pdm-done-wrap">
            <div className="pdm-done-ring">
              <Check size={32} color="white" strokeWidth={3} />
            </div>
            <p className="pdm-done-text">Profile saved successfully!</p>
          </div>
        )}

        {/* ── Error ────────────────────────────────────── */}
        {error && !done && (
          <div className="pdm-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            STEP 1 — Name
            ══════════════════════════════════════════════ */}
        {!done && step === 1 && (
          <div className="pdm-form">

            {/* First Name */}
            <div className="pdm-field">
              <label className="pdm-label">
                <User size={13} /> First Name
              </label>
              <div className="pdm-input-wrap">
                <User size={16} className="pdm-input-icon" />
                <input
                  id="pdm-first-name"
                  type="text"
                  className="pdm-input"
                  placeholder="e.g. Sai"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleNextStep()}
                />
              </div>
            </div>

            {/* Last Name */}
            <div className="pdm-field">
              <label className="pdm-label">
                <Users size={13} /> Last Name
              </label>
              <div className="pdm-input-wrap">
                <Users size={16} className="pdm-input-icon" />
                <input
                  id="pdm-last-name"
                  type="text"
                  className="pdm-input"
                  placeholder="e.g. Manideep"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleNextStep()}
                />
              </div>
            </div>

            <button
              id="pdm-next-btn"
              className="pdm-btn pdm-btn--primary"
              onClick={handleNextStep}
            >
              Continue <ChevronRight size={17} />
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            STEP 2 — Age / DOB / Gender
            ══════════════════════════════════════════════ */}
        {!done && step === 2 && (
          <div className="pdm-form">

            {/* DOB */}
            <div className="pdm-field">
              <label className="pdm-label">
                <Calendar size={13} /> Date of Birth
              </label>
              <div className="pdm-input-wrap">
                <Calendar size={16} className="pdm-input-icon" />
                <input
                  id="pdm-dob"
                  type="date"
                  className="pdm-input"
                  value={dob}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => handleDobChange(e.target.value)}
                />
              </div>
            </div>

            {/* Age */}
            <div className="pdm-field">
              <label className="pdm-label">
                <Baby size={13} /> Age
                {dob && <span className="pdm-auto-tag">Auto-calculated</span>}
              </label>
              <div className="pdm-input-wrap">
                <Baby size={16} className="pdm-input-icon" />
                <input
                  id="pdm-age"
                  type="number"
                  className="pdm-input"
                  placeholder="e.g. 28"
                  min="1" max="130"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                />
              </div>
            </div>

            {/* Gender */}
            <div className="pdm-field">
              <label className="pdm-label">
                <Heart size={13} /> Gender
              </label>
              <div className="pdm-gender-grid">
                {['Male', 'Female', 'Other'].map(g => (
                  <button
                    key={g}
                    type="button"
                    id={`pdm-gender-${g.toLowerCase()}`}
                    className={`pdm-gender-btn ${gender === g ? 'pdm-gender-btn--active' : ''}`}
                    onClick={() => {
                      setGender(g);
                      // Live preview — fire immediately so sidebar avatar updates
                      window.dispatchEvent(new CustomEvent('mv_avatar_preview', {
                        detail: { gender: g, age: age || '32' }
                      }));
                    }}
                  >
                    <span className="pdm-gender-icon">
                      {g === 'Male' ? '♂' : g === 'Female' ? '♀' : '⚧'}
                    </span>
                    <span>{g}</span>
                    {gender === g && <UserCheck size={12} className="pdm-gender-check" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="pdm-btn-row">
              <button
                className="pdm-btn pdm-btn--ghost"
                onClick={() => { setStep(1); setError(''); }}
              >
                ← Back
              </button>
              <button
                id="pdm-save-btn"
                className="pdm-btn pdm-btn--primary"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="pdm-spinner" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Check size={16} /> Save Profile
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
