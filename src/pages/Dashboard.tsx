import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  CheckCircle,
  Video,
  Upload,
  Plus,
  Sparkles,
  Save,
  FileText,
  Folder,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useActivePatient } from '@/contexts/active-patient-context'
import { getAppointments, updateAppointment } from '@/services/appointments'
import {
  getLatestMedicalRecord,
  createMedicalRecord,
  updateMedicalRecord,
} from '@/services/medical_records'
import { getDocumentsForPatient } from '@/services/documents'
import {
  Appointment,
  MedicalRecord,
  DocumentItem,
  PrescribedMedication,
  CidCode,
} from '@/types/clinical'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CidAutocomplete } from '@/components/CidAutocomplete'
import { MedicationAutocomplete } from '@/components/MedicationAutocomplete'
import { DocumentUploadModal } from '@/components/DocumentUploadModal'
import { NewAppointmentModal } from '@/components/NewAppointmentModal'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

export default function Dashboard() {
  const { user } = useAuth()
  const { activePatient, setActivePatient, activeAppointmentId, setActiveAppointmentId } =
    useActivePatient()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [currentRecord, setCurrentRecord] = useState<MedicalRecord | null>(null)
  const [documents, setDocuments] = useState<DocumentItem[]>([])

  const [subjective, setSubjective] = useState('')
  const [objective, setObjective] = useState('')
  const [assessment, setAssessment] = useState('')
  const [plan, setPlan] = useState('')
  const [cidList, setCidList] = useState<CidCode[]>([])
  const [medList, setMedList] = useState<PrescribedMedication[]>([])
  const [savingRecord, setSavingRecord] = useState(false)

  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [apptModalOpen, setApptModalOpen] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const loadAppointments = async () => {
    if (!user) return
    try {
      const todayStr = new Date().toISOString().slice(0, 10)
      const list = await getAppointments(user.id, todayStr)
      setAppointments(list)
      if (!activePatient && list.length > 0 && list[0].expand?.patient) {
        setActivePatient(list[0].expand.patient)
        setActiveAppointmentId(list[0].id)
      }
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [user])

  useRealtime('appointments', () => {
    loadAppointments()
  })

  useEffect(() => {
    if (!activePatient) {
      setCurrentRecord(null)
      setSubjective('')
      setObjective('')
      setAssessment('')
      setPlan('')
      setCidList([])
      setMedList([])
      setDocuments([])
      return
    }

    getLatestMedicalRecord(activePatient.id).then((record) => {
      setCurrentRecord(record)
      if (record) {
        setSubjective(record.soap_subjective || '')
        setObjective(record.soap_objective || '')
        setAssessment(record.soap_assessment || '')
        setPlan(record.soap_plan || '')
        setCidList(record.cid10_codes || [])
        setMedList(record.prescribed_medications || [])
      } else {
        setSubjective('')
        setObjective('')
        setAssessment('')
        setPlan('')
        setCidList([])
        setMedList([])
      }
    })

    getDocumentsForPatient(activePatient.id)
      .then(setDocuments)
      .catch(() => {})
  }, [activePatient])

  const handleSaveRecord = async () => {
    if (!activePatient || !user) return
    setSavingRecord(true)
    const recordData = {
      patient: activePatient.id,
      doctor: user.id,
      appointment: activeAppointmentId || undefined,
      soap_subjective: subjective,
      soap_objective: objective,
      soap_assessment: assessment,
      soap_plan: plan,
      cid10_codes: cidList,
      prescribed_medications: medList,
    }

    try {
      if (currentRecord) {
        await updateMedicalRecord(currentRecord.id, recordData)
      } else {
        const created = await createMedicalRecord(recordData)
        setCurrentRecord(created)
      }
      toast({ title: 'Prontuário salvo com sucesso!' })
    } catch {
      toast({ title: 'Erro ao salvar prontuário', variant: 'destructive' })
    } finally {
      setSavingRecord(false)
    }
  }

  const handleFinishConsultation = async () => {
    await handleSaveRecord()
    if (activeAppointmentId) {
      await updateAppointment(activeAppointmentId, { status: 'finalizada' })
    }
    toast({ title: 'Consulta finalizada com sucesso!' })
    setActivePatient(null)
    setActiveAppointmentId(null)
    loadAppointments()
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between bg-white p-3 rounded-lg border shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-base">Espaço de Consulta Unificado</h1>
            <p className="text-xs text-slate-500">
              {activePatient
                ? `Atendendo: ${activePatient.name} (${activePatient.insurance || 'Particular'})`
                : 'Selecione um paciente para iniciar atendimento'}
            </p>
          </div>
        </div>

        {activePatient && (
          <Button
            onClick={handleFinishConsultation}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle className="h-4 w-4 mr-1.5" />
            Finalizar Consulta
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        <div className="lg:col-span-3 bg-white border rounded-lg p-3 flex flex-col gap-3 shadow-subtle overflow-y-auto">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2 font-semibold text-xs text-slate-800">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span>Agenda do Dia</span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setApptModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2 flex-1">
            {appointments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Nenhum agendamento hoje.</p>
            ) : (
              appointments.map((appt) => {
                const pat = appt.expand?.patient
                const isSelected = activePatient?.id === pat?.id
                const time = new Date(appt.date_time).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
                return (
                  <button
                    key={appt.id}
                    onClick={() => {
                      if (pat) {
                        setActivePatient(pat)
                        setActiveAppointmentId(appt.id)
                      }
                    }}
                    className={`w-full text-left p-2.5 rounded-md border text-xs transition-all flex flex-col gap-1 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-900">{time}</span>
                      <Badge
                        variant={appt.status === 'em_andamento' ? 'default' : 'outline'}
                        className="text-[10px] uppercase px-1.5 py-0"
                      >
                        {appt.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="font-medium text-slate-900 truncate">{pat?.name || 'Paciente'}</p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {appt.reason || 'Consulta'}
                    </p>
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border rounded-lg p-3 flex flex-col gap-3 shadow-subtle overflow-y-auto">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="font-semibold text-xs text-slate-800">Prontuário Médico (SOAP)</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveRecord}
              disabled={!activePatient || savingRecord}
              className="h-7 text-xs"
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              {savingRecord ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>

          {!activePatient ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-6 space-y-2">
              <FileText className="h-10 w-10 text-slate-300" />
              <p>Selecione um paciente na agenda ao lado para preencher o prontuário.</p>
            </div>
          ) : (
            <div className="space-y-3 text-xs flex-1">
              <Tabs defaultValue="S">
                <TabsList className="grid grid-cols-4 h-8 text-xs">
                  <TabsTrigger value="S" className="text-xs">
                    S - Subjetivo
                  </TabsTrigger>
                  <TabsTrigger value="O" className="text-xs">
                    O - Objetivo
                  </TabsTrigger>
                  <TabsTrigger value="A" className="text-xs">
                    A - Avaliação
                  </TabsTrigger>
                  <TabsTrigger value="P" className="text-xs">
                    P - Plano
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="S">
                  <Textarea
                    placeholder="Queixas do paciente, histórico de sintomas, histórico familiar..."
                    value={subjective}
                    onChange={(e) => setSubjective(e.target.value)}
                    className="h-32 text-xs"
                  />
                </TabsContent>
                <TabsContent value="O">
                  <Textarea
                    placeholder="Exame físico, sinais vitais (PA, FC, Temp), exames laboratoriais..."
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="h-32 text-xs"
                  />
                </TabsContent>
                <TabsContent value="A">
                  <Textarea
                    placeholder="Hipóteses diagnósticas e impressão clínica..."
                    value={assessment}
                    onChange={(e) => setAssessment(e.target.value)}
                    className="h-32 text-xs"
                  />
                </TabsContent>
                <TabsContent value="P">
                  <Textarea
                    placeholder="Conduta médica, orientações ao paciente, retornos..."
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="h-32 text-xs"
                  />
                </TabsContent>
              </Tabs>

              <div className="space-y-1.5 border-t pt-2">
                <label className="font-semibold text-slate-700 text-xs">Diagnósticos CID-10</label>
                <CidAutocomplete onSelect={(cid) => setCidList((prev) => [...prev, cid])} />
                <div className="flex flex-wrap gap-1 mt-1">
                  {cidList.map((c, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">
                      <strong>{c.code}</strong> - {c.description}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 border-t pt-2">
                <label className="font-semibold text-slate-700 text-xs">
                  Prescrição de Medicamentos
                </label>
                <MedicationAutocomplete onAdd={(med) => setMedList((prev) => [...prev, med])} />
                <div className="space-y-1 mt-1">
                  {medList.map((m, i) => (
                    <div
                      key={i}
                      className="p-1.5 bg-slate-50 border rounded text-[11px] flex justify-between items-center"
                    >
                      <div>
                        <strong className="text-blue-900">{m.medication}</strong> - {m.dosage}
                        {m.instructions && (
                          <p className="text-[10px] text-slate-500">{m.instructions}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 bg-white border rounded-lg p-3 flex flex-col gap-3 shadow-subtle overflow-y-auto">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="font-semibold text-xs text-slate-800">Documentos e Teleconsulta</h2>
            {activePatient && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setUploadModalOpen(true)}
                className="h-7 text-xs"
              >
                <Upload className="h-3.5 w-3.5 mr-1" /> Anexar
              </Button>
            )}
          </div>

          {!activePatient ? (
            <p className="text-xs text-slate-400 text-center py-6">Nenhum paciente selecionado.</p>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white space-y-2 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="font-bold">Teleconsulta Resulta</span>
                  <Badge
                    variant="outline"
                    className="bg-white/20 text-white border-none text-[10px]"
                  >
                    Ativa
                  </Badge>
                </div>
                <p className="text-[11px] text-blue-100">
                  Inicie chamada de vídeo e compartilhamento de tela.
                </p>
                <Button
                  size="sm"
                  onClick={() => navigate('/teleconsulta')}
                  className="w-full bg-white text-blue-900 hover:bg-blue-50 text-xs font-semibold h-8"
                >
                  <Video className="h-3.5 w-3.5 mr-1.5" /> Abrir Sala Virtual
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Pastas de Documentos (IA)</span>
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                </div>

                <div className="space-y-1.5">
                  {['exames', 'medicamentos', 'procedimentos', 'agendamentos', 'outros'].map(
                    (folder) => {
                      const folderDocs = documents.filter((d) => d.folder === folder)
                      return (
                        <div key={folder} className="p-2 bg-slate-50 border rounded-md">
                          <div className="flex items-center justify-between font-medium capitalize text-slate-800">
                            <span className="flex items-center gap-1.5">
                              <Folder className="h-3.5 w-3.5 text-blue-600" /> {folder}
                            </span>
                            <Badge variant="secondary" className="text-[10px]">
                              {folderDocs.length}
                            </Badge>
                          </div>
                          {folderDocs.length > 0 && (
                            <div className="mt-1 space-y-1 pl-5">
                              {folderDocs.map((doc) => (
                                <div
                                  key={doc.id}
                                  className="text-[10px] text-slate-600 truncate flex items-center justify-between"
                                >
                                  <span>{doc.name}</span>
                                  {doc.ai_classified && (
                                    <Badge className="text-[8px] bg-amber-100 text-amber-800 hover:bg-amber-100 px-1 py-0">
                                      IA
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    },
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {activePatient && (
        <DocumentUploadModal
          open={uploadModalOpen}
          onOpenChange={setUploadModalOpen}
          patientId={activePatient.id}
          onSuccess={() => getDocumentsForPatient(activePatient.id).then(setDocuments)}
        />
      )}

      <NewAppointmentModal
        open={apptModalOpen}
        onOpenChange={setApptModalOpen}
        onSuccess={loadAppointments}
      />
    </div>
  )
}
