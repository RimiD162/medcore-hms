import React from 'react';
import { Users, User, ArrowRight } from 'lucide-react';

export const GatewayCards = ({ onSelectStaff, onSelectPatient }) => {
  return (
    <div className="portal-cards-grid">
      {/* 1. Hospital Staff Portal Card */}
      <div
        className="gateway-card gateway-card-staff"
        onClick={onSelectStaff}
      >
        <div className="gateway-card-img-wrap">
          <img
            src="/images/staff_team.jpg"
            alt="Hospital Medical Staff Team"
            className="gateway-card-img"
          />
        </div>

        <div className="gateway-card-body">
          <div className="gateway-card-header">
            <div className="gateway-card-icon-badge">
              <Users size={20} strokeWidth={2.4} />
            </div>
            <h2 className="gateway-card-title">Hospital Staff</h2>
          </div>

          <p className="gateway-card-desc">
            Access your dedicated workspace to manage patients, appointments, records and more.
          </p>

          <button
            className="gateway-card-btn"
            onClick={(e) => {
              e.stopPropagation();
              onSelectStaff();
            }}
          >
            <span>Staff Login</span>
            <ArrowRight size={16} />
          </button>

          <span className="gateway-card-subtext">
            For Doctors, Nurses, Admins, Pharmacists, Lab Technicians, Receptionists, Accountants and more.
          </span>
        </div>
      </div>

      {/* 2. Patient Portal Card */}
      <div
        className="gateway-card gateway-card-patient"
        onClick={onSelectPatient}
      >
        <div className="gateway-card-img-wrap">
          <img
            src="/images/patient_card.jpg"
            alt="Patient accessing healthcare portal on smartphone"
            className="gateway-card-img"
          />
        </div>

        <div className="gateway-card-body">
          <div className="gateway-card-header">
            <div className="gateway-card-icon-badge">
              <User size={20} strokeWidth={2.4} />
            </div>
            <h2 className="gateway-card-title">Patient Portal</h2>
          </div>

          <p className="gateway-card-desc">
            Book appointments, view prescriptions, check lab reports, manage your health records and more.
          </p>

          <button
            className="gateway-card-btn"
            onClick={(e) => {
              e.stopPropagation();
              onSelectPatient();
            }}
          >
            <span>Patient Login</span>
            <ArrowRight size={16} />
          </button>

          <span className="gateway-card-subtext">
            Your health. Your records. Always accessible.
          </span>
        </div>
      </div>
    </div>
  );
};

export default GatewayCards;
