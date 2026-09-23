/**
 * MedCore HMS - Authentication Logic
 * Interactive tabs, password visibility, form validation, 1-click demo accounts,
 * simulated loading, and toast notifications.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Tabs
  const tabBtnSignIn = document.getElementById('tab-btn-signin');
  const tabBtnRegister = document.getElementById('tab-btn-register');
  const tabBtnDemo = document.getElementById('tab-btn-demo');

  const paneSignIn = document.getElementById('pane-signin');
  const paneRegister = document.getElementById('pane-register');
  const paneDemo = document.getElementById('pane-demo');

  const authHeaderTitle = document.getElementById('auth-header-title');
  const authHeaderSubtitle = document.getElementById('auth-header-subtitle');

  // DOM Elements - Forms & Inputs
  const formSignIn = document.getElementById('form-signin');
  const formRegister = document.getElementById('form-register');
  const inputEmail = document.getElementById('signin-email');
  const inputPassword = document.getElementById('signin-password');
  const btnSubmitSignIn = document.getElementById('btn-submit-signin');
  const btnSubmitRegister = document.getElementById('btn-submit-register');

  // Password Visibility
  const togglePasswordBtn = document.getElementById('toggle-password-btn');
  const eyeIconOpen = document.getElementById('eye-icon-open');
  const eyeIconClosed = document.getElementById('eye-icon-closed');

  // Modals
  const btnForgotPassword = document.getElementById('btn-forgot-password');
  const modalForgot = document.getElementById('modal-forgot-password');
  const btnCloseForgot = document.getElementById('btn-close-forgot');
  const formForgot = document.getElementById('form-forgot-modal');

  const modalDash = document.getElementById('modal-dashboard-preview');
  const btnCloseDash = document.getElementById('btn-close-dash');
  const btnDashAction = document.getElementById('btn-dash-action');

  const toastContainer = document.getElementById('toast-container');

  // Active state
  let currentRole = 'Chief Doctor';
  let currentUserName = 'Dr. Sarah Mitchell';

  // -------------------------------------------------------------------
  // 1. Tab Switching Logic
  // -------------------------------------------------------------------
  function switchTab(activeBtn, targetPane, title, subtitle) {
    [tabBtnSignIn, tabBtnRegister, tabBtnDemo].forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });
    [paneSignIn, paneRegister, paneDemo].forEach(pane => {
      pane.style.display = 'none';
      pane.classList.remove('active');
    });

    activeBtn.classList.add('active');
    activeBtn.setAttribute('aria-selected', 'true');
    targetPane.style.display = 'block';
    targetPane.classList.add('active');

    authHeaderTitle.textContent = title;
    authHeaderSubtitle.textContent = subtitle;
  }

  tabBtnSignIn?.addEventListener('click', () => {
    switchTab(tabBtnSignIn, paneSignIn, 'Welcome back', 'Sign in to your MedCore workspace');
  });

  tabBtnRegister?.addEventListener('click', () => {
    switchTab(tabBtnRegister, paneRegister, 'Register Hospital', 'Create a new clinical enterprise workspace');
  });

  tabBtnDemo?.addEventListener('click', () => {
    switchTab(tabBtnDemo, paneDemo, 'Quick Staff Access', 'Choose a verified clinical role to explore');
  });

  // -------------------------------------------------------------------
  // 2. Password Visibility Toggle
  // -------------------------------------------------------------------
  togglePasswordBtn?.addEventListener('click', () => {
    const isPassword = inputPassword.getAttribute('type') === 'password';
    inputPassword.setAttribute('type', isPassword ? 'text' : 'password');
    if (isPassword) {
      eyeIconOpen.style.display = 'none';
      eyeIconClosed.style.display = 'block';
    } else {
      eyeIconOpen.style.display = 'block';
      eyeIconClosed.style.display = 'none';
    }
  });

  // -------------------------------------------------------------------
  // 3. 1-Click Demo Profiles Selector
  // -------------------------------------------------------------------
  const demoRoleCards = document.querySelectorAll('.demo-role-card');
  demoRoleCards.forEach(card => {
    card.addEventListener('click', () => {
      const email = card.dataset.email;
      const role = card.dataset.role;
      const name = card.dataset.name;

      currentRole = role;
      currentUserName = name;

      // Switch back to sign-in tab with values pre-populated
      switchTab(tabBtnSignIn, paneSignIn, 'Welcome back', `Signing in as ${name}`);
      inputEmail.value = email;
      inputPassword.value = 'hospital@demo2026';

      showToast(`Selected: ${name} (${role})`, 'info');

      // Auto submit with small delay
      setTimeout(() => {
        executeSignIn(email, role, name);
      }, 400);
    });
  });

  // -------------------------------------------------------------------
  // 4. Sign-in Form Submission & Simulated Loading
  // -------------------------------------------------------------------
  formSignIn?.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailVal = inputEmail.value.trim();
    const passVal = inputPassword.value.trim();

    if (!emailVal || !emailVal.includes('@')) {
      showToast('Please enter a valid hospital email address', 'error');
      inputEmail.focus();
      return;
    }
    if (!passVal || passVal.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      inputPassword.focus();
      return;
    }

    executeSignIn(emailVal, currentRole, currentUserName);
  });

  function executeSignIn(email, role, name) {
    btnSubmitSignIn.classList.add('loading');
    btnSubmitSignIn.disabled = true;

    showToast('Authenticating with ABDM Health ID Gateway...', 'info');

    setTimeout(() => {
      btnSubmitSignIn.classList.remove('loading');
      btnSubmitSignIn.disabled = false;

      showToast(`Access Granted! Welcome back, ${name || 'Doctor'}`, 'success');

      // Update Modal content with role
      updateDashboardModal(name || 'Dr. Sarah Mitchell', role || 'Chief Doctor');
      modalDash.classList.add('active');
    }, 900);
  }

  function updateDashboardModal(name, role) {
    const titleEl = document.getElementById('modal-dash-title');
    const roleEl = document.getElementById('dash-user-role');
    const avatarEl = document.getElementById('dash-avatar');

    if (titleEl) titleEl.textContent = `Welcome, ${name}!`;
    if (roleEl) roleEl.textContent = `Active Session: ${role} · Unit 4`;

    if (avatarEl) {
      if (role.toLowerCase().includes('doctor') || role.toLowerCase().includes('surgeon')) {
        avatarEl.textContent = '🩺';
      } else if (role.toLowerCase().includes('admin') || role.toLowerCase().includes('director')) {
        avatarEl.textContent = '🏥';
      } else if (role.toLowerCase().includes('nurse')) {
        avatarEl.textContent = '💉';
      } else if (role.toLowerCase().includes('pharm')) {
        avatarEl.textContent = '💊';
      } else {
        avatarEl.textContent = '👨‍⚕️';
      }
    }
  }

  // -------------------------------------------------------------------
  // 5. Register Hospital Form Submission
  // -------------------------------------------------------------------
  formRegister?.addEventListener('submit', (e) => {
    e.preventDefault();
    const hospName = document.getElementById('reg-hosp-name').value.trim();
    const regEmail = document.getElementById('reg-email').value.trim();
    const regRole = document.getElementById('reg-role').value;

    if (!hospName) {
      showToast('Please provide your Hospital or Facility name', 'error');
      return;
    }
    if (!regEmail || !regEmail.includes('@')) {
      showToast('Please provide a valid official email', 'error');
      return;
    }

    btnSubmitRegister.classList.add('loading');
    btnSubmitRegister.disabled = true;

    setTimeout(() => {
      btnSubmitRegister.classList.remove('loading');
      btnSubmitRegister.disabled = false;

      showToast(`Facility "${hospName}" Registered! ABDM Facility ID Assigned.`, 'success');
      updateDashboardModal(hospName + ' Admin', 'Hospital Administrator');
      modalDash.classList.add('active');
    }, 1000);
  });

  // -------------------------------------------------------------------
  // 6. Modals & Dialog Handlers
  // -------------------------------------------------------------------
  btnForgotPassword?.addEventListener('click', () => {
    modalForgot.classList.add('active');
  });

  btnCloseForgot?.addEventListener('click', () => {
    modalForgot.classList.remove('active');
  });

  formForgot?.addEventListener('submit', (e) => {
    e.preventDefault();
    const forgotEmail = document.getElementById('forgot-email').value.trim();
    if (!forgotEmail) {
      showToast('Please enter your registered email', 'error');
      return;
    }
    modalForgot.classList.remove('active');
    showToast(`Passkey reset link sent to ${forgotEmail}`, 'success');
  });

  btnCloseDash?.addEventListener('click', () => {
    modalDash.classList.remove('active');
  });

  btnDashAction?.addEventListener('click', () => {
    showToast('Launching Full MedCore HMS Workspace...', 'info');
    setTimeout(() => {
      window.location.href = 'index.html#solutions';
    }, 700);
  });

  // Close modals on clicking outside the card
  window.addEventListener('click', (e) => {
    if (e.target === modalForgot) modalForgot.classList.remove('active');
    if (e.target === modalDash) modalDash.classList.remove('active');
  });

  // -------------------------------------------------------------------
  // 7. Toast Notification Utility
  // -------------------------------------------------------------------
  function showToast(message, type = 'info', duration = 3800) {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    } else {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `
      <div style="flex-shrink:0;">${iconSvg}</div>
      <div style="flex:1; line-height: 1.4;">${message}</div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'all 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px) scale(0.95)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
});
