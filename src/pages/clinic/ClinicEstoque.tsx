import { useState, useEffect, useMemo } from 'react'
import {
  Boxes,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  PackageCheck,
  History,
  TrendingDown,
  Layers,
  MapPin,
  Tag,
  CheckCircle2,
} from 'lucide-react'
import {
  getClinicSupplies,
  getSupplyMovements,
  registerSupplyMovement,
  createClinicSupply,
  updateClinicSupply,
  RegisterMovementParams,
} from '@/services/supplies'
import { ClinicSupply, ClinicSupplyMovement, SupplyMovementType } from '@/types/clinical'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
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
import { useAuth } from '@/hooks/use-auth'

export default function ClinicEstoque() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [supplies, setSupplies] = useState<ClinicSupply[]>([])
  const [movements, setMovements] = useState<ClinicSupplyMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'baixo' | 'normal'>('todos')
  const [activeTab, setActiveTab] = useState<'insumos' | 'movimentacoes'>('insumos')

  // Modais
  const [movementModalOpen, setMovementModalOpen] = useState(false)
  const [selectedSupplyForMovement, setSelectedSupplyForMovement] = useState<ClinicSupply | null>(
    null,
  )
  const [movementType, setMovementType] = useState<SupplyMovementType>('entrada')
  const [movementQty, setMovementQty] = useState<number>(10)
  const [movementReason, setMovementReason] = useState('')
  const [movementBatch, setMovementBatch] = useState('')
  const [submittingMovement, setSubmittingMovement] = useState(false)

  // Modal Novo Insumo
  const [newSupplyModalOpen, setNewSupplyModalOpen] = useState(false)
  const [newSupplyName, setNewSupplyName] = useState('')
  const [newSupplyCategory, setNewSupplyCategory] = useState('')
  const [newSupplyQty, setNewSupplyQty] = useState<number>(50)
  const [newSupplyMinQty, setNewSupplyMinQty] = useState<number>(20)
  const [newSupplyUnit, setNewSupplyUnit] = useState('un')
  const [newSupplyLocation, setNewSupplyLocation] = useState('')
  const [newSupplyCost, setNewSupplyCost] = useState<number>(0)
  const [submittingNewSupply, setSubmittingNewSupply] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [suppliesList, movementsList] = await Promise.all([
        getClinicSupplies(),
        getSupplyMovements(undefined, 60),
      ])
      setSupplies(suppliesList)
      setMovements(movementsList)
    } catch {
      toast({ title: 'Erro ao carregar insumos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Categorias únicas
  const categories = useMemo(() => {
    const set = new Set<string>()
    supplies.forEach((s) => {
      if (s.category) set.add(s.category)
    })
    return Array.from(set)
  }, [supplies])

  // Métricas
  const totalItems = supplies.length
  const lowStockItems = useMemo(
    () => supplies.filter((s) => s.quantity <= s.min_quantity),
    [supplies],
  )
  const totalStockUnits = useMemo(
    () => supplies.reduce((acc, s) => acc + (s.quantity || 0), 0),
    [supplies],
  )

  // Filtragem
  const filteredSupplies = useMemo(() => {
    return supplies.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.location && s.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.category && s.category.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = categoryFilter === 'todos' || s.category === categoryFilter
      const isLow = s.quantity <= s.min_quantity
      const matchesStatus =
        statusFilter === 'todos' ||
        (statusFilter === 'baixo' && isLow) ||
        (statusFilter === 'normal' && !isLow)
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [supplies, searchTerm, categoryFilter, statusFilter])

  // Abrir modal de movimentação rápida
  const handleOpenMovementModal = (
    supply: ClinicSupply,
    defaultType: SupplyMovementType = 'entrada',
  ) => {
    setSelectedSupplyForMovement(supply)
    setMovementType(defaultType)
    setMovementQty(defaultType === 'entrada' ? 20 : 1)
    setMovementReason(
      defaultType === 'entrada' ? 'Reposição de lote quinzenal' : 'Baixa por uso em atendimento',
    )
    setMovementBatch('')
    setMovementModalOpen(true)
  }

  // Submeter movimentação
  const handleSaveMovement = async () => {
    if (!selectedSupplyForMovement || movementQty <= 0) {
      toast({ title: 'Quantidade inválida', variant: 'destructive' })
      return
    }
    setSubmittingMovement(true)
    try {
      await registerSupplyMovement({
        supplyId: selectedSupplyForMovement.id,
        type: movementType,
        quantity: movementQty,
        reason:
          movementReason ||
          (movementType === 'entrada' ? 'Reposição de estoque' : 'Baixa operacional'),
        batchNumber: movementBatch,
        userId: user?.id,
      })

      toast({
        title:
          movementType === 'entrada'
            ? 'Estoque reposto com sucesso!'
            : 'Baixa realizada com sucesso!',
        description: `${movementQty} ${selectedSupplyForMovement.unit} movimentados em "${selectedSupplyForMovement.name}".`,
      })
      setMovementModalOpen(false)
      loadData()
    } catch {
      toast({ title: 'Erro ao registrar movimentação', variant: 'destructive' })
    } finally {
      setSubmittingMovement(false)
    }
  }

  // Cadastrar novo insumo
  const handleCreateSupply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSupplyName.trim()) {
      toast({ title: 'Nome do insumo obrigatório', variant: 'destructive' })
      return
    }
    setSubmittingNewSupply(true)
    try {
      await createClinicSupply({
        name: newSupplyName.trim(),
        category: newSupplyCategory.trim() || 'Geral',
        quantity: Number(newSupplyQty),
        min_quantity: Number(newSupplyMinQty),
        unit: newSupplyUnit.trim() || 'un',
        location: newSupplyLocation.trim(),
        cost_price: Number(newSupplyCost),
      })
      toast({ title: 'Insumo cadastrado com sucesso!' })
      setNewSupplyModalOpen(false)
      setNewSupplyName('')
      setNewSupplyCategory('')
      setNewSupplyLocation('')
      loadData()
    } catch {
      toast({ title: 'Erro ao cadastrar insumo', variant: 'destructive' })
    } finally {
      setSubmittingNewSupply(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header com Ações */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="h-6 w-6 text-emerald-600" />
            Controle de Insumos & Estoque Clínico
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerenciamento de materiais, luvas, descartáveis, controle de consumo em procedimentos e
            reposição de lotes com alertas visuais.
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

          <Button
            size="sm"
            onClick={() => setNewSupplyModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 gap-1.5"
          >
            <Plus className="h-4 w-4" /> Novo Insumo
          </Button>
        </div>
      </div>

      {/* Cards de Métricas e Alertas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-subtle">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total de Insumos
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalItems}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {totalStockUnits} unidades físicas cadastradas
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`shadow-subtle border ${
            lowStockItems.length > 0
              ? 'border-amber-300 bg-amber-50/50'
              : 'border-slate-200 bg-white'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-amber-900 uppercase tracking-wider">
                  Estoque Baixo (Reposição)
                </p>
                {lowStockItems.length > 0 && (
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </div>
              <p className="text-2xl font-bold text-amber-950 mt-1">{lowStockItems.length}</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                {lowStockItems.length > 0
                  ? 'Itens abaixo da quantidade mínima estipulada'
                  : 'Nenhum insumo em nível crítico'}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center font-bold">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-subtle">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Movimentações Recentes
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{movements.length}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Entradas, baixas e saídas registradas
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <History className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerta Visual de Insumos Críticos */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-amber-950">
                Atenção: {lowStockItems.length} insumo(s) necessitam de reposição imediata!
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Itens com estoque abaixo do mínimo:{' '}
                <strong>
                  {lowStockItems
                    .map((i) => i.name)
                    .slice(0, 3)
                    .join(', ')}
                </strong>
                {lowStockItems.length > 3 && ` e mais ${lowStockItems.length - 3}...`}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setStatusFilter('baixo')
              setActiveTab('insumos')
            }}
            className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold self-start md:self-auto shrink-0"
          >
            Filtrar Estoque Baixo
          </Button>
        </div>
      )}

      {/* Tabs: Insumos vs Histórico de Movimentações */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-subtle">
        <div className="border-b border-slate-200 px-4 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('insumos')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'insumos'
                  ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-md'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <PackageCheck className="h-4 w-4" />
              Insumos Cadastrados ({supplies.length})
            </button>
            <button
              onClick={() => setActiveTab('movimentacoes')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'movimentacoes'
                  ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-md'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="h-4 w-4" />
              Histórico de Entradas & Saídas ({movements.length})
            </button>
          </div>

          {activeTab === 'insumos' && (
            <div className="flex flex-wrap items-center gap-2 pb-2 sm:pb-0">
              <div className="relative w-48 sm:w-60">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Buscar insumo ou local..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-xs bg-white"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-8 text-xs w-36 bg-white">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas Categorias</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as 'todos' | 'baixo' | 'normal')}
              >
                <SelectTrigger className="h-8 text-xs w-32 bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Níveis</SelectItem>
                  <SelectItem value="baixo">⚠️ Baixo Estoque</SelectItem>
                  <SelectItem value="normal">✓ Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Conteúdo da Aba Insumos */}
        {activeTab === 'insumos' && (
          <div className="overflow-x-auto">
            {filteredSupplies.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                <Boxes className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                Nenhum insumo encontrado para os filtros selecionados.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">Insumo / Material</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3 text-center">Quantidade Atual</th>
                    <th className="p-3 text-center">Mínimo Recomendado</th>
                    <th className="p-3">Localização</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Ações de Estoque</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSupplies.map((supply) => {
                    const isLow = supply.quantity <= supply.min_quantity
                    const percent =
                      supply.min_quantity > 0
                        ? Math.min(100, Math.round((supply.quantity / supply.min_quantity) * 100))
                        : 100

                    return (
                      <tr
                        key={supply.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isLow ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{supply.name}</p>
                          {supply.cost_price ? (
                            <p className="text-[10px] text-slate-400">
                              Custo ref: R$ {supply.cost_price.toFixed(2)} / {supply.unit}
                            </p>
                          ) : null}
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className="text-[10px] font-medium">
                            {supply.category || 'Geral'}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`font-black text-sm px-2.5 py-1 rounded-md ${
                              isLow
                                ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                                : 'bg-slate-100 text-slate-800 font-bold'
                            }`}
                          >
                            {supply.quantity} {supply.unit}
                          </span>
                        </td>
                        <td className="p-3 text-center text-slate-500 font-medium">
                          {supply.min_quantity} {supply.unit}
                        </td>
                        <td className="p-3 text-slate-600">
                          {supply.location ? (
                            <span className="flex items-center gap-1 text-[11px]">
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                              {supply.location}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {isLow ? (
                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] gap-1">
                              <AlertTriangle className="h-3 w-3" /> Baixo
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[10px] gap-1"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Normal
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenMovementModal(supply, 'entrada')}
                              className="h-7 text-[11px] px-2.5 border-emerald-300 text-emerald-800 bg-emerald-50/50 hover:bg-emerald-100 gap-1 font-semibold"
                            >
                              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                              Repor
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenMovementModal(supply, 'saida_atendimento')}
                              className="h-7 text-[11px] px-2.5 border-rose-200 text-rose-800 bg-rose-50/50 hover:bg-rose-100 gap-1 font-semibold"
                            >
                              <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" />
                              Dar Baixa
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Conteúdo da Aba Histórico de Movimentações */}
        {activeTab === 'movimentacoes' && (
          <div className="overflow-x-auto">
            {movements.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                Nenhuma movimentação registrada no histórico.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">Data & Hora</th>
                    <th className="p-3">Tipo de Operação</th>
                    <th className="p-3">Insumo</th>
                    <th className="p-3 text-center">Quantidade</th>
                    <th className="p-3">Motivo / Justificativa</th>
                    <th className="p-3">Responsável</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((mov) => {
                    const isEntrada = mov.type === 'entrada'
                    const dateStr = mov.date || mov.created
                    const dt = dateStr ? new Date(dateStr) : new Date()

                    return (
                      <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 text-slate-600 whitespace-nowrap">
                          {dt.toLocaleDateString('pt-BR')} às{' '}
                          {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3">
                          {isEntrada ? (
                            <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                              <ArrowUpRight className="h-3 w-3" /> Entrada / Reposição
                            </Badge>
                          ) : mov.type === 'saida_atendimento' ? (
                            <Badge className="bg-blue-600 text-white text-[10px] gap-1">
                              <ArrowDownRight className="h-3 w-3" /> Consumo em Atendimento
                            </Badge>
                          ) : mov.type === 'descarte' ? (
                            <Badge className="bg-rose-600 text-white text-[10px] gap-1">
                              Descarte / Vencido
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">
                              Ajuste de Saldo
                            </Badge>
                          )}
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900">
                            {mov.expand?.supply?.name || 'Insumo'}
                          </p>
                          {mov.batch_number && (
                            <p className="text-[10px] text-slate-400">Lote: {mov.batch_number}</p>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`font-black text-xs ${
                              isEntrada ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {isEntrada ? '+' : '-'}
                            {mov.quantity} {mov.expand?.supply?.unit || 'un'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700 max-w-xs truncate">
                          {mov.reason || '—'}
                          {mov.expand?.patient?.name && (
                            <span className="block text-[10px] text-blue-600">
                              Paciente: {mov.expand.patient.name}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500 text-[11px]">
                          {mov.expand?.user?.name || user?.name || 'Sistema'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE MOVIMENTAÇÃO / REPOSIÇÃO RÁPIDA */}
      {selectedSupplyForMovement && (
        <Dialog open={movementModalOpen} onOpenChange={setMovementModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900 text-base">
                {movementType === 'entrada' ? (
                  <>
                    <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                    Registrar Entrada / Reposição de Lote
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-5 w-5 text-rose-600" />
                    Registrar Baixa de Insumo
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Insumo: <strong>{selectedSupplyForMovement.name}</strong> (Estoque atual:{' '}
                {selectedSupplyForMovement.quantity} {selectedSupplyForMovement.unit})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Tipo de Movimento</Label>
                <Select
                  value={movementType}
                  onValueChange={(v) => setMovementType(v as SupplyMovementType)}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada / Reposição de Fornecedor</SelectItem>
                    <SelectItem value="saida_atendimento">Saída por Atendimento Médico</SelectItem>
                    <SelectItem value="descarte">Descarte / Vencimento / Avaria</SelectItem>
                    <SelectItem value="ajuste">Ajuste de Inventário Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Quantidade ({selectedSupplyForMovement.unit}){' '}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={movementQty}
                    onChange={(e) => setMovementQty(Math.max(1, parseInt(e.target.value) || 0))}
                    className="text-xs h-9 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Número do Lote</Label>
                  <Input
                    placeholder="Ex: LT-2025/08"
                    value={movementBatch}
                    onChange={(e) => setMovementBatch(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Motivo / Observações</Label>
                <Textarea
                  placeholder="Ex: Reposição semanal de materiais, NF 4910..."
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="text-xs"
                  rows={2}
                />
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 text-[11px] flex justify-between items-center">
                <span>Novo saldo projetado:</span>
                <span className="font-bold text-slate-900 text-xs">
                  {movementType === 'entrada'
                    ? selectedSupplyForMovement.quantity + movementQty
                    : Math.max(0, selectedSupplyForMovement.quantity - movementQty)}{' '}
                  {selectedSupplyForMovement.unit}
                </span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMovementModalOpen(false)}
                disabled={submittingMovement}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveMovement}
                disabled={submittingMovement || movementQty <= 0}
                className={
                  movementType === 'entrada'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold'
                    : 'bg-rose-600 hover:bg-rose-700 text-white font-semibold'
                }
              >
                {submittingMovement ? 'Salvando...' : 'Confirmar Movimentação'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL NOVO INSUMO */}
      <Dialog open={newSupplyModalOpen} onOpenChange={setNewSupplyModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 text-base">
              <Plus className="h-5 w-5 text-emerald-600" />
              Cadastrar Novo Insumo na Clínica
            </DialogTitle>
            <DialogDescription className="text-xs">
              Adicione novos materiais de consultório, curativos ou EPIs para controle de estoque.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSupply} className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Nome do Insumo <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Ex: Luvas de Látex M (cx 100un), Seringa 10ml..."
                value={newSupplyName}
                onChange={(e) => setNewSupplyName(e.target.value)}
                className="text-xs h-9"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Categoria</Label>
                <Input
                  placeholder="Ex: EPI, Descartáveis, Curativos..."
                  value={newSupplyCategory}
                  onChange={(e) => setNewSupplyCategory(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Unidade de Medida</Label>
                <Select value={newSupplyUnit} onValueChange={setNewSupplyUnit}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="un">un (unidade)</SelectItem>
                    <SelectItem value="cx">cx (caixa)</SelectItem>
                    <SelectItem value="pct">pct (pacote)</SelectItem>
                    <SelectItem value="frasco">frasco</SelectItem>
                    <SelectItem value="rolo">rolo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Quantidade Inicial</Label>
                <Input
                  type="number"
                  min="0"
                  value={newSupplyQty}
                  onChange={(e) => setNewSupplyQty(parseInt(e.target.value) || 0)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Estoque Mínimo (Alerta)
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={newSupplyMinQty}
                  onChange={(e) => setNewSupplyMinQty(parseInt(e.target.value) || 1)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Local de Armazenagem</Label>
                <Input
                  placeholder="Ex: Armário A2, Sala 1..."
                  value={newSupplyLocation}
                  onChange={(e) => setNewSupplyLocation(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Preço de Custo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newSupplyCost}
                  onChange={(e) => setNewSupplyCost(parseFloat(e.target.value) || 0)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNewSupplyModalOpen(false)}
                disabled={submittingNewSupply}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submittingNewSupply || !newSupplyName.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {submittingNewSupply ? 'Cadastrando...' : 'Salvar Insumo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
