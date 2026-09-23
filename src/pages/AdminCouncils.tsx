import { useState, useEffect } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  User,
  CalendarPlus,
  Pill,
  XCircle,
  FileText,
  MapPin,
  Video,
  Send,
  AlertCircle,
  UserCheck,
  Filter,
  RefreshCw,
  Search,
} from 'lucide-react'
import { getUnapprovedUsers, approveUserCouncil } from '@/services/admin'
import { getPendingRenewalPrescriptions, updatePrescriptionStatus } from '@/services/prescriptions'
import { getPatients } from '@/services/patients'
import { getClinicDoctors } from '@/services/clinic'
import { getSpecialties } from '@/services/specialties'
import { createAppointment } from '@/services/appointments'
import { createNotification } from '@/services/notifications'
import { PrescriptionRecord, Patient, Specialty } from '@/types/clinical'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

interface PendingUser {
  id: string
  name: string
  email: string
  council_type?: string
  council_number?: string
  crm?: string
  specialty?: string
  created: string
}

export default function AdminCouncils() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'consultas' | 'receitas' | 'conselhos'>('consultas')

  // ==========================================
  // ABA 1: CADASTRAR CONSULTA VÁLIDA (SECRETARIA)
  // ==========================================
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [loadingData, setLoadingData] = useState(false)

  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('09:00')
  const [modality, setModality] = useState<'presencial' | 'online'>('presencial')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmittingAppt, setIsSubmittingAppt] = useState(false)

  // ==========================================
  // ABA 2: RENOVAÇÃO DE RECEITAS PENDENTES
  // ==========================================
  const [pendingRenewals, setPendingRenewals] = useState<PrescriptionRecord[]>([])
  const [loadingRenewals, setLoadingRenewals] = useState(false)
  const [selectedRxAction, setSelectedRxAction] = useState<{
    rx: PrescriptionRecord
    action: 'aprovar' | 'rejeitar'
  } | null>(null)
  const [actionJustification, setActionJustification] = useState('')
  const [isProcessingRx, setIsProcessingRx] = useState(false)

  // ==========================================
  // ABA 3: APROVAÇÃO DE CONSELHOS PROFISSIONAIS
  // ==========================================
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [approvingUserId, setApprovingUserId] = useState<string | null>(null)

  // Carregar dados gerais
  const loadInitialData = async () => {
    setLoadingData(true)
    try {
      const [pList, dList, sList] = await Promise.all([
        getPatients().catch(() => []),
        getClinicDoctors().catch(() => []),
        getSpecialties().catch(() => []),
      ])
      setPatients(pList)
      setDoctors(dList)
      setSpecialties(sList)

      // Set default date to today
      const today = new Date()
      setAppointmentDate(today.toISOString().slice(0, 10))
    } catch {
      /* ignored */
    } finally {
      setLoadingData(false)
    }
  }

  const loadRenewals = async () => {
    setLoadingRenewals(true)
    try {
      const list = await getPendingRenewalPrescriptions()
      setPendingRenewals(list)
    } catch {
      setPendingRenewals([])
    } finally {
      setLoadingRenewals(false)
    }
  }

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const users = await getUnapprovedUsers()
      setPendingUsers(users as unknown as PendingUser[])
    } catch {
      setPendingUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    loadInitialData()
    loadRenewals()
    loadUsers()
  }, [])

  // Auto-fill specialty when doctor is selected
  const handleDoctorChange = (docId: string) => {
    setSelectedDoctorId(docId)
    const doc = doctors.find((d) => d.id === docId)
    if (doc?.specialty) {
      setSelectedSpecialtyId(typeof doc.specialty === 'object' ? doc.specialty.id : doc.specialty)
    }
  }

  // Submit Nova Consulta
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatientId || !selectedDoctorId || !appointmentDate || !appointmentTime) {
      toast({
        title: 'Campos obrigatórios incompletos',
        description: 'Selecione paciente, médico, data e horário para cadastrar a consulta.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmittingAppt(true)
    try {
      const dateTimeIso = new Date(`${appointmentDate}T${appointmentTime}:00`).toISOString()
      const modalityLabel = modality === 'online' ? 'Telemedicina' : 'Presencial'
      const fullNotes = `Modalidade: ${modalityLabel}${notes ? ` | Obs: ${notes}` : ''}`

      await createAppointment({
        patient: selectedPatientId,
        doctor: selectedDoctorId,
        date_time: dateTimeIso,
        status: 'confirmada',
        reason: reason || `Consulta ${modalityLabel}`,
        notes: fullNotes,
      })

      // Send notification to doctor
      await createNotification({
        userId: selectedDoctorId,
        title: 'Nova consulta agendada pela Secretaria',
        message: `Consulta ${modalityLabel} agendada para ${new Date(dateTimeIso).toLocaleString('pt-BR')}.`,
        type: 'info',
        link: '/agenda',
      }).catch(() => {})

      toast({
        title: 'Consulta cadastrada e confirmada!',
        description: `Agendamento realizado com sucesso para ${modalityLabel}.`,
      })

      // Reset form fields
      setSelectedPatientId('')
      setSelectedDoctorId('')
      setSelectedSpecialtyId('')
      setReason('')
      setNotes('')
    } catch (err: any) {
      toast({
        title: 'Erro ao cadastrar consulta',
        description: err?.message || 'Verifique as informações e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmittingAppt(false)
    }
  }

  // Handle Approve/Reject Prescription Renewal
  const handleProcessRenewal = async () => {
    if (!selectedRxAction) return

    if (selectedRxAction.action === 'rejeitar' && !actionJustification.trim()) {
      toast({
        title: 'Justificativa obrigatória',
        description: 'Informe o motivo da rejeição da renovação para o paciente.',
        variant: 'destructive',
      })
      return
    }

    setIsProcessingRx(true)
    try {
      const rx = selectedRxAction.rx
      const isApproval = selectedRxAction.action === 'aprovar'
      const newStatus = isApproval ? 'enviada' : 'rejeitada'

      await updatePrescriptionStatus(rx.id, {
        status: newStatus,
        renewal_justification: actionJustification.trim() || undefined,
        sent_at: isApproval ? new Date().toISOString() : undefined,
        notes: actionJustification.trim()
          ? `${rx.notes || ''} [Secretaria: ${actionJustification.trim()}]`
          : rx.notes,
      })

      // Notificar médico
      if (rx.doctor_id) {
        await createNotification({
          userId: rx.doctor_id,
          title: isApproval ? 'Renovação de Receita Aprovada' : 'Renovação de Receita Rejeitada',
          message: `A solicitação de renovação do paciente ${rx.expand?.patient_id?.name || ''} foi ${isApproval ? 'aprovada' : 'rejeitada'}. Justificativa: ${actionJustification || 'Em conformidade médica.'}`,
          type: isApproval ? 'success' : 'warning',
          link: '/doctor/receitas',
        }).catch(() => {})
      }

      toast({
        title: isApproval ? 'Receita renovada e aprovada!' : 'Renovação rejeitada',
        description: isApproval
          ? 'A nova via da receita foi validada e liberada ao paciente.'
          : 'A solicitação foi rejeitada com a justificativa registrada.',
      })

      setSelectedRxAction(null)
      setActionJustification('')
      loadRenewals()
    } catch (err: any) {
      toast({
        title: 'Erro ao processar renovação',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessingRx(false)
    }
  }

  // Handle Approve Council
  const handleApproveCouncil = async (userId: string) => {
    setApprovingUserId(userId)
    try {
      await approveUserCouncil(userId)
      toast({ title: 'Registro profissional aprovado com sucesso!' })
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch {
      toast({ title: 'Erro ao aprovar registro', variant: 'destructive' })
    } finally {
      setApprovingUserId(null)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 pb-12 min-w-0">
      {/* Header Banner */}
      <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 break-words">
              Central de Aprovações & Secretaria
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed break-words">
              Gerencie novos agendamentos válidos, renovações de receitas e aprovações de registros
              profissionais.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            loadInitialData()
            loadRenewals()
            loadUsers()
          }}
          className="text-xs h-8 self-start sm:self-auto shrink-0 w-full sm:w-auto justify-center"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Atualizar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'consultas' | 'receitas' | 'conselhos')}
        className="space-y-4 w-full min-w-0"
      >
        <div className="w-full min-w-0">
          <TabsList className="bg-slate-100 p-1 rounded-xl h-auto w-full grid grid-cols-1 sm:grid-cols-3 gap-1">
            <TabsTrigger
              value="consultas"
              className="text-xs px-3 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-900 data-[state=active]:shadow-xs flex items-center justify-center gap-2 font-semibold min-w-0 whitespace-normal text-center h-auto min-h-[38px]"
            >
              <CalendarPlus className="h-4 w-4 text-blue-600 shrink-0" />
              <span className="truncate sm:whitespace-normal">Cadastrar Consulta Válida</span>
            </TabsTrigger>

            <TabsTrigger
              value="receitas"
              className="text-xs px-3 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-xs flex items-center justify-center gap-2 font-semibold min-w-0 whitespace-normal text-center h-auto min-h-[38px]"
            >
              <Pill className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="truncate sm:whitespace-normal">Renovação de Receitas</span>
              {pendingRenewals.length > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-amber-500 text-white hover:bg-amber-500 shrink-0">
                  {pendingRenewals.length}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger
              value="conselhos"
              className="text-xs px-3 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-xs flex items-center justify-center gap-2 font-semibold min-w-0 whitespace-normal text-center h-auto min-h-[38px]"
            >
              <UserCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="truncate sm:whitespace-normal">Conselhos Profissionais</span>
              {pendingUsers.length > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-blue-600 text-white hover:bg-blue-600 shrink-0">
                  {pendingUsers.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ================================================================= */}
        {/* ABA 1: CADASTRAR CONSULTA VÁLIDA PELA SECRETARIA */}
        {/* ================================================================= */}
        <TabsContent value="consultas" className="min-w-0">
          <Card className="border-slate-200 shadow-subtle min-w-0">
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 min-w-0">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2 break-words">
                <CalendarPlus className="h-4 w-4 text-blue-600 shrink-0" />
                <span>Novo Agendamento Direto da Secretaria</span>
              </CardTitle>
              <CardDescription className="text-xs break-words">
                Cadastre e valide agendamentos com seleção completa de paciente, médico,
                especialidade, data/horário e modalidade de atendimento.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-4 min-w-0">
              <form onSubmit={handleCreateAppointment} className="space-y-4 min-w-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
                  {/* Paciente */}
                  <div className="space-y-1.5 min-w-0">
                    <Label className="text-xs font-semibold text-slate-700">
                      Paciente <span className="text-red-500">*</span>
                    </Label>
                    <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                      <SelectTrigger className="text-xs h-9 w-full min-w-0">
                        <SelectValue placeholder="Selecione o paciente cadastrado" />
                      </SelectTrigger>
                      <SelectContent className="max-w-[calc(100vw-2rem)]">
                        {patients.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} {p.cpf ? `(CPF: ${p.cpf})` : ''}{' '}
                            {p.insurance ? `— ${p.insurance}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Médico */}
                  <div className="space-y-1.5 min-w-0">
                    <Label className="text-xs font-semibold text-slate-700">
                      Médico Responsável <span className="text-red-500">*</span>
                    </Label>
                    <Select value={selectedDoctorId} onValueChange={handleDoctorChange}>
                      <SelectTrigger className="text-xs h-9 w-full min-w-0">
                        <SelectValue placeholder="Selecione o profissional de saúde" />
                      </SelectTrigger>
                      <SelectContent className="max-w-[calc(100vw-2rem)]">
                        {doctors.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name} {d.crm ? `(${d.crm})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Especialidade */}
                  <div className="space-y-1.5 min-w-0">
                    <Label className="text-xs font-semibold text-slate-700">Especialidade</Label>
                    <Select value={selectedSpecialtyId} onValueChange={setSelectedSpecialtyId}>
                      <SelectTrigger className="text-xs h-9 w-full min-w-0">
                        <SelectValue placeholder="Selecione ou confirme a especialidade" />
                      </SelectTrigger>
                      <SelectContent className="max-w-[calc(100vw-2rem)]">
                        {specialties.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Data e Horário */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
                    <div className="space-y-1.5 min-w-0">
                      <Label className="text-xs font-semibold text-slate-700">
                        Data <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className="text-xs h-9 w-full min-w-0"
                        required
                      />
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <Label className="text-xs font-semibold text-slate-700">
                        Horário <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="time"
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        className="text-xs h-9 w-full min-w-0"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Modalidade de Atendimento */}
                <div className="space-y-2 pt-2 border-t min-w-0">
                  <Label className="text-xs font-semibold text-slate-700">
                    Modalidade de Atendimento <span className="text-red-500">*</span>
                  </Label>
                  <RadioGroup
                    value={modality}
                    onValueChange={(val) => setModality(val as 'presencial' | 'online')}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0"
                  >
                    <label
                      htmlFor="mod-presencial"
                      className={`flex items-start sm:items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all min-w-0 ${
                        modality === 'presencial'
                          ? 'border-blue-500 bg-blue-50/70 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <RadioGroupItem
                        value="presencial"
                        id="mod-presencial"
                        className="mt-0.5 sm:mt-0 shrink-0"
                      />
                      <div className="text-xs min-w-0 flex-1">
                        <p className="font-bold text-slate-900 flex items-center gap-1.5 break-words">
                          <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span>Presencial na Clínica</span>
                        </p>
                        <p className="text-slate-500 text-[11px] mt-0.5 break-words">
                          Atendimento no consultório físico da unidade.
                        </p>
                      </div>
                    </label>

                    <label
                      htmlFor="mod-online"
                      className={`flex items-start sm:items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all min-w-0 ${
                        modality === 'online'
                          ? 'border-indigo-500 bg-indigo-50/70 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <RadioGroupItem
                        value="online"
                        id="mod-online"
                        className="mt-0.5 sm:mt-0 shrink-0"
                      />
                      <div className="text-xs min-w-0 flex-1">
                        <p className="font-bold text-slate-900 flex items-center gap-1.5 break-words">
                          <Video className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                          <span>Telemedicina / Online</span>
                        </p>
                        <p className="text-slate-500 text-[11px] mt-0.5 break-words">
                          Consulta virtual com sala de vídeo integrada Resulta.
                        </p>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                {/* Motivo e Observações */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 min-w-0">
                  <div className="space-y-1.5 min-w-0">
                    <Label className="text-xs font-semibold text-slate-700">
                      Motivo da Consulta / Queixa
                    </Label>
                    <Input
                      placeholder="Ex: Primeira consulta, Check-up anual, Retorno de exames..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="text-xs h-9 w-full min-w-0"
                    />
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <Label className="text-xs font-semibold text-slate-700">
                      Observações da Secretaria
                    </Label>
                    <Input
                      placeholder="Ex: Paciente trará exames anteriores, convênio autorizado..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="text-xs h-9 w-full min-w-0"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end pt-3 border-t gap-2 min-w-0">
                  <Button
                    type="submit"
                    disabled={
                      isSubmittingAppt ||
                      !selectedPatientId ||
                      !selectedDoctorId ||
                      !appointmentDate ||
                      !appointmentTime
                    }
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 h-9 w-full sm:w-auto"
                  >
                    {isSubmittingAppt ? (
                      'Cadastrando Consulta...'
                    ) : (
                      <>
                        <CalendarPlus className="h-4 w-4 mr-1.5 shrink-0" /> Confirmar e Cadastrar
                        Consulta
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================= */}
        {/* ABA 2: RENOVAÇÃO DE RECEITAS PENDENTES */}
        {/* ================================================================= */}
        <TabsContent value="receitas" className="min-w-0">
          <Card className="border-slate-200 shadow-subtle min-w-0">
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2 break-words">
                  <Pill className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Solicitações de Renovação de Receitas ({pendingRenewals.length})</span>
                </CardTitle>
                <CardDescription className="text-xs break-words">
                  Receitas com status "Aguardando renovação" solicitadas pelos pacientes via portal.
                  Avalie e registre a aprovação ou rejeição com justificativa.
                </CardDescription>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={loadRenewals}
                disabled={loadingRenewals}
                className="h-8 text-xs shrink-0 self-start sm:self-auto w-full sm:w-auto justify-center"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 mr-1 ${loadingRenewals ? 'animate-spin' : ''}`}
                />
                Atualizar
              </Button>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-4 min-w-0">
              {loadingRenewals ? (
                <div className="flex items-center justify-center py-10 min-w-0">
                  <div className="h-8 w-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : pendingRenewals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center min-w-0">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2 shrink-0" />
                  <p className="text-sm font-semibold text-slate-700">
                    Nenhuma renovação de receita pendente!
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Todas as solicitações de renovação de receitas foram processadas.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 min-w-0">
                  {pendingRenewals.map((rx) => {
                    const patName = rx.expand?.patient_id?.name || 'Paciente'
                    const patCpf = rx.expand?.patient_id?.cpf || ''
                    const docName = rx.expand?.doctor_id?.name || 'Médico Prescritor'
                    const docCrm = rx.expand?.doctor_id?.crm || ''
                    const dateReq = rx.renewal_requested_at || rx.created

                    return (
                      <div
                        key={rx.id}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-3 hover:border-slate-300 transition-all min-w-0"
                      >
                        {/* Header do Card */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5 min-w-0">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                              <Pill className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                                <h4 className="font-bold text-sm text-slate-900 break-words">
                                  {patName}
                                </h4>
                                <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-[10px] shrink-0">
                                  Aguardando Renovação
                                </Badge>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 break-words">
                                {patCpf && `CPF: ${patCpf} • `}Solicitado em:{' '}
                                {dateReq ? new Date(dateReq).toLocaleDateString('pt-BR') : 'Hoje'}
                              </p>
                            </div>
                          </div>

                          <div className="text-xs text-slate-600 sm:text-right shrink-0 min-w-0">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              Médico Prescritor
                            </span>
                            <span className="font-semibold text-slate-800 break-words">
                              {docName}
                            </span>
                            {docCrm && <span className="text-slate-500"> ({docCrm})</span>}
                          </div>
                        </div>

                        {/* Mensagem do paciente */}
                        {rx.renewal_patient_notes && (
                          <div className="p-2.5 bg-amber-50/80 rounded-lg border border-amber-200/70 text-xs text-amber-900 break-words min-w-0">
                            <strong>Mensagem do paciente:</strong> {rx.renewal_patient_notes}
                          </div>
                        )}

                        {/* Medicamentos */}
                        <div className="space-y-1.5 min-w-0">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Medicamentos Solicitados:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
                            {(rx.medications || []).map((m, idx) => (
                              <div
                                key={idx}
                                className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs space-y-0.5 min-w-0 overflow-hidden"
                              >
                                <p className="font-bold text-slate-900 break-words">
                                  {m.medication}
                                </p>
                                <p className="text-slate-600 break-words">
                                  {m.dosage} {m.frequency && `• ${m.frequency}`}
                                </p>
                                {m.instructions && (
                                  <p className="text-[10px] text-slate-500 italic break-words">
                                    Obs: {m.instructions}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1 border-t border-slate-200/60 min-w-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRxAction({ rx, action: 'rejeitar' })
                              setActionJustification('')
                            }}
                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-8 w-full sm:w-auto justify-center"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1 shrink-0" /> Rejeitar Renovação
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRxAction({ rx, action: 'aprovar' })
                              setActionJustification('Renovação autorizada pela secretaria.')
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8 w-full sm:w-auto justify-center"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1 shrink-0" /> Aprovar Renovação
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================= */}
        {/* ABA 3: APROVAÇÃO DE CONSELHOS PROFISSIONAIS */}
        {/* ================================================================= */}
        <TabsContent value="conselhos" className="min-w-0">
          <Card className="border-slate-200 shadow-subtle min-w-0">
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2 break-words">
                  <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Registros de Conselhos Pendentes ({pendingUsers.length})</span>
                </CardTitle>
                <CardDescription className="text-xs break-words">
                  Médicos e profissionais que criaram cadastro e aguardam validação do registro de
                  conselho (CRM, CRN, etc.).
                </CardDescription>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={loadUsers}
                disabled={loadingUsers}
                className="h-8 text-xs shrink-0 self-start sm:self-auto w-full sm:w-auto justify-center"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loadingUsers ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-4 min-w-0">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8 min-w-0">
                  <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : pendingUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center min-w-0">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2 shrink-0" />
                  <p className="text-sm text-slate-600">Nenhum registro pendente de aprovação.</p>
                </div>
              ) : (
                <div className="space-y-3 min-w-0">
                  {pendingUsers.map((u) => (
                    <div
                      key={u.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg gap-3 min-w-0"
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-slate-900 break-words">
                            {u.name}
                          </p>
                          <p className="text-xs text-slate-500 break-words">{u.email}</p>
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 min-w-0">
                            {u.council_type && (
                              <Badge variant="secondary" className="text-[10px] shrink-0">
                                {u.council_type}
                              </Badge>
                            )}
                            {u.council_number && (
                              <span className="text-[11px] text-slate-600 font-medium break-words">
                                Nº: {u.council_number}
                              </span>
                            )}
                            {u.crm && !u.council_number && (
                              <span className="text-[11px] text-slate-600 font-medium break-words">
                                CRM: {u.crm}
                              </span>
                            )}
                            {u.specialty && (
                              <span className="text-[11px] text-slate-400 break-words">
                                | {u.specialty}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleApproveCouncil(u.id)}
                        disabled={approvingUserId === u.id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-xs text-white shrink-0 w-full sm:w-auto justify-center h-8"
                      >
                        {approvingUserId === u.id ? (
                          'Aprovando...'
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1 shrink-0" /> Aprovar
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Confirmação e Justificativa de Renovação de Receita */}
      {selectedRxAction && (
        <Dialog open={!!selectedRxAction} onOpenChange={() => setSelectedRxAction(null)}>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-4 sm:p-6 overflow-hidden">
            <DialogHeader className="min-w-0">
              <DialogTitle className="flex items-center gap-2 text-slate-900 text-base break-words">
                {selectedRxAction.action === 'aprovar' ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>Aprovar Renovação de Receita</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                    <span>Rejeitar Renovação de Receita</span>
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs break-words">
                Paciente:{' '}
                <strong>{selectedRxAction.rx.expand?.patient_id?.name || 'Não informado'}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs min-w-0">
              <div className="p-3 bg-slate-50 border rounded-lg space-y-1 min-w-0">
                <p className="font-semibold text-slate-800">Medicamentos:</p>
                {(selectedRxAction.rx.medications || []).map((m, i) => (
                  <p key={i} className="text-slate-600 break-words">
                    • {m.medication} ({m.dosage})
                  </p>
                ))}
              </div>

              <div className="space-y-1.5 min-w-0">
                <Label className="text-xs font-semibold text-slate-700 break-words">
                  Justificativa / Parecer da Secretaria{' '}
                  {selectedRxAction.action === 'rejeitar' && (
                    <span className="text-red-500">* (Obrigatório)</span>
                  )}
                </Label>
                <Textarea
                  value={actionJustification}
                  onChange={(e) => setActionJustification(e.target.value)}
                  placeholder={
                    selectedRxAction.action === 'aprovar'
                      ? 'Ex: Renovação autorizada para continuidade de uso contínuo.'
                      : 'Ex: Necessário agendamento de consulta de retorno presencial para reavaliação de dosagem.'
                  }
                  className="text-xs w-full min-w-0"
                  rows={3}
                  required={selectedRxAction.action === 'rejeitar'}
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRxAction(null)}
                disabled={isProcessingRx}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleProcessRenewal}
                disabled={isProcessingRx}
                className={`w-full sm:w-auto font-semibold ${
                  selectedRxAction.action === 'aprovar'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isProcessingRx
                  ? 'Processando...'
                  : selectedRxAction.action === 'aprovar'
                    ? 'Confirmar Aprovação'
                    : 'Confirmar Rejeição'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
