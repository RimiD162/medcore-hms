# MedCore HMS - Enterprise Hospital Management System

MedCore HMS is an enterprise-grade Hospital Management System frontend built with React, Vite, and modern CSS design tokens, faithfully implementing the design from the platform architecture specifications.

## 📁 Project Structure

```
medcore-hms/
├── frontend/                     # Frontend application directory
│   ├── public/
│   │   └── assets/               # Medical photography & high-res assets
│   │       ├── doctor-hero.jpg
│   │       └── hospital-team.jpg
│   ├── src/
│   │   ├── components/           # UI Components
│   │   │   ├── Navbar.jsx
│   │   │   ├── HeroSection.jsx
│   │   │   ├── MetricsBar.jsx
│   │   │   ├── ModularFeaturesSection.jsx
│   │   │   ├── RoleWorkspacesSection.jsx
│   │   │   ├── InteractiveRolePreview.jsx
│   │   │   ├── CtaSection.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── BookDemoModal.jsx
│   │   │   ├── ExploreModulesModal.jsx
│   │   │   └── ContactModal.jsx
│   │   ├── data/                 # Datasets & Mock Simulators
│   │   │   ├── modulesData.js    # All 23 modules across 4 categories & phases
│   │   │   └── rolesData.js      # 5 Hospital roles with live simulator queues
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🚀 Getting Started

### 1. Navigate to the frontend directory
```bash
cd frontend
```

### 2. Install dependencies (if not already installed)
```bash
npm install
```

### 3. Run the development server
```bash
npm run dev
```

### 4. Build for production
```bash
npm run build
```
