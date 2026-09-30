import React from 'react';
import {
  Stethoscope,
  HeartPulse,
  Users,
  Pill,
  Microscope,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';

const iconMap = {
  Stethoscope: Stethoscope,
  HeartPulse: HeartPulse,
  Users: Users,
  Pill: Pill,
  Microscope: Microscope,
  FileSpreadsheet: FileSpreadsheet,
};

export const RoleCard = ({ role, onOpenWorkspace }) => {
  const IconComponent = iconMap[role.iconName] || Stethoscope;

  return (
    <div
      className="role-card"
      style={{
        '--card-accent': role.accentColor,
        '--card-glow': role.glowColor,
        '--card-border': role.borderColor,
        '--btn-bg': role.buttonBg,
      }}
      onClick={() => onOpenWorkspace(role)}
    >
      {/* Top Photorealistic Image Container */}
      <div className="role-card-image-wrap">
        <img
          src={role.image}
          alt={role.title}
          className="role-card-img"
          loading="lazy"
        />
        <div className="role-card-gradient-overlay" />
      </div>

      {/* Card Content */}
      <div className="role-card-content">
        {/* Floating Role Badge */}
        <div
          className="role-icon-badge"
          style={{
            backgroundColor: role.badgeBg,
            borderColor: role.accentColor,
          }}
        >
          <IconComponent size={22} color="#ffffff" strokeWidth={2.2} />
        </div>

        {/* Role Title */}
        <h3 className="role-card-title">{role.title}</h3>

        {/* Role Description */}
        <p className="role-card-desc">{role.subtitle}</p>

        {/* Action Button */}
        <button
          className="role-btn-action"
          onClick={(e) => {
            e.stopPropagation();
            onOpenWorkspace(role);
          }}
        >
          <span>Open Workspace</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
};

export default RoleCard;
