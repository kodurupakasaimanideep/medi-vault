/**
 * localAuth.js — Secure local authentication using Web Crypto API
 *
 * Security:
 *  - Passwords hashed with PBKDF2 (100,000 iterations, SHA-256)
 *    This is the same algorithm used by password managers like LastPass.
 *  - Each user gets a unique cryptographic salt (prevents rainbow table attacks)
 *  - Session tokens are cryptographically random (not predictable)
 *  - Session expires after 7 days of inactivity
 *  - User data stored in localStorage under 'mv_auth_users'
 *  - Session stored under 'mv_auth_session'
 */

const STORAGE_KEY = 'mv_auth_users';
const SESSION_KEY = 'mv_auth_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─────────────────────────────────────────────────────────────────────────────
// Crypto helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Generate a cryptographically random hex string of given byte length */
function randomHex(bytes = 32) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Generate a unique user ID */
function generateUid() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // Fallback for older browsers
  return randomHex(16).replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
}

/**
 * Hash a password using PBKDF2 with a given salt.
 * Returns a hex string.
 */
async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(bits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Timing-safe comparison to prevent timing attacks */
export async function verifyPassword(password, salt, storedHash) {
  const computedHash = await hashPassword(password, salt);
  // Compare character by character to avoid short-circuit timing attack
  if (computedHash.length !== storedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < computedHash.length; i++) {
    diff |= computedHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return diff === 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// User store helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function findUserByEmail(email) {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

/**
 * Find user by Patient ID (e.g. #MV-092855, MV-092855, 092855, or full UID), username, or email.
 */
export function findUserByIdentifier(identifier) {
  if (!identifier) return null;
  const raw = String(identifier).trim();
  const lower = raw.toLowerCase();
  const cleanId = raw.replace(/^#?MV[-_]?/i, '').toUpperCase();

  const users = getUsers();
  // 1. Try matching by short patient ID or full UID
  const byId = users.find(u => {
    const sId = getShortPatientId(u.uid || u.id);
    const fullUid = String(u.uid || u.id || '').toUpperCase();
    return sId === cleanId || fullUid === cleanId || fullUid === raw.toUpperCase();
  });
  if (byId) return byId;

  // 2. Try matching by email or username
  return users.find(
    u => u.email?.toLowerCase() === lower || u.username?.toLowerCase() === lower
  ) || null;
}

export function findUserByEmailOrUsername(identifier) {
  return findUserByIdentifier(identifier);
}

// ─────────────────────────────────────────────────────────────────────────────
// Session helpers
// ─────────────────────────────────────────────────────────────────────────────

function createSession(uid) {
  const session = {
    uid,
    token: randomHex(32),
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getUserByUid(uid) {
  return getUsers().find(u => u.uid === uid) || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new user account.
 * Returns the user profile object (without password fields).
 */
export async function localSignup(displayName, emailOrUsername, password) {
  displayName = displayName.trim();
  emailOrUsername = emailOrUsername.trim();

  // Validation
  if (!displayName || !emailOrUsername || !password) {
    throw new Error('All fields are required.');
  }
  if (displayName.length < 2) {
    throw new Error('Name must be at least 2 characters.');
  }
  if (emailOrUsername.length < 3) {
    throw new Error('Email or username must be at least 3 characters.');
  }
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }
  if (!/[A-Z]/.test(password)) {
    throw new Error('Password must contain at least one uppercase letter.');
  }
  if (!/[0-9]/.test(password)) {
    throw new Error('Password must contain at least one number.');
  }

  // Check for duplicates
  const existing = findUserByEmailOrUsername(emailOrUsername);
  if (existing) {
    throw new Error('An account with this email/username already exists.');
  }

  // Hash password with unique salt
  const salt = randomHex(32);
  const passwordHash = await hashPassword(password, salt);

  const uid = generateUid();
  const now = new Date().toISOString();

  // Determine if identifier looks like an email
  const isEmail = emailOrUsername.includes('@');
  const email = isEmail ? emailOrUsername.toLowerCase() : `${emailOrUsername.toLowerCase()}@local.medivault`;
  const username = emailOrUsername.toLowerCase().replace(/[@.]/g, '_').replace(/\s+/g, '_');
  const isDoctorUser = (
    displayName.trim().toLowerCase().startsWith('dr') ||
    username.toLowerCase().startsWith('dr') ||
    emailOrUsername.trim().toLowerCase().startsWith('dr')
  );

  const newUser = {
    uid,
    email,
    username,
    displayName,
    passwordHash,
    salt,
    role: isDoctorUser ? 'doctor' : 'user',
    isDoctor: isDoctorUser,
    createdAt: now,
    lastLogin: now,
  };

  const users = getUsers();
  users.push(newUser);
  saveUsers(users);

  if (isDoctorUser) {
    localStorage.setItem(`medivault_personal_details_${uid}`, JSON.stringify({
      fullName: displayName,
      role: 'doctor',
      isDoctor: true,
    }));
  }

  // NOTE: We do NOT create a session here.
  // The Login page shows a success screen with credentials first.
  // Session is only created when the user explicitly clicks "Sign In".

  // Return safe profile (no password fields)
  const { passwordHash: _ph, salt: _s, ...safeProfile } = newUser;
  return safeProfile;
}

/**
 * Login with email/username + password.
 * Returns the user profile object.
 */
export async function localLogin(emailOrUsername, password) {
  if (!emailOrUsername || !password) {
    throw new Error('Please enter your email/username and password.');
  }

  const user = findUserByEmailOrUsername(emailOrUsername.trim());

  if (!user) {
    // Deliberate generic message to prevent user enumeration
    throw new Error('Invalid credentials. Please check your email and password.');
  }

  const valid = await verifyPassword(password, user.salt, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid credentials. Please check your email and password.');
  }

  // Check if account is a doctor
  const isDoctorUser = Boolean(
    user.role === 'doctor' ||
    user.isDoctor === true ||
    (user.displayName && user.displayName.toLowerCase().startsWith('dr')) ||
    (user.username && user.username.toLowerCase().startsWith('dr'))
  );
  if (isDoctorUser) {
    user.role = 'doctor';
    user.isDoctor = true;
    localStorage.setItem(`medivault_personal_details_${user.uid}`, JSON.stringify({
      fullName: user.displayName || user.username,
      role: 'doctor',
      isDoctor: true,
    }));
  }

  // Update last login
  const users = getUsers();
  const idx = users.findIndex(u => u.uid === user.uid);
  if (idx !== -1) {
    users[idx].lastLogin = new Date().toISOString();
    if (isDoctorUser) {
      users[idx].role = 'doctor';
      users[idx].isDoctor = true;
    }
    saveUsers(users);
  }

  // Create session
  createSession(user.uid);

  const { passwordHash: _ph, salt: _s, ...safeProfile } = user;
  if (isDoctorUser) {
    safeProfile.role = 'doctor';
    safeProfile.isDoctor = true;
  }
  return safeProfile;
}

export const DEFAULT_DOCTORS = [
  { id: 'DR001', name: 'Dr. Sharma', username: 'drsharma', password: 'Doctor@123' },
  { id: 'DR002', name: 'Dr. Priya', username: 'drpriya', password: 'Priya@456' },
  { id: 'DR003', name: 'Dr. Rajesh', username: 'drrajesh', password: 'Rajesh@789' },
  { id: 'DR004', name: 'Dr. Sterling', username: 'drsterling', password: 'Doctor@123' },
];

/**
 * Doctor Login.
 * Enforces:
 *  1. Username must start with "dr" (e.g. drsharma, drsmith).
 *  2. Supports predefined doctor accounts (drsharma, drpriya, drrajesh).
 *  3. Supports custom doctor accounts.
 *  4. Creates session and logs doctor in with role: 'doctor'.
 */
export async function localDoctorLogin(username, password) {
  const cleanUsername = String(username || '').trim();
  if (!cleanUsername) {
    throw new Error('Please enter your doctor username.');
  }

  // Enforce username starts with "dr" (case-insensitive)
  if (!cleanUsername.toLowerCase().startsWith('dr')) {
    throw new Error('Doctor username must start with "dr" (e.g. drsharma or drsmith).');
  }

  if (!password) {
    throw new Error('Please enter your password.');
  }

  const users = getUsers();
  const lowerUser = cleanUsername.toLowerCase();

  // 1. Check if user already exists in mv_auth_users
  const existingUser = users.find(
    u => u.username?.toLowerCase() === lowerUser || u.email?.toLowerCase() === lowerUser
  );

  if (existingUser) {
    const valid = await verifyPassword(password, existingUser.salt, existingUser.passwordHash);
    if (!valid) {
      throw new Error(`Invalid password for Doctor "${cleanUsername}".`);
    }

    existingUser.role = 'doctor';
    existingUser.isDoctor = true;
    existingUser.lastLogin = new Date().toISOString();
    saveUsers(users);

    // Pre-save personal details so doctor bypasses patient registration
    localStorage.setItem(`medivault_personal_details_${existingUser.uid}`, JSON.stringify({
      fullName: existingUser.displayName || `Dr. ${cleanUsername.replace(/^dr[._\s-]*/i, '')}`,
      role: 'doctor',
      isDoctor: true,
    }));

    createSession(existingUser.uid);
    const { passwordHash: _ph, salt: _s, ...safeProfile } = existingUser;
    safeProfile.role = 'doctor';
    safeProfile.isDoctor = true;
    return safeProfile;
  }

  // 2. Check predefined doctor accounts
  const doctorsList = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem('consult_doctor_accounts'));
      if (Array.isArray(saved) && saved.length) return saved;
    } catch (_) {}
    return DEFAULT_DOCTORS;
  })();

  const matchedDefault = doctorsList.find(
    d => d.username.toLowerCase() === lowerUser
  );

  if (matchedDefault) {
    if (matchedDefault.password !== password) {
      throw new Error('Invalid doctor password. Please check your credentials.');
    }

    const salt = randomHex(32);
    const passwordHash = await hashPassword(password, salt);
    const uid = `dr_${matchedDefault.id.toLowerCase()}_${lowerUser}`;
    const now = new Date().toISOString();

    const doctorProfile = {
      uid,
      email: `${lowerUser}@doctor.medivault`,
      username: lowerUser,
      displayName: matchedDefault.name || `Dr. ${cleanUsername.slice(2)}`,
      passwordHash,
      salt,
      role: 'doctor',
      isDoctor: true,
      createdAt: now,
      lastLogin: now,
    };

    users.push(doctorProfile);
    saveUsers(users);

    localStorage.setItem(`medivault_personal_details_${uid}`, JSON.stringify({
      fullName: doctorProfile.displayName,
      role: 'doctor',
      isDoctor: true,
    }));

    createSession(uid);
    const { passwordHash: _ph, salt: _s, ...safeProfile } = doctorProfile;
    safeProfile.role = 'doctor';
    safeProfile.isDoctor = true;
    return safeProfile;
  }

  // 3. New doctor username (starts with "dr") but not yet created
  if (password.length < 4) {
    throw new Error('Password must be at least 4 characters.');
  }

  const salt = randomHex(32);
  const passwordHash = await hashPassword(password, salt);
  const uid = generateUid();
  const now = new Date().toISOString();
  const nameSuffix = cleanUsername.replace(/^dr[._\s-]*/i, '');
  const formattedName = 'Dr. ' + (nameSuffix.length ? nameSuffix.charAt(0).toUpperCase() + nameSuffix.slice(1) : cleanUsername);

  const newDoc = {
    uid,
    email: `${lowerUser}@doctor.medivault`,
    username: lowerUser,
    displayName: formattedName,
    passwordHash,
    salt,
    role: 'doctor',
    isDoctor: true,
    createdAt: now,
    lastLogin: now,
  };

  users.push(newDoc);
  saveUsers(users);

  localStorage.setItem(`medivault_personal_details_${uid}`, JSON.stringify({
    fullName: newDoc.displayName,
    role: 'doctor',
    isDoctor: true,
  }));

  createSession(uid);
  const { passwordHash: _ph, salt: _s, ...safeProfile } = newDoc;
  safeProfile.role = 'doctor';
  safeProfile.isDoctor = true;
  return safeProfile;
}

/**
 * Log out — clears session.
 */
export function localLogout() {
  clearSession();
}

/**
 * Format a short, clean patient ID string from a user ID or UUID.
 * Example: '0928553e-08ab-4891-9872-591137e34f16' -> '092855'
 * If numeric (e.g. 1): -> '0001'
 */
export function getShortPatientId(userId) {
  if (!userId) return '0001';
  const str = String(userId).trim();
  if (/^\d+$/.test(str)) {
    return str.padStart(4, '0');
  }
  const clean = str.replace(/[^a-zA-Z0-9]/g, '');
  return clean.slice(0, 6).toUpperCase();
}

/**
 * Format raw usernames/emails into clean, friendly human display names.
 * Turns e.g. "saimanideep_gmail_com" -> "Saimanideep", "test_example_com" -> "Test Patient", "dr_sterling" -> "Dr. Sterling".
 */
export function formatHumanDisplayName(userOrName) {
  if (!userOrName) return 'Patient';
  let name = typeof userOrName === 'string' 
    ? userOrName 
    : (userOrName.displayName || userOrName.username || 'Patient');

  if (name.includes('@')) {
    name = name.split('@')[0];
  }

  // Handle doctor prefixes
  if (/^dr[_.]/i.test(name)) {
    const after = name.replace(/^dr[_.]/i, '').trim();
    return `Dr. ${after.charAt(0).toUpperCase() + after.slice(1)}`;
  }

  // Remove trailing email domains
  name = name.replace(/_gmail_com$/i, '')
             .replace(/_yahoo_com$/i, '')
             .replace(/_outlook_com$/i, '')
             .replace(/_example_com$/i, '')
             .replace(/_com$/i, '');

  // Replace underscores and dots with spaces
  name = name.replace(/[_\.-]+/g, ' ').trim();

  if (!name || name.toLowerCase() === 'test') {
    return 'Test Patient';
  }

  // Capitalize words
  return name.split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

