import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

type RequireRoleProps = {
  role: 'learner' | 'mentor';
  children: ReactNode;
  fallback?: ReactNode;
};

export function RequireRole({ role, children, fallback }: RequireRoleProps) {
  const { profile } = useAuth();

  if (!profile) {
    return fallback || (
      <div className="text-center py-12">
        <p className="text-white text-lg">Loading...</p>
      </div>
    );
  }

  if (profile.role !== role) {
    return fallback || (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-red-300 p-8 text-center max-w-2xl mx-auto mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Restricted</h2>
        <p className="text-gray-600 mb-6">
          This page is only accessible to {role}s. Your current role is <span className="font-bold capitalize">{profile.role}</span>.
        </p>
        <p className="text-sm text-gray-500">
          If you need access to this content, please contact your administrator.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
