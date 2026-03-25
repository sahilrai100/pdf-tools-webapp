// Auth state management
const Auth = (() => {
  const TOKEN_KEY = 'pdftools_token';
  const USER_KEY  = 'pdftools_user';

  function getToken()  { return localStorage.getItem(TOKEN_KEY); }
  function getUser()   { const u = localStorage.getItem(USER_KEY); return u ? JSON.parse(u) : null; }
  function isLoggedIn(){ return !!getToken(); }

  function save(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    updateHeaderUI();
  }

  async function register(name, email, password) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return res.json();
  }

  async function login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  }

  function updateHeaderUI() {
    const loginBtn  = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const userMenu  = document.getElementById('userMenu');
    const userName  = document.getElementById('userName');

    if (!loginBtn) return;

    const user = getUser();
    if (isLoggedIn() && user) {
      loginBtn.style.display  = 'none';
      signupBtn.style.display = 'none';
      if (userMenu)  userMenu.style.display  = 'flex';
      if (userName)  userName.textContent = user.name.split(' ')[0];
    } else {
      loginBtn.style.display  = '';
      signupBtn.style.display = '';
      if (userMenu)  userMenu.style.display  = 'none';
    }
  }

  return { getToken, getUser, isLoggedIn, save, logout, register, login, updateHeaderUI };
})();

// ─── Validation helpers ──────────────────────────────────────────────────────

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function getPasswordStrength(password) {
  const checks = {
    length:    password.length >= 7,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    digit:     /[0-9]/.test(password),
    special:   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return { checks, passed, total: 5, valid: passed === 5 };
}

// ─── Modal logic ─────────────────────────────────────────────────────────────

function openAuthModal(tab = 'login') {
  document.getElementById('authModal').classList.add('open');
  switchTab(tab);
  clearErrors();
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('open');
  clearErrors();
}

function switchTab(tab) {
  document.getElementById('loginForm').style.display  = tab === 'login'  ? 'flex' : 'none';
  document.getElementById('signupForm').style.display = tab === 'signup' ? 'flex' : 'none';
  document.getElementById('tabLogin').classList.toggle('active',  tab === 'login');
  document.getElementById('tabSignup').classList.toggle('active', tab === 'signup');
  clearErrors();
}

function clearErrors() {
  document.getElementById('authError').textContent = '';
  // Remove field-level errors
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  document.querySelectorAll('.auth-field input').forEach(el => el.classList.remove('input-error', 'input-valid'));
  // Hide password requirements
  const pwReq = document.getElementById('passwordRequirements');
  if (pwReq) pwReq.style.display = 'none';
}

function showAuthError(msg) {
  document.getElementById('authError').textContent = msg;
}

function showFieldError(fieldId, msg) {
  const input = document.getElementById(fieldId);
  const errorEl = input?.parentElement?.querySelector('.field-error');
  if (errorEl) errorEl.textContent = msg;
  if (input) {
    input.classList.remove('input-valid');
    input.classList.add('input-error');
  }
}

function clearFieldError(fieldId) {
  const input = document.getElementById(fieldId);
  const errorEl = input?.parentElement?.querySelector('.field-error');
  if (errorEl) errorEl.textContent = '';
  if (input) input.classList.remove('input-error');
}

function markFieldValid(fieldId) {
  const input = document.getElementById(fieldId);
  if (input) {
    input.classList.remove('input-error');
    input.classList.add('input-valid');
  }
}

// ─── Real-time validation ────────────────────────────────────────────────────

function setupRealtimeValidation() {
  // Email validation (both login and signup)
  ['loginEmail', 'signupEmail'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('blur', () => {
      const val = el.value.trim();
      if (val && !isValidEmail(val)) {
        showFieldError(id, 'Enter a valid email (e.g. user@example.com)');
      } else if (val) {
        clearFieldError(id);
        markFieldValid(id);
      }
    });
    el.addEventListener('input', () => {
      if (el.classList.contains('input-error') && isValidEmail(el.value.trim())) {
        clearFieldError(id);
        markFieldValid(id);
      }
    });
  });

  // Signup name validation
  const nameEl = document.getElementById('signupName');
  if (nameEl) {
    nameEl.addEventListener('blur', () => {
      const val = nameEl.value.trim();
      if (val && val.length < 2) {
        showFieldError('signupName', 'Name must be at least 2 characters');
      } else if (val) {
        clearFieldError('signupName');
        markFieldValid('signupName');
      }
    });
  }

  // Password strength checker
  const pwEl = document.getElementById('signupPassword');
  if (pwEl) {
    pwEl.addEventListener('focus', () => {
      const req = document.getElementById('passwordRequirements');
      if (req) req.style.display = 'block';
    });
    pwEl.addEventListener('input', () => {
      updatePasswordStrength(pwEl.value);
    });
  }
}

function updatePasswordStrength(password) {
  const { checks, passed, total } = getPasswordStrength(password);
  const reqEl = document.getElementById('passwordRequirements');
  if (!reqEl) return;

  reqEl.style.display = password ? 'block' : 'none';

  // Update each requirement indicator
  const items = reqEl.querySelectorAll('.pw-req-item');
  const keys = ['length', 'lowercase', 'uppercase', 'digit', 'special'];
  items.forEach((item, i) => {
    const met = checks[keys[i]];
    item.classList.toggle('met', met);
    item.classList.toggle('unmet', !met);
  });

  // Update strength bar
  const bar = document.getElementById('strengthBar');
  const label = document.getElementById('strengthLabel');
  if (bar) {
    const pct = (passed / total) * 100;
    bar.style.width = pct + '%';
    bar.className = 'strength-bar-fill';
    if (passed <= 2) { bar.classList.add('weak'); }
    else if (passed <= 4) { bar.classList.add('medium'); }
    else { bar.classList.add('strong'); }
  }
  if (label) {
    if (passed <= 2) label.textContent = 'Weak';
    else if (passed <= 4) label.textContent = 'Medium';
    else label.textContent = 'Strong';
  }

  // Update field border
  if (passed === total) {
    clearFieldError('signupPassword');
    markFieldValid('signupPassword');
  } else {
    const input = document.getElementById('signupPassword');
    if (input) input.classList.remove('input-valid');
  }
}

// ─── Form handlers ───────────────────────────────────────────────────────────

async function handleLogin(e) {
  e.preventDefault();
  showAuthError('');

  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn      = document.getElementById('loginSubmitBtn');

  // Client-side validation
  let hasError = false;

  if (!email) {
    showFieldError('loginEmail', 'Email is required');
    hasError = true;
  } else if (!isValidEmail(email)) {
    showFieldError('loginEmail', 'Enter a valid email address');
    hasError = true;
  }

  if (!password) {
    showFieldError('loginPassword', 'Password is required');
    hasError = true;
  }

  if (hasError) return;

  btn.disabled = true;
  btn.textContent = 'Logging in...';

  try {
    const data = await Auth.login(email, password);
    btn.disabled = false;
    btn.textContent = 'Log In';

    if (!data.success) return showAuthError(data.error);

    Auth.save(data.token, data.user);
    closeAuthModal();
    Auth.updateHeaderUI();
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Log In';
    showAuthError('Network error. Check your connection and try again.');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  showAuthError('');

  const name     = document.getElementById('signupName').value.trim();
  const email    = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const btn      = document.getElementById('signupSubmitBtn');

  // Client-side validation
  let hasError = false;

  if (!name) {
    showFieldError('signupName', 'Name is required');
    hasError = true;
  } else if (name.length < 2) {
    showFieldError('signupName', 'Name must be at least 2 characters');
    hasError = true;
  }

  if (!email) {
    showFieldError('signupEmail', 'Email is required');
    hasError = true;
  } else if (!isValidEmail(email)) {
    showFieldError('signupEmail', 'Enter a valid email (e.g. user@example.com)');
    hasError = true;
  }

  const pwStrength = getPasswordStrength(password);
  if (!password) {
    showFieldError('signupPassword', 'Password is required');
    hasError = true;
  } else if (!pwStrength.valid) {
    const missing = [];
    if (!pwStrength.checks.length)    missing.push('7+ characters');
    if (!pwStrength.checks.lowercase) missing.push('lowercase letter');
    if (!pwStrength.checks.uppercase) missing.push('uppercase letter');
    if (!pwStrength.checks.digit)     missing.push('digit');
    if (!pwStrength.checks.special)   missing.push('special character');
    showFieldError('signupPassword', 'Missing: ' + missing.join(', '));
    hasError = true;
  }

  if (hasError) return;

  btn.disabled = true;
  btn.textContent = 'Creating account...';

  try {
    const data = await Auth.register(name, email, password);
    btn.disabled = false;
    btn.textContent = 'Create Account';

    if (!data.success) return showAuthError(data.error);

    Auth.save(data.token, data.user);
    closeAuthModal();
    Auth.updateHeaderUI();
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Create Account';
    showAuthError('Network error. Check your connection and try again.');
  }
}

// ─── Init on DOMContentLoaded ────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  Auth.updateHeaderUI();

  // Button wiring
  document.getElementById('loginBtn')?.addEventListener('click',  () => openAuthModal('login'));
  document.getElementById('signupBtn')?.addEventListener('click', () => openAuthModal('signup'));
  document.getElementById('logoutBtn')?.addEventListener('click', () => Auth.logout());
  document.getElementById('modalClose')?.addEventListener('click', closeAuthModal);
  document.getElementById('tabLogin')?.addEventListener('click',  () => switchTab('login'));
  document.getElementById('tabSignup')?.addEventListener('click', () => switchTab('signup'));
  document.getElementById('loginForm')?.addEventListener('submit',  handleLogin);
  document.getElementById('signupForm')?.addEventListener('submit', handleRegister);

  // Close on backdrop click
  document.getElementById('authModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'authModal') closeAuthModal();
  });

  // Setup real-time validation
  setupRealtimeValidation();
});
