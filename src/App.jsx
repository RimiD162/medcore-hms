import React, { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import MetricsBar from './components/MetricsBar';
import ModularFeaturesSection from './components/ModularFeaturesSection';
import RoleWorkspacesSection from './components/RoleWorkspacesSection';
import CtaSection from './components/CtaSection';
import Footer from './components/Footer';
import BookDemoModal from './components/BookDemoModal';
import ExploreModulesModal from './components/ExploreModulesModal';
import ContactModal from './components/ContactModal';

export default function App() {
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [modulesModalOpen, setModulesModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedCategoryForModal, setSelectedCategoryForModal] = useState('all');

  const handleOpenModules = (categoryId = 'all') => {
    setSelectedCategoryForModal(categoryId);
    setModulesModalOpen(true);
  };

  const handleSelectMetric = (metricKey) => {
    if (metricKey === 'modules' || metricKey === 'phases' || metricKey === 'audit') {
      handleOpenModules('all');
    } else if (metricKey === 'roles') {
      const el = document.getElementById('roles');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavigateSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="medcore-app-layout">
      {/* Top Fixed / Sticky Navigation */}
      <Navbar 
        onOpenDemo={() => setDemoModalOpen(true)}
        onOpenModules={() => handleOpenModules('all')}
        onOpenContact={() => setContactModalOpen(true)}
        onNavigateSection={handleNavigateSection}
      />

      <main>
        {/* Hero Section (Image 1) */}
        <HeroSection 
          onOpenDemo={() => setDemoModalOpen(true)}
          onOpenModules={() => handleOpenModules('all')}
        />

        {/* Metrics Banner Section (Image 2) */}
        <MetricsBar 
          onSelectMetric={handleSelectMetric}
        />

        {/* Modular Architecture Breakdown (Image 2 & 3) */}
        <ModularFeaturesSection 
          onOpenModules={() => handleOpenModules('all')}
          onSelectCategory={(catId) => handleOpenModules(catId)}
        />

        {/* Role-Based Workspaces & Simulator (Image 4) */}
        <RoleWorkspacesSection />

        {/* Enterprise Call To Action (Image 5) */}
        <CtaSection 
          onOpenDemo={() => setDemoModalOpen(true)}
          onOpenContact={() => setContactModalOpen(true)}
        />
      </main>

      {/* Footer (Image 5) */}
      <Footer 
        onOpenModules={() => handleOpenModules('all')}
        onOpenContact={() => setContactModalOpen(true)}
        onNavigateSection={handleNavigateSection}
      />

      {/* Interactive Modals */}
      <BookDemoModal 
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />

      <ExploreModulesModal 
        isOpen={modulesModalOpen}
        onClose={() => setModulesModalOpen(false)}
        initialCategoryId={selectedCategoryForModal}
        onOpenDemo={() => setDemoModalOpen(true)}
      />

      <ContactModal 
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />
    </div>
  );
}
