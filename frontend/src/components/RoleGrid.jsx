import React from 'react';
import RoleCard from './RoleCard';
import { rolesData } from '../data/rolesData';

export const RoleGrid = ({ onOpenWorkspace }) => {
  return (
    <div className="role-cards-grid">
      {rolesData.map((role) => (
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
