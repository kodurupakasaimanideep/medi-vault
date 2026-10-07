import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Eye, EyeOff, AlertCircle, Mail, KeyRound, User, ArrowRight,
  ShieldCheck, Loader2, Activity, CheckCircle2, Copy, LogIn,
  UserPlus, Lock, Sparkles, Stethoscope
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { initFirebaseSync } from '../services/firebaseSync';
import Scanner from '../components/Scanner';

/* ─── Password strength ─────────────────────────────────────── */
const getPasswordStrength = (password) => {
  const checks = {
    length:     password.length >= 8,
    uppercase:  /[A-Z]/.test(password),
    number:     /[0-9]/.test(password),
    special:    /[^A-Za-z0-9]/.test(password),
    long:       password.length >= 12,
  };
  const score = Object.values(checks).filter(Boolean).length;
  if (score <= 2) return { label: 'Weak',        color: '#ef4444', width: '25%'  };
  if (score <= 3) return { label: 'Fair',         color: '#f59e0b', width: '50%'  };
  if (score <= 4) return { label: 'Strong',       color: '#10b981', width: '75%'  };
  return           { label: 'Very Strong',  color: '#06b6d4', width: '100%' };
};

/* ─── Reusable labelled input ───────────────────────────────── */
function AuthInput({ id, label, type = 'text', value, onChange, placeholder, icon: Icon, rightEl, autoFocus }) {
  return (
    <div className="auth-field">
      <label htmlFor={id} className="auth-label">{label}</label>
      <div className="auth-input-wrap">
        {Icon && <Icon size={16} className="auth-input-icon" />}
        <input
          id={id}
          type={type}
          className="auth-input"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={type === 'password' ? 'current-password' : 'off'}
          autoFocus={autoFocus}
        />
        {rightEl}
      </div>
    </div>
  );
}

/* ─── Credential row shown on success screen ────────────────── */
function CredRow({ label, value, masked, show, onToggle }) {
  const [copied, setCopied] = useState(false);
  const displayed = masked && !show ? '•'.repeat(value.length) : value;

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="cred-row">
      <div className="cred-label">{label}</div>
      <div className="cred-value-wrap">
        <span className="cred-value" style={{ letterSpacing: masked && !show ? '0.15em' : 'normal' }}>
          {displayed}
        </span>
        <div className="cred-actions">
          {masked && (
            <button type="button" className="cred-btn" onClick={onToggle} title={show ? 'Hide' : 'Show'}>
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
          <button type="button" className="cred-btn" onClick={handleCopy} title="Copy">
            {copied ? <CheckCircle2 size={14} color="#4ade80" /> : <Copy size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN LOGIN PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function Login() {
  const { login, signup, doctorLogin, currentUser } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/dashboard';

  /* mode: 'login' | 'signup' | 'doctor' | 'success' */
  const [mode, setMode]                     = useState('login');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName]       = useState('');
  const [doctorUsername, setDoctorUsername] = useState('');
  const [doctorPassword, setDoctorPassword] = useState('');
  const [showPassword, setShowPassword]     = useState(false);
  const [showConfirmPw, setShowConfirmPw]   = useState(false);
  const [showDoctorPw, setShowDoctorPw]     = useState(false);
  const [showCredPw, setShowCredPw]         = useState(false);
  const [error, setError]                   = useState('');
  const [isLoading, setIsLoading]           = useState(false);

  /* stored after successful signup for the success screen */
  const [createdCreds, setCreatedCreds]     = useState(null);

  const passwordStrength = mode === 'signup' ? getPasswordStrength(password) : null;

  /* Redirect if already logged in */
  useEffect(() => {
    if (currentUser) navigate(from, { replace: true });
  }, [currentUser, navigate, from]);

  const resetForm = () => {
    setEmail(''); setPassword(''); setConfirmPassword('');
    setDisplayName(''); setDoctorUsername(''); setDoctorPassword('');
    setError('');
    setShowPassword(false); setShowConfirmPw(false); setShowDoctorPw(false);
  };

  /* ── Login ────────────────────────────────────────────────── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim())  { setError('Please enter your email or username.'); return; }
    if (!password)      { setError('Please enter your password.');          return; }

    setIsLoading(true);
    try {
      const user = await login(email.trim(), password);
      try { await initFirebaseSync(user.uid); } catch (_) {}
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Doctor Login ─────────────────────────────────────────── */
  const handleDoctorLogin = async (e) => {
    e.preventDefault();
    setError('');
    const trimmed = doctorUsername.trim();
    if (!trimmed) {
      setError('Please enter your doctor username.');
      return;
    }

    // Must start with "dr" (e.g. drsharma, drsmith)
    if (!trimmed.toLowerCase().startsWith('dr')) {
      setError('Doctor username must start with "dr" (e.g. drsharma or drsmith).');
      return;
    }

    if (!doctorPassword) {
      setError('Please enter your doctor password.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await doctorLogin(trimmed, doctorPassword);
      try { await initFirebaseSync(user.uid); } catch (_) {}
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.message || 'Invalid doctor credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Signup ───────────────────────────────────────────────── */
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim())           { setError('Please enter your full name.');                          return; }
    if (displayName.trim().length < 2) { setError('Name must be at least 2 characters.');                  return; }
    if (!email.trim())                 { setError('Please enter your email or username.');                  return; }
    if (email.trim().length < 3)       { setError('Email / username must be at least 3 characters.');      return; }
    if (password.length < 8)           { setError('Password must be at least 8 characters.');              return; }
    if (!/[A-Z]/.test(password))       { setError('Password must contain at least one uppercase letter.'); return; }
    if (!/[0-9]/.test(password))       { setError('Password must contain at least one number.');           return; }
    if (password !== confirmPassword)  { setError('Passwords do not match.');                              return; }

    setIsLoading(true);
    try {
      const user = await signup(email.trim(), password, displayName);
      try { await initFirebaseSync(user.uid); } catch (_) {}

      /* Save credentials to show on success screen */
      setCreatedCreds({
        name:     displayName.trim(),
        email:    email.trim(),
        password: password,
      });

      /* Switch to success screen — do NOT auto-navigate yet */
      setMode('success');
    } catch (err) {
      setError(err?.message || 'Failed to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Go to Sign In from success screen ───────────────────── */
  const goToSignIn = () => {
    /* Pre-fill email from the newly created account */
    setEmail(createdCreds?.email || '');
    setPassword('');
    setError('');
    setShowPassword(false);
    setMode('login');
  };

  /* ── Go to dashboard directly (user just signed up, session exists) */
  const goToDashboard = () => navigate('/dashboard', { replace: true });

  /* ── Tab switch ───────────────────────────────────────────── */
  const switchToSignup = () => { resetForm(); setMode('signup'); };
  const switchToLogin  = () => { resetForm(); setMode('login');  };
  const switchToDoctor = () => { resetForm(); setMode('doctor'); };

  /* ══════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════ */
  return (
    <div className="auth-page">
      {/* Animated background with Scanner */}
      <div className="auth-bg">
        <Scanner
          color1="#5227FF"
          color2="#FF9FFC"
          color3="#FFFFFF"
          speed={0.45}
          sweepSpeed={0.22}
          sweepWidth={1.6}
          sweepFalloff={6}
          scale={1.5}
          frequency={2}
          ripple={0.22}
          bandDensity={11}
          lineSharpness={5.5}
          glow={0.25}
          scanDirection="vertical"
          colorSpread={0.7}
          brightness={1.05}
          contrast={1.15}
          softness={1.4}
          vignette={0.45}
          scanline={true}
          grain={true}
          grainIntensity={0.04}
          opacity={1.0}
          mouseInteraction={true}
          mouseRadius={0.5}
          mouseStrength={0.5}
          className="auth-scanner"
        />
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
        <div className="auth-grid" />
      </div>

      <div className="auth-container">

        {/* ── Left branding panel ──────────────────────────── */}
        <div className="auth-left">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <Activity size={28} color="white" />
            </div>
            <h1 className="auth-brand-name">MediVault</h1>
          </div>

          <div className="auth-left-content">
            <h2 className="auth-left-title">
              Your Personal<br />
              <span className="auth-left-accent">Health Vault</span>
            </h2>
            <p className="auth-left-desc">
              Securely manage your medical records, medications,
              diet plans, and health tracking — all in one private,
              encrypted space.
            </p>
            <div className="auth-features">
              {[
                { icon: ShieldCheck, text: 'End-to-end encrypted data'   },
                { icon: User,        text: 'Private per-user accounts'    },
                { icon: Activity,    text: 'Real-time health tracking'    },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="auth-feature-item">
                  <Icon size={16} className="auth-feature-icon" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="auth-left-footer">Made by Saimanideep</div>
        </div>

        {/* ── Right form panel ─────────────────────────────── */}
        <div className="auth-right">

          {/* ════════════════════════════════════════════════
              SUCCESS SCREEN — shown right after signup
              ════════════════════════════════════════════════ */}
          {mode === 'success' && createdCreds && (
            <div className="success-screen">
              {/* Animated checkmark */}
              <div className="success-icon-wrap">
                <div className="success-icon-ring" />
                <div className="success-icon">
                  <CheckCircle2 size={40} color="white" />
                </div>
              </div>

              <h2 className="success-title">Account Created!</h2>
              <p className="success-subtitle">
                Welcome to MediVault, <strong>{createdCreds.name}</strong>. 🎉<br />
                Save your login credentials below — you'll need them to sign in.
              </p>

              {/* Credential card */}
              <div className="cred-card">
                <div className="cred-card-header">
                  <Lock size={14} />
                  <span>Your Login Credentials</span>
                </div>

                <CredRow
                  label="Email / Username"
                  value={createdCreds.email}
                  masked={false}
                />
                <CredRow
                  label="Password"
                  value={createdCreds.password}
                  masked
                  show={showCredPw}
                  onToggle={() => setShowCredPw(v => !v)}
                />
              </div>

              <div className="success-note">
                <ShieldCheck size={13} />
                Your password is securely hashed. This is the only time it is shown.
              </div>

              {/* Action buttons */}
              <div className="success-actions">
                <button
                  className="auth-submit-btn"
                  onClick={goToSignIn}
                  id="go-to-signin-btn"
                >
                  <LogIn size={17} /> Sign In with These Credentials
                </button>
                <button
                  className="success-skip-btn"
                  onClick={goToDashboard}
                  id="go-to-dashboard-btn"
                >
                  <Sparkles size={15} /> Go to Dashboard Directly
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════
              LOGIN / SIGNUP TABS (hidden during success)
              ════════════════════════════════════════════════ */}
          {mode !== 'success' && (
            <>
              {/* Tabs */}
              <div className="auth-tabs">
                <button
                  className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}`}
                  onClick={switchToLogin}
                  type="button"
                  id="tab-signin"
                >
                  <LogIn size={14} style={{ marginRight: 6 }} />Sign In
                </button>
                <button
                  className={`auth-tab ${mode === 'signup' ? 'auth-tab--active' : ''}`}
                  onClick={switchToSignup}
                  type="button"
                  id="tab-signup"
                >
                  <UserPlus size={14} style={{ marginRight: 6 }} />Create Account
                </button>
              </div>

              <div className="auth-form-title">
                {mode === 'login' && (<>Welcome back, <span className="auth-form-accent">Patient</span></>)}
                {mode === 'signup' && (<>Join <span className="auth-form-accent">MediVault</span> Today</>)}
                {mode === 'doctor' && (<>Welcome, <span className="auth-form-accent">Doctor</span> 🩺</>)}
              </div>
              <p className="auth-form-sub">
                {mode === 'login' && 'Enter your email / username and password to sign in'}
                {mode === 'signup' && 'Create your secure personal health account'}
                {mode === 'doctor' && 'Enter your doctor credentials to sign in'}
              </p>

              {/* Error alert */}
              {error && (
                <div className="auth-alert auth-alert--error">
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}

              {/* ── SIGN IN FORM ─────────────────────────── */}
              {mode === 'login' && (
                <form onSubmit={handleLogin} className="auth-form" noValidate>

                  <AuthInput
                    id="login-email"
                    label="Email or Username"
                    type="text"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email or username"
                    icon={Mail}
                    autoFocus
                  />

                  <AuthInput
                    id="login-password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    icon={KeyRound}
                    rightEl={
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowPassword(v => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />

                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={isLoading}
                    id="login-submit"
                  >
                    {isLoading
                      ? <><Loader2 size={18} className="auth-spinner" /> Verifying…</>
                      : <><LogIn size={17} /> Sign In</>
                    }
                  </button>

                  <p className="auth-switch-text">
                    Don't have an account?{' '}
                    <button type="button" className="auth-switch-link" onClick={switchToSignup}>
                      Create one
                    </button>
                  </p>

                  {/* Doctor Portal Quick Access */}
                  <div className="auth-dr-divider">
                    <span>OR HEALTHCARE ACCESS</span>
                  </div>

                  <div className="auth-dr-portal-box">
                    <div className="auth-dr-portal-info">
                      <div className="auth-dr-portal-title">
                        <Stethoscope size={15} color="#38bdf8" /> Doctor Portal
                      </div>
                      <span className="auth-dr-portal-desc">Are you a registered healthcare doctor?</span>
                    </div>
                    <button
                      type="button"
                      className="auth-dr-portal-btn"
                      onClick={switchToDoctor}
                      id="dr-login-from-signin-btn"
                    >
                      <Stethoscope size={14} /> Dr Login &rarr;
                    </button>
                  </div>
                </form>
              )}

              {/* ── CREATE ACCOUNT FORM ───────────────────── */}
              {mode === 'signup' && (
                <form onSubmit={handleSignup} className="auth-form" noValidate>

                  <AuthInput
                    id="signup-name"
                    label="Full Name"
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Enter your full name"
                    icon={User}
                    autoFocus
                  />

                  <AuthInput
                    id="signup-email"
                    label="Email or Username"
                    type="text"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com or a username"
                    icon={Mail}
                  />

                  <AuthInput
                    id="signup-password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 8 chars · 1 uppercase · 1 number"
                    icon={KeyRound}
                    rightEl={
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowPassword(v => !v)}
                        aria-label={showPassword ? 'Hide' : 'Show'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />

                  {/* Password strength bar */}
                  {password.length > 0 && passwordStrength && (
                    <div className="auth-strength">
                      <div className="auth-strength-bar">
                        <div
                          className="auth-strength-fill"
                          style={{ width: passwordStrength.width, background: passwordStrength.color }}
                        />
                      </div>
                      <span className="auth-strength-label" style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}

                  <AuthInput
                    id="signup-confirm-password"
                    label="Confirm Password"
                    type={showConfirmPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    icon={KeyRound}
                    rightEl={
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowConfirmPw(v => !v)}
                        aria-label={showConfirmPw ? 'Hide' : 'Show'}
                      >
                        {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />

                  {/* Password match indicator */}
                  {confirmPassword.length > 0 && (
                    <div className={`auth-match ${password === confirmPassword ? 'auth-match--ok' : 'auth-match--no'}`}>
                      {password === confirmPassword
                        ? <><CheckCircle2 size={13} /><span>Passwords match</span></>
                        : <><AlertCircle  size={13} /><span>Passwords do not match</span></>
                      }
                    </div>
                  )}

                  <p className="auth-policy-note">
                    <ShieldCheck size={12} style={{ display: 'inline', marginRight: 4 }} />
                    Your password is securely hashed and never stored in plain text.
                  </p>

                  <button
                    type="submit"
                    className="auth-submit-btn auth-submit-btn--signup"
                    disabled={isLoading}
                    id="signup-submit"
                  >
                    {isLoading
                      ? <><Loader2 size={18} className="auth-spinner" /> Creating account…</>
                      : <><UserPlus size={17} /> Create Account</>
                    }
                  </button>

                  <p className="auth-switch-text">
                    Already have an account?{' '}
                    <button type="button" className="auth-switch-link" onClick={switchToLogin}>
                      Sign in
                    </button>
                  </p>

                  {/* ── DR LOGIN AT BOTTOM OF CREATE ACCOUNT ── */}
                  <div className="auth-dr-divider">
                    <span>OR HEALTHCARE ACCESS</span>
                  </div>

                  <div className="auth-dr-portal-box">
                    <div className="auth-dr-portal-info">
                      <div className="auth-dr-portal-title">
                        <Stethoscope size={15} color="#38bdf8" /> Doctor Portal
                      </div>
                      <span className="auth-dr-portal-desc">Are you a medical doctor? Sign in to review patient data</span>
                    </div>
                    <button
                      type="button"
                      className="auth-dr-portal-btn"
                      onClick={switchToDoctor}
                      id="dr-login-bottom-create-btn"
                    >
                      <Stethoscope size={14} /> Dr Login &rarr;
                    </button>
                  </div>
                </form>
              )}

              {/* ── DOCTOR SIGN IN FORM ──────────────────── */}
              {mode === 'doctor' && (
                <form onSubmit={handleDoctorLogin} className="auth-form" noValidate>
                  <AuthInput
                    id="doctor-username"
                    label="Doctor Username"
                    type="text"
                    value={doctorUsername}
                    onChange={e => setDoctorUsername(e.target.value)}
                    placeholder="e.g. drsharma or drsmith"
                    icon={Stethoscope}
                    autoFocus
                  />

                  <div className="auth-dr-rule-tag">
                    <ShieldCheck size={13} color="#10b981" />
                    <span>Note: Doctor username must start with <strong>"dr"</strong></span>
                  </div>

                  <AuthInput
                    id="doctor-password"
                    label="Password"
                    type={showDoctorPw ? 'text' : 'password'}
                    value={doctorPassword}
                    onChange={e => setDoctorPassword(e.target.value)}
                    placeholder="Enter doctor password"
                    icon={KeyRound}
                    rightEl={
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowDoctorPw(v => !v)}
                        aria-label={showDoctorPw ? 'Hide password' : 'Show password'}
                      >
                        {showDoctorPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />

                  <button
                    type="submit"
                    className="auth-submit-btn auth-submit-btn--doctor"
                    disabled={isLoading}
                    id="doctor-submit"
                  >
                    {isLoading
                      ? <><Loader2 size={18} className="auth-spinner" /> Verifying Doctor…</>
                      : <><Stethoscope size={17} /> Sign In as Doctor</>
                    }
                  </button>

                  <p className="auth-switch-text">
                    Patient or individual user?{' '}
                    <button type="button" className="auth-switch-link" onClick={switchToLogin}>
                      Patient Sign in
                    </button>
                  </p>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
