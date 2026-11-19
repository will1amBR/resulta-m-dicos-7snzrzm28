import { useCallback, useEffect, useMemo, useState } from 'react'
import { ShieldAlert, Calendar, RefreshCw, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { getClinicDoctors } from '@/services/clinic'
import {
  getIgnoredMedicationAlerts,
  IgnoredMedicationAlert,
} from '@/services/ignored-medication-alerts'
import { cn } from '@/lib/utils'

const RISK_LABEL: Record<string, string> = {
  contraindicacao: 'Contraindicação',
  precaucao: 'Precaução',
}

function RiskBadge({ level }: { level: string }) {
  const isContra = level === 'contraindicacao'
  return (
    <Badge
      className={cn(
        'text-[10px] font-bold shrink-0',
        isContra
          ? 'bg-red-100 text-red-700 border border-red-300'
          : 'bg-amber-100 text-amber-800 border border-amber-300',
      )}
    >
      {isContra ? '🔴' : '🟡'} {RISK_LABEL[level] || level}
    </Badge>
  )
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ClinicIgnoredAlerts() {
  const { toast } = useToast()

  const [alerts, setAlerts] = useState<IgnoredMedicationAlert[]>([])
  const [doctors, setDoctors] = useState<Array<{ id: string; name?: string }>>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filtros
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [doctorFilter, setDoctorFilter] = useState('todos')
  const [riskFilter, setRiskFilter] = useState('todos')

  const loadAlerts = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await getIgnoredMedicationAlerts({
        doctorId: doctorFilter !== 'todos' ? doctorFilter : undefined,
        riskLevel: riskFilter as 'contraindicacao' | 'precaucao' | 'todos',
        from: fromDate || undefined,
        to: toDate || undefined,
      })
      setAlerts(list)
    } catch {
      setAlerts([])
      toast({
        title: 'Erro ao carregar histórico',
        description: 'Não foi possível carregar os alertas ignorados. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [doctorFilter, riskFilter, fromDate, toDate, toast])

  useEffect(() => {
    loadAlerts()
  }, [loadAlerts])

  useEffect(() => {
    getClinicDoctors()
      .then((list) => setDoctors(list as Array<{ id: string; name?: string }>))
      .catch(() => setDoctors([]))
  }, [])

  const summary = useMemo(() => {
    const contra = alerts.filter((a) => a.risk_level === 'contraindicacao').length
    const prec = alerts.filter((a) => a.risk_level === 'precaucao').length
    return { total: alerts.length, contra, prec }
  }, [alerts])

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 min-w-0">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-subtle flex flex-col md:flex-row md:items-center md:justify-between gap-4 min-w-0">
        <div className="space-y-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 break-words">
            <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <span className="min-w-0">Alertas de Risco Ignorados</span>
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Justificativas clínicas registradas pelos médicos ao emitir receitas com alerta de
            contraindicação ou precaução, para revisão clínica.
          </p>
        </div>
        <Button
          onClick={loadAlerts}
          variant="outline"
          className="h-9 text-xs shrink-0 self-start md:self-auto"
          disabled={isLoading}
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
          Atualizar
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-subtle">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total no período
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{summary.total}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-subtle">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Contraindicações
            </p>
            <p className="text-2xl font-extrabold text-red-600 mt-1">{summary.contra}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-subtle">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Precauções
            </p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{summary.prec}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="border-slate-200 shadow-subtle">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1 min-w-0">
            <Label className="text-xs font-semibold text-slate-700">De</Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1 min-w-0">
            <Label className="text-xs font-semibold text-slate-700">Até</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1 min-w-0">
            <Label className="text-xs font-semibold text-slate-700">Médico</Label>
            <Select value={doctorFilter} onValueChange={setDoctorFilter}>
              <SelectTrigger className="h-9 text-xs w-full">
                <SelectValue placeholder="Todos os médicos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os médicos</SelectItem>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name || 'Médico'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 min-w-0">
            <Label className="text-xs font-semibold text-slate-700">Nível de risco</Label>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="h-9 text-xs w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="contraindicacao">Contraindicação</SelectItem>
                <SelectItem value="precaucao">Precaução</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de registros */}
      <Card className="border-slate-200 shadow-subtle">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-slate-900">Histórico de registros</CardTitle>
          <CardDescription className="text-xs">
            Um registro por alerta de risco alto presente no momento da emissão da receita.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <p className="text-sm font-semibold text-slate-700">Nenhum alerta ignorado</p>
              <p className="text-xs text-slate-500 mt-1">
                Quando um médico emitir receita com justificativa de risco, o registro aparecerá
                aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((a) => {
                const pat = a.expand?.patient
                const doc = a.expand?.doctor
                return (
                  <details
                    key={a.id}
                    className="group rounded-xl border border-slate-200 bg-white overflow-hidden"
                  >
                    <summary className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 cursor-pointer select-none hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                      <RiskBadge level={a.risk_level} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 break-words">
                          {pat?.name || 'Paciente'} — {a.medication_name}
                        </p>
                        <p className="text-[11px] text-slate-500 break-words">
                          {doc?.name || 'Médico'}
                          {(doc as any)?.crm || (doc as any)?.council_number
                            ? ` · CRM ${(doc as any).crm || (doc as any).council_number}`
                            : ''}{' '}
                          · {formatDate(a.created)}
                        </p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-3 sm:px-4 pb-4 pt-1 space-y-2.5 border-t border-slate-100">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Motivo do alerta
                        </p>
                        <p className="text-xs text-slate-700 mt-1 break-words">
                          {a.alert_reason || 'Não informado'}
                        </p>
                      </div>
                      {a.alert_suggestion ? (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Sugestão da análise
                          </p>
                          <p className="text-xs text-slate-700 mt-1 break-words">
                            {a.alert_suggestion}
                          </p>
                        </div>
                      ) : null}
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Justificativa do médico
                        </p>
                        <p className="text-xs text-slate-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mt-1 break-words whitespace-pre-wrap">
                          {a.justification}
                        </p>
                      </div>
                    </div>
                  </details>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
