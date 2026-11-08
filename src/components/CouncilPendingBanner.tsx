import { useEffect, useState } from 'react'
import { ShieldAlert, CheckCircle2, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'

interface CouncilPendingBannerProps {
  userId: string
  /** Recarrega o estado direto do servidor (fallback fora do realtime) */
  onApprovedChange?: (approved: boolean) => void
}

/**
 * Banner "Conselho profissional em validação" — dashboard do médico.
 * Visível enquanto `council_approved` for false; some em tempo real
 * (realtime da coleção users) quando a clínica/secretaria aprova.
 * Integra-se ao checklist de onboarding como um lembrete de ativação.
 */
export function CouncilPendingBanner({ userId, onApprovedChange }: CouncilPendingBannerProps) {
  const [approved, setApproved] = useState<boolean | null>(null)

  // Estado inicial + polling leve de segurança (fallback se realtime falhar)
  useEffect(() => {
    let isMounted = true
    const load = () => {
      pb.collection('users')
        .getOne(userId)
        .then((rec: any) => {
          if (!isMounted) return
          setApproved(!!rec.council_approved)
          onApprovedChange?.(!!rec.council_approved)
        })
        .catch(() => {})
    }
    load()
    const interval = setInterval(load, 30000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [userId])

  // Tempo real: qualquer update em users (incluindo aprovação) reavalia
  useEffect(() => {
    let unsub: (() => Promise<void>) | undefined
    let cancelled = false

    pb.collection('users')
      .subscribe('*', (e: any) => {
        if (e?.record?.id !== userId) return
        const nowApproved = !!e.record.council_approved
        setApproved(nowApproved)
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

  // Enquanto não sabemos o estado, não renderiza nada (evita piscar)
  if (approved === null || approved) return null

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
                Conselho profissional em validação
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

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
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
