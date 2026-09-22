import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Boxes,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Filter,
  Package,
  Layers,
  Activity,
  Calendar,
  AlertCircle,
  HelpCircle,
  RefreshCw,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getSupplyConsumptionMetrics, SupplyConsumptionSummary } from '@/services/supplies'
import { useRealtime } from '@/hooks/use-realtime'

export function ClinicSupplyConsumptionPanel() {
  const [period, setPeriod] = useState<'7d' | '30d' | 'mes_atual'>('30d')
  const [summary, setSummary] = useState<SupplyConsumptionSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const loadMetrics = async (selectedPeriod = period) => {
    setLoading(true)
    try {
      const data = await getSupplyConsumptionMetrics(selectedPeriod)
      setSummary(data)
    } catch (err) {
      console.error('Erro ao carregar métricas de consumo de insumos:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMetrics(period)
  }, [period])

  useRealtime('clinic_supply_movements', () => {
    loadMetrics(period)
  })

  useRealtime('clinic_supplies', () => {
    loadMetrics(period)
  })

  const formatCurrency = (val: number) => {
    return `R$ ${val.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  return (
    <Card className="border-slate-200 shadow-subtle overflow-hidden">
      {/* Header do Painel */}
      <CardHeader className="bg-slate-50/70 border-b border-slate-100 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Boxes className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-bold text-slate-900">
                Consumo de Insumos & Custo por Atendimento
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Análise financeira operacional: baixas em consultas e procedimentos, custo médio por
              atendimento e curva de consumo no período.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Seletor de Período */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              {(
                [
                  { id: '7d', label: '7 Dias' },
                  { id: '30d', label: '30 Dias' },
                  { id: 'mes_atual', label: 'Mês Atual' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all ${
                    period === p.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadMetrics(period)}
              disabled={loading}
              className="text-xs h-8 bg-white border-slate-200"
              title="Atualizar dados de consumo"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>

            <Link to="/clinic/estoque">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 gap-1 border-emerald-300 text-emerald-800 bg-emerald-50/50 hover:bg-emerald-100/70"
              >
                Gerenciar Estoque <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-5">
        {/* Métricas Principais em Destaque */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Card 1: Custo Total de Insumos no Período */}
          <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
              Custo Total Consumido
            </span>
            <div className="mt-2">
              <p className="text-2xl font-black text-emerald-950 tracking-tight">
                {summary ? formatCurrency(summary.totalCost) : 'R$ 0,00'}
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Em {summary?.totalMovementsCount ?? 0} baixa(s) de insumos
              </p>
            </div>
          </div>

          {/* Card 2: Custo Médio por Atendimento */}
          <div className="bg-indigo-50/40 border border-indigo-200/80 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-indigo-800 uppercase tracking-wide">
              Custo Médio / Atendimento
            </span>
            <div className="mt-2">
              <p className="text-2xl font-black text-indigo-950 tracking-tight">
                {summary ? formatCurrency(summary.avgCostPerAppointment) : 'R$ 0,00'}
              </p>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                Total consumido ÷ {summary?.appointmentsCount ?? 0} consultas
              </p>
            </div>
          </div>

          {/* Card 3: Unidades Físicas Consumidas */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Volume Consumido
            </span>
            <div className="mt-2">
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {summary?.totalUnitsConsumed ?? 0}
                <span className="text-xs font-normal text-slate-500 ml-1">unidades</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Descartáveis, curativos e EPIs</p>
            </div>
          </div>

          {/* Card 4: Procedimentos com Consumo Registrado */}
          <div className="bg-blue-50/40 border border-blue-200/80 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wide">
              Procedimentos com Baixa
            </span>
            <div className="mt-2">
              <p className="text-2xl font-black text-blue-950 tracking-tight">
                {summary?.costByProcedure?.length ?? 0}
                <span className="text-xs font-normal text-slate-500 ml-1">tipos</span>
              </p>
              <p className="text-[11px] text-blue-700 mt-0.5">
                Mapeados via evolução do prontuário
              </p>
            </div>
          </div>
        </div>

        {/* Gráficos: Evolução Temporal + Custo por Procedimento */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Gráfico 1: Evolução do Consumo de Insumos ao Longo do Tempo (Recharts AreaChart) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Evolução do Custo de Consumo (R$)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Despesa com insumos hospitalares e ambulatoriais ao longo dos dias.
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] text-emerald-800 bg-emerald-50">
                {period === '7d'
                  ? 'Últimos 7 dias'
                  : period === '30d'
                    ? 'Últimos 30 dias'
                    : 'Mês corrente'}
              </Badge>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={summary?.consumptionEvolution || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorConsumoCusto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="formattedDate"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickFormatter={(v) => `R$${v}`}
                  />
                  <RechartsTooltip
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Custo de Insumos']}
                    labelFormatter={(label) => `Data: ${label}`}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorConsumoCusto)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 2: Custo por Procedimento / Atendimento (Recharts BarChart) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-indigo-600" />
                  Custo de Insumos por Procedimento
                </h3>
                <p className="text-[11px] text-slate-400">
                  Identifica quais tipos de atendimentos demandam maior gasto de materiais.
                </p>
              </div>
            </div>

            <div className="h-56 w-full">
              {summary && summary.costByProcedure.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={summary.costByProcedure.slice(0, 5)}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="procedure"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={(t) => (t.length > 14 ? `${t.slice(0, 13)}…` : t)}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={(v) => `R$${v}`}
                    />
                    <RechartsTooltip
                      formatter={(value: any, name: any, item: any) => [
                        `${formatCurrency(Number(value))} (${item.payload.count} atendimentos)`,
                        'Custo Total',
                      ]}
                      labelFormatter={(label) => `Procedimento: ${label}`}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="totalCost" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <Package className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-600">
                    Nenhum procedimento registrado com insumos no período.
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                    Ao registrar atendimentos no Prontuário marcando insumos usados, os custos são
                    alocados automaticamente ao procedimento.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabelas de Detalhamento: Ranking dos Insumos Mais Consumidos & Matriz de Procedimentos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Tabela 1: Ranking dos Insumos Mais Consumidos */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-emerald-600" />
                  Ranking dos Insumos Mais Consumidos
                </h4>
                <p className="text-[11px] text-slate-500">
                  Ordenado pelo custo financeiro total consumido no período.
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] font-semibold">
                Top {summary?.topSupplies?.length ?? 0}
              </Badge>
            </div>

            <div className="overflow-x-auto">
              {summary && summary.topSupplies.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-2.5">Insumo</th>
                      <th className="p-2.5 text-center">Qtd Consumida</th>
                      <th className="p-2.5 text-right">Custo Unit.</th>
                      <th className="p-2.5 text-right">Custo Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary.topSupplies.slice(0, 6).map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-2.5">
                          <p className="font-bold text-slate-900 truncate max-w-[180px]">
                            {item.name}
                          </p>
                          {item.category && (
                            <span className="text-[10px] text-slate-400">{item.category}</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {item.quantity} {item.unit}
                          </span>
                        </td>
                        <td className="p-2.5 text-right text-slate-600 font-mono text-[11px]">
                          {formatCurrency(item.unitCost)}
                        </td>
                        <td className="p-2.5 text-right font-bold text-emerald-700 font-mono text-[11px]">
                          {formatCurrency(item.totalCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-8 text-center text-xs text-slate-400">
                  Nenhuma movimentação de saída registrada para o período selecionado.
                </p>
              )}
            </div>
          </div>

          {/* Tabela 2: Custo Médio e Detalhes por Procedimento */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-indigo-600" />
                  Detalhamento de Custo por Tipo de Atendimento
                </h4>
                <p className="text-[11px] text-slate-500">
                  Média de gasto de insumo alocada a cada procedimento realizado.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              {summary && summary.costByProcedure.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-2.5">Procedimento / Motivo</th>
                      <th className="p-2.5 text-center">Atendimentos</th>
                      <th className="p-2.5 text-right">Custo Médio</th>
                      <th className="p-2.5 text-right">Custo Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary.costByProcedure.slice(0, 6).map((proc, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-2.5">
                          <p className="font-bold text-slate-900 truncate max-w-[180px]">
                            {proc.procedure}
                          </p>
                        </td>
                        <td className="p-2.5 text-center font-semibold text-slate-700">
                          {proc.count}
                        </td>
                        <td className="p-2.5 text-right text-slate-600 font-mono text-[11px]">
                          {formatCurrency(proc.avgCost)}
                        </td>
                        <td className="p-2.5 text-right font-bold text-indigo-700 font-mono text-[11px]">
                          {formatCurrency(proc.totalCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                  <p>Sem atendimentos com insumos baixados no filtro atual.</p>
                  <p className="text-[11px] text-slate-400">
                    Dica: acesse o Prontuário para realizar evoluções e consumir materiais do
                    estoque.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
