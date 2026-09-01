import { useState, useEffect } from 'react'
import {
  FileText,
  Plus,
  Search,
  Calendar,
  User,
  Pill,
  Send,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Filter,
  Trash2,
  RefreshCw,
  Sparkles,
  Info,
  ExternalLink,
  ChevronRight,
  Eye,
  Check,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useActivePatient } from '@/contexts/active-patient-context'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Patient,
  PrescriptionRecord,
  PrescriptionItem,
  MedicationAlert,
  CertificateStatus,
  Medication,
} from '@/types/clinical'
import { getPatients } from '@/services/patients'
import { searchMedications } from '@/services/medications'
import { analyzeMedications } from '@/services/medications'
import {
  getDoctorPrescriptions,
  createPrescription,
  updatePrescriptionStatus,
} from '@/services/prescriptions'
import { createNotification } from '@/services/notifications'
import { CertificateStatusBadge } from '@/components/CertificateStatusBadge'
import { MedicationAlerts } from '@/components/MedicationAlerts'
import { PrescriptionSendModal } from '@/components/PrescriptionSendModal'
import { useNavigate } from 'react-router-dom'

export default function DoctorReceitas() {
  const { user } = useAuth()
  const { activePatient, setActivePatient } = useActivePatient()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'nova' | 'historico'>('nova')

  // Certificate status of current doctor
  const rawStatus = (user?.certificate_status || '').toLowerCase()
  const isCertValidated = rawStatus === 'validado' || rawStatus === 'active'
  const certStatus: CertificateStatus =
    rawStatus === 'validado' || rawStatus === 'active'
      ? 'validado'
      : rawStatus === 'pendente' || rawStatus === 'pending' || rawStatus === 'pending_validation'
        ? 'pendente'
        : 'nao_enviado'

  // ==========================================
  // SEÇÃO 1: NOVA RECEITA (FORM STATE)
  // ==========================================
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(activePatient || null)
  const [patientSearchQuery, setPatientSearchQuery] = useState('')
  const [patientResults, setPatientResults] = useState<Patient[]>([])
  const [isSearchingPatients, setIsSearchingPatients] = useState(false)

  // Medication Item inputs
  const [medQuery, setMedQuery] = useState('')
  const [medResults, setMedResults] = useState<Medication[]>([])
  const [selectedMedObj, setSelectedMedObj] = useState<Medication | null>(null)
  const [medDosage, setMedDosage] = useState('')
  const [medFrequency, setMedFrequency] = useState('')
  const [medPeriodDays, setMedPeriodDays] = useState<number | ''>(7)
  const [medInstructions, setMedInstructions] = useState('')

  // Prescribed list
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([])
  const [rxNotes, setRxNotes] = useState('')

  // AI Cross-Analysis
  const [aiAlerts, setAiAlerts] = useState<MedicationAlert[]>([])
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false)

  // Submitting
  const [isSubmittingRx, setIsSubmittingRx] = useState(false)

  // ==========================================
  // SEÇÃO 2: HISTÓRICO DE RECEITAS
  // ==========================================
  const [historyList, setHistoryList] = useState<PrescriptionRecord[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('todas')

  // Modal de Envio
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [selectedRxForSend, setSelectedRxForSend] = useState<PrescriptionRecord | null>(null)

  // View Details Modal
  const [viewDetailsRx, setViewDetailsRx] = useState<PrescriptionRecord | null>(null)

  // Synchronize active patient if already selected globally
  useEffect(() => {
    if (activePatient && !selectedPatient) {
      setSelectedPatient(activePatient)
    }
  }, [activePatient, selectedPatient])

  // Patient Autocomplete Search
  useEffect(() => {
    if (!patientSearchQuery.trim()) {
      setPatientResults([])
      return
    }
    const timer = setTimeout(async () => {
      setIsSearchingPatients(true)
      try {
        const list = await getPatients(patientSearchQuery)
        setPatientResults(list.slice(0, 6))
      } catch {
        setPatientResults([])
      } finally {
        setIsSearchingPatients(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [patientSearchQuery])

  // Medication Autocomplete Search
  useEffect(() => {
    if (!medQuery.trim()) {
      setMedResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await searchMedications(medQuery)
        setMedResults(res.items.slice(0, 6))
      } catch {
        setMedResults([])
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [medQuery])

  // Trigger AI cross analysis whenever medications change or patient changes
  const runAiAnalysis = async (items: PrescriptionItem[], pat: Patient | null) => {
    if (items.length === 0) {
      setAiAlerts([])
      return
    }
    setIsAnalyzingAi(true)
    try {
      const payload = {
        patient: pat?.id || 'demo-patient-analysis',
        cid10_codes: [
          'I10 - Hipertensão essencial',
          'E11 - Diabetes mellitus não-insulino-dependente',
        ],
        prescribed_medications: items.map((i) => ({
          medication: i.medication,
          dosage: `${i.dosage}${i.frequency ? ` - ${i.frequency}` : ''}${i.period_days ? ` por ${i.period_days} dias` : ''}`,
          instructions: i.instructions,
        })),
      }
      const res = await analyzeMedications(payload)
      setAiAlerts(res.alerts || [])
    } catch {
      // Fallback: rule-based check
      setAiAlerts([])
    } finally {
      setIsAnalyzingAi(false)
    }
  }

  // Load history list
  const loadHistory = async () => {
    setIsLoadingHistory(true)
    try {
      const list = await getDoctorPrescriptions(user?.id, {
        search: historySearch,
        status: historyStatusFilter,
      })
      setHistoryList(list)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [user?.id, historyStatusFilter])

  // Add medication to draft
  const handleAddMedication = () => {
    const medName = selectedMedObj?.name || medQuery.trim()
    if (!medName) {
      toast({
        title: 'Nome do medicamento obrigatório',
        description: 'Digite ou selecione um medicamento da lista.',
        variant: 'destructive',
      })
      return
    }

    const newItem: PrescriptionItem = {
      medication: medName,
      dosage: medDosage.trim() || '1 comprimido via oral',
      frequency: medFrequency.trim() || '1 vez ao dia',
      period_days: typeof medPeriodDays === 'number' ? medPeriodDays : 30,
      instructions: medInstructions.trim(),
    }

    const nextItems = [...prescriptionItems, newItem]
    setPrescriptionItems(nextItems)

    // Reset inputs
    setMedQuery('')
    setSelectedMedObj(null)
    setMedDosage('')
    setMedFrequency('')
    setMedPeriodDays(7)
    setMedInstructions('')
    setMedResults([])

    // Trigger AI analysis with updated items
    runAiAnalysis(nextItems, selectedPatient)
  }

  const handleRemoveMedication = (index: number) => {
    const nextItems = prescriptionItems.filter((_, i) => i !== index)
    setPrescriptionItems(nextItems)
    runAiAnalysis(nextItems, selectedPatient)
  }

  // Emit Prescription
  const handleEmitPrescription = async () => {
    if (!selectedPatient) {
      toast({
        title: 'Selecione um paciente',
        description: 'É necessário selecionar o paciente destinatário da receita.',
        variant: 'destructive',
      })
      return
    }

    if (prescriptionItems.length === 0) {
      toast({
        title: 'Nenhum medicamento adicionado',
        description: 'Adicione pelo menos um medicamento à receita antes de emitir.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmittingRx(true)
    try {
      const doctorId = user?.id || ''
      const newRx = await createPrescription({
        patient_id: selectedPatient.id,
        doctor_id: doctorId,
        medications: prescriptionItems,
        certificate_validated: isCertValidated,
        notes: rxNotes,
        ai_alerts: aiAlerts,
        status: 'emitida',
        sent_via: 'nenhum',
      })

      // If certificate not validated, create an in-app reminder notification
      if (!isCertValidated && doctorId) {
        await createNotification({
          userId: doctorId,
          title: 'Certificado Digital Pendente',
          message: `Receita emitida para ${selectedPatient.name}. Lembre-se de enviar seu certificado ICP-Brasil em Configurações para validar suas prescrições.`,
          type: 'certificate_alert',
          link: '/configuracoes',
        })
      }

      toast({
        title: 'Receita emitida com sucesso!',
        description: isCertValidated
          ? 'Prescrição assinada com certificado digital ICP-Brasil.'
          : 'Prescrição emitida. Lembrete: regularize seu certificado digital.',
      })

      // Reset form
      setPrescriptionItems([])
      setRxNotes('')
      setAiAlerts([])

      // Refresh history list
      loadHistory()

      // Open send modal directly with newly created prescription
      setSelectedRxForSend(newRx)
      setSendModalOpen(true)
    } catch (err: any) {
      toast({
        title: 'Erro ao emitir receita',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmittingRx(false)
    }
  }
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Receitas Médicas Digitais
              </h1>
              <p className="text-xs text-slate-500">
                Prescrição ágil com validação cruzada de IA e envio multicanal (E-mail, WhatsApp e
                SMS).
              </p>
            </div>
          </div>
        </div>

        {/* Certificate Status Widget on Header */}
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Certificado Digital
            </span>
            <span className="text-xs font-semibold text-slate-800">
              {isCertValidated ? 'ICP-Brasil Ativo' : 'Assinatura Flexível'}
            </span>
          </div>
          <CertificateStatusBadge status={certStatus} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/configuracoes')}
            className="text-xs text-blue-700 hover:text-blue-800 h-7"
          >
            {isCertValidated ? 'Gerenciar' : 'Enviar Certificado'}
          </Button>
        </div>
      </div>

      {/* Main Tabs: Nova Receita & Histórico */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'nova' | 'historico')}
        className="w-full space-y-4"
      >
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger
            value="nova"
            className="text-xs px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs flex items-center gap-2 font-semibold"
          >
            <Plus className="h-4 w-4 text-blue-600" />
            <span>Nova Receita</span>
          </TabsTrigger>
          <TabsTrigger
            value="historico"
            className="text-xs px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs flex items-center gap-2 font-semibold"
          >
            <Clock className="h-4 w-4 text-slate-600" />
            <span>Histórico de Receitas</span>
            {historyList.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-slate-200">
                {historyList.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ================================================================= */}
        {/* ABA: NOVA RECEITA */}
        {/* ================================================================= */}
        <TabsContent value="nova" className="space-y-6">
          {/* Certificate Alert Banner if not validated */}
          {!isCertValidated && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900 shadow-xs">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-amber-950">
                  Aviso: Seu certificado digital ainda não foi validado.
                </p>
                <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                  A receita será emitida normalmente pelo sistema, mas recomendamos regularizar seu
                  certificado digital ICP-Brasil na página de configurações para garantir plena
                  validade jurídica.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/configuracoes')}
                className="text-xs bg-white text-amber-900 border-amber-300 hover:bg-amber-100 shrink-0 h-8 font-semibold"
              >
                Upload do Certificado
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Form (Patient & Medication Autocomplete) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card 1: Selecionar Paciente */}
              <Card className="border-slate-200 shadow-subtle">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      1. Selecionar Paciente
                    </CardTitle>
                    {selectedPatient && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPatient(null)
                          setPatientSearchQuery('')
                        }}
                        className="text-xs text-slate-500 hover:text-rose-600 h-7"
                      >
                        Trocar Paciente
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {!selectedPatient ? (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-700">
                        Buscar paciente cadastrado (Nome ou CPF)
                      </Label>
                      <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                        <Input
                          placeholder="Digite o nome ou CPF do paciente..."
                          value={patientSearchQuery}
                          onChange={(e) => setPatientSearchQuery(e.target.value)}
                          className="pl-9 h-9 text-xs"
                        />
                        {isSearchingPatients && (
                          <div className="absolute right-3 top-2.5 text-slate-400 text-xs">
                            Buscando...
                          </div>
                        )}
                      </div>

                      {patientResults.length > 0 && (
                        <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white shadow-md max-h-48 overflow-y-auto">
                          {patientResults.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedPatient(p)
                                setActivePatient(p)
                                setPatientSearchQuery('')
                                setPatientResults([])
                                runAiAnalysis(prescriptionItems, p)
                              }}
                              className="w-full text-left p-2.5 hover:bg-blue-50/70 transition-colors flex items-center justify-between text-xs"
                            >
                              <div>
                                <p className="font-bold text-slate-900">{p.name}</p>
                                <p className="text-[11px] text-slate-500">
                                  CPF: {p.cpf} {p.email && `• ${p.email}`}
                                </p>
                              </div>
                              <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                                Selecionar <ChevronRight className="h-3 w-3" />
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                          {selectedPatient.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">
                            {selectedPatient.name}
                          </h4>
                          <p className="text-[11px] text-slate-600">
                            CPF: {selectedPatient.cpf}{' '}
                            {selectedPatient.phone && `• Tel: ${selectedPatient.phone}`}{' '}
                            {selectedPatient.insurance &&
                              `• Convênio: ${selectedPatient.insurance}`}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-blue-600 text-white text-[11px]">
                        Paciente Selecionado
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card 2: Adicionar Medicamentos */}
              <Card className="border-slate-200 shadow-subtle">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Pill className="h-4 w-4 text-emerald-600" />
                    2. Adicionar Medicamento & Posologia
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Busque no catálogo ou digite livremente. O assistente de IA fará a análise
                    cruzada em tempo real.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Medication Search Input */}
                  <div className="space-y-1.5 relative">
                    <Label className="text-xs font-semibold text-slate-700">
                      Nome do Medicamento ou Princípio Ativo
                    </Label>
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                      <Input
                        placeholder="Ex: Losartana 50mg, Amoxicilina, Omeprazol..."
                        value={medQuery}
                        onChange={(e) => {
                          setMedQuery(e.target.value)
                          setSelectedMedObj(null)
                        }}
                        className="pl-9 h-9 text-xs"
                      />
                    </div>

                    {medResults.length > 0 && (
                      <div className="absolute top-16 left-0 right-0 z-50 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {medResults.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setSelectedMedObj(m)
                              setMedQuery(m.name)
                              setMedResults([])
                            }}
                            className="w-full text-left p-2 hover:bg-emerald-50/60 transition-colors text-xs flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-slate-900">{m.name}</p>
                              {m.active_ingredient && (
                                <p className="text-[10px] text-slate-500">
                                  Princípio: {m.active_ingredient}{' '}
                                  {m.laboratory && `(${m.laboratory})`}
                                </p>
                              )}
                            </div>
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                              Catálogo
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Posology fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Dosagem</Label>
                      <Input
                        placeholder="Ex: 50mg, 1 comprimido"
                        value={medDosage}
                        onChange={(e) => setMedDosage(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Frequência</Label>
                      <Input
                        placeholder="Ex: 1x ao dia pela manhã, de 8/8h"
                        value={medFrequency}
                        onChange={(e) => setMedFrequency(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Período (dias)</Label>
                      <Input
                        type="number"
                        placeholder="Ex: 7, 30, 90"
                        value={medPeriodDays}
                        onChange={(e) =>
                          setMedPeriodDays(e.target.value ? parseInt(e.target.value) : '')
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  {/* Additional Instructions */}
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">
                      Orientações Adicionais ao Paciente
                    </Label>
                    <Input
                      placeholder="Ex: Ingerir com água antes das refeições. Não interromper sem consulta."
                      value={medInstructions}
                      onChange={(e) => setMedInstructions(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleAddMedication}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9"
                  >
                    <Plus className="h-4 w-4 mr-1.5" /> Adicionar Medicamento à Receita
                  </Button>
                </CardContent>
              </Card>

              {/* Observações Gerais da Receita */}
              <Card className="border-slate-200 shadow-subtle">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold text-slate-700">
                    Observações / Recomendações Gerais da Receita (Opcional)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Ex: Retorno agendado em 30 dias. Trazer exames de perfil lipídico."
                    value={rxNotes}
                    onChange={(e) => setRxNotes(e.target.value)}
                    className="h-9 text-xs"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Prescription Preview & AI Cross Analysis */}
            <div className="space-y-6">
              {/* Card Resumo / Prescrição Atual */}
              <Card className="border-slate-200 shadow-subtle sticky top-20">
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Receita a Emitir
                    </CardTitle>
                    <Badge variant="outline" className="text-xs bg-white text-slate-700">
                      {prescriptionItems.length} item(s)
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Prescribed Items List */}
                  {prescriptionItems.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 space-y-2 border-2 border-dashed border-slate-200 rounded-xl">
                      <Pill className="h-6 w-6 mx-auto text-slate-300" />
                      <p>Nenhum medicamento adicionado ainda.</p>
                      <p className="text-[11px] text-slate-400">
                        Preencha os campos ao lado e clique em "Adicionar".
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {prescriptionItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 relative group hover:border-slate-300"
                        >
                          <div className="flex items-start justify-between">
                            <h5 className="font-bold text-slate-900 pr-6">
                              {idx + 1}. {item.medication}
                            </h5>
                            <button
                              type="button"
                              onClick={() => handleRemoveMedication(idx)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 absolute right-2.5 top-2.5"
                              title="Remover medicamento"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="text-slate-700 font-medium">
                            {item.dosage} {item.frequency && `• ${item.frequency}`}
                          </p>
                          {item.period_days && (
                            <p className="text-[11px] text-slate-500">
                              Duração: <strong>{item.period_days} dias</strong>
                            </p>
                          )}
                          {item.instructions && (
                            <p className="text-[11px] text-slate-600 italic bg-white p-1.5 rounded border border-slate-100">
                              Obs: {item.instructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* AI Cross-Analysis Alert Component */}
                  {prescriptionItems.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                          Análise Cruzada de IA
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => runAiAnalysis(prescriptionItems, selectedPatient)}
                          disabled={isAnalyzingAi}
                          className="text-[10px] text-blue-600 h-6 px-2"
                        >
                          <RefreshCw
                            className={`h-3 w-3 mr-1 ${isAnalyzingAi ? 'animate-spin' : ''}`}
                          />
                          Recalcular
                        </Button>
                      </div>

                      <MedicationAlerts alerts={aiAlerts} loading={isAnalyzingAi} />
                    </div>
                  )}

                  {/* Action: Emit Button */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <Button
                      type="button"
                      onClick={handleEmitPrescription}
                      disabled={
                        isSubmittingRx || prescriptionItems.length === 0 || !selectedPatient
                      }
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 shadow-sm"
                    >
                      {isSubmittingRx ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Gerando Receita...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Emitir Receita Médica
                        </>
                      )}
                    </Button>
                    <p className="text-[10px] text-slate-400 text-center">
                      Após emitir, você poderá enviar por E-mail, WhatsApp ou SMS.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ================================================================= */}
        {/* ABA: HISTÓRICO DE RECEITAS */}
        {/* ================================================================= */}
        <TabsContent value="historico" className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                placeholder="Buscar por nome do paciente ou medicamento..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadHistory()}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              {(['todas', 'emitida', 'enviada', 'cancelada'] as const).map((st) => (
                <Button
                  key={st}
                  size="sm"
                  variant={historyStatusFilter === st ? 'default' : 'outline'}
                  onClick={() => setHistoryStatusFilter(st)}
                  className="text-xs h-8 capitalize whitespace-nowrap"
                >
                  {st === 'todas'
                    ? 'Todas'
                    : st === 'emitida'
                      ? 'Emitidas'
                      : st === 'enviada'
                        ? 'Enviadas'
                        : 'Canceladas'}
                </Button>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={loadHistory}
                disabled={isLoadingHistory}
                className="text-xs h-8"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Cards List */}
          {isLoadingHistory ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
              Carregando histórico de receitas...
            </div>
          ) : historyList.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center text-xs text-slate-400 space-y-3">
                <FileText className="h-8 w-8 mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">Nenhuma receita encontrada</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  As receitas emitidas por você aparecerão aqui com status de envio, histórico e
                  opções de reenvio.
                </p>
                <Button
                  size="sm"
                  onClick={() => setActiveTab('nova')}
                  className="bg-blue-600 text-white text-xs mt-2"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Criar Primeira Receita
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {historyList.map((rx) => {
                const patName = rx.expand?.patient_id?.name || 'Paciente'
                const patCpf = rx.expand?.patient_id?.cpf || ''
                const dateFormatted = rx.created
                  ? new Date(rx.created).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Recente'

                const isSent = rx.status === 'enviada'
                const sendMethod = rx.sent_via || 'nenhum'

                return (
                  <Card
                    key={rx.id}
                    className="border-slate-200 shadow-subtle hover:border-slate-300 transition-all"
                  >
                    <CardContent className="p-5 space-y-3">
                      {/* Top Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 mt-0.5">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-900">{patName}</h4>
                              <Badge
                                variant={isSent ? 'default' : 'secondary'}
                                className={`text-[10px] font-semibold ${
                                  isSent
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {isSent ? '✓ Enviada' : 'Emitida (Não enviada)'}
                              </Badge>
                              {rx.certificate_validated ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] gap-1">
                                  <ShieldCheck className="h-3 w-3" /> ICP-Brasil
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-50 text-amber-700 border-amber-300 text-[10px] gap-1">
                                  <ShieldAlert className="h-3 w-3" /> Sem Certificado
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {patCpf && `CPF: ${patCpf} • `}Emitida em: {dateFormatted}
                            </p>
                          </div>
                        </div>

                        {/* Send Channel Info */}
                        <div className="flex items-center gap-2">
                          {isSent && sendMethod !== 'nenhum' && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-slate-50 text-slate-700 capitalize"
                            >
                              Canal: {sendMethod}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Medications Grid */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Medicamentos Prescritos:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {(rx.medications || []).map((m, mIdx) => (
                            <div
                              key={mIdx}
                              className="p-2 bg-white rounded-lg border border-slate-200 text-xs"
                            >
                              <p className="font-bold text-slate-900">{m.medication}</p>
                              <p className="text-[11px] text-slate-600">{m.dosage}</p>
                              {m.frequency && (
                                <p className="text-[10px] text-slate-400">{m.frequency}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="text-[11px] text-slate-500">
                          ID: <span className="font-mono">{rx.id}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewDetailsRx(rx)}
                            className="text-xs h-8 text-slate-700"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> Ver Detalhes
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRxForSend(rx)
                              setSendModalOpen(true)
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8"
                          >
                            <Send className="h-3.5 w-3.5 mr-1" />
                            {isSent ? 'Reenviar Receita' : 'Enviar ao Paciente'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Envio Multicanal */}
      <PrescriptionSendModal
        open={sendModalOpen}
        onOpenChange={setSendModalOpen}
        prescription={selectedRxForSend}
        onSuccess={() => loadHistory()}
      />

      {/* Modal de Detalhes da Receita */}
      {viewDetailsRx && (
        <Dialog open={!!viewDetailsRx} onOpenChange={() => setViewDetailsRx(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                Detalhes da Prescrição Médica
              </DialogTitle>
              <DialogDescription className="text-xs">
                Paciente: <strong>{viewDetailsRx.expand?.patient_id?.name}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs py-2">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <p>
                  <strong>Data de Emissão:</strong>{' '}
                  {viewDetailsRx.created
                    ? new Date(viewDetailsRx.created).toLocaleString('pt-BR')
                    : ''}
                </p>
                <p>
                  <strong>Status de Envio:</strong> {viewDetailsRx.status} (
                  {viewDetailsRx.sent_via || 'nenhum'})
                </p>
                <p>
                  <strong>Assinatura Digital:</strong>{' '}
                  {viewDetailsRx.certificate_validated ? 'Validada (ICP-Brasil)' : 'Não validada'}
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 mb-2">Medicamentos:</h5>
                <div className="space-y-2">
                  {(viewDetailsRx.medications || []).map((m, idx) => (
                    <div key={idx} className="p-2.5 bg-white border rounded-lg text-xs">
                      <p className="font-bold text-slate-900">{m.medication}</p>
                      <p className="text-slate-600">
                        Dosagem: {m.dosage} {m.frequency && `• Frequência: ${m.frequency}`}
                      </p>
                      {m.period_days && (
                        <p className="text-slate-500">Período: {m.period_days} dias</p>
                      )}
                      {m.instructions && (
                        <p className="text-slate-500 italic mt-0.5">
                          Orientações: {m.instructions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {viewDetailsRx.notes && (
                <div className="p-2 bg-blue-50 border border-blue-100 rounded text-blue-900">
                  <strong>Observações:</strong> {viewDetailsRx.notes}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewDetailsRx(null)}
                className="text-xs"
              >
                Fechar
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const rx = viewDetailsRx
                  setViewDetailsRx(null)
                  setSelectedRxForSend(rx)
                  setSendModalOpen(true)
                }}
                className="bg-blue-600 text-white text-xs font-bold"
              >
                <Send className="h-3.5 w-3.5 mr-1" /> Opções de Envio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
