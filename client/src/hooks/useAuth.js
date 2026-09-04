import { useAuthContext } from '@context/AuthContext';

/**
 * useAuth — convenience hook to access auth state and actions.
 *
 * Usage:
 *   const { user, login, logout, loading } = useAuth();
 */
export const useAuth = () => useAuthContext();
