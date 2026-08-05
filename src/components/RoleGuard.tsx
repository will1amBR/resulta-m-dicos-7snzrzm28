import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'

const HOME_ROUTES: Record<string, string> = {
  doctor: '/dashboard',
  admin: '/dashboard',
  clinic: '/clinic',
  patient: '/patient',
}

export function getHomeRoute(role?: string) {
  return HOME_ROUTES[role || 'doctor'] || '/dashboard'
}

export function RoleGuard({ allow, children }: { allow: string[]; children: ReactNode }) {
  const { userRole } = useAuth()
  if (!allow.includes(userRole)) {
    return <Navigate to={getHomeRoute(userRole)} replace />
  }
  return <>{children}</>
}
