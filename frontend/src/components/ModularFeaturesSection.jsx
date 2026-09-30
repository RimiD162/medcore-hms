import React from 'react';
import { modulesCategories } from '../data/modulesData';
import { ArrowUpRight } from 'lucide-react';

export default function ModularFeaturesSection({ onOpenModules, onSelectCategory }) {
  // We use the first 3 primary categories from our dataset
  const displayCategories = modulesCategories.slice(0, 3);

  return (
    <section id="modules" className="medcore-modules-section">
      <div className="medcore-container">
        {/* Section Header */}
        <div className="section-header-block">
          <h2 className="section-title font-serif">
            One platform, every department that keeps a hospital running.
          </h2>
          <p className="section-subtitle">
            MedCore is organized into modular features, so the core system goes live first 
            and enterprise modules are added progressively.
          </p>
        </div>

        {/* 3 Modular Feature Cards Grid */}
        <div className="modular-cards-grid">
          {displayCategories.map((category) => (
            <div 
              key={category.id} 
              className="modular-card"
              onClick={() => onSelectCategory ? onSelectCategory(category.id) : onOpenModules()}
            >
              {/* Card Number Badge */}
              <div className="card-number-badge">
                {category.id}
              </div>

              {/* Card Title */}
              <h3 className="card-title">
                {category.name}
              </h3>

              {/* Card Description */}
              <p className="card-description">
                {category.tagline}
              </p>

              {/* Feature Bullet Points */}
              <ul className="card-feature-list">
                {category.items.map((item, i) => (
                  <li key={i} className="card-feature-item">
                    <span className="feature-bullet">•</span>
                    <span className="feature-text">{item.title}</span>
                  </li>
                ))}
              </ul>

              {/* Subtle hover detail indicator */}
              <div className="card-footer-action">
                <span className="footer-action-text">Explore module specifications</span>
                <ArrowUpRight size={16} className="footer-action-icon" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
