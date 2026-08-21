import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import { RoleGuard } from '@/components/RoleGuard'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Agenda from './pages/Agenda'
import Pacientes from './pages/Pacientes'
import PatientDetail from './pages/PatientDetail'
import Prontuario from './pages/Prontuario'
import Teleconsulta from './pages/Teleconsulta'
import Documentos from './pages/Documentos'
import Settings from './pages/Settings'
import AdminCouncils from './pages/AdminCouncils'
import NotFound from './pages/NotFound'
import ClinicDashboard from './pages/clinic/ClinicDashboard'
import ClinicTeam from './pages/clinic/ClinicTeam'
import ClinicAgenda from './pages/clinic/ClinicAgenda'
import ClinicPatients from './pages/clinic/ClinicPatients'
import ClinicSettings from './pages/clinic/ClinicSettings'
import PatientDashboard from './pages/patient/PatientDashboard'
import PatientNewAppointment from './pages/patient/PatientNewAppointment'
import PatientRecords from './pages/patient/PatientRecords'
import PatientDocuments from './pages/patient/PatientDocuments'
import PatientPrescriptions from './pages/patient/PatientPrescriptions'
import PatientTeleconsulta from './pages/patient/PatientTeleconsulta'
import PatientProfile from './pages/patient/PatientProfile'

const App = () => (
  <BrowserRouter>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/entrar" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />

          <Route element={<Layout />}>
            <Route
              path="/dashboard"
              element={
                <RoleGuard allow={['doctor', 'admin']}>
                  <Dashboard />
                </RoleGuard>
              }
            />
            <Route
              path="/agenda"
              element={
                <RoleGuard allow={['doctor', 'admin']}>
                  <Agenda />
                </RoleGuard>
              }
            />
            <Route
              path="/pacientes"
              element={
                <RoleGuard allow={['doctor', 'admin']}>
                  <Pacientes />
                </RoleGuard>
              }
            />
            <Route
              path="/pacientes/:id"
              element={
                <RoleGuard allow={['doctor', 'admin']}>
                  <PatientDetail />
                </RoleGuard>
              }
            />
            <Route
              path="/prontuario"
              element={
                <RoleGuard allow={['doctor', 'admin']}>
                  <Prontuario />
                </RoleGuard>
              }
            />
            <Route
              path="/teleconsulta"
              element={
                <RoleGuard allow={['doctor', 'admin']}>
                  <Teleconsulta />
                </RoleGuard>
              }
            />
            <Route
              path="/documentos"
              element={
                <RoleGuard allow={['doctor', 'admin']}>
                  <Documentos />
                </RoleGuard>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <RoleGuard allow={['doctor', 'admin']}>
                  <Settings />
                </RoleGuard>
              }
            />
            <Route
              path="/admin/councils"
              element={
                <RoleGuard allow={['doctor', 'admin']}>
                  <AdminCouncils />
                </RoleGuard>
              }
            />

            <Route
              path="/clinic"
              element={
                <RoleGuard allow={['clinic', 'admin']}>
                  <ClinicDashboard />
                </RoleGuard>
              }
            />
            <Route
              path="/clinic/equipe"
              element={
                <RoleGuard allow={['clinic', 'admin']}>
                  <ClinicTeam />
                </RoleGuard>
              }
            />
            <Route
              path="/clinic/agenda"
              element={
                <RoleGuard allow={['clinic', 'admin']}>
                  <ClinicAgenda />
                </RoleGuard>
              }
            />
            <Route
              path="/clinic/pacientes"
              element={
                <RoleGuard allow={['clinic', 'admin']}>
                  <ClinicPatients />
                </RoleGuard>
              }
            />
            <Route
              path="/clinic/configuracoes"
              element={
                <RoleGuard allow={['clinic', 'admin']}>
                  <ClinicSettings />
                </RoleGuard>
              }
            />

            <Route
              path="/patient"
              element={
                <RoleGuard allow={['patient']}>
                  <PatientDashboard />
                </RoleGuard>
              }
            />
            <Route
              path="/patient/agendar"
              element={
                <RoleGuard allow={['patient']}>
                  <PatientNewAppointment />
                </RoleGuard>
              }
            />
            <Route
              path="/patient/prontuario"
              element={
                <RoleGuard allow={['patient']}>
                  <PatientRecords />
                </RoleGuard>
              }
            />
            <Route
              path="/patient/documentos"
              element={
                <RoleGuard allow={['patient']}>
                  <PatientDocuments />
                </RoleGuard>
              }
            />
            <Route
              path="/patient/prescricoes"
              element={
                <RoleGuard allow={['patient']}>
                  <PatientPrescriptions />
                </RoleGuard>
              }
            />
            <Route
              path="/patient/teleconsulta"
              element={
                <RoleGuard allow={['patient']}>
                  <PatientTeleconsulta />
                </RoleGuard>
              }
            />
            <Route
              path="/patient/perfil"
              element={
                <RoleGuard allow={['patient']}>
                  <PatientProfile />
                </RoleGuard>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
