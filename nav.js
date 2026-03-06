// ============================================================
//  nav.js — Shared session guard + navigation
//  Include this in every admin page with: <script src="nav.js"></script>
// ============================================================

// ── SESSION GUARD ─────────────────────────────────────────
// If not logged in, redirect to portal login page
(function () {
  if (sessionStorage.getItem('mariaAuth') !== 'true') {
    window.location.href = 'portal.html';
  }
})();

// ── LOGOUT ────────────────────────────────────────────────
function logout() {
  sessionStorage.removeItem('mariaAuth');
  window.location.href = 'portal.html';
}

// ── RENDER SHARED NAV ─────────────────────────────────────
// Call this after DOM loads: renderNav('dashboard')
// Pass the current page key so the active tab highlights
function renderNav(activePage) {
  const pages = [
    { key: 'dashboard',  label: '📊 Overview',    href: 'dashboard.html' },
    { key: 'add-job',    label: '➕ Add Job',       href: 'admin.html' },
    { key: 'jobs',       label: '📋 Job Records',  href: 'jobs.html' },
    { key: 'staff',      label: '👷 Staff',         href: 'staff.html' },
    { key: 'invoice',    label: '🧾 Invoice',       href: 'invoice.html' },
    { key: 'estimate',   label: '📝 Estimate',      href: 'estimate.html' },
  ];

  const navHtml = `
    <nav class="admin-nav" id="main-nav">
      <div class="nav-logo">
        <img src="logo.png" alt="Logo"/>
        <div class="nav-logo-text">Maria Electro Tech <small>Admin Portal</small></div>
      </div>
      <div class="admin-nav-links" id="nav-links">
        ${pages.map(p => `
          <a href="${p.href}" class="${p.key === activePage ? 'active' : ''}">
            ${p.label}
          </a>`).join('')}
        <a href="#" onclick="logout()" style="color:#EF4444;">🚪 Logout</a>
      </div>
      <button class="nav-hamburger" onclick="toggleMobileNav()" id="hamburger">☰</button>
    </nav>
    <div class="nav-mobile-overlay" id="mobile-overlay" onclick="closeMobileNav()"></div>
    <div class="nav-mobile-drawer" id="mobile-drawer">
      <div style="padding:20px 20px 10px; border-bottom:1px solid rgba(61,184,232,0.2); display:flex; align-items:center; gap:10px;">
        <img src="logo.png" style="height:36px;"/>
        <div style="font-family:'Nunito',sans-serif; font-weight:900; font-size:15px; color:var(--blue);">Maria Electro Tech</div>
      </div>
      ${pages.map(p => `
        <a href="${p.href}" class="mobile-nav-link ${p.key === activePage ? 'active' : ''}">
          ${p.label}
        </a>`).join('')}
      <a href="#" onclick="logout()" class="mobile-nav-link" style="color:#EF4444;">🚪 Logout</a>
    </div>`;

  // Insert before body content
  document.body.insertAdjacentHTML('afterbegin', navHtml);
}

function toggleMobileNav() {
  document.getElementById('mobile-drawer').classList.toggle('open');
  document.getElementById('mobile-overlay').classList.toggle('open');
}

function closeMobileNav() {
  document.getElementById('mobile-drawer').classList.remove('open');
  document.getElementById('mobile-overlay').classList.remove('open');
}
