import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, CheckCircle, XCircle } from 'lucide-react'
import { getClinicAppointments, getClinicDoctors } from '@/services/clinic'
import { updateAppointment } from '@/services/appointments'
import { Appointment, AppointmentStatus } from '@/types/clinical'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

export default function ClinicAgenda() {
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [doctorFilter, setDoctorFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [dateFilter, setDateFilter] = useState('')

  const loadData = async () => {
    try {
      const list = await getClinicAppointments(
        doctorFilter !== 'todos' ? doctorFilter : undefined,
        statusFilter,
        dateFilter || undefined,
      )
      setAppointments(list)
    } catch {
      /* ignored */
    }
  }

  useEffect(() => {
    getClinicDoctors()
      .then(setDoctors)
      .catch(() => {})
  }, [])

  useEffect(() => {
    loadData()
  }, [doctorFilter, statusFilter, dateFilter])
  useRealtime('appointments', () => {
    loadData()
  })

  const handleAction = async (id: string, status: AppointmentStatus) => {
    try {
      await updateAppointment(id, { status })
      toast({ title: 'Consulta atualizada!' })
      loadData()
    } catch {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border shadow-subtle">
        <h1 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-emerald-600" /> Agenda da Clínica
        </h1>
        <p className="text-xs text-slate-500">Consultas de todos os médicos em tempo real.</p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Select value={doctorFilter} onValueChange={setDoctorFilter}>
          <SelectTrigger className="h-8 text-xs w-40">
            <SelectValue placeholder="Médico" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os médicos</SelectItem>
            {doctors.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 text-xs w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos status</SelectItem>
            <SelectItem value="agendada">Agendada</SelectItem>
            <SelectItem value="confirmada">Confirmada</SelectItem>
            <SelectItem value="em_andamento">Em andamento</SelectItem>
            <SelectItem value="finalizada">Finalizada</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="h-8 text-xs w-36"
        />
      </div>

      <div className="bg-white border rounded-lg overflow-hidden shadow-subtle">
        {appointments.length === 0 ? (
          <p className="p-8 text-center text-xs text-slate-400">Nenhuma consulta encontrada.</p>
        ) : (
          <div className="divide-y">
            {appointments.map((appt) => {
              const dt = new Date(appt.date_time)
              return (
                <div
                  key={appt.id}
                  className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 border border-blue-200 p-1.5 rounded text-center min-w-[60px]">
                      <span className="block font-bold text-blue-900">
                        {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="block text-[10px] text-blue-700">
                        {dt.toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {appt.expand?.patient?.name || 'Paciente'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {appt.expand?.doctor?.name || 'Médico'} — {appt.reason || 'Consulta'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {appt.status.replace('_', ' ')}
                    </Badge>
                    {appt.status === 'agendada' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleAction(appt.id, 'confirmada')}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" /> Confirmar
                      </Button>
                    )}
                    {(appt.status === 'agendada' || appt.status === 'confirmada') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-red-600"
                        onClick={() => handleAction(appt.id, 'cancelada')}
                      >
                        <XCircle className="h-3 w-3 mr-1" /> Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
