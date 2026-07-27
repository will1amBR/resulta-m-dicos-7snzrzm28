import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar as CalendarIcon, Plus, User, Play } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useActivePatient } from '@/contexts/active-patient-context'
import { getAppointments, updateAppointment } from '@/services/appointments'
import { Appointment, AppointmentStatus } from '@/types/clinical'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NewAppointmentModal } from '@/components/NewAppointmentModal'
import { useRealtime } from '@/hooks/use-realtime'

export default function Agenda() {
  const { user } = useAuth()
  const { setActivePatient, setActiveAppointmentId } = useActivePatient()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const navigate = useNavigate()

  const loadData = async () => {
    if (!user) return
    try {
      const list = await getAppointments(user.id)
      setAppointments(list)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  useRealtime('appointments', () => {
    loadData()
  })

  const filteredAppointments = appointments.filter((a) => {
    if (statusFilter !== 'todos' && a.status !== statusFilter) return false
    return true
  })

  const handleStartConsultation = async (appt: Appointment) => {
    if (appt.expand?.patient) {
      setActivePatient(appt.expand.patient)
      setActiveAppointmentId(appt.id)
      await updateAppointment(appt.id, { status: 'em_andamento' })
      navigate('/dashboard')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border shadow-subtle">
        <div>
          <h1 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            Agenda de Consultas
          </h1>
          <p className="text-xs text-slate-500">
            Gerencie horários, status e inicie atendimentos em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setModalOpen(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" /> Novo Agendamento
          </Button>
        </div>
      </div>

      <div className="flex gap-2 text-xs">
        {['todos', 'agendada', 'confirmada', 'em_andamento', 'finalizada', 'cancelada'].map(
          (st) => (
            <Button
              key={st}
              variant={statusFilter === st ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(st)}
              className="capitalize text-xs h-8"
            >
              {st.replace('_', ' ')}
            </Button>
          ),
        )}
      </div>

      <div className="bg-white border rounded-lg overflow-hidden shadow-subtle">
        {filteredAppointments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Nenhum agendamento encontrado para este filtro.
          </div>
        ) : (
          <div className="divide-y">
            {filteredAppointments.map((appt) => {
              const pat = appt.expand?.patient
              const dt = new Date(appt.date_time)
              const dateFormatted = dt.toLocaleDateString('pt-BR')
              const timeFormatted = dt.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })

              return (
                <div
                  key={appt.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-50 border border-blue-200 p-2 rounded text-center min-w-[70px]">
                      <span className="block font-bold text-blue-900 text-sm">{timeFormatted}</span>
                      <span className="block text-[10px] text-blue-700">{dateFormatted}</span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        {pat?.name || 'Paciente sem nome'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Motivo: {appt.reason || 'Consulta geral'}
                      </p>
                      {pat?.insurance && (
                        <p className="text-[11px] text-slate-400">Convênio: {pat.insurance}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs capitalize">
                      {appt.status.replace('_', ' ')}
                    </Badge>

                    <Button
                      size="sm"
                      onClick={() => handleStartConsultation(appt)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    >
                      <Play className="h-3.5 w-3.5 mr-1" /> Iniciar Consulta
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <NewAppointmentModal open={modalOpen} onOpenChange={setModalOpen} onSuccess={loadData} />
    </div>
  )
}
