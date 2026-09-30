import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  return (
    <div className="error-page">
      <div className="error-page-card">
        <div className="error-code">403</div>
        <h1 className="error-title">Access Denied</h1>
        <p className="error-desc">
          You don't have permission to access this area.
          {user?.role && <><br />Your current role: <strong>{user.role}</strong></>}
        </p>
        <Link to="/dashboard" className="ui-btn ui-btn-primary ui-btn-md">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="error-page">
      <div className="error-page-card">
        <div className="error-code">404</div>
        <h1 className="error-title">Page Not Found</h1>
        <p className="error-desc">The page you're looking for doesn't exist.</p>
        <Link to="/dashboard" className="ui-btn ui-btn-primary ui-btn-md">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
