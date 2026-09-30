import React from 'react';
import { ShieldCheck, Network, Clock, Users } from 'lucide-react';
import { bottomFeatures } from '../data/rolesData';

const iconMap = {
  ShieldCheck: ShieldCheck,
  Network: Network,
  Clock: Clock,
  Users: Users,
};

export const FeatureRibbon = () => {
  return (
    <div className="feature-ribbon-container">
      <div className="feature-ribbon">
        {bottomFeatures.map((feature) => {
          const IconComponent = iconMap[feature.iconName] || ShieldCheck;
          return (
            <div key={feature.id} className="feature-ribbon-item">
              <div className="feature-icon-wrap">
                <IconComponent size={22} strokeWidth={2.2} />
              </div>
              <span className="feature-label">{feature.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FeatureRibbon;
