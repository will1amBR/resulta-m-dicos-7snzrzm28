import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Calendar, Clock, Stethoscope, ArrowRight } from 'lucide-react'
import { getClinicStats, getClinicAppointments } from '@/services/clinic'
import { ClinicStats, Appointment } from '@/types/clinical'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRealtime } from '@/hooks/use-realtime'

export default function ClinicDashboard() {
  const [stats, setStats] = useState<ClinicStats | null>(null)
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([])

  const loadData = async () => {
    try {
      const s = await getClinicStats()
      setStats(s)
      const todayStr = new Date().toISOString().slice(0, 10)
      const appts = await getClinicAppointments(undefined, undefined, todayStr)
      setTodayAppts(appts)
    } catch {
      /* ignored */
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('appointments', () => {
    loadData()
  })

  const cards = [
    { label: 'Médicos', value: stats?.doctorCount ?? 0, icon: Stethoscope, color: 'bg-blue-600' },
    {
      label: 'Consultas Hoje',
      value: stats?.todayAppointmentCount ?? 0,
      icon: Calendar,
      color: 'bg-emerald-600',
    },
    { label: 'Agendadas', value: stats?.scheduledCount ?? 0, icon: Clock, color: 'bg-amber-500' },
    { label: 'Pacientes', value: stats?.patientCount ?? 0, icon: Users, color: 'bg-indigo-600' },
  ]

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border shadow-subtle">
        <h1 className="font-bold text-lg text-slate-900">Visão Geral da Clínica</h1>
        <p className="text-xs text-slate-500">
          Acompanhe os principais indicadores da sua clínica.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <Card key={c.label} className="shadow-subtle">
              <CardContent className="p-4 flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-lg ${c.color} text-white flex items-center justify-center shrink-0`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{c.value}</p>
                  <p className="text-xs text-slate-500">{c.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="bg-white border rounded-lg shadow-subtle">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-sm text-slate-800">Consultas de Hoje</h2>
          <Link
            to="/clinic/agenda"
            className="text-xs text-blue-600 hover:underline flex items-center"
          >
            Ver agenda completa <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </div>
        <div className="divide-y">
          {todayAppts.length === 0 ? (
            <p className="p-6 text-center text-xs text-slate-400">
              Nenhuma consulta agendada para hoje.
            </p>
          ) : (
            todayAppts.slice(0, 8).map((appt) => {
              const time = new Date(appt.date_time).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })
              return (
                <div key={appt.id} className="p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-blue-900">{time}</span>
                    <div>
                      <p className="font-medium text-slate-900">
                        {appt.expand?.patient?.name || 'Paciente'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {appt.expand?.doctor?.name || 'Médico'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {appt.status.replace('_', ' ')}
                  </Badge>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
