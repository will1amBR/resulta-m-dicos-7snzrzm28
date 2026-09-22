import { useState, useEffect, useMemo } from 'react'
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  User,
  History,
  AlertCircle,
  RefreshCw,
  ClipboardCheck,
  ShieldCheck,
  DoorOpen,
  Bath,
  Coffee,
  CheckSquare,
} from 'lucide-react'
import {
  getCleaningChecklists,
  getOrCreateTodayChecklist,
  toggleChecklistItem,
  updateCleaningChecklist,
} from '@/services/cleaning'
import { CleaningChecklist, CleaningChecklistItem } from '@/types/clinical'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

export default function StaffLimpeza() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [shift, setShift] = useState<'manha' | 'tarde' | 'noite'>('manha')
  const [todayChecklist, setTodayChecklist] = useState<CleaningChecklist | null>(null)
  const [historyChecklists, setHistoryChecklists] = useState<CleaningChecklist[]>([])
  const [loading, setLoading] = useState(true)
  const [notesInput, setNotesInput] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [activeTab, setActiveTab] = useState<'rotina' | 'historico'>('rotina')

  const loadData = async (selectedShift = shift) => {
    setLoading(true)
    try {
      const [today, history] = await Promise.all([
        getOrCreateTodayChecklist(selectedShift),
        getCleaningChecklists(15),
      ])
      setTodayChecklist(today)
      setNotesInput(today.notes || '')
      setHistoryChecklists(history)
    } catch {
      toast({ title: 'Erro ao carregar rotina de limpeza', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(shift)
  }, [shift])

  // Agrupamento por ambiente
  const itemsByArea = useMemo(() => {
    if (!todayChecklist?.items) return {}
    const grouped: Record<string, { item: CleaningChecklistItem; originalIndex: number }[]> = {}
    todayChecklist.items.forEach((item, index) => {
      const area = item.area || 'Outros Ambientes'
      if (!grouped[area]) grouped[area] = []
      grouped[area].push({ item, originalIndex: index })
    })
    return grouped
  }, [todayChecklist])

  // Progresso
  const totalItems = todayChecklist?.items?.length || 0
  const completedItems = todayChecklist?.items?.filter((it) => it.done).length || 0
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  // Marcar/Desmarcar item
  const handleToggle = async (index: number) => {
    if (!todayChecklist) return
    try {
      const updated = await toggleChecklistItem(todayChecklist.id, index)
      setTodayChecklist(updated)
      toast({
        title: updated.items[index].done ? 'Item concluído ✓' : 'Item desmarcado',
        description: updated.items[index].task,
      })
    } catch {
      toast({ title: 'Erro ao atualizar item', variant: 'destructive' })
    }
  }

  // Salvar observações do turno
  const handleSaveNotes = async () => {
    if (!todayChecklist) return
    setSavingNotes(true)
    try {
      await updateCleaningChecklist(todayChecklist.id, {
        notes: notesInput,
      })
      toast({ title: 'Observações do turno salvas com sucesso!' })
    } catch {
      toast({ title: 'Erro ao salvar observações', variant: 'destructive' })
    } finally {
      setSavingNotes(false)
    }
  }

  // Concluir tudo do turno
  const handleCompleteAll = async () => {
    if (!todayChecklist) return
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const allDone = todayChecklist.items.map((it) => ({
      ...it,
      done: true,
      time: it.time || nowTime,
    }))
    try {
      const updated = await updateCleaningChecklist(todayChecklist.id, {
        items: allDone,
        status: 'concluido',
        notes: notesInput || 'Turno finalizado com todos os ambientes desinfetados.',
      })
      setTodayChecklist(updated)
      toast({
        title: 'Parabéns! Todos os ambientes foram concluídos!',
        description: 'Rotina de higienização finalizada com conformidade sanitária.',
      })
    } catch {
      toast({ title: 'Erro ao concluir checklist', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-teal-600" />
            Rotina de Higienização & Limpeza Clínica
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Checklist diário de consultórios, área de espera, banheiros e procedimentos para
            garantir as normas sanitárias da clínica.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={shift}
            onValueChange={(val) => setShift(val as 'manha' | 'tarde' | 'noite')}
          >
            <SelectTrigger className="w-36 h-9 text-xs bg-slate-50 font-semibold border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manha">☀️ Turno Manhã</SelectItem>
              <SelectItem value="tarde">🌤️ Turno Tarde</SelectItem>
              <SelectItem value="noite">🌙 Turno Noite</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(shift)}
            disabled={loading}
            className="text-xs h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Barra de Progresso e Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-subtle bg-gradient-to-br from-teal-50/60 to-white sm:col-span-2">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardCheck className="h-4 w-4 text-teal-600" />
                  Progresso do Turno (
                  {shift === 'manha' ? 'Manhã' : shift === 'tarde' ? 'Tarde' : 'Noite'})
                </span>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {completedItems} de {totalItems} tarefas concluídas
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-teal-700">{progressPercent}%</span>
              </div>
            </div>

            {/* Barra Visual */}
            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden mt-3">
              <div
                className="bg-teal-600 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">
              <span>Data: {new Date().toLocaleDateString('pt-BR')}</span>
              <span>
                Status:{' '}
                <strong
                  className={
                    todayChecklist?.status === 'concluido'
                      ? 'text-teal-700'
                      : todayChecklist?.status === 'em_andamento'
                        ? 'text-blue-700'
                        : 'text-amber-700'
                  }
                >
                  {todayChecklist?.status === 'concluido'
                    ? '100% Concluído ✓'
                    : todayChecklist?.status === 'em_andamento'
                      ? 'Em Andamento'
                      : 'Pendente'}
                </strong>
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-subtle">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Responsável
              </span>
              <div className="h-8 w-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <User className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="font-bold text-sm text-slate-900">
                {user?.name || 'Equipe de Higienização'}
              </p>
              <p className="text-xs text-slate-500">Perfil: Higienização & Apoio Clínico</p>
            </div>
            <div className="pt-2 border-t mt-2 flex items-center gap-1.5 text-[11px] text-teal-700 font-medium">
              <ShieldCheck className="h-4 w-4" /> Higienização hospitalar padronizada
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Rotina de Hoje vs Histórico dos Últimos Dias */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-subtle">
        <div className="border-b border-slate-200 px-4 pt-3 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('rotina')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'rotina'
                  ? 'border-teal-600 text-teal-800 bg-white rounded-t-md'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CheckSquare className="h-4 w-4" />
              Checklist de Hoje ({shift.toUpperCase()})
            </button>
            <button
              onClick={() => setActiveTab('historico')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'historico'
                  ? 'border-teal-600 text-teal-800 bg-white rounded-t-md'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="h-4 w-4" />
              Histórico dos Últimos Dias ({historyChecklists.length})
            </button>
          </div>

          {activeTab === 'rotina' && completedItems < totalItems && (
            <Button
              size="sm"
              onClick={handleCompleteAll}
              className="text-xs h-8 bg-teal-600 hover:bg-teal-700 text-white font-semibold gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Marcar Todos Concluídos
            </Button>
          )}
        </div>

        {/* TAB 1: CHECKLIST DE HOJE */}
        {activeTab === 'rotina' && (
          <div className="p-5 space-y-6">
            {Object.entries(itemsByArea).map(([area, items]) => {
              const allAreaDone = items.every((i) => i.item.done)
              return (
                <div key={area} className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      {area.toLowerCase().includes('banheiro') ? (
                        <Bath className="h-4 w-4 text-sky-600" />
                      ) : area.toLowerCase().includes('consultório') ? (
                        <DoorOpen className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Coffee className="h-4 w-4 text-amber-600" />
                      )}
                      {area}
                    </h3>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        allAreaDone
                          ? 'bg-teal-50 border-teal-200 text-teal-700 font-bold'
                          : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      {items.filter((i) => i.item.done).length} de {items.length} concluídos
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {items.map(({ item, originalIndex }) => (
                      <div
                        key={originalIndex}
                        onClick={() => handleToggle(originalIndex)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                          item.done
                            ? 'bg-teal-50/50 border-teal-200 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                        }`}
                      >
                        <button
                          type="button"
                          className="mt-0.5 shrink-0 focus:outline-none"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggle(originalIndex)
                          }}
                        >
                          {item.done ? (
                            <CheckCircle2 className="h-5 w-5 text-teal-600 fill-teal-100" />
                          ) : (
                            <Circle className="h-5 w-5 text-slate-300 hover:text-slate-400" />
                          )}
                        </button>

                        <div className="flex-1">
                          <p
                            className={`text-xs font-semibold ${
                              item.done ? 'text-teal-950 line-through opacity-85' : 'text-slate-800'
                            }`}
                          >
                            {item.task}
                          </p>
                          {item.time && (
                            <span className="text-[10px] text-teal-700 flex items-center gap-1 mt-1 font-medium">
                              <Clock className="h-3 w-3" /> Higienizado às {item.time}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Caixa de Observações do Turno */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-slate-500" />
                Observações, Ocorrências ou Reposições do Turno
              </label>
              <Textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Ex: Consultório 2 precisou de desinfecção extra após procedimento cirúrgico. Dispensers de sabonete do banheiro social repostos com novo refil..."
                className="text-xs"
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold h-8"
                >
                  {savingNotes ? 'Salvando...' : 'Salvar Observações'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HISTÓRICO DOS ÚLTIMOS DIAS */}
        {activeTab === 'historico' && (
          <div className="p-5 space-y-4">
            {historyChecklists.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                Nenhum checklist anterior arquivado.
              </p>
            ) : (
              <div className="space-y-3">
                {historyChecklists.map((h) => {
                  const dt = new Date(h.date || h.created || '')
                  const total = h.items?.length || 0
                  const doneCount = h.items?.filter((it) => it.done).length || 0
                  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0

                  return (
                    <div
                      key={h.id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            {dt.toLocaleDateString('pt-BR')} — Turno{' '}
                            {h.shift === 'manha'
                              ? 'Manhã'
                              : h.shift === 'tarde'
                                ? 'Tarde'
                                : 'Noite'}
                          </span>
                          <Badge
                            className={`text-[10px] ${
                              h.status === 'concluido'
                                ? 'bg-teal-600 text-white'
                                : 'bg-amber-500 text-white'
                            }`}
                          >
                            {percent}% Concluído
                          </Badge>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          Responsável: {h.expand?.staff?.name || 'Equipe Limpeza'}
                        </span>
                      </div>

                      {h.notes && (
                        <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/70">
                          <strong>Observações:</strong> {h.notes}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {h.items?.map((it, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              it.done
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-slate-200 text-slate-600 line-through opacity-70'
                            }`}
                          >
                            {it.area}: {it.task.slice(0, 30)}...
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
