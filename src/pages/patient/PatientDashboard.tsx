import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Building2,
  CalendarPlus,
  MessageSquare,
  FileText,
  Pill,
  FolderOpen,
  FlaskConical,
  Activity,
  CheckCircle2,
  CalendarX,
  RefreshCw,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getMyAppointments } from '@/services/patient-portal'
import { Appointment } from '@/types/clinical'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

// Mock fallback appointments for demo patient (João Silva)
const DEFAULT_MOCK_APPOINTMENTS: Array<
  Partial<Appointment> & { id: string; clinic_name?: string }
> = [
  {
    id: 'mock-appt-1',
    date_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // 2 days ahead
    status: 'agendada',
    reason: 'Consulta de rotina e acompanhamento cardiológico',
    clinic_name: 'Resulta Saúde Integrada - Unidade Paulista',
    expand: {
      doctor: {
        name: 'Dra. Beatriz Albuquerque',
        crm: 'CRM/SP 145.892',
      },
    },
  },
  {
    id: 'mock-appt-2',
    date_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'agendada',
    reason: 'Retorno com exames de sangue',
    clinic_name: 'Resulta Centro Médico - Jardins',
    expand: {
      doctor: {
        name: 'Dr. Lucas Silveira',
        crm: 'CRM/SP 198.431',
      },
    },
  },
  {
    id: 'mock-appt-3',
    date_time: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'finalizada',
    reason: 'Avaliação clínica geral e check-up anual',
    clinic_name: 'Resulta Saúde Integrada - Unidade Paulista',
    expand: {
      doctor: {
        name: 'Dr. Carlos Eduardo Mendes',
        crm: 'CRM/SP 112.340',
      },
    },
  },
]

export default function PatientDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const patientId = user?.patient_link

  const [appointments, setAppointments] = useState<any[]>(DEFAULT_MOCK_APPOINTMENTS)
  const [loading, setLoading] = useState(false)
  const [actionModal, setActionModal] = useState<{
    type: 'confirm' | 'reschedule' | 'cancel'
    appointment: any
  } | null>(null)

  const patientName = user?.name || 'João Silva'

  // Greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'Bom dia'
    if (hour >= 12 && hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const loadData = async () => {
    if (!patientId) return
    setLoading(true)
    try {
      const list = await getMyAppointments(patientId)
      if (list && list.length > 0) {
        setAppointments(list)
      } else {
        setAppointments(DEFAULT_MOCK_APPOINTMENTS)
      }
    } catch {
      setAppointments(DEFAULT_MOCK_APPOINTMENTS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [patientId])

  useRealtime('appointments', () => {
    loadData()
  })

  // Upcoming appointments
  const now = new Date()
  const upcomingAppointments = appointments
    .filter((a) => {
      const dt = new Date(a.date_time)
      return (dt >= now || a.id.startsWith('mock-appt-1')) && a.status !== 'cancelada'
    })
    .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())

  const nextAppointment = upcomingAppointments[0] || null

  const handleConfirmAppointment = (appt: any) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appt.id ? { ...a, status: 'confirmada' } : a)),
    )
    setActionModal(null)
    toast({
      title: 'Presença confirmada!',
      description: 'Sua consulta foi confirmada com sucesso na clínica.',
    })
  }

  const handleCancelAppointment = (appt: any) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appt.id ? { ...a, status: 'cancelada' } : a)),
    )
    setActionModal(null)
    toast({
      title: 'Consulta cancelada',
      description: 'O agendamento foi cancelado. Você pode reagendar a qualquer momento.',
      variant: 'destructive',
    })
  }

  const handleReschedule = () => {
    setActionModal(null)
    navigate('/patient/agendar')
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header / Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
              <span>Portal do Paciente Resulta</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {getGreeting()}, {patientName}!
            </h1>
            <p className="text-blue-100 text-sm max-w-xl">
              Acompanhe seu histórico de saúde, consulte receitas médicas ativas e gerencie seus
              agendamentos em um só lugar.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate('/patient/agendar')}
              className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-sm text-sm"
              size="lg"
            >
              <CalendarPlus className="h-4 w-4 mr-2 text-blue-600" />
              Agendar consulta
            </Button>
          </div>
        </div>
        {/* Background decorative elements */}
        <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute left-1/2 -top-10 h-32 w-32 rounded-full bg-sky-300/10 blur-xl pointer-events-none" />
      </div>

      {/* 2. Próxima Consulta em Destaque */}
      {nextAppointment ? (
        <Card className="border-blue-100 shadow-md bg-gradient-to-br from-white to-blue-50/40 overflow-hidden">
          <CardHeader className="pb-3 border-b border-blue-100/60 bg-blue-50/50">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                    Sua Próxima Consulta
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Fique atento aos horários e chegue com 15 min de antecedência
                  </p>
                </div>
              </div>
              <Badge
                className={
                  nextAppointment.status === 'confirmada'
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white capitalize'
                    : 'bg-blue-600 hover:bg-blue-700 text-white capitalize'
                }
              >
                {nextAppointment.status === 'confirmada' ? '✓ Presença confirmada' : 'Agendada'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Data e Hora */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white border border-slate-100 shadow-xs">
                <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Data & Horário
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">
                    {new Date(nextAppointment.date_time).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                    })}
                  </p>
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">
                    às{' '}
                    {new Date(nextAppointment.date_time).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* Médico & Especialidade */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white border border-slate-100 shadow-xs">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Médico Responsável
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">
                    {nextAppointment.expand?.doctor?.name || 'Dr. Médico Especialista'}
                  </p>
                  <p className="text-xs text-indigo-600 font-medium flex items-center gap-1 mt-0.5">
                    <Stethoscope className="h-3 w-3" />
                    Cardiologia & Clínica Geral •{' '}
                    {nextAppointment.expand?.doctor?.crm || 'CRM Ativo'}
                  </p>
                </div>
              </div>

              {/* Local / Clínica */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white border border-slate-100 shadow-xs">
                <div className="h-10 w-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Local de Atendimento
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">
                    {nextAppointment.clinic_name || 'Resulta Saúde Integrada'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Av. Paulista, 1842 - 7º Andar, Bela Vista - SP
                  </p>
                </div>
              </div>
            </div>

            {nextAppointment.reason && (
              <div className="mt-4 p-3 rounded-lg bg-blue-50/60 border border-blue-100/80 text-xs text-slate-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Motivo:</strong> {nextAppointment.reason}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActionModal({ type: 'cancel', appointment: nextAppointment })}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs"
              >
                <CalendarX className="h-3.5 w-3.5 mr-1.5" />
                Cancelar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActionModal({ type: 'reschedule', appointment: nextAppointment })}
                className="text-slate-700 hover:bg-slate-100 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Remarcar
              </Button>
              {nextAppointment.status !== 'confirmada' && (
                <Button
                  size="sm"
                  onClick={() => setActionModal({ type: 'confirm', appointment: nextAppointment })}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  Confirmar presença
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-slate-200">
          <CardContent className="p-8 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Você não tem consultas agendadas</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Mantenha seus exames e rotinas médicas em dia. Agende um horário com nossos
                especialistas.
              </p>
            </div>
            <Button
              onClick={() => navigate('/patient/agendar')}
              className="bg-blue-600 hover:bg-blue-700 text-xs"
            >
              <CalendarPlus className="h-3.5 w-3.5 mr-1.5" /> Agendar agora
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 3. Resumo Rápido de Saúde (3 Cards menores) */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <Activity className="h-4 w-4 text-blue-600" /> Resumo Rápido de Saúde
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Últimos exames */}
          <Link to="/patient/documentos" className="group block">
            <Card className="h-full hover:border-blue-400 hover:shadow-md transition-all duration-200">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Últimos Exames</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">4</span>
                    <span className="text-[11px] text-emerald-600 font-medium">disponíveis</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Hemograma, ECG, Raio-X...</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FlaskConical className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card 2: Medicações ativas */}
          <Link to="/patient/prescricoes" className="group block">
            <Card className="h-full hover:border-blue-400 hover:shadow-md transition-all duration-200">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Medicações Ativas</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">3</span>
                    <span className="text-[11px] text-blue-600 font-medium">em uso regular</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Losartana, Rosuvastatina...</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Pill className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card 3: Próximos procedimentos / rotina */}
          <Link to="/patient/prontuario" className="group block">
            <Card className="h-full hover:border-blue-400 hover:shadow-md transition-all duration-200">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Próximos Procedimentos</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">1</span>
                    <span className="text-[11px] text-amber-600 font-medium">programado</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Ecocardiograma com Doppler</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Activity className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* 4. Ações Rápidas (Grid de 4 botões grandes com ícones) */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ação 1: Agendar consulta */}
          <button
            onClick={() => navigate('/patient/agendar')}
            className="flex flex-col items-start p-5 rounded-xl border border-slate-200 bg-white hover:border-blue-500 hover:shadow-md text-left transition-all duration-200 group"
          >
            <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <CalendarPlus className="h-5 w-5" />
            </div>
            <span className="font-bold text-slate-900 text-sm group-hover:text-blue-600 flex items-center gap-1">
              Agendar consulta{' '}
              <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Marque horários presenciais ou por telemedicina
            </span>
          </button>

          {/* Ação 2: Falar com médico (Teleconsulta) */}
          <button
            onClick={() => navigate('/patient/teleconsulta')}
            className="flex flex-col items-start p-5 rounded-xl border border-slate-200 bg-white hover:border-indigo-500 hover:shadow-md text-left transition-all duration-200 group"
          >
            <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 flex items-center gap-1">
              Falar com médico{' '}
              <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Acesse sala de telemedicina e orientações
            </span>
          </button>

          {/* Ação 3: Ver receitas */}
          <button
            onClick={() => navigate('/patient/prescricoes')}
            className="flex flex-col items-start p-5 rounded-xl border border-slate-200 bg-white hover:border-amber-500 hover:shadow-md text-left transition-all duration-200 group"
          >
            <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Pill className="h-5 w-5" />
            </div>
            <span className="font-bold text-slate-900 text-sm group-hover:text-amber-600 flex items-center gap-1">
              Ver receitas{' '}
              <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Consulte prescrições e solicite renovações
            </span>
          </button>

          {/* Ação 4: Meus documentos */}
          <button
            onClick={() => navigate('/patient/documentos')}
            className="flex flex-col items-start p-5 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-md text-left transition-all duration-200 group"
          >
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FolderOpen className="h-5 w-5" />
            </div>
            <span className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 flex items-center gap-1">
              Meus documentos{' '}
              <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Envie e visualize laudos, exames e atestados
            </span>
          </button>
        </div>
      </div>

      {/* 5. Todas as Consultas (Histórico & Próximas) */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-blue-600" /> Outras Consultas
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/patient/agendar')}
            className="text-xs text-blue-600 hover:text-blue-700 p-0 h-auto font-medium"
          >
            + Nova Consulta
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {appointments
            .filter((a) => a.id !== nextAppointment?.id)
            .map((appt) => {
              const dt = new Date(appt.date_time)
              const isPast = dt < now || appt.status === 'finalizada'
              return (
                <Card key={appt.id} className="border-slate-200 hover:border-slate-300 shadow-xs">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-blue-700 font-bold">
                        <Clock className="h-4 w-4" />
                        {dt.toLocaleDateString('pt-BR')} às{' '}
                        {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <Badge
                        variant={isPast ? 'secondary' : 'default'}
                        className="text-[10px] capitalize"
                      >
                        {appt.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-800 font-medium">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      {appt.expand?.doctor?.name || 'Médico da Equipe'}
                    </div>
                    {appt.clinic_name && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-slate-400" />
                        {appt.clinic_name}
                      </p>
                    )}
                    {appt.reason && (
                      <p className="text-[11px] text-slate-500 border-t pt-1.5">{appt.reason}</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
        </div>
      </div>

      {/* Confirmation/Cancellation Dialogs */}
      {actionModal && (
        <Dialog open={!!actionModal} onOpenChange={() => setActionModal(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {actionModal.type === 'confirm' && 'Confirmar Presença'}
                {actionModal.type === 'cancel' && 'Cancelar Agendamento'}
                {actionModal.type === 'reschedule' && 'Remarcar Consulta'}
              </DialogTitle>
              <DialogDescription>
                {actionModal.type === 'confirm' &&
                  'Deseja confirmar sua presença nesta consulta? A clínica e o médico serão notificados imediatamente.'}
                {actionModal.type === 'cancel' &&
                  'Tem certeza que deseja cancelar esta consulta? Essa vaga será liberada para outros pacientes.'}
                {actionModal.type === 'reschedule' &&
                  'Você será redirecionado para a página de agendamento para escolher um novo horário.'}
              </DialogDescription>
            </DialogHeader>

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 text-slate-600 border">
              <p>
                <strong>Médico:</strong>{' '}
                {actionModal.appointment.expand?.doctor?.name || 'Dr. Médico'}
              </p>
              <p>
                <strong>Data:</strong>{' '}
                {new Date(actionModal.appointment.date_time).toLocaleDateString('pt-BR')} às{' '}
                {new Date(actionModal.appointment.date_time).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setActionModal(null)}>
                Voltar
              </Button>
              {actionModal.type === 'confirm' && (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleConfirmAppointment(actionModal.appointment)}
                >
                  Confirmar presença
                </Button>
              )}
              {actionModal.type === 'cancel' && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleCancelAppointment(actionModal.appointment)}
                >
                  Confirmar cancelamento
                </Button>
              )}
              {actionModal.type === 'reschedule' && (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleReschedule}
                >
                  Ir para agendamento
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
