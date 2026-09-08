import { useState, useEffect } from 'react'
import {
  TrendingUp,
  Activity,
  Plus,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { useToast } from '@/hooks/use-toast'
import { LabResult } from '@/types/clinical'
import { getPatientLabResults, createLabResult } from '@/services/lab_results'

interface LabResultsEvolutionProps {
  patientId: string
  patientName?: string
  readOnly?: boolean
}

export function LabResultsEvolution({
  patientId,
  patientName,
  readOnly = false,
}: LabResultsEvolutionProps) {
  const { toast } = useToast()
  const [labs, setLabs] = useState<LabResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMarker, setSelectedMarker] = useState<string>('creatinina')

  // Modal Novo Marcador
  const [modalOpen, setModalOpen] = useState(false)
  const [markerName, setMarkerName] = useState('Creatinina Sérica')
  const [markerCode, setMarkerCode] = useState('creatinina')
  const [markerVal, setMarkerVal] = useState('')
  const [markerUnit, setMarkerUnit] = useState('mg/dL')
  const [markerRef, setMarkerRef] = useState('0.70 - 1.20')
  const [markerDate, setMarkerDate] = useState(new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadLabs = async () => {
    if (!patientId) return
    setLoading(true)
    try {
      const items = await getPatientLabResults(patientId)
      setLabs(items)
      // Se não houver creatinina, selecionar o primeiro marcador existente
      if (items.length > 0) {
        const codes = Array.from(new Set(items.map((i) => i.marker_code)))
        if (!codes.includes('creatinina') && codes[0]) {
          setSelectedMarker(codes[0])
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLabs()
  }, [patientId])

  // Lista única de marcadores cadastrados
  const availableMarkers = Array.from(
    new Map(labs.map((item) => [item.marker_code, item.marker_name])).entries(),
  ).map(([code, name]) => ({ code, name }))

  // Se a lista estiver vazia, defaults para seleção
  const markerOptions =
    availableMarkers.length > 0
      ? availableMarkers
      : [
          { code: 'creatinina', name: 'Creatinina Sérica' },
          { code: 'hemoglobina', name: 'Hemoglobina' },
          { code: 'tsh', name: 'TSH Ultra Sensível' },
          { code: 'glicemia', name: 'Glicemia de Jejum' },
          { code: 'colesterol_total', name: 'Colesterol Total' },
        ]

  // Filtrar dados do marcador selecionado para o gráfico
  const markerHistory = labs
    .filter((l) => l.marker_code === selectedMarker)
    .sort((a, b) => new Date(a.collected_at).getTime() - new Date(b.collected_at).getTime())

  const chartData = markerHistory.map((item) => ({
    date: new Date(item.collected_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    }),
    valor: item.value,
    unit: item.unit,
    ref: item.reference_range,
    abnormal: item.is_abnormal,
    source: item.source_document_name,
  }))

  const latestVal = markerHistory[markerHistory.length - 1]
  const prevVal = markerHistory[markerHistory.length - 2]
  const diff = latestVal && prevVal ? latestVal.value - prevVal.value : 0

  // Salvar novo marcador manual
  const handleSaveMarker = async () => {
    if (!markerVal || isNaN(parseFloat(markerVal))) {
      toast({
        title: 'Valor inválido',
        description: 'Informe um valor numérico para o marcador.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      await createLabResult({
        patientId,
        markerName,
        markerCode,
        value: parseFloat(markerVal),
        unit: markerUnit,
        referenceRange: markerRef,
        isAbnormal: false,
        collectedAt: new Date(markerDate).toISOString(),
        sourceDocumentName: 'Lançamento Manual do Prontuário',
      })
      toast({
        title: 'Marcador adicionado!',
        description: `${markerName}: ${markerVal} ${markerUnit} registrado na evolução.`,
      })
      setModalOpen(false)
      setMarkerVal('')
      loadLabs()
    } catch {
      toast({ title: 'Erro ao salvar marcador', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-slate-200 shadow-subtle overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <Activity className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Evolução Temporal de Marcadores Laboratoriais (Exames)
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Curvas evolutivas extraídas de laudos/OCR para monitoramento contínuo da saúde de{' '}
              {patientName || 'Paciente'}.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Select value={selectedMarker} onValueChange={setSelectedMarker}>
              <SelectTrigger className="h-8 text-xs w-44 bg-white">
                <SelectValue placeholder="Selecione o marcador" />
              </SelectTrigger>
              <SelectContent>
                {markerOptions.map((opt) => (
                  <SelectItem key={opt.code} value={opt.code}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {!readOnly && (
              <Button
                size="sm"
                onClick={() => setModalOpen(true)}
                className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Lançar Marcador
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Resumo do Marcador Selecionado */}
        {latestVal && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-teal-50/50 border border-teal-200 text-xs">
            <div>
              <span className="text-[10px] text-teal-800 font-medium block uppercase">
                Último Valor Registrado
              </span>
              <p className="text-base font-extrabold text-slate-900">
                {latestVal.value}{' '}
                <span className="text-xs font-normal text-slate-600">{latestVal.unit}</span>
              </p>
            </div>
            <div>
              <span className="text-[10px] text-teal-800 font-medium block uppercase">
                Faixa de Referência
              </span>
              <p className="text-xs font-bold text-slate-800 font-mono">
                {latestVal.reference_range || 'Padrão laboratorial'}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-teal-800 font-medium block uppercase">
                Variação Anterior
              </span>
              <p
                className={`text-xs font-bold ${
                  diff > 0 ? 'text-amber-600' : diff < 0 ? 'text-emerald-600' : 'text-slate-600'
                }`}
              >
                {diff > 0 ? `+${diff.toFixed(2)}` : diff < 0 ? diff.toFixed(2) : 'Estável'}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-teal-800 font-medium block uppercase">
                Data do Exame
              </span>
              <p className="text-xs font-semibold text-slate-700">
                {new Date(latestVal.collected_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        )}

        {/* Gráfico Recharts */}
        <div className="h-60 w-full pt-2">
          {chartData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
              <FileSpreadsheet className="h-8 w-8 mb-2 opacity-50 text-teal-500" />
              Nenhum resultado registrado para este marcador.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-lg space-y-1">
                          <p className="font-bold">{label}</p>
                          <p className="text-teal-300 font-mono text-sm">
                            Valor: {data.valor} {data.unit}
                          </p>
                          {data.ref && (
                            <p className="text-[10px] text-slate-300">Ref: {data.ref}</p>
                          )}
                          {data.source && (
                            <p className="text-[10px] text-slate-400 italic">
                              Fonte: {data.source}
                            </p>
                          )}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0d9488', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#0f766e' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tabela dos pontos */}
        {markerHistory.length > 0 && (
          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-2.5">Data Coleta</th>
                  <th className="p-2.5">Valor Numérico</th>
                  <th className="p-2.5">Referência</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Origem / Laudo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {markerHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="p-2.5 font-medium text-slate-900">
                      {new Date(item.collected_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-2.5 font-bold font-mono text-teal-800">
                      {item.value} {item.unit}
                    </td>
                    <td className="p-2.5 text-slate-500 font-mono">
                      {item.reference_range || '-'}
                    </td>
                    <td className="p-2.5">
                      {item.is_abnormal ? (
                        <Badge className="bg-rose-100 text-rose-800 text-[10px]">Alterado</Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                          Normal
                        </Badge>
                      )}
                    </td>
                    <td className="p-2.5 text-slate-500 text-[11px] truncate max-w-xs">
                      {item.source_document_name || 'Laudo'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Modal para adicionar novo marcador manual */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Lançar Marcador Laboratorial
            </DialogTitle>
            <DialogDescription className="text-xs">
              Adicione valores de exames para alimentar a série temporal e a curva de evolução.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Marcador / Exame</Label>
              <Select
                value={markerCode}
                onValueChange={(code) => {
                  setMarkerCode(code)
                  if (code === 'creatinina') {
                    setMarkerName('Creatinina Sérica')
                    setMarkerUnit('mg/dL')
                    setMarkerRef('0.70 - 1.20')
                  } else if (code === 'hemoglobina') {
                    setMarkerName('Hemoglobina')
                    setMarkerUnit('g/dL')
                    setMarkerRef('13.5 - 17.5')
                  } else if (code === 'tsh') {
                    setMarkerName('TSH Ultra Sensível')
                    setMarkerUnit('mcUI/mL')
                    setMarkerRef('0.40 - 4.50')
                  } else if (code === 'glicemia') {
                    setMarkerName('Glicemia de Jejum')
                    setMarkerUnit('mg/dL')
                    setMarkerRef('70 - 99')
                  } else if (code === 'colesterol_total') {
                    setMarkerName('Colesterol Total')
                    setMarkerUnit('mg/dL')
                    setMarkerRef('< 190')
                  }
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Selecione o marcador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="creatinina">Creatinina Sérica</SelectItem>
                  <SelectItem value="hemoglobina">Hemoglobina</SelectItem>
                  <SelectItem value="tsh">TSH Ultra Sensível</SelectItem>
                  <SelectItem value="glicemia">Glicemia de Jejum</SelectItem>
                  <SelectItem value="colesterol_total">Colesterol Total</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Valor Numérico</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 1.05"
                  value={markerVal}
                  onChange={(e) => setMarkerVal(e.target.value)}
                  className="h-9 text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Unidade</Label>
                <Input
                  value={markerUnit}
                  onChange={(e) => setMarkerUnit(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Data de Coleta</Label>
                <Input
                  type="date"
                  value={markerDate}
                  onChange={(e) => setMarkerDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Faixa de Referência</Label>
                <Input
                  value={markerRef}
                  onChange={(e) => setMarkerRef(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveMarker}
              disabled={isSubmitting || !markerVal}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar no Prontuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
