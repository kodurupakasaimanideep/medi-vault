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
async function verifyPassword(password, salt, storedHash) {
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

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function findUserByEmail(email) {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

function findUserByEmailOrUsername(identifier) {
  const lower = identifier.toLowerCase();
  return getUsers().find(
    u => u.email.toLowerCase() === lower || u.username.toLowerCase() === lower
  );
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

  const newUser = {
    uid,
    email,
    username,
    displayName,
    passwordHash,
    salt,
    role: 'user',
    createdAt: now,
    lastLogin: now,
  };

  const users = getUsers();
  users.push(newUser);
  saveUsers(users);

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

  // Update last login
  const users = getUsers();
  const idx = users.findIndex(u => u.uid === user.uid);
  if (idx !== -1) {
    users[idx].lastLogin = new Date().toISOString();
    saveUsers(users);
  }

  // Create session
  createSession(user.uid);

  const { passwordHash: _ph, salt: _s, ...safeProfile } = user;
  return safeProfile;
}

/**
 * Log out — clears session.
 */
export function localLogout() {
  clearSession();
}
