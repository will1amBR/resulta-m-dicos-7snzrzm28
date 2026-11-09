import { useEffect, useState } from 'react'
import { ShieldAlert, CheckCircle2, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'

interface CouncilPendingBannerProps {
  userId?: string
  initialApproved?: boolean
  /** Recarrega o estado direto do servidor (fallback fora do realtime) */
  onApprovedChange?: (approved: boolean) => void
}

/**
 * Banner "Conselho profissional em validação" — dashboard do médico.
 * Mostra status 🟡 ("Conselho profissional em validação") quando council_approved for false,
 * e alterna temporariamente para 🟢 quando aprovado (ou pode ser recolhido).
 * Atualiza em tempo real via PocketBase realtime na coleção users.
 */
export function CouncilPendingBanner({
  userId,
  initialApproved,
  onApprovedChange,
}: CouncilPendingBannerProps) {
  const [approved, setApproved] = useState<boolean | null>(
    typeof initialApproved === 'boolean' ? initialApproved : null,
  )
  const [justApproved, setJustApproved] = useState(false)
  const [dismissedApproved, setDismissedApproved] = useState(false)

  // Estado inicial + polling leve de segurança (fallback se realtime falhar)
  useEffect(() => {
    if (!userId) return
    let isMounted = true
    const load = () => {
      pb.collection('users')
        .getOne(userId)
        .then((rec: any) => {
          if (!isMounted) return
          const isAppr = !!rec.council_approved
          setApproved((prev) => {
            if (prev === false && isAppr) {
              setJustApproved(true)
            }
            return isAppr
          })
          onApprovedChange?.(isAppr)
        })
        .catch(() => {})
    }
    load()
    const interval = setInterval(load, 25000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [userId, onApprovedChange])

  // Tempo real: qualquer update em users (incluindo aprovação) reavalia
  useEffect(() => {
    let unsub: (() => Promise<void>) | undefined
    let cancelled = false

    if (!userId) return
    pb.collection('users')
      .subscribe('*', (e: any) => {
        if (e?.record?.id !== userId) return
        const nowApproved = !!e.record.council_approved
        setApproved((prev) => {
          if (prev === false && nowApproved) {
            setJustApproved(true)
          }
          return nowApproved
        })
        onApprovedChange?.(nowApproved)
      })
      .then((fn) => {
        if (cancelled) fn().catch(() => {})
        else unsub = fn
      })
      .catch(() => {})

    return () => {
      cancelled = true
      if (unsub) unsub().catch(() => {})
    }
  }, [userId])

  // Se aprovado acabou de acontecer, exibe feedback visual verde
  if (justApproved && !dismissedApproved) {
    return (
      <div className="w-full min-w-0 rounded-xl border border-emerald-300 bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <h3 className="font-bold text-sm text-emerald-950 break-words">
                  Conselho profissional aprovado! 🟢
                </h3>
                <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] shrink-0">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Aprovado & Ativo
                </Badge>
              </div>
              <p className="text-xs text-emerald-900/90 mt-0.5 break-words leading-relaxed">
                Seu registro profissional foi validado pela clínica/secretaria. A emissão de
                receitas, laudos e atestados agora opera com validação plena.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-emerald-300 text-emerald-900 hover:bg-emerald-100 bg-white w-full sm:w-auto justify-center"
              onClick={() => setDismissedApproved(true)}
            >
              Fechar aviso
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Enquanto não sabemos o estado ou já aprovado definitivamente, não renderiza
  if (approved === null || approved) return null

  // Banner status 🟡 Pendente de Validação
  return (
    <div className="w-full min-w-0 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-white p-3.5 sm:p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="h-9 w-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldAlert className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <h3 className="font-bold text-sm text-amber-900 break-words">
                Conselho profissional em validação 🟡
              </h3>
              <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-[10px] shrink-0">
                <Clock className="h-3 w-3 mr-1" /> Pendente
              </Badge>
            </div>
            <p className="text-xs text-amber-800/90 mt-0.5 break-words leading-relaxed">
              Seu registro profissional está sendo validado pela clínica/secretaria. Você já pode
              usar o sistema com emissão flexível — a validação plena chega automaticamente (sino no
              header) quando aprovada.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center">
          <Badge
            variant="outline"
            className="border-amber-300 bg-white/70 text-amber-800 text-[10px] whitespace-normal text-center"
          >
            <CheckCircle2 className="h-3 w-3 mr-1 shrink-0" /> Emissão flexível ativa
          </Badge>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs border-amber-300 text-amber-900 hover:bg-amber-100 bg-white w-full sm:w-auto justify-center"
            onClick={() => {
              if (typeof window !== 'undefined') window.location.href = '/configuracoes'
            }}
          >
            Ver meus dados
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CouncilPendingBanner
