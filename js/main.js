/**
 * MedCore HMS - Landing Page Interactivity
 * Sticky navbar, interactive role switcher, live telemetry updates,
 * animated stats counter, and mobile menu.
 */

document.addEventListener('DOMContentLoaded', () => {
  // -------------------------------------------------------------------
  // 1. Sticky Glass Navbar Scroll Effect
  // -------------------------------------------------------------------
  const mainNav = document.getElementById('main-nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      mainNav?.classList.add('scrolled');
    } else {
      mainNav?.classList.remove('scrolled');
    }
  });

  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const navLinksList = document.getElementById('nav-links-list');

  mobileMenuBtn?.addEventListener('click', () => {
    const isVisible = navLinksList.style.display === 'flex';
    if (isVisible) {
      navLinksList.style.display = 'none';
    } else {
      navLinksList.style.display = 'flex';
      navLinksList.style.flexDirection = 'column';
      navLinksList.style.position = 'absolute';
      navLinksList.style.top = '76px';
      navLinksList.style.left = '0';
      navLinksList.style.right = '0';
      navLinksList.style.background = '#0a1128';
      navLinksList.style.padding = '1.5rem';
      navLinksList.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
    }
  });

  // -------------------------------------------------------------------
  // 2. Interactive Role Switcher
  // -------------------------------------------------------------------
  const roleChips = document.querySelectorAll('.role-tab-chip');
  const roleTitle = document.getElementById('role-title');
  const roleDesc = document.getElementById('role-desc');
  const roleBullets = document.getElementById('role-bullets');
  const cardPreviewHeader = document.getElementById('card-preview-header');
  const cardPreviewList = document.getElementById('card-preview-list');

  const roleData = {
    doctor: {
      title: "Dr. Sarah Mitchell — Chief Surgeon",
      desc: "Access immediate longitudinal patient charts, order diagnostic test panels in seconds, write digital prescriptions with allergy checks, and manage surgical lists.",
      bullets: [
        "1-Click access to patient vitals trendline & radiology imagery",
        "Automated drug-to-drug contraindication safety scanner",
        "Instant mobile sign-off on pathology & surgical discharge summaries"
      ],
      header: "Active Consultation Queue",
      cards: [
        { name: "Robert Davis (42y / Male)", desc: "Post-op Cardiac Checkup · Token #14", status: "In Room", color: "#10b981", bg: "#ecfdf5" },
        { name: "Anita Sharma (29y / Female)", desc: "Lab Review (CBC & Lipid Profile) · Token #15", status: "Waiting (4m)", color: "#6366f1", bg: "#e0e7ff" },
        { name: "Marcus Vance (68y / Male)", desc: "Hypertension Follow-up · Token #16", status: "Scheduled", color: "#64748b", bg: "#f1f5f9" }
      ]
    },
    admin: {
      title: "Arthur Vance — Hospital General Director",
      desc: "Command-center visibility over department occupancy, doctor performance, cashflow pipelines, TPA insurance claim settlement velocity, and regulatory ABDM compliance.",
      bullets: [
        "Real-time hospital bed occupancy heatmap across 12 departments",
        "Automated revenue collection & daily billing reconciliation reports",
        "Staff credentialing, role-based security permissions & audit logs"
      ],
      header: "Hospital Command Dashboard",
      cards: [
        { name: "Bed Capacity: 84% Occupied", desc: "42 Beds Occupied · 8 Available (2 ICU, 6 General)", status: "Optimal", color: "#10b981", bg: "#ecfdf5" },
        { name: "Daily Revenue: $48,250", desc: "189 Invoices Settled · 94% Cashless Insurance", status: "+18% Target", color: "#6366f1", bg: "#e0e7ff" },
        { name: "Staff On Duty: 124 Personnel", desc: "28 Doctors, 64 Nurses, 14 Lab Techs, 18 Admin", status: "Full Shift", color: "#0ea5e9", bg: "#e0f2fe" }
      ]
    },
    nurse: {
      title: "Elena Chen, RN — Head of ICU & Inpatient Wards",
      desc: "Effortlessly record patient vitals directly from bedside monitors, schedule medication administration doses, and coordinate seamless doctor shift handoffs.",
      bullets: [
        "Bedside vital recording synced directly into physician EMR",
        "Interactive medication administration chart with barcode safety",
        "Emergency nurse call alarm & instant doctor dispatch buzzer"
      ],
      header: "ICU Ward Ward Station (Bed 10-18)",
      cards: [
        { name: "Bed 14: David Miller (58y)", desc: "Vitals: BP 122/80 · SpO2 98% · IV Infusion Active", status: "Stable", color: "#10b981", bg: "#ecfdf5" },
        { name: "Bed 12: Clara Evans (72y)", desc: "Medication Due: Cefazolin 1g IV at 19:00", status: "Due in 15m", color: "#f59e0b", bg: "#fef3c7" },
        { name: "Bed 16: New Admission Incoming", desc: "Transfer from Emergency Triage (Orthopedic)", status: "Bed Ready", color: "#6366f1", bg: "#e0e7ff" }
      ]
    },
    pharmacist: {
      title: "David Ross, RPh — Chief Pharmacist & Inventory Lead",
      desc: "Process digital prescriptions straight from physician consoles, track batch lot expiry dates, and maintain optimal formulary stock levels automatically.",
      bullets: [
        "Auto-receipt of verified digital e-prescriptions with barcode labels",
        "Dynamic low-stock threshold triggers & automated PO creation",
        "30/60/90 day expiry early warning radar system"
      ],
      header: "Pharmacy Dispensing Console",
      cards: [
        { name: "Rx #8492: Amoxicillin + Clavulanate", desc: "For: Robert Davis · Prescribed by Dr. Mitchell", status: "Ready to Dispense", color: "#10b981", bg: "#ecfdf5" },
        { name: "Low Stock Alert: Paracetamol IV 100ml", desc: "Current: 14 units · Reorder threshold: 30 units", status: "PO Dispatched", color: "#ef4444", bg: "#fee2e2" },
        { name: "Batch Expiry: Atorvastatin 20mg (Batch B-901)", desc: "Expires in 45 days · 120 strips in stock", status: "Priority Dispense", color: "#f59e0b", bg: "#fef3c7" }
      ]
    },
    patient: {
      title: "Self-Service Patient Portal & ABHA Hub",
      desc: "Empower patients with instant access to their ABDM digital health records, diagnostic lab reports, doctor appointments, and online contactless payments.",
      bullets: [
        "Unified Ayushman Bharat Health Account (ABHA) record locker",
        "Download certified diagnostic lab PDFs the moment they are signed",
        "1-Click telehealth video appointments & medication reminders"
      ],
      header: "My MedCore Portal",
      cards: [
        { name: "Lab Report Ready: Complete Blood Count", desc: "Verified by Dr. Priya Nair, MD (Pathology)", status: "Download PDF", color: "#10b981", bg: "#ecfdf5" },
        { name: "Upcoming Appointment: Cardiology Consult", desc: "Tomorrow at 10:30 AM · Dr. Sarah Mitchell", status: "Confirmed", color: "#6366f1", bg: "#e0e7ff" },
        { name: "ABHA Card Linked: 91-4829-1049-5582", desc: "Connected with National Health Authority Network", status: "Active M2", color: "#0ea5e9", bg: "#e0f2fe" }
      ]
    }
  };

  roleChips.forEach(chip => {
    chip.addEventListener('click', () => {
      roleChips.forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-selected', 'false');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-selected', 'true');

      const roleId = chip.dataset.roleId;
      const data = roleData[roleId];
      if (!data) return;

      // Animate content change
      if (roleTitle) roleTitle.textContent = data.title;
      if (roleDesc) roleDesc.textContent = data.desc;

      if (roleBullets) {
        roleBullets.innerHTML = data.bullets.map(bullet => `
          <li class="role-bullet-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>${bullet}</span>
          </li>
        `).join('');
      }

      if (cardPreviewHeader) cardPreviewHeader.textContent = data.header;

      if (cardPreviewList) {
        cardPreviewList.innerHTML = data.cards.map(card => `
          <div style="padding: 0.75rem; background: #f8fafc; border-radius: 8px; border-left: 3px solid ${card.color}; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 700; font-size: 0.85rem;">${card.name}</div>
              <div style="font-size: 0.76rem; color: #64748b;">${card.desc}</div>
            </div>
            <span style="font-size: 0.75rem; font-weight: 600; color: ${card.color}; background: ${card.bg}; padding: 2px 8px; border-radius: 99px;">${card.status}</span>
          </div>
        `).join('');
      }
    });
  });

  // -------------------------------------------------------------------
  // 3. Subtle Live Telemetry Updates (Simulating Live Hospital System)
  // -------------------------------------------------------------------
  const telBeds = document.getElementById('tel-beds');
  const telAppts = document.getElementById('tel-appts');
  const telPharm = document.getElementById('tel-pharm');

  let apptCount = 142;
  let pharmCount = 389;

  setInterval(() => {
    if (telAppts && Math.random() > 0.4) {
      apptCount += 1;
      telAppts.textContent = `${apptCount} Consultations`;
    }
    if (telPharm && Math.random() > 0.4) {
      pharmCount += 1;
      telPharm.textContent = `${pharmCount} Verified`;
    }
  }, 7000);
});
