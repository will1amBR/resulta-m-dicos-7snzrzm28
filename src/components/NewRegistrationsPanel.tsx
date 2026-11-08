import { useState, useEffect, useCallback } from 'react'
import {
  UserPlus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Award,
  CalendarDays,
  Hourglass,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getPendingCouncilDoctors,
  reviewCouncilRegistration,
  PendingCouncilDoctor,
} from '@/services/admin'

type ReviewAction = 'approve' | 'reject'

interface NewRegistrationsPanelProps {
  onCountChange?: (count: number) => void
}

export function NewRegistrationsPanel({ onCountChange }: NewRegistrationsPanelProps) {
  const { toast } = useToast()
  const [pending, setPending] = useState<PendingCouncilDoctor[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [reviewTarget, setReviewTarget] = useState<{
    user: PendingCouncilDoctor
    action: ReviewAction
  } | null>(null)
  const [justification, setJustification] = useState('')
  const [processing, setProcessing] = useState(false)

  const loadPending = useCallback(async () => {
    try {
      const list = await getPendingCouncilDoctors()
      setPending(list)
      onCountChange?.(list.length)
    } catch {
      // silencioso: mantém lista atual
    } finally {
      setLoading(false)
    }
  }, [onCountChange])

  useEffect(() => {
    loadPending()
  }, [loadPending])

  // Tempo real: um novo cadastro de médico (create/update em users) recarrega a lista
  useRealtime('users', () => {
    loadPending()
  })

  const openReview = (user: PendingCouncilDoctor, action: ReviewAction) => {
    setReviewTarget({ user, action })
    setJustification(action === 'approve' ? 'Registro profissional validado pela secretaria.' : '')
  }

  const closeReview = () => {
    if (processing) return
    setReviewTarget(null)
    setJustification('')
  }

  const confirmReview = async () => {
    if (!reviewTarget) return
    const { user, action } = reviewTarget

    if (action === 'reject' && justification.trim().length < 5) {
      toast({
        title: 'Justificativa obrigatória',
        description: 'Informe o motivo da rejeição (mínimo 5 caracteres).',
        variant: 'destructive',
      })
      return
    }

    setProcessing(true)
    setBusyId(user.id)
    try {
      await reviewCouncilRegistration(user.id, action, justification.trim() || undefined)

      toast({
        title:
          action === 'approve'
            ? 'Conselho aprovado com sucesso!'
            : 'Cadastro rejeitado com justificativa registrada.',
        description:
          action === 'approve'
            ? `${user.name} foi notificado(a) pelo sino no header.`
            : `${user.name} recebeu a justificativa e orientações para corrigir os dados.`,
      })

      setReviewTarget(null)
      setJustification('')
      setPending((prev) => {
        const next = prev.filter((u) => u.id !== user.id)
        onCountChange?.(next.length)
        return next
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao processar revisão',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
      loadPending()
    } finally {
      setProcessing(false)
      setBusyId(null)
    }
  }

  const registeredOn = (value?: string) =>
    value ? new Date(value).toLocaleDateString('pt-BR') : '—'

  return (
    <Card className="border-slate-200 shadow-subtle min-w-0 w-full">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div className="min-w-0 flex-1">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2 break-words">
            <UserPlus className="h-4 w-4 text-violet-600 shrink-0" />
            <span>Novos Cadastros Aguardando Aprovação ({pending.length})</span>
          </CardTitle>
          <CardDescription className="text-xs break-words">
            Médicos recém-cadastrados que aguardam a validação do conselho profissional pela
            clínica/secretaria. Aprovar libera o uso pleno; rejeitar exige justificativa e notifica
            o profissional.
          </CardDescription>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadPending}
          disabled={loading}
          className="h-8 text-xs shrink-0 self-start sm:self-auto w-full sm:w-auto justify-center"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-4 min-w-0">
        {/* Contador de pendentes em destaque */}
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-violet-200 bg-violet-50/70 p-3.5 min-w-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-violet-600 text-white shrink-0">
            <Hourglass className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-violet-700">
              Cadastros pendentes de validação
            </p>
            <p className="text-2xl font-black leading-tight text-violet-900">{pending.length}</p>
          </div>
          <Badge className="bg-violet-100 text-violet-800 hover:bg-violet-100 text-[10px] shrink-0">
            Atualização em tempo real
          </Badge>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 min-w-0">
            <div className="h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center min-w-0">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2 shrink-0" />
            <p className="text-sm font-semibold text-slate-700">
              Nenhum novo cadastro aguardando aprovação!
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Quando um médico se cadastrar, ele aparecerá aqui automaticamente (tempo real).
            </p>
          </div>
        ) : (
          <div className="space-y-3 min-w-0">
            {pending.map((u) => (
              <div
                key={u.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4 space-y-3 hover:border-slate-300 transition-all min-w-0"
              >
                {/* Cabeçalho do card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5 min-w-0">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                      <UserPlus className="h-5 w-5 text-violet-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 break-words">{u.name}</h4>
                        <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-[10px] shrink-0">
                          Aguardando validação
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 break-words min-w-0">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="break-all">{u.email}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 sm:text-right shrink-0 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Cadastrado em
                    </span>
                    <span className="font-semibold text-slate-800 inline-flex items-center gap-1 break-words">
                      <CalendarDays className="h-3 w-3 shrink-0" />
                      {registeredOn(u.created)}
                    </span>
                  </div>
                </div>

                {/* Dados do conselho */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                  {u.council_type && (
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {u.council_type}
                    </Badge>
                  )}
                  {(u.council_number || u.crm) && (
                    <span className="text-[11px] text-slate-600 font-medium inline-flex items-center gap-1 break-words">
                      <Award className="h-3 w-3 shrink-0" />
                      Nº registro: {u.council_number || u.crm}
                    </span>
                  )}
                  {(u.expand?.specialty?.name || u.specialty) && (
                    <span className="text-[11px] text-slate-500 break-words">
                      | Especialidade: {u.expand?.specialty?.name || u.specialty}
                    </span>
                  )}
                </div>

                {/* Ações */}
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1 border-t border-slate-200/60 min-w-0">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === u.id || processing}
                    onClick={() => openReview(u, 'reject')}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-8 w-full sm:w-auto justify-center"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1 shrink-0" /> Rejeitar
                  </Button>

                  <Button
                    size="sm"
                    disabled={busyId === u.id || processing}
                    onClick={() => openReview(u, 'approve')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8 w-full sm:w-auto justify-center"
                  >
                    {busyId === u.id ? (
                      'Processando...'
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1 shrink-0" /> Aprovar conselho
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Modal de confirmação (aprovar/rejeitar) */}
      <Dialog
        open={!!reviewTarget}
        onOpenChange={(open) => {
          if (!open) closeReview()
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-4 sm:p-6 overflow-hidden">
          <DialogHeader className="min-w-0">
            <DialogTitle className="flex items-center gap-2 text-slate-900 text-base break-words">
              {reviewTarget?.action === 'approve' ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>Aprovar Conselho Profissional</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                  <span>Rejeitar Cadastro do Conselho</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs break-words">
              Profissional: <strong>{reviewTarget?.user.name}</strong>
              {reviewTarget?.user.council_type
                ? ` — ${reviewTarget.user.council_type} ${reviewTarget.user.council_number || reviewTarget.user.crm || ''}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs min-w-0">
            {reviewTarget?.action === 'approve' ? (
              <div className="flex items-start gap-2 p-3 rounded-lg border border-emerald-200 bg-emerald-50/80 text-emerald-900 min-w-0">
                <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="break-words">
                  O cadastro será validado e o médico receberá uma notificação in-app confirmando a
                  aprovação do conselho.
                </span>
              </div>
            ) : (
              <div className="space-y-1.5 min-w-0">
                <Label className="text-xs font-semibold text-slate-700 break-words">
                  Justificativa da rejeição <span className="text-red-500">* (Obrigatória)</span>
                </Label>
                <Textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Ex: Número de registro não confere com a base do conselho. Corrija os dados em Configurações e recadastre."
                  className="text-xs w-full min-w-0"
                  rows={3}
                />
                <p className="text-[11px] text-slate-500 break-words">
                  O médico receberá esta justificativa por notificação in-app, com orientação para
                  corrigir os dados em Configurações.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={closeReview}
              disabled={processing}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={confirmReview}
              disabled={processing}
              className={`w-full sm:w-auto font-semibold ${
                reviewTarget?.action === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {processing
                ? 'Processando...'
                : reviewTarget?.action === 'approve'
                  ? 'Confirmar Aprovação'
                  : 'Confirmar Rejeição'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
