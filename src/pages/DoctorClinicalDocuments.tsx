import { useState, useEffect } from 'react'
import {
  FileText,
  Plus,
  Search,
  Calendar,
  User,
  Send,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Printer,
  Copy,
  Check,
  Eye,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  FileCheck2,
  FileBadge,
  Share2,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useActivePatient } from '@/contexts/active-patient-context'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Patient, ClinicalDocument, ClinicalDocumentType } from '@/types/clinical'
import { getPatients } from '@/services/patients'
import {
  getDoctorClinicalDocuments,
  createClinicalDocument,
  getDocumentVerificationUrl,
  updateClinicalDocumentStatus,
} from '@/services/clinical_documents'
import { QRCodeSVG } from '@/components/QRCodeSVG'
import { CidAutocomplete } from '@/components/CidAutocomplete'

export default function DoctorClinicalDocuments() {
  const { user } = useAuth()
  const { activePatient, setActivePatient } = useActivePatient()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<'emitir' | 'historico'>('emitir')

  // Certificado digital
  const rawStatus = (user?.certificate_status || '').toLowerCase()
  const isCertValidated = rawStatus === 'validado' || rawStatus === 'active'

  // Form State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(activePatient || null)
  const [patientSearchQuery, setPatientSearchQuery] = useState('')
  const [patientResults, setPatientResults] = useState<Patient[]>([])
  const [isSearchingPatients, setIsSearchingPatients] = useState(false)

  const [docType, setDocType] = useState<ClinicalDocumentType>('atestado')
  const [title, setTitle] = useState('Atestado Médico de Afastamento')
  const [content, setContent] = useState(
    'Atesto para os devidos fins de comprovação que o(a) paciente acima identificado(a) esteve sob atendimento médico nesta data e deve permanecer afastado(a) de suas atividades laborais por motivo de saúde.',
  )
  const [cid10, setCid10] = useState('')
  const [restDays, setRestDays] = useState<number | ''>(2)
  const [specialtyTarget, setSpecialtyTarget] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Histórico
  const [historyList, setHistoryList] = useState<ClinicalDocument[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('todos')
  const [historySearch, setHistorySearch] = useState('')

  // Visualização e Envio
  const [viewDoc, setViewDoc] = useState<ClinicalDocument | null>(null)
  const [sendDoc, setSendDoc] = useState<ClinicalDocument | null>(null)
  const [sendChannel, setSendChannel] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Templates pré-definidos por tipo de documento
  const applyTemplate = (type: ClinicalDocumentType) => {
    setDocType(type)
    if (type === 'atestado') {
      setTitle('Atestado Médico de Afastamento')
      setContent(
        'Atesto para os devidos fins de comprovação que o(a) paciente esteve sob atendimento médico nesta data e deve permanecer afastado(a) de suas atividades laborais por motivo de saúde.',
      )
      setRestDays(2)
      setSpecialtyTarget('')
    } else if (type === 'laudo') {
      setTitle('Laudo Médico Pericial / Aptidão')
      setContent(
        'Laudo que atesta, após anamnese e exame físico criterioso, que o(a) paciente apresenta higidez física e mental, encontrando-se apto(a) para as atividades habituais e práticas de condicionamento físico.',
      )
      setRestDays('')
      setSpecialtyTarget('')
    } else if (type === 'encaminhamento') {
      setTitle('Encaminhamento Médico Especializado')
      setContent(
        'Encaminho o(a) paciente para avaliação com a especialidade médica indicada, tendo em vista quadro clínico em investigação e necessidade de conduta conjunta.',
      )
      setRestDays('')
      setSpecialtyTarget('Cardiologia')
    } else if (type === 'declaracao') {
      setTitle('Declaração de Comparecimento')
      setContent(
        'Declaro que o(a) paciente compareceu a este serviço médico para consulta/procedimento no período matutino/vespertino.',
      )
      setRestDays('')
      setSpecialtyTarget('')
    }
  }

  // Sincronizar paciente do contexto
  useEffect(() => {
    if (activePatient && !selectedPatient) {
      setSelectedPatient(activePatient)
    }
  }, [activePatient, selectedPatient])

  // Busca de pacientes
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

  // Carregar histórico
  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const list = await getDoctorClinicalDocuments(user?.id, {
        type: historyTypeFilter,
        search: historySearch,
      })
      setHistoryList(list)
    } catch (err) {
      console.error(err)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [user?.id, historyTypeFilter])

  // Emitir Documento
  const handleEmitDocument = async () => {
    if (!selectedPatient) {
      toast({
        title: 'Selecione o paciente',
        description: 'É necessário vincular um paciente ao documento.',
        variant: 'destructive',
      })
      return
    }
    if (!content.trim()) {
      toast({
        title: 'Texto do documento obrigatório',
        description: 'Preencha o conteúdo do laudo/atestado antes de emitir.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const created = await createClinicalDocument({
        doctorId: user?.id || '',
        patientId: selectedPatient.id,
        type: docType,
        title,
        content,
        cid10,
        restDays: typeof restDays === 'number' ? restDays : undefined,
        specialtyTarget,
        certificateValidated: isCertValidated,
      })

      toast({
        title: `${title} emitido com sucesso!`,
        description: `Código de autenticidade único: ${created.verification_code}`,
      })

      loadHistory()
      setViewDoc(created)
      setActiveTab('historico')
    } catch {
      toast({
        title: 'Erro ao emitir documento',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Enviar Documento Multicanal
  const handleSendDocument = async () => {
    if (!sendDoc) return
    try {
      await updateClinicalDocumentStatus(sendDoc.id, 'enviado', sendChannel)

      if (sendChannel === 'whatsapp') {
        const phone = (sendDoc.expand?.patient?.phone || '').replace(/\D/g, '')
        const verifyUrl = getDocumentVerificationUrl(sendDoc.verification_code)
        const text = encodeURIComponent(
          `Olá ${sendDoc.expand?.patient?.name || ''}, seu médico Dr(a). ${user?.name || ''} emitiu um(a) ${sendDoc.title}. Acesse e valide com o código ${sendDoc.verification_code} no link: ${verifyUrl}`,
        )
        window.open(`https://wa.me/55${phone}?text=${text}`, '_blank')
      }

      toast({
        title: 'Documento Enviado!',
        description: `Enviado com sucesso via ${sendChannel.toUpperCase()}.`,
      })
      setSendDoc(null)
      loadHistory()
    } catch {
      toast({ title: 'Erro ao enviar documento', variant: 'destructive' })
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 min-w-0">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight break-words">
                Emissão de Documentos Clínicos
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                Atestados, laudos, encaminhamentos e declarações com código de validação pública e
                QR Code.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isCertValidated ? (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs gap-1 py-1 px-3">
              <ShieldCheck className="h-3.5 w-3.5" /> Assinatura Digital Ativa
            </Badge>
          ) : (
            <Badge className="bg-amber-50 text-amber-700 border-amber-300 text-xs gap-1 py-1 px-3">
              <ShieldAlert className="h-3.5 w-3.5" /> Assinatura Flexível da Plataforma
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'emitir' | 'historico')}
        className="w-full space-y-4 min-w-0"
      >
        <div className="w-full min-w-0">
          <TabsList className="bg-slate-100 p-1 rounded-xl h-auto w-full grid grid-cols-1 sm:grid-cols-2 gap-1">
            <TabsTrigger
              value="emitir"
              className="text-xs px-3 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-900 data-[state=active]:shadow-xs flex items-center justify-center gap-2 font-semibold min-w-0 text-center h-auto min-h-[38px]"
            >
              <Plus className="h-4 w-4 text-indigo-600 shrink-0" />
              <span className="truncate">Emitir Novo Documento</span>
            </TabsTrigger>
            <TabsTrigger
              value="historico"
              className="text-xs px-3 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs flex items-center justify-center gap-2 font-semibold min-w-0 text-center h-auto min-h-[38px]"
            >
              <Clock className="h-4 w-4 text-slate-600 shrink-0" />
              <span className="truncate">Histórico de Documentos</span>
              {historyList.length > 0 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-4 bg-slate-200 shrink-0"
                >
                  {historyList.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ABA 1: EMITIR DOCUMENTO */}
        <TabsContent value="emitir" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Formulário */}
            <div className="lg:col-span-2 space-y-6">
              {/* Seleção de Paciente */}
              <Card className="border-slate-200 shadow-subtle">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-600" />
                      1. Paciente Destinatário
                    </CardTitle>
                    {selectedPatient && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPatient(null)}
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
                      <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                        <Input
                          placeholder="Buscar paciente por nome ou CPF..."
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
                              }}
                              className="w-full text-left p-2.5 hover:bg-indigo-50/70 transition-colors flex items-center justify-between text-xs"
                            >
                              <div>
                                <p className="font-bold text-slate-900">{p.name}</p>
                                <p className="text-[11px] text-slate-500">
                                  CPF: {p.cpf} {p.phone && `• Tel: ${p.phone}`}
                                </p>
                              </div>
                              <span className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1">
                                Selecionar <ChevronRight className="h-3 w-3" />
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                          {selectedPatient.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">
                            {selectedPatient.name}
                          </h4>
                          <p className="text-[11px] text-slate-600">
                            CPF: {selectedPatient.cpf}{' '}
                            {selectedPatient.phone && `• Tel: ${selectedPatient.phone}`}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-indigo-600 text-white text-[11px]">
                        Paciente Selecionado
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tipo de Documento & Campos */}
              <Card className="border-slate-200 shadow-subtle">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileBadge className="h-4 w-4 text-indigo-600" />
                    2. Dados do Documento Clínico
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Escolha o modelo pré-definido para preenchimento rápido.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 text-xs">
                  {/* Botões rápidos de tipo */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { type: 'atestado', label: 'Atestado' },
                      { type: 'laudo', label: 'Laudo Pericial' },
                      { type: 'encaminhamento', label: 'Encaminhamento' },
                      { type: 'declaracao', label: 'Declaração' },
                    ].map((item) => (
                      <Button
                        key={item.type}
                        type="button"
                        variant={docType === item.type ? 'default' : 'outline'}
                        onClick={() => applyTemplate(item.type as ClinicalDocumentType)}
                        className={`text-xs h-9 font-semibold ${
                          docType === item.type ? 'bg-indigo-600 text-white' : ''
                        }`}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </div>

                  {/* Título */}
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">
                      Título do Documento
                    </Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  {/* Campos específicos por tipo */}
                  {docType === 'atestado' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">
                          Dias de Afastamento / Repouso
                        </Label>
                        <Input
                          type="number"
                          value={restDays}
                          onChange={(e) =>
                            setRestDays(e.target.value ? parseInt(e.target.value) : '')
                          }
                          placeholder="Ex: 2, 5, 15"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">
                          CID-10 Opcional (com consentimento do paciente)
                        </Label>
                        <Input
                          value={cid10}
                          onChange={(e) => setCid10(e.target.value)}
                          placeholder="Ex: J00, M54.5, Z76.0"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {docType === 'encaminhamento' && (
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">
                        Especialidade / Destino do Encaminhamento
                      </Label>
                      <Input
                        value={specialtyTarget}
                        onChange={(e) => setSpecialtyTarget(e.target.value)}
                        placeholder="Ex: Cardiologia, Ortopedia, Nutrição..."
                        className="h-8 text-xs"
                      />
                    </div>
                  )}

                  {/* Conteúdo Textual */}
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">
                      Texto / Parecer Clínico
                    </Label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={6}
                      className="text-xs font-serif leading-relaxed"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Col: Preview em tempo real e Emissão */}
            <div className="space-y-6">
              <Card className="border-slate-200 shadow-subtle sticky top-20">
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-indigo-600" />
                      Visualização do Documento
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="text-xs capitalize bg-white text-indigo-700"
                    >
                      {docType}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 text-xs">
                  {/* Papel timbrado preview */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 font-serif shadow-xs">
                    <div className="border-b border-slate-200 pb-2 text-center space-y-0.5">
                      <h4 className="font-bold text-xs text-slate-900">
                        {user?.name || 'Dr(a). Médico'}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-sans">
                        CRM: {user?.crm || user?.council_number || 'Ativo'} • Brasil
                      </p>
                    </div>

                    <div className="text-center">
                      <span className="font-bold text-xs uppercase tracking-wider text-indigo-900 block font-sans">
                        {title}
                      </span>
                    </div>

                    <p className="text-[11px] leading-relaxed text-slate-800 whitespace-pre-line">
                      {content}
                    </p>

                    {restDays && docType === 'atestado' && (
                      <p className="text-[11px] font-sans font-bold text-slate-800">
                        Período de repouso: {restDays} dia(s).
                      </p>
                    )}

                    {cid10 && (
                      <p className="text-[10px] font-sans text-slate-500">CID-10: {cid10}</p>
                    )}

                    <div className="pt-3 border-t border-dashed border-slate-200 text-center font-sans space-y-1">
                      <p className="text-[10px] text-slate-400">
                        {new Date().toLocaleDateString('pt-BR')}
                      </p>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200 inline-block text-[10px] font-mono text-indigo-800">
                        Padrão: AT/LA-XXXX-XXXX + QR Code
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleEmitDocument}
                    disabled={isSubmitting || !selectedPatient}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 shadow-sm"
                  >
                    {isSubmitting ? 'Gerando Documento...' : 'Emitir e Assinar Documento'}
                  </Button>

                  <p className="text-[10px] text-slate-400 text-center">
                    Gera link público e QR Code para validação na rota unificada.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ABA 2: HISTÓRICO DE DOCUMENTOS */}
        <TabsContent value="historico" className="space-y-4">
          {/* Barra de Filtro */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row gap-3 items-center justify-between min-w-0">
            <div className="relative w-full sm:w-80 min-w-0">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                placeholder="Buscar por paciente, código ou título..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadHistory()}
                className="pl-9 h-9 text-xs w-full"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto min-w-0">
              {[
                { type: 'todos', label: 'Todos' },
                { type: 'atestado', label: 'Atestados' },
                { type: 'laudo', label: 'Laudos' },
                { type: 'encaminhamento', label: 'Encaminhamentos' },
                { type: 'declaracao', label: 'Declarações' },
              ].map((item) => (
                <Button
                  key={item.type}
                  size="sm"
                  variant={historyTypeFilter === item.type ? 'default' : 'outline'}
                  onClick={() => setHistoryTypeFilter(item.type)}
                  className={`text-xs h-8 ${
                    historyTypeFilter === item.type ? 'bg-indigo-600 text-white' : ''
                  }`}
                >
                  {item.label}
                </Button>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={loadHistory}
                disabled={historyLoading}
                className="text-xs h-8"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Lista de Documentos */}
          {historyLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-600 mb-2" />
              Carregando documentos...
            </div>
          ) : historyList.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center text-xs text-slate-400 space-y-3">
                <FileText className="h-8 w-8 mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">Nenhum documento emitido</p>
                <Button
                  size="sm"
                  onClick={() => setActiveTab('emitir')}
                  className="bg-indigo-600 text-white text-xs mt-2"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Emitir Primeiro Documento
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {historyList.map((doc) => {
                const patName = doc.expand?.patient?.name || 'Paciente'
                const isSent = doc.status === 'enviado'

                return (
                  <Card
                    key={doc.id}
                    className="border-slate-200 shadow-subtle hover:border-slate-300 transition-all"
                  >
                    <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                          <FileCheck2 className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">{doc.title}</h4>
                            <Badge className="bg-indigo-100 text-indigo-800 text-[10px] uppercase font-bold">
                              {doc.type}
                            </Badge>
                            {isSent ? (
                              <Badge className="bg-emerald-600 text-white text-[10px]">
                                ✓ Enviado ({doc.sent_via})
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-slate-600">
                                Emitido
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs text-slate-600">
                            Paciente: <strong>{patName}</strong> • Data:{' '}
                            {doc.created
                              ? new Date(doc.created).toLocaleDateString('pt-BR')
                              : 'Recente'}
                          </p>

                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[11px] text-slate-500 font-medium">
                              Cód. Verificação:
                            </span>
                            <span className="font-mono font-bold text-xs bg-slate-100 text-indigo-900 px-2 py-0.5 rounded border border-slate-200">
                              {doc.verification_code}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(doc.verification_code)
                                setCopiedCode(doc.verification_code)
                                setTimeout(() => setCopiedCode(null), 2000)
                                toast({ title: 'Código copiado!' })
                              }}
                              className="text-slate-400 hover:text-slate-700"
                            >
                              {copiedCode === doc.verification_code ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewDoc(doc)}
                          className="text-xs h-8 text-slate-700"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> Ver & Imprimir
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setSendDoc(doc)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-8"
                        >
                          <Send className="h-3.5 w-3.5 mr-1" /> {isSent ? 'Reenviar' : 'Enviar'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Visualização & QR Code */}
      {viewDoc && (
        <Dialog open={!!viewDoc} onOpenChange={() => setViewDoc(null)}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" /> {viewDoc.title}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Documento clínico oficial assinado com validação por QR Code.
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 bg-white border rounded-xl space-y-4 text-xs font-serif shadow-xs">
              <div className="border-b pb-3 flex justify-between items-start font-sans">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    {viewDoc.expand?.doctor?.name || user?.name}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    CRM: {viewDoc.expand?.doctor?.crm || user?.crm || 'Ativo'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Data</span>
                  <p className="font-bold text-slate-800">
                    {viewDoc.created ? new Date(viewDoc.created).toLocaleDateString('pt-BR') : ''}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg font-sans flex justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    Paciente
                  </span>
                  <p className="font-bold text-slate-900">
                    {viewDoc.expand?.patient?.name || 'Paciente'}
                  </p>
                </div>
                {viewDoc.expand?.patient?.cpf && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">
                      CPF
                    </span>
                    <p className="font-mono text-slate-700">{viewDoc.expand.patient.cpf}</p>
                  </div>
                )}
              </div>

              <div className="py-2 text-sm leading-relaxed text-slate-900 whitespace-pre-line">
                {viewDoc.content}
              </div>

              {viewDoc.rest_days ? (
                <p className="font-sans font-bold text-slate-900">
                  Período de repouso recomendado: {viewDoc.rest_days} dias.
                </p>
              ) : null}

              {viewDoc.cid10 && (
                <p className="font-sans text-[11px] text-slate-600">CID-10: {viewDoc.cid10}</p>
              )}

              {/* Rodapé com QR Code */}
              <div className="pt-4 border-t-2 border-dashed border-slate-200 font-sans">
                <div className="p-3 bg-slate-50 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-1 rounded-lg border shadow-xs shrink-0">
                      <QRCodeSVG
                        value={getDocumentVerificationUrl(viewDoc.verification_code)}
                        size={80}
                      />
                    </div>
                    <div className="space-y-0.5 text-left">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Validação Pública
                      </span>
                      <p className="font-bold text-slate-900 text-xs">Autenticidade Garantida</p>
                      <p className="text-[10px] text-slate-500">
                        Aponte a câmera para consultar a validade deste documento.
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Código de Verificação:
                    </span>
                    <span className="font-mono text-sm font-bold bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded border border-indigo-200">
                      {viewDoc.verification_code}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(getDocumentVerificationUrl(viewDoc.verification_code), '_blank')
                }
                className="text-xs"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" /> Página Pública de Validação
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="text-xs"
              >
                <Printer className="h-3.5 w-3.5 mr-1" /> Imprimir
              </Button>
              <Button size="sm" onClick={() => setViewDoc(null)} className="text-xs">
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Envio Multicanal */}
      {sendDoc && (
        <Dialog open={!!sendDoc} onOpenChange={() => setSendDoc(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Send className="h-4 w-4 text-indigo-600" /> Enviar Documento ao Paciente
              </DialogTitle>
              <DialogDescription className="text-xs">
                Envie o link seguro e código de verificação para {sendDoc.expand?.patient?.name}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Canal de Envio</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={sendChannel === 'whatsapp' ? 'default' : 'outline'}
                    onClick={() => setSendChannel('whatsapp')}
                    className={`text-xs h-9 font-semibold ${
                      sendChannel === 'whatsapp' ? 'bg-emerald-600 text-white' : ''
                    }`}
                  >
                    WhatsApp
                  </Button>
                  <Button
                    type="button"
                    variant={sendChannel === 'email' ? 'default' : 'outline'}
                    onClick={() => setSendChannel('email')}
                    className={`text-xs h-9 font-semibold ${
                      sendChannel === 'email' ? 'bg-blue-600 text-white' : ''
                    }`}
                  >
                    E-mail
                  </Button>
                  <Button
                    type="button"
                    variant={sendChannel === 'sms' ? 'default' : 'outline'}
                    onClick={() => setSendChannel('sms')}
                    className={`text-xs h-9 font-semibold ${
                      sendChannel === 'sms' ? 'bg-indigo-600 text-white' : ''
                    }`}
                  >
                    SMS
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border rounded-lg space-y-1 text-slate-600">
                <p>
                  <strong>Destinatário:</strong> {sendDoc.expand?.patient?.name}
                </p>
                <p>
                  <strong>Telefone:</strong> {sendDoc.expand?.patient?.phone || 'Não informado'}
                </p>
                <p>
                  <strong>E-mail:</strong> {sendDoc.expand?.patient?.email || 'Não informado'}
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSendDoc(null)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSendDocument}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                Confirmar e Disparar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
