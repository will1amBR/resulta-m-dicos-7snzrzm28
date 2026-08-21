import { useState, useEffect, useMemo } from 'react'
import {
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  User,
  Clock,
  Video,
  MapPin,
  RefreshCw,
} from 'lucide-react'
import { getClinicAppointments, getClinicDoctors } from '@/services/clinic'
import { updateAppointment, createAppointment } from '@/services/appointments'
import { getPatients } from '@/services/patients'
import { createNotification } from '@/services/notifications'
import { Appointment, AppointmentStatus, Patient } from '@/types/clinical'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

export default function ClinicAgenda() {
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctorFilter, setDoctorFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [dateFilter, setDateFilter] = useState('')
  const [loading, setLoading] = useState(false)

  // Modal Nova Consulta
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newPatientId, setNewPatientId] = useState('')
  const [newDoctorId, setNewDoctorId] = useState('')
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10))
  const [newTime, setNewTime] = useState('09:00')
  const [newModality, setNewModality] = useState<'presencial' | 'online'>('presencial')
  const [newReason, setNewReason] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const list = await getClinicAppointments(
        doctorFilter !== 'todos' ? doctorFilter : undefined,
        statusFilter,
        dateFilter || undefined,
      )
      setAppointments(list)
    } catch {
      /* ignored */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    Promise.all([getClinicDoctors().catch(() => []), getPatients().catch(() => [])]).then(
      ([dList, pList]) => {
        setDoctors(dList)
        setPatients(pList)
      },
    )
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
      toast({
        title: 'Status atualizado com sucesso!',
        description: `A consulta agora está com status "${status.replace('_', ' ')}".`,
      })
      loadData()
    } catch {
      toast({ title: 'Erro ao atualizar consulta', variant: 'destructive' })
    }
  }

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPatientId || !newDoctorId || !newDate || !newTime) {
      toast({
        title: 'Preencha os campos obrigatórios',
        description: 'Selecione médico, paciente, data e horário para agendar.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const dateTimeIso = new Date(`${newDate}T${newTime}:00`).toISOString()
      const modalityLabel =
        newModality === 'online' ? 'Teleconsulta Online' : 'Presencial na Clínica'
      const fullNotes = `Modalidade: ${modalityLabel}${newNotes ? ` | ${newNotes}` : ''}`

      await createAppointment({
        doctor: newDoctorId,
        patient: newPatientId,
        date_time: dateTimeIso,
        status: 'confirmada',
        reason: newReason || `Consulta ${modalityLabel}`,
        notes: fullNotes,
      })

      // Notificar médico
      await createNotification({
        userId: newDoctorId,
        title: 'Nova consulta agendada pela Clínica',
        message: `Consulta com paciente marcada para ${new Date(dateTimeIso).toLocaleString('pt-BR')}.`,
        type: 'info',
        link: '/agenda',
      }).catch(() => {})

      toast({
        title: 'Consulta agendada com sucesso!',
        description: 'O agendamento foi registrado e confirmado no calendário.',
      })

      setCreateModalOpen(false)
      setNewPatientId('')
      setNewDoctorId('')
      setNewReason('')
      setNewNotes('')
      loadData()
    } catch (err: any) {
      toast({
        title: 'Erro ao criar consulta',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header com Ações */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-emerald-600" /> Agenda Geral da Clínica
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Visão unificada dos agendamentos de todos os médicos e salas de atendimento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="h-9 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>

          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 gap-1.5 shadow-xs"
          >
            <Plus className="h-4 w-4" /> Nova Consulta
          </Button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-wrap gap-2.5 items-center bg-white p-3 rounded-lg border border-slate-200">
        <Select value={doctorFilter} onValueChange={setDoctorFilter}>
          <SelectTrigger className="h-8 text-xs w-48 bg-slate-50 border-slate-200">
            <SelectValue placeholder="Médico" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os médicos</SelectItem>
            {doctors.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name} {d.crm ? `(${d.crm})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 text-xs w-36 bg-slate-50 border-slate-200">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="agendada">Agendada</SelectItem>
            <SelectItem value="confirmada">Confirmada</SelectItem>
            <SelectItem value="em_andamento">Em andamento</SelectItem>
            <SelectItem value="finalizada">Finalizada</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-8 text-xs w-36 bg-slate-50 border-slate-200"
          />
          {dateFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateFilter('')}
              className="h-8 text-[11px] px-2 text-slate-500"
            >
              Limpar data
            </Button>
          )}
        </div>
      </div>

      {/* Lista de Consultas */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-subtle">
        {appointments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <CalendarIcon className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">Nenhuma consulta encontrada.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Altere os filtros acima ou crie uma nova consulta para a clínica.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.map((appt) => {
              const dt = new Date(appt.date_time)
              const timeStr = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              const dateStr = dt.toLocaleDateString('pt-BR')
              const isOnline =
                appt.notes?.toLowerCase().includes('online') ||
                appt.reason?.toLowerCase().includes('teleconsulta')

              return (
                <div
                  key={appt.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="bg-emerald-50 border border-emerald-200/80 p-2 rounded-xl text-center min-w-[70px]">
                      <span className="block font-black text-emerald-900 text-sm">{timeStr}</span>
                      <span className="block text-[10px] text-emerald-700 font-medium">
                        {dateStr}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-slate-900">
                          {appt.expand?.patient?.name || 'Paciente'}
                        </p>
                        {isOnline ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] gap-1 border-indigo-200 bg-indigo-50 text-indigo-700"
                          >
                            <Video className="h-3 w-3" /> Online
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] gap-1 border-slate-200 bg-slate-50 text-slate-600"
                          >
                            <MapPin className="h-3 w-3" /> Presencial
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 font-medium">
                        Dr(a). {appt.expand?.doctor?.name || 'Médico'} — {appt.reason || 'Consulta'}
                      </p>
                      {appt.notes && (
                        <p className="text-[11px] text-slate-400 italic truncate max-w-md">
                          {appt.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize font-medium ${
                        appt.status === 'confirmada'
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                          : appt.status === 'em_andamento'
                            ? 'border-blue-300 bg-blue-50 text-blue-700'
                            : appt.status === 'finalizada'
                              ? 'border-slate-300 bg-slate-100 text-slate-700'
                              : appt.status === 'cancelada'
                                ? 'border-red-300 bg-red-50 text-red-700'
                                : 'border-amber-300 bg-amber-50 text-amber-700'
                      }`}
                    >
                      {appt.status.replace('_', ' ')}
                    </Badge>

                    {appt.status === 'agendada' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => handleAction(appt.id, 'confirmada')}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" /> Confirmar
                      </Button>
                    )}

                    {(appt.status === 'agendada' || appt.status === 'confirmada') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-red-600 hover:bg-red-50 border-red-200"
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

      {/* Modal Criar Nova Consulta */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-emerald-600" /> Agendar Nova Consulta na Clínica
            </DialogTitle>
            <DialogDescription className="text-xs">
              Selecione o paciente, o médico responsável e defina os parâmetros do atendimento.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAppointment} className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">
                  Paciente <span className="text-red-500">*</span>
                </Label>
                <Select value={newPatientId} onValueChange={setNewPatientId}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} {p.cpf ? `(${p.cpf})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">
                  Médico Responsável <span className="text-red-500">*</span>
                </Label>
                <Select value={newDoctorId} onValueChange={setNewDoctorId}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue placeholder="Selecione o médico" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name} {d.crm ? `(${d.crm})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">
                  Data <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="text-xs h-8"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">
                  Horário <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="text-xs h-8"
                  required
                />
              </div>
            </div>

            {/* Modalidade */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold">Modalidade</Label>
              <RadioGroup
                value={newModality}
                onValueChange={(v) => setNewModality(v as 'presencial' | 'online')}
                className="grid grid-cols-2 gap-2"
              >
                <label
                  htmlFor="mod-clin-pres"
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs ${
                    newModality === 'presencial'
                      ? 'border-emerald-500 bg-emerald-50/60 font-semibold text-emerald-900'
                      : 'border-slate-200'
                  }`}
                >
                  <RadioGroupItem value="presencial" id="mod-clin-pres" />
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" /> Presencial
                </label>

                <label
                  htmlFor="mod-clin-onl"
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs ${
                    newModality === 'online'
                      ? 'border-indigo-500 bg-indigo-50/60 font-semibold text-indigo-900'
                      : 'border-slate-200'
                  }`}
                >
                  <RadioGroupItem value="online" id="mod-clin-onl" />
                  <Video className="h-3.5 w-3.5 text-indigo-600" /> Teleconsulta
                </label>
              </RadioGroup>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Motivo da Consulta</Label>
              <Input
                placeholder="Ex: Consulta de Rotina, Retorno, Avaliação..."
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Observações / Recomendações</Label>
              <Input
                placeholder="Ex: Jejum de 8 horas, trazer exames anteriores..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !newPatientId || !newDoctorId || !newDate || !newTime}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {isSubmitting ? 'Agendando...' : 'Confirmar Agendamento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
