import { useState, useEffect, useMemo } from 'react'
import {
  MessageSquare,
  Send,
  ExternalLink,
  Clock,
  Sparkles,
  Bot,
  Copy,
  Calendar,
  CheckCircle2,
  FileText,
  Cake,
  RotateCcw,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Info,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import {
  DEFAULT_WHATSAPP_TEMPLATES,
  WhatsAppTemplate,
  buildWaMeUrl,
  fillTemplateVariables,
  getWhatsAppQueue,
  addToWhatsAppQueue,
  markWhatsAppMessageSent,
  deleteWhatsAppQueueItem,
} from '@/services/whatsapp'
import { getPatients } from '@/services/patients'
import { getClinicAppointments } from '@/services/clinic'
import { Patient, Appointment, WhatsAppQueueItem, WhatsAppMessageType } from '@/types/clinical'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
import { useAuth } from '@/hooks/use-auth'

export default function ClinicWhatsApp() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [patients, setPatients] = useState<Patient[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [queue, setQueue] = useState<WhatsAppQueueItem[]>([])
  const [loading, setLoading] = useState(true)

  // Templates customizáveis pela secretária
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(DEFAULT_WHATSAPP_TEMPLATES)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tmpl_confirmacao')
  const [editableTemplateBody, setEditableTemplateBody] = useState<string>('')

  // Disparo Rápido / Seleção
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [customPhone, setCustomPhone] = useState('')
  const [customRecipient, setCustomRecipient] = useState('')
  const [customDate, setCustomDate] = useState('')
  const [customTime, setCustomTime] = useState('')
  const [customDoctor, setCustomDoctor] = useState('')
  const [customClinic, setCustomClinic] = useState('Resulta Clínica')
  const [previewMessage, setPreviewMessage] = useState('')

  // Filtros da fila
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'enviada'>('todos')
  const [activeTab, setActiveTab] = useState<'envio' | 'fila' | 'templates'>('envio')

  // Modal Novo Disparo
  const [manualModalOpen, setManualModalOpen] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [pts, appts, q] = await Promise.all([
        getPatients().catch(() => []),
        getClinicAppointments().catch(() => []),
        getWhatsAppQueue(60).catch(() => []),
      ])
      setPatients(pts)
      setAppointments(appts)
      setQueue(q)
    } catch {
      toast({ title: 'Erro ao carregar dados do WhatsApp', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Inicializar o corpo do template selecionado
  useEffect(() => {
    const tmpl = templates.find((t) => t.id === selectedTemplateId)
    if (tmpl) {
      setEditableTemplateBody(tmpl.body)
    }
  }, [selectedTemplateId, templates])

  // Atualizar preview dinamicamente
  useEffect(() => {
    const filled = fillTemplateVariables(editableTemplateBody, {
      nome_paciente: customRecipient || 'Paciente',
      clinica: customClinic,
      data: customDate || 'amanhã',
      horario: customTime || '09:00',
      medico: customDoctor || user?.name || 'Dr(a). da Clínica',
    })
    setPreviewMessage(filled)
  }, [
    editableTemplateBody,
    customRecipient,
    customClinic,
    customDate,
    customTime,
    customDoctor,
    user,
  ])

  // Quando seleciona um paciente no dropdown
  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId)
    const pat = patients.find((p) => p.id === patientId)
    if (pat) {
      setCustomRecipient(pat.name)
      setCustomPhone(pat.phone || '')

      // Tenta achar consulta próxima desse paciente
      const appt = appointments.find((a) => a.patient === pat.id)
      if (appt?.date_time) {
        const dt = new Date(appt.date_time)
        setCustomDate(dt.toLocaleDateString('pt-BR'))
        setCustomTime(dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
        setCustomDoctor(appt.expand?.doctor?.name || '')
      }
    }
  }

  // Ação: Abrir no WhatsApp & Registrar na Fila
  const handleSendViaWhatsApp = async (registerQueue = true) => {
    if (!customPhone.trim()) {
      toast({
        title: 'Telefone obrigatório',
        description: 'Informe o número do WhatsApp com DDD do paciente.',
        variant: 'destructive',
      })
      return
    }

    const waUrl = buildWaMeUrl(customPhone, previewMessage)

    if (registerQueue) {
      try {
        const tmpl = templates.find((t) => t.id === selectedTemplateId)
        await addToWhatsAppQueue({
          phone: customPhone,
          recipient_name: customRecipient || 'Paciente',
          patientId: selectedPatientId || undefined,
          type: tmpl?.type || 'outro',
          message: previewMessage,
          notes: 'Disparado via link rápido WhatsApp da Secretaria',
        })
        loadData()
      } catch {
        /* queue recording failed */
      }
    }

    // Abre link no WhatsApp Web ou App
    window.open(waUrl, '_blank')

    toast({
      title: 'WhatsApp Aberto!',
      description: 'Mensagem transferida com sucesso para o WhatsApp.',
    })
  }

  // Salvar alteração no template
  const handleSaveTemplateChange = () => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === selectedTemplateId ? { ...t, body: editableTemplateBody } : t)),
    )
    toast({
      title: 'Modelo de mensagem atualizado!',
      description: 'As alterações foram salvas para os próximos envios.',
    })
  }

  // Filtragem da Fila
  const filteredQueue = useMemo(() => {
    return queue.filter((item) => {
      const matchSearch =
        item.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone.includes(searchTerm) ||
        item.message.toLowerCase().includes(searchTerm.toLowerCase())
      const matchStatus = statusFilter === 'todos' || item.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [queue, searchTerm, statusFilter])

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-emerald-600" />
              Portal WhatsApp da Clínica
            </h1>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100 text-[10px]">
              Links Rápidos wa.me
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Agendamento facilitado, confirmações, lembretes de véspera e envio de documentos com
            disparo rápido.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="text-xs h-9 border-slate-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Banner Informativo sobre API da Meta Futura */}
      <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 flex items-start gap-3.5 shadow-xs">
        <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="h-4 w-4" />
        </div>
        <div className="text-xs text-blue-900 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">
              Pronto para automação oficial WhatsApp Business (Meta Cloud API)
            </span>
            <Badge variant="outline" className="text-[10px] bg-white border-blue-300 text-blue-700">
              Arquitetura Preparada
            </Badge>
          </div>
          <p className="text-blue-800 leading-relaxed">
            Enquanto não conectarmos as credenciais da API Oficial da Meta no servidor, a secretária
            utiliza os botões <strong>"Abrir WhatsApp"</strong> (que abrem a conversa já com o texto
            preenchido e número formatado). A fila de mensagens já fica gravada no banco de dados e,
            assim que a API for conectada, essa mesma fila será enviada 100% de forma automática!
          </p>
        </div>
      </div>

      {/* Tabs Principais */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-subtle">
        <div className="border-b border-slate-200 px-4 pt-3 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('envio')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'envio'
                  ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-md'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Send className="h-4 w-4" />
              Disparo Rápido de Mensagens
            </button>
            <button
              onClick={() => setActiveTab('fila')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'fila'
                  ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-md'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="h-4 w-4" />
              Fila & Histórico de Disparos ({queue.length})
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'templates'
                  ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-md'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Modelos de Mensagem ({templates.length})
            </button>
          </div>
        </div>

        {/* TAB 1: DISPARO RÁPIDO */}
        {activeTab === 'envio' && (
          <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Coluna Esquerda: Formulário de Configuração */}
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-800">
                  1. Selecione o Tipo de Mensagem / Finalidade:
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {templates.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(tmpl.id)}
                      className={`p-2.5 rounded-lg border text-left text-xs transition-all flex flex-col justify-between h-20 ${
                        selectedTemplateId === tmpl.id
                          ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-bold shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="line-clamp-2">{tmpl.name}</span>
                      <span className="text-[10px] text-slate-500 font-normal mt-1">
                        {tmpl.type.replace('_', ' ')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t space-y-3">
                <Label className="text-xs font-bold text-slate-800">
                  2. Destinatário (Paciente):
                </Label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-600 font-semibold">
                      Buscar Paciente Cadastrado:
                    </span>
                    <Select value={selectedPatientId} onValueChange={handleSelectPatient}>
                      <SelectTrigger className="text-xs h-9">
                        <SelectValue placeholder="Selecione um paciente..." />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} {p.phone ? `(${p.phone})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-600 font-semibold">
                      WhatsApp com DDD <span className="text-red-500">*</span>:
                    </span>
                    <Input
                      placeholder="(11) 91234-5678"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      className="text-xs h-9 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-semibold">Nome Paciente:</span>
                    <Input
                      value={customRecipient}
                      onChange={(e) => setCustomRecipient(e.target.value)}
                      placeholder="Nome completo"
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-semibold">Data Consulta:</span>
                    <Input
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      placeholder="dd/mm/aaaa"
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-semibold">Horário:</span>
                    <Input
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      placeholder="14:00"
                      className="text-xs h-8"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-semibold">Médico:</span>
                    <Input
                      value={customDoctor}
                      onChange={(e) => setCustomDoctor(e.target.value)}
                      placeholder="Dr(a). Nome"
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-semibold">Clínica:</span>
                    <Input
                      value={customClinic}
                      onChange={(e) => setCustomClinic(e.target.value)}
                      placeholder="Resulta Clínica"
                      className="text-xs h-8"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Visualização do WhatsApp e Botão de Envio */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4 text-emerald-600" />
                    Pré-visualização da Mensagem
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-white">
                    Pronta para Disparo
                  </Badge>
                </div>

                {/* Balão do WhatsApp */}
                <div className="bg-[#DCF8C6] p-3.5 rounded-2xl rounded-tr-none shadow-xs text-xs text-slate-800 leading-relaxed relative border border-emerald-200">
                  <p className="whitespace-pre-wrap">{previewMessage}</p>
                  <span className="text-[9px] text-slate-500 block text-right mt-1.5">
                    {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}{' '}
                    ✓✓
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1">
                  <p>
                    <strong>Destinatário formatado:</strong> {customPhone || 'Não informado'}
                  </p>
                  <p className="text-slate-400">
                    Ao clicar abaixo, o WhatsApp abrirá com o chat deste paciente e o texto acima
                    preenchido.
                  </p>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button
                  onClick={() => handleSendViaWhatsApp(true)}
                  disabled={!customPhone.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 gap-2 shadow-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir WhatsApp & Registrar Envio
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(previewMessage)
                    toast({ title: 'Texto copiado para a área de transferência!' })
                  }}
                  className="w-full text-xs h-8"
                >
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copiar Apenas o Texto
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FILA & HISTÓRICO DE DISPAROS */}
        {activeTab === 'fila' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Buscar por paciente ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-8 text-xs"
                />
              </div>

              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as 'todos' | 'pendente' | 'enviada')}
              >
                <SelectTrigger className="h-8 text-xs w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="pendente">⏳ Pendentes</SelectItem>
                  <SelectItem value="enviada">✓ Enviadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              {filteredQueue.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-400">
                  Nenhuma mensagem registrada na fila.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-3">Destinatário</th>
                      <th className="p-3">Finalidade</th>
                      <th className="p-3">Mensagem</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Ação Rápida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredQueue.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 whitespace-nowrap">
                          <p className="font-bold text-slate-900">{item.recipient_name}</p>
                          <p className="text-[11px] text-slate-500">{item.phone}</p>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <Badge variant="outline" className="text-[10px]">
                            {item.type.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-3 max-w-sm">
                          <p className="text-[11px] text-slate-700 line-clamp-2">{item.message}</p>
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          {item.status === 'enviada' ? (
                            <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Enviada
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500 text-white text-[10px] gap-1">
                              <Clock className="h-3 w-3" /> Pendente
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <Button
                            size="sm"
                            onClick={() => {
                              const url = buildWaMeUrl(item.phone, item.message)
                              markWhatsAppMessageSent(item.id)
                              window.open(url, '_blank')
                              loadData()
                            }}
                            className="h-7 text-[11px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1"
                          >
                            <ExternalLink className="h-3 w-3" /> Abrir WhatsApp
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MODELOS EDITÁVEIS PELA SECRETARIA */}
        {activeTab === 'templates' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Modelos de Mensagem Padrão (Editáveis)
                </h3>
                <p className="text-xs text-slate-500">
                  Personalize as mensagens que a clínica dispara aos pacientes. Use as tags{' '}
                  <code className="text-emerald-700 font-bold">{'{nome_paciente}'}</code>,{' '}
                  <code className="text-emerald-700 font-bold">{'{data}'}</code>,{' '}
                  <code className="text-emerald-700 font-bold">{'{horario}'}</code>,{' '}
                  <code className="text-emerald-700 font-bold">{'{medico}'}</code>,{' '}
                  <code className="text-emerald-700 font-bold">{'{clinica}'}</code>.
                </p>
              </div>

              <Button
                size="sm"
                onClick={handleSaveTemplateChange}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8"
              >
                Salvar Modelo Atual
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Selecione o Modelo:</Label>
                {templates.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                    className={`w-full p-3 rounded-lg border text-left text-xs transition-all ${
                      selectedTemplateId === tmpl.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <p className="font-bold">{tmpl.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{tmpl.title}</p>
                  </button>
                ))}
              </div>

              <div className="md:col-span-2 space-y-3">
                <Label className="text-xs font-bold text-slate-700">
                  Conteúdo do Modelo Selecionado:
                </Label>
                <Textarea
                  value={editableTemplateBody}
                  onChange={(e) => setEditableTemplateBody(e.target.value)}
                  className="text-xs font-mono"
                  rows={6}
                />
                <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-500">
                  <span className="font-bold">Variáveis disponíveis:</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded border">
                    {'{nome_paciente}'}
                  </span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded border">{'{clinica}'}</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded border">{'{data}'}</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded border">{'{horario}'}</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded border">{'{medico}'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
