import React from 'react';
import RoleCard from './RoleCard';
import { rolesData } from '../data/rolesData';

export const RoleGrid = ({ roles = rolesData, onOpenWorkspace }) => {
  if (!roles || roles.length === 0) {
    return (
      <div className="staff-no-roles">
        <p>No hospital roles match your current search/filter.</p>
      </div>
    );
  }

  return (
    <div className="staff-roles-grid">
      {roles.map((role) => (
        <RoleCard
          key={role.id}
          role={role}
          onOpenWorkspace={onOpenWorkspace}
        />
      ))}
    </div>
  );
};

export default RoleGrid;
