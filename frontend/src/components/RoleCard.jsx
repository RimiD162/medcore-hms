import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const IconComponent = iconMap[role.iconName] || Stethoscope;

  const handleClick = () => {
    if (role.id === 'doctor') {
      navigate('/app/doctor');
    } else {
      onOpenWorkspace(role);
    }
  };

  return (
    <div
      className="staff-role-card"
      style={{
        '--role-accent': role.accentColor,
        '--role-badge-bg': role.badgeBg,
        '--role-badge-color': role.badgeColor,
        '--role-border': role.borderColor,
      }}
      onClick={handleClick}
    >
      {/* Top Photorealistic Human Image Container */}
      <div className="staff-card-img-wrap">
        <img
          src={role.image}
          alt={`MedCore HMS ${role.title}`}
          className="staff-card-img"
          loading="lazy"
        />
        
        {/* Category Pill Tag */}
        <div className="staff-card-category-badge">
          <span>{role.categoryLabel || role.category}</span>
        </div>

        {/* Live Active Metric Pill */}
        {role.activeMetric && (
          <div className="staff-card-metric-pill">
            <span className="staff-metric-dot" />
            <span>{role.activeMetric}</span>
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div className="staff-card-body">
        {/* Role Header: Icon Badge & Title */}
        <div className="staff-card-header">
          <div
            className="staff-role-icon-box"
            style={{
              backgroundColor: role.badgeBg,
              color: role.badgeColor || role.accentColor,
            }}
          >
            <IconComponent size={18} strokeWidth={2.4} />
          </div>
          <div className="staff-card-title-wrap">
            <h3 className="staff-card-title">{role.title}</h3>
            <span className="staff-card-department">{role.department}</span>
          </div>
        </div>

        {/* Role Description */}
        <p className="staff-card-desc">{role.subtitle}</p>

        {/* Feature Tags List */}
        {role.tags && role.tags.length > 0 && (
          <div className="staff-card-tags">
            {role.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="staff-tag-pill">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Action Button */}
        <div className="staff-card-footer">
          <button
            className="staff-btn-workspace"
            onClick={(e) => {
              e.stopPropagation();
              onOpenWorkspace(role);
            }}
          >
            <span>Enter Workspace</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleCard;
