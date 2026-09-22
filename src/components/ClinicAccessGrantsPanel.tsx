import { useState, useEffect } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  User,
  Stethoscope,
  RefreshCw,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Lock,
  History,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AccessGrant, AccessAuditLog } from '@/types/clinical'
import { getClinicAccessGrants, getClinicAccessAuditLogs } from '@/services/clinic'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'

interface ClinicAccessGrantsPanelProps {
  onOpenLgpdReport?: () => void
}

export function ClinicAccessGrantsPanel({ onOpenLgpdReport }: ClinicAccessGrantsPanelProps) {
  const { toast } = useToast()
  const [grants, setGrants] = useState<AccessGrant[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todas' | 'ativa' | 'pendente' | 'expirada'>(
    'ativa',
  )
  const [nowTime, setNowTime] = useState(Date.now())

  // Atualizar o relógio a cada 30 segundos para a contagem regressiva das 24h
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now())
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [gList, logs] = await Promise.all([
        getClinicAccessGrants().catch(() => []),
        getClinicAccessAuditLogs(20).catch(() => []),
      ])
      setGrants(gList as AccessGrant[])
      setAuditLogs(logs)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('access_grants', () => {
    loadData()
  })

  useRealtime('access_audit_log', () => {
    loadData()
  })

  // Formatar contagem regressiva a partir do `expires_at`
  const getTimeRemaining = (expiresAtStr: string) => {
    if (!expiresAtStr) return { expired: true, text: 'Expirada' }
    const expiresAt = new Date(expiresAtStr).getTime()
    const diffMs = expiresAt - nowTime

    if (diffMs <= 0) {
      return { expired: true, text: 'Expirada' }
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return { expired: false, text: `${hours}h ${minutes}min restantes` }
    }
    return { expired: false, text: `${minutes} min restantes` }
  }

  // Filtrar concessões
  const filteredGrants = grants.filter((g) => {
    const patName = g.expand?.patient?.name?.toLowerCase() || ''
    const docName =
      g.target_name?.toLowerCase() || g.expand?.granted_to_user?.name?.toLowerCase() || ''
    const q = searchQuery.toLowerCase()

    const matchesSearch = !q || patName.includes(q) || docName.includes(q)

    if (!matchesSearch) return false

    if (statusFilter === 'todas') return true

    // Para "ativa", conferir tanto g.status === 'ativa' quanto se ainda não expirou
    if (statusFilter === 'ativa') {
      const remaining = getTimeRemaining(g.expires_at)
      return g.status === 'ativa' && !remaining.expired
    }

    return g.status === statusFilter
  })

  // Concessões ativas reais no momento
  const activeGrantsCount = grants.filter(
    (g) => g.status === 'ativa' && !getTimeRemaining(g.expires_at).expired,
  ).length

  return (
    <Card id="concessoes" className="border-slate-200 shadow-subtle overflow-hidden scroll-mt-20">
      <CardHeader className="bg-slate-50/70 border-b border-slate-100 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <Lock className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-bold text-slate-900">
                Concessões de Acesso 24h & Trilha de Auditoria
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Arquitetura Modelo Aberto: o histórico pertence ao paciente. Monitore autorizações em
              vigor concedidas aos médicos do corpo clínico.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-indigo-600 text-white font-bold text-xs gap-1.5 px-3 py-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              {activeGrantsCount} Autorizações Ativas
            </Badge>

            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
              className="text-xs h-8 bg-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        <Tabs defaultValue="concessoes" className="w-full space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <TabsList className="h-9">
              <TabsTrigger value="concessoes" className="text-xs gap-1.5 font-semibold">
                <Clock className="h-3.5 w-3.5" />
                Concessões Ativas ({activeGrantsCount})
              </TabsTrigger>
              <TabsTrigger value="auditoria" className="text-xs gap-1.5 font-semibold">
                <History className="h-3.5 w-3.5" />
                Trilha de Auditoria ({auditLogs.length})
              </TabsTrigger>
            </TabsList>

            {/* Banner explicativo Modelo Aberto */}
            <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Info className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span>Janela de 24 horas controlada diretamente pelo paciente.</span>
            </div>
          </div>

          {/* ABA 1: CONCESSÕES ATIVAS & FILTRO */}
          <TabsContent value="concessoes" className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                <Input
                  placeholder="Filtrar por paciente ou médico..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
                {(['ativa', 'pendente', 'expirada', 'todas'] as const).map((st) => (
                  <Button
                    key={st}
                    size="sm"
                    variant={statusFilter === st ? 'default' : 'outline'}
                    onClick={() => setStatusFilter(st)}
                    className="text-xs h-7 capitalize whitespace-nowrap"
                  >
                    {st === 'ativa'
                      ? 'Ativas (24h)'
                      : st === 'pendente'
                        ? 'Pendentes'
                        : st === 'expirada'
                          ? 'Expiradas'
                          : 'Todas'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tabela de Concessões */}
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto text-indigo-600 mb-2" />
                Carregando concessões de acesso em vigor...
              </div>
            ) : filteredGrants.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <Lock className="h-7 w-7 text-slate-300 mx-auto" />
                <p className="font-semibold text-xs text-slate-700">
                  Nenhuma concessão encontrada para o filtro selecionado.
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Quando um paciente autoriza um médico ou consulta, a concessão temporária de 24h
                  aparecerá nesta lista com contagem regressiva.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="p-3">Paciente Autorizado</th>
                      <th className="p-3">Médico / Escopo</th>
                      <th className="p-3">Motivo da Concessão</th>
                      <th className="p-3">Tempo Restante (24h)</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredGrants.map((grant) => {
                      const patName = grant.expand?.patient?.name || 'Paciente'
                      const patCpf = grant.expand?.patient?.cpf || ''
                      const docName =
                        grant.target_name ||
                        grant.expand?.granted_to_user?.name ||
                        'Corpo Clínico Resulta'
                      const scope = grant.scope || 'prontuario,exames,prescricoes'
                      const remaining = getTimeRemaining(grant.expires_at)
                      const isExpired = remaining.expired || grant.status === 'expirada'

                      return (
                        <tr key={grant.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                                <User className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{patName}</p>
                                {patCpf && (
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    CPF: {patCpf}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="space-y-0.5">
                              <p className="font-semibold text-slate-800 flex items-center gap-1">
                                <Stethoscope className="h-3 w-3 text-indigo-600 shrink-0" />
                                {docName}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {scope.split(',').map((s) => (
                                  <span
                                    key={s}
                                    className="bg-slate-100 text-slate-700 text-[9px] px-1.5 py-0.2 rounded border border-slate-200 capitalize font-mono"
                                  >
                                    {s.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </td>

                          <td className="p-3 text-slate-600 max-w-xs">
                            <p className="truncate text-[11px]" title={grant.reason}>
                              {grant.reason || 'Atendimento clínico / telemedicina'}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              Criada em:{' '}
                              {grant.created
                                ? new Date(grant.created).toLocaleDateString('pt-BR')
                                : 'Recente'}
                            </span>
                          </td>

                          <td className="p-3">
                            {grant.status === 'pendente' ? (
                              <span className="text-amber-700 font-semibold text-[11px]">
                                Aguardando aceite
                              </span>
                            ) : isExpired ? (
                              <span className="text-slate-400 font-mono text-[11px]">Expirada</span>
                            ) : (
                              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 w-fit">
                                <Clock className="h-3 w-3 text-emerald-600 animate-pulse" />
                                {remaining.text}
                              </div>
                            )}
                          </td>

                          <td className="p-3 text-right">
                            <Badge
                              variant="outline"
                              className={`text-[10px] uppercase font-bold ${
                                grant.status === 'ativa' && !isExpired
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : grant.status === 'pendente'
                                    ? 'bg-amber-50 text-amber-700 border-amber-300'
                                    : 'bg-slate-100 text-slate-600 border-slate-300'
                              }`}
                            >
                              {grant.status === 'ativa' && !isExpired ? '✓ Ativa' : grant.status}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* ABA 2: TRILHA DE AUDITORIA RESUMIDA */}
          <TabsContent value="auditoria" className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Últimos eventos registrados na coleção access_audit_log:
              </span>
              {onOpenLgpdReport && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onOpenLgpdReport}
                  className="h-7 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                >
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Ver Relatório Completo LGPD
                </Button>
              )}
            </div>

            {auditLogs.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">
                Nenhum registro de auditoria encontrado.
              </p>
            ) : (
              <div className="space-y-2">
                {auditLogs.map((log) => {
                  const patName = log.expand?.patient?.name || 'Paciente'
                  const dateStr = log.created
                    ? new Date(log.created).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recente'

                  return (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-50/80 rounded-lg border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-100/60 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`text-[9px] uppercase font-bold ${
                              log.action === 'concedeu_24h'
                                ? 'bg-emerald-600 text-white'
                                : log.action === 'consultou'
                                  ? 'bg-blue-600 text-white'
                                  : log.action === 'revogou'
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-slate-600 text-white'
                            }`}
                          >
                            {log.action}
                          </Badge>
                          <span className="font-bold text-slate-900">{log.actor_name}</span>
                          <span className="text-[10px] text-slate-400">({log.actor_role})</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 font-medium">Paciente: {patName}</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          <strong>Recurso:</strong> {log.resource}{' '}
                          {log.details && `— ${log.details}`}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono text-[10px] text-slate-400 block">
                          {dateStr}
                        </span>
                        {log.ip_address && (
                          <span className="text-[9px] text-slate-400 font-mono block">
                            {log.ip_address}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
