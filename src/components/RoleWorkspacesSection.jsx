import React, { useState } from 'react';
import { rolesData } from '../data/rolesData';
import InteractiveRolePreview from './InteractiveRolePreview';

export default function RoleWorkspacesSection() {
  const [activeRoleId, setActiveRoleId] = useState('doctor');

  const activeRole = rolesData.find(r => r.id === activeRoleId) || rolesData[0];

  return (
    <section id="roles" className="medcore-roles-section">
      <div className="medcore-container">
        {/* Top Grid: Image + Description & Role Pills (Matching Image 4) */}
        <div className="roles-main-grid">
          {/* Left Column: Hospital Team Photo */}
          <div className="roles-visual-col">
            <div className="roles-image-card">
              <img 
                src="/assets/hospital-team.jpg" 
                alt="Hospital physician and nurse collaborating at the clinical control workstation" 
                className="roles-team-photo"
                loading="lazy"
              />
            </div>
          </div>

          {/* Right Column: Title, Description, and Interactive Role Pills */}
          <div className="roles-content-col">
            <h2 className="roles-headline font-serif">
              Built for the people who run the hospital.
            </h2>

            <p className="roles-description">
              Every role gets a focused workspace. Administrators see hospital-wide activity 
              and revenue at a glance, doctors see today's consultations and records, nurses 
              track vitals and care tasks, and pharmacy and lab teams manage their queues — 
              all sharing one patient record.
            </p>

            {/* Interactive Role Pills */}
            <div className="role-pills-wrap">
              {rolesData.map((role) => {
                const isActive = role.id === activeRoleId;
                return (
                  <button
                    key={role.id}
                    type="button"
                    className={`role-pill-btn ${isActive ? 'is-active' : ''}`}
                    onClick={() => setActiveRoleId(role.id)}
                  >
                    {role.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Interactive Role Workspace Simulator */}
        <div className="role-simulator-wrapper">
          <InteractiveRolePreview activeRole={activeRole} />
        </div>
      </div>
    </section>
  );
}
