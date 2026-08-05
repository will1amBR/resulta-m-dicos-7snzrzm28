import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Stethoscope, History } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getMyAppointments } from '@/services/patient-portal'
import { Appointment } from '@/types/clinical'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useRealtime } from '@/hooks/use-realtime'

export default function PatientDashboard() {
  const { user } = useAuth()
  const patientId = user?.patient_link
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [showPast, setShowPast] = useState(false)

  const loadData = async () => {
    if (!patientId) return
    try {
      const list = await getMyAppointments(patientId)
      setAppointments(list)
    } catch {
      /* ignored */
    }
  }

  useEffect(() => {
    loadData()
  }, [patientId])
  useRealtime('appointments', () => {
    loadData()
  })

  if (!patientId) {
    return (
      <div className="p-6 text-center text-sm text-slate-500">
        Contate a recepção para vincular seu prontuário.
      </div>
    )
  }

  const now = new Date()
  const upcoming = appointments.filter(
    (a) => new Date(a.date_time) >= now && a.status !== 'cancelada',
  )
  const past = appointments.filter((a) => new Date(a.date_time) < now || a.status === 'finalizada')

  const list = showPast ? past : upcoming

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border shadow-subtle">
        <h1 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" /> Minhas Consultas
        </h1>
        <p className="text-xs text-slate-500">Olá, {user?.name}! Acompanhe suas consultas.</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setShowPast(false)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium ${!showPast ? 'bg-blue-600 text-white' : 'bg-white border text-slate-600'}`}
        >
          Próximas ({upcoming.length})
        </button>
        <button
          onClick={() => setShowPast(true)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${showPast ? 'bg-blue-600 text-white' : 'bg-white border text-slate-600'}`}
        >
          <History className="h-3 w-3" /> Histórico ({past.length})
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {list.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center text-xs text-slate-400">
              Nenhuma consulta {showPast ? 'anterior' : 'agendada'}.
            </CardContent>
          </Card>
        ) : (
          list.map((appt) => {
            const dt = new Date(appt.date_time)
            return (
              <Card key={appt.id} className="shadow-subtle">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-blue-700 font-bold">
                      <Clock className="h-4 w-4" />
                      {dt.toLocaleDateString('pt-BR')} às{' '}
                      {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {appt.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <User className="h-4 w-4 text-slate-400" />
                    {appt.expand?.doctor?.name || 'Médico'}
                  </div>
                  {appt.expand?.doctor?.expand?.specialty?.name && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <Stethoscope className="h-3.5 w-3.5" />
                      {appt.expand.doctor.expand.specialty.name}
                    </div>
                  )}
                  {appt.reason && (
                    <p className="text-[11px] text-slate-500 border-t pt-1">{appt.reason}</p>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
