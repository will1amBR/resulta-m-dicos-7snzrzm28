import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import Layout from './components/Layout'
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

const App = () => (
  <BrowserRouter>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <Routes>
          <Route path="/entrar" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />

          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path="/pacientes/:id" element={<PatientDetail />} />
            <Route path="/prontuario" element={<Prontuario />} />
            <Route path="/teleconsulta" element={<Teleconsulta />} />
            <Route path="/documentos" element={<Documentos />} />
            <Route path="/configuracoes" element={<Settings />} />
            <Route path="/admin/councils" element={<AdminCouncils />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
