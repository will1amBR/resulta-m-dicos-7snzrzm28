import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  RotateCcw,
  Stethoscope,
  UserRound,
  CalendarPlus,
  MessageSquareText,
  X,
} from 'lucide-react'
import { pb } from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { getClinicAppointments, getClinicDoctors, getClinicPatients } from '@/services/clinic'
import { getWhatsAppQueue } from '@/services/whatsapp'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ClinicOnboardingStep {
  id: string
  title: string
  description: string
  href: string
  cta: string
  icon: React.ElementType
  done: boolean
}

/**
 * Guia de primeiro uso da clínica: checklist de etapas verificadas
 * automaticamente pelo progresso real dos dados (mesmo padrão do onboarding
 * do médico no dashboard). Pode ser recolhido, ocultado e restaurado depois.
 */
export function ClinicOnboardingGuide() {
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState<boolean | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [doctorsCount, setDoctorsCount] = useState<number | null>(null)
  const [patientsCount, setPatientsCount] = useState<number | null>(null)
  const [appointmentsCount, setAppointmentsCount] = useState<number | null>(null)
  const [whatsappUsageCount, setWhatsappUsageCount] = useState<number | null>(null)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    ;(async () => {
      try {
        const rec = await pb
          .collection('clinic_onboarding_dismissals')
          .getFirstListItem(`user="${user.id}"`)
        if (!cancelled) setDismissed(!!rec.get('dismissed'))
      } catch {
        if (!cancelled) setDismissed(false)
      }
    })()
    ;(async () => {
      const [docs, pats, appts, wq] = await Promise.all([
        getClinicDoctors().catch(() => []),
        getClinicPatients().catch(() => []),
        getClinicAppointments().catch(() => []),
        getWhatsAppQueue(1).catch(() => []),
      ])
      if (cancelled) return
      setDoctorsCount(docs.length)
      setPatientsCount(pats.length)
      setAppointmentsCount(appts.length)
      setWhatsappUsageCount(wq.length)
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const persistDismissed = async (value: boolean) => {
    if (!user?.id) return
    try {
      const existing = await pb
        .collection('clinic_onboarding_dismissals')
        .getFirstListItem(`user="${user.id}"`)
      await pb.collection('clinic_onboarding_dismissals').update(existing.id, {
        dismissed: value,
      })
    } catch {
      try {
        await pb.collection('clinic_onboarding_dismissals').create({
          user: user.id,
          dismissed: value,
        })
      } catch {
        /* silencioso: ocultação é preferência, não dado crítico */
      }
    }
  }

  const steps = useMemo<ClinicOnboardingStep[]>(() => {
    const profile = user as unknown as {
      clinic_name?: string
      cnpj?: string
      clinic_phone?: string
      clinic_address?: string
    }
    return [
      {
        id: 'perfil',
        title: 'Completar perfil institucional',
        description: 'Razão social, CNPJ e contatos da clínica.',
        href: '/clinic/configuracoes',
        cta: 'Completar perfil',
        icon: Building2,
        done: !!profile?.clinic_name && !!profile?.cnpj,
      },
      {
        id: 'medico',
        title: 'Convidar o primeiro médico',
        description: 'Monte a equipe e vincule profissionais ao conselho.',
        href: '/clinic/equipe',
        cta: 'Ver equipe',
        icon: Stethoscope,
        done: (doctorsCount ?? 0) > 0,
      },
      {
        id: 'paciente',
        title: 'Cadastrar o primeiro paciente',
        description: 'Adicione pacientes ao cadastro da clínica.',
        href: '/clinic/pacientes',
        cta: 'Cadastrar paciente',
        icon: UserRound,
        done: (patientsCount ?? 0) > 0,
      },
      {
        id: 'consulta',
        title: 'Agendar a primeira consulta',
        description: 'Crie um agendamento na agenda global.',
        href: '/clinic/agenda',
        cta: 'Abrir agenda',
        icon: CalendarPlus,
        done: (appointmentsCount ?? 0) > 0,
      },
      {
        id: 'whatsapp',
        title: 'Configurar templates do WhatsApp',
        description: 'Personalize mensagens de confirmação e lembrete no portal WhatsApp.',
        href: '/clinic/whatsapp',
        cta: 'Configurar WhatsApp',
        icon: MessageSquareText,
        done: (whatsappUsageCount ?? 0) > 0,
      },
    ]
  }, [user, doctorsCount, patientsCount, appointmentsCount, whatsappUsageCount])

  const doneCount = steps.filter((s) => s.done).length
  const progress = Math.round((doneCount / steps.length) * 100)
  const allDone = doneCount === steps.length

  // ---- Ocultado? Mostra apenas uma linha fina para restaurar ----
  if (dismissed) {
    return (
      <div className="flex justify-end">
        <button
          onClick={async () => {
            setRestoring(true)
            setDismissed(false)
            await persistDismissed(false)
            setRestoring(false)
          }}
          disabled={restoring}
          className="text-[11px] font-medium text-slate-500 hover:text-emerald-700 inline-flex items-center gap-1.5 min-h-[32px] px-2 rounded-md hover:bg-emerald-50 transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          Restaurar guia de primeiro uso
        </button>
      </div>
    )
  }

  return (
    <Card className="shadow-subtle border-slate-200 overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 to-white">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 break-words">
              <span className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              Guia de primeiro uso da clínica
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {allDone
                ? 'Tudo pronto! Sua clínica está totalmente configurada. 🎉'
                : `${doneCount} de ${steps.length} etapas concluídas — siga o checklist abaixo.`}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="h-8 w-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-500"
              aria-label={collapsed ? 'Expandir guia' : 'Recolher guia'}
            >
              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
            <button
              onClick={async () => {
                setDismissed(true)
                await persistDismissed(true)
              }}
              className="h-8 w-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-500"
              aria-label="Ocultar guia"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="px-4 sm:px-5 pt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Progresso
            </span>
            <span className="text-xs font-bold text-emerald-700">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-slate-100" />
        </div>

        {/* Steps */}
        {!collapsed && (
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {steps.map((step) => (
              <Link
                key={step.id}
                to={step.href}
                className={cn(
                  'group flex items-start gap-3 rounded-xl border p-3 transition-colors min-w-0',
                  step.done
                    ? 'border-emerald-200 bg-emerald-50/60'
                    : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30',
                )}
              >
                <span
                  className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                    step.done
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-700',
                  )}
                >
                  <step.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5 break-words">
                    {step.done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                    )}
                    <span className="truncate">{step.title}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug break-words">
                    {step.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mt-1.5">
                    {step.cta}
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {collapsed && (
          <div className="px-4 sm:px-5 py-3 flex items-center gap-2 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            Guia recolhido — clique na seta para expandir novamente.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
