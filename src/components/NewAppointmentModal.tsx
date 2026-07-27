import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getPatients } from '@/services/patients'
import { createAppointment } from '@/services/appointments'
import { Patient, AppointmentStatus } from '@/types/clinical'
import { useAuth } from '@/hooks/use-auth'

interface NewAppointmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function NewAppointmentModal({ open, onOpenChange, onSuccess }: NewAppointmentModalProps) {
  const { user } = useAuth()
  const [patients, setPatients] = useState<Patient[]>([])
  const [patientId, setPatientId] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [status, setStatus] = useState<AppointmentStatus>('agendada')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      getPatients()
        .then(setPatients)
        .catch(() => {})
      const now = new Date()
      now.setMinutes(0, 0, 0)
      setDateTime(now.toISOString().slice(0, 16))
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !patientId || !dateTime) return
    setLoading(true)
    try {
      await createAppointment({
        doctor: user.id,
        patient: patientId,
        date_time: new Date(dateTime).toISOString(),
        status,
        reason,
        notes,
      })
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-xs">Paciente</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger className="mt-1 text-xs h-9">
                <SelectValue placeholder="Selecione o paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.cpf})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Data e Horário</Label>
            <Input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="mt-1 text-xs"
              required
            />
          </div>

          <div>
            <Label className="text-xs">Status Inicial</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as AppointmentStatus)}>
              <SelectTrigger className="mt-1 text-xs h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agendada">Agendada</SelectItem>
                <SelectItem value="confirmada">Confirmada</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Motivo / Queixa Principal</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Consulta de rotina, Retorno..."
              className="mt-1 text-xs"
            />
          </div>

          <div>
            <Label className="text-xs">Observações Internas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações para a equipe..."
              className="mt-1 text-xs h-16"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !patientId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Salvando...' : 'Confirmar Agendamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
