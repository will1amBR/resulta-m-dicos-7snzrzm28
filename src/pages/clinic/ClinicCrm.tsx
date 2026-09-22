import { useState, useEffect, useMemo } from 'react'
import {
  Kanban,
  Users,
  UserPlus,
  ArrowRight,
  MessageSquare,
  CalendarPlus,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Phone,
  Mail,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  MoreVertical,
} from 'lucide-react'
import {
  getCrmLeads,
  createCrmLead,
  updateCrmLeadStage,
  convertLeadToPatient,
} from '@/services/crm'
import { getPatients } from '@/services/patients'
import { buildWaMeUrl } from '@/services/whatsapp'
import { CrmLead, CrmStage, Patient } from '@/types/clinical'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'

interface ColumnConfig {
  id: CrmStage
  title: string
  color: string
  badgeBg: string
  textColor: string
}

const CRM_COLUMNS: ColumnConfig[] = [
  {
    id: 'lead_novo',
    title: 'Lead (Fora do Sistema)',
    color: 'border-amber-300 bg-amber-50/40',
    badgeBg: 'bg-amber-100 text-amber-900',
    textColor: 'text-amber-800',
  },
  {
    id: 'primeiro_contato',
    title: 'Em Negociação / Primeiro Contato',
    color: 'border-blue-300 bg-blue-50/40',
    badgeBg: 'bg-blue-100 text-blue-900',
    textColor: 'text-blue-800',
  },
  {
    id: 'agendamento_em_negociacao',
    title: 'Agendamento em Andamento',
    color: 'border-indigo-300 bg-indigo-50/40',
    badgeBg: 'bg-indigo-100 text-indigo-900',
    textColor: 'text-indigo-800',
  },
  {
    id: 'paciente_ativo',
    title: 'Ativo no Sistema (Paciente)',
    color: 'border-emerald-300 bg-emerald-50/40',
    badgeBg: 'bg-emerald-100 text-emerald-900',
    textColor: 'text-emerald-800',
  },
  {
    id: 'inativo',
    title: 'Inativo / Arquivado',
    color: 'border-slate-300 bg-slate-50/50',
    badgeBg: 'bg-slate-100 text-slate-800',
    textColor: 'text-slate-700',
  },
]

export default function ClinicCrm() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [leads, setLeads] = useState<CrmLead[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Modal Novo Lead
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false)
  const [leadName, setLeadName] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadInterest, setLeadInterest] = useState('')
  const [leadSource, setLeadSource] = useState('WhatsApp')
  const [leadNotes, setLeadNotes] = useState('')
  const [leadEstimatedValue, setLeadEstimatedValue] = useState<number>(350)
  const [submittingNewLead, setSubmittingNewLead] = useState(false)

  // Modal Converter Lead em Paciente
  const [convertModalOpen, setConvertModalOpen] = useState(false)
  const [selectedLeadForConvert, setSelectedLeadForConvert] = useState<CrmLead | null>(null)
  const [convertCpf, setConvertCpf] = useState('')
  const [convertInsurance, setConvertInsurance] = useState('Particular')
  const [isConverting, setIsConverting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [leadsList, ptsList] = await Promise.all([
        getCrmLeads().catch(() => []),
        getPatients().catch(() => []),
      ])
      setLeads(leadsList)
      setPatients(ptsList)
    } catch {
      toast({ title: 'Erro ao carregar CRM da clínica', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Métricas do Topo
  const totalLeadsCount = leads.length
  const activePatientsCount = useMemo(
    () => leads.filter((l) => l.stage === 'paciente_ativo').length,
    [leads],
  )
  const leadsForaCount = useMemo(
    () => leads.filter((l) => l.stage === 'lead_novo' || l.stage === 'primeiro_contato').length,
    [leads],
  )
  const conversionRate = useMemo(() => {
    if (totalLeadsCount === 0) return 0
    return Math.round((activePatientsCount / totalLeadsCount) * 100)
  }, [totalLeadsCount, activePatientsCount])

  // Filtragem
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      return (
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.phone && l.phone.includes(searchTerm)) ||
        (l.interest_specialty &&
          l.interest_specialty.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    })
  }, [leads, searchTerm])

  // Mover card de coluna
  const handleMoveStage = async (leadId: string, newStage: CrmStage) => {
    try {
      await updateCrmLeadStage(leadId, newStage)
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l)))
      toast({ title: 'Status do paciente atualizado!' })
    } catch {
      toast({ title: 'Erro ao mover card', variant: 'destructive' })
    }
  }

  // Criar novo lead
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadName.trim()) {
      toast({ title: 'Nome obrigatório', variant: 'destructive' })
      return
    }
    setSubmittingNewLead(true)
    try {
      await createCrmLead({
        name: leadName.trim(),
        phone: leadPhone.trim(),
        email: leadEmail.trim(),
        interest_specialty: leadInterest.trim() || 'Consulta Geral',
        source: leadSource,
        notes: leadNotes.trim(),
        estimated_value: leadEstimatedValue,
        stage: 'lead_novo',
      })
      toast({ title: 'Novo lead cadastrado no CRM!' })
      setNewLeadModalOpen(false)
      setLeadName('')
      setLeadPhone('')
      setLeadEmail('')
      setLeadInterest('')
      setLeadNotes('')
      loadData()
    } catch {
      toast({ title: 'Erro ao cadastrar lead', variant: 'destructive' })
    } finally {
      setSubmittingNewLead(false)
    }
  }

  // Abrir modal de conversão
  const handleOpenConvertModal = (lead: CrmLead) => {
    setSelectedLeadForConvert(lead)
    setConvertCpf('')
    setConvertInsurance('Particular')
    setConvertModalOpen(true)
  }

  // Confirmar conversão
  const handleConfirmConvert = async () => {
    if (!selectedLeadForConvert) return
    setIsConverting(true)
    try {
      const { patient } = await convertLeadToPatient(selectedLeadForConvert, {
        cpf: convertCpf.trim() || undefined,
        insurance: convertInsurance,
      })
      toast({
        title: 'Lead convertido em Paciente Oficial!',
        description: `${selectedLeadForConvert.name} agora possui cadastro completo na clínica.`,
      })
      setConvertModalOpen(false)
      loadData()
    } catch {
      toast({ title: 'Erro ao converter lead', variant: 'destructive' })
    } finally {
      setIsConverting(false)
    }
  }

  // Disparo de WhatsApp
  const handleSendWhatsApp = (lead: CrmLead) => {
    if (!lead.phone) {
      toast({ title: 'Telefone não cadastrado neste card', variant: 'destructive' })
      return
    }
    const msg = `Olá, ${lead.name}! Tudo bem? Falamos da Resulta Clínica sobre seu interesse em ${lead.interest_specialty || 'atendimento médico'}. Como podemos ajudar com seu agendamento hoje?`
    const url = buildWaMeUrl(lead.phone, msg)
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6 pb-12 min-w-0 max-w-full">
      {/* Header Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-subtle flex flex-col lg:flex-row lg:items-center justify-between gap-4 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 break-words">
              <Kanban className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 shrink-0" />
              <span>CRM da Clínica — Gestão de Pacientes & Leads</span>
            </h1>
            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 text-[10px] shrink-0">
              Funil Kanban
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Acompanhe o ciclo de vida dos pacientes atuais e contatos fora do sistema, com conversão
            facilitada e envio de WhatsApp.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 text-xs w-full"
            />
          </div>

          <Button
            size="sm"
            onClick={() => setNewLeadModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 gap-1.5 shrink-0 whitespace-nowrap"
          >
            <UserPlus className="h-4 w-4 shrink-0" /> Cadastrar Lead
          </Button>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="border-slate-200 shadow-subtle">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <span className="text-xs font-semibold text-slate-500 uppercase">Pacientes Ativos</span>
            <p className="text-2xl font-black text-emerald-700 mt-2">{activePatientsCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Cadastrados e com histórico</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-subtle">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <span className="text-xs font-semibold text-slate-500 uppercase">Leads no Radar</span>
            <p className="text-2xl font-black text-amber-700 mt-2">{leadsForaCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Ainda fora do sistema ou 1º contato</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-subtle">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Taxa de Conversão
            </span>
            <p className="text-2xl font-black text-indigo-700 mt-2">{conversionRate}%</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Leads que viraram pacientes
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-subtle bg-gradient-to-br from-indigo-50/50 to-white">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <span className="text-xs font-semibold text-indigo-900 uppercase">Total no Funil</span>
            <p className="text-2xl font-black text-slate-900 mt-2">{totalLeadsCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Cards em acompanhamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Board Kanban das 5 Colunas */}
      <div className="w-full overflow-x-auto pb-4">
        <div className="flex md:grid md:grid-cols-3 lg:grid-cols-5 gap-3.5 min-w-[300px] md:min-w-0">
          {CRM_COLUMNS.map((column) => {
            const columnLeads = filteredLeads.filter((l) => l.stage === column.id)

            return (
              <div
                key={column.id}
                className={`rounded-xl border p-3 flex flex-col gap-3 w-[260px] md:w-auto shrink-0 md:shrink ${column.color}`}
              >
                {/* Header da Coluna */}
                <div className="flex items-center justify-between border-b pb-2">
                  <span className={`text-xs font-bold ${column.textColor}`}>{column.title}</span>
                  <span
                    className={`text-[11px] font-black px-2 py-0.5 rounded-full ${column.badgeBg}`}
                  >
                    {columnLeads.length}
                  </span>
                </div>

                {/* Lista de Cards da Coluna */}
                <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[600px] pr-1">
                  {columnLeads.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-slate-400 border border-dashed rounded-lg bg-white/40">
                      Vazio
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2 hover:shadow-subtle transition-all"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <p className="font-bold text-xs text-slate-900">{lead.name}</p>
                            {lead.interest_specialty && (
                              <Badge
                                variant="secondary"
                                className="text-[9px] mt-0.5 px-1.5 py-0 bg-slate-100"
                              >
                                {lead.interest_specialty}
                              </Badge>
                            )}
                          </div>

                          {lead.patient ? (
                            <Badge className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5">
                              Sistema ✓
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-800 text-[9px] px-1.5">
                              Lead Novo
                            </Badge>
                          )}
                        </div>

                        {/* Contatos */}
                        <div className="text-[11px] text-slate-600 space-y-0.5">
                          {lead.phone && (
                            <p className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                              {lead.phone}
                            </p>
                          )}
                          {lead.source && (
                            <p className="text-[10px] text-slate-400">Origem: {lead.source}</p>
                          )}
                        </div>

                        {lead.notes && (
                          <p className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded border line-clamp-2">
                            {lead.notes}
                          </p>
                        )}

                        {/* Ações Rápidas no Card */}
                        <div className="pt-2 border-t flex flex-col gap-1.5">
                          <div className="flex items-center gap-1">
                            {lead.phone && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSendWhatsApp(lead)}
                                className="h-6 px-2 text-[10px] text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 flex-1 font-semibold"
                              >
                                <MessageSquare className="h-3 w-3 mr-1 text-emerald-600" />
                                WhatsApp
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate('/admin/conselhos')}
                              className="h-6 px-2 text-[10px] text-blue-800 bg-blue-50 hover:bg-blue-100 border-blue-200 flex-1 font-semibold"
                            >
                              <CalendarPlus className="h-3 w-3 mr-1 text-blue-600" />
                              Agendar
                            </Button>
                          </div>

                          {/* Botão de Converter em Paciente se ainda não for */}
                          {!lead.patient && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenConvertModal(lead)}
                              className="w-full h-6 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                            >
                              <UserCheck className="h-3 w-3 mr-1" /> Converter em Paciente
                            </Button>
                          )}

                          {/* Controles para Mover de Coluna */}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                            <span>Mover para:</span>
                            <Select
                              value={lead.stage}
                              onValueChange={(val) => handleMoveStage(lead.id, val as CrmStage)}
                            >
                              <SelectTrigger className="h-6 text-[10px] w-28 bg-slate-50">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CRM_COLUMNS.map((col) => (
                                  <SelectItem key={col.id} value={col.id} className="text-xs">
                                    {col.title.slice(0, 20)}...
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* MODAL NOVO LEAD */}
      <Dialog open={newLeadModalOpen} onOpenChange={setNewLeadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 text-base">
              <UserPlus className="h-5 w-5 text-indigo-600" />
              Cadastrar Lead / Paciente Potencial
            </DialogTitle>
            <DialogDescription className="text-xs">
              Adicione contatos vindos do WhatsApp, redes sociais ou indicações que ainda não são
              pacientes oficiais do sistema.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateLead} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">
                Nome Completo <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Ex: Roberto Ferreira dos Santos"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                className="text-xs h-9"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">WhatsApp / Telefone</Label>
                <Input
                  placeholder="(11) 98765-4321"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">E-mail</Label>
                <Input
                  type="email"
                  placeholder="paciente@email.com"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  Especialidade de Interesse
                </Label>
                <Input
                  placeholder="Ex: Dermatologia, Cardiologia..."
                  value={leadInterest}
                  onChange={(e) => setLeadInterest(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Canal de Origem</Label>
                <Select value={leadSource} onValueChange={setLeadSource}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Instagram">Instagram / Redes</SelectItem>
                    <SelectItem value="Google Ads">Google Ads / Site</SelectItem>
                    <SelectItem value="Indicação">Indicação de Paciente</SelectItem>
                    <SelectItem value="Passante / Balcão">Passante / Balcão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Observações / Demanda</Label>
              <Textarea
                placeholder="Ex: Perguntou preço de procedimento e horários de sábado..."
                value={leadNotes}
                onChange={(e) => setLeadNotes(e.target.value)}
                className="text-xs"
                rows={2}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNewLeadModalOpen(false)}
                disabled={submittingNewLead}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submittingNewLead || !leadName.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                {submittingNewLead ? 'Salvando...' : 'Salvar Lead'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL CONVERTER LEAD EM PACIENTE */}
      {selectedLeadForConvert && (
        <Dialog open={convertModalOpen} onOpenChange={setConvertModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900 text-base">
                <UserCheck className="h-5 w-5 text-emerald-600" />
                Converter Lead em Paciente Oficial
              </DialogTitle>
              <DialogDescription className="text-xs">
                Cria o prontuário e ficha cadastral para{' '}
                <strong>{selectedLeadForConvert.name}</strong> no sistema da clínica.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <p>
                  <strong>Nome:</strong> {selectedLeadForConvert.name}
                </p>
                <p>
                  <strong>Telefone:</strong> {selectedLeadForConvert.phone || 'Não informado'}
                </p>
                <p>
                  <strong>Especialidade:</strong>{' '}
                  {selectedLeadForConvert.interest_specialty || 'Geral'}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  CPF (opcional — gerado provisoriamente se vazio)
                </Label>
                <Input
                  placeholder="000.000.000-00"
                  value={convertCpf}
                  onChange={(e) => setConvertCpf(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Convênio / Plano</Label>
                <Select value={convertInsurance} onValueChange={setConvertInsurance}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Particular">Particular</SelectItem>
                    <SelectItem value="Unimed">Unimed</SelectItem>
                    <SelectItem value="Bradesco Saúde">Bradesco Saúde</SelectItem>
                    <SelectItem value="Amil">Amil</SelectItem>
                    <SelectItem value="SulAmérica">SulAmérica</SelectItem>
                    <SelectItem value="SUS">SUS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConvertModalOpen(false)}
                disabled={isConverting}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmConvert}
                disabled={isConverting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {isConverting ? 'Convertendo...' : 'Confirmar e Criar Paciente'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
