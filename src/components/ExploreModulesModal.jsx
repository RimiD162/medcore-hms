import React, { useState } from 'react';
import { X, Search, Check, Layers, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { modulesCategories } from '../data/modulesData';

export default function ExploreModulesModal({ isOpen, onClose, initialCategoryId, onOpenDemo }) {
  const [selectedCat, setSelectedCat] = useState(initialCategoryId || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Flatten or filter modules
  const allModules = modulesCategories.flatMap(cat => 
    cat.items.map(item => ({
      ...item,
      categoryName: cat.name,
      categoryId: cat.id,
      phase: cat.phase
    }))
  );

  const filteredModules = allModules.filter(mod => {
    const matchesCat = selectedCat === 'all' || mod.categoryId === selectedCat;
    const matchesSearch = searchQuery === '' || 
      mod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.badge.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="medcore-modal-backdrop" onClick={onClose}>
      <div className="medcore-modal-card modules-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button 
          type="button" 
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="modules-modal-header">
          <div className="modal-badge-pill">
            <Layers size={14} /> Full Enterprise Modular Catalog
          </div>
          <h3 className="modal-title font-serif">All 23 MedCore HMS Modules</h3>
          <p className="modal-subtitle">
            Modular architecture designed for rapid phased rollout. Deploy core clinical records first, then scale into pharmacy, lab, and multi-specialty workflows.
          </p>

          {/* Search Bar */}
          <div className="modules-search-bar">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search modules (e.g. pharmacy, billing, EMR, PACS, audit)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="modules-search-input"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="category-filter-pills">
            <button
              type="button"
              className={`filter-pill ${selectedCat === 'all' ? 'is-active' : ''}`}
              onClick={() => setSelectedCat('all')}
            >
              All Modules (23)
            </button>
            {modulesCategories.map(cat => (
              <button
                key={cat.id}
                type="button"
                className={`filter-pill ${selectedCat === cat.id ? 'is-active' : ''}`}
                onClick={() => setSelectedCat(cat.id)}
              >
                {cat.name} ({cat.items.length})
              </button>
            ))}
          </div>
        </div>

        {/* Modules Grid */}
        <div className="modules-modal-body">
          <div className="modules-catalog-grid">
            {filteredModules.map((mod) => (
              <div key={mod.id} className="module-item-card">
                <div className="module-item-top">
                  <span className="module-badge-tag">{mod.badge}</span>
                  <span className="module-phase-tag">{mod.phase.split(':')[0]}</span>
                </div>

                <h4 className="module-item-title">{mod.title}</h4>
                <p className="module-item-desc">{mod.description}</p>

                <div className="module-capabilities-list">
                  {mod.features.map((feat, fi) => (
                    <div key={fi} className="capability-tag">
                      <Check size={12} className="tag-check" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filteredModules.length === 0 && (
            <div className="empty-search-state">
              <p>No modules match your search criteria.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modules-modal-footer">
          <div className="footer-info">
            <ShieldCheck size={18} className="shield-icon" />
            <span>All 23 modules include role-based permissions and cryptographic audit logs.</span>
          </div>
          <button 
            type="button" 
            className="btn-primary-pill"
            onClick={() => {
              onClose();
              if (onOpenDemo) onOpenDemo();
            }}
          >
            Schedule live deployment demo
          </button>
        </div>
      </div>
    </div>
  );
}
