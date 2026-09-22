import { useState, useEffect, useMemo } from 'react'
import {
  ShieldCheck,
  FileSpreadsheet,
  Printer,
  Filter,
  Search,
  Calendar,
  User,
  History,
  Lock,
  Download,
  RefreshCw,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AccessAuditLog, Patient } from '@/types/clinical'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

interface LgpdAuditReportModalProps {
  isOpen: boolean
  onClose: () => void
  initialPatientId?: string
}

export function LgpdAuditReportModal({
  isOpen,
  onClose,
  initialPatientId,
}: LgpdAuditReportModalProps) {
  const { toast } = useToast()

  const [logs, setLogs] = useState<AccessAuditLog[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)

  // Filtros mínimos obrigatórios e avançados
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId || 'todos')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [actionFilter, setActionFilter] = useState<string>('todas')
  const [searchActor, setSearchActor] = useState<string>('')

  // Sincronizar initialPatientId caso mude
  useEffect(() => {
    if (initialPatientId) {
      setSelectedPatientId(initialPatientId)
    }
  }, [initialPatientId])

  const loadPatientsAndLogs = async () => {
    setLoading(true)
    try {
      // Carregar lista de pacientes para o dropdown de filtro
      const patsRes = await pb.collection('patients').getList<Patient>(1, 100, {
        sort: 'name',
      })
      setPatients(patsRes.items)

      // Carregar logs de auditoria
      const logsRes = await pb.collection('access_audit_log').getList<AccessAuditLog>(1, 200, {
        sort: '-created',
        expand: 'patient,actor_user',
      })
      setLogs(logsRes.items)
    } catch (err) {
      console.warn('Erro ao carregar logs de auditoria para compliance LGPD:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadPatientsAndLogs()
    }
  }, [isOpen])

  // Filtragem dos logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Filtro de Paciente
      if (selectedPatientId !== 'todos') {
        if (log.patient !== selectedPatientId) return false
      }

      // 2. Filtro de Ação
      if (actionFilter !== 'todas') {
        if (log.action !== actionFilter) return false
      }

      // 3. Filtro de Período (Data início e fim)
      if (log.created) {
        const logDate = new Date(log.created)
        if (startDate) {
          const start = new Date(startDate)
          if (logDate < start) return false
        }
        if (endDate) {
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          if (logDate > end) return false
        }
      }

      // 4. Busca por ator/profissional ou recurso
      if (searchActor.trim()) {
        const query = searchActor.toLowerCase()
        const matchName = log.actor_name?.toLowerCase().includes(query)
        const matchResource = log.resource?.toLowerCase().includes(query)
        const matchDetails = log.details?.toLowerCase().includes(query)
        if (!matchName && !matchResource && !matchDetails) return false
      }

      return true
    })
  }, [logs, selectedPatientId, actionFilter, startDate, endDate, searchActor])

  // Exportar CSV com UTF-8 BOM (\uFEFF)
  const exportCsv = () => {
    if (filteredLogs.length === 0) {
      toast({
        title: 'Nenhum registro para exportar',
        description: 'Ajuste os filtros de período e paciente para obter registros.',
        variant: 'destructive',
      })
      return
    }

    const headers = [
      'Data e Hora (UTC/BR)',
      'ID Paciente',
      'Nome do Paciente',
      'Profissional / Ator',
      'Papel do Ator',
      'Ação Realizada',
      'Recurso Clínico Acessado',
      'Justificativa / Detalhes',
      'Endereço IP / Origem',
    ]

    const rows = filteredLogs.map((log) => {
      const dt = log.created ? new Date(log.created).toLocaleString('pt-BR') : '-'
      const pat = (log as any).expand?.patient?.name || log.patient || 'Paciente'
      const actor = log.actor_name || 'Desconhecido'
      const role = log.actor_role || 'doctor'
      const action = log.action
      const resource = (log.resource || '-').replace(/"/g, '""')
      const details = (log.details || '-').replace(/"/g, '""')
      const ip = (log.ip_address || 'Servidor Seguro Brasil').replace(/"/g, '""')

      return `"${dt}";"${log.patient}";"${pat}";"${actor}";"${role}";"${action}";"${resource}";"${details}";"${ip}"`
    })

    // UTF-8 BOM (\uFEFF) garante que acentuações abram impecavelmente no Microsoft Excel
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute(
      'download',
      `relatorio-auditoria-lgpd-${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: 'Relatório LGPD Exportado (CSV)',
      description: `${filteredLogs.length} eventos de auditoria baixados com compatibilidade total para Excel.`,
    })
  }

  // Impressão otimizada / PDF
  const handlePrintPdf = () => {
    window.print()
  }

  const selectedPatientName = useMemo(() => {
    if (selectedPatientId === 'todos') return 'Todos os Pacientes'
    const found = patients.find((p) => p.id === selectedPatientId)
    return found ? `${found.name} (${found.cpf || 'Sem CPF'})` : 'Paciente Selecionado'
  }, [patients, selectedPatientId])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto print:max-w-none print:m-0 print:p-0 print:border-none print:shadow-none">
        <DialogHeader className="print:hidden">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Relatório de Auditoria e Conformidade LGPD
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Exportação oficial da trilha de auditoria (access_audit_log) para conformidade
                regulatória e segurança jurídica da clínica e dos pacientes.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Bloco de Filtros Mínimos: Paciente, Período (Início/Fim), Ação e Busca */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3 print:hidden">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-indigo-600" /> Filtros do Relatório LGPD
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadPatientsAndLogs}
              disabled={loading}
              className="h-7 text-xs text-slate-600 gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Atualizar
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* Filtro: Paciente */}
            <div>
              <Label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Paciente
              </Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Pacientes ({patients.length})</SelectItem>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} {p.cpf ? `(${p.cpf})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro: Ação */}
            <div>
              <Label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Tipo de Ação
              </Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Ações</SelectItem>
                  <SelectItem value="consultou">Consultou Histórico</SelectItem>
                  <SelectItem value="concedeu_24h">Concedeu Acesso 24h</SelectItem>
                  <SelectItem value="revogou">Revogou Acesso</SelectItem>
                  <SelectItem value="solicitou">Solicitou Acesso</SelectItem>
                  <SelectItem value="negou">Negou Solicitação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro: Data Início */}
            <div>
              <Label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Data Início
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {/* Filtro: Data Fim */}
            <div>
              <Label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Data Fim
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Busca por Profissional / Recurso */}
          <div className="pt-1">
            <Input
              placeholder="Buscar por nome do profissional, recurso acessado ou detalhe..."
              value={searchActor}
              onChange={(e) => setSearchActor(e.target.value)}
              className="h-8 text-xs bg-white"
            />
          </div>
        </div>

        {/* Resumo Estatístico do Filtro */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 print:hidden">
          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Eventos Filtrados
            </span>
            <p className="text-xl font-black text-slate-900">{filteredLogs.length}</p>
            <span className="text-[10px] text-slate-500">registros auditados</span>
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-blue-600 uppercase block">
              Consultas ao Prontuário
            </span>
            <p className="text-xl font-black text-blue-700">
              {filteredLogs.filter((l) => l.action === 'consultou').length}
            </p>
            <span className="text-[10px] text-blue-600">acessos a dados</span>
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-emerald-600 uppercase block">
              Concessões 24h
            </span>
            <p className="text-xl font-black text-emerald-700">
              {filteredLogs.filter((l) => l.action === 'concedeu_24h').length}
            </p>
            <span className="text-[10px] text-emerald-600">autorizações ativas</span>
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-rose-600 uppercase block">
              Revogações Imediatas
            </span>
            <p className="text-xl font-black text-rose-700">
              {filteredLogs.filter((l) => l.action === 'revogou').length}
            </p>
            <span className="text-[10px] text-rose-600">bloqueios pelo paciente</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* CONTAINER IMPRESSO / VISUALIZADOR OFICIAL LGPD */}
        {/* ============================================================== */}
        <div className="border border-slate-200 rounded-xl overflow-hidden print:border-none">
          {/* Header do Relatório LGPD */}
          <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:bg-white print:text-slate-900 print:border-b-2 print:border-slate-900">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-400 print:text-slate-900" />
                Relatório de Trilha de Auditoria LGPD — Resulta Médicos
              </h3>
              <p className="text-xs text-slate-300 print:text-slate-600">
                Paciente: <strong>{selectedPatientName}</strong> • Emissão:{' '}
                {new Date().toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <Badge className="bg-indigo-600 text-white text-[11px] print:border">
                {filteredLogs.length} Registros Auditados
              </Badge>
            </div>
          </div>

          {/* Tabela de Trilha de Auditoria */}
          <div className="max-h-72 overflow-y-auto print:max-h-none print:overflow-visible">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold sticky top-0 print:static">
                <tr>
                  <th className="p-2.5">Data & Hora</th>
                  <th className="p-2.5">Paciente</th>
                  <th className="p-2.5">Ator / Profissional</th>
                  <th className="p-2.5">Ação</th>
                  <th className="p-2.5">Recurso Acessado</th>
                  <th className="p-2.5">Detalhes / Escopo</th>
                  <th className="p-2.5 text-right">Origem IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Nenhum evento de auditoria localizado para os filtros informados.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const dt = log.created ? new Date(log.created) : new Date()
                    const patName = (log as any).expand?.patient?.name || log.patient || 'Paciente'
                    const isConsult = log.action === 'consultou'
                    const isGrant = log.action === 'concedeu_24h'
                    const isRevoke = log.action === 'revogou'

                    return (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono text-[11px] whitespace-nowrap">
                          {dt.toLocaleDateString('pt-BR')}{' '}
                          <span className="font-bold">
                            {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="p-2.5 font-medium text-slate-900">{patName}</td>
                        <td className="p-2.5 text-slate-800">
                          <p className="font-semibold">{log.actor_name || 'Profissional'}</p>
                          <span className="text-[10px] text-slate-500 capitalize">
                            {log.actor_role}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              isConsult
                                ? 'bg-blue-100 text-blue-800'
                                : isGrant
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isRevoke
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {log.action.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-700 font-medium">{log.resource}</td>
                        <td
                          className="p-2.5 text-slate-500 text-[11px] max-w-xs truncate"
                          title={log.details}
                        >
                          {log.details || '-'}
                        </td>
                        <td className="p-2.5 text-right font-mono text-[10px] text-slate-400 whitespace-nowrap">
                          {log.ip_address || '189.40.12.88'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rodapé e Botões de Exportação */}
        <DialogFooter className="gap-2 sm:gap-0 pt-3 print:hidden">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Fechar
          </Button>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrintPdf}
              variant="outline"
              size="sm"
              className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex items-center gap-1.5"
            >
              <Printer className="h-4 w-4 text-indigo-600" />
              Imprimir / PDF LGPD
            </Button>
            <Button
              onClick={exportCsv}
              size="sm"
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar CSV (Excel UTF-8 BOM)
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
