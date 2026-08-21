import { useState } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { SidebarNav } from '@/components/SidebarNav'
import { ClinicSidebar } from '@/components/ClinicSidebar'
import { PatientSidebar } from '@/components/PatientSidebar'
import { Header } from '@/components/Header'
import { useAuth } from '@/hooks/use-auth'
import { ActivePatientProvider } from '@/contexts/active-patient-context'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { DemoBanner } from '@/components/DemoBanner'

export default function Layout() {
  const { isAuthenticated, loading, userRole } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Carregando Resulta Médicos...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated && location.pathname !== '/entrar' && location.pathname !== '/cadastro') {
    return <Navigate to="/entrar" replace />
  }

  const Sidebar =
    userRole === 'patient' ? PatientSidebar : userRole === 'clinic' ? ClinicSidebar : SidebarNav

  return (
    <ActivePatientProvider>
      <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
        <div className="hidden md:flex shrink-0 no-print">
          <Sidebar />
        </div>

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent
            side="left"
            className="p-0 bg-slate-900 border-slate-800 w-64 text-white no-print"
          >
            <Sidebar />
          </SheetContent>
        </Sheet>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <DemoBanner />
          <div className="no-print">
            <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} role={userRole} />
          </div>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col">
            <Outlet />
          </main>
          <footer className="no-print h-8 border-t bg-white px-4 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
            <span>Resulta Médicos © 2025 - Plataforma Unificada de Gestão Clínica</span>
            <span>Conforme LGPD & Regulamentações CFM</span>
          </footer>
        </div>
      </div>
    </ActivePatientProvider>
  )
}
