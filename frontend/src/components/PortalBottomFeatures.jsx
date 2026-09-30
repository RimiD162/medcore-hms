import React from 'react';
import { Shield, Zap, Link2, Clock } from 'lucide-react';

export const PortalBottomFeatures = () => {
  const features = [
    {
      icon: Shield,
      title: 'Secure Platform',
      desc: 'Your data is protected with industry-standard security.',
    },
    {
      icon: Zap,
      title: 'Easy to Use',
      desc: 'Simple, intuitive interface for faster adoption.',
    },
    {
      icon: Link2,
      title: 'Integrated System',
      desc: 'All modules work together seamlessly.',
    },
    {
      icon: Clock,
      title: '24/7 Support',
      desc: "We're here whenever you need us.",
    },
  ];

  return (
    <section className="portal-bottom-section">
      <div>
        <h3 className="portal-bottom-intro-title">
          Everything You Need<br />
          in One Place
        </h3>
        <p className="portal-bottom-intro-desc">
          MedCore HMS connects every part of the hospital for better communication, smoother workflows and improved patient outcomes.
        </p>
      </div>

      <div className="portal-features-row">
        {features.map((feat, idx) => {
          const IconComp = feat.icon;
          return (
            <div key={idx} className="portal-feat-col">
              <div className="portal-feat-icon-wrap">
                <IconComp size={20} strokeWidth={2.2} />
              </div>
              <h4 className="portal-feat-title">{feat.title}</h4>
              <p className="portal-feat-desc">{feat.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PortalBottomFeatures;
