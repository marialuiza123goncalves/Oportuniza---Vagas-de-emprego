import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.js';

export default function AdminRoute() {
  const { admin } = useAuth();
  const location = useLocation();
  return admin ? <Outlet /> : <Navigate to="/admin/login" replace state={{ from: location }} />;
}
